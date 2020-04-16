const MongoClient = require('mongodb').MongoClient;
const mongoose = require('mongoose');
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true
}
const {
    // @see https://github.com/shelfio/jest-mongodb#3-configure-mongodb-client
    MONGO_URL
} = process.env;

module.exports = {
    dropDatabase: async (db) => {
        await db.dropDatabase();
    },
    setupConnection: async () => {
        const mongoConnection = await MongoClient.connect(MONGO_URL, options);
        const mongooseConnection = await mongoose.connect(MONGO_URL, options);
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

