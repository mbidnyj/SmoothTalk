const User = require("../schemas/user")

async function secretDeleteUser (bot){
    bot.command('secret_delete', async (ctx) => {
        const {user} = ctx.state;
        if (!user)
            return await ctx.reply('No such user!');
        user.log('secret_delete');
        await User.deleteOne({userId: user.userId})
        await ctx.reply('Done! /start');
    });
}

module.exports = secretDeleteUser;