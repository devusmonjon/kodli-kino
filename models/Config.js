const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
    admins: [{ type: Number, unique: true }],
    channels: [{
        channelName: { type: String, required: true },
        channelId: { type: String, unique: true },
        channelUserName: { type: String, unique: true },
    }],
    startMessage: { type: String, default: '' },
    date: { type: Date, default: Date.now },
});

const Config = mongoose.model('Config', configSchema);

module.exports = Config;