
const bcrypt = require('bcrypt');
const User = require('../models/user');
const Game = require('../models/game');
const Sketchbook = require('../models/sketchbook');
const Page = require('../models/page');
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
    },
    getSketchbookInfo: async(parent, {sketchbookId}, context)=>{
      const sketchbook = await Sketchbook.findById(sketchbookId).populate('pages');
      console.log("SKETCHBOOK INFO", sketchbook)
      return sketchbook;
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
        id: game.id
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
      if(newStatus==="active"){
        game.players.forEach(
          creator=>{
            const sketchbook = new Sketchbook({
              creator
            });
            sketchbook.save()
            game.sketchbooks.push(sketchbook)
          }
        )
      }
      game.save();
      pubsub.publish("GAME_UPDATE", { gameUpdate: game});
      return game;
    },
    submitPage: async(parent, {sketchbookId, content, pageType, gameId}, {user})=>{
      const sketchbook = await Sketchbook.findById(sketchbookId);
      const page = new Page({
        content,
        pageType,
        creator: user
      });
      page.save();
      sketchbook.pages.push(page);
      const game = await Game.findById(gameId);
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
    gameUpdate: {
      subscribe: withFilter(
        () => {
          console.log('SUBSCRIPTION GAME UPDATE INITIATED');
          return pubsub.asyncIterator(["GAME_UPDATE"])
        },
        (payload, variables) => {
          console.log('SHOULD PASSE GAME UPDATE NEWS? ', payload.gameUpdate.id === variables.gameId )
         return payload.gameUpdate.id === variables.gameId;
        },
      )
    }
  },
};

module.exports = resolvers;


