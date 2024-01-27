// const AK = "58Uq1GPUPvGBoIKQ2NNrRk8I"
// const SK = "CB3i28zVY2O5Hyb5OCQomwOWrjKQKwMY"

// const AK = "VSUQWIV0FCyDC6FwfHo04jQ6"
// const SK = "1sv3lkXGOqwbyEUDFVMA5O5Y9L27LNtP"

const AK = "vdzYBsVGfz8eidePaZzT3nlC"
const SK = "ZMyEVTR1VhGlGcsReK9BHZjgpne9ujsC"

const axios = require('axios');



/**
 * 使用 AK，SK 生成鉴权签名（Access Token）
 * @return string 鉴权签名信息（Access Token）
 */
function getAccessToken() {
  let url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${AK}&client_secret=${SK}`;

  return new Promise((resolve, reject) => {
    axios.post(url)
      .then(response => {
        resolve(response.data.access_token);
      })
      .catch(error => {
        console.log('error: ', error);
        reject(error);
      });
  });
}


async function main() {
  const accessToken = await getAccessToken();
  const url = `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions?access_token=${accessToken}`;
  var options = {
    method: 'POST',
    url,
		responseType: 'stream',
    headers: {
      'Content-Type': 'application/json'
    },
    data: {
			stream: true,
      messages: [
        {
          role: "user",
          content: "请介绍一下你自己"
        }
      ]
    }
  };

  axios(options)
    .then(response => {
      const stream = response.data;
			let resData = ''
      stream.on('data', chunk => {
        // 处理每个数据块
        try {
					const lines = chunk
						.toString()
						.split("\n\n")
						.filter((line) => line.trim() !== "");
					
					for (const line of lines) {
							const message = line.replace("data: ", "");
							const parsed = JSON.parse(message);
							console.log('parsed: ', parsed);
						}
				} catch (error) {
					
				}
      });
      stream.on('end', () => {
        // 处理流的结束
        console.log('Stream end');
      });
    })
    .catch(error => {
      throw new Error(error);
    });
}

main();
