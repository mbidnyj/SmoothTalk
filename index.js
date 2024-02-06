require('dotenv').config({ path: './config/config.env' });
const axios = require('axios');

const mongodb = require("./clients/mongodbClient.js");
const agenda = require("./clients/agendaClient.js");
const User = require("./schemas/user.js");
// Express server
const statusServer = require("./api/statusServer");
// Bot commands
const startCommand = require("./controllers/startCommand");
const helpCommand = require("./controllers/helpCommand");
const premiumCommand = require("./controllers/premiumCommand");
const secretDeleteUser = require("./controllers/secretDeleteUser");
// Bot handlers
const messageHandler = require("./controllers/messageHandler");
const voiceHandler = require("./controllers/voiceHandler");
const othersHandler = require("./controllers/othersHandler");
const actionHandlers = require("./controllers/actionHandlers.js");
 
const { Telegraf} = require('telegraf');
const telegram_bot_token = process.env.telegram_bot_token;
const bot = new Telegraf(telegram_bot_token);

const main = async ()=>{
	console.log('connecting to mongodb...');
	console.time('mongodb connected');
	await mongodb.init();
	console.timeEnd('mongodb connected');
	await agenda.init();
	await bot.telegram.sendMessage('-4029930558', `bot is live`);
	statusServer();

	bot.catch(async (err) => {
		console.log('Ooops', err)
		await bot.telegram.sendMessage('-4029930558', `Ooops. Uncaught #error! ${err}\nStack Trace: ${err.stack}`);
	})
	bot.use(async (ctx, next)=>{
        if (ctx.updateType=='channel_post' || !ctx.from)
            return await next();
        let user = ctx.state.user = await User.findOne({userId: ctx.from.id});
		if (user){
			user.online = true;
			user.lastActivityAt = new Date();
			await user.save();
		}
        await next();
    });

	startCommand(bot);
	helpCommand(bot);
	premiumCommand(bot);
	secretDeleteUser(bot);

	voiceHandler(bot);
	messageHandler(bot);
	othersHandler(bot);
	actionHandlers(bot);

	bot.launch();
};

main();