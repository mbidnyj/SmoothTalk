const Stripe = require('stripe');
const stripe = Stripe(process.env.stripe_test_secret_key);

module.exports=stripe;
