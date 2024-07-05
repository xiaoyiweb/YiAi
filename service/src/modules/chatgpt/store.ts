import Keyv from 'keyv';
import { v4 as uuidv4 } from 'uuid';
import { get_encoding } from '@dqbd/tiktoken';
import { Logger } from '@nestjs/common';
import { includes } from 'lodash';

const tokenizer = get_encoding('cl100k_base');

export type Role = 'user' | 'assistant' | 'function';

interface Options {
  store: Keyv;
  namespace: string;
  expires?: number;
}

export interface MessageInfo {
  id: string;
  text: string;
  role: Role;
  name?: string;
  imageUrl?: string;
  activeModel?: string;
  usage: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  parentMessageId?: string;
  conversationId?: string;
}

export interface BuildMessageOptions {
  systemMessage?: string;
  parentMessageId: string;
  maxRounds?: number;
  maxModelToken?: number;
  maxResponseTokens?: number;
  name?: string;
  imageUrl?: string;
  activeModel?: string;
  model?: string;
}

// export interface BuildMessageRes {
//   message: any[]
//   numTokens: number
//   maxTokens: number
// }
export type BuildMessageRes = any[];

export interface NineStoreInterface {
  getData(id: string): Promise<string>;
  setData(message: MessageInfo, expires?: number): Promise<void>;
  getUuid(): string;
  buildMessageFromParentMessageId(string, opt?: BuildMessageOptions): Promise<any>;
}

export class NineStore implements NineStoreInterface {
  private namespace: string;
  private store: Keyv;
  private expires: number;

  constructor(options: Options) {
    const { store, namespace, expires } = this.formatOptions(options);
    this.store = store;
    this.namespace = namespace;
    this.expires = expires;
  }

  public formatOptions(options: Options) {
    const { store, expires = 1000 * 60 * 60 * 24 * 3, namespace = 'chat' } = options;
    return { store, namespace, expires };
  }

  public generateKey(key: any) {
    return this.namespace ? `${this.namespace}-${key}` : key;
  }

  public async getData(id: string): Promise<any> {
    const res = await this.store.get(id);
    return res;
  }

  public async setData(message: MessageInfo, expires = this.expires): Promise<void> {
    await this.store.set(message.id, message, expires);
  }

