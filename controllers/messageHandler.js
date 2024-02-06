const { Markup } = require('telegraf');

async function messageHandler (bot){
    bot.on('message', async (ctx) => {
        let {user} = ctx.state;
        if (!user)
          return console.log('unknown user');
        const text = ctx.message.text;
        if (ctx.message.reply_to_message && ctx.message.reply_to_message.message_id == user.customSceneMessageId) {
            if (!user.checkAccess()){
                user.log('init_custom_scene_limit', text);
                return await ctx.reply("You have reached limit of free exercises today. Keep practicing for free tomorrow or consider buying /premium");
            }
            // Handle custom scene message
            const processingMessage = await ctx.reply('✨ Creating a new NPC\nIt will take a few seconds...');
            user.log('adding_scene', text);
            const scene = await user.addCustomScene(text, ctx.message.message_id);
            await ctx.deleteMessage(processingMessage.message_id);
            if (!scene){
              return await ctx.reply('Oops something went wrong... Try another prompt');
            }
            user.log('added_scene', text+'\n'+JSON.stringify(scene, null, 2));
            return await ctx.reply(`🪄 Your custom NPC is ready!\n\n Start Chat with ${scene.personName} now!`,
              Markup.inlineKeyboard([Markup.button.callback('💛 Start Chat', `START_CUSTOM_SCENE:long:easy:${scene.id}`)]));
        }
        if (user.hasActiveChat()){
          if (!user.voiceEncouraged) {
            user.voiceEncouraged = new Date();
            await user.save();
            await ctx.reply(`💡 Hint: For better results, it's recommended to use 🎤 voice notes instead of text messages`);
          }
          user.log('user_take', '🔤 '+text+'\n'+user.getProgressBarExtra().caption, {type: 'text'});
          if (text && text.trim().length>1)
            await user.continueChat(ctx, text);
          else
            user.log('ignore_empty_user_take', text, {type: 'text'});
        } else {
          await ctx.reply('Tap /start to begin a new chat');
        }
    });
}

module.exports = messageHandler;