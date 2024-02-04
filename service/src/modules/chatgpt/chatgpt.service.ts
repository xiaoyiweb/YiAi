import { UploadService } from './../upload/upload.service';
import { UserService } from './../user/user.service';
import { ConfigService } from 'nestjs-config';
import { HttpException, HttpStatus, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import type { ChatGPTAPIOptions, ChatMessage, SendMessageOptions } from 'chatgpt-ai-web';
import e, { Request, Response } from 'express';
import { OpenAiErrorCodeMessage } from '@/common/constants/errorMessage.constant';
import {
  compileNetwork,
  getClientIp,
  hideString,
  importDynamic,
  isNotEmptyString,
  maskEmail,
  removeSpecialCharacters,
  selectKeyWithWeight,
} from '@/common/utils';
import axios from 'axios';
import { UserBalanceService } from '../userBalance/userBalance.service';
import { DeductionKey } from '@/common/constants/balance.constant';
import { ChatLogService } from '../chatLog/chatLog.service';
import { ChatDrawDto } from './dto/chatDraw.dto';
import * as uuid from 'uuid';
import * as jimp from 'jimp';
import { ConfigEntity } from '../globalConfig/config.entity';
import { In, Like, MoreThan, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BadwordsService } from '../badwords/badwords.service';
import { AutoreplyService } from '../autoreply/autoreply.service';
import { GptKeysEntity } from './gptkeys.entity';
import { GlobalConfigService } from '../globalConfig/globalConfig.service';
import { FanyiService } from '../fanyi/fanyi.service';
import * as dayjs from 'dayjs';
import { AppEntity } from '../app/app.entity';
import { ChatGroupService } from '../chatGroup/chatGroup.service';
import { ModelsService } from '../models/models.service';
import { sendMessageFromBaidu } from './baidu';
import { addOneIfOdd, unifiedFormattingResponse } from './helper';
import { MessageInfo, NineStore, NineStoreInterface } from './store';
import { sendMessageFromZhipu } from './zhipu';
import { getTokenCount, sendMessageFromOpenAi } from './openai';
import { ChatBoxTypeEntity } from './chatBoxType.entity';
import { ChatBoxEntity } from './chatBox.entity';
import { ChatPreEntity } from './chatPre.entity';
import { ChatPreTypeEntity } from './chatPreType.entity';

interface Key {
  id: number;
  key: string;
  weight: number;
  model: string;
  maxModelTokens: number;
  maxResponseTokens: number;
  openaiProxyUrl: string;
  openaiTimeoutMs: number;
}

@Injectable()
export class ChatgptService implements OnModuleInit {
  constructor(
    @InjectRepository(GptKeysEntity)
    private readonly gptKeysEntity: Repository<GptKeysEntity>,
    @InjectRepository(ConfigEntity)
    private readonly configEntity: Repository<ConfigEntity>,
    @InjectRepository(ChatBoxTypeEntity)
    private readonly chatBoxTypeEntity: Repository<ChatBoxTypeEntity>,
    @InjectRepository(ChatBoxEntity)
    private readonly chatBoxEntity: Repository<ChatBoxEntity>,
    @InjectRepository(AppEntity)
    private readonly appEntity: Repository<AppEntity>,
    @InjectRepository(ChatPreTypeEntity)
    private readonly chatPreTypeEntity: Repository<ChatPreTypeEntity>,
    @InjectRepository(ChatPreEntity)
    private readonly chatPreEntity: Repository<ChatPreEntity>,
    private readonly configService: ConfigService,
    private readonly userBalanceService: UserBalanceService,
    private readonly chatLogService: ChatLogService,
    private readonly userService: UserService,
    private readonly uploadService: UploadService,
    private readonly badwordsService: BadwordsService,
    private readonly autoreplyService: AutoreplyService,
    private readonly globalConfigService: GlobalConfigService,
    private readonly fanyiService: FanyiService,
    private readonly chatGroupService: ChatGroupService,
    private readonly modelsService: ModelsService,
  ) {}

  private api;
  private nineStore: NineStoreInterface = null; // redis存储
  private whiteListUser: number[] = [];
  private keyPool: {
    list3: Key[];
    list4: Key[];
  } = {
    list3: [],
    list4: [],
  };

  async onModuleInit() {
    let chatgpt = await importDynamic('chatgpt-ai-web');
    let KeyvRedis = await importDynamic('@keyv/redis');
    let Keyv = await importDynamic('keyv');
    chatgpt = chatgpt?.default ? chatgpt.default : chatgpt;
    KeyvRedis = KeyvRedis?.default ? KeyvRedis.default : KeyvRedis;
    Keyv = Keyv?.default ? Keyv.default : Keyv;
    const { ChatGPTAPI, ChatGPTError, ChatGPTUnofficialProxyAPI } = chatgpt;
    /* get custom set default config */
    const port = +process.env.REDIS_PORT;
    const host = process.env.REDIS_HOST;
    const password = process.env.REDIS_PASSWORD;
    const username = process.env.REDIS_USER;
    const redisUrl = `redis://${username || ''}:${password || ''}@${host}:${port}`;
    const store = new KeyvRedis(redisUrl);
    /* chatgpt-nineai 使用的 可以切换给 store使用 */
    const messageStore = new Keyv({ store, namespace: 'nineai-chatlog' });
    this.nineStore = new NineStore({ store: messageStore, namespace: 'chat' });
  }

  /* 整理请求的所有入参 */
  async getRequestParams(inputOpt, systemMessage, currentRequestModelKey, modelInfo = null) {
    if (!modelInfo) {
      modelInfo = (await this.modelsService.getBaseConfig())?.modelInfo;
    }
    const { timeout = 60 } = currentRequestModelKey;
    const { topN: temperature, model } = modelInfo;
    const { parentMessageId = 0 } = inputOpt;
    /* 根据用户区分不同模型使用不同的key */
    const globalTimeoutMs: any = await this.globalConfigService.getConfigs(['openaiTimeoutMs']);
    const timeoutMs = timeout * 1000 || globalTimeoutMs || 100 * 1000;
    const options: any = {
      parentMessageId,
      timeoutMs: +timeoutMs,
      completionParams: {
        model,
        temperature: temperature, // 温度 使用什么采样温度，介于 0 和 2 之间。较高的值（如 0.8）将使输出更加随机，而较低的值（如 0.2）将使输出更加集中和确定
      },
    };
    systemMessage && (options.systemMessage = systemMessage);
    return options;
  }

  async chatSyncFree(prompt: string) {
    const currentRequestModelKey = await this.modelsService.getRandomDrawKey();
    const systemMessage = await this.globalConfigService.getConfigs(['systemPreMessage']);
    const { maxModelTokens = 8000, maxResponseTokens = 4096, key, model } = currentRequestModelKey;
    const proxyUrl = await this.getModelProxyUrl(currentRequestModelKey);
    const { context: messagesHistory } = await this.nineStore.buildMessageFromParentMessageId(prompt, { parentMessageId: '', systemMessage });
    try {
      const response: any = await sendMessageFromOpenAi(messagesHistory, {
        apiKey: removeSpecialCharacters(key),
        model,
        proxyUrl: proxyUrl,
        onProgress: null,
      });
      return response?.text;
    } catch (error) {
      console.log('error: ', error);
    }
  }

  /* 有res流回复 没有同步回复 */
  async chatProcess(body: any, req: Request, res?: Response) {
    const abortController = req.abortController;
    const { options = {}, appId, cusromPrompt, systemMessage = '' } = body;
    /* 不同场景会变更其信息 */
    let setSystemMessage = systemMessage;
    const { parentMessageId } = options;
    const { prompt, imageUrl, model: activeModel } = body;
    const { groupId, usingNetwork } = options;
    // const { model = 3 } = options;
    /* 获取当前对话组的详细配置信息 */
    const groupInfo = await this.chatGroupService.getGroupInfoFromId(groupId);
    /* 当前对话组关于对话的配置信息 */
    const groupConfig = groupInfo?.config ? JSON.parse(groupInfo.config) : await this.modelsService.getBaseConfig();
    const { keyType, model, topN: temperature, systemMessage: customSystemMessage, rounds } = groupConfig.modelInfo;
    /* 获取到本次需要调用的key */
    let currentRequestModelKey = null;
    if (!cusromPrompt) {
      currentRequestModelKey = await this.modelsService.getCurrentModelKeyInfo(model);
    } else {
      currentRequestModelKey = await this.modelsService.getRandomDrawKey();
    }
    if (!currentRequestModelKey) {
      throw new HttpException('当前流程所需要的模型已被管理员下架、请联系管理员上架专属模型！', HttpStatus.BAD_REQUEST);
    }

    const { deduct, isTokenBased, tokenFeeRatio, deductType, key: modelKey, secret, modelName, id: keyId, accessToken } = currentRequestModelKey;
    /* 用户状态检测 */
    await this.userService.checkUserStatus(req.user);
    /* 用户余额检测 */
    await this.userBalanceService.validateBalance(req, deductType === 1 ? 'model3' : 'model4', deduct);
    res && res.setHeader('Content-type', 'application/octet-stream; charset=utf-8');
    /* 敏感词检测 */
    await this.badwordsService.checkBadWords(prompt, req.user.id);
    /* 自动回复 */
    const autoReplyRes = await this.autoreplyService.checkAutoReply(prompt);
    if (autoReplyRes && res) {
      const msg = { message: autoReplyRes, code: 500 };
      res.write(JSON.stringify(msg));
      return res.end();
    }

    /* 如果传入了appId 那么appId优先级更高 */
    if (appId) {
      const appInfo = await this.appEntity.findOne({ where: { id: appId, status: In([1, 3, 4, 5]) } });
      if (!appInfo) {
        throw new HttpException('你当前使用的应用已被下架、请删除当前对话开启新的对话吧！', HttpStatus.BAD_REQUEST);
      }
      appInfo.preset && (setSystemMessage = appInfo.preset);
    } else if (cusromPrompt) {
      // 特殊场景系统预设 在co层直接改写
      //自定义提示词 特殊场景  思维导图 翻译 联想 不和头部预设结合
      setSystemMessage = systemMessage;
    } else if (customSystemMessage) {
      // 用户自定义的预设信息
      setSystemMessage = customSystemMessage;
    } else {
      // 走系统默认预设
      const currentDate = new Date().toISOString().split('T')[0];
      const systemPreMessage = await this.globalConfigService.getConfigs(['systemPreMessage']);
      setSystemMessage = systemPreMessage + `\n Current date: ${currentDate}`;
    }

    let netWorkPrompt = '';
    /* 使用联网模式 */
    if (usingNetwork) {
      netWorkPrompt = await compileNetwork(prompt);
      const currentDate = new Date().toISOString().split('T')[0];
      const systemPreMessage = await this.globalConfigService.getConfigs(['systemPreMessage']);
      setSystemMessage = systemPreMessage + `\n Current date: ${currentDate}`;
    }

    /* 整理本次请求全部数据 */
    const mergedOptions: any = await this.getRequestParams(options, setSystemMessage, currentRequestModelKey, groupConfig.modelInfo);

    const { maxModelTokens = 8000, maxResponseTokens = 4096, key } = currentRequestModelKey;

    res && res.status(200);
    let response = null;
    let othersInfo = null;
    try {
      if (res) {
        let lastChat: ChatMessage | null = null;
        let isSuccess = false;
        /* 如果客户端终止请求、我们只存入终止前获取的内容、并且终止此次请求 拿到最后一次数据 虚构一个结构用户后续信息存入 */
        res.on('close', async () => {
          if (isSuccess) return;
          abortController.abort();
          const prompt_tokens = (await getTokenCount(prompt)) || 0;
          const completion_tokens = (await getTokenCount(lastChat?.text)) || 0;
          const total_tokens = prompt_tokens + completion_tokens;

          // TODO  待优化
          /* 日志记录  */
          const curIp = getClientIp(req);
          /* 用户询问 */
          await this.chatLogService.saveChatLog({
            appId,
            curIp,
            userId: req.user.id,
            type: DeductionKey.CHAT_TYPE,
            prompt,
            imageUrl:imageUrl,
            activeModel,
            answer: '',
            promptTokens: prompt_tokens,
            completionTokens: 0,
            totalTokens: prompt_tokens,
            model: model,
            role: 'user',
            groupId,
            requestOptions: JSON.stringify({
              options: null,
              prompt,
            }),
          });

          // gpt回答
          await this.chatLogService.saveChatLog({
            appId,
            curIp,
            userId: req.user.id,
            type: DeductionKey.CHAT_TYPE,
            prompt: prompt,
            answer: lastChat?.text,
            promptTokens: prompt_tokens,
            completionTokens: completion_tokens,
            totalTokens: total_tokens,
            model: model,
            role: 'assistant',
            groupId,
            requestOptions: JSON.stringify({
              options: {
                model: model,
                temperature,
              },
              prompt,
            }),
            conversationOptions: JSON.stringify({
              conversationId: lastChat?.conversationId,
              model: model,
              parentMessageId: lastChat?.id,
              temperature,
            }),
          });

          /* 当用户回答一般停止时 也需要扣费 */
          let charge = deduct;
          if (isTokenBased === true) {
            charge = Math.ceil((deduct * total_tokens) / tokenFeeRatio);
          }
          await this.userBalanceService.deductFromBalance(req.user.id, `model${deductType === 1 ? 3 : 4}`, charge, total_tokens);
        });

        /* openAi */
        if (Number(keyType) === 1) {
          const { key, maxToken, maxTokenRes, proxyResUrl } = await this.formatModelToken(currentRequestModelKey);
          const { parentMessageId, completionParams, systemMessage } = mergedOptions;
          const { model, temperature } = completionParams;
          const { context: messagesHistory } = await this.nineStore.buildMessageFromParentMessageId(usingNetwork ? netWorkPrompt : prompt, {
            parentMessageId,
            systemMessage,
            maxModelToken: maxToken,
            maxResponseTokens: maxTokenRes,
            maxRounds: addOneIfOdd(rounds),
            imageUrl,
            activeModel,
          });
          let firstChunk = true;
          response = await sendMessageFromOpenAi(messagesHistory, {
            maxToken,
            maxTokenRes,
            apiKey: modelKey,
            model,
            prompt,
            activeModel,
            imageUrl,
            temperature,
            proxyUrl: proxyResUrl,
            onProgress: (chat) => {
              res.write(firstChunk ? JSON.stringify(chat) : `\n${JSON.stringify(chat)}`);
              lastChat = chat;
              firstChunk = false;
            },
          },this.uploadService);
          isSuccess = true;
        }

        /* 百度文心 */
        if (Number(keyType) === 2) {
          let firstChunk = true;
          const { context: messagesHistory } = await this.nineStore.buildMessageFromParentMessageId(usingNetwork ? netWorkPrompt : prompt, {
            parentMessageId,
            maxRounds: addOneIfOdd(rounds),
          });
          response = await sendMessageFromBaidu(usingNetwork ? netWorkPrompt : messagesHistory, {
            temperature,
            accessToken,
            model,
            onProgress: (data) => {
              res.write(firstChunk ? JSON.stringify(data) : `\n${JSON.stringify(data)}`);
              firstChunk = false;
              lastChat = data;
            },
          });
          isSuccess = true;
        }

        /* 清华智谱 */
        if (Number(keyType) === 3) {
          let firstChunk = true;
          const { context: messagesHistory } = await this.nineStore.buildMessageFromParentMessageId(usingNetwork ? netWorkPrompt : prompt, {
            parentMessageId,
            maxRounds: addOneIfOdd(rounds),
          });
          response = await sendMessageFromZhipu(usingNetwork ? netWorkPrompt : messagesHistory, {
            temperature,
            key,
            model,
            onProgress: (data) => {
              res.write(firstChunk ? JSON.stringify(data) : `\n${JSON.stringify(data)}`);
              firstChunk = false;
              lastChat = data;
            },
          });
          isSuccess = true;
        }

        const userMessageData: MessageInfo = {
          id: this.nineStore.getUuid(),
          text: prompt,
          role: 'user',
          name: undefined,
          usage: null,
          imageUrl,
          activeModel,
          parentMessageId: parentMessageId,
          conversationId: response?.conversationId,
        };

        othersInfo = { model, parentMessageId };

        await this.nineStore.setData(userMessageData);

        const assistantMessageData: MessageInfo = {
          id: response.id,
          text: response.text,
          role: 'assistant',
          name: undefined,
          usage: response?.usage,
          imageUrl: imageUrl,
          parentMessageId: userMessageData.id,
          conversationId: response?.conversationId,
        };

        await this.nineStore.setData(assistantMessageData);

        othersInfo = { model, parentMessageId: userMessageData.id };
      } else {
        const { key, maxToken, maxTokenRes, proxyResUrl } = await this.formatModelToken(currentRequestModelKey);
        const { parentMessageId, completionParams, systemMessage } = mergedOptions;
        const { model, temperature } = completionParams;
        const { context: messagesHistory } = await this.nineStore.buildMessageFromParentMessageId(usingNetwork ? netWorkPrompt : prompt, {
          parentMessageId,
          systemMessage,
          maxRounds: addOneIfOdd(rounds),
        });
        response = await sendMessageFromOpenAi(messagesHistory, {
          apiKey: modelKey,
          model,
          temperature,
          proxyUrl: proxyResUrl,
          onProgress: null,
          prompt,
        });
      }
      /* 统一最终输出格式 */
      let usage = null;
      let formatResponse = null;
      if (model.includes('dall')) {
        usage = response.detail?.usage || { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 };
      } else {
        formatResponse = await unifiedFormattingResponse(keyType, response, othersInfo);
      }
      const { prompt_tokens, completion_tokens, total_tokens } = model.includes('dall') ? usage : formatResponse.usage;
      /* 区分扣除普通还是高级余额  model3: 普通余额  model4： 高级余额 */
      let charge = deduct;
      if (isTokenBased === true) {
        charge = Math.ceil((deduct * total_tokens) / tokenFeeRatio);
      }
      await this.userBalanceService.deductFromBalance(req.user.id, `model${deductType === 1 ? 3 : 4}`, charge, total_tokens);

      /* 记录key的使用次数 和使用token */
      await this.modelsService.saveUseLog(keyId, total_tokens);

      const curIp = getClientIp(req);

      /* 用户询问 */
      await this.chatLogService.saveChatLog({
        appId,
        curIp,
        userId: req.user.id,
        type: DeductionKey.CHAT_TYPE,
        prompt,
        imageUrl,
        activeModel,
        answer: '',
        promptTokens: prompt_tokens,
        completionTokens: 0,
        totalTokens: total_tokens,
        model: model,
        role: 'user',
        groupId,
        requestOptions: JSON.stringify({
          options: null,
          prompt,
        }),
      });

      // gpt回答
      await this.chatLogService.saveChatLog({
        appId,
        curIp,
        userId: req.user.id,
        type: DeductionKey.CHAT_TYPE,
        prompt: prompt,
        imageUrl: response?.imageUrl,
        answer: response.text,
        promptTokens: prompt_tokens,
        completionTokens: completion_tokens,
        totalTokens: total_tokens,
        model: model,
        role: 'assistant',
        groupId,
        requestOptions: JSON.stringify({
          options: {
            model: model,
            temperature,
          },
          prompt,
        }),
        conversationOptions: JSON.stringify({
          conversationId: response.conversationId,
          model: model,
          parentMessageId: response.id,
          temperature,
        }),
      });
      Logger.debug(
        `用户ID: ${req.user.id} 模型名称: ${modelName}-${activeModel}, 消耗token: ${total_tokens}, 消耗积分： ${charge}`,
        'ChatgptService',
      );
      const userBalance = await this.userBalanceService.queryUserBalance(req.user.id);
      response.userBanance = { ...userBalance };
      response.result && (response.result = '');
      response.is_end = true; //本次才是表示真的结束
      if (res) {
        return res.write(`\n${JSON.stringify(response)}`);
      } else {
        return response.text;
      }
    } catch (error) {
      console.log('chat-error <----------------------------------------->', modelKey, error);
      const code = error?.statusCode || 400;
      const status = error?.response?.status || error?.statusCode || 400;
      console.log(
        'chat-error-detail  <----------------------------------------->',
        'code: ',
        code,
        'message',
        error?.message,
        'statusText:',
        error?.response?.statusText,
        'status',
        error?.response?.status,
      );
      if (error.status && error.status === 402) {
        const errMsg = { message: `Catch Error ${error.message}`, code: 402 };
        if (res) {
          return res.write(JSON.stringify(errMsg));
        } else {
          throw new HttpException(error.message, HttpStatus.PAYMENT_REQUIRED);
        }
      }

      if (!status) {
        if (res) {
          return res.write(JSON.stringify({ message: error.message, code: 500 }));
        } else {
          throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
      }

      let message = OpenAiErrorCodeMessage[status] ? OpenAiErrorCodeMessage[status] : '服务异常、请重新试试吧！！！';

      if (error?.message.includes('The OpenAI account associated with this API key has been deactivated.') && Number(keyType) === 1) {
        await this.modelsService.lockKey(keyId, '当前模型key已被封禁、已冻结当前调用Key、尝试重新对话试试吧！', -1);
        message = '当前模型key已被封禁';
      }

      if (error?.statusCode === 429 && error.message.includes('billing') && Number(keyType) === 1) {
        await this.modelsService.lockKey(keyId, '当前模型key余额已耗尽、已冻结当前调用Key、尝试重新对话试试吧！', -3);
        message = '当前模型key余额已耗尽';
      }

      if (error?.statusCode === 429 && error?.statusText === 'Too Many Requests') {
        message = '当前模型调用过于频繁、请重新试试吧！';
      }

      /* 提供了错误的秘钥 */
      if (error?.statusCode === 401 && error.message.includes('Incorrect API key provided') && Number(keyType) === 1) {
        await this.modelsService.lockKey(keyId, '提供了错误的模型秘钥', -2);
        message = '提供了错误的模型秘钥、已冻结当前调用Key、请重新尝试对话！';
      }

      /* 模型有问题 */
      if (error?.statusCode === 404 && error.message.includes('This is not a chat model and thus not supported') && Number(keyType) === 1) {
        await this.modelsService.lockKey(keyId, '当前模型不是聊天模型', -4);
        message = '当前模型不是聊天模型、已冻结当前调用Key、请重新尝试对话！';
      }

      if (code === 400) {
        console.log('400 error', error, error.message);
      }

      /* 防止因为key的原因直接导致客户端以为token过期退出  401只给用于鉴权token中 */
      const errMsg = { message: message || 'Please check the back-end console', code: code === 401 ? 400 : code || 500 };

      if (res) {
        return res.write(JSON.stringify(errMsg));
      } else {
        throw new HttpException(errMsg.message, HttpStatus.BAD_REQUEST);
      }
    } finally {
      res && res.end();
    }
  }

  async draw(body: ChatDrawDto, req: Request) {
    /* 敏感词检测 */
    await this.badwordsService.checkBadWords(body.prompt, req.user.id);
    await this.userService.checkUserStatus(req.user);
    // TODO 目前仅支持一张才这样计算
    const money = body?.quality === 'hd' ? 4 : 2;
    await this.userBalanceService.validateBalance(req, 'mjDraw', money);
    let images = [];
    /* 从3的卡池随机拿一个key */
    const detailKeyInfo = await this.modelsService.getCurrentModelKeyInfo('dall-e-3');
    const keyId = detailKeyInfo?.id;
    const { key, proxyResUrl } = await this.formatModelToken(detailKeyInfo);
    Logger.log(`draw paompt info <==**==> ${body.prompt}, key ===> ${key}`, 'DrawService');
    try {
      const api = `${proxyResUrl}/v1/images/generations`;
      const params = { ...body, model: 'dall-e-3' };
      console.log('dall-e draw params: ', params);
      const res = await axios.post(api, { ...params, response_format: 'b64_json' }, { headers: { Authorization: `Bearer ${key}` } });
      images = res.data.data;
      const task = [];
      for (const item of images) {
        const filename = uuid.v4().slice(0, 10) + '.png';
        const buffer = Buffer.from(item.b64_json, 'base64');
        task.push(this.uploadService.uploadFile({ filename, buffer }));
      }
      const urls = await Promise.all(task);
      /* 绘制openai的dall-e2绘画也扣除的是绘画积分次数 */
      await this.userBalanceService.deductFromBalance(req.user.id, 'mjDraw', params?.quality === 'standard' ? 2 : 4, money);
      const curIp = getClientIp(req);
      const taskLog = [];
      const cosType = await this.uploadService.getUploadType();
      const [width, height] = body.size.split('x');
      urls.forEach((url) => {
        taskLog.push(
          this.chatLogService.saveChatLog({
            curIp,
            userId: req.user.id,
            type: DeductionKey.PAINT_TYPE,
            prompt: body.prompt,
            answer: url,
            fileInfo: JSON.stringify({
              cosType,
              width,
              height,
              cosUrl: url,
            }),
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            model: 'dall-e-3',
          }),
        );
      });
      await Promise.all(taskLog);
      return urls;
    } catch (error) {
      const status = error?.response?.status || 500;
      console.log('openai-draw error: ', JSON.stringify(error), key, status);
      const message = error?.response?.data?.error?.message;
      if (status === 429) {
        throw new HttpException('当前请求已过载、请稍等会儿再试试吧！', HttpStatus.BAD_REQUEST);
      }
      if (status === 400 && message.includes('This request has been blocked by our content filters')) {
        throw new HttpException('您的请求已被系统拒绝。您的提示可能存在一些非法的文本。', HttpStatus.BAD_REQUEST);
      }
      if (status === 400 && message.includes('Billing hard limit has been reached')) {
        await this.modelsService.lockKey(keyId, '当前模型key已被封禁、已冻结当前调用Key、尝试重新对话试试吧！', -1);
        throw new HttpException('当前Key余额已不足、请重新再试一次吧！', HttpStatus.BAD_REQUEST);
      }
      if (status === 500) {
        throw new HttpException('绘制图片失败，请检查你的提示词是否有非法描述！', HttpStatus.BAD_REQUEST);
      }
      if (status === 401) {
        throw new HttpException('绘制图片失败，此次绘画被拒绝了！', HttpStatus.BAD_REQUEST);
      }
      throw new HttpException('绘制图片失败，请稍后试试吧！', HttpStatus.BAD_REQUEST);
    }
  }

  /* 当前所有key的列表 */
  async getAllKeyList() {
    const list = await this.gptKeysEntity.find({
      where: { status: 1 },
      select: ['id', 'key', 'weight', 'model', 'maxModelTokens', 'maxResponseTokens', 'openaiProxyUrl', 'openaiTimeoutMs'],
    });
    const list3 = list.filter((t) => t.model.includes('gpt-3'));
    const list4 = list.filter((t) => t.model.includes('gpt-4'));
    this.keyPool = {
      list3,
      list4,
    };
  }

  /* 拿到代理地址 */
  async getModelProxyUrl(modelKey) {
    const openaiBaseUrl = await this.globalConfigService.getConfigs(['openaiBaseUrl']);
    return modelKey?.proxyUrl || openaiBaseUrl || 'https://api.openai.com';
  }

  /* TODO 区分整理不同默认的token数量管理 */
  async formatModelToken(detailKeyInfo) {
    /* global config */
    const {
      openaiModel3MaxTokens = 0,
      openaiModel3MaxTokensRes = 0,
      openaiModel3MaxTokens16k = 0,
      openaiModel3MaxTokens16kRes = 0,
      openaiModel4MaxTokens = 0,
      openaiModel4MaxTokensRes = 0,
      openaiModel4MaxTokens32k = 0,
      openaiModel4MaxTokens32kRes = 0,
      openaiBaseUrl = '',
    } = await this.globalConfigService.getConfigs([
      'openaiModel3MaxTokens',
      'openaiModel3MaxTokensRes',
      'openaiModel3MaxTokens16k',
      'openaiModel3MaxTokens16kRes',
      'openaiModel4MaxTokens',
      'openaiModel4MaxTokensRes',
      'openaiModel4MaxTokens32k',
      'openaiModel4MaxTokens32kRes',
      'openaiBaseUrl',
    ]);

    let maxToken = null;
    let maxTokenRes = null;
    let proxyResUrl = null;
    let { model, maxModelTokens = 0, maxResponseTokens = 0, proxyUrl = '', key } = detailKeyInfo;

    if (model.toLowerCase().includes('gpt-4')) {
      maxModelTokens >= 8192 && (maxModelTokens = 8192);
      maxTokenRes >= 4096 && (maxModelTokens = 4096);
      maxToken = maxModelTokens || openaiModel4MaxTokens || 8192;
      maxTokenRes = maxResponseTokens || openaiModel4MaxTokensRes || 4096;

      if (model.toLowerCase().includes('32k')) {
        maxModelTokens >= 32768 && (maxModelTokens = 32768);
        maxTokenRes >= 16384 && (maxModelTokens = 16384);
        maxToken = maxModelTokens || openaiModel4MaxTokens32k || 32768;
        maxTokenRes = maxResponseTokens || openaiModel4MaxTokens32kRes || 16384;
      }

      if (model.toLowerCase().includes('1106')) {
        maxModelTokens >= 16380 && (maxModelTokens = 16380);
        maxTokenRes >= 4096 && (maxModelTokens = 4096);
        maxToken = maxModelTokens || 16380;
        maxTokenRes = maxResponseTokens || 4096;
      }
    }
    if (model.toLowerCase().includes('gpt-3')) {
      maxModelTokens >= 4096 && (maxModelTokens = 4096);
      maxTokenRes >= 2000 && (maxModelTokens = 2000);
      maxToken = maxModelTokens || openaiModel3MaxTokens || 4096;
      maxTokenRes = maxResponseTokens || openaiModel3MaxTokensRes || 2000;

      if (model.toLowerCase().includes('16k')) {
        maxModelTokens >= 16384 && (maxModelTokens = 16384);
        maxTokenRes >= 8192 && (maxModelTokens = 8192);
        maxToken = maxModelTokens || openaiModel3MaxTokens16k || 16384;
        maxTokenRes = maxResponseTokens || openaiModel3MaxTokens16kRes || 8192;
      }

      if (model.toLowerCase().includes('1106')) {
        maxModelTokens >= 16384 && (maxModelTokens = 16384);
        maxTokenRes >= 4096 && (maxModelTokens = 4096);
        maxToken = maxModelTokens || 16384;
        maxTokenRes = maxResponseTokens || 4096;
      }
    }

    proxyResUrl = proxyUrl || openaiBaseUrl || 'https://api.openai.com';
    if (maxTokenRes >= maxToken) {
      maxTokenRes = Math.floor(maxToken / 2);
    }
    return {
      key,
      maxToken,
      maxTokenRes,
      proxyResUrl,
    };
  }

  async setChatBoxType(req: Request, body) {
    try {
      const { name, icon, order, id, status } = body;
      if (id) {
        return await this.chatBoxTypeEntity.update({ id }, { name, icon, order, status });
      } else {
        return await this.chatBoxTypeEntity.save({ name, icon, order, status });
      }
    } catch (error) {
      console.log('error: ', error);
    }
  }

  async delChatBoxType(req: Request, body) {
    const { id } = body;
    if (!id) {
      throw new HttpException('非法操作！', HttpStatus.BAD_REQUEST);
    }
    const count = await this.chatBoxEntity.count({ where: { typeId: id } });
    if (count) {
      throw new HttpException('当前分类下有未处理数据不可移除！', HttpStatus.BAD_REQUEST);
    }
    return await this.chatBoxTypeEntity.delete({ id });
  }

  async queryChatBoxType() {
    return await this.chatBoxTypeEntity.find({
      order: { order: 'DESC' },
    });
  }

  async setChatBox(req: Request, body) {
    const { title, prompt, appId, order, status, typeId, id, url } = body;
    if (!typeId) {
      throw new HttpException('缺失必要参数！', HttpStatus.BAD_REQUEST);
    }
    try {
      const params: any = { title, order, status, typeId, url };
      params.appId = appId || 0;
      params.prompt = prompt || '';
      if (id) {
        return await this.chatBoxEntity.update({ id }, params);
      } else {
        return await this.chatBoxEntity.save(params);
      }
    } catch (error) {
      console.log('error: ', error);
    }
  }

  async delChatBox(req: Request, body) {
    const { id } = body;
    if (!id) {
      throw new HttpException('非法操作！', HttpStatus.BAD_REQUEST);
    }
    return await this.chatBoxEntity.delete({ id });
  }

  async queryChatBox() {
    const data = await this.chatBoxEntity.find({
      order: { order: 'DESC' },
    });
    const typeIds = [...new Set(data.map((t) => t.typeId))];
    const appIds = [...new Set(data.map((t) => t.appId))];
    const typeRes = await this.chatBoxTypeEntity.find({ where: { id: In(typeIds) } });
    const appRes = await this.appEntity.find({ where: { id: In(appIds) } });
    return data.map((item: any) => {
      const { typeId, appId } = item;
      item.typeInfo = typeRes.find((t) => t.id === typeId);
      item.appInfo = appRes.find((t) => t.id === appId);
      return item;
    });
  }

  async queryChatBoxFrontend() {
    const typeRes = await this.chatBoxTypeEntity.find({ order: { order: 'DESC' }, where: { status: true } });
    const boxinfos = await this.chatBoxEntity.find({ where: { status: true } });
    const appIds = [...new Set(boxinfos.map((t) => t.appId))];
    const appInfos = await this.appEntity.find({ where: { id: In(appIds) } });
    boxinfos.forEach((item: any) => {
      const app = appInfos.find((k) => k.id === item.appId);
      item.coverImg = app?.coverImg;
      return item;
    });
    return typeRes.map((t: any) => {
      t.childList = boxinfos.filter((box) => box.typeId === t.id && box.status);
      return t;
    });
  }

  async setChatPreType(req: Request, body) {
    try {
      const { name, icon, order, id, status } = body;
      if (id) {
        return await this.chatPreTypeEntity.update({ id }, { name, icon, order, status });
      } else {
        return await this.chatPreTypeEntity.save({ name, icon, order, status });
      }
    } catch (error) {
      console.log('error: ', error);
    }
  }

  async delChatPreType(req: Request, body) {
    const { id } = body;
    if (!id) {
      throw new HttpException('非法操作！', HttpStatus.BAD_REQUEST);
    }
    const count = await this.chatBoxEntity.count({ where: { typeId: id } });
    if (count) {
      throw new HttpException('当前分类下有未处理数据不可移除！', HttpStatus.BAD_REQUEST);
    }
    return await this.chatPreTypeEntity.delete({ id });
  }

  async queryChatPreType() {
    return await this.chatPreTypeEntity.find({
      order: { order: 'DESC' },
    });
  }

  async setChatPre(req: Request, body) {
    const { title, prompt, appId, order, status, typeId, id, url } = body;
    if (!typeId) {
      throw new HttpException('缺失必要参数！', HttpStatus.BAD_REQUEST);
    }
    try {
      const params: any = { title, prompt, order, status, typeId, url };
      if (id) {
        return await this.chatPreEntity.update({ id }, params);
      } else {
        return await this.chatPreEntity.save(params);
      }
    } catch (error) {
      console.log('error: ', error);
    }
  }

  async delChatPre(req: Request, body) {
    const { id } = body;
    if (!id) {
      throw new HttpException('非法操作！', HttpStatus.BAD_REQUEST);
    }
    return await this.chatPreEntity.delete({ id });
  }

  async queryChatPre() {
    const data = await this.chatPreEntity.find({
      order: { order: 'DESC' },
    });
    const typeIds = [...new Set(data.map((t) => t.typeId))];
    const typeRes = await this.chatPreTypeEntity.find({ where: { id: In(typeIds) } });
    return data.map((item: any) => {
      const { typeId, appId } = item;
      item.typeInfo = typeRes.find((t) => t.id === typeId);
      return item;
    });
  }

  async queryChatPreList() {
    const typeRes = await this.chatPreTypeEntity.find({ order: { order: 'DESC' }, where: { status: true } });
    const chatPreData = await this.chatPreEntity.find({ where: { status: true } });
    return typeRes.map((t: any) => {
      t.childList = chatPreData.filter((box) => box.typeId === t.id && box.status);
      return t;
    });
  }

  /* 通过模型拿到当前模型支持的最大上下文 */
  async getMaxTokenFromModelWithOpenAi(model: string, maxModelToken, maxResToken) {
    let maxToken = 4096;
    let maxRes = 2048;

    if (model.toLowerCase().includes('gpt-4')) {
      /* 普通的4 是8196最大token  32k为32768 */
      maxToken = maxModelToken >= 8196 ? 8196 : maxModelToken;
      maxRes = maxResToken >= 4096 ? 4096 : maxResToken;

      /* 32k模型最大回复 */
      if (model.toLowerCase().includes('32k')) {
        maxToken = maxModelToken >= 32768 ? 32768 : maxModelToken;
        maxRes = maxResToken >= 16000 ? 16000 : maxResToken;
      }

      /* gpt4 1106 或者 preview  最大 128k  回复最大 4096 */
      if (model.toLowerCase().includes('gpt-4-1106') || model.toLowerCase().includes('gpt-4-vision-preview')) {
        maxToken = maxModelToken >= 128000 ? 128000 : maxModelToken;
        maxRes = maxResToken >= 4096 ? 4096 : maxResToken;
      }
    }

    /* 3的模型 */
    if (model.toLowerCase().includes('gpt-3')) {
      /* 普通的模型 最大上下文4096   */
      maxToken = maxModelToken >= 4096 ? 4096 : maxModelToken;
      maxRes = maxResToken >= 2048 ? 2048 : maxResToken;

      if (model.toLowerCase().includes('16k')) {
        maxToken = maxModelToken >= 16384 ? 16384 : maxModelToken;
        maxRes = maxResToken >= 8000 ? 8000 : maxResToken;
      }

      if (model.toLowerCase().includes('1106')) {
        maxToken = maxModelToken >= 16384 ? 16384 : maxModelToken;
        maxRes = maxResToken >= 8000 ? 8000 : maxResToken;
      }
    }

    return {
      maxToken,
      maxRes,
    };
  }
}
