const mongoose = require('mongoose');
const _ = require('lodash');
const debug = require('debug')('esquisse:game');

const Schema = mongoose.Schema;
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
    sketchbooks: [{
        type: Schema.Types.ObjectId,
        ref: 'Sketchbook'
    }],
    turn: {
        type: String,
        default: 0
    },
    createdAt: {
        type: Date,
        expires: 900,
        default: Date.now
    }
})

gameSchema.methods.currentTurnIsOver = function () {
    const turnCount = (+this.turn) + 1;
    return this.sketchbooks.every(
        sketchbook => sketchbook.pages.length >= turnCount
    );
}

gameSchema.methods.isOver = function () {
    return this.status === 'over' || +this.turn >= this.players.length
}

gameSchema.statics.findByIdAndPopulate = function (gameId) {
    return this.findById(gameId)
        .populate('sketchbooks')
        .populate('players')
}

gameSchema.statics.checkCompletedTurn = async function (gameId) {
    const game = await this.findByIdAndPopulate(gameId);

    if (!game.currentTurnIsOver()) {
        return { isTurnCompleted: false, turn: game.turn };
    }

    debug('ALL RESPONSES RECEIVED CALLED FROM GAME STATIC METHOD')
    game.turn = (+game.turn + 1)
    if (game.isOver()) {
        game.status = "over";
    }
    await game.save()
    pubsub.publish("GAME_UPDATE", { gameUpdate: game });
    debug('ALL RESPONSES RECEIVED DONE')
    return { isTurnCompleted: true, turn: game.turn };
}

module.exports = mongoose.model('Game', gameSchema)
