const fs = require('fs');
const https = require('https');

const requestData = JSON.stringify({
  user: {
    id: '001',
    token: 'x',
    openid: 'x',
  },
  openai: {
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Say this is a test!' }],
    temperature: 0.7,
  },
});
const options = {
  hostname: 'localhost',
  port: 9000,
  path: '/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': requestData.length,
  },
  ca: fs.readFileSync('auth/chat-service-local.crt'),
};
console.time('openai');
const req = https.request(options, (res) => {
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk.toString();
  });
  res.on('end', () => {
    console.timeEnd('openai');
    // 获取 openai 回答结果
    console.log(responseData);
  });
});
// 发送 openai 问题查询
console.log(requestData);
req.write(requestData);
req.end();
