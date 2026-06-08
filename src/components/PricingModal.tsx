import React from 'react';
import { Check, X, Sparkles } from 'lucide-react';
import { Button, Badge } from './ui';
import { FREE, PRO, isPro, PRO_PRICE_MONTHLY, PRO_PRICE_ANNUAL } from '../lib/tiers';
import { BillingCycle, getStripeCheckoutUrl } from '../lib/stripe';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: Tier;
  userEmail?: string;
}

type Tier = 'free' | 'pro';

const FeatureRow = ({ label, free, pro }: { label: string; free: boolean | string; pro: boolean | string }) => (
  <tr>
    <td className="py-3 text-sm text-gray-700 dark:text-gray-300">{label}</td>
    <td className="py-3 text-center">
      {typeof free === 'boolean' ? (
        free ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-gray-400 mx-auto" />
      ) : (
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{free}</span>
      )}
    </td>
    <td className="py-3 text-center">
      {typeof pro === 'boolean' ? (
        pro ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : <X className="w-5 h-5 text-gray-400 mx-auto" />
      ) : (
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{pro}</span>
      )}
    </td>
  </tr>
);

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, currentTier, userEmail }) => {
  const [billingCycle, setBillingCycle] = React.useState<BillingCycle>('monthly');
  const [showAnnual, setShowAnnual] = React.useState(false);

  if (!isOpen) return null;

  const isCurrentPlan = (tier: Tier) => tier === currentTier;

  const handleUpgrade = (tier: Tier) => {
    if (tier === 'free') return;
    const url = getStripeCheckoutUrl(tier, billingCycle, userEmail);
    if (url) window.open(url, '_blank');
  };

  const monthlyPrice = PRO_PRICE_MONTHLY;
  const annualPrice = PRO_PRICE_ANNUAL;
  const effectivePrice = showAnnual ? Math.round(annualPrice / 12) : monthlyPrice;
  const savings = Math.round(((monthlyPrice * 12 - annualPrice) / (monthlyPrice * 12)) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-charcoal-900 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-charcoal-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-2 text-center">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Choose Your Plan</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none">&times;</button>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
            Unlock the full power of MIFECO VibraEngineer
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-gray-100 dark:bg-charcoal-800 rounded-lg p-1 mb-2">
            <button
              onClick={() => setShowAnnual(false)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                !showAnnual
                  ? 'bg-white dark:bg-charcoal-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setShowAnnual(true)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                showAnnual
                  ? 'bg-white dark:bg-charcoal-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Annual
              {savings > 0 && (
                <Badge variant="success" className="text-xs">Save {savings}%</Badge>
              )}
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="px-6 grid grid-cols-2 gap-4 mb-6">
          {/* Free Plan */}
          <div className={`rounded-xl border-2 p-5 ${isCurrentPlan(FREE) ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-200 dark:border-charcoal-700'}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Free</h3>
              {isCurrentPlan(FREE) && <Badge variant="info">Current</Badge>}
            </div>
            <div className="mb-4">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">$0</span>
              <span className="text-gray-500 dark:text-gray-400 text-sm">/mo</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Get started with the basics</p>
            <Button
              variant="outline"
              className="w-full"
              disabled={isCurrentPlan(FREE)}
              onClick={() => {}}
            >
              {isCurrentPlan(FREE) ? 'Your Plan' : 'Downgrade'}
            </Button>
          </div>

          {/* Pro Plan */}
          <div className={`rounded-xl border-2 p-5 relative ${isCurrentPlan(PRO) ? 'border-brand-primary bg-brand-primary/5' : 'border-brand-primary/50 bg-brand-primary/5'}`}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge variant="warning" className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Most Popular
              </Badge>
            </div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Pro</h3>
              {isCurrentPlan(PRO) && <Badge variant="info">Current</Badge>}
            </div>
            <div className="mb-4">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">${effectivePrice}</span>
              <span className="text-gray-500 dark:text-gray-400 text-sm">/mo</span>
              {showAnnual && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Billed ${annualPrice}/year
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Full access to all features</p>
            <Button
              variant="primary"
              className="w-full"
              disabled={isCurrentPlan(PRO)}
              onClick={() => handleUpgrade(PRO)}
            >
              {isCurrentPlan(PRO) ? 'Your Plan' : 'Upgrade to Pro'}
            </Button>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="px-6 pb-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-charcoal-700">
                <th className="text-left text-sm font-medium text-gray-500 dark:text-gray-400 pb-2">Feature</th>
                <th className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 pb-2 w-24">Free</th>
                <th className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 pb-2 w-24">Pro</th>
              </tr>
            </thead>
            <tbody>
              <FeatureRow label="Projects" free="3" pro="Unlimited" />
              <FeatureRow label="Phases per project" free="5" pro="Unlimited" />
              <FeatureRow label="Automation Engine" free={false} pro={true} />
              <FeatureRow label="Analytics Dashboard" free={false} pro={true} />
              <FeatureRow label="Export (PDF, DOCX)" free={false} pro={true} />
              <FeatureRow label="Team Collaboration" free={false} pro={true} />
              <FeatureRow label="Priority support" free={false} pro={true} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
