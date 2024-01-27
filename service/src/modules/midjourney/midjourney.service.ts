import { UserEntity } from '../user/user.entity';
import { HttpException, HttpStatus, Inject, Injectable, Logger, Req } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MidjourneyEntity } from './midjourney.entity';
import { In, Repository } from 'typeorm';
import axios from 'axios';
import { GlobalConfigService } from '../globalConfig/globalConfig.service';
import { MidjourneyActionEnum, MidjourneyStatusEnum } from '@/common/constants/midjourney.constant';
import { UploadService } from '../upload/upload.service';
import { BadwordsService } from '../badwords/badwords.service';
import { Request } from 'express';
import { UserBalanceService } from '../userBalance/userBalance.service';
import { GetListDto } from './dto/getList.dto';
import { formatCreateOrUpdateDate } from '@/common/utils';
import { RedisClientType } from 'redis';
import { RedisCacheService } from '../redisCache/redisCache.service';
import { mjPromptEntity } from './prompt.entity';

@Injectable()
export class MidjourneyService {
  constructor(
    @InjectRepository(MidjourneyEntity)
    private readonly midjourneyEntity: Repository<MidjourneyEntity>,
    @InjectRepository(UserEntity)
    private readonly userEntity: Repository<UserEntity>,
    @InjectRepository(mjPromptEntity)
    private readonly mjPromptsEntity: Repository<mjPromptEntity>,
    private readonly globalConfigService: GlobalConfigService,
    private readonly uploadService: UploadService,
    private readonly badwordsService: BadwordsService,
    private readonly userBalanceService: UserBalanceService,
    private redisCacheService: RedisCacheService,
  ) {}

  
  private lockPrompt = [];

  /* 睡眠 xs */
  async sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  async draw(jobData, jobId) {
    const { id, action } = jobData;
    const drawInfo = await this.midjourneyEntity.findOne({ where: { id } });
    try {
      /* 把任务ID绑定到DB去 */
      await this.bindJobId(id, jobId);
      /* 修改绘画记录状态为绘制中 */
      await this.updateDrawStatus(id, MidjourneyStatusEnum.DRAWING);

      /* 绘制图片 | 图生图 */
      if (action === MidjourneyActionEnum.DRAW || action === MidjourneyActionEnum.GENERATE) {
        await this.sendDrawCommand(drawInfo, jobData);
        /* 开始执行检测逻辑 */
        const drawRes = await this.pollComparisonResultDraw(drawInfo);
        /* 把所有绘制记录存入 */
        await this.updateDrawData(jobData, drawRes);
      }

      /* 放大图片 */
      if (action === MidjourneyActionEnum.UPSCALE) {
        const { message_id, custom_id } = drawInfo;
        await this.sendSmInteractions({ message_id, custom_id }, jobData);
        Logger.debug(`记录${id}已经成功发送了图片放大指令`, 'MidjourneyService');
        /* 开始执行检测逻辑 */
        const drawRes = await this.pollComparisonResultUpscale(drawInfo);
        await this.updateDrawData(jobData, drawRes);
      }

      /* 变体图片 */
      if (action === MidjourneyActionEnum.VARIATION) {
        const { message_id, custom_id } = drawInfo;
        await this.sendSmInteractions({ message_id, custom_id }, jobData);
        Logger.debug(`记录${id}已经成功发送了图片变化指令`, 'MidjourneyService');
        /* 开始执行检测逻辑 */
        const drawRes = await this.pollComparisonResultVariation(drawInfo);
        await this.updateDrawData(jobData, drawRes);
        /* 存完解锁当前文件 */
        this.lockPrompt = this.lockPrompt.filter((item) => item !== drawInfo.randomDrawId);
      }

      /* 重新绘制一次 */
      if (action === MidjourneyActionEnum.REGENERATE) {
        const { message_id, custom_id } = drawInfo;
        await this.sendReGenerateInteractions({ message_id, custom_id }, jobData);
        Logger.debug(`记录${id}已经成功发送了重新生成图片指令`, 'MidjourneyService');
        const drawRes = await this.pollComparisonResultReGenerate(drawInfo);
        await this.updateDrawData(jobData, drawRes);
        /* 存完解锁当前文件 */
        this.lockPrompt = this.lockPrompt.filter((item) => item !== drawInfo.randomDrawId);
      }

      /* 对图片增强  Vary */
      if (action === MidjourneyActionEnum.VARY) {
        const { message_id, custom_id } = drawInfo;
        await this.sendVaryInteractions({ message_id, custom_id }, jobData);
        Logger.debug(`记录${id}已经成功发送单张图片增强指令`, 'MidjourneyService');
        const drawRes = await this.pollComparisonResultVary(drawInfo);
        await this.updateDrawData(jobData, drawRes);
        /* 存完解锁当前文件 */
        this.lockPrompt = this.lockPrompt.filter((item) => item !== drawInfo.randomDrawId);
      }

      /* 对图片缩放  Zoom */
      if (action === MidjourneyActionEnum.ZOOM) {
        const { message_id, custom_id } = drawInfo;
        await this.sendZoomInteractions({ message_id, custom_id }, jobData);
        Logger.debug(`记录${id}已经成功发送单张图片缩放指令`, 'MidjourneyService');
        const drawRes = await this.pollComparisonResultZoom(drawInfo);
        await this.updateDrawData(jobData, drawRes);
        /* 存完解锁当前文件 */
        this.lockPrompt = this.lockPrompt.filter((item) => item !== drawInfo.randomDrawId);
      }

      return true;
    } catch (error) {
      this.lockPrompt = this.lockPrompt.filter((item) => item !== drawInfo.randomDrawId);
      await this.drawFailed(jobData);
      console.log('error: ', error);
      return true;
    }
  }

