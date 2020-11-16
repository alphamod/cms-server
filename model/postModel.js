const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const postSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    postedBy: {
        type: Schema.Types.ObjectId,
        ref: "usersData",
        required: true
    },
    comments: [{
        comment: String,
        commentBy: {
            type: Schema.Types.ObjectId,
            ref: "usersData"
        }
    }]
});

const PostModel = mongoose.model('posts', postSchema);
module.exports = PostModel ;