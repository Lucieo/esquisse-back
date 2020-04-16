const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { Game } = require('./game');
const { DEFAULT_MODEL_EXPIRATION } = require('../config')
const debug = require('debug')('esquisse:sketchbook');

const sketchBookSchema = new Schema({
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    pages:[{
        type: Schema.Types.ObjectId,
        ref: 'Page'
    }],
    gameId:{
        type: Schema.Types.ObjectId,
        ref: 'Game'
    },
    createdAt: {
        type: Date,
        expires: DEFAULT_MODEL_EXPIRATION,
        default: Date.now
    }
})

module.exports = mongoose.model('Sketchbook', sketchBookSchema)
