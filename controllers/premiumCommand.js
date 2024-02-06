const { InlineKeyboardButton, Row, InlineKeyboard } = require('node-telegram-keyboard-wrapper');
const getPaymentUrl = require("../utils/getPaymentUrl");

module.exports = async function (bot){
    bot.command('premium', async (ctx) => {
      const {user} = ctx.state;
      user.log('premium_command')

      await ctx.sendChatAction('typing');
      const paymentUrl = await getPaymentUrl(ctx.from.id);

      return await ctx.reply(`🚀 Go Premium

Unlock unlimited access for 30 days, only $2.99!`,
        {reply_markup: new InlineKeyboard(new Row(new InlineKeyboardButton('🛒 Buy now', 'url', paymentUrl))).getMarkup()}
      );
    });
}