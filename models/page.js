const mongoose = require('mongoose');
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
    }
},
{
  timestamps: true
})


module.exports = mongoose.model('Page', pageSchema)