const { MongoClient } = require('mongodb');
const uri =
  'mongodb://gost:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.8.0';
const dbName = 'chatDB';

function create() {
  return new MongoClient(uri).connect();
}

function fetchModal(client, collectionName, modal) {
  return new Promise((resolve, reject) => {
    const db = client.db('chatDB');
    const collection = db.collection(collectionName);
    collection
      .find(modal)
      .toArray()
      .then((records) => {
        if (records.length > 0) {
          resolve({
            existing: true,
            value: records[0],
          });
        } else {
          collection
            .insertOne(modal)
            .then(() => {
              resolve({
                existing: false,
                value: modal,
              });
            })
            .catch(reject);
        }
      })
      .catch(reject);
  });
}

function updateModal(client, collectionName, filter, update) {
  return new Promise((resolve, reject) => {
    const db = client.db('chatDB');
    const collection = db.collection(collectionName);
    collection
      .updateOne(filter, {
        $set: update,
      })
      .then((result) => {
        console.log(
          `${result.matchedCount} document(s) matched the query criteria.`
        );
        console.log(`${result.modifiedCount} document(s) was/were updated.`);
        resolve();
      })
      .catch(reject);
  });
}

function close(client) {
  return client.close();
}

module.exports = {
  create,
  fetchModal,
  updateModal,
  close,
};
