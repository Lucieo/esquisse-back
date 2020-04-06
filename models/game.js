const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const pubsub = require('../schema/pubsup');

const gameSchema = new Schema({
    players: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
    }],
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        default: "new"
    },
    sketchbooks:[{
        type: Schema.Types.ObjectId,
        ref: 'Sketchbook'
    }],
    turn:{
        type: String,
        default:0
    }
},
{
  timestamps: true
})

gameSchema.statics.checkCompletedTurn = async function (gameId) {
    const game = await this.findById(gameId)
    .populate('sketchbooks')
    .populate('players')
    // console.log(game.sketchbooks.forEach(element => {
    //     console.log(element.pages)
    // }))
    if(game.sketchbooks.every(sketchbook => sketchbook.pages.length>=((+game.turn)+1)
    )){
      console.log('ALL RESPONSES RECEIVED CALLED FROM GAME STATIC METHOD')
      game.turn=(+game.turn+1)
      if(+game.turn>=game.players.length){
        game.status="over";
      }
      await game.save()
      pubsub.publish("GAME_UPDATE", { gameUpdate: game});
      console.log('ALL RESPONSES RECEIVED DONE')
      setTimeout(() =>{
        pubsub.publish("TIME_TO_SUBMIT", {timeToSubmit: {id: game._id.toString()}});
        console.log("LOOPING FROM SUBMITQUEUE!")
      }, 60000);
    }
}

module.exports = mongoose.model('Game', gameSchema)
