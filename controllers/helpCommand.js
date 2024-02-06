async function helpCommand (bot){
    bot.help(async (ctx) => {
        ctx.state.user.trackEvent('CommandUsed', {
            commandName: "help"
        });

        await ctx.reply('Any questions or offers? Contact developer team via email: maxymbidny@gmail.com or telegram: @mbidnyi');
    });
}

module.exports = helpCommand;