const fs = require('fs');
const https = require('https');

const express = require('express');
const bodyParser = require('body-parser');
const { AtomicInteger } = require('atomic');
const { requestCompletionsByOpenAI } = require('./proxy');
const { create, fetchModal, close } = require('./mongodb');

const openaiKey = process.env.OPENAI_KEY;
let request_success = new AtomicInteger(0);
let request_failure = new AtomicInteger(0);

const options = {
  key: fs.readFileSync('auth/chat-service-local.key'),
  cert: fs.readFileSync('auth/chat-service-local.crt'),
};

async function signal() {
  await close();
}

async function handle(req, res) {
  console.log(`Receive request`);
  const body = req.body;
  const user = await fetchModal('users', body.user);
  console.log(`User: ${JSON.stringify(user)}`);
  const openai = body.openai;
  requestCompletionsByOpenAI(openaiKey, openai).then((response) => {
    request_success = request_success.add(1);
    console.log(`Success Counts: ${request_success.get()}`);
    res.send(JSON.stringify(response.result));
  }).catch((response) => {
    request_failure = request_failure.add(1);
    console.log(`Failure Counts: ${request_success.get()}`);
  });
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
