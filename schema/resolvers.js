
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
      const game = await Game.findById(gameId).populate('players').populate('sketchbooks');
      return game
    },
    getSketchbookInfo: async(parent, {sketchbookId}, context)=>{
      const sketchbook = await Sketchbook.findById(sketchbookId).populate('pages');
      return sketchbook;
    },
    getAllSketchbooks: async(parent, {gameId}, context)=>{
      console.log('END OF GAME')
      const endOfGame= await Game
      .findById(gameId)
      .populate({
        path:'sketchbooks',
        populate:{
          path:"pages",
          populate:{
            path:"creator"
          }
        },
      })
      return endOfGame.sketchbooks
    },
    getLastUserGames: async(parent, {}, context)=>{
      const games = await Game.find({players:{$all:[context.user.id]},status:"over"}, {status:1})
      .limit( 5 )
      return games
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
      const game = await Game.findById(gameId).populate('players');
      if(game.players.indexOf(context.user.id)<0){
        game.players.push(context.user);
        await game.save();
      }
      pubsub.publish("PLAYER_UPDATE", { 
        playerUpdate: {
          players:game.players,
          gameId: game.id,
          creator: game.creator
      } });
      return game
    },
    leaveGame: async (parent, {gameId}, context)=>{
      const game = await Game.findById(gameId).populate('players');
      if(game.players.indexOf(context.user.id)<0){
        game.players = game.players.filter(user=>{
          return user.id!==context.user.id
        });
        if(game.players.length===0) game.status = "abandonned"
        if((game.creator.toString()===context.user.id.toString()) && game.players.length>0){
          const newCreator = game.players[0].id
          game.creator = newCreator
        }
        await game.save();
      }
      pubsub.publish("PLAYER_UPDATE", { 
        playerUpdate: {
          players:game.players,
          gameId: game.id,
          creator: game.creator
      } });
      return game
    },
    changeGameStatus: async (parent, {gameId, newStatus}, context)=>{
      const game = await Game.findById(gameId).populate('players');
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
        creator: user,
        sketchbook: sketchbookId
      });
      await page.save();
      sketchbook.pages.push(page);
      await sketchbook.save();

      const game = await Game.findById(gameId);
      game.responses.push(user.id)
      await game.save();

      const gameCheck = await Game.findById(gameId).populate('players').populate('sketchbooks');
      if((game.turn===gameCheck.turn) && (game.status!=='over') && (gameCheck.responses.length===gameCheck.players.length)){
        endOfTurn= true;
        gameCheck.responses=[]
        //is it last turn?
        if(gameCheck.turn+1===gameCheck.players.length){
          gameCheck.status="over"
        }
        else{
          gameCheck.turn+=1
        }
        await gameCheck.save()
        pubsub.publish("GAME_UPDATE", { gameUpdate: gameCheck});
      }
      return {
        id : page.id
      }
    }
  },
  Subscription: {
    playerUpdate: {
      subscribe: withFilter(
        () => {
          return pubsub.asyncIterator(["PLAYER_UPDATE"])
        },
        (payload, variables) => {
         return payload.playerUpdate.gameId === variables.gameId;
        },
      ),
    },
    gameUpdate: {
      subscribe: withFilter(
        () => {          return pubsub.asyncIterator(["GAME_UPDATE"])
        },
        (payload, variables) => {
         return payload.gameUpdate.id === variables.gameId;
        },
      )
    }
  },
};

module.exports = resolvers;


