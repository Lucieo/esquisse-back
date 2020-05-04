const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Game = require("../models/game");
const debug = require("debug")("esquisse:sketchbook");

const sketchBookSchema = new Schema({
    creator: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    pages: [
        {
            type: Schema.Types.ObjectId,
            ref: "Page",
        },
    ],
    gameId: {
        type: Schema.Types.ObjectId,
        ref: "Game",
    },
    createdAt: {
        type: Date,
        expires: 7200,
        default: Date.now,
    },
});

sketchBookSchema.post("save", async function (doc) {
    debug("PRE SAVE FROM SKETCHBOOK");
    if (this.pages.length > 0) {
        console.log("pre save sketchbook launc check completed turn");
        Game.checkCompletedTurn(doc.gameId);
    }
});

module.exports = mongoose.model("Sketchbook", sketchBookSchema);
