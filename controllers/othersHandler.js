async function othersHandler (bot){
  let handler = async (ctx) => {
        return await ctx.reply(`This kind of message is not supported`);
    };
    bot.on('sticker', handler);
    bot.on('photo', handler);
    bot.on('video', handler);
    bot.on('animation', handler);
    bot.on('audio', handler);
    bot.on('video_note', handler);
}

module.exports = othersHandler;