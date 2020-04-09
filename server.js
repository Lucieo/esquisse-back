const { ApolloServer } = require('apollo-server-express');
const express = require('express');
const User = require('./models/user');
const Game = require('./models/game');
const Sketchbook = require('./models/sketchbook');
const Page = require('./models/page');
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
console.log(process.env.front_url)
// const corsOptions = {
//     origin: process.env.front_url,
//     credentials: true,
//   };
// app.use(cors(corsOptions));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

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
    introspection:true
  });

const http = require('http');
server.applyMiddleware({app})
const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

gameCleaningJob();

mongoose
.connect(MONGO_URI)
.then(result=>{
  httpServer.listen({ port: process.env.PORT || 4000 }, ()=>{
    console.log(`🚀 Server ready at ${server.graphqlPath}`);
  })
})

