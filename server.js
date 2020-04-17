const { ApolloServer } = require('apollo-server-express');
const express = require('express');
const { typeDefs, resolvers } = require('./schema');
const getUser = require('./authentication/get-user');
const mongoose = require('mongoose');
var cors = require('cors');
const { json } = require('express');
const debug = require('debug')('esquisse:server');
const { MONGOOSE_OPTIONS } = require('./config');

const app = express();


app.use(json({ limit: '2mb' }))
const {
  MONGO_URI,
  FRONT_URL
} = process.env;
debug(`MONGO_URI=${MONGO_URI}`)
debug(`FRONT_URL=${FRONT_URL}`)
// const corsOptions = {
//     origin: FRONT_URL,
//     credentials: true,
//   };
// app.use(cors(corsOptions));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req, connection }) => {
    if (connection) {
      return connection.context;
    }
    else {
      const token = req.headers.authorization || '';
      const user = await getUser(token);
      return {
        user
      };
    }
  },
  playground: {
    settings: {
      'request.credentials': 'same-origin',
    },
  },
  introspection: true
});

server.applyMiddleware({ app })

module.exports = {
  app
}


if (require.main === module) {
  const http = require('http');
  const httpServer = http.createServer(app);
  server.installSubscriptionHandlers(httpServer);

  mongoose
    .connect(MONGO_URI, MONGOOSE_OPTIONS)
    .then(result => {
      httpServer.listen({ port: process.env.PORT || 4000 }, ()=>debug(`🚀 Server ready`))
    })
}

