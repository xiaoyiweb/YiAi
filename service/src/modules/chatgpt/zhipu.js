const AK = "58Uq1GPUPvGBoIKQ2NNrRk8I"
const SK = "CB3i28zVY2O5Hyb5OCQomwOWrjKQKwMY"

const axios = require('axios');
const jwt = require('jsonwebtoken');

function generateToken(apikey, expSeconds) {
  const [id, secret] = apikey.split('.');
  const payload = {
    api_key: id,
    exp: Math.round(Date.now()) + expSeconds * 1000,
    timestamp: Math.round(Date.now()),
  };
  return jwt.sign(payload, secret, { algorithm: 'HS256',  header: { alg: 'HS256', sign_type: 'SIGN' }});
}
const key = '6f3e78ee46553487a30d1404882e435a.6AWDxxlNDGjHioew'

async function test() {
  const token = await generateToken(key, 600000)
  console.log('token: ', token);
  const url = `https://open.bigmodel.cn/api/paas/v3/model-api/chatglm_pro/sse-invoke`;
  var options = {
    method: 'POST',
    url,
		responseType: 'stream',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token
    },
    data: {
      prompt: [
        {
          role: "user",
          content: "请介绍下自己"
        }
      ]
    }
  };

  axios(options)
    .then(response => {
      const stream = response.data;
			let resData;
      let cacheResText = ''
      stream.on('data', chunk => {
        const stramArr =  chunk.toString().split("\n").filter((line) => line.trim() !== "")
        const parseData = compilerStream(stramArr)
        if(!parseData) return
        const { event, id, result, meta, is_end } = parseData
        result && (cacheResText += result.trim())
        if (is_end) {
          resData = parseData
          resData.text = cacheResText
        }
      });
      stream.on('end', () => {
        console.log(resData,'结束了')
      });
    })
    .catch(error => {
      throw new Error(error);
    });
}


/* 格式化信息并且输出为和百度一样的格式  前端不用变动了 */
function compilerStream(streamArr){
  if(streamArr.length === 3){
    return {
      event: streamArr[0].replace('event:', ''),
      id: streamArr[1].replace('id:', ''),
      is_end: false,
      result: streamArr[2].replace('data:', '').trim()
    }
  }
  if(streamArr.length === 4){
    console.log('streamArr: ', streamArr);
    return {
      event: streamArr[0].replace('event:', ''),
      id: streamArr[1].replace('id:', ''),
      result: streamArr[2].replace('data:', '').trim(),
      is_end: true,
      meta: compilerMetaJsonStr(streamArr[3].replace('meta:', ''))
    }
  }
}

function compilerMetaJsonStr(data){
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
    console.error('序列化数据出错', data)
  }
  return jsonStr;
}

test();
