const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// const { pubsub } = require('../schema');
const pubsub = require("../schema/pubsub");
const _ = require("lodash");
const debug = require("debug")("esquisse:game");

const gameSchema = new Schema({
    players: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    creator: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    status: {
        type: String,
        default: "new",
    },
    sketchbooks: [
        {
            type: Schema.Types.ObjectId,
            ref: "Sketchbook",
        },
    ],
    turn: {
        type: String,
        default: 0,
    },
    timer: {
        type: Date,
        required: false,
    },
    delay: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        expires: 7200,
        default: Date.now,
    },
});

gameSchema.methods.currentTurnIsOver = function () {
    return this.sketchbooks.every((sketchbook) => {
        return sketchbook.pages.length > +this.turn;
    });
};

gameSchema.methods.isNewTurn = function () {
    return this.sketchbooks.every((sketchbook) => {
        sketchbook.pages.length === +this.turn - 1;
    });
};

gameSchema.methods.isOver = function () {
    return this.status === "over" || +this.turn >= this.players.length;
};

const cacheKeyResolver = ({ _id, turn }) => `${_id}-${turn}`;
const memoizedPublishTimeToSubmit = _.memoize(({ _id, turn, delay }) => {
    return new Promise((resolve) => {
        //Odd means drawing mode - Even means guessing mode
        setTimeout(() => {
            pubsub.publish("TIME_TO_SUBMIT", {
                timeToSubmit: {
                    id: _id.toString(),
                    turn: parseInt(turn, 10) - 1,
                },
            });
            memoizedPublishTimeToSubmit.cache.delete(
                cacheKeyResolver({ _id, turn })
            );
            resolve();
        }, delay);
    });
}, cacheKeyResolver);
gameSchema.statics.publishTimeToSubmit = memoizedPublishTimeToSubmit;

gameSchema.statics.checkCompletedTurn = async function (gameId, mode) {
    const game = await this.findById(gameId)
        .populate("sketchbooks")
        .populate("players");

    if (game.currentTurnIsOver()) {
        game.turn = +game.turn + 1;
        if (process.env.MODE !== "TEST") {
            if (game.isOver()) {
                game.status = "over";
            }
        }
        let delay;
        if (process.env.MODE === "TEST") {
            delay = game.turn % 2 == 0 ? 15000 : 15000;
        } else {
            delay = game.turn % 2 == 0 ? 60000 : 90000;
        }
        const timer = new Date();
        timer.setSeconds(timer.getSeconds() + delay / 1000 + 1);
        game.timer = timer;
        game.delay = delay;
        await game.save();
        pubsub.publish("GAME_UPDATE", { gameUpdate: game });
        this.publishTimeToSubmit(game);
    }
};

module.exports = mongoose.model("Game", gameSchema);
