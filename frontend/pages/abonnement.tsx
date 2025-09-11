/**
 * Page d'abonnement et paiement
 * Gestion des plans d'abonnement et paiements via MTN MoMo / Orange Money
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

// Components
import Layout from '../components/Layout';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Hooks
import { useAuth } from '../hooks/useAuth';

// Types
interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  fees: string;
  minAmount: number;
  maxAmount: number;
  available: boolean;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: string;
  originalPrice?: number;
  features: string[];
  popular: boolean;
}

interface PaymentData {
  methods: PaymentMethod[];
  wallet: {
    balance: number;
    currency: string;
    lastUpdate: string;
  };
}

interface PaymentState {
  selectedPlan: SubscriptionPlan | null;
  selectedMethod: PaymentMethod | null;
  phone: string;
  isProcessing: boolean;
  transactionId: string | null;
  paymentStatus: 'pending' | 'completed' | 'failed' | null;
}

export default function AbonnementPage() {
  const router = useRouter();
  const { user, family, isLoading } = useAuth();
  
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>({
    selectedPlan: null,
    selectedMethod: null,
    phone: '',
    isProcessing: false,
    transactionId: null,
    paymentStatus: null
  });
  const [activeTab, setActiveTab] = useState<'plans' | 'payment' | 'wallet'>('plans');
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Redirection si non connecté
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  // Charger les données
  useEffect(() => {
    if (user && family) {
      fetchPlans();
      fetchPaymentMethods();
    }
  }, [user, family]);

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscriptions/plans`);
      const data = await response.json();
      
      if (data.success) {
        setPlans(data.data.plans);
      }
    } catch (error) {
      console.error('Erreur chargement plans:', error);
      toast.error('Erreur lors du chargement des plans');
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/methods`);
      const data = await response.json();
      
      if (data.success) {
        setPaymentData(data.data);
      }
      setIsLoadingData(false);
    } catch (error) {
      console.error('Erreur chargement paiements:', error);
      toast.error('Erreur lors du chargement des méthodes de paiement');
      setIsLoadingData(false);
    }
  };

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setPaymentState(prev => ({
      ...prev,
      selectedPlan: plan,
      selectedMethod: null,
      phone: '',
      transactionId: null,
      paymentStatus: null
    }));
    setActiveTab('payment');
  };

  const handleMethodSelect = (method: PaymentMethod) => {
    setPaymentState(prev => ({
      ...prev,
      selectedMethod: method
    }));
  };

  const handlePhoneChange = (phone: string) => {
    // Validation et formatage du numéro camerounais
    const cleaned = phone.replace(/\D/g, '');
    let formatted = cleaned;
    
    if (cleaned.startsWith('237')) {
      formatted = '+' + cleaned;
    } else if (cleaned.startsWith('6') && cleaned.length === 9) {
      formatted = '+237' + cleaned;
    } else if (cleaned.length === 9) {
      formatted = '+237' + cleaned;
    }

    setPaymentState(prev => ({
      ...prev,
      phone: formatted
    }));
  };

  const handlePayment = async () => {
    if (!paymentState.selectedPlan || !paymentState.selectedMethod) {
      toast.error('Veuillez sélectionner un plan et une méthode de paiement');
      return;
    }

    if ((paymentState.selectedMethod.id === 'mtn_momo' || paymentState.selectedMethod.id === 'orange_money') && !paymentState.phone) {
      toast.error('Veuillez saisir votre numéro de téléphone');
      return;
    }

    setPaymentState(prev => ({ ...prev, isProcessing: true }));

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: paymentState.selectedPlan.price,
          method: paymentState.selectedMethod.id,
          planId: paymentState.selectedPlan.id,
          phone: paymentState.phone
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setPaymentState(prev => ({
          ...prev,
          transactionId: data.data.transactionId,
          paymentStatus: 'pending'
        }));
        toast.success(data.data.message);
        
        // Vérifier le statut du paiement périodiquement
        checkPaymentStatus(data.data.transactionId);
      } else {
        toast.error(data.message || 'Erreur lors de l\'initialisation du paiement');
      }
    } catch (error) {
      console.error('Erreur paiement:', error);
      toast.error('Erreur lors du paiement');
    } finally {
      setPaymentState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const checkPaymentStatus = async (transactionId: string) => {
    const maxAttempts = 10;
    let attempts = 0;

    const check = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/${transactionId}/status`);
        const data = await response.json();
        
        if (data.success) {
          if (data.data.status === 'completed') {
            setPaymentState(prev => ({ ...prev, paymentStatus: 'completed' }));
            toast.success(data.data.message);
            return;
          } else if (data.data.status === 'failed') {
            setPaymentState(prev => ({ ...prev, paymentStatus: 'failed' }));
            toast.error(data.data.message);
            return;
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(check, 3000); // Vérifier toutes les 3 secondes
        } else {
          toast.error('Délai d\'attente dépassé. Veuillez vérifier votre paiement.');
        }
      } catch (error) {
        console.error('Erreur vérification statut:', error);
      }
    };

    setTimeout(check, 2000); // Première vérification après 2 secondes
  };

  const formatPrice = (price: number, currency: string = 'XAF') => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' ' + currency;
  };

  // Loading initial
  if (isLoading || isLoadingData) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>Abonnement - {family?.name || 'Test'} | Claudyne</title>
        <meta name="description" content="Choisissez votre plan d'abonnement Claudyne et payez via MTN MoMo ou Orange Money" />
      </Head>

      <Layout>
        <div className="max-w-6xl mx-auto space-y-8">
          {/* En-tête */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-neutral-800 mb-2">
              💳 Abonnement & Paiement
            </h1>
            <p className="text-neutral-600">
              Choisissez votre plan et payez facilement via MTN MoMo ou Orange Money
            </p>
          </motion.div>

          {/* Onglets */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="border-b border-neutral-200">
              <div className="flex">
                {[
                  { key: 'plans', label: '📋 Plans d\'abonnement' },
                  { key: 'payment', label: '💳 Paiement', disabled: !paymentState.selectedPlan },
                  { key: 'wallet', label: '👛 Mon portefeuille' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => !tab.disabled && setActiveTab(tab.key as any)}
                    disabled={tab.disabled}
                    className={`px-6 py-4 font-medium transition-colors ${
                      activeTab === tab.key
                        ? 'text-primary-green border-b-2 border-primary-green'
                        : tab.disabled
                        ? 'text-neutral-400 cursor-not-allowed'
                        : 'text-neutral-600 hover:text-neutral-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-8">
              <AnimatePresence mode="wait">
                {activeTab === 'plans' && (
                  <motion.div
                    key="plans"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <h2 className="text-2xl font-semibold text-neutral-800 mb-6">
                      Choisissez votre plan d'abonnement
                    </h2>
                    
                    <div className="grid md:grid-cols-3 gap-8">
                      {plans.map((plan, index) => (
                        <motion.div
                          key={plan.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`relative bg-white rounded-2xl border-2 p-8 ${
                            plan.popular 
                              ? 'border-claudine-gold shadow-lg' 
                              : 'border-neutral-200 hover:border-neutral-300'
                          } transition-all cursor-pointer`}
                          onClick={() => handlePlanSelect(plan)}
                        >
                          {plan.popular && (
                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                              <span className="bg-claudine-gold text-white px-4 py-1 rounded-full text-sm font-medium">
                                🌟 Populaire
                              </span>
                            </div>
                          )}

                          <div className="text-center">
                            <h3 className="text-xl font-bold text-neutral-800 mb-2">
                              {plan.name}
                            </h3>
                            <p className="text-neutral-600 text-sm mb-6">
                              {plan.description}
                            </p>

                            <div className="mb-6">
                              <div className="text-4xl font-bold text-primary-green">
                                {formatPrice(plan.price)}
                              </div>
                              {plan.originalPrice && (
                                <div className="text-neutral-400 line-through text-lg">
                                  {formatPrice(plan.originalPrice)}
                                </div>
                              )}
                              <div className="text-neutral-500 text-sm">
                                par {plan.duration === 'monthly' ? 'mois' : 'an'}
                              </div>
                            </div>

                            <ul className="text-left space-y-3 mb-8">
                              {plan.features.map((feature, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs mr-3 mt-0.5">
                                    ✓
                                  </span>
                                  <span className="text-neutral-700 text-sm">{feature}</span>
                                </li>
                              ))}
                            </ul>

                            <button
                              onClick={() => handlePlanSelect(plan)}
                              className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                                plan.popular
                                  ? 'bg-claudine-gold text-white hover:bg-yellow-500'
                                  : 'bg-primary-green text-white hover:bg-green-600'
                              }`}
                            >
                              Choisir ce plan
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'payment' && paymentState.selectedPlan && (
                  <motion.div
                    key="payment"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <div className="max-w-2xl mx-auto">
                      <h2 className="text-2xl font-semibold text-neutral-800 mb-6">
                        Finaliser le paiement
                      </h2>

                      {/* Résumé du plan sélectionné */}
                      <div className="bg-neutral-50 rounded-xl p-6 mb-8">
                        <h3 className="font-semibold text-neutral-800 mb-2">
                          Plan sélectionné: {paymentState.selectedPlan.name}
                        </h3>
                        <div className="flex justify-between items-center">
                          <span className="text-neutral-600">Prix</span>
                          <span className="text-xl font-bold text-primary-green">
                            {formatPrice(paymentState.selectedPlan.price)}
                          </span>
                        </div>
                      </div>

                      {paymentState.paymentStatus === null && (
                        <>
                          {/* Méthodes de paiement */}
                          <div className="mb-8">
                            <h3 className="font-semibold text-neutral-800 mb-4">
                              Choisir une méthode de paiement
                            </h3>
                            <div className="space-y-3">
                              {paymentData?.methods.map((method) => (
                                <motion.div
                                  key={method.id}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => handleMethodSelect(method)}
                                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                    paymentState.selectedMethod?.id === method.id
                                      ? 'border-primary-green bg-green-50'
                                      : 'border-neutral-200 hover:border-neutral-300'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      <div className="text-2xl mr-4">{method.icon}</div>
                                      <div>
                                        <div className="font-semibold text-neutral-800">
                                          {method.name}
                                        </div>
                                        <div className="text-sm text-neutral-600">
                                          {method.description} • Frais: {method.fees}
                                        </div>
                                      </div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 ${
                                      paymentState.selectedMethod?.id === method.id
                                        ? 'border-primary-green bg-primary-green'
                                        : 'border-neutral-300'
                                    }`}>
                                      {paymentState.selectedMethod?.id === method.id && (
                                        <span className="text-white text-sm flex items-center justify-center h-full">
                                          ✓
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>

                          {/* Numéro de téléphone pour Mobile Money */}
                          {(paymentState.selectedMethod?.id === 'mtn_momo' || paymentState.selectedMethod?.id === 'orange_money') && (
                            <div className="mb-8">
                              <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Numéro de téléphone
                              </label>
                              <input
                                type="tel"
                                value={paymentState.phone}
                                onChange={(e) => handlePhoneChange(e.target.value)}
                                placeholder="+237 6XX XXX XXX"
                                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent"
                              />
                              <p className="text-xs text-neutral-500 mt-1">
                                Utilisez le numéro associé à votre compte {paymentState.selectedMethod.name}
                              </p>
                            </div>
                          )}

                          {/* Bouton de paiement */}
                          <button
                            onClick={handlePayment}
                            disabled={paymentState.isProcessing || !paymentState.selectedMethod}
                            className="w-full bg-claudine-gold text-white py-4 px-6 rounded-lg font-semibold hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                          >
                            {paymentState.isProcessing ? (
                              <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                Traitement en cours...
                              </>
                            ) : (
                              `Payer ${formatPrice(paymentState.selectedPlan.price)}`
                            )}
                          </button>
                        </>
                      )}

                      {/* Statut du paiement */}
                      {paymentState.paymentStatus === 'pending' && (
                        <div className="text-center py-8">
                          <LoadingSpinner size="lg" className="mb-4" />
                          <h3 className="text-xl font-semibold text-neutral-800 mb-2">
                            Paiement en cours...
                          </h3>
                          <p className="text-neutral-600">
                            Veuillez suivre les instructions sur votre téléphone
                          </p>
                        </div>
                      )}

                      {paymentState.paymentStatus === 'completed' && (
                        <div className="text-center py-8">
                          <div className="text-6xl mb-4">🎉</div>
                          <h3 className="text-2xl font-bold text-green-600 mb-2">
                            Paiement confirmé !
                          </h3>
                          <p className="text-neutral-600 mb-6">
                            Votre abonnement {paymentState.selectedPlan.name} est maintenant actif.
                          </p>
                          <button
                            onClick={() => router.push('/famille')}
                            className="bg-primary-green text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
                          >
                            Retour au tableau de bord
                          </button>
                        </div>
                      )}

                      {paymentState.paymentStatus === 'failed' && (
                        <div className="text-center py-8">
                          <div className="text-6xl mb-4">❌</div>
                          <h3 className="text-2xl font-bold text-red-600 mb-2">
                            Paiement échoué
                          </h3>
                          <p className="text-neutral-600 mb-6">
                            Une erreur s'est produite lors du traitement de votre paiement.
                          </p>
                          <button
                            onClick={() => setPaymentState(prev => ({ 
                              ...prev, 
                              paymentStatus: null, 
                              transactionId: null 
                            }))}
                            className="bg-primary-green text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
                          >
                            Réessayer
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'wallet' && paymentData && (
                  <motion.div
                    key="wallet"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <h2 className="text-2xl font-semibold text-neutral-800 mb-6">
                      Mon portefeuille Claudyne
                    </h2>

                    {/* Solde */}
                    <div className="bg-gradient-to-r from-primary-green to-accent-purple text-white rounded-2xl p-8 mb-8">
                      <div className="text-center">
                        <div className="text-sm opacity-90 mb-2">Solde actuel</div>
                        <div className="text-4xl font-bold mb-2">
                          {formatPrice(paymentData.wallet.balance, paymentData.wallet.currency)}
                        </div>
                        <div className="text-sm opacity-75">
                          Dernière mise à jour: {new Date(paymentData.wallet.lastUpdate).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-neutral-50 rounded-xl p-6">
                        <h3 className="font-semibold text-neutral-800 mb-4">
                          💰 Recharger le portefeuille
                        </h3>
                        <p className="text-neutral-600 text-sm mb-4">
                          Rechargez votre portefeuille pour payer vos abonnements et achats.
                        </p>
                        <button className="bg-claudine-gold text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-500 transition-colors">
                          Recharger
                        </button>
                      </div>

                      <div className="bg-neutral-50 rounded-xl p-6">
                        <h3 className="font-semibold text-neutral-800 mb-4">
                          📊 Historique des transactions
                        </h3>
                        <p className="text-neutral-600 text-sm mb-4">
                          Consultez l'historique de vos paiements et recharges.
                        </p>
                        <button className="bg-neutral-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-neutral-700 transition-colors">
                          Voir l'historique
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}