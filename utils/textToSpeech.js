const openai = require("../clients/openaiClient");
const { PassThrough } = require('stream');


async function getSpeechStream(inputText, voice) {
  
  try {
    const ogg = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice||"echo",
      input: inputText,
      response_format: "opus"
    });
    
    return await ogg.body;
  } catch (error) {
    console.error("Error creating speech file:", error);
  }
}

module.exports = getSpeechStream;