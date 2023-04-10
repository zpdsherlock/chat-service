const http = require('http');
const https = require('https');
const zlib = require('zlib');

const HttpsProxyAgent = require('https-proxy-agent');

const proxyHost = 'gost';
const proxyPort = 1080;
const proxy = new HttpsProxyAgent(`http://${proxyHost}:${proxyPort}`);

const openaiHost = 'api.openai.com';
const openaiPath = '/v1/chat/completions';

let success = 0,
  failure = 0;
let avgOpenAI = 0,
  minOpenAI = Infinity,
  maxOpenAI = 0;

function requestCompletionsByOpenAI(openaiOfKey, data) {
  const postData = JSON.stringify(data);
  return new Promise((resolve, reject) => {
    const openai = Date.now();
    const client = https.request(
      {
        host: openaiHost,
        path: openaiPath,
        agent: proxy,
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
        if (res.statusCode == 200) {
          let chunks = [];
          res.on('data', (chunk) => {
            chunks.push(chunk);
          });
          res.on('error', (error) => {
            failure++;
            console.log(
              `r=${
                (100 * success) / (success + failure)
              } %, success=${success}, failure=${failure}`
            );
            reject(error);
          });
          res.on('end', () => {
            const body = Buffer.concat(chunks);
            const encoding = res.headers['content-encoding'];
            let decodedBody = body;
            if (encoding === 'gzip') {
              decodedBody = zlib.gunzipSync(body);
            } else if (encoding === 'deflate') {
              decodedBody = zlib.inflateSync(body);
            }
            const responseData = decodedBody.toString();
            const responseObj = JSON.parse(responseData);
            console.log(JSON.stringify(responseObj));
            curr = Date.now() - openai;
            avgOpenAI = (avgOpenAI * success + curr) / (success + 1);
            success++;
            minOpenAI = curr < minOpenAI ? curr : minOpenAI;
            maxOpenAI = curr > maxOpenAI ? curr : maxOpenAI;
            console.log(
              `curr=${Number(curr).toFixed(2)} ms, \
              avg=${Number(avgOpenAI).toFixed(2)} ms, \
              min=${Number(minOpenAI).toFixed(2)} ms, \
              max=${Number(maxOpenAI).toFixed(2)} ms`
            );
            let r = (100 * success) / (success + failure);
            console.log(`r=${r} %, success=${success}, failure=${failure}`);
            resolve({ status: true, result: responseObj });
          });
        } else {
          failure++;
          console.log(
            `r=${
              (100 * success) / (success + failure)
            } %, success=${success}, failure=${failure}`
          );
          reject(Error(`Proxy Status is ${res.statusCode}`));
        }
      }
    );
    client.on('error', (error) => {
      failure++;
      console.log(
        `r=${
          (100 * success) / (success + failure)
        } %, success=${success}, failure=${failure}`
      );
      reject(error);
    });
    client.write(postData);
    client.end();
  });
}

module.exports = {
  requestCompletionsByOpenAI,
};
