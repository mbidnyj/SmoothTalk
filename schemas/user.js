'use strict';
const { Markup } = require('telegraf');
const llm = require('../utils/llm');
const mongoose = require('mongoose');
const trackEvent = require('../clients/mixpanelClient');
const { Telegraf} = require('telegraf');
const agenda = require('../clients/agendaClient');
const prompts = require('../utils/prompts');
const replyWithTextVoice = require('../utils/replyWithTextVoice');
const openai = require("../clients/openaiClient");

const TRIAL_LIMIT = 5;

let groupFlag = Math.random() < 0.5;

const User_schema = new mongoose.Schema({
    userId: {type: Number, unique: true},
    trialPeriodStartsTs: Date,
    trialPeriodMessageCount: Number,
    firstName: String,
    lastName: String,
    userName: String,
    customSceneMessageId: String,
    languageCode: String,
    voiceEncouraged: Date,
    customScenes: [{
        id: String,
        title: String,
        personName: String,
        shortDescription: String,
        relation: String,
        imagePath: String,
        voice: String,
        personDescription: String,
        environmentDescription: String,
    }],
    lesson: {
        startedAt: Date,
        feedbackScore: String,
        scene: {
            id: String,
            title: String,
            personName: String,
            shortDescription: String,
            relation: String,
            imagePath: String,
            voice: String,
            personDescription: String,
            environmentDescription: String,
        },
        complexity: {
            title: String,
            prompt: String,
        },
        duration: {
            title: String,
            count: Number,
            prompt: String,
        },
        messagesSent: Number,
        threadId: String,
        assistantId: String,
    },
    lastActivityAt: Date,
    lastFollowUpAt: Date,
    online: Boolean,
    threadId: String,
    assistantId: String,
    abGroup: { type: String, default: ()=>{
        groupFlag = !groupFlag;
        return groupFlag ? 'control' : 'test';
    }},
    messageCount: Number, // obsolete?
    lastPremiumActivationTs: Date, // new field
}, {timestamps: true});

User_schema.index({userId: 1});

User_schema.methods.isUserPremium = function() {
    if (!this.lastPremiumActivationTs) return false;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return this.lastPremiumActivationTs >= thirtyDaysAgo;
};


function isMoreThan12HoursAgo(date) {
    const now = new Date();
    const oneDay = 12 * 60 * 60 * 1000;
    return now - date > oneDay;
}

User_schema.methods.isTestUser = function(){
    return this.abGroup=='test';
};

User_schema.methods.trackEvent = function(event, extraProperties = {}){
    let lesson_props = {};

    if (this.lesson){
        lesson_props.lesson_duration = this.lesson.duration.count;
        lesson_props.messagesSent = this.lesson.messagesSent;
        lesson_props.lesson_scene = this.lesson.scene.id;
    }
    trackEvent(event, {
        distinct_id: this.userId,
        username: this.userName || 'no_username',
        languageCode: this.languageCode || 'unknown',
        abGroup: this.abGroup,
        ...lesson_props,
        ...extraProperties,
    });
};

User_schema.methods.checkAccess = function(){
	// if there is not trial information in the DB or it has stated more than 24h ago-> attach a new record
	// if there is trial information -> check limitations
	if (!this.trialPeriodStartsTs || !this.trialPeriodMessageCount || isMoreThan12HoursAgo(this.trialPeriodStartsTs) || this.isUserPremium()){
		return true;
	} else {
		return this.trialPeriodMessageCount < TRIAL_LIMIT;
	}
}

User_schema.methods.incrementUsage = async function(){
	if (!this.trialPeriodStartsTs || !this.trialPeriodMessageCount || isMoreThan12HoursAgo(this.trialPeriodStartsTs)){
		this.trialPeriodStartsTs = new Date();
		this.trialPeriodMessageCount = 1;
		console.log("trialPeriodStartsTs and trialPeriodMessageCount initiated!");
	} else {
		this.trialPeriodMessageCount++;
		console.log("trialPeriodStartsTs and trialPeriodMessageCount incremented!");
	}
    await this.save();
}

User_schema.methods.getName = function(){
    return this.firstName||'Student';
}

User_schema.methods.getProgressBarExtra = function (){
    return {caption: ''};
    return {caption: '💛'.repeat(this.lesson.messagesSent)};
    let progress = this.lesson.messagesSent;
    let total = this.lesson.duration.count;
    let filled = '🟩'.repeat(progress);
    let empty = '⬜'.repeat(Math.max(0, total - progress));
    return {caption: filled + empty};
};

const telegram_bot_token = process.env.telegram_bot_token;
const bot = new Telegraf(telegram_bot_token);
const is_dev_mode = process.env.server_url==='http://localhost:8080';

User_schema.methods.log = function(tag, text, params = {}){
    if (!is_dev_mode && (this.userId=='152106179' || this.userId=='712216731'))
        return;
    bot.telegram.sendMessage('-4029930558', `#user_${this.userId} #${tag}${text ? '\n'+text : ''}`);
    this.trackEvent(tag, {text, ...params});
}

User_schema.methods.hasActiveChat = function(){
    if (!this.lesson)
        return false;
    return this.lesson.messagesSent<this.lesson.duration.count;
}

User_schema.methods.continueChat = async function(ctx, userMessage){
    const {lesson} = this;
    await ctx.sendChatAction('record_voice');
    if (userMessage === null){
        userMessage = '<the user has approached you, say hi>';
    } else {
        this.lesson.messagesSent++;
        await this.save();
    }
    const completion = await llm.createChatCompletionNew(lesson.threadId, lesson.assistantId, userMessage);
    this.log('ai_take', '🤖 '+completion+'\n'+this.getProgressBarExtra().caption);
    await replyWithTextVoice(ctx, completion, this.getProgressBarExtra(), lesson.scene.voice);
    if (await this.isThisGoodbyeMessage(completion)){
        this.log('good_bye_detected', 'messages sent'+this.lesson.messagesSent, { count: this.lesson.messagesSent});
        // finita
        this.lesson.duration.count = this.lesson.messagesSent;
        await this.save();
    }
    // FINISHED
    if (!this.hasActiveChat()){
        await this.incrementUsage();
        let score = await this.calcLessonScore();
        this.log('finished', 'score '+score, {score});
        let extra = Markup.inlineKeyboard([
            Markup.button.callback('💛 New Chat', `START`),
            Markup.button.callback('👀 See Feedback', `FEEDBACK`),
        ]);
        await ctx.reply(`Well Done! ${!score ? '' : `${score}`}

The feedback is ready. How about another chat?`, extra);
    } else {
        await agenda.scheduleFollowUps(this);
        if (this.lesson.messagesSent===3){
            await new Promise(res=>setTimeout(res, 2000));
            await ctx.reply(`💡 Hint: don't forget to wrap up your small talk smoothly and say good bye`);
        }
    }
};

User_schema.methods.calcLessonScore = async function(){
    if (!this.lesson || this.hasActiveChat()){
        return;
    }
    let allMessages = await openai.beta.threads.messages.list(
        this.lesson.threadId, {limit: 50, order: 'asc'}
    );
    let conversation = allMessages.data.slice(1).map(d=>{
        let name = d.role=='assistant' ? '- <Friend>' : '- <Student>'
        return name+': '+d.content[0].text.value;
    }).join(';\n');
    let modifier = '\nPLEASE ONLY OUTPUT ONE NUMBER FROM 1 TO 5 TO GUESSTIMATE GRADE SCORE HOW MUCH EFFORT THE STUDENT PUT TO MAINTAIN THE SMALL TALK WITH HIS FRIEND AND FINISHED IT SMOOTLY';
    let result;
    if (allMessages.data.length <= 4) {
        result = '1';
    } else {
        result = await llm.simpleCompletion(prompts.getFeedbackInstructions()+modifier, conversation+modifier);
    }
    let match = result.match(/^(\d+)/);
    this.lesson.feedbackScore = match ? '💛'.repeat(match[0]) : '';
    if (!match)
        this.log('failed_score', result);
    await this.save();
    return this.lesson.feedbackScore;
};

