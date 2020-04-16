const mongoose = require('mongoose');
const { DEFAULT_MODEL_EXPIRATION } = require('../config')
const Schema = mongoose.Schema;

const PAGE_TYPE = {
    INIT: 'init',
    GUESSING: 'guessing',
    DRAWING: 'drawing'
}

const pageSchema = new Schema({
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    pageType:{
        type: String,
        enum: [
            ...Object.values(PAGE_TYPE)
        ],
        default: PAGE_TYPE.INIT
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
        expires: DEFAULT_MODEL_EXPIRATION,
        default: Date.now
    }
})


module.exports = {
    Page: mongoose.model('Page', pageSchema),
    PAGE_TYPE
}