  /**
   * @desc 通过传入prompt和parentMessageId 递归往上拿到历史记录组装为模型需要的上下文、
   *       可以传入maxRounds限制最大轮次的对话 传入maxModelToken, maxResponseTokens 则通过计算上下文占用的token计算出最大容量
   */
  public async buildMessageFromParentMessageId(text: string, options: BuildMessageOptions) {
    let { maxRounds, maxModelToken, maxResponseTokens, systemMessage = '', name, imageUrl, model, activeModel } = options;
    let { parentMessageId } = options;
    let messages = [];
    let nextNumTokensEstimate = 0;
    // messages.push({ role: 'system', content: systemMessage, name })
    if (systemMessage) {
      const specialModels = ['gemini-pro', 'ERNIE', 'hunyuan'];
      const isSpecialModel = activeModel && specialModels.some((specialModel) => activeModel.includes(specialModel));
      if (isSpecialModel) {
        messages.push({ role: 'user', content: systemMessage, name });
        messages.push({ role: 'assistant', content: '好的', name });
      } else {
        messages.push({ role: 'system', content: systemMessage, name });
      }
    }
    const systemMessageOffset = messages.length;
    let round = 0;
    const uploadModels = ['gpt-4-vision-preview', 'gpt-4o', 'claude-3-5-sonnet-20240620'];
    // 特殊处理 gpt-4-vision-preview 模型
    if (uploadModels.includes(activeModel) && imageUrl) {
      const content = [
        {
          type: 'text',
          text: text,
        },
        {
          type: 'image_url',
          image_url: {
            url: imageUrl,
          },
        },
      ];
      messages.push({ role: 'user', content: content, name });
    } else if (uploadModels.includes(activeModel) && !imageUrl) {
      const content = [
        {
          type: 'text',
          text: text,
        },
      ];
      messages.push({ role: 'user', content: content, name });
    } else {
      // 处理 gpt-4-all 模型
      if ((model === 'gpt-4-all' || model === 'gpt-4o-all') && imageUrl) {
        text = imageUrl + '\n' + text;
      }
      messages.push({ role: 'user', content: text, name });
    }
    // Logger.debug(`发送的参数：${messages}`);

    let nextMessages = messages;
    do {
      // let parentId = '1bf30262-8f25-4a03-88ad-9d42d55e6f0b'
      /* 没有parentMessageId就没有历史  直接返回 */
      if (!parentMessageId) {
        break;
      }
      const parentMessage = await this.getData(parentMessageId);
      if (!parentMessage) {
        break;
      }
      const { text, name, role, imageUrl } = parentMessage;
      let content = text; // 默认情况下使用text作为content

      // 特别处理包含 imageUrl 的消息
      if (imageUrl) {
        if (uploadModels.includes(activeModel)) {
          if (role === 'assistant') {
            content = [{ type: 'text', text: text }];
          } else {
            content = [
              { type: 'text', text: text },
              { type: 'image_url', image_url: { url: imageUrl } },
            ];
          }
        }
      } else if (!imageUrl && uploadModels.includes(activeModel)) {
        content = [{ type: 'text', text: text }];
      }

      /* 将本轮消息插入到列表中 */
      nextMessages = nextMessages.slice(0, systemMessageOffset).concat([
        { role, content, name }, // 使用调整后的content
        ...nextMessages.slice(systemMessageOffset),
      ]);

      // Logger.debug(`nextMessages：${JSON.stringify(nextMessages, null, 2)}`);

      round++;
      /* 如果超出了限制的最大轮次 就退出 不包含本次发送的本身 */
      if (maxRounds && round >= maxRounds) {
        break;
      }
      /* 如果传入maxModelToken， maxResponseTokens 则判断是否超过边界   */
      if (maxModelToken && maxResponseTokens) {
        const maxNumTokens = maxModelToken - maxResponseTokens; // 模型最大token限制减去限制回复剩余空间
        /* 当前的对话历史列表合并的总token容量 */
        nextNumTokensEstimate = await this._getTokenCount(nextMessages);
        /* 200是添加的一个安全区间 防止少量超过 待优化 */
        const isValidPrompt = nextNumTokensEstimate + 200 <= maxNumTokens;
        /* 如果大于这个区间了说明本轮加入之后导致超过限制、则递归删除头部的对话轮次来保证不出边界 */
        if (!isValidPrompt) {
          nextMessages = this._recursivePruning(nextMessages, maxNumTokens, systemMessage);
        }
      }
      parentMessageId = parentMessage.parentMessageId;
    } while (true);
    const maxTokens = Math.max(1, Math.min(maxModelToken - nextNumTokensEstimate, maxResponseTokens));
    // Logger.debug(`本轮调用：模型：${model}`)
    console.log('本次携带上下文的长度', nextMessages.length, nextNumTokensEstimate);
    return { context: nextMessages, round: nextMessages.length, historyToken: nextNumTokensEstimate };
  }

  protected _getTokenCount(messages: any[]) {
    let text = messages.reduce((pre: string, cur: any) => {
      // 检查cur.content是否为数组
      if (Array.isArray(cur.content)) {
        // 提取并连接数组中的文本元素
        const contentText = cur.content
          .filter((item: { type: string }) => item.type === 'text')
          .map((item: { text: any }) => item.text)
          .join(' ');
        return pre + contentText;
      } else {
        // 如果不是数组，则直接添加
        return pre + (cur.content || '');
      }
    }, '');

    text = text.replace(/<\|endoftext\|>/g, '');
    return tokenizer.encode(text).length;
  }

  /* 递归删除 当token超过模型限制容量  删除到在限制区域内  */
  protected _recursivePruning(messages: MessageInfo[], maxNumTokens: number, systemMessage: string) {
    const currentTokens = this._getTokenCount(messages);
    if (currentTokens <= maxNumTokens) {
      return messages;
    }
    /* 有系统预设则跳过第一条删除 没有则直接删除 */
    messages.splice(systemMessage ? 1 : 0, 1);
    return this._recursivePruning(messages, maxNumTokens, systemMessage);
  }

  public getUuid() {
    return uuidv4();
  }
}
