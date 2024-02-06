'use strict';
const { Markup } = require('telegraf');
const prompts = require('../utils/prompts');
const User = require("../schemas/user.js");

async function startCommand (bot){
    bot.start(async (ctx) => {
        const {
          id: userId,
          first_name: firstName,
          last_name: lastName,
          username: userName,
          language_code: languageCode,
        } = ctx.from;

        const result = await User.findOneAndUpdate({userId},
            {$set: {firstName, lastName, userName, userId, languageCode,
                lastActivityAt: new Date(), online: true}},
            {upsert: true, new: true, includeResultMetadata: true});
        ctx.state.user = result.value
        const isNewUser = !!result.lastErrorObject.upserted
        const {user} = ctx.state;
        user.log('start_'+(isNewUser ? 'new' : 'old'));
        await ctx.sendChatAction('typing');
        await user.npcMenu(ctx, `Welcome, ${user.getName()}! 👋
Choose your NPC 🎭`);
    });
}

module.exports = startCommand;