const assert = require('assert');
const describe = require('mocha').describe;
const it = require('mocha').it;
const { create, fetchModal, updateModal, close } = require('../mongodb');
const { v4: uuidv4 } = require('uuid');
const randomUUID = uuidv4();

describe('mongodb', function () {
  it('mongodb: checking non-existing document', (done) => {
    create().then((client) => {
      fetchModal(client, 'users', {
        id: randomUUID,
      }).then((result) => {
        updateModal(
          client,
          'users',
          {
            _id: result.value._id,
          },
          { extra: 'extra' }
        ).then(() => {
          close(client).then(() => {
            console.log(JSON.stringify(result.value));
            assert.equal(result.existing, false);
            done();
          });
        });
      });
    });
  });
});

describe('mongodb', function () {
  it('mongodb: checking existing document', (done) => {
    create().then((client) => {
      fetchModal(client, 'users', {
        id: randomUUID,
      }).then((result) => {
        close(client).then(() => {
          console.log(JSON.stringify(result.value));
          assert.equal(result.existing, true);
          done();
        });
      });
    });
  });
});
