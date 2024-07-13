const { Telegraf } = require('telegraf');
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const User = require('./models/User');
const Config = require('./models/Config');
require('dotenv').config();

const token = process.env.TOKEN;

const bot = new Telegraf(token);

app.use(bot.webhookCallback(`/bot${token}`));


// MongoDB connection
mongoose.connect("process.env.MONGODB_URI", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

 /* new Config({ admins: [5089466631], channels: [{
    channelId: -1002125029359,
        channelName: "Dorama Dunyosi",
        channelUserName: "dorama_dunyosi",
    }], startMessage: "👋 Salom username!\n" +
        "\n" +
        "bot ishlamay qolsa: @dorama_dunyosi_chat ga kirib yozib qoldiring\n" +
        "\n" +
        "Marhamat, kerakli kodni yuboring:" }).save(); */


bot.start(async (ctx) => {
    if (ctx.chat.type === 'private') {
        const config = await Config.findOne();
        const { id, first_name, last_name, username } = ctx.from;

        const startInlineKeyboard = config.channels.map(channel => ([{
            text: channel.channelName,
            url: `https://t.me/${channel.channelUserName}`,
        }]));
        // ctx.reply(JSON.stringify(startInlineKeyboard));
        if (config.admins.includes(id)) {
            startInlineKeyboard.push(
                [
                    {
                        text: "‍👨‍💻 Admin panel",
                        callback_data: "admin_panel"
                    }
                ]
            )
        }

        try {
            let user = await User.findOne({ userId: id });
            let msg = config.startMessage.replace(/username/gi, `<b>${first_name} ${last_name??""}</b>`);
            if (!user) {
                user = new User({ userId: id, firstName: first_name, lastName: last_name, username });
                await user.save();
                ctx.sendMessage(msg, {
                    parse_mode: "HTML",
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "Who am I",
                                    callback_data: "who_am_i"
                                }
                            ]
                        ]
                    }
                });
            } else {
                ctx.sendMessage(msg, {
                    parse_mode: "HTML",
                    reply_markup: {
                        inline_keyboard:
                        startInlineKeyboard
                    }
                });
            }
        } catch (error) {
            console.error(error);
            ctx.reply('There was an error adding you to the database.');
        }
    }
});

bot.on("message", (ctx) => {
    const {first_name, last_name, username} = ctx.from;
    const {text, message_id} = ctx.message;
    if (ctx.chat.type === 'private') {
        if (!isNaN(+text)) {

        } else {
            ctx.sendMessage("<b>❌ iltimos faqat raqamlardan foydalaning</b>", {
                reply_parameters: { message_id },
                parse_mode: "HTML",
            })
        }
    }
});

bot.on('callback_query', (ctx) => {
    const { id, first_name, last_name, username } = ctx.from;
    const callbackId = ctx.update.callback_query.id;

    bot.telegram.answerCbQuery(callbackId, `Siz ${first_name} ${last_name} siz!`, {
        // url: "https://usmonjon.uz",
    });
});













app.get('/setWebhook', async (req, res) => {
    try {
        await bot.telegram.setWebhook(`https://${req.get('host')}/bot${token}`, {
            drop_pending_updates: true
        });
        res.send('Webhook set');
    } catch (error) {
        res.send(error.message);
    }
});

// bot.launch();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