User_schema.methods.isThisGoodbyeMessage = async function(text){
    let yesorno = await llm.simpleCompletion('can this message be considered as small talk ending (good bye or see you later or so)? ANSWER YES OR NO, ONLY ONE TOKEN', '"'+text+'"');
    console.log({yesorno});
    return /yes/i.test(yesorno);
}


User_schema.methods.getLessonFeedback = async function(){
    if (!this.lesson || this.hasActiveChat()){
        return;
    }
    let allMessages = await openai.beta.threads.messages.list(
        this.lesson.threadId, {limit: 50, order: 'asc'}
    );
    if (allMessages.data.length<=4){
        return `Sorry your chat was too short to analyze. Need at least 2 messages.`;
    }
    let conversation = allMessages.data.slice(1).map(d=>{
        let name = d.role=='assistant' ? '- <Friend>' : '- <Student>'
        return name+': '+d.content[0].text.value;
    }).join(';\n');
    // the goal is to make them excited
    let feedback = await llm.simpleCompletion(prompts.getFeedbackInstructions(), conversation);
    const score = this.lesson.feedbackScore;
    return `🔎 Feedback ${!score ? '' : `(score is ${score})`}\n\n${feedback}`
}

User_schema.methods.getLessonHint = async function(){
    if (!this.lesson || !this.hasActiveChat()){
        return;
    }
    let allMessages = await openai.beta.threads.messages.list(
        this.lesson.threadId, {limit: 50, order: 'asc'}
    );
    let conversation = allMessages.data.slice(1).map(d=>{
        let name = d.role=='assistant' ? this.lesson.scene.personName : '<Me>'
        return name+': '+d.content[0].text.value;
    }).join(';\n');
    let hint = await llm.simpleCompletion(prompts.getHintInstructions(this.lesson.scene), conversation);
    return `💡 ${hint.trim()}`
}

User_schema.methods.addCustomScene = async function(customSteneDescription, id){
    try {
        let result = await llm.jsonCompletion(prompts.getCustomSceneInstructions(), customSteneDescription);
        if (!['male', 'female'].includes(result.gender))
            throw 'wrong gender';
        if (!result.personName || !result.relation || !result.shortDescription || !result.personDescription || !result.environmentDescription)
            throw 'wrong json format';
        result.voice = result.gender === 'male' ? 'onyx' : 'shimmer';
        result.id = id;
        this.customScenes.push(result);
        await this.save();
        return result;
    } catch(e){
        this.log('custom_scheme_error', e);
    }
}

User_schema.methods.npcMenu = async function(ctx, text){
    let scenes = prompts.scenes;
    let sceneKeys = Object.keys(scenes);
    let randomSceneKeys = sceneKeys.filter(k=>scenes[k].voice);
    let buttons = randomSceneKeys.map(key => [Markup.button.callback(scenes[key].title, `SELECT_DURATION:long:easy:${key}`)]);
    buttons.push([Markup.button.callback('More...', `ADD_SCENE`)]);
    await ctx.reply(text, Markup.inlineKeyboard(buttons));
}

User_schema.methods.beginNewChat = async function(ctx, scene, complexity, duration){
    await ctx.sendChatAction('record_voice');
    // Create new thread
    const [thread, assistant] = await Promise.all([
        openai.beta.threads.create(),
        openai.beta.assistants.create({
            name: 'scene ' + scene.id,
            instructions: prompts.getInstruction(scene, this.getName()),
            model: 'gpt-3.5-turbo-0125',
        })
    ]);
    this.lesson = {
        startedAt: new Date,
        scene,
        complexity,
        duration,
        messagesSent: 0,
        threadId: thread.id,
        assistantId: assistant.id, 
    };
    await this.save();
    this.log('begin_new_chat', scene.id+' '+duration.count);
    await this.continueChat(ctx, null);
};

module.exports = mongoose.model('User', User_schema, 'UserThreadAssistant');