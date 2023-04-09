const http = require('http');
const https = require('https');

let tag = 0;
let counter = 0;
let perf_proxy = 0, perf_ttfb = 0, perf_openai = 0;

// 通过 1080 代理端口发送 openai 的 POST 请求
function requestCompletionsByOpenAI(openaiOfKey, postData) {
  const data = JSON.stringify(postData);
  tag += 1;
  
  const perf_tag = `p${tag}`;

  return new Promise((resolve, reject) => {
    const openaiHost = 'api.openai.com';
    const openaiPath = '/v1/chat/completions';
    console.time(`${perf_tag}_proxy`);
    const proxy = http.request({
      host: 'gost',
      port: 1080,
      method: 'CONNECT',
      path: `${openaiHost}:443`,
    });
    proxy.on('connect', (res, socket) => {
      if (res.statusCode === 200) {
        console.timeEnd(`${perf_tag}_proxy`);
        console.time(`${perf_tag}_openai`);
        console.time(`${perf_tag}_ttfb`);
        const agent = new https.Agent({ socket: socket, keepAlive: true });
        const client = https.request(
          {
            host: 'api.openai.com',
            path: openaiPath,
            agent: agent,
            method: 'POST',
            headers: {
              Authorization: `Bearer ${openaiOfKey}`,
              'OpenAI-Organization': 'org-hPpXuIQHoIqsn7VoKUpfnj9W',
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(data, 'UTF-8'),
            },
          },
          (res) => {
            counter += 1;
            console.timeEnd(`${perf_tag}_ttfb`);
            let responseData = '';
            res.on('data', (chunk) => {
              responseData += chunk.toString();
            });
            res.on('end', () => {
              console.timeEnd(`${perf_tag}_openai`);
              console.log(responseData);
              resolve({ status: true, result: JSON.parse(responseData) });
              console.log(`${counter}, ${perf_proxy}, ${perf_ttfb}, ${perf_openai}`);
            });
          }
        );
        client.on('error', (err) => {
          console.timeEnd(`${perf_tag}_ttfb`);
          console.timeEnd(`${perf_tag}_openai`);
          reject({
            status: false,
            result: {
              message: 'Service is not avaliable!',
            },
          });
        });
        client.write(data);
        client.end();
      } else {
        console.timeEnd(`${perf_tag}_proxy`);
        reject({
          status: false,
          result: {
            message: 'Service is not avaliable!',
          },
        });
      }
    });
    proxy.end();
  });
}

module.exports = {
  requestCompletionsByOpenAI,
};
