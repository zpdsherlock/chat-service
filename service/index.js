const fs = require('fs');
const https = require('https');

const express = require('express');
const bodyParser = require('body-parser');
const { requestCompletionsByOpenAI } = require('./proxy');
const { create, fetchModal, close } = require('./mongodb');

const openaiKey = process.env.OPENAI_KEY;

let request_success = 0,
  request_failure = 0;

const options = {
  key: fs.readFileSync('auth/chat-service-local.key'),
  cert: fs.readFileSync('auth/chat-service-local.crt'),
};

async function signal() {
  await close();
}

async function check_content(token, openid, content) {
  console.log(`Check Content: ${content}`);
  const body = {
    content: content,
    version: 2,
    scene: 4,
    openid: openid,
  };
  const data = JSON.stringify(content);
  return new Promise((resolve, reject) => {
    const client = https.request(
      {
        host: 'api.weixin.qq.com',
        path: `/wxa/msg_sec_check?access_token=${token}`,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data, 'UTF-8'),
        },
      },
      (res) => {
        let responseData = '';
        res.on('data', (chunk) => {
          responseData += chunk.toString();
        });
        res.on('end', () => {
          const result = JSON.parse(responseData);
          resolve(result.result);
        });
      }
    );
    client.write(JSON.stringify(body));
    client.end();
  });
}

async function handle(req, res) {
  console.log(`Receive request`);
  const body = req.body;
  const token = body.user.token;
  const openid = body.user.openid;
  const user = await fetchModal('users', body.user);
  console.log(`User: ${JSON.stringify(user)}`);
  const auther = await check_content(
    token,
    openid,
    JSON.stringify(body.openai)
  );
  if (auther.suggest === 'pass') {
    const openai = body.openai;
    requestCompletionsByOpenAI(openaiKey, openai)
      .then((response) => {
        request_success += 1;
        console.log(`Success Counts: ${request_success}`);
        res.send(JSON.stringify(response.result));
      })
      .catch((response) => {
        request_failure += 1;
        console.log(`Failure Counts: ${request_failure}`);
      });
  } else {
    request_success += 1;
    console.log(`Success Counts: ${request_success}`);
    res.send(
      JSON.stringify({
        msg_sec_check: true,
        choices: [
          {
            message: {
              role: 'assistant',
              content: '不好意思,这个问题不方便回答,请谅解!',
            },
          },
        ],
      })
    );
  }
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
