const mongoose = require('mongoose');

const seriesSchema = new mongoose.Schema({
    code: { type: Number, required: true, unique: true },
    date: { type: Date, default: Date.now },
});

const Series = mongoose.model('Serie', seriesSchema);

module.exports = Series;