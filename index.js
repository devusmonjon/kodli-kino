const { Telegraf } = require('telegraf');
const express = require('express');
const app = express();

const bot = new Telegraf(process.env.TOKEN);

bot.start((ctx) => ctx.reply('Welcome'));
bot.on('text', (ctx) => ctx.reply('Hello World'));

app.use(bot.webhookCallback(`/bot${process.env.TOKEN}`));

// This route is used to set the webhook
app.get('/setWebhook', async (req, res) => {
    try {
        await bot.telegram.setWebhook(`https://${req.get('host')}/bot${process.env.TOKEN}`);
        res.send('Webhook set');
    } catch (error) {
        res.send(error.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
