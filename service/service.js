'use strict';
const OpenAIService = require('./openai-service');

const { checkSecurity } = require('./security');
const { fetchModal, updateModal } = require('./mongodb');

const openaiKey =
  process.env.OPENAI_KEY ||
  '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';

const defaultResponse = {
  msg_sec_check: true,
  choices: [
    {
      message: {
        role: 'assistant',
        content: '不好意思,这个问题不方便回答,请谅解!',
      },
    },
  ],
};

function handleOpenAI(requestUser, content, openai, piper) {
  return new Promise((resolve, reject) => {
    checkSecurity(requestUser.token, requestUser.openid, content)
      .then((checkResult) => {
        if (checkResult && checkResult.suggest === 'pass') {
          new OpenAIService('127.0.0.1', 1080, openaiKey)
            .post(requestUser.path || '/v1/chat/completions', openai, piper)
            .then((response) => {
              resolve(response);
            });
        } else {
          reject();
        }
      })
      .catch((error) => {
        reject();
      });
  });
}

function handleService(client, req, res) {
  const body = req.body;
  const requestUser = body.user;
  if (requestUser.token && requestUser.openid) {
    fetchModal(client, 'users', { id: requestUser.openid }).then((result) => {
      const messages = body.openai.messages.filter((v) => v.role === 'user');
      const content = messages[messages.length - 1].content;
      let contents;
      if (result.existing) {
        contents = result.value.contents.split('<###>');
        if (!content in contents) {
          contents.push(content);
        }
      } else {
        contents = [content];
      }
      updateModal(
        client,
        'users',
        {
          _id: result.value._id,
        },
        {
          contents: contents.join('<###>'),
        }
      ).then(() => {
        handleOpenAI(requestUser, content, body.openai, (stream) => {
          stream.pipe(res);
          stream.on('end', () => {
            res.end();
          });
        })
          .then(() => {})
          .catch(() => {
            res.send(defaultResponse);
          });
      });
    });
  } else {
    res.send(defaultResponse);
  }
}

module.exports = { handleService };
