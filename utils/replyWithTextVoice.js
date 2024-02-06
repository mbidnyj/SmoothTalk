const getSpeechStream = require("./textToSpeech");

let cache = {};

async function replyWithTextVoice(ctx, text, extra, voice) {
    let replyFileId = cache[text];
    try {
      if (replyFileId){
        return await ctx.replyWithVoice(replyFileId, extra);
      } else {
        const gotSpeechStream = await getSpeechStream(text, voice);
        let result = await ctx.replyWithVoice({ source : gotSpeechStream }, extra);
        cache[text] = result.voice.file_id;
        return result;
      }
    } catch (e) {
      if (/not enough rights to send voice/.test(e)){
        await ctx.reply(`Sorry, your settings don't allow me to send voice messages. Please add me to allow list.`);
        return null;
      }
      throw e;
    }
}

module.exports = replyWithTextVoice;