const { ApolloServer } = require('apollo-server-express');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const uuid = require('uuid/v4');
const User = require('./models/user');
const { GraphQLLocalStrategy, buildContext } = require('graphql-passport');
const typeDefs = require('./schema/types');
const resolvers = require('./schema/resolvers');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const app = express();
const MONGO_URI = `mongodb+srv://${process.env.MONGO_ADMIN}:${process.env.MONGO_PASSWORD}@cluster0-jjo7q.mongodb.net/${process.env.MONGO_DB}`;


passport.use(
    new GraphQLLocalStrategy(async (email, password, done) => {
        let error = null;
        let matchingUser = null;
        const user = await User.findOne({email});
        if(!user){
            error = new Error('no matching user')
        }
        else{
            const matchingPassword = await bcrypt.compare(password, user.password);
            if(!matchingPassword){
                error = new Error('invalid credentials')
            }else{
                matchingUser = user;
            }
        }
      done(error, matchingUser);
    }),
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});
  
passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});

app.use(session({
    genid: (req) => uuid(),
    secret: process.env.SESSION_SECRECT,
    resave: false,
    saveUninitialized: false,
}));
  
app.use(passport.initialize());
app.use(passport.session());

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req, res }) => buildContext({ 
        req, 
        res, 
        User 
    }),
    playground: {
      settings: {
        'request.credentials': 'same-origin',
      },
    },
  });

server.applyMiddleware({ app });

mongoose
.connect(MONGO_URI)
.then(result=>{
    app.listen({ port: 4000 }, () => {
        console.log(`🚀 Server ready at http://localhost:4000`);
    });
})
