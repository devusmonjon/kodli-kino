const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: { type: Number, required: true, unique: true },
    firstName: {type: String, required: true},
    lastName: {type: String, default: ""},
    username: {type: String, default: ""},
    step: {type: String, default: ""},
    date: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

module.exports = User;