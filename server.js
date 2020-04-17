const { ApolloServer } = require('apollo-server-express');
const express = require('express');
const {
  User,
} = require('./models');
const { typeDefs, resolvers } = require('./schema');
const mongoose = require('mongoose');
var cors = require('cors');
const jwt = require('jsonwebtoken');
const { json } = require('express');
const debug = require('debug')('esquisse:server');

const app = express();


app.use(json({ limit: '2mb' }))
const {
  MONGO_URI
} = process.env;
debug(MONGO_URI)
debug(process.env.FRONT_URL)

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

const getUser = async (token) => {
  try {
    if (token) {
      const id = jwt.verify(token.split(' ')[1], process.env.SESSION_SECRET).id
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
    else {
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
  introspection: true
});

module.exports = {
  getUser
}


if (require.main === module) {
  const http = require('http');
  server.applyMiddleware({ app })
  const httpServer = http.createServer(app);
  server.installSubscriptionHandlers(httpServer);

  mongoose
    .connect(MONGO_URI)
    .then(result => {
      httpServer.listen({ port: process.env.PORT || 4000 }, ()=>debug(`🚀 Server ready`))
    })
}

