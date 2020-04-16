const mongoose = require('mongoose');
const debug = require('debug')('esquisse:game');
const { DEFAULT_MODEL_EXPIRATION } = require('../config')

const GAME_STATUS = {
    OVER: "over",
    ACTIVE: "active",
    NEW: "new",
    ABANDONNED: "abandonned"
}

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
        default: GAME_STATUS.NEW
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
        expires: DEFAULT_MODEL_EXPIRATION,
        default: Date.now
    }
})

//Odd means drawing mode
gameSchema.virtual('isCurrentlyInDrawingMode').get(function () {
    return this.turn % 2 != 0;
})

// Even means guessing mode
gameSchema.virtual('isCurrentlyInGuessingMode').get(function () {
    return this.turn % 2 == 0;
})

gameSchema.methods.currentTurnIsOver = function () {
    const turnCount = (+this.turn) + 1;
    return this.sketchbooks.every(
        sketchbook => sketchbook.pages.length >= turnCount
    );
}

gameSchema.methods.hasStatus = function (status) {
    return status === this.status;
}

gameSchema.methods.isOver = function () {
    return this.status === GAME_STATUS.OVER || +this.turn >= this.players.length
}

gameSchema.statics.findByIdAndPopulate = function (gameId) {
    return this.findById(gameId)
        .populate('sketchbooks')
        .populate('players')
}

gameSchema.statics.checkCompletedTurn = async function (gameId) {
    const game = await this.findByIdAndPopulate(gameId);
    debug(`checkCompletedTurn`)

    if (!game.currentTurnIsOver()) {
        debug(`checkCompletedTurn currentTurnIsOver=false`)
        return {
            isTurnCompleted: false,
            game
        };
    }

    debug('ALL RESPONSES RECEIVED CALLED FROM GAME STATIC METHOD')
    game.turn = (+game.turn + 1)
    if (game.isOver()) {
        game.status = GAME_STATUS.OVER;
    }
    await game.save()
    debug('ALL RESPONSES RECEIVED DONE')
    return { isTurnCompleted: true, game };
}

module.exports = {
    Game: mongoose.model('Game', gameSchema),
    GAME_STATUS,
}
