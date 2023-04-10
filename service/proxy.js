const http = require('http');
const https = require('https');
const zlib = require('zlib');

const openaiHost = 'api.openai.com';
const openaiPath = '/v1/chat/completions';

let agent = undefined;

console.time('proxy');
const proxy = http.request({
  host: 'gost',
  port: 1080,
  method: 'CONNECT',
  path: `${openaiHost}:443`,
});
proxy.on('connect', (res, socket) => {
  if (res.statusCode === 200) {
    agent = new https.Agent({ socket: socket, keepAlive: true });
    console.timeEnd('proxy');
  } else {
    console.timeEnd('proxy');
  }
});
proxy.end();

let tag = 0;
let counter = 0;
let perf_proxy = 0,
  perf_ttfb = 0,
  perf_openai = 0;

function requestCompletionsByOpenAI(openaiOfKey, data) {
  const postData = JSON.stringify(data);
  tag += 1;

  const perf_tag = `p${tag}`;

  return new Promise((resolve, reject) => {
    console.time(`${perf_tag}_openai`);
    console.time(`${perf_tag}_ttfb`);
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
          'Content-Encoding': 'gzip',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Length': Buffer.byteLength(postData, 'UTF-8'),
        },
      },
      (res) => {
        counter += 1;
        console.timeEnd(`${perf_tag}_ttfb`);
        let chunks = [];
        res.on('data', (chunk) => {
          chunks.push(chunk);
        });
        res.on('end', () => {
          console.timeEnd(`${perf_tag}_openai`);
          const body = Buffer.concat(chunks);
          const encoding = res.headers['content-encoding'];
          let decodedBody = body;
          if (encoding === 'gzip') {
            decodedBody = zlib.gunzipSync(body);
          } else if (encoding === 'deflate') {
            decodedBody = zlib.inflateSync(body);
          }
          const responseData = decodedBody.toString();
          console.log(responseData);
          resolve({ status: true, result: JSON.parse(responseData) });
          console.log(
            `${counter}, ${perf_proxy}, ${perf_ttfb}, ${perf_openai}`
          );
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
    client.write(postData);
    client.end();
  });
}

module.exports = {
  requestCompletionsByOpenAI,
};
