import React from 'react';
import { Check, Zap, Building, Globe, Shield, Cpu, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 490,
    period: 'mois',
    description: 'Pour les petites entreprises',
    features: [
      '500 requêtes IA/mois',
      'Jusqu\'à 5 membres',
      'Analyse de documents',
      'Support par email',
      'Dashboard de base',
    ],
    notIncluded: ['API access', ' SSO', 'Formation'],
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 1490,
    period: 'mois',
    description: 'Pour les entreprises en croissance',
    features: [
      '5,000 requêtes IA/mois',
      'Jusqu\'à 25 membres',
      'Analyse illimitée de documents',
      'Priority support',
      'Dashboard avancé',
      'Export Excel/PDF',
      'API access',
    ],
    notIncluded: ['SSO', 'Formation'],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    period: 'contact',
    description: 'Pour les grandes organisations',
    features: [
      'Requêtes IA illimitées',
      'Membres illimités',
      'Support dédié 24/7',
      'Formation incluse',
      'SSO / SAML',
      'On-premise option',
      'API dédiée',
      'SLAs garantis',
    ],
    notIncluded: [],
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero */}
      <div className="py-20 text-center px-4">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
          <Zap size={16} />
          Pricing
        </div>
        <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900 mb-4">
          Choisissez votre plan
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Des tarifs adaptés à la taille de votre enterprise. 
          Commencez gratuitement,vez évoluez.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-3 gap-8">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-3xl p-8 border-2 transition-all hover:shadow-2xl ${
                plan.popular
                  ? 'border-blue-600 shadow-xl scale-105 z-10'
                  : 'border-slate-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                  PLUS POPULAIRE
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-black uppercase tracking-tight">
                  {plan.name}
                </h3>
                <p className="text-slate-500 text-sm">{plan.description}</p>
              </div>

              <div className="mb-6">
                {plan.price ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-slate-900">
                      {plan.price}
                    </span>
                    <span className="text-slate-500">DH/{plan.period}</span>
                  </div>
                ) : (
                  <div className="text-4xl font-black text-slate-900">
                    Sur devis
                  </div>
                )}
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className="text-emerald-500 flex-shrink-0" size={20} />
                    <span>{feature}</span>
                  </li>
                ))}
                {plan.notIncluded.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-slate-400">
                    <div className="w-5 h-5 flex-shrink-0" />
                    <span className="line-through">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/register"
                className={`block w-full py-4 rounded-2xl text-center font-bold transition-colors ${
                  plan.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                }`}
              >
                {plan.price ? 'Commencer' : 'Contactez-nous'}
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Features comparison */}
      <div className="bg-slate-900 text-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-black text-center mb-12">
            Tout ce dont vous avez besoin
          </h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <Shield className="mx-auto mb-4 text-blue-400" size={40} />
              <h3 className="font-bold mb-2">Sécurisé</h3>
              <p className="text-slate-400 text-sm">
                Conforme loi 09-08<br />
                Données au Maroc
              </p>
            </div>
            
            <div className="text-center">
              <Cpu className="mx-auto mb-4 text-blue-400" size={40} />
              <h3 className="font-bold mb-2">IA Souveraine</h3>
              <p className="text-slate-400 text-sm">
                Vos données ne<br />
                quittent jamais le pays
              </p>
            </div>
            
            <div className="text-center">
              <Globe className="mx-auto mb-4 text-blue-400" size={40} />
              <h3 className="font-bold mb-2">Multilingue</h3>
              <p className="text-slate-400 text-sm">
                Français, Anglais<br />
                Arabe disponible
              </p>
            </div>
            
            <div className="text-center">
              <CreditCard className="mx-auto mb-4 text-blue-400" size={40} />
              <h3 className="font-bold mb-2">Paiement local</h3>
              <p className="text-slate-400 text-sm">
                Dirham MAD<br />
                Facturation simple
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-12">
            Questions fréquentes
          </h2>
          
          <div className="space-y-6">
            {[
              {
                q: 'Puis-je changer de plan à tout moment ?',
                r: 'Oui, vous pouvez passer à un plan supérieur ou inférieur à tout moment. Les paiements sont ajustés au pro-rata.',
              },
              {
                q: 'Les données sont-elles vraiment sécurisées ?',
                r: 'Absolutely. Conforme à la loi 09-08 Maroc, vos données restent sur des serveurs au Maroc. Le PII masking assure l\'anonymat.',
              },
              {
                q: 'Comment fonctionne la facturation ?',
                r: 'Facturation mensuelle par entreprise. Modes de paiement: virement bancaire, MASI, ou carte bancaire via Paddle.',
              },
              {
                q: 'Proposez-vous un essai gratuit ?',
                r: 'Oui! 14 jours d\'essai sur le plan Pro, sans engagement. Aucune carte requise.',
              },
            ].map((faq, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6">
                <h3 className="font-bold text-lg mb-2">{faq.q}</h3>
                <p className="text-slate-600">{faq.r}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}