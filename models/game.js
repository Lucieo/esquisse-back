const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { pubsub } = require('../schema');
const _ = require('lodash');
const debug = require('debug')('esquisse:game');

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

gameSchema.methods.currentTurnIsOver = function() {
    const turnCount = (+this.turn)+1;
    return this.sketchbooks.every(
        sketchbook => sketchbook.pages.length >= turnCount
    );
}

gameSchema.methods.isOver = function() {
   return this.status === 'over' || +this.turn >= this.players.length
}

const cacheKeyResolver = ({ _id, turn }) => `${_id}-${turn}`;
const memoizedPublishTimeToSubmit = _.memoize(({ _id, turn }, delay = 60000) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            pubsub.publish("TIME_TO_SUBMIT", {
                timeToSubmit: {
                    id: _id.toString(),
                    turn: parseInt(turn, 10) - 1
                }
            });
            debug("LOOPING FROM SUBMITQUEUE!")
            memoizedPublishTimeToSubmit.cache.delete(cacheKeyResolver({ _id, turn }));
            resolve();
        }, delay);
    })
}, cacheKeyResolver)
gameSchema.statics.publishTimeToSubmit = memoizedPublishTimeToSubmit;

gameSchema.statics.checkCompletedTurn = async function (gameId) {
    const game = await this.findById(gameId)
        .populate('sketchbooks')
        .populate('players')

    if(game.currentTurnIsOver()) {
      debug('ALL RESPONSES RECEIVED CALLED FROM GAME STATIC METHOD')
      game.turn=(+game.turn+1)
      if(game.isOver()){
        game.status="over";
      }
      await game.save()
      pubsub.publish("GAME_UPDATE", { gameUpdate: game});
      debug('ALL RESPONSES RECEIVED DONE')
      this.publishTimeToSubmit(game);
    }
}

module.exports = mongoose.model('Game', gameSchema)
