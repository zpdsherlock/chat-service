const fs = require('fs');
const https = require('https');
const bodyParser = require('body-parser');
const express = require('express');

const { create, close } = require('./mongodb');
const { handleService } = require('./service');

const options = {
  key: fs.readFileSync('auth/chat-service-local.key'),
  cert: fs.readFileSync('auth/chat-service-local.crt'),
};

let globalClient = undefined;

async function signal() {
  await close(globalClient);
  globalClient = null;
}

function main() {
  create().then((client) => {
    globalClient = client;
    const app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    app.post('/', (req, res) => {
      try {
        handleService(client, req, res);        
      } catch (error) {
        res.end();
      }
    });

    https.createServer(options, app).listen(9000, () => {
      console.log('Server listening on port 9000');
    });
    process.on('SIGINT', signal);
  });
}

main();
