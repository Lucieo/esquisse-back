
const bcrypt = require('bcrypt');
const User = require('../models/user');
const Game = require('../models/game');
const jwt = require('jsonwebtoken');
const { PubSub } = require('apollo-server-express');

const pubsub = new PubSub();

const resolvers = {
  Query: {
    currentUser: async (parent, args, { user }) => {
      if (!user) {
        throw new Error('Not Authenticated')
      }
      return user
    }
  },
  Mutation: {
    signup: async (parent, {name, email, password }, context, info) => {
        const existingUser = await User.find({email});
        if (existingUser.length>0) {
          throw new Error('User with email already exists');
        }

        const hashedPw = await bcrypt.hash(password, 12);
        user = new User({            
            email,
            name,
            password: hashedPw,
            name
        });
        await user.save();
        console.log(user)
        return user;

    },
    login: async (parent, { email, password }, context) => {
      const user  = await User.findOne({email});
      if(!user){
        throw new Error('Invalid Login')
      }
      const passwordMatch = await bcrypt.compare(password, user.password)
      if(!passwordMatch){
        throw new Error('Invalid Login')
      }
      const token = jwt.sign(
        {
          id: user.id
        },
        process.env.SESSION_SECRET,
        {
          expiresIn: '1d',
        }
      )
      return {
        token,
        user,
      }
    },
    modifyUser: (parent, {name, icon, iconColor}, context)=>{
      const user = context.user;
      user.name= name;
      user.icon = icon;
      user.iconColor = iconColor;
      user.save();
      return user;
    },
    createGame: (parent, {}, context)=>{
      const game = new Game({
        creator: context.user.id,
      });
      game.save();
      return {
        gameId: game.id
      };
    },
    joinGame: async (parent, {gameId}, context)=>{
      const game = await Game.findById(gameId);
      console.log(context)
      game.players.push(context.user);
      await game.save();
      console.log(game.players)
      const playersInfo = await Game.findById(gameId).populate('players')
      console.log(playersInfo.players)
      pubsub.publish("PLAYERS_JOINED", { playersJoined: playersInfo.players });
      return game
    }
  },
  Subscription: {
    playersJoined: {
      subscribe: () => pubsub.asyncIterator(["PLAYERS_JOINED"]),
    },
  },
};

module.exports = resolvers;

