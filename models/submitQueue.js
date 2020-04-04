const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Game = require('../models/game');
const pubsub = require('../schema/pubsup');


const submitQueueSchema = new Schema({
    gameId:[{
        type: Schema.Types.ObjectId,
        ref: 'Game'
    }]
},
{
  timestamps: true
})




submitQueueSchema.post('save', async function(doc) {
  const game = await Game.findById(doc.gameId)
  .populate('sketchbooks')
  .populate('players')

  if(game.sketchbooks.every(sketchbook => sketchbook.pages.length===((+game.turn)+1)
  )){
    console.log('ALL RESPONSES RECEIVED')
    game.turn=(+game.turn+1)
    console.log("game.turn ", game.turn)
    console.log("game.players.length ", game.players.length)
    if(+game.turn>=game.players.length){
      game.status="over";
    }
    await game.save()
    pubsub.publish("GAME_UPDATE", { gameUpdate: game});
    console.log('ALL RESPONSES RECEIVED DONE')
  }
});


module.exports = mongoose.model('SubmitQueue', submitQueueSchema)