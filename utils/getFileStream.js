const axios = require('axios');

async function getFileStream(fileUrl) {
  try {
    const response = await axios({
      method: 'GET',
      url: fileUrl,
      responseType: 'stream'
    });

    return response.data;
  } catch (error) {
    console.error('An error occurred during file download:', error);
  }
}

module.exports = getFileStream;