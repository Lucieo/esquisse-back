const { ApolloServer } = require('apollo-server-express');
const express = require('express');
const User = require('./models/user');
const Game = require('./models/game');
const typeDefs = require('./schema/types');
const resolvers = require('./schema/resolvers');
const mongoose = require('mongoose');
var cors = require('cors');
const jwt = require('jsonwebtoken');
const {json} = require('express');
const {gameCleaningJob} = require('./cron-jobs')

const app = express();


app.use(json({ limit: '2mb' }))
const MONGO_URI = `mongodb+srv://${process.env.MONGO_ADMIN}:${process.env.MONGO_PASSWORD}@cluster0-jjo7q.mongodb.net/${process.env.MONGO_DB}`;
console.log(MONGO_URI)
const corsOptions = {
    origin: 'http://localhost:3000',
    credentials: true,
  };
app.use(cors(corsOptions));

const getUser = async (token) => {
  try {
    if (token) {
      const id = await jwt.verify(token.split(' ')[1], process.env.SESSION_SECRET).id
      const user = await User.findById(id);
      return user
    }
    return null
  } catch (err) {
    return null
  }
}



const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req, connection }) => {
        if (connection) {
          return connection.context;
        } 
        else{
          const token = req.headers.authorization || '';
          const user = await getUser(token)
          return {
            user
          }
        }
    },
    playground: {
      settings: {
        'request.credentials': 'same-origin',
      },
    },
  });

const http = require('http');
server.applyMiddleware({app})
const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

gameCleaningJob();

const PORT = 4000;
mongoose
.connect(MONGO_URI)
.then(result=>{
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`)
    console.log(`🚀 Subscriptions ready at ws://localhost:${PORT}${server.subscriptionsPath}`)
  })
})
