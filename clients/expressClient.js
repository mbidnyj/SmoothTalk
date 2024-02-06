const express = require('express');
const createCheckoutSessionRouter = require("../api/createCheckoutSessionRouter");
const paymentSuccessRouter = require("../api/paymentSuccessRouter");
const paymentCancelRouter = require("../api/paymentCancelRouter");
// const webhookRouter = require("../api/webhookRouter");


function getApp() {
  const app = express();

  app.get('/', (req, res) => {
    res.send('Hello World!');
  });

  app.use(express.json());
  app.use(express.static('public'));
  app.use(createCheckoutSessionRouter);
  app.use(paymentSuccessRouter);
  app.use(paymentCancelRouter);
  // app.use(webhookRouter);

  return app;
}

module.exports = getApp;