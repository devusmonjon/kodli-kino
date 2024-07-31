const mongoose = require('mongoose');

const episodeSchema = new mongoose.Schema({
    fileId: { type: String, required: true, unique: true },
    caption: { type: String, required: true },
    code: { type: String, required: true },
    date: { type: Date, default: Date.now },
});

const Episode = mongoose.model('Episode', episodeSchema);

module.exports = Episode;