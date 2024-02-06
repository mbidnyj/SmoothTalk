const { Markup } = require('telegraf');

const agenda = require("../clients/agendaClient");
const getFileStream = require('../utils/getFileStream');
const transcribeAudio = require('../utils/speechToText');
const {createChatCompletion} = require('../utils/llm');
const replyWithTextVoice = require('../utils/replyWithTextVoice');
const { InlineKeyboardButton, Row, InlineKeyboard } = require('node-telegram-keyboard-wrapper');
const getPaymentUrl = require("../utils/getPaymentUrl");

async function voiceHandler (bot){
    // TODO: move bot.on('voice', outside of this function, so the caller is bot.on('voice', voiceHandler)
    bot.on('voice', async (ctx) => {
        const {user} = ctx.state;
        if (!user)
          return console.log('unknown user');
        user.trackEvent('QuestionAsked', {
          questionType: "voice"
        });

        //simulate typing status
        await ctx.sendChatAction('record_voice');

        if (user.hasActiveChat()){

          const voice = ctx.message.voice;
          console.log("Voice message received");
          // debug forward
        
          // Get the file ID of the voice message
          const fileId = voice.file_id;
          console.log(`File ID of the voice message: ${fileId}`);
        
          // You can then use this file ID to access the voice message
          const fileUrl = await bot.telegram.getFileLink(fileId);
          console.log(`URL to aceess the voice message: ${fileUrl}`);
        
          // Get the file stream using a fileUrl
          const gotFileStream = await getFileStream(fileUrl);
          if (gotFileStream){
            console.log("FileStream is successfully retrieved");
          }
        
          // Get transcribed text of the voice message
          const text = await transcribeAudio(gotFileStream);
          console.log(`Transcribed text of the voice message: ${text}`);
          user.log('user_take', '🎤 '+text+'\n'+user.getProgressBarExtra().caption, {type: 'voice'});
          if (text && text.trim().length>1)
            await user.continueChat(ctx, text);
          else
            user.log('ignore_empty_user_take', text, {type: 'voice'});
        } else {
          await ctx.reply('Tap /start to begin a new chat');
        }
    });

    bot.action(/LEARN_MORE/, async (ctx) => {
      const {user} = ctx.state;
      user.log('learn_more')
      await ctx.answerCbQuery();
      const paymentUrl = await getPaymentUrl(ctx.from.id);
      return await ctx.reply(`🚀 Premium\nGet 30 days of unlimited practicing just for $2.99`,
        {reply_markup: new InlineKeyboard(new Row(new InlineKeyboardButton('🛒 Buy now', 'url', paymentUrl))).getMarkup()}
      );
    });
}

module.exports = voiceHandler;