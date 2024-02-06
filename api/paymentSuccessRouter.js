const express = require('express');
const router = express.Router();
const path = require('path');
const User = require("../schemas/user");
const { Telegraf} = require('telegraf');
const telegram_bot_token = process.env.telegram_bot_token;
const bot = new Telegraf(telegram_bot_token);

router.get('/api/paymentSuccess', async (req, res) => {
    const userId = req.query.userId;
    const user = await User.findOne({userId});
    if (!user){
        await bot.telegram.sendMessage('-4029930558', `Anauthorised user visited /api/paymentSuccess`);
        return res.sendFile(path.join(__dirname, "paymentCancel.html"));
    }
    user.lastPremiumActivationTs = new Date();
    await user.save();
    try {
        await bot.telegram.sendMessage(userId, `🚀 Premium mode has been activated! Enjoy! ❤️`);
    } catch (e){
        await bot.telegram.sendMessage(userId, `User bought premium, but he stopped the bot :(`);
    }
    user.log('succesful_payment', `💰 +$2.99 from user ${user.userId} @${user.userName} (cc @mbidnyj @g7tyfj27pcpk)`, { sum: 2.99 });
    console.log("/api/paymentSuccess triggered for userId: ", userId);
    res.sendFile(path.join(__dirname, "paymentSuccess.html"));
});

module.exports = router;