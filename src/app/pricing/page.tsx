'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Check, Crown, Zap, Shield } from 'lucide-react';
import { PaymentModal } from '@/components/PaymentModal';

const plans = [
  {
    id: 'DAILY',
    name: 'Daily',
    price: 50,
    period: 'day',
    description: 'Perfect for testing the waters',
    features: [
      'All VIP predictions for 24 hours',
      'Expert analysis & reasoning',
      'Real-time updates',
    ],
    icon: Zap,
  },
  {
    id: 'WEEKLY',
    name: 'Weekly',
    price: 250,
    period: 'week',
    description: 'Most popular choice',
    features: [
      'All VIP predictions for 7 days',
      'Expert analysis & reasoning',
      'Real-time updates',
      'Weekend specials',
    ],
    icon: Crown,
    popular: true,
  },
  {
    id: 'MONTHLY',
    name: 'Monthly',
    price: 800,
    period: 'month',
    description: 'Best value for serious bettors',
    features: [
      'All VIP predictions for 30 days',
      'Expert analysis & reasoning',
      'Real-time updates',
      'Weekend specials',
      'Priority support',
    ],
    icon: Shield,
  },
];

export default function PricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<{
    type: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    amount: number;
  } | null>(null);

  const handleSelectPlan = (planId: string, price: number) => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/pricing');
      return;
    }

    if (session?.user?.hasActiveSubscription) {
      return;
    }

    setSelectedPlan({
      type: planId as 'DAILY' | 'WEEKLY' | 'MONTHLY',
      amount: price,
    });
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose Your VIP Plan
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Get access to all premium predictions. Pay securely via M-Pesa.
          </p>
          
          {session?.user?.hasActiveSubscription && (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-full">
              <Check size={20} />
              <span>You have an active subscription</span>
            </div>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isDisabled = session?.user?.hasActiveSubscription;
            
            return (
              <div
                key={plan.id}
                className={`relative bg-dark-100 rounded-2xl border ${
                  plan.popular 
                    ? 'border-primary-500 ring-2 ring-primary-500/20' 
                    : 'border-slate-800'
                } p-8 flex flex-col`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary-600 text-white text-sm font-medium rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    plan.popular ? 'bg-primary-500/20' : 'bg-slate-800'
                  }`}>
                    <Icon className={plan.popular ? 'text-primary-500' : 'text-slate-400'} size={28} />
                  </div>
                  <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                  <p className="text-slate-400 text-sm mt-1">{plan.description}</p>
                </div>

                <div className="text-center mb-6">
                  <span className="text-4xl font-bold text-white">KES {plan.price}</span>
                  <span className="text-slate-400">/{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-slate-300">
                      <Check className="text-primary-500 flex-shrink-0" size={18} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan.id, plan.price)}
                  disabled={isDisabled}
                  className={`w-full py-3 rounded-xl font-semibold transition ${
                    plan.popular
                      ? 'bg-primary-600 hover:bg-primary-500 text-white glow-green'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isDisabled ? 'Already Subscribed' : 'Get Started'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Trust badges */}
        <div className="mt-16 text-center">
          <p className="text-slate-400 mb-4">Secure payment via</p>
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-dark-100 rounded-full border border-slate-800">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              M
            </div>
            <span className="text-white font-semibold">M-Pesa</span>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedPlan && (
        <PaymentModal
          planType={selectedPlan.type}
          amount={selectedPlan.amount}
          onClose={() => setSelectedPlan(null)}
        />
      )}
    </div>
  );
}
