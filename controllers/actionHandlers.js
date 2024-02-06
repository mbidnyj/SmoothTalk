'use strict';
const { Markup } = require('telegraf');
const prompts = require('../utils/prompts');

module.exports = async function (bot){
  bot.action(/ADD_SCENE/, async (ctx) => {
    const {user} = ctx.state;
    user.log('add_scene');
    const example = 'Amy, a 19-year-old girl, is a photographer. She is interested in books and plants. We are in the gym, drinking smoothies after our exercises.';
    let result = await ctx.reply(`🪄 Imagine any situation and partner you want to chat with.
Just send me a description, for example:

\`${example}\`

Or maybe something simpler, like:

\`Albert Einstein, 1933 year\``, {
      parse_mode: 'Markdown',
      reply_markup: { force_reply: true },
    });
    user.customSceneMessageId = result.message_id;
    await user.save();
    await ctx.answerCbQuery();
  });

  bot.action(/^START$/, async (ctx) => {
    const {user} = ctx.state;
    if (!user.checkAccess()){
        user.log('init_menu_limit');
        await ctx.answerCbQuery();
        return await ctx.reply("You have reached limit of free exercises today. Keep practicing for free tomorrow or consider buying /premium");
    }
    try { await ctx.deleteMessage(); } catch(e){console.log('failed delete', e)}
    user.log('begin_flow');
    await user.npcMenu(ctx, 'Choose your NPC 🎭');
    await ctx.answerCbQuery();
  });

  bot.action(/SELECT_SCENE:(.+)/, async (ctx) => {
    const {user} = ctx.state;
    if (!user.checkAccess()){
        await ctx.answerCbQuery();
        user.log('init_menu_limit');
        await ctx.answerCbQuery();
        return await ctx.reply("You have reached limit of free exercises today. Keep practicing for free tomorrow or consider buying /premium");
    }
    const scene = ctx.match[1];
    user.log('select_scene', scene, {scene});
    let buttons = [];
    for (let key in prompts.duration){
        buttons.push(Markup.button.callback(prompts.duration[key].title, `SELECT_DURATION:${key}:easy:${scene}`));
    }
    let extra = Markup.inlineKeyboard(buttons, {columns: 1});
    try { await ctx.deleteMessage(); } catch(e){console.log('failed delete', e)}
    await ctx.sendChatAction('typing');
    await ctx.answerCbQuery();
  });

  bot.action(/SELECT_DURATION:(.+):(.+):(.+)$/, async (ctx) => {
    const {user} = ctx.state;
    if (!user.checkAccess()){
        await ctx.answerCbQuery();
        user.log('init_menu_limit');
        await ctx.answerCbQuery();
        return await ctx.reply("You have reached limit of free exercises today. Keep practicing for free tomorrow or consider buying /premium");
    }
    const [, duration, complexity, scene] = ctx.match;
    const {imagePath, shortDescription, personDescription} = prompts.scenes[scene];
    try { await ctx.deleteMessage(); } catch(e){console.log('failed delete', e)}
    const buttons = Markup.inlineKeyboard([
      Markup.button.callback(`💡 Get hint`, `HINT`),
      Markup.button.callback(`Exit`, `CANCEL`),
    ], {columns: 2});
    const caption = `\`${shortDescription}\n\n${personDescription}\`\n\nEnjoy your chat! 🎤`;
    await ctx.replyWithPhoto({ source: imagePath }, {caption, parse_mode: 'Markdown', ...buttons});
    await user.beginNewChat(ctx, prompts.scenes[scene], prompts.complexity[complexity], prompts.duration[duration]);
    await ctx.answerCbQuery();
  });

  bot.action(/START_CUSTOM_SCENE:(.+):(.+):(.+)$/, async (ctx) => {
    const {user} = ctx.state;
    if (!user.checkAccess()){
        user.log('init_menu_limit');
        await ctx.answerCbQuery();
        return await ctx.reply("You have reached limit of free exercises today. Keep practicing for free tomorrow or consider buying /premium");
    }
    const [, duration, complexity, scene_id] = ctx.match;
    let scene = user.customScenes.find(scene=>scene.id==scene_id);
    if (!scene){
      user.log('custom_scene_not_found', scene_id);
      return await ctx.reply('Oops something went wrong');
    }
    const {shortDescription, personDescription, environmentDescription} = scene;
    const buttons = Markup.inlineKeyboard([
      Markup.button.callback(`💡 Get hint`, `HINT`),
      Markup.button.callback(`Exit`, `CANCEL`),
    ], {columns: 2});
    const caption = `✨ \`${shortDescription}\n\n👤 ${personDescription}\n\n📍 ${ environmentDescription }\`\n\nEnjoy your chat! 🎤`;
    await ctx.reply(caption, {parse_mode: 'Markdown', ...buttons});
    await user.beginNewChat(ctx, scene, prompts.complexity[complexity], prompts.duration[duration]);
    await ctx.answerCbQuery();
  });

  bot.action(/HINT/, async (ctx) => {
    const {user} = ctx.state;
    await ctx.answerCbQuery();
    const hint = await user.getLessonHint();
    if (!hint){
      user.log('hint_error', hint);
      return await ctx.reply('Oops, something went wrong');
    }
    user.log('hint', hint);
    await ctx.reply(hint);
  });

  bot.action(/CANCEL/, async (ctx) => {
    const {user} = ctx.state;
    user.lesson = null;
    await user.save();
    user.log('cancel');
    await ctx.editMessageReplyMarkup(Markup.inlineKeyboard([], {columns: 1}));
    let extra = Markup.inlineKeyboard([
        Markup.button.callback('💛 New Chat', `START`),
    ]);
    await ctx.reply(`No worries! Feel free to start a new chat when you're ready!`, extra);
    await ctx.answerCbQuery();
  });

  bot.action(/FEEDBACK/, async (ctx) => {
    const {user} = ctx.state;
    try { await ctx.deleteMessage(); } catch(e){console.log('failed delete', e)}
    await ctx.answerCbQuery();
    const feedback = await user.getLessonFeedback();
    if (!feedback){
      user.log('feedback_error');
      return await ctx.reply('Oops, something went wrong');
    }
    user.log('feedback', feedback);
    await ctx.reply(feedback, Markup.inlineKeyboard([
        Markup.button.callback('💛 New Chat', `START`),
    ], {columns: 1}));
  });
};