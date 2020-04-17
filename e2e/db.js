const MongoClient = require('mongodb').MongoClient;
const mongoose = require('mongoose');
const { MONGOOSE_OPTIONS } = require('../config')
const {
    MONGO_URI
} = process.env;

module.exports = {
    dropDatabase: (db) => {
        return db.dropDatabase();
    },
    setupConnection: async () => {
        const mongoConnection = await MongoClient.connect(MONGO_URI, MONGOOSE_OPTIONS);
        const mongooseConnection = await mongoose.connect(MONGO_URI, MONGOOSE_OPTIONS);
        return {
            connection: {
                async close() {
                    return Promise.all([
                        mongoConnection.close(),
                        mongooseConnection.disconnect(),
                    ])
                }
            },
            db: mongoConnection.db()
        }
    },
    closeConnection: async (connection) => {
        await connection.close();
    }
}

