const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: { type: Number, required: true, unique: true },
    firstName: String,
    lastName: String,
    username: String,
    date: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

module.exports = User;