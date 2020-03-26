const mongoose = require('mongoose');
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
    turn:{
        type: Number,
        default: 0
    },
    sketchbooks:[{
        type: Schema.Types.ObjectId,
        ref: 'SketchBook'
    }]
})


module.exports = mongoose.model('Game', gameSchema)