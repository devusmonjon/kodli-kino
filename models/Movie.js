const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    fileId: { type: String, required: true, unique: true },
    caption: { type: String },
    code: { type: Number, required: true, unique: true },
    date: { type: Date, default: Date.now },
});

const Movie = mongoose.model('Movie', movieSchema);

module.exports = Movie;