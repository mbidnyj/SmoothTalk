const axios = require('axios');
const FormData = require('form-data');


function transcribeAudio(gotFileStream) {
  const open_ai_token = process.env.open_ai_token;

  const formData = new FormData();
  formData.append('file', gotFileStream);
  formData.append('model', 'whisper-1');

  return axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
    headers: {
      'Authorization': `Bearer ${open_ai_token}`,
      ...formData.getHeaders()
    }
  })
  .then(response => {
    return response.data.text;
  })
  .catch(error => {
    console.error(error);
    //throw error;
  });
}

module.exports = transcribeAudio;