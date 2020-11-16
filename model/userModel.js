const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    hash: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    }
});

const UserModel = mongoose.model('usersData', userSchema);
module.exports = UserModel ;