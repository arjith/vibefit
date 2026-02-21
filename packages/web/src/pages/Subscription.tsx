import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: string | null;
  features: string[];
  limits: { maxRoutines: number; freezesPerWeek: number; aiCoachMessages: number };
  highlight: boolean;
  trialDays?: number;
}

export function Subscription() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentTier, setCurrentTier] = useState('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [plansRes, subRes] = await Promise.all([
          api.get('/subscription/plans'),
          api.get('/subscription'),
        ]);
        setPlans(plansRes.data.data);
        setCurrentTier(subRes.data.data.tier);
      } catch {
        // Non-critical
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const featureLabels: Record<string, string> = {
    'exercise-library': '📚 Exercise Library',
    'basic-tracking': '📊 Basic Tracking',
    'streaks': '🔥 Streak System',
    'achievements': '🏆 Achievements',
    'basic-analytics': '📈 Basic Analytics',
    'unlimited-routines': '♾️ Unlimited Routines',
    'ai-coach': '🤖 AI Coach',
    'advanced-analytics': '📊 Advanced Analytics',
    'adherence-prediction': '🧠 Adherence Prediction',
    'adaptive-difficulty': '⚡ Adaptive Difficulty',
    'extra-freezes': '❄️ 3 Streak Freezes/Week',
    'form-cues': '🎯 Form Cue Engine',
    'biomech-substitution': '🔄 Smart Substitutions',
    'create-programs': '📝 Create & Sell Programs',
    'client-management': '👥 Client Management',
    'revenue-share': '💰 Revenue Share',
  };

  if (loading) {
    return <div className="page-loading">Loading plans...</div>;
  }

  return (
    <div className="subscription-page">
      <div className="subscription-header">
        <h1>Choose Your Plan</h1>
        <p>Unlock your full potential with VibeFit Pro</p>
      </div>

      <div className="plans-grid">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`plan-card ${plan.highlight ? 'plan-card--highlight' : ''} ${currentTier === plan.id ? 'plan-card--current' : ''}`}
          >
            {plan.highlight && <div className="plan-badge">Most Popular</div>}
            {currentTier === plan.id && <div className="plan-badge plan-badge--current">Current Plan</div>}

            <h2 className="plan-name">{plan.name}</h2>
            <div className="plan-price">
              {plan.price === 0 ? (
                <span className="plan-price__amount">Free</span>
              ) : (
                <>
                  <span className="plan-price__currency">$</span>
                  <span className="plan-price__amount">{plan.price}</span>
                  <span className="plan-price__interval">/{plan.interval}</span>
                </>
              )}
            </div>

            {plan.trialDays && currentTier === 'free' && (
              <div className="plan-trial">{plan.trialDays}-day free trial</div>
            )}

            <ul className="plan-features">
              {plan.features.map((f) => (
                <li key={f}>{featureLabels[f] ?? f}</li>
              ))}
            </ul>

            <div className="plan-limits">
              <span>Routines: {plan.limits.maxRoutines === -1 ? 'Unlimited' : plan.limits.maxRoutines}</span>
              <span>Freezes: {plan.limits.freezesPerWeek}/week</span>
            </div>

            {currentTier !== plan.id && plan.price > 0 && (
              <button
                className="vf-btn vf-btn--primary plan-cta"
                onClick={() => alert('Stripe integration coming soon!')}
              >
                {plan.trialDays ? `Start ${plan.trialDays}-Day Trial` : `Upgrade to ${plan.name}`}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
