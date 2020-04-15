const mongoose = require('mongoose');
const { DEFAULT_EXPIRATION } = require('../config')
const Schema = mongoose.Schema;

const pageSchema = new Schema({
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    pageType:{
        type: String
    },
    content:{
        type: String
    },
    sketchbook:{
        type: Schema.Types.ObjectId,
        ref: 'Sketchbook'
    },
    createdAt: {
        type: Date,
        expires: DEFAULT_EXPIRATION,
        default: Date.now
    }
})


module.exports = mongoose.model('Page', pageSchema)
