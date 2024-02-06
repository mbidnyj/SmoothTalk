const express = require('express');
const router = express.Router();
const stripe = require("../clients/stripeClient");


router.post('/api/create-checkout-session', async (req, res) => {
  const userId = req.body.userId;
	console.log("/api/create-checkout-session fired for userId: ", userId);
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Small Talk Premium',
              description: 'Unlimited Access for 30 days',
              images: [`${process.env.server_url}/ari.png`]
              // Add more product details if needed
            },
            unit_amount: 299,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${process.env.server_url}/api/paymentSuccess?userId=${userId}`,
        cancel_url: `${process.env.server_url}/api/paymentCancel`,
        client_reference_id: userId
      });
  
      res.json({ url: session.url });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  module.exports = router;