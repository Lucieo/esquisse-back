const MongoClient = require('mongodb').MongoClient;
const mongoose = require('mongoose');
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true
}
const {
    MONGO_URI
} = process.env;

module.exports = {
    dropDatabase: async (db) => {
        await db.dropDatabase();
    },
    setupConnection: async () => {
        const mongoConnection = await MongoClient.connect(MONGO_URI, options);
        const mongooseConnection = await mongoose.connect(MONGO_URI, options);
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

