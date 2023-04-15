const fs = require('fs');
const https = require('https');

const postData = JSON.stringify({
  user: {
    token: 'x',
    openid: '003',
  },
  openai: {
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: '你好' }],
    temperature: 0.7,
    stream: true,
  },
});
const options = {
  hostname: 'localhost',
  port: 9000,
  path: '/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData, 'UTF-8'),
  },
  ca: fs.readFileSync('auth/chat-service-local.crt'),
};
let ttfb = false;
console.time('ttfb');
console.time('openai');
const req = https.request(options, (res) => {
  res.on('data', (chunk) => {
    if (!ttfb) {
      console.timeEnd('ttfb');
      ttfb = true;
    }
    console.log(chunk.toString());
  });
  res.on('end', () => {
    console.timeEnd('openai');
  });
});
// 发送 openai 问题查询
console.log(postData);
req.write(postData);
req.end();
