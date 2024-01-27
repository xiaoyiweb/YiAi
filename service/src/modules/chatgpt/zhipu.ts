import { resolve } from "path";

const axios = require('axios')
const jwt = require('jsonwebtoken')


/* 生成token */
export function generateToken(apikey, expSeconds = 1000 * 60 * 60 * 24 * 360) {
  const [id, secret] = apikey.split('.');
  const payload = {
    api_key: id,
    exp: Math.round(Date.now()) + expSeconds * 1000,
    timestamp: Math.round(Date.now()),
  };
  // ts-ignore
  return jwt.sign(payload, secret, { algorithm: 'HS256', header: { alg: 'HS256', sign_type: 'SIGN' } });
}

/* 解析最后一次结果 */
export function compilerMetaJsonStr(data): any {
  let jsonStr = {}
  try {
    /*
      {
        task_status: 'SUCCESS',
        usage: { completion_tokens: 49, prompt_tokens: 719, total_tokens: 768 },
        task_id: '8008779509197849552',
        request_id: '8008779509197849552'
      }
    */
    jsonStr = JSON.parse(data)
  } catch (error) {
    /* 解析失败暂定一个固定值 待优化 */
    jsonStr = {
      usage: {
         completion_tokens: 49, 
         prompt_tokens: 333, 
         total_tokens: 399 
      },
    }
    console.error('json parse error from zhipu!', data)
  }
  return jsonStr;
}

/* 格式化信息并且输出为和百度一样的格式  前端不用变动了 */
export function compilerStream(streamArr) {
  if (streamArr.length === 3) {
    return {
      event: streamArr[0].replace('event:', ''),
      id: streamArr[1].replace('id:', ''),
      is_end: false,
      result: streamArr[2].replace('data:', '').trim()
    }
  }
  if (streamArr.length === 4) {
    return {
      event: streamArr[0].replace('event:', ''),
      id: streamArr[1].replace('id:', ''),
      result: streamArr[2].replace('data:', '').trim(),
      is_end: true,
      usage: compilerMetaJsonStr(streamArr[3].replace('meta:', ''))?.usage
    }
  }
}

export async function sendMessageFromZhipu(messagesHistory, { onProgress, key, model, temperature = 0.95 }) {
  const token = await generateToken(key)
  return new Promise((resolve, reject) => {
    const url = `https://open.bigmodel.cn/api/paas/v3/model-api/${model}/sse-invoke`;
    const options = {
      method: 'POST',
      url,
      responseType: 'stream',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      data: {
        prompt: messagesHistory,
        temperature
      }
    };
    axios(options)
      .then(response => {
        const stream = response.data;
        let resData;
        let cacheResText = ''
        stream.on('data', chunk => {
          const stramArr = chunk.toString().split("\n").filter((line) => line.trim() !== "")
          const parseData = compilerStream(stramArr)
          if (!parseData) return
          const { id, result, is_end } = parseData
          result && (cacheResText += result.trim())
          if (is_end) {
            parseData.is_end = false //为了在后续的消费之后添加上余额 本次并不是真正的结束
            resData = parseData
            resData.text = cacheResText
          }
          onProgress(parseData);
        });
        stream.on('end', () => {
          resolve(resData);
          cacheResText = ''
        });
      })
      .catch(error => {
        console.log('error: ', error);
      });

  })
}