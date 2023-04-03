const express = require('express');
const https = require('https');
const bodyParser = require('body-parser');
const fs = require('fs');
const { requestCompletionsByOpenAI } = require('./proxy');
const { create, fetchModal, close } = require('./mongodb');
const openaiKey = process.env.OPENAI_KEY;

// chat-service-local 为 localtest 模式证书，上线需要使用 openssl 新建公域下的CA证书或自建证书
const options = {
  key: fs.readFileSync('auth/chat-service-local.key'),
  cert: fs.readFileSync('auth/chat-service-local.crt'),
};

async function signal() {
  await close();
}

async function handle(req, res) {
  const body = req.body;
  const user = await fetchModal('users', body.user);
  console.log(JSON.stringify(user));
  const openai = body.openai;
  const response = await requestCompletionsByOpenAI(openaiKey, openai);
  res.send(JSON.stringify(response.result));
}

async function main() {
  await create();
  const app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  app.post('/', handle);

  https.createServer(options, app).listen(9000, () => {
    console.log('Server listening on port 9000');
  });
  process.on('SIGINT', signal);
}

main();
