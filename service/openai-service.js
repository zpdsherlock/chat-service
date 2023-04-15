'use strict';

const https = require('https');
const zlib = require('zlib');

const { Duplex } = require('stream');

const HttpsProxyAgent = require('https-proxy-agent');
const Deque = require('double-ended-queue');
const Track = require('./track');

function openaiHeaders(openaiKey, length) {
  return {
    Authorization: `Bearer ${openaiKey}`,
    'OpenAI-Organization': 'org-hPpXuIQHoIqsn7VoKUpfnj9W',
    'Content-Type': 'application/json',
    'Content-Encoding': 'gzip',
    'Accept-Encoding': 'gzip, deflate',
    'Content-Length': length,
  };
}

class StreamDuplex extends Duplex {
  constructor(options) {
    super(options);
    this.chunks = new Deque();
    this.ended = false;
  }

  _read(size) {
    const interval = setInterval(() => {
      while (!this.chunks.isEmpty()) {
        this.push(this.chunks.shift());
      }
      if (this.ended) {
        this.push(null);
        clearInterval(interval);
      }
    }, 500);
  }

  _write(chunk, encoding, callback) {
    const data = chunk.toString();
    this.chunks.push(data);
    callback();
  }

  end() {
    this.ended = true;
    return super.end();
  }
}

class OpenAIService {
  constructor(host, port, openaiKey) {
    this.proxyHost = host || '127.0.0.1';
    this.proxyPort = port || 1080;
    this.proxyAgent = new HttpsProxyAgent(`http://${host}:${port}`);
    this.openaiHost = 'api.openai.com';
    this.openaiKey = openaiKey;
    this.tracker = new Track();
  }

  post(requestPath, requestData, piper = undefined) {
    const postData = JSON.stringify(requestData);
    const duplex = piper ? new StreamDuplex() : undefined;
    return new Promise((resolve, reject) => {
      let ttfbTag = false;
      const ttfbIndex = this.tracker.track('ttfb');
      const openIndex = this.tracker.track('openai');
      const openaiServer = https.request(
        {
          host: this.openaiHost,
          path: requestPath,
          agent: this.proxyAgent,
          method: 'POST',
          headers: openaiHeaders(
            this.openaiKey,
            Buffer.byteLength(postData, 'UTF-8')
          ),
        },
        (response) => {
          if (response.statusCode === 200) {
            response.on('data', (chunk) => {
              if (!ttfbTag) {
                this.tracker.mark('ttfb', ttfbIndex);
                ttfbTag = true;
              }
              const body = Buffer.concat([chunk]);
              const encoding = response.headers['content-encoding'];
              let decodedBody = body;
              if (encoding === 'gzip') {
                decodedBody = zlib.gunzipSync(body);
              } else if (encoding === 'deflate') {
                decodedBody = zlib.inflateSync(body);
              }
              duplex?.write(decodedBody.toString());
            });
            response.on('error', reject);
            response.on('end', () => {
              this.tracker.mark('openai', openIndex);
              duplex?.end();
              this.tracker.print();
              resolve();
            });
          } else {
            reject(
              new Error('Proxy Service connected incorrectly when requesting.')
            );
          }
        }
      );
      openaiServer.on('error', reject);
      if (duplex) {
        piper(duplex);
      }
      openaiServer.write(postData);
      openaiServer.end();
    });
  }
}

module.exports = OpenAIService;
