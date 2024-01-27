import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { get_encoding } from '@dqbd/tiktoken'
import { removeSpecialCharacters } from '@/common/utils';

const tokenizer = get_encoding('cl100k_base')

interface SendMessageResult {
  id?: string;
  text: string;
  role?: string;
  detail?: any;
}

function getFullUrl(proxyUrl){
  const processedUrl = proxyUrl.endsWith('/') ? proxyUrl.slice(0, -1) : proxyUrl;
  const baseUrl = processedUrl || 'https://api.openai.com'
  return `${baseUrl}/v1/chat/completions`
}

export  function sendMessageFromOpenAi(messagesHistory,  inputs ){
  const { onProgress, maxToken, apiKey, model, temperature = 0.95, proxyUrl } = inputs
  console.log('current request options: ',apiKey, model, maxToken, proxyUrl );
  const max_tokens = compilerToken(model,  maxToken)
  const options: AxiosRequestConfig = {
    method: 'POST',
    url: getFullUrl(proxyUrl),
    responseType: 'stream',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${removeSpecialCharacters(apiKey)}`,
    },
    data: {
      max_tokens,
      stream: true,
      temperature,
      model,
      messages: messagesHistory
    },
  };
  const prompt = messagesHistory[messagesHistory.length-1]?.content
  return new Promise(async (resolve, reject) =>{
    try {
      const response: any = await axios(options);
      const stream = response.data;
      let result: any = { text: '' };
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
          if (data === '[DONE]' || ISEND) {
            result.text = result.text.trim();
            return result;
          }
          try {
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
            onProgress && onProgress({text:result.text})
          } catch (error) {
            console.log('parse Error', data )
          }
        }
      });
  
      stream.on('end', () => {
        // 手动计算token
        if(result.detail && result.text){
          const promptTokens = getTokenCount(prompt)
          const completionTokens = getTokenCount(result.text)
          result.detail.usage = {
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens ,
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



export function getTokenCount(text: string) {
  if(!text) return 0;
  text = text.replace(/<\|endoftext\|>/g, '')
  return tokenizer.encode(text).length
}

function compilerToken(model, maxToken){
  let max = 0

  /* 3.5 */
  if(model.includes(3.5)){
    max = maxToken > 4096 ? 4096 : maxToken
  }

  /* 4.0 */
  if(model.includes('gpt-4')){
    max = maxToken > 8192 ? 8192 : maxToken
  }

  /* 4.0 preview */
  if(model.includes('preview')){
    max = maxToken > 4096 ? 4096 : maxToken
  }

  /* 4.0 32k */
  if(model.includes('32k')){
    max = maxToken > 32768 ? 32768 : maxToken
  }
 
  return max
}