  /* 绘制图片 */
  /* 放大图片 */
  /* 变体图片 */

  /* 添加一条等待中的绘制任务 */
  async addDrawQueue(params) {
    const { prompt, imgUrl = '', extraParam = '', action = 1, userId, randomDrawId, orderId, custom_id, message_id } = params;
    const fullPrompt = imgUrl ? `${imgUrl} ${prompt} ${extraParam}` : `${prompt} ${extraParam}`;
    /* 敏感词检测 */
    await this.badwordsService.checkBadWords(fullPrompt, userId);
    const drawInfo = {
      userId,
      extraParam,
      prompt,
      imgUrl,
      fullPrompt,
      randomDrawId,
      status: MidjourneyStatusEnum.WAITING,
      action: action,
      orderId,
      custom_id,
      message_id,
    };
    const res = await this.midjourneyEntity.save(drawInfo);
    return res;
  }

  /* 修改绘制记录状态 */
  async updateDrawStatus(id, status) {
    await this.midjourneyEntity.update({ id }, { status });
  }

  /* 绘制完成后修改数据 */
  async updateDrawData(jobData, drawRes) {
    try {
      const { id, content, channel_id, attachments = [], timestamp, durationSpent } = drawRes;
      const { filename, url, proxy_url, width, height, size } = attachments[0];
      /* 将图片存入cos */
      const mjNotSaveImg = await this.globalConfigService.getConfigs(['mjNotSaveImg'])
      let cosUrl = ''
      if(!Number(mjNotSaveImg) || Number(mjNotSaveImg) === 0){
        Logger.debug(`------> 开始上传图片！！！`, 'MidjourneyService');
        const startDate = new Date();
        cosUrl = await this.uploadService.uploadFileFromUrl({ filename, url });
        const endDate = new Date();
        Logger.debug(`本次图片上传耗时为${(endDate.getTime() - startDate.getTime()) / 1000}秒`, 'MidjourneyService');
      }else{
        console.log('本次不存图片了')
      }
      /* 记录当前图片存储方式 方便后续对不同平台图片压缩 */
      const cosType = await this.uploadService.getUploadType();
      /* 整理信息 存入DB */
      const drawInfo = {
        status: MidjourneyStatusEnum.DRAWED,
        message_id: id,
        progress: 100,
        fileInfo: JSON.stringify({ width, height, size, filename, cosUrl, cosType }),
        extend: this.removeEmoji(JSON.stringify(drawRes)),
        durationSpent,
        isSaveImg:  !Number(mjNotSaveImg) || Number(mjNotSaveImg) === 0,
      };
      await this.midjourneyEntity.update({ id: jobData.id }, drawInfo);
    } catch (error) {
      console.log('TODO->存储图片失败, ', jobData,error);
    }
  }

  /* 获取到当前ID的历史已经存入的信息并且绘制完成的 防止已经存过的图又被存了 */
  async getHistroyMessageIds(randomDrawId) {
    const res = await this.midjourneyEntity.find({ where: { randomDrawId, status: MidjourneyStatusEnum.DRAWED } });
    return res.map((item: any) => item.message_id);
  }

  /* 发送绘画指令 */
  async sendDrawCommand(drawInfo, jobData) {
    const { fullPrompt, randomDrawId, imgUrl } = drawInfo;
    const prompt = imgUrl ? `[${randomDrawId}] ${imgUrl} ${fullPrompt}` : `[${randomDrawId}] ${fullPrompt}`;
    Logger.debug(`本次绘图指令为${prompt}`, 'MidjourneyService');

    const { application_id, guild_id, channel_id, session_id, version, id, authorization, mjProxy } = await this.getMjDefaultParams();
    const payloadJson = {
      type: 2,
      application_id,
      guild_id,
      channel_id,
      session_id,
      data: { version, id, name: 'imagine', type: 1, options: [{ type: 3, name: 'prompt', value: prompt }], attachments: [] },
    };
    try {
      const mjProxyUrl = (await this.globalConfigService.getConfigs(['mjProxyUrl'])) || 'http://172.247.48.137:8000';
      const url = mjProxy == 1 ? `${mjProxyUrl}/mj/draw` : 'https://discord.com/api/v9/interactions';
      const headers = { authorization };
      const res = await axios.post(url, payloadJson, { headers });
      return false;
    } catch (error) {
      Logger.error(`发送绘画指令失败`, 'MidjourneyService');
      throw new HttpException('发送绘图指令失败、请联系管理员检测绘画配置！', HttpStatus.BAD_REQUEST);
    }
  }

  /* 发送放大变幻指令 */
  async sendSmInteractions(params, jobData) {
    const { message_id, custom_id } = params;
    const { application_id, guild_id, channel_id, session_id, version, id, authorization, mjProxy } = await this.getMjDefaultParams();
    const mjProxyUrl = (await this.globalConfigService.getConfigs(['mjProxyUrl'])) || 'http://172.247.48.137:8000';
    const url = mjProxy == 1 ? `${mjProxyUrl}/mj/draw` : 'https://discord.com/api/v9/interactions';
    const headers = { authorization };
    const body = {
      type: 3,
      guild_id,
      channel_id,
      message_flags: 0,
      message_id,
      application_id,
      session_id,
      data: {
        component_type: 2,
        custom_id,
      },
    };
    try {
      await axios.post(url, body, { headers });
    } catch (error) {
      console.log('发送放大变幻指令失败: ', error);
      Logger.error(`发送放大变幻指令失败`, 'MidjourneyService');
      throw new HttpException('对图片放大变幻失败...', HttpStatus.BAD_REQUEST);
    }
  }

