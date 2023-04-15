const assert = require('assert');
const describe = require('mocha').describe;
const it = require('mocha').it;
const OpenAIService = require('../openai-service');

describe('openai', function () {
  it('openai service proxy connection', (done) => {
    new OpenAIService(
      '127.0.0.1',
      1080,
      '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'
    )
      .post('/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: '你好' }],
        temperature: 0.7,
      })
      .then((data) => {
        console.log(data);
        done();
      })
      .catch((error) => {
        console.log(error);
        done();
      });
  }).timeout(10000);
});
