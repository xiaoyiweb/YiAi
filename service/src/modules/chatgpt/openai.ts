import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { get_encoding } from '@dqbd/tiktoken'
import { removeSpecialCharacters } from '@/common/utils';
import { ConsoleLogger, HttpException, HttpStatus, Logger } from '@nestjs/common';
import * as uuid from 'uuid';


const tokenizer = get_encoding('cl100k_base')

interface SendMessageResult {
  id?: string;
  text: string;
  role?: string;
  detail?: any;
}

function getFullUrl(proxyUrl) {
  const processedUrl = proxyUrl.endsWith('/') ? proxyUrl.slice(0, -1) : proxyUrl;
  const baseUrl = processedUrl || 'https://api.openai.com'
  return `${baseUrl}/v1/chat/completions`
}

export async function sendMessageFromOpenAi(messagesHistory, inputs, uploadService?) {
  const { onProgress, maxToken, apiKey, model, temperature = 0.8, proxyUrl, prompt } = inputs
  if (model.includes('dall')) {
    let result: any = { text: '', imageUrl: '' };
    try {
      const options: AxiosRequestConfig = {
        method: 'POST',
        url: `${proxyUrl}/v1/images/generations`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        data: {
          prompt: prompt,
          model: model,
          response_format: 'b64_json'
        },
      }
      const response: any = await axios(options);
      const { b64_json, revised_prompt } = response.data.data[0]
      const buffer = Buffer.from(b64_json, 'base64');
      let imgUrl = '';
      try {
        const filename = uuid.v4().slice(0, 10) + '.png';
        Logger.debug(`------> 开始上传图片！！！`, 'MidjourneyService');
        const buffer = Buffer.from(b64_json, 'base64');
        // imgUrl = await uploadService.uploadFileFromUrl({ filename, url })
        imgUrl = await uploadService.uploadFile({ filename, buffer });
        Logger.debug(`图片上传成功，URL: ${imgUrl}`, 'MidjourneyService');
      } catch (error) {
        Logger.error(`上传图片过程中出现错误: ${error}`, 'MidjourneyService');
      }
      result.imageUrl = imgUrl
      result.text = revised_prompt;
      onProgress && onProgress({ text: result.text })
      return result;
    } catch (error) {
      const status = error?.response?.status || 500;
      console.log('openai-draw error: ', JSON.stringify(error), status);
      const message = error?.response?.data?.error?.message;
      if (status === 429) {
        result.text = '当前请求已过载、请稍等会儿再试试吧！';
        return result;
      }
      if (status === 400 && message.includes('This request has been blocked by our content filters')) {
        result.text = '您的请求已被系统拒绝。您的提示可能存在一些非法的文本。';
        return result;
      }
      if (status === 400 && message.includes('Billing hard limit has been reached')) {
        result.text = '当前模型key已被封禁、已冻结当前调用Key、尝试重新对话试试吧！';
        return result;
      }
      if (status === 500) {
        result.text = '绘制图片失败，请检查你的提示词是否有非法描述！';
        return result;
      }
      if (status === 401) {
        result.text = '绘制图片失败，此次绘画被拒绝了！';
        return result;
      }
      result.text = '绘制图片失败，请稍后试试吧！';
      return result;
    }
  } else {
    let result: any = { text: '' };
    const options: AxiosRequestConfig = {
      method: 'POST',
      url: getFullUrl(proxyUrl),
      responseType: 'stream',
      headers: {
        'Content-Type': 'application/json',
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      data: {
        stream: true,
        temperature,
        model,
        messages: messagesHistory,
      },
    };

    if (model === 'gpt-4-vision-preview') {
      options.data.max_tokens = 2048;
    }

    return new Promise(async (resolve, reject) => {
      try {
        const response: any = await axios(options);
        const stream = response.data;

        stream.on('data', (chunk) => {
          const splitArr = chunk.toString().split('\n\n').filter((line) => line.trim() !== '');
          for (const line of splitArr) {
            const data = line.replace('data:', '');
            let ISEND = false;
            try {
              ISEND = JSON.parse(data).choices[0].finish_reason === 'stop';
            } catch (error) {
              ISEND = false;
            }
            /* 如果结束 返回所有 */
            if (ISEND) {
              result.text = result.text.trim();
              return result;
            }
            try {
              if (data !== " [DONE]" && data !== "[DONE]" && data != "[DONE] ") {
                const parsedData = JSON.parse(data);
                if (parsedData.id) {
                  result.id = parsedData.id;
                }
                if (parsedData.choices?.length) {
                  const delta = parsedData.choices[0].delta;
                  result.delta = delta.content;
                  if (delta?.content) result.text += delta.content;
                  if (delta.role) {
                    result.role = delta.role;
                  }
                  result.detail = parsedData;
                }
                onProgress && onProgress({ text: result.text })
              }
            } catch (error) {
              console.log('parse Error', data)
            }
          }
        });

        let totalText = '';
        messagesHistory.forEach(message => {
          totalText += message.content + ' ';
        });
        stream.on('end', () => {
          // 手动计算token
          if (result.detail && result.text) {
            const promptTokens = getTokenCount(totalText)
            const completionTokens = getTokenCount(result.text)
            result.detail.usage = {
              prompt_tokens: promptTokens,
              completion_tokens: completionTokens,
              total_tokens: promptTokens + completionTokens,
              estimated: true
            }
          }
          return resolve(result);
        });
      } catch (error) {
        reject(error)
      }
    })
  }
}

export function getTokenCount(text: string) {
  if (!text) return 0;
  // 确保text是字符串类型
  if (typeof text !== 'string') {
    text = String(text);
  }
  text = text.replace(/<\|endoftext\|>/g, '')
  return tokenizer.encode(text).length
}