  /* 发送重新生成指令 很多类似 暂时分开处理 防止改动 */
  async sendReGenerateInteractions(params, jobData) {
    const { message_id, custom_id } = params;
    const { application_id, guild_id, channel_id, session_id, version, id, authorization, mjProxy } = await this.getMjDefaultParams();
    const mjProxyUrl = (await this.globalConfigService.getConfigs(['mjProxyUrl'])) || 'http://172.247.48.137:8000';
    const url = mjProxy == 1 ? `${mjProxyUrl}/mj/draw` : 'https://discord.com/api/v9/interactions';
    const headers = { authorization };
    const body = {
      type: 3,
      guild_id,
      channel_id,
      message_id,
      application_id,
      session_id,
      data: {
        component_type: 2,
        custom_id,
      },
    };
    try {
      await axios.post(url, body, { headers });
    } catch (error) {
      console.log('发送重新生成指令失败: ', error);
      Logger.error(`发送放大变幻指令失败`, 'MidjourneyService');
      throw new HttpException('对图片放大变幻失败...', HttpStatus.BAD_REQUEST);
    }
  }

  /* 发送图片增强指令 */
  async sendVaryInteractions(params, jobData) {
    const { message_id, custom_id } = params;
    const { application_id, guild_id, channel_id, session_id, version, id, authorization, mjProxy } = await this.getMjDefaultParams();
    const mjProxyUrl = (await this.globalConfigService.getConfigs(['mjProxyUrl'])) || 'http://172.247.48.137:8000';
    const url = mjProxy == 1 ? `${mjProxyUrl}/mj/draw` : 'https://discord.com/api/v9/interactions';
    const headers = { authorization };
    const body = {
      type: 3,
      guild_id,
      channel_id,
      message_id,
      application_id,
      session_id,
      data: {
        component_type: 2,
        custom_id,
      },
    };
    try {
      await axios.post(url, body, { headers });
    } catch (error) {
      console.log('发送对单张图片增强指令失败: ', error);
      Logger.error(`发送单张图片增强指令失败`, 'MidjourneyService');
      throw new HttpException('对图片单张增强失败...', HttpStatus.BAD_REQUEST);
    }
  }

  /* 发送单张图片缩放指令 */
  async sendZoomInteractions(params, jobData) {
    const { message_id, custom_id } = params;
    const { application_id, guild_id, channel_id, session_id, version, id, authorization, mjProxy } = await this.getMjDefaultParams();
    const mjProxyUrl = (await this.globalConfigService.getConfigs(['mjProxyUrl'])) || 'http://172.247.48.137:8000';
    const url = mjProxy == 1 ? `${mjProxyUrl}/mj/draw` : 'https://discord.com/api/v9/interactions';
    const headers = { authorization };
    const body = {
      type: 3,
      guild_id,
      channel_id,
      message_id,
      application_id,
      session_id,
      data: {
        component_type: 2,
        custom_id,
      },
    };
    try {
      await axios.post(url, body, { headers });
    } catch (error) {
      console.log('发送对单张图片增强指令失败: ', error);
      Logger.error(`发送单张图片增强指令失败`, 'MidjourneyService');
      throw new HttpException('对图片单张增强失败...', HttpStatus.BAD_REQUEST);
    }
  }

  /* 轮询比对绘画结果 */
  async pollComparisonResultDraw(drawInfo) {
    Logger.debug(`开始查询绘画结果`, 'MidjourneyService');
    const startTime = Date.now();
    const INTERVAL_BEFORE_90S = 10000; // 0s-90s之间每十秒查一次
    const INTERVAL_AFTER_90S = 30000; // 90s之后每30秒查一次
    const timeout = (await this.globalConfigService.getConfigs(['mjTimeoutMs'])) || 150000; // 超时时间 150秒
    const TIMEOUT = timeout;
    let pollingCount = 0; // 记录轮询次数
    let drawRes = null;
    let isMatchSuccessful = false;
    try {
      while (!isMatchSuccessful && Date.now() - startTime < TIMEOUT) {
        let interval;
        if (Date.now() - startTime < 90000) {
          interval = INTERVAL_BEFORE_90S;
        } else {
          interval = INTERVAL_AFTER_90S;
        }
        await this.sleep(interval);
        Logger.debug(`【绘制图片】第 ${pollingCount + 1} 次开始查询`, 'MidjourneyService');
        drawRes = await this.findCurrentPromptResult(drawInfo.randomDrawId);
        if (drawRes) {
          const { content } = drawRes;
          const progress = await this.parseProgress(content);
          Logger.debug(`【绘制图片】第 ${pollingCount + 1} 次、 当前绘画进度为${progress}%`, 'MidjourneyService');
          /* TODO 实时去改变db记录当前解结果  更多信息是否存储 待考虑 */
          await this.midjourneyEntity.update({ id: drawInfo.id }, { progress: progress ?? 100 });
        }
        /* 比对是否绘制完成 */
        isMatchSuccessful = drawRes && !drawRes.edited_timestamp;
        pollingCount++;
      }
      if (!drawRes) {
        await this.updateDrawStatus(drawInfo.id, MidjourneyStatusEnum.DRAWTIMEOUT);
        throw new HttpException('绘画超时，请稍后再试！', HttpStatus.BAD_REQUEST);
      }

      const endTime = Date.now();
      return { ...drawRes, durationSpent: Math.floor((endTime - startTime) / 1000) };
    } catch (error) {
      console.log('获取图片列表结果失败: ', error);
    }
  }

  /* 轮询比对拿到放大图片 */
  async pollComparisonResultUpscale(drawInfo) {
    Logger.debug(`开始查询放大图片信息`, 'MidjourneyService');
    const startTime = Date.now();
    const { message_id, custom_id, randomDrawId, orderId } = drawInfo;
    let enlargeImgDetail = null;
    let pollingCount = 0;
    while (!enlargeImgDetail && pollingCount < 10) {
      Logger.debug(`开始比对放大图片第${pollingCount + 1}次`, 'MidjourneyService');
      enlargeImgDetail = await this.findCurrentEnlargeImgResult(randomDrawId, orderId);
      await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * (5000 - 3000 + 1)) + 3000));
      pollingCount++;
    }

    if (!enlargeImgDetail) {
      await this.updateDrawStatus(drawInfo.id, MidjourneyStatusEnum.DRAWTIMEOUT);
      throw new HttpException('放大图片超时，请稍后再试！', HttpStatus.BAD_REQUEST);
    }
    const endTime = Date.now();
    return { ...enlargeImgDetail, durationSpent: Math.floor((endTime - startTime) / 1000) };
  }

  /* 轮询比对拿到重新绘制的那张图 */
  async pollComparisonResultReGenerate(drawInfo) {
    Logger.debug(`开始查询重复绘制的图片信息`, 'MidjourneyService');
    const TIMEOUT = (await this.globalConfigService.getConfigs(['mjTimeoutMs'])) || 150000; // 超时时间 150秒
    const startTime = Date.now();
    const { message_id, custom_id, randomDrawId, orderId } = drawInfo;
    let reGenerateImgDetail = null;
    let pollingTime = 0;
    let count = 0;
    while (!reGenerateImgDetail && pollingTime < TIMEOUT) {
      Logger.debug(`开始比对重新绘制图片第${count + 1}次`, 'MidjourneyService');
      reGenerateImgDetail = await this.findCurrentReGenerateImgResult(randomDrawId, message_id);
      const t = Math.floor(Math.random() * (5000 - 3000 + 1)) + 8000;
      await new Promise((resolve) => setTimeout(resolve, t));
      pollingTime += t;
      count++;
    }

    if (!reGenerateImgDetail) {
      await this.updateDrawStatus(drawInfo.id, MidjourneyStatusEnum.DRAWTIMEOUT);
      throw new HttpException('重新绘制图片超时，请稍后再试！', HttpStatus.BAD_REQUEST);
    }
    const endTime = Date.now();
    return { ...reGenerateImgDetail, durationSpent: Math.floor((endTime - startTime) / 1000) };
  }

  /* 对单张图片增强 */
  async pollComparisonResultVary(drawInfo) {
    Logger.debug(`开始查询单张图片增强的图片信息`, 'MidjourneyService');
    const TIMEOUT = (await this.globalConfigService.getConfigs(['mjTimeoutMs'])) || 150000; // 超时时间 150秒
    const startTime = Date.now();
    const { message_id, custom_id, randomDrawId, orderId } = drawInfo;
    let varyImgDetail = null;
    let pollingTime = 0;
    let count = 0;
    while (!varyImgDetail && pollingTime < TIMEOUT) {
      Logger.debug(`开始单张图片增强第${count + 1}次`, 'MidjourneyService');
      varyImgDetail = await this.findCurrentVaryImgResult(randomDrawId, message_id);
      const t = Math.floor(Math.random() * (5000 - 3000 + 1)) + 8000;
      await new Promise((resolve) => setTimeout(resolve, t));
      pollingTime += t;
      count++;
    }

    if (!varyImgDetail) {
      await this.updateDrawStatus(drawInfo.id, MidjourneyStatusEnum.DRAWTIMEOUT);
      throw new HttpException('单张图片增强超时，请稍后再试！', HttpStatus.BAD_REQUEST);
    }
    const endTime = Date.now();
    return { ...varyImgDetail, durationSpent: Math.floor((endTime - startTime) / 1000) };
  }

  /* 对单张图片缩放 */
  async pollComparisonResultZoom(drawInfo) {
    Logger.debug(`开始查询单张图片缩放的图片信息`, 'MidjourneyService');
    const TIMEOUT = (await this.globalConfigService.getConfigs(['mjTimeoutMs'])) || 150000; // 超时时间 150秒
    const startTime = Date.now();
    const { message_id, custom_id, randomDrawId, orderId } = drawInfo;
    let zoomImgDetail = null;
    let pollingTime = 0;
    let count = 0;
    while (!zoomImgDetail && pollingTime < TIMEOUT) {
      Logger.debug(`开始单张图片缩放第${count + 1}次`, 'MidjourneyService');
      zoomImgDetail = await this.findCurrentZoomImgResult(randomDrawId, message_id);
      const t = Math.floor(Math.random() * (5000 - 3000 + 1)) + 8000;
      await new Promise((resolve) => setTimeout(resolve, t));
      pollingTime += t;
      count++;
    }

    if (!zoomImgDetail) {
      await this.updateDrawStatus(drawInfo.id, MidjourneyStatusEnum.DRAWTIMEOUT);
      throw new HttpException('单张图片缩放超时，请稍后再试！', HttpStatus.BAD_REQUEST);
    }
    const endTime = Date.now();
    return { ...zoomImgDetail, durationSpent: Math.floor((endTime - startTime) / 1000) };
  }

  /* 轮询比对拿到变体图片 */
  async pollComparisonResultVariation(drawInfo) {
    Logger.debug(`开始轮询单张变换图片结果`, 'MidjourneyService');
    let variationImgDetail = null;
    const startTime = Date.now();
    while (!variationImgDetail) {
      Logger.debug(`变换图片获取中------>`, 'MidjourneyService');
      variationImgDetail = await this.findCurrentVariationImgResult(drawInfo.randomDrawId);
      const nextPollingDelay = 10000; // 每10秒轮询一次
      await this.sleep(nextPollingDelay);

      const endTime = Date.now();
      const durationSpent = Math.floor(endTime - startTime);
      const timeout = (await this.globalConfigService.getConfigs(['mjTimeoutMs'])) || 150000; // 超时时间 150秒
      const TIMEOUT = timeout;

      if (durationSpent >= TIMEOUT) {
        await this.updateDrawStatus(drawInfo.id, MidjourneyStatusEnum.DRAWTIMEOUT);
        throw new HttpException('变换当前图片超时！', HttpStatus.BAD_REQUEST);
      }
    }
    return { ...variationImgDetail, durationSpent: Math.floor(Date.now() - startTime) };
  }

  /* 比对找到放大图片的地址作为返回结果 */
  async findCurrentEnlargeImgResult(randomDrawId, orderId) {
    const messageList = await this.getMessageList();
    const histroyMessageIds = await this.getHistroyMessageIds(randomDrawId);
    const enlargeImgDetail = messageList.find((item) => {
      const { content } = item;
      if (!this.extractContent(content)) return false;
      const { prompt, order } = this.extractContent(content);
      return content.includes(randomDrawId) && orderId === order && !histroyMessageIds.includes(item.id);
    });
    return enlargeImgDetail;
  }

  /* 比对拿到变体图片 */
  async findCurrentVariationImgResult(randomDrawId) {
    const messageList = await this.getMessageList();
    const histroyMessageIds = await this.getHistroyMessageIds(randomDrawId);
    const variationImgDetail = messageList.find((item) => {
      const { content } = item;
      return content.includes(randomDrawId) && !histroyMessageIds.includes(item.id) && this.isVariationsImage(content);
    });

    /* 如果有一个人拿到 那么进入锁定模式 当前的图片变体别人不能再拿  等我存完 你再进来匹配 */
    if (variationImgDetail) {
      if (this.lockPrompt.includes(randomDrawId)) {
        Logger.debug(`【变体图片】当前图片已经被锁定，等待同任务完成`, 'MidjourneyService');
        return null;
      } else {
        this.lockPrompt.push(randomDrawId);
      }
    }
    return variationImgDetail;
  }

  /* 匹配拿到重新生成的图片, 重新生成的图  message_id 变了 所以对比需要排除message_id */
  async findCurrentReGenerateImgResult(randomDrawId, message_id) {
    const messageList = await this.getMessageList();
    const histroyMessageIds = await this.getHistroyMessageIds(randomDrawId);
    const reGenerateImgDetail = messageList.find((item) => {
      const { content } = item;
      // message_reference 重新绘制的多一个字段 这个就是原始图片的message_id
      return content.includes(randomDrawId) && !histroyMessageIds.includes(item.id) && item.id !== message_id && this.isReGenerateImage(content);
    });

    /* 如果有一个人拿到 那么进入锁定模式 当前的图片变体别人不能再拿  等我存完 你再进来匹配 */
    if (reGenerateImgDetail) {
      if (this.lockPrompt.includes(randomDrawId)) {
        Logger.debug(`【重新生成图片】当前图片已经被锁定，等待同任务完成`, 'MidjourneyService');
        return null;
      } else {
        this.lockPrompt.push(randomDrawId);
      }
    }
    return reGenerateImgDetail;
  }

  /* 匹配缩放图 */
  async findCurrentZoomImgResult(randomDrawId, message_id) {
    const messageList = await this.getMessageList();
    const histroyMessageIds = await this.getHistroyMessageIds(randomDrawId);
    const reGenerateImgDetail = messageList.find((item) => {
      const { content } = item;
      // message_reference 重新绘制的多一个字段 这个就是原始图片的message_id
      return content.includes(randomDrawId) && !histroyMessageIds.includes(item.id) && item.id !== message_id && this.isZoomImage(content);
    });

    /* 如果有一个人拿到 那么进入锁定模式 当前的图片变体别人不能再拿  等我存完 你再进来匹配 */
    if (reGenerateImgDetail) {
      if (this.lockPrompt.includes(randomDrawId)) {
        Logger.debug(`【重新生成图片】当前图片已经被锁定，等待同任务完成`, 'MidjourneyService');
        return null;
      } else {
        this.lockPrompt.push(randomDrawId);
      }
    }
    return reGenerateImgDetail;
  }

  /* 匹配拿图 单张生成图 */
  async findCurrentVaryImgResult(randomDrawId, message_id) {
    const messageList = await this.getMessageList();
    const histroyMessageIds = await this.getHistroyMessageIds(randomDrawId);
    const varyImgDetail = messageList.find((item) => {
      const { content } = item;
      // message_reference 重新绘制的多一个字段 这个就是原始图片的message_id
      return content.includes(randomDrawId) && !histroyMessageIds.includes(item.id) && item.id !== message_id && this.isVaryImage(content);
    });

    /* 如果有一个人拿到 那么进入锁定模式 当前的图片变体别人不能再拿  等我存完 你再进来匹配 */
    if (varyImgDetail) {
      if (this.lockPrompt.includes(randomDrawId)) {
        Logger.debug(`【单张图片增强】当前图片已经被锁定，等待同任务完成`, 'MidjourneyService');
        return null;
      } else {
        this.lockPrompt.push(randomDrawId);
      }
    }
    return varyImgDetail;
  }

  /* 匹配放大的单张图片的操作 */
  extractContent(str: string): { prompt: string; order: number } | null {
    const promptMatch = str.match(/\*\*(.+?)\*\*/);
    const orderMatch = str.match(/- Image #(\d+)/);
    if (!promptMatch || !orderMatch) {
      return null;
    }
    const prompt = promptMatch[1];
    const order = parseInt(orderMatch[1]);
    return { prompt, order };
  }

  /* 比对当前列表中是否存在我们正在绘制的图片 histroyMessageIds是历史相同prompt生成的  有的话排除这些 */
  async findCurrentPromptResult(randomDrawId) {
    const histroyMessageIds = await this.getHistroyMessageIds(randomDrawId);
    const messageList = await this.getMessageList();
    if (!messageList || !messageList.length) return;
    const matchingItem = messageList.find((item) => {
      const { attachments = [], content, edited_timestamp } = item;
      // 如果这个参数有值 edited_timestamp 就说明在绘画中 返回结果但是不算结束 其他比对逻辑： content绘画词包含我们的randomDrawId 并且attachments是有值的 其实包含的这个图是我们之前没存入db的
      return content.includes(randomDrawId) && attachments.length > 0 && !histroyMessageIds.includes(item?.id);
    });
    return matchingItem || null;
  }

  /* 判断是否是变体图片 */
  isVariationsImage(str) {
    const regex = /- Variations/;
    return regex.test(str);
  }

  /* 判读是否是单张图片从而 */
  isSingleImage(str) {
    const regex = /Image #\d+/;
    return regex.test(str);
  }

  /* 判断是否不是变体或者放大、防止拿图的时候 重新生成匹配到了变体或者 放大 */
  isReGenerateImage(str) {
    return !this.isVariationsImage(str) && !this.isSingleImage(str);
  }

  /* 判断是不是增强的图 */
  isVaryImage(str) {
    const regex = /- Variations \(.*?\)/;
    return regex.test(str);
  }

  /* 判断是不是缩放图 */
  isZoomImage(str) {
    const regex = /- Zoom Out/;
    return regex.test(str);
  }

  /* 获取Mj参数 */
  async getMjDefaultParams() {
    const configs = await this.globalConfigService.getConfigs([
      'mjId',
      'mjApplicationId',
      'mjGuildId',
      'mjChannelId',
      'mjSessionId',
      'mjVersion',
      'mjAuthorization',
      'mjRateLimit',
      'mjProxy',
    ]);
    const params = {
      application_id: configs.mjApplicationId,
      guild_id: configs.mjGuildId,
      channel_id: configs.mjChannelId,
      session_id: configs.mjSessionId,
      version: configs.mjVersion,
      id: configs.mjId,
      authorization: configs.mjAuthorization,
      mjRateLimit: configs.mjRateLimit,
      mjProxy: configs.mjProxy || 0,
    };
    return params;
  }

  /* 查询绘画的所有列表 */
  async getMessageList() {
    try {
      const { application_id, guild_id, channel_id, session_id, version, id, authorization, mjProxy } = await this.getMjDefaultParams();
      const mjProxyUrl = (await this.globalConfigService.getConfigs(['mjProxyUrl'])) || 'http://172.247.48.137:8000';
      const url =
        mjProxy == 1 ? `${mjProxyUrl}/mj/list?channel_id=${channel_id}` : `https://discord.com/api/v9/channels/${channel_id}/messages?limit=50`;
      const headers = { authorization };
      const response = await axios.get(url, { headers });
      return response.data;
    } catch (error) {
      Logger.error('查询绘制结果失败: getMessageList', error, 'MidjourneyService');
      return [];
    }
  }

  /* 通过content拿到百分比进度 */
  parseProgress(content) {
    const regex = /\((\d+)%\)/;
    const match = content.match(regex);

    if (match) {
      return parseInt(match[1], 10);
    } else {
      return null;
    }
  }

  /* 去除字符串表情 防止低版本数据库存入失败 */
  removeEmoji(str) {
    const regex = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
    return str.replace(regex, '');
  }

  /* 绑定jobId到绘画记录 */
  async bindJobId(id, jobId) {
    await this.midjourneyEntity.update({ id }, { jobId });
  }

  /* 获取我的绘制列表 */
  async getDrawList(req: Request, params) {
    try {
      const { page = 1, size = 30 } = params;
      const [rows, count] = await this.midjourneyEntity.findAndCount({
        where: { userId: req.user.id, isDelete: 0 },
        order: { id: 'DESC' },
        take: size,
        skip: (page - 1) * size,
      });
      const mjProxyImgUrl = await this.globalConfigService.getConfigs(['mjProxyImgUrl'])
      rows.forEach((item: any) => {
        try {
          const { extend, isSaveImg, fileInfo } = item;
          const originUrl = JSON.parse(extend)?.attachments[0]?.url
          item.fileInfo = this.formatFileInfo(fileInfo, isSaveImg, mjProxyImgUrl, originUrl);
          item.isGroup = JSON.parse(extend)?.components[0]?.components[0].label === "U1";
          item.originUrl = originUrl
        } catch (error) {
          
        }
      });
      const countQueue = await this.midjourneyEntity.count({ where: { isDelete: 0, status: In([1, 2]) } });
      const data: any = { rows: formatCreateOrUpdateDate(rows), count, countQueue };
      return data;
    } catch (error) {
      throw new HttpException('获取我得绘制列表失败', HttpStatus.BAD_REQUEST);
    }
  }

  /* 格式化fileinfo  对于不同平台的图片进行压缩 */
  formatFileInfo(fileInfo, isSaveImg,  mjProxyImgUrl, originUrl) {
    if (!fileInfo) return {};
    let parseFileInfo: any = null
    try {
      parseFileInfo = JSON.parse(fileInfo);
    } catch (error) {
      parseFileInfo = null
    }
    if(!parseFileInfo) return;
    const { url, filename, size, cosUrl, width, height } = parseFileInfo;
    const targetSize = 310; // 目标宽度或高度
    
    // TODO判断逻辑有误 腾讯云会导致也判断为 chevereto  更换判断规则
    const imgType = cosUrl.includes('cos') ? 'tencent' : cosUrl.includes('oss') ? 'ali' : 'chevereto';
    let compress;
    let thumbImg;
    if (imgType === 'tencent') {
      const ratio = width / height;
      const targetHeight = Math.round(targetSize / ratio); // 计算目标高度
      thumbImg = cosUrl + `?imageView2/1/w/${targetSize}/h/${targetHeight}/q/55`;
    }
    if (imgType === 'ali') {
      const ratio = height / width;
      const targetWidth = Math.round(targetSize / ratio); // 计算目标宽度
      thumbImg = cosUrl + `?x-oss-process=image/resize,w_${targetWidth}`;
    }
    if (imgType === 'chevereto') {
      thumbImg = cosUrl.replace(/\.png$/, '.md.png');
    }
    parseFileInfo.thumbImg = thumbImg;
    /* 如果配置了不存储图片 则 isSaceImg 为false的则需要使用反代地址拼接 */
    if(!isSaveImg){
      const proxyImgUrl = `${mjProxyImgUrl}/mj/pipe?url=${originUrl}`
      parseFileInfo.thumbImg = proxyImgUrl
      parseFileInfo.cosUrl = proxyImgUrl
    }
    return parseFileInfo;
  }

  /* 变体或者放大的时候去获取需要的信息 */
  async getDrawActionDetail(action, drawId, orderId) {
    const detailInfo = await this.midjourneyEntity.findOne({ where: { id: drawId } });
    if (!detailInfo) throw new HttpException('当前绘画信息不存在！', HttpStatus.BAD_REQUEST);
    const { extend, message_id, prompt, imgUrl, extraParam, randomDrawId } = detailInfo;
    const historyDetailDrawInfo = JSON.parse(extend);
    const { components = [] } = historyDetailDrawInfo;
    if (!components.length) {
      throw new HttpException('当前图片没有绘画信息、无法放大!', HttpStatus.BAD_REQUEST);
    }
    /* 对于四张图组图这种 components数组 第一项 有五个数据 分别对应1-4的图片所需参数和重新绘制参数 5对应重新绘制  第二项则是对应变换的四张图  */
    let currentImgComponent: any = {};
    if (action === MidjourneyActionEnum.UPSCALE) {
      currentImgComponent = components[0]['components'][orderId - 1];
    }
    if (action === MidjourneyActionEnum.VARIATION) {
      currentImgComponent = components[1]['components'][orderId - 1];
    }
    if (action === MidjourneyActionEnum.REGENERATE) {
      currentImgComponent = components[0]['components'][orderId - 1];
    }
    /* 对于单张图来说 components数组 第一项 有两个 分别对应 Vary (Strong) Vary (Subtle) 第二项则是 Zoom Out 2x | Zoom Out 1.5x | custom */
    if (action === MidjourneyActionEnum.VARY) {
      currentImgComponent = components[0]['components'][orderId - 1];
    }
    if (action === MidjourneyActionEnum.ZOOM) {
      currentImgComponent = components[1]['components'][orderId - 1];
    }
    const { custom_id } = currentImgComponent;
    return { custom_id, message_id, prompt, imgUrl, extraParam, randomDrawId };
  }

  /* 检测当前图片是否已经放大过了 */
  async checkIsUpscale(custom_id) {
    // 查看count是不是大于0就行
    const count = await this.midjourneyEntity.count({ where: { custom_id, status: MidjourneyStatusEnum.DRAWED } });
    if (count > 0) {
      throw new HttpException('当前图片已经放大过了！', HttpStatus.BAD_REQUEST);
    }
  }

  /* 删除图片 */
  async deleteDraw(id: number, req: Request) {
    const d = await this.midjourneyEntity.findOne({ where: { id, userId: req.user.id, isDelete: 0 } });
    if (!d) {
      throw new HttpException('当前图片不存在！', HttpStatus.BAD_REQUEST);
    }
    if (d.status === 2) {
      throw new HttpException('绘制中的图片任务、禁止删除！', HttpStatus.BAD_REQUEST);
    }
    const res = await this.midjourneyEntity.update({ id }, { isDelete: 1 });
    if (res.affected > 0) {
      return '删除成功！';
    } else {
      throw new HttpException('删除失败！', HttpStatus.BAD_REQUEST);
    }
  }

  /* 限制同时最多两个任务进行中 */
  async checkLimit(req: Request) {
    const { role, id } = req.user;
    // if (['super', 'admin'].includes(role)) {
    //   return;
    // }
    const count = await this.midjourneyEntity.count({ where: { userId: id, isDelete: 0, status: In([1, 2]) } });
    const mjLimitCount = await this.globalConfigService.getConfigs(['mjLimitCount'])
    const max = mjLimitCount ? Number(mjLimitCount) : 2
    if (count >= max) {
      throw new HttpException(`当前管理员限制单用户同时最多能执行${max}个任务`, HttpStatus.BAD_REQUEST);
    }
  }

  /* 队列回调绘图失败时候 */
  async drawFailed(jobData) {
    const { id, userId, action } = jobData;
    /* 退还余额 放大图片（类型2）是1  其他都是4 */
    const amount = action === 2 ? 1 : 4;
    await this.userBalanceService.refundMjBalance(userId, amount);
    await this.midjourneyEntity.update({ id }, { status: 4 });
  }

  /* 获取绘画列表  */
  async getList(params: GetListDto) {
    const { page = 1, size = 20, rec, userId, status } = params;

    /* 客户端查询走缓存 */
    if (Number(size) === 999) {
      const cache = await this.redisCacheService.get({ key: 'midjourney:getList' });
      if (cache) {
        try {
          return JSON.parse(cache);
        } catch (error) {
          return [];
        }
      }
    }

    const where = { isDelete: 0 };
    rec && Object.assign(where, { rec });
    userId && Object.assign(where, { userId });
    status && Object.assign(where, { status });
    const [rows, count] = await this.midjourneyEntity.findAndCount({
      where,
      order: { id: 'DESC' },
      take: size,
      skip: (page - 1) * size,
      select: ['fileInfo', 'extend', 'prompt', 'createdAt', 'id', 'extend', 'fullPrompt', 'rec', 'isSaveImg'],
    });
    const mjProxyImgUrl = await this.globalConfigService.getConfigs(['mjProxyImgUrl'])
    rows.forEach((item: any) => {
      try {
        const { extend, isSaveImg, fileInfo } = item;
        const originUrl = JSON.parse(extend)?.attachments[0]?.url
        item.fileInfo = this.formatFileInfo(fileInfo, isSaveImg, mjProxyImgUrl, originUrl);
        item.isGroup = JSON.parse(extend)?.components[0]?.components[0].label === "U1";
        item.originUrl = originUrl
      } catch (error) {
        
      }
    });

    if (Number(size) === 999) {
      const data = {
        rows: rows.map((item: any) => {
          const { fileInfo, prompt, createdAt, id, fullPrompt, rec, originUrl } = item;
          return { fileInfo, prompt, createdAt, id, fullPrompt, rec, originUrl };
        }),
        count,
      };
      await this.redisCacheService.set({ key: 'midjourney:getList', val: JSON.stringify(data) }, 60 * 5);
      return data;
    }
    const data = { rows, count };
    return data;
  }

  /*  */
  async getFullPrompt(id: number){
    const m = await this.midjourneyEntity.findOne({where: {id}})
    if(!m) return ''
    const { fullPrompt } = m
    return fullPrompt;
  }

  /* 管理端获取绘画列表 */
  async getAdminDrawList(req: Request, params: GetListDto) {
    try {
      const { page = 1, size = 10, rec, userId, status } = params;
      const where = { isDelete: 0 };
      rec && Object.assign(where, { rec });
      userId && Object.assign(where, { userId });
      status && Object.assign(where, { status });
      const [rows, count] = await this.midjourneyEntity.findAndCount({
        where,
        order: { id: 'DESC' },
        take: size,
        skip: (page - 1) * size,
      });

      const userIds = rows.map((item: any) => item.userId).filter( id => id < 100000);
      const userInfos = await this.userEntity.find({ where: { id: In(userIds) }, select: ['id', 'username', 'avatar', 'email'] });
      rows.forEach((item: any) => {
        item.userInfo = userInfos.find((user) => user.id === item.userId);
      });
      const mjProxyImgUrl = await this.globalConfigService.getConfigs(['mjProxyImgUrl'])
      rows.forEach((item: any) => {
        try {
          const { extend, isSaveImg, fileInfo } = item;
          const originUrl = JSON.parse(extend)?.attachments[0]?.url
          item.fileInfo = this.formatFileInfo(fileInfo, isSaveImg, mjProxyImgUrl, originUrl);
          // item.isGroup = JSON.parse(extend)?.components[0]?.components.length === 5;
          item.isGroup = JSON.parse(extend)?.components[0]?.components[0].label === "U1";
          item.originUrl = originUrl
        } catch (error) {
          
        }
      });
      if (req.user.role !== 'super') {
        rows.forEach((item: any) => {
          if(item.userInfo && item.userInfo.email){
            item.userInfo.email = item.userInfo.email.replace(/(.{2}).+(.{2}@.+)/, '$1****$2');
          }
        });
      }
      return { rows, count };
    } catch (error) {
      throw new HttpException('查询失败！', HttpStatus.BAD_REQUEST);
    }
  }

  /* 推荐与取消推荐图片 */
  async recDraw(params) {
    const { id } = params;
    const draw = await this.midjourneyEntity.findOne({ where: { id, status: 3, isDelete: 0 } });
    if (!draw) {
      throw new HttpException('当前图片不存在！', HttpStatus.BAD_REQUEST);
    }
    const { rec } = draw;
    const res = await this.midjourneyEntity.update({ id }, { rec: rec === 1 ? 0 : 1 });
    if (res.affected > 0) {
      return '操作成功！';
    }
  }

  /* 清空数据库的队列 */
  async cleanQueue() {
    try {
      await this.midjourneyEntity.update({ status: 2 }, { status: 4 });
    } catch (error) {
      console.log('TODO->error: ', error);
    }
  }

  /* 删除记录 */
  async delLog(req: Request, body) {
    const { id } = body;
    if (!id) {
      throw new HttpException('非法操作！', HttpStatus.BAD_REQUEST);
    }
    const res = await this.midjourneyEntity.delete({ id });
    if (res.affected > 0) {
      return '删除记录成功！';
    } else {
      throw new HttpException('删除记录失败！', HttpStatus.BAD_REQUEST);
    }
  }

  async setPrompt(req: Request, body){
    try {
      const { prompt, status, isCarryParams, title, order, id, aspect } = body
    if(id){
      return await this.mjPromptsEntity.update({id}, {prompt, status, isCarryParams, order, aspect})
    }else{
      return await this.mjPromptsEntity.save({prompt, status, isCarryParams, title, order, aspect})
    }
    } catch (error) {
      console.log('error: ', error);
    }
  }

  async delPrompt(req: Request, body){
    const {id} = body
    if(!id) {
      throw new HttpException('非法操作！', HttpStatus.BAD_REQUEST);
    }
    return await this.mjPromptsEntity.delete({id})
  }

  async queryPrompt(){
    return await this.mjPromptsEntity.find({
      order: { order: 'DESC' },
    })
  }

  async proxyImg(params){
    const { url } = params
    if(!url) return 
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const base64 = Buffer.from(response.data).toString('base64');
    return base64
  }
}
