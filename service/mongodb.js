const { MongoClient } = require('mongodb');
const uri =
  'mongodb://mongodb:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.8.0';
const dbName = 'chatDB';

let client = null;

async function create() {
  if (client == null) {
    client = await new MongoClient(uri).connect();
  }
}

async function fetchModal(collectionName, modal) {
  const db = client.db('chatDB');
  const collection = db.collection(collectionName);
  const records = await collection.find(modal).toArray();
  if (records.length > 0) {
    return records[0];
  } else {
    await collection.insertOne(modal);
    return modal;
  }
}

async function close() {
  await client.close();
  client = null;
}

module.exports = {
  create,
  fetchModal,
  close,
};
