const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const sketchBookSchema = new Schema({
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    pages:[{
        type: Schema.Types.ObjectId,
        ref: 'Page'
    }],
    drawingMode:{
        type: Boolean,
        default: false
    }
})


module.exports = mongoose.model('Sketchbook', sketchBookSchema)