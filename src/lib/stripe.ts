import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;

// `null` statt eines Throws beim Modul-Laden: sonst reisst schon der
// Import dieses Moduls jede Route mit, die es einbindet (Billing-Actions,
// Webhook-Route) — auch dort, wo der Aufrufer laengst einen eigenen,
// freundlichen "nicht konfiguriert"-Pfad hat (siehe webhooks/stripe/route.ts).
export const stripe = key ? new Stripe(key) : null;

// Bewusste, kuratierte Liste statt payment_method_types: ["card"] (vorher)
// oder komplett automatischer Auswahl (Checkout kennt kein
// automatic_payment_methods-Feld wie PaymentIntents — das waere der
// Checkout-eigene Weg dorthin, wurde aber verworfen: automatisch haette
// auch fuer die Zielgruppe irrelevante, im Stripe-Dashboard aktivierte
// Methoden gezeigt, z.B. MB WAY/Satispay/Bancontact/eps/BLIK). Apple Pay
// und Google Pay sind KEINE eigenen payment_method_types-Werte — sie
// erscheinen automatisch als Express-Checkout-Wallet-Buttons, sobald
// "card" in der Liste steht und Geraet/Browser sie unterstuetzt.
// sepa_debit (SEPA-Lastschrift) bewusst NICHT in der Liste (Nutzer-
// Entscheidung) — Zahlungseingang dauert dort mehrere Tage, was fuer
// ein Produkt mit sofortiger Freischaltung nach Zahlung nicht passt.
// Damit paypal echten Kunden angezeigt wird, muss es zusaetzlich im
// LIVE-Stripe-Dashboard aktiviert werden — im Testmodus akzeptiert die
// API es bereits ohne diesen Schritt.
export const CHECKOUT_PAYMENT_METHOD_TYPES: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] = [
  "card",
  "klarna",
  "paypal",
];
