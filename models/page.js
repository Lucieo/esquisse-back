const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const pageSchema = new Schema({
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    pages:[{
        type: Schema.Types.ObjectId,
        ref: 'Page'
    }]
})


module.exports = mongoose.model('Page', pageSchema)