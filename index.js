const {Telegraf} = require('telegraf');
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const User = require('./models/User');
const Config = require('./models/Config');
const Movie = require('./models/Movie');
const Series = require('./models/Series');
const Episode = require('./models/Episode');
const {isValidObjectId} = require("mongoose");
const fs = require("node:fs");
require('dotenv').config();

const token = process.env.TOKEN;

const bot = new Telegraf(token);

app.use(bot.webhookCallback(`/bot${token}`));


// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
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

// start
bot.start(async (ctx) => {
    if (ctx.chat.type === 'private') {
        const config = await Config.findOne();
        const {id, first_name, last_name, username} = ctx.from;
        const checkMember = await chatMemberCheck(id);
        if (!checkMember) return;
        const startInlineKeyboard = config.channels.map(channel => ([{
            text: channel.channelName,
            url: channel.channelUserName.includes("https://t.me") ? channel.channelUserName : `https://t.me/${channel.channelUserName}`,
        }]));
        // ctx.reply(config._id);
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
            let user = await User.findOne({userId: id});
            let msg = config.startMessage.replace(/username/gi, `<b>${first_name} ${last_name ?? ""}</b>`);
            if (!user) {
                user = new User({userId: id, firstName: first_name, lastName: last_name, username});
                await user.save();
                ctx.sendMessage(msg, {
                    parse_mode: "HTML",
                    reply_markup: {
                        inline_keyboard: startInlineKeyboard
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

// upload movie
bot.on("video", async (ctx) => {
    const config = await Config.findOne();
    const checkMember = await chatMemberCheck(ctx.from.id);
    if (!checkMember) return;
    if (!config.admins.includes(ctx.from.id)) return;
    const {message_id} = ctx.message;
    const {file_id} = ctx.message.video;
    const caption = ctx.update.message.caption;
    try {
        let code = 1;
        const existMovies = await Movie.find();
        const existSeries = await Series.find();
        if (existMovies.length > 0 && existSeries.length > 0) {
            let codes = existSeries.map(series => series.code);
            existMovies.forEach(movie => codes.push(movie.code))

            console.log(existMovies)
            code = Math.max(...codes) + 1;
        } else if (existMovies.length > 0) {
            let codes = existMovies.map(movie => movie.code);
            code = Math.max(...codes) + 1;
        } else if (existSeries.length > 0) {
            let codes = existSeries.map(series => series.code);
            code = Math.max(...codes) + 1;
        }
        if (caption) {
            if (caption.toString().split("$$$")[0] === "qism") {
                const code = caption.toString().split("$$$")[1].split("%%%")[0]
                const text = caption.toString().split("$$$")[1].split("%%%")[1];
                const episode = new Episode({fileId: file_id, caption: text, code});
                const res = await episode.save();
                ctx.sendMessage(`<b>Muvaffaqqiyatli yuklandi</b>

kodi: <code>${res.code}</code>`, {
                    parse_mode: "HTML",
                    reply_parameters: {
                        message_id
                    }
                })
            } else if (caption.toString().split("%%%")[0] === "serial") {
                const series = new Series({code});
                const response = await series.save();
                const episode = new Episode({
                    fileId: file_id,
                    caption: caption.toString().split("%%%")[1],
                    code: response.code
                });
                const res = await episode.save();
                ctx.sendMessage(`<b>Muvaffaqqiyatli yuklandi</b>

kodi: <code>${res.code}</code>`, {
                    parse_mode: "HTML",
                    reply_parameters: {
                        message_id
                    }
                })
            } else {
                const movie = new Movie({fileId: file_id, caption, code});
                await movie.save();
                ctx.reply("kino");
            }
        } else {
            const movie = new Movie({fileId: file_id, caption, code});
            await movie.save();
            ctx.reply("kino");
        }
        // ctx.sendMessage(`\`\`\`javascript
        // ${JSON.stringify(existSeries, null, 4)}
        // \`\`\``, {parse_mode: "MarkdownV2",})
        ctx.reply(code, caption);
        // console.log(ctx);
    } catch (error) {
        console.error(error);
    }
})

// code
bot.on("text", async (ctx) => {
    const checkMember = await chatMemberCheck(ctx.from.id);
    if (!checkMember) return;
    const {first_name, last_name, username, id: chat_id} = ctx.from;
    const user = await User.findOne({userId: chat_id});
    const {text, message_id} = ctx.message;
    if (ctx.chat.type === 'private') {
        if (user.step === "send_message") {
            if (ctx.update.message.forward_from) {
                const users = await User.find();
                fs.writeFile("users.json", JSON.stringify(users), {encoding: "utf8"}, (err) => {
                    console.log(err)
                })
            }
            return;
        }
        if (!isNaN(+text)) {
            const code = text;
            const series = await Series.findOne({code});
            const movie = await Movie.findOne({code});
            if (series) {
                const episode = await Episode.find({code})
                let seriesKeyboard = episode.map((ep, idx) => (
                    {text: idx + 1, callback_data: `series_${code}_ep_${ep._id}`}
                ));

                seriesKeyboard = chunkArray(seriesKeyboard, 5);
                seriesKeyboard.push(
                    [
                        {
                            text: "❌",
                            callback_data: "delete"
                        }
                    ]
                );
                ctx.sendVideo(episode[0].fileId, {
                    parse_mode: "HTML",
                    caption: episode[0].caption,
                    reply_markup: {
                        inline_keyboard: seriesKeyboard
                    }
                });
            } else {
                if (movie) {
                    ctx.reply("Find movie");
                } else {
                    ctx.sendMessage(`<b>❌ bunday kodli kino topilmadi</b>

kino kodlari ushbu kanalda:`, {
                        parse_mode: "HTML",
                        reply_parameters: {
                            message_id
                        },
                        reply_markup: {
                            inline_keyboard: [[{text: "Dorama Dunyosi", url: "https://t.me/dorama_dunyosi"}]]
                        }
                    })
                }
            }
        } else {
            ctx.sendMessage("<b>❌ iltimos faqat raqamlardan foydalaning</b>", {
                reply_parameters: {message_id},
                parse_mode: "HTML",
            })
        }
    }
});

bot.on('callback_query', async (ctx) => {
    const config = await Config.findOne();
    const checkMember = await chatMemberCheck(ctx.from.id);
    if (!checkMember) return;
    const {id: chat_id, first_name, last_name, username} = ctx.from;
    const callbackId = ctx.update.callback_query.id;
    const {data} = ctx.update.callback_query;
    const {message_id} = ctx.update.callback_query.message;
    if (data === "delete") {
        ctx.deleteMessage(message_id)
        return;
    }
    if (config.admins.includes(chat_id)) {
        if (data === "admin_panel") {
            ctx.editMessageText("<b>👨‍💻 Admin panel\n\nQuyidagi tugmalardan birini tanlang</b>", {
                parse_mode: "HTML",
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "✉️ Xabar yuborish",
                                callback_data: "send_message"
                            }
                        ],
                        [
                            {
                                text: "🔙 Orqaga",
                                callback_data: "home"
                            }
                        ]
                    ],
                }
            })
        }
        if (data === "home") {
            ctx.editMessageText(`<b>${config.startMessage}</b>`, {
                parse_mode: "HTML",
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "👨‍💻 Admin panel",
                                callback_data: "admin_panel"
                            }
                        ]
                    ]
                }
            })
        }
        if (data === "send_message") {
            const userUpdate = await User.updateOne({userId: chat_id}, {
                step: "send_message"
            })
            if (userUpdate) {
                console.log(userUpdate)
                ctx.editMessageText("<b>Xabaringizni kiriting</b>", {
                    parse_mode: "HTML",
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "❌",
                                    callback_data: "cancel"
                                }
                            ]
                        ]
                    }
                })
            }
        }
    }
});

function chunkArray(array, chunkSize) {
    return array.reduce((resultArray, item, index) => {
        const chunkIndex = Math.floor(index / chunkSize);

        if (!resultArray[chunkIndex]) {
            resultArray[chunkIndex] = []; // yangi chunk yaratish
        }

        resultArray[chunkIndex].push(item);

        return resultArray;
    }, []);
}

async function chatMemberCheck(user_id) {
    const config = await Config.findOne();
    const channels = [];
    for (let i = 0; i < config.channels.length; i++) {
        const channel = config.channels[i];
        const resChat = await bot.telegram.getChatMember(channel.channelId, user_id)
        if (resChat) {
            const status = resChat.status !== "left";
            channels.push(
                {
                    isMember: status,
                    channelUserName: channel.channelUserName,
                    channelId: channel.channelId,
                    text: `${channel.channelName} ${status ? "✅" : "❌"}`
                }
            );
        }
    }
    const inline_keyboard = [];
    let isNotAllMember = false;
    channels.forEach((cnl) => {
        if (!cnl.isMember) isNotAllMember = true;
        inline_keyboard.push([{
            text: cnl.text,
            url: cnl.channelUserName.includes("https://t.me") ? cnl.channelUserName : `https://t.me/${cnl.channelUserName}`,
        }]);
    })
    if (isNotAllMember) {
        bot.telegram.sendMessage(user_id, "<b>Botdan to'liq foydalanish uchun iltimos kanallarga obuna bo'ling.</b>", {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard,
            }
        })
        return false;
    }
    return true;
    console.log(isNotAllMember);
}


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

bot.launch();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
