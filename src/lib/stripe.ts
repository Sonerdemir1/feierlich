import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;

// `null` statt eines Throws beim Modul-Laden: sonst reisst schon der
// Import dieses Moduls jede Route mit, die es einbindet (Billing-Actions,
// Webhook-Route) — auch dort, wo der Aufrufer laengst einen eigenen,
// freundlichen "nicht konfiguriert"-Pfad hat (siehe webhooks/stripe/route.ts).
export const stripe = key ? new Stripe(key) : null;
