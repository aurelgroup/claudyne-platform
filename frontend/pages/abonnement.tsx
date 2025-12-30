/**
 * Page Abonnement - ULTRA MODERNE v2.0 🚀
 * Design glassmorphism, pricing cards premium, animations de célébration
 * Interface de paiement optimisée avec MTN MoMo & Orange Money
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

// Services
import { apiService } from '../services/api';

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

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12
    }
  }
};

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
      const response = await apiService.getSubscriptionPlans();

      if (response.success && response.data) {
        setPlans(response.data.plans || []);
      }
    } catch (error: any) {
      console.error('Erreur chargement plans:', error);
      toast.error(error.message || 'Erreur lors du chargement des plans');
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await apiService.getPaymentMethods();

      if (response.success && response.data) {
        setPaymentData(response.data);
      }
      setIsLoadingData(false);
    } catch (error: any) {
      console.error('Erreur chargement paiements:', error);
      toast.error(error.message || 'Erreur lors du chargement des méthodes de paiement');
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
      const response = await apiService.initializePayment({
        amount: paymentState.selectedPlan.price,
        paymentMethod: paymentState.selectedMethod.id,
        type: 'subscription',
        planId: paymentState.selectedPlan.id,
        phone: paymentState.phone
      });

      if (response.success && response.data) {
        setPaymentState(prev => ({
          ...prev,
          transactionId: response.data.transactionId,
          paymentStatus: 'pending'
        }));
        toast.success(response.data.message || 'Paiement initialisé');

        checkPaymentStatus(response.data.transactionId);
      } else {
        toast.error(response.message || 'Erreur lors de l\'initialisation du paiement');
      }
    } catch (error: any) {
      console.error('Erreur paiement:', error);
      toast.error(error.message || 'Erreur lors du paiement');
    } finally {
      setPaymentState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const checkPaymentStatus = async (transactionId: string) => {
    const maxAttempts = 10;
    let attempts = 0;

    const check = async () => {
      try {
        const response = await apiService.getPaymentStatus(transactionId);

        if (response.success && response.data) {
          if (response.data.status === 'completed') {
            setPaymentState(prev => ({ ...prev, paymentStatus: 'completed' }));
            toast.success(response.data.message || 'Paiement confirmé !');
            return;
          } else if (response.data.status === 'failed') {
            setPaymentState(prev => ({ ...prev, paymentStatus: 'failed' }));
            toast.error(response.data.message || 'Paiement échoué');
            return;
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(check, 3000);
        } else {
          toast.error('Délai d\'attente dépassé. Veuillez vérifier votre paiement.');
        }
      } catch (error: any) {
        console.error('Erreur vérification statut:', error);
      }
    };

    setTimeout(check, 2000);
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
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-7xl mx-auto space-y-6"
        >
          {/* 🎨 HEADER GLASSMORPHISM */}
          <motion.div variants={itemVariants}>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-claudine-gold via-orange-500 to-amber-600 p-1">
              <div className="relative bg-gradient-to-br from-claudine-gold/95 via-orange-500/95 to-amber-600/95 backdrop-blur-xl rounded-3xl p-8">
                {/* Animated background */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-1/4 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
                  <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-yellow-300 rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>

                <div className="relative z-10">
                  <motion.h1
                    className="text-4xl md:text-5xl font-bold text-white mb-3"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    💳 Abonnement Premium
                  </motion.h1>
                  <motion.p
                    className="text-xl text-white/90"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Choisissez votre plan et payez facilement via Mobile Money
                  </motion.p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 📈 ONGLETS MODERNES */}
          <motion.div variants={itemVariants}>
            <div className="glassmorphism rounded-2xl overflow-hidden border border-white/30">
              {/* Tabs Header */}
              <div className="border-b border-neutral-200/50 bg-white/50 backdrop-blur-sm">
                <div className="flex flex-wrap gap-2 p-2">
                  {[
                    { key: 'plans', label: '📋 Plans d\'abonnement', icon: '📋' },
                    { key: 'payment', label: '💳 Paiement', icon: '💳', disabled: !paymentState.selectedPlan },
                    { key: 'wallet', label: '👛 Mon portefeuille', icon: '👛' }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => !tab.disabled && setActiveTab(tab.key as any)}
                      disabled={tab.disabled}
                      className={`flex-1 md:flex-none px-6 py-3 font-medium rounded-xl transition-all ${
                        activeTab === tab.key
                          ? 'bg-gradient-to-r from-claudine-gold to-orange-500 text-white shadow-lg scale-105'
                          : tab.disabled
                          ? 'text-neutral-400 cursor-not-allowed'
                          : 'text-neutral-700 hover:bg-white/50 hover:scale-105'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tabs Content */}
              <div className="p-8">
                <AnimatePresence mode="wait">
                  {activeTab === 'plans' && (
                    <motion.div
                      key="plans"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-8"
                    >
                      <h2 className="text-3xl font-bold text-neutral-800 text-center mb-6">
                        Choisissez votre plan d'abonnement
                      </h2>

                      <div className="grid md:grid-cols-3 gap-8">
                        {plans.map((plan, index) => (
                          <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -10, scale: 1.02 }}
                            className="group relative"
                          >
                            {/* Card with gradient border */}
                            <div className={`relative overflow-hidden rounded-3xl p-1 ${
                              plan.popular
                                ? 'bg-gradient-to-br from-claudine-gold via-orange-500 to-amber-600'
                                : 'bg-gradient-to-br from-primary-green to-accent-purple'
                            }`}>
                              <div className="relative bg-white rounded-3xl p-8">
                                {/* Popular badge */}
                                {plan.popular && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", delay: index * 0.1 + 0.2 }}
                                    className="absolute -top-4 left-1/2 transform -translate-x-1/2"
                                  >
                                    <span className="bg-gradient-to-r from-claudine-gold to-orange-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                                      🌟 Populaire
                                    </span>
                                  </motion.div>
                                )}

                                <div className="text-center">
                                  {/* Icon */}
                                  <motion.div
                                    className="text-6xl mb-4"
                                    whileHover={{ rotate: 360, scale: 1.2 }}
                                    transition={{ duration: 0.6 }}
                                  >
                                    {plan.popular ? '👑' : index === 0 ? '🎓' : '🚀'}
                                  </motion.div>

                                  <h3 className="text-2xl font-bold text-neutral-800 mb-2">
                                    {plan.name}
                                  </h3>
                                  <p className="text-neutral-600 text-sm mb-6">
                                    {plan.description}
                                  </p>

                                  {/* Price */}
                                  <div className="mb-8">
                                    <div className="flex items-baseline justify-center gap-2 mb-2">
                                      <div className={`text-5xl font-bold ${
                                        plan.popular ? 'text-claudine-gold' : 'text-primary-green'
                                      }`}>
                                        {plan.price.toLocaleString()}
                                      </div>
                                      <div className="text-neutral-500 text-sm">
                                        {plan.currency}
                                      </div>
                                    </div>
                                    {plan.originalPrice && (
                                      <div className="text-neutral-400 line-through text-lg mb-2">
                                        {formatPrice(plan.originalPrice)}
                                      </div>
                                    )}
                                    <div className="text-neutral-600 text-sm font-medium">
                                      par {plan.duration === 'monthly' ? 'mois' : 'an'}
                                    </div>
                                  </div>

                                  {/* Features */}
                                  <ul className="text-left space-y-4 mb-8">
                                    {plan.features.map((feature, idx) => (
                                      <motion.li
                                        key={idx}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 + idx * 0.05 }}
                                        className="flex items-start"
                                      >
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs mr-3 mt-0.5 ${
                                          plan.popular ? 'bg-claudine-gold' : 'bg-primary-green'
                                        }`}>
                                          ✓
                                        </span>
                                        <span className="text-neutral-700 text-sm flex-1">{feature}</span>
                                      </motion.li>
                                    ))}
                                  </ul>

                                  {/* CTA Button */}
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handlePlanSelect(plan)}
                                    className={`w-full py-4 px-6 rounded-xl font-bold text-white shadow-lg transition-all ${
                                      plan.popular
                                        ? 'bg-gradient-to-r from-claudine-gold to-orange-500 hover:shadow-2xl'
                                        : 'bg-gradient-to-r from-primary-green to-accent-purple hover:shadow-2xl'
                                    }`}
                                  >
                                    Choisir ce plan →
                                  </motion.button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'payment' && paymentState.selectedPlan && (
                    <motion.div
                      key="payment"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="max-w-3xl mx-auto space-y-8"
                    >
                      <h2 className="text-3xl font-bold text-neutral-800 text-center">
                        Finaliser le paiement
                      </h2>

                      {/* Plan Summary */}
                      <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="glassmorphism rounded-2xl p-6 border border-white/30"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-neutral-800 mb-1">
                              Plan sélectionné: {paymentState.selectedPlan.name}
                            </h3>
                            <p className="text-sm text-neutral-600">
                              {paymentState.selectedPlan.description}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-claudine-gold">
                              {formatPrice(paymentState.selectedPlan.price)}
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {paymentState.paymentStatus === null && (
                        <>
                          {/* Payment Methods */}
                          <div>
                            <h3 className="text-xl font-bold text-neutral-800 mb-6">
                              💳 Méthode de paiement
                            </h3>
                            <div className="space-y-4">
                              {paymentData?.methods.map((method, idx) => {
                                const isSelected = paymentState.selectedMethod?.id === method.id;
                                return (
                                  <motion.div
                                    key={method.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    whileHover={{ scale: 1.02, x: 5 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleMethodSelect(method)}
                                    className={`relative overflow-hidden rounded-2xl p-6 cursor-pointer border-2 transition-all ${
                                      isSelected
                                        ? 'border-primary-green bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg'
                                        : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-md'
                                    }`}
                                  >
                                    {isSelected && (
                                      <motion.div
                                        layoutId="payment-method-bg"
                                        className="absolute inset-0 bg-gradient-to-r from-primary-green/5 to-accent-purple/5"
                                      />
                                    )}

                                    <div className="relative flex items-center justify-between">
                                      <div className="flex items-center gap-4">
                                        <div className="text-4xl">{method.icon}</div>
                                        <div>
                                          <div className="font-bold text-neutral-800 text-lg">
                                            {method.name}
                                          </div>
                                          <div className="text-sm text-neutral-600">
                                            {method.description} • Frais: {method.fees}
                                          </div>
                                        </div>
                                      </div>
                                      <motion.div
                                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                                          isSelected
                                            ? 'border-primary-green bg-primary-green'
                                            : 'border-neutral-300'
                                        }`}
                                        whileHover={{ scale: 1.2 }}
                                      >
                                        {isSelected && (
                                          <span className="text-white text-sm font-bold">✓</span>
                                        )}
                                      </motion.div>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Phone Number Input */}
                          {(paymentState.selectedMethod?.id === 'mtn_momo' || paymentState.selectedMethod?.id === 'orange_money') && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                            >
                              <label className="block text-lg font-bold text-neutral-800 mb-4">
                                📱 Numéro de téléphone
                              </label>
                              <input
                                type="tel"
                                value={paymentState.phone}
                                onChange={(e) => handlePhoneChange(e.target.value)}
                                placeholder="+237 6XX XXX XXX"
                                className="w-full px-6 py-4 border-2 border-neutral-300 rounded-xl focus:ring-4 focus:ring-primary-green/20 focus:border-primary-green transition-all text-lg"
                              />
                              <p className="text-sm text-neutral-500 mt-2">
                                💡 Utilisez le numéro associé à votre compte {paymentState.selectedMethod.name}
                              </p>
                            </motion.div>
                          )}

                          {/* Payment Button */}
                          <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handlePayment}
                            disabled={paymentState.isProcessing || !paymentState.selectedMethod}
                            className="w-full bg-gradient-to-r from-claudine-gold to-orange-500 text-white py-5 px-8 rounded-xl font-bold text-lg shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
                          >
                            {paymentState.isProcessing ? (
                              <>
                                <LoadingSpinner size="sm" />
                                Traitement en cours...
                              </>
                            ) : (
                              <>
                                <span>Payer {formatPrice(paymentState.selectedPlan.price)}</span>
                                <span className="text-2xl">💰</span>
                              </>
                            )}
                          </motion.button>
                        </>
                      )}

                      {/* Payment Status - Pending */}
                      {paymentState.paymentStatus === 'pending' && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="glassmorphism rounded-2xl p-12 text-center border border-white/30"
                        >
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="text-8xl mb-6"
                          >
                            ⏳
                          </motion.div>
                          <h3 className="text-3xl font-bold text-neutral-800 mb-4">
                            Paiement en cours...
                          </h3>
                          <p className="text-lg text-neutral-600 mb-6">
                            Veuillez suivre les instructions sur votre téléphone
                          </p>
                          <LoadingSpinner size="lg" />
                        </motion.div>
                      )}

                      {/* Payment Status - Success */}
                      {paymentState.paymentStatus === 'completed' && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative overflow-hidden rounded-3xl p-1 bg-gradient-to-br from-green-400 to-emerald-600"
                        >
                          <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-12 text-center">
                            {/* Confetti */}
                            {[...Array(15)].map((_, i) => (
                              <motion.div
                                key={i}
                                className="absolute w-3 h-3 rounded-full"
                                style={{
                                  left: `${Math.random() * 100}%`,
                                  top: '-10%',
                                  backgroundColor: ['#fbbf24', '#34d399', '#60a5fa', '#f472b6'][i % 4]
                                }}
                                animate={{
                                  y: ['0vh', '110vh'],
                                  x: [0, (Math.random() - 0.5) * 100],
                                  rotate: [0, 360]
                                }}
                                transition={{
                                  duration: 2 + Math.random(),
                                  delay: i * 0.1,
                                  repeat: Infinity
                                }}
                              />
                            ))}

                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 200 }}
                              className="text-9xl mb-6"
                            >
                              🎉
                            </motion.div>
                            <h3 className="text-4xl font-bold text-green-600 mb-4">
                              Paiement confirmé !
                            </h3>
                            <p className="text-xl text-neutral-600 mb-8">
                              Votre abonnement <strong>{paymentState.selectedPlan.name}</strong> est maintenant actif.
                            </p>
                            <motion.button
                              whileHover={{ scale: 1.05, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => router.push('/famille')}
                              className="bg-gradient-to-r from-primary-green to-accent-purple text-white px-10 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-2xl transition-all"
                            >
                              Retour au tableau de bord 🏠
                            </motion.button>
                          </div>
                        </motion.div>
                      )}

                      {/* Payment Status - Failed */}
                      {paymentState.paymentStatus === 'failed' && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="glassmorphism rounded-2xl p-12 text-center border-2 border-red-200"
                        >
                          <div className="text-8xl mb-6">❌</div>
                          <h3 className="text-3xl font-bold text-red-600 mb-4">
                            Paiement échoué
                          </h3>
                          <p className="text-lg text-neutral-600 mb-8">
                            Une erreur s'est produite lors du traitement de votre paiement.
                          </p>
                          <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setPaymentState(prev => ({
                              ...prev,
                              paymentStatus: null,
                              transactionId: null
                            }))}
                            className="bg-gradient-to-r from-primary-green to-accent-purple text-white px-10 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-2xl transition-all"
                          >
                            🔄 Réessayer
                          </motion.button>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === 'wallet' && paymentData && (
                    <motion.div
                      key="wallet"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-8"
                    >
                      <h2 className="text-3xl font-bold text-neutral-800 text-center">
                        👛 Mon portefeuille Claudyne
                      </h2>

                      {/* Balance Card */}
                      <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.02, y: -5 }}
                        className="relative overflow-hidden rounded-3xl p-1 bg-gradient-to-br from-primary-green via-accent-purple to-claudine-gold"
                      >
                        <div className="relative bg-gradient-to-br from-primary-green/95 via-accent-purple/95 to-purple-600/95 rounded-3xl p-12">
                          {/* Animated background */}
                          <div className="absolute inset-0 opacity-20">
                            <div className="absolute top-0 right-1/4 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse"></div>
                            <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-yellow-300 rounded-full blur-3xl animate-pulse delay-1000"></div>
                          </div>

                          <div className="relative z-10 text-center">
                            <div className="text-6xl mb-4">💎</div>
                            <div className="text-sm text-white/80 mb-3 font-medium">Solde actuel</div>
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", delay: 0.2 }}
                              className="text-6xl font-bold text-white mb-4"
                            >
                              {formatPrice(paymentData.wallet.balance, paymentData.wallet.currency)}
                            </motion.div>
                            <div className="text-sm text-white/70">
                              Dernière mise à jour: {new Date(paymentData.wallet.lastUpdate).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {/* Actions */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          whileHover={{ y: -5, scale: 1.02 }}
                          className="glassmorphism rounded-2xl p-8 border border-white/30"
                        >
                          <div className="text-5xl mb-4">💰</div>
                          <h3 className="text-xl font-bold text-neutral-800 mb-3">
                            Recharger le portefeuille
                          </h3>
                          <p className="text-neutral-600 text-sm mb-6">
                            Rechargez votre portefeuille pour payer vos abonnements et achats.
                          </p>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full bg-gradient-to-r from-claudine-gold to-orange-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                          >
                            Recharger →
                          </motion.button>
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          whileHover={{ y: -5, scale: 1.02 }}
                          className="glassmorphism rounded-2xl p-8 border border-white/30"
                        >
                          <div className="text-5xl mb-4">📊</div>
                          <h3 className="text-xl font-bold text-neutral-800 mb-3">
                            Historique des transactions
                          </h3>
                          <p className="text-neutral-600 text-sm mb-6">
                            Consultez l'historique de vos paiements et recharges.
                          </p>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full bg-gradient-to-r from-primary-green to-accent-purple text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                          >
                            Voir l'historique →
                          </motion.button>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </Layout>
    </>
  );
}
