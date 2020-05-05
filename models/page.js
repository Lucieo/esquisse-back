const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const pageSchema = new Schema({
    creator: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    pageType: {
        type: String,
    },
    content: {
        type: String,
        default: "",
    },
    createdAt: {
        type: Date,
        expires: 7200,
        default: Date.now,
    },
});

module.exports = mongoose.model("Page", pageSchema);
