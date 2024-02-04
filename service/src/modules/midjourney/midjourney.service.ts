import { UserEntity } from './../user/user.entity';
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
import sizeOf from 'image-size';

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
    // private readonly badwordsService: BadwordsService,
    private readonly userBalanceService: UserBalanceService,
    private redisCacheService: RedisCacheService,
  ) { }


  private lockPrompt = [];

  /* 睡眠 xs */
  async sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  /* 获取图片尺寸 */
  async getImageSizeFromUrl(imageUrl: string) {
    try {
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data, 'binary');
      const dimensions = sizeOf(buffer);
      return { width: dimensions.width, height: dimensions.height };
    } catch (error) {
      console.error('Error fetching image size:', error);
      throw error;
    }
  }

  /* MJ 绘画 */
  async draw(jobData, jobId) {
    const { id, action, drawId } = jobData;
    const drawInfo = await this.midjourneyEntity.findOne({ where: { id } });
    const { customId } = drawInfo
    try {
      /* 把任务ID绑定到DB去 */
      await this.bindJobId(id, jobId);
      await this.updateDrawStatus(id, MidjourneyStatusEnum.DRAWING);
      const result = await this.sendDrawCommand(drawInfo, action);
      /* 开始执行检测逻辑 */
      drawInfo.drawId = result;
      const drawRes = await this.pollComparisonResultDraw(id, drawInfo);
      /* 把所有绘制记录存入 */
      await this.updateDrawData(jobData, drawRes);
      // await this.updateDrawStatus(id, MidjourneyStatusEnum.DRAWED);
      this.drawSuccess(jobData)
      return true;
    } catch (error) {
      // this.lockPrompt = this.lockPrompt.filter((item) => item !== drawInfo.randomDrawId);
      // await this.drawFailed(jobData);
      console.log('error: ', error);
      return true;
    }
  }

  /* 添加一条等待中的绘制任务 */
  async addDrawQueue(params) {
    try {
      const { prompt, imgUrl = '', extraParam = '', action, userId, orderId, customId, drawId } = params;
      const fullPrompt = imgUrl ? `${imgUrl} ${prompt} ${extraParam}` : `${prompt} ${extraParam}`;
      const drawInfo = {
        userId,
        drawId,
        extraParam,
        prompt,
        imgUrl,
        fullPrompt,
        status: MidjourneyStatusEnum.WAITING,
        action,
        orderId,
        customId,
      };

      const res = await this.midjourneyEntity.save(drawInfo);
      return res;
    } catch (error) {
      console.error('Error in addDrawQueue:', error);
      throw error; // Re-throw the error for further handling
    }
  }

  /* 修改绘制记录状态 */
  async updateDrawStatus(id, status) {
    await this.midjourneyEntity.update({ id }, { status });
  }

  /* 绘制完成后修改数据 */
  async updateDrawData(jobData, drawRes) {
    try {
      const { id, imageUrl, action, submitTime, finishTime, progress } = drawRes;
      // 计算总耗时
      const durationSpent = finishTime - submitTime; // 注意单位可能需要调整，根据实际时间单位

      // 组合时间戳和id生成文件名
      let filename = `${Date.now()}-${id}.png`; // 替换 '.ext' 为实际的文件扩展名

      const mjNotSaveImg = await this.globalConfigService.getConfigs(['mjNotSaveImg'])
      let cosUrl = '';
      let isSaveImg = true;

      try {
        if (!Number(mjNotSaveImg) || Number(mjNotSaveImg) === 0) {
          Logger.debug(`------> 开始上传图片！！！`, 'MidjourneyService');
          cosUrl = await this.uploadService.uploadFileFromUrl({ filename, url: imageUrl });
        } else {
          cosUrl = imageUrl;
          isSaveImg = false;
          Logger.debug('本次不存图片了', 'MidjourneyService');
        }
      } catch (uploadError) {
        Logger.error('存储图片失败，使用原始图片链接', 'MidjourneyService');
        cosUrl = imageUrl; // 使用原始图片链接
        isSaveImg = false;
      }

      // 获取图片尺寸
      const { width, height } = await this.getImageSizeFromUrl(imageUrl);

      const drawInfo = {
        status: MidjourneyStatusEnum.DRAWED,
        drawId: id,
        action: action,
        drawUrl: cosUrl,
        drawRatio: `${width}x${height}`,
        progress: 100,
        extend: this.removeEmoji(JSON.stringify(drawRes)),
        durationSpent,
        isSaveImg,
      };

      await this.midjourneyEntity.update({ id: jobData.id }, drawInfo);
    } catch (error) {
      throw new HttpException('更新绘画数据失败', HttpStatus.BAD_REQUEST);
    }
  }


  // /* 获取到当前ID的历史已经存入的信息并且绘制完成的 防止已经存过的图又被存了 */
  // async getHistroyMessageIds(randomDrawId) {
  //   const res = await this.midjourneyEntity.find({ where: { status: MidjourneyStatusEnum.DRAWED } });
  //   return res.map((item: any) => item.drawId);
  // }

  /* 发送绘画指令 */
  async sendDrawCommand(drawInfo, action) {
    const mjProxyUrl = (await this.globalConfigService.getConfigs(['mjProxyUrl']));
    const mjKey = (await this.globalConfigService.getConfigs(['mjKey']));
    const { id, fullPrompt, imgUrl, drawId, customId } = drawInfo;
    const prompt = imgUrl ? `${imgUrl} ${fullPrompt}` : `${fullPrompt}`;
    let url = '';
    let payloadJson = {};
    const MAX_RETRIES = 3; // 最大重试次数
    let retryCount = 0; // 当前重试次数

    while (retryCount < MAX_RETRIES) {
      try {
        if (action === 'IMAGINE') {
          url = `${mjProxyUrl}/mj/submit/imagine`;
          payloadJson = { prompt: prompt };
        } else {
          url = `${mjProxyUrl}/mj/submit/action`;
          payloadJson = { taskId: drawId, customId: customId };
        }
        const headers = { "mj-api-secret": mjKey };
        const res = await axios.post(url, payloadJson, { headers });
        const { result } = res.data;
        if (result) {
          Logger.log(`绘画ID: ${result}`, 'MidjourneyService');
          return result;
        } else {
          throw new Error('未能获取结果数据');
        }
      } catch (error) {
        retryCount++;
        if (retryCount >= MAX_RETRIES) {
          await this.updateDrawStatus(id, MidjourneyStatusEnum.DRAWFAIL);
          throw new HttpException('发送绘图指令失败、请联系管理员检测绘画配置！', HttpStatus.BAD_REQUEST);
        }
      }
    }
  }

  /* 等待绘画结果 */
  async pollComparisonResultDraw(id, drawInfo) {
    const mjProxyUrl = (await this.globalConfigService.getConfigs(['mjProxyUrl']));
    const mjKey = (await this.globalConfigService.getConfigs(['mjKey']));
    const startTime = Date.now();
    const POLL_INTERVAL = 5000; // 每5秒查一次
    const TIMEOUT = 150000; // 超时时间 150秒
    let pollingCount = 0; // 记录轮询次数
    let retryCount = 0; // 重试计数
    const MAX_RETRIES = 5; // 最大重试次数
    const { drawId } = drawInfo;

    try {
      while (Date.now() - startTime < TIMEOUT && retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
        // Logger.debug(`【绘制图片】第 ${pollingCount + 1} 次开始查询, 使用 drawId: ${drawId}`, 'MidjourneyService');

        try {
          const headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "mj-api-secret": mjKey
          };
          const url = `${mjProxyUrl}/mj/task/${drawId}/fetch`;
          const res = await axios.get(url, { headers });
          const responses = res.data;
          // Logger.debug(`【绘制图片】第 ${pollingCount + 1} 次查询结果: ${JSON.stringify(responses)}`, 'MidjourneyService');

          const progress = responses.process;
          await this.midjourneyEntity.update({ id }, { progress: progress });
          if (responses.status === 'SUCCESS') {
            Logger.log(`绘制成功, URL: ${responses.imageUrl}`, 'MidjourneyService');
            return responses; // 返回成功的响应
          }
        } catch (error) {
          retryCount++;
          Logger.error(`轮询过程中发生错误: ${error}`, 'MidjourneyService');
        }
        pollingCount++;
      }

      if (retryCount >= MAX_RETRIES) {
        await this.updateDrawStatus(id, MidjourneyStatusEnum.DRAWFAIL);
        throw new HttpException('轮询失败次数过多，请稍后再试！', HttpStatus.BAD_REQUEST);
      }

      Logger.error('绘画超时，请稍后再试！', 'MidjourneyService');
      await this.updateDrawStatus(id, MidjourneyStatusEnum.DRAWFAIL);
      throw new HttpException('绘画超时，请稍后再试！', HttpStatus.BAD_REQUEST);
    } catch (error) {
      Logger.error('获取图片结果失败: ', error, 'MidjourneyService');
      await this.updateDrawStatus(id, MidjourneyStatusEnum.DRAWFAIL);
      throw error;
    }
  }

  // /* 查询绘画的所有列表 */
  // async getMessageList() {
  //   try {
  //     const mjProxyUrl = (await this.globalConfigService.getConfigs(['mjProxyUrl']));
  //     const mjKey = (await this.globalConfigService.getConfigs(['mjKey']));
  //     const url = `${mjProxyUrl}/mj/task/list`;
  //     const headers = { "mj-api-secret": mjKey };
  //     const response = await axios.get(url, { headers });
  //     return response.data;
  //   } catch (error) {
  //     Logger.error('查询绘制结果失败: getMessageList', error, 'MidjourneyService');
  //     return [];
  //   }
  // }

  // /* 通过content拿到百分比进度 */
  // parseProgress(content) {
  //   const regex = /\((\d+)%\)/;
  //   const match = content.match(regex);

  //   if (match) {
  //     return parseInt(match[1], 10);
  //   } else {
  //     return null;
  //   }
  // }

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
        select: ['id', 'userId', 'prompt', 'extraParam', 'fullPrompt', 'rec', 'orderId', 'drawId', 'drawUrl', 'drawRatio', 'isDelete', 'status', 'action']
      });
      const countQueue = await this.midjourneyEntity.count({ where: { isDelete: 0, status: In([1, 2]) } });
      const data: any = { rows: formatCreateOrUpdateDate(rows), count, countQueue };
      return data;
    } catch (error) {
      throw new HttpException('获取我得绘制列表失败', HttpStatus.BAD_REQUEST);
    }
  }

  // /* 格式化fileinfo  对于不同平台的图片进行压缩 */
  // formatFileInfo(fileInfo, isSaveImg, originUrl) {
  //   if (!fileInfo) return {};
  //   let parseFileInfo: any = null
  //   try {
  //     parseFileInfo = JSON.parse(fileInfo);
  //   } catch (error) {
  //     parseFileInfo = null
  //   }
  //   if (!parseFileInfo) return;
  //   const { url, filename, size, cosUrl, width, height } = parseFileInfo;
  //   const targetSize = 310; // 目标宽度或高度

  //   // TODO判断逻辑有误 腾讯云会导致也判断为 chevereto  更换判断规则
  //   const imgType = cosUrl.includes('cos') ? 'tencent' : cosUrl.includes('oss') ? 'ali' : 'chevereto';
  //   let compress;
  //   let thumbImg;
  //   if (imgType === 'tencent') {
  //     const ratio = width / height;
  //     const targetHeight = Math.round(targetSize / ratio); // 计算目标高度
  //     thumbImg = cosUrl + `?imageView2/1/w/${targetSize}/h/${targetHeight}/q/55`;
  //   }
  //   if (imgType === 'ali') {
  //     const ratio = height / width;
  //     const targetWidth = Math.round(targetSize / ratio); // 计算目标宽度
  //     thumbImg = cosUrl + `?x-oss-process=image/resize,w_${targetWidth}`;
  //   }
  //   if (imgType === 'chevereto') {
  //     thumbImg = cosUrl.replace(/\.png$/, '.md.png');
  //   }
  //   parseFileInfo.thumbImg = thumbImg;
  //   /* 如果配置了不存储图片 则 isSaceImg 为false的则需要使用反代地址拼接 */
  //   if (!isSaveImg) {
  //     const proxyImgUrl = originUrl
  //     parseFileInfo.thumbImg = proxyImgUrl
  //     parseFileInfo.cosUrl = proxyImgUrl
  //   }
  //   return parseFileInfo;
  // }

  /* 操作的时候去获取需要的信息 */
  async getDrawActionDetail(action, drawId, orderId) {
    const detailInfo = await this.midjourneyEntity.findOne({ where: { drawId: drawId } });
    // if (!detailInfo) {
    //   throw new HttpException('当前绘画信息不存在！', HttpStatus.BAD_REQUEST);
    // }

    const { extend, prompt, imgUrl, extraParam } = detailInfo;
    const extendObj = JSON.parse(extend);
    const buttons = extendObj.buttons || [];
    // Logger.debug(`绘画详情: ${JSON.stringify({ drawId, prompt, imgUrl, extraParam, action })}`, 'MidjourneyService');

    let currentButton;
    if (action === 'UPSCALE') {
      currentButton = buttons.find(button => {
        // 检查是否为U1, U2, U3, U4格式的标签
        const isStandardUpscale = button.label.startsWith(`U${orderId}`);
        // 检查是否为Upscale (Subtle) 或 Upscale (Creative)格式的标签，无论是否包含其他文字
        const isUpscaleUpscale = (orderId === 1 && /(Redo )?Upscale \(Subtle\)/.test(button.label)) ||
          (orderId === 2 && /(Redo )?Upscale \(Creative\)/.test(button.label));
        return isStandardUpscale || isUpscaleUpscale;
      });
    }
    if (action === 'VARIATION') {
      currentButton = buttons.find(button => {
        // 检查是否为V1, V2, V3, V4格式的标签
        const isStandardVariation = button.label.startsWith(`V${orderId}`);
        // 检查是否为Vary (Strong) 或 Vary (Region)格式的标签，无论是否包含其他文字
        const isVaryVariation = (orderId === 1 && /Vary \(Strong\)/.test(button.label)) ||
          (orderId === 2 && /Vary \(Region\)/.test(button.label));
        return isStandardVariation || isVaryVariation;
      });
    }
    if (action === 'REGENERATE') {
      currentButton = buttons.find(button =>
        button.customId.startsWith("MJ::JOB::reroll::0::") && button.label === ""
      );
    }
    if (action === 'ZOOM') {
      currentButton = buttons.find(button =>
        (orderId === 1 && button.label === "Zoom Out 2x") ||
        (orderId === 2 && button.label === "Zoom Out 1.5x")
      );
    }
    if (!currentButton) {
      throw new HttpException('所需绘画操作信息不存在!', HttpStatus.BAD_REQUEST);
    }

    const { customId } = currentButton;

    return { customId, prompt, extraParam, drawId };
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

  /* 默认限制同时最多两个任务进行中 */
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
    // const amount = action === 2 ? 1 : 4;
    // await this.userBalanceService.refundMjBalance(userId, amount);
    await this.midjourneyEntity.update({ id }, { status: 4 });
  }

  /* 绘图成功扣费 */
  async drawSuccess(jobData) {
    const { id, userId, action } = jobData;
    /* 扣除余额 放大图片（类型2）是1 其他都是4 */
    const amount = action === "UPSCALE" ? 1 : 4;
    Logger.debug(`绘画完成，执行扣费，扣除费用:${amount}积分。`)
    await this.userBalanceService.refundMjBalance(userId, -amount);
    await this.midjourneyEntity.update({ id }, { status: 3 });
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
      select: ['id', 'drawId', 'drawUrl', 'drawRatio', 'prompt', 'fullPrompt', 'rec', 'createdAt', 'action', 'status'],
    });

    if (Number(size) === 999) {
      const data = {
        rows: rows.map((item: any) => {
          const { id, drawId, drawUrl, drawRatio, prompt, fullPrompt, createdAt, rec, action, status } = item;
          return { id, drawId, drawUrl, drawRatio, prompt, fullPrompt, createdAt, rec, action, status };
        }),
        count,
      };
      await this.redisCacheService.set({ key: 'midjourney:getList', val: JSON.stringify(data) }, 60 * 5);
      return data;
    }
    const data = { rows, count };
    return data;
  }

  /* 获取完整的绘画提示词 */
  async getFullPrompt(id: number) {
    const m = await this.midjourneyEntity.findOne({ where: { id } })
    if (!m) return ''
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

      const userIds = rows.map((item: any) => item.userId).filter(id => id < 100000);
      const userInfos = await this.userEntity.find({ where: { id: In(userIds) }, select: ['id', 'username', 'avatar', 'email'] });
      rows.forEach((item: any) => {
        item.userInfo = userInfos.find((user) => user.id === item.userId);
      });
      // rows.forEach((item: any) => {
      //   try {
      //     const { extend, isSaveImg, fileInfo } = item;
      //     const originUrl =
      //   } catch (error) {
      //   }
      // });
      if (req.user.role !== 'super') {
        rows.forEach((item: any) => {
          if (item.userInfo && item.userInfo.email) {
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

  async setPrompt(req: Request, body) {
    try {
      const { prompt, status, isCarryParams, title, order, id, aspect } = body
      if (id) {
        return await this.mjPromptsEntity.update({ id }, { prompt, status, isCarryParams, order, aspect })
      } else {
        return await this.mjPromptsEntity.save({ prompt, status, isCarryParams, title, order, aspect })
      }
    } catch (error) {
      console.log('error: ', error);
    }
  }

  async delPrompt(req: Request, body) {
    const { id } = body
    if (!id) {
      throw new HttpException('非法操作！', HttpStatus.BAD_REQUEST);
    }
    return await this.mjPromptsEntity.delete({ id })
  }

  async queryPrompt() {
    return await this.mjPromptsEntity.find({
      order: { order: 'DESC' },
    })
  }

  async proxyImg(params) {
    const { url } = params
    if (!url) return
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const base64 = Buffer.from(response.data).toString('base64');
    return base64
  }
}

