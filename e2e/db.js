const MongoClient = require('mongodb').MongoClient;
const mongoose = require('mongoose');

const { MONGO_URI } = process.env;
const dbName = MONGO_URI.split('/').pop()
const client = new MongoClient(MONGO_URI, { useNewUrlParser: true });
const clientIsConnected = client.connect();
const mongooseIsConnected = mongoose.connect(MONGO_URI, { useNewUrlParser: true });

module.exports = {
    dropDatabase: () => {
        return Promise.all([
            clientIsConnected,
            mongooseIsConnected
        ]).then(err => {
            return client.db(dbName).dropDatabase();
        });
    },
    closeConnections: () => {
        return Promise.all([
            clientIsConnected,
            mongooseIsConnected
        ]).then(() => {
            return Promise.all([
                mongoose.disconnect(),
                client.close()
            ]);
        })
    }
}

