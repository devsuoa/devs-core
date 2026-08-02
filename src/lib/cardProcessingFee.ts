/**
 * Estimated Stripe card processing cost passed on to the payer (NZD).
 * Defaults match typical NZ online card pricing; override on the server via
 * STRIPE_CARD_FEE_PERCENT / STRIPE_CARD_FEE_FIXED on the Edge Function.
 */
export const DEFAULT_STRIPE_CARD_FEE_PERCENT = 0.029;
export const DEFAULT_STRIPE_CARD_FEE_FIXED_NZD = 0.3;

/** Total charged for card checkout: (per-person price × seats) + % + fixed (same formula as create-event-checkout-session). */
export function cardCheckoutTotalFromBaseAmount(base: number): number {
  if (!Number.isFinite(base) || base <= 0) return 0;
  return (
    Math.round(
      (base * (1 + DEFAULT_STRIPE_CARD_FEE_PERCENT) +
        DEFAULT_STRIPE_CARD_FEE_FIXED_NZD) *
        100,
    ) / 100
  );
}

export function formatNzd(amount: number): string {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 2,
  }).format(amount);
}
