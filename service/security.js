'use strict';
const https = require('https');

function checkSecurity(token, openid, content) {
  const postData = JSON.stringify({
    content: content,
    version: 2,
    scene: 3,
    openid: openid,
  });
  return new Promise((resolve, reject) => {
    // const client = https.request(
    //   {
    //     host: 'api.weixin.qq.com',
    //     path: `/wxa/msg_sec_check?access_token=${token}`,
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Content-Length': Buffer.byteLength(postData, 'UTF-8'),
    //     },
    //   },
    //   (res) => {
    //     let responseData = '';
    //     res.on('data', (chunk) => {
    //       responseData += chunk.toString();
    //     });
    //     res.on('end', () => {
    //       console.log(responseData);
    //       resolve(JSON.parse(responseData).result);
    //     });
    //   }
    // );
    // client.on('error', reject);
    // client.write(postData);
    // client.end();
    resolve({
      suggest: 'pass',
    });
  });
}

module.exports = { checkSecurity };
