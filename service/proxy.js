const http = require('http');
const https = require('https');

// 通过 1080 代理端口发送 openai 的 POST 请求
function requestCompletionsByOpenAI(openaiOfKey, postData) {
  const data = JSON.stringify(postData);
  return new Promise((resolve, reject) => {
    const openaiHost = 'api.openai.com';
    const openaiPath = '/v1/chat/completions';
    const proxy = http.request({
      // 裸机模式下填 127.0.0.1，docker 模式下填代理容器名(gost)
      host: 'gost',
      port: 1080,
      method: 'CONNECT',
      path: `${openaiHost}:443`,
    });
    proxy.on('connect', (res, socket) => {
      if (res.statusCode === 200) {
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
              'Content-Length': data.length,
            },
          },
          (res) => {
            let responseData = '';
            res.on('data', (chunk) => {
              responseData += chunk.toString();
            });
            res.on('end', () => {
              resolve({ status: true, result: JSON.parse(responseData) });
            });
          }
        );
        client.write(data);
        client.end();
      } else {
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
