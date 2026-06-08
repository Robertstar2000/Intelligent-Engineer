// Stripe billing scaffold for MIFECO VibraEngineer
// Placeholder constants — replace with real Stripe payment link IDs when ready

import { Tier } from './tiers';

export type BillingCycle = 'monthly' | 'annual';

// Placeholder Stripe payment link IDs — replace these with your real Stripe Payment Link IDs
// Dashboard: https://dashboard.stripe.com/payment-links
const STRIPE_PAYMENT_LINKS: Record<Tier, Record<BillingCycle, string>> = {
  free: {
    monthly: '',
    annual: '',
  },
  pro: {
    monthly: 'https://buy.stripe.com/test_placeholder_monthly',  // Replace with real link
    annual: 'https://buy.stripe.com/test_placeholder_annual',    // Replace with real link
  },
};

/**
 * Returns the Stripe checkout URL for the given tier and billing cycle.
 * Pass the user's email as `customerEmail` to pre-fill it on the Stripe checkout page.
 */
export function getStripeCheckoutUrl(
  tier: Tier,
  billingCycle: BillingCycle,
  customerEmail?: string
): string {
  if (tier === 'free') return '';

  const baseUrl = STRIPE_PAYMENT_LINKS[tier][billingCycle];
  if (!baseUrl) return '';

  if (customerEmail) {
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}customer_email=${encodeURIComponent(customerEmail)}`;
  }

  return baseUrl;
}
