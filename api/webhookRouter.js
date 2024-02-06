const express = require('express');
const router = express.Router();


router.post('/api/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
  
    let event;
  
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, 'your_webhook_secret');
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }
  
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.client_reference_id; // Your user-specific identifier
  
      // Now you can match the userId with your user database
      // and confirm the payment, grant access to product, etc.
    }
  
    res.status(200).send('Received');
  });
  

module.exports = router;