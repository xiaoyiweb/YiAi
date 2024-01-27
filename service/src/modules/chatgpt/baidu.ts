const axios = require('axios')

/* 文档地址 https://cloud.baidu.com/doc/WENXINWORKSHOP/s/Nlks5zkzu */
const getApiModelMaps = () => {
  let res = {}
  const maps = {
    'ERNIE-Bot': 'completions',
    'ERNIE-Bot-turbo': 'eb-instant',
    'BLOOMZ-7B': 'bloomz_7b1',
    'ERNIE-Bot-4': 'completions_pro',
    'Llama-2-7b-chat': 'llama_2_7b',
    'Llama-2-13b-chat': 'llama_2_13b',
    // 'Llama-2-70b-chat': 'llama_2_70b',
    'ChatGLM2-6B-32K': 'chatglm2_6b_32k',
    // 'Qianfan-BLOOMZ-7B-compressed': 'qianfan_bloomz_7b_compressed',
    'Qianfan-Chinese-Llama-2-7B': 'qianfan_chinese_llama_2_7b',
    // 'AquilaChat-7B': 'aquilachat_7b'
  }
   Object.keys(maps).map( key => {
    res[`${key.toLowerCase()}`] = maps[key]
  })
  return res
}

/**
 * 生成鉴权签名（Access Token）
 * @return string 鉴权签名信息（Access Token）
 */
export function getAccessToken(key, secret) {
  let url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${key}&client_secret=${secret}`;
  return new Promise((resolve, reject) => {
    axios
      .post(url)
      .then((response) => {
        resolve(response.data.access_token);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export function sendMessageFromBaidu(messagesHistory, { onProgress, accessToken, model, temperature = 0.95 }) {
  const endUrl = getApiModelMaps()[model.trim().toLowerCase()]
  return new Promise((resolve, reject) => {
    const url = `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/${endUrl}?access_token=${accessToken}`;
    var options = {
      method: 'POST',
      url,
      responseType: 'stream',
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        stream: true,
        messages: messagesHistory,
      },
    };

    axios(options)
      .then((response) => {
        const stream = response.data;
        let resData: any = {};
        let cacheChunk = '';
        let cacheResText = ''
        stream.on('data', (chunk) => {
          // 处理每个数据块
          const lines = chunk
            .toString()
            .split('\n\n')
            .filter((line) => line.trim() !== '');
            
          for (const line of lines) {
            const message = line.replace('data: ', '');
            try {
              const msg = cacheChunk + message;
              const parseData = JSON.parse(msg);
              cacheChunk = '';
              const { is_end, result } = parseData
              result && (cacheResText += result)
              if (is_end) {
                resData = parseData
                resData.text = cacheResText
              }
              onProgress(parseData);
            } catch (error) {
              cacheChunk = message;
            }
          }
        });
        stream.on('end', () => {
          cacheResText = ''
          cacheChunk = ''
          resolve(resData);
        });
      })
      .catch((error) => {
        reject(new Error(error));
      });

  });
}
