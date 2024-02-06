const getApp = require('../clients/expressClient');

function statusServer() {
  const app = getApp();
  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = statusServer;