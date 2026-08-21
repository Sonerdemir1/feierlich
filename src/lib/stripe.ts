import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  throw new Error("STRIPE_SECRET_KEY ist nicht gesetzt.");
}

export const stripe = new Stripe(key);
