const openai = require("../clients/openaiClient");

async function createThreadIfNeeded(user, model = "gpt-3.5-turbo"){
    if (user.assistantId)
        return;
    // Create new thread
    const thread = await openai.beta.threads.create();
    // Setting up system instructions
    let system_prompt = `Your name is Ari. You are a real friend who loves listening to people, asking personal questions, and encouraging them to continue the dialogue on any topic. Sometimes you demonstrate good sense of humour and can be sarcastic. You reply in a casual, informal, and concise manner, using simple vocabulary. Your secret goal is to become a real friend! `;
    let name = user.firstName;
    if (name && user.lastName)
        name += ' '+user.lastName;
    if (name)
        system_prompt += ` User's name is ${name}`;

    // Default parameters for assistant
    const defaultParameters = {
        assistant_name: "Ari",
        assistant_instructions: system_prompt,
    }

    // Create new assistent
    const assistant = await openai.beta.assistants.create({
        name: defaultParameters.assistant_name,
        instructions: defaultParameters.assistant_instructions,
        model: model
    });

    // Write threadId and assistantId to the database
    user.threadId = thread.id;
    user.assistantId = assistant.id;
    await user.save();
}

async function waitForRunCompletion(threadId, runId) {
    return new Promise((resolve, reject) => {
      // Check the status every 0.5 seconds (500 milliseconds)
      const intervalId = setInterval(async () => {
        try {
          const retrieve_run = await openai.beta.threads.runs.retrieve(threadId, runId);
          console.log('Checking run status:', retrieve_run.status);
          
          // Check if the status is 'succeeded' or 'failed'
          if (retrieve_run.status === 'completed' || retrieve_run.status === 'failed') {
            clearInterval(intervalId);
            resolve(retrieve_run);
          }
          // You could also add a timeout to reject the promise if it takes too long
        } catch (error) {
          console.error('Error retrieving run:', error);
          clearInterval(intervalId);
          reject(error);
        }
      }, 500);
    });
  }

async function createChatCompletion(user, question){
  await createThreadIfNeeded(user);

  // Getting an assistantId
  console.log(`threadId: ${user.threadId}`);
  console.log(`assistantId: ${user.assistantId}`);

  // Attaching a message to thread
  const message = await openai.beta.threads.messages.create(
    user.threadId,
    {
      role: "user",
      content: question
    }
  );

  // Running the assistant on thread
  const run = await openai.beta.threads.runs.create(
    user.threadId,
    { 
      assistant_id: user.assistantId,
      //instructions: "Please address the user as Jane Doe. The user has a premium account."
    }
  );

  // Waiting until the status will be completed
  try {
    const finished_run = await waitForRunCompletion(user.threadId, run.id);
    console.log('Run finished with status:', finished_run.status);
  } catch (error) {
    console.error('Error waiting for run completion:', error);
  }

  // Retrieve the responce message
  const messages = await openai.beta.threads.messages.list(
    user.threadId, {limit: 1}
  );

  // Extract the completion
  let completion = messages.body.data[0].content[0].text.value;
  if (completion.startsWith('Ari: '))
    completion = completion.slice(5);

  // Return completion and messageId
  return { completion, messageId: messages.body.data[0].id };
}

async function createChatCompletionNew(threadId, assistantId, messageContent){

  // Attaching a message to thread
  const message = await openai.beta.threads.messages.create(
    threadId,
    {
      role: "user",
      content: messageContent
    }
  );

  // Running the assistant on thread
  const run = await openai.beta.threads.runs.create(
    threadId,
    { 
      assistant_id: assistantId,
    }
  );

  // Waiting until the status will be completed
  try {
    const finished_run = await waitForRunCompletion(threadId, run.id);
    console.log('Run finished with status:', finished_run.status);
  } catch (error) {
    console.error('Error waiting for run completion:', error);
  }

  // Retrieve the responce message
  const messages = await openai.beta.threads.messages.list(
    threadId, {limit: 1}
  );

  // Extract the completion
  let completion = messages.body.data[0].content[0].text.value;

  // Return completion and messageId
  return completion;
}

async function simpleCompletion(instruction, prompt){
  let completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: instruction }, { role: "user", content: prompt }],
    model: 'gpt-3.5-turbo-0125',
  })
  console.log('Simple completion instruction', instruction);
  console.log('Simple completion prompt', prompt);
  console.log(completion.choices[0].message.content)
  return completion.choices[0].message.content;
}

async function jsonCompletion(instruction, prompt){
  let completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: instruction }, { role: "user", content: prompt }],
    model: 'gpt-4-0125-preview',
    response_format: {"type": "json_object"},
  })
  console.log('Simple completion instruction', instruction);
  console.log('Simple completion prompt', prompt);
  console.log('Simple completion result', completion.choices[0].message.content);
  return JSON.parse(completion.choices[0].message.content);
}

exports.jsonCompletion = jsonCompletion;
exports.simpleCompletion = simpleCompletion;
exports.createChatCompletion = createChatCompletion;
exports.createChatCompletionNew = createChatCompletionNew;
exports.waitForRunCompletion = waitForRunCompletion;
