// server.js
require('dotenv').config();
const express = require('express');
const Stripe = require('stripe');
const cors = require('cors');

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// ====== CONFIG ======
const PRICE_USD_CENTS = 1; // $0.01 for testing. Change to 2000 for $20 live.
const ORIGIN = process.env.ORIGIN || 'https://breakthrough-after-hardship-15-united.netlify.app';
const PORT = process.env.PORT || 4242;

// allow your front-end domain to call this server
app.use(cors({
  origin: ORIGIN,
  methods: ['POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

// Create a Checkout Session
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { quantity, email } = req.body;

    // basic validation
    const qty = Math.max(1, Math.min(parseInt(quantity || 1, 10), 50));
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email required' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email, // prefill email at checkout
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: 'Event Ticket' },
            unit_amount: PRICE_USD_CENTS, // 1 cent for testing
          },
          quantity: qty,
        },
      ],
      // after payment succeeds, send them to your thank you page
      success_url: `${ORIGIN}/thankyou.html`,
      cancel_url: `${ORIGIN}/ticket.html`,
      automatic_tax: { enabled: false },
      allow_promotion_codes: false,
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Unable to start checkout' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Stripe server running on port ${PORT}`);
});
