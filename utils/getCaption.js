const openai = require("../clients/openaiClient");

async function getCaption(ctx, messageId){
    const {user} = ctx.state;
    
    // Retrieve desired caption by messageId
    const messages = await openai.beta.threads.messages.list(user.threadId);

    // Loop through response to find a message
    for (const message of messages.body.data) {
      if (message.id == messageId){
        return message.content[0].text.value;
      }
    }

    console.log(`${messageId} not found in the current thread`);
    return null;
}

module.exports = getCaption;