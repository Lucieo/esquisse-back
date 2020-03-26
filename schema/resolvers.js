
const bcrypt = require('bcrypt');
const User = require('../models/user');
const Game = require('../models/game');
const jwt = require('jsonwebtoken');
const { PubSub } = require('apollo-server-express');
const { withFilter } = require('apollo-server-express');


const pubsub = new PubSub();

const resolvers = {
  Query: {
    currentUser: async (parent, args, { user }) => {
      if (!user) {
        throw new Error('Not Authenticated')
      }
      return user
    },
    getGameInfo: async(parent, {gameId}, {user})=>{
      const game = await Game.findById(gameId).populate('players');
      return game
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
          expiresIn: '30d',
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
        players : [context.user.id]
      });
      game.save();
      return {
        gameId: game.id
      };
    },
    joinGame: async (parent, {gameId}, context)=>{
      const game = await Game.findById(gameId);
      if(game.players.indexOf(context.user.id)<0){
        game.players.push(context.user);
        await game.save();
      }
      pubsub.publish("PLAYER_JOINED", { playerJoined: {
        player:{
          id: context.user.id,
          email :context.user.email,
          name: context.user.name,
          icon: context.user.icon,
          iconColor: context.user.iconColor
        },
        gameId
      } });
      return game
    },
    changeGameStatus: async (parent, {gameId, newStatus}, context)=>{
      console.log("GAME STATUS CHANGE MUTATION CALLED")
      const game = await Game.findById(gameId);
      game.status = newStatus;
      game.save();
      const response = {
        gameId,
        status: newStatus
      }
      pubsub.publish("GAME_STATUS_CHANGE", { gameStatusChange: response});
      return response;
    }
  },
  Subscription: {
    playerJoined: {
      subscribe: withFilter(
        () => {
          console.log('PLAYER JOINED SUB INITIATED')
          return pubsub.asyncIterator(["PLAYER_JOINED"])
        },
        (payload, variables) => {
         return payload.playerJoined.gameId === variables.gameId;
        },
      ),
    },
    gameStatusChange: {
      subscribe: withFilter(
        () => {
          console.log('SUBSCRIPTION GAME STATUS CHANGE');
          return pubsub.asyncIterator(["GAME_STATUS_CHANGE"])
        },
        (payload, variables) => {
          console.log('GAME STATUS CHANGE SUB CALLED')
          console.log('payload', payload.gameStatusChange.gameId)
          console.log('var', variables.gameId)
          console.log(payload.gameStatusChange.gameId === variables.gameId)
         return payload.gameStatusChange.gameId === variables.gameId;
        },
      )
    }
  },
};

module.exports = resolvers;


