const Agenda = require('agenda');
const { Markup } = require('telegraf');
const { Telegraf} = require('telegraf');
const User = require("../schemas/user");
const {createChatCompletion} = require('../utils/llm');
const getSpeechStream = require("../utils/textToSpeech");
const telegram_bot_token = process.env.telegram_bot_token;
const bot = new Telegraf(telegram_bot_token);

let agenda;

const SEC = 1000, MIN = 60*SEC, HOUR = MIN * 60;
let followUps = [
    {
        wait: 3*MIN,
        prompt: '...All right ... good bye then!...'
    },
    {
        wait: 23.5*HOUR,
        prompt: `Hey, remember to practice your small talk skills!`
    },
    {
        wait: (24+23.5)*HOUR,
        prompt: `It's time to work on your small talk again!`
    },
    {
        wait: (24+24+23.5)*HOUR,
        prompt: `Let's not forget to brush up on those small talk skills!`
    },
];

exports.scheduleFollowUps = async (user)=>{
    user.lastFollowUpAt = new Date();
    await user.save();
    for (let [index, followUp] of followUps.entries()){
        let {wait, prompt} = followUp;
        agenda.schedule(new Date(Date.now()+wait), "new follow up", {
            number: index+1,
            userId: user.userId,
            prompt,
            validLastFollowUpAt: user.lastFollowUpAt,
        });
    }
};

let cache = {};

exports.init = async ()=>{
  const DB_URI = process.env.mongodb_connection_url;
  const is_dev_mode = process.env.server_url==='http://localhost:8080';
  const collection = is_dev_mode ? 'agendaJobsDev' : 'agendaJobs';
  agenda = new Agenda({ db: { address: DB_URI, collection } });

  agenda.define("new follow up", async (job) => {
    let {userId, number, prompt, validLastFollowUpAt} = job.attrs.data
    const user = await User.findOne({userId});
    if (!user || +user.lastFollowUpAt!=+validLastFollowUpAt || !user.online)
        return;
    let sendQuickReminder, sendLongReminder;
    console.log('user.hasActiveChat()', user.hasActiveChat())
    if (user.hasActiveChat() && Date.now()-user.lesson.startedAt<HOUR) {
        sendQuickReminder = true;
    } else if (user.checkAccess() && (!user.lesson || Date.now()-user.lesson.startedAt>HOUR)) {
        sendLongReminder = true;
    }
    if (!sendQuickReminder && !sendLongReminder)
        return;
    try {
        await bot.telegram.sendChatAction(userId, 'record_voice');
    } catch (e) {
        user.log('churned_user', `on follow up #${number} (${e})`, {followUpNumber: number, reason: e+''});
        user.online = false;
        await user.save();
    }
    if (sendQuickReminder){
        // finish lesson // 
        user.lesson.duration.count = user.lesson.messagesSent;
        await user.save();
        // charge
        await user.incrementUsage();
        let cache_key = prompt+user.lesson.scene.voice;
        let replyFileId = cache[cache_key];
        if (replyFileId){
            await bot.telegram.sendVoice(userId, {source: await getSpeechStream(prompt, user.lesson.scene.voice)}, user.getProgressBarExtra());
        } else {
            let result = await bot.telegram.sendVoice(userId, {source: await getSpeechStream(prompt, user.lesson.scene.voice)}, user.getProgressBarExtra());
            cache[cache_key] = result.voice.file_id;
        }
        let score = await user.calcLessonScore();
        user.log('finished_timeout', 'score '+score, {score, count: user.lesson.duration.count});
        let extra = Markup.inlineKeyboard([
            Markup.button.callback('💛 New Chat', `START`),
            Markup.button.callback('👀 See Feedback', `FEEDBACK`),
        ]);
        return await bot.telegram.sendMessage(userId, `Done! ${!score ? '' : `${score}`}
But next time try to finish conversation by saying good bye.

The feedback is ready 👀
Start a New Chat?`, extra);

        // end finish //
        user.log('followup_short', 'number '+number+' '+prompt, {followUpNumber: number});
    } else {
        await bot.telegram.sendMessage(userId, prompt, Markup.inlineKeyboard([Markup.button.callback('🚀 Chat Now', `START`)]));
        user.log('followup_long', 'number '+number+' '+prompt, {followUpNumber: number});
    }
  });
  await agenda.start();
};