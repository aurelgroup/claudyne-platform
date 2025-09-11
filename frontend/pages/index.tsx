/**
 * Page d'accueil Claudyne
 * Écran de connexion et présentation de la plateforme
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// Components
import LoginForm from '../components/auth/LoginForm';
import SignupForm from '../components/auth/SignupForm';
import Logo from '../components/ui/Logo';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Hooks
import { useAuth } from '../hooks/useAuth';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

// Types
interface LoginMethod {
  type: 'email' | 'phone';
  label: string;
  placeholder: string;
  icon: string;
}

const loginMethods: LoginMethod[] = [
  {
    type: 'email',
    label: 'Email',
    placeholder: 'votre@email.com',
    icon: '📧'
  },
  {
    type: 'phone',
    label: 'Téléphone',
    placeholder: '+237 6XX XXX XXX',
    icon: '📱'
  }
];

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading, login, register } = useAuth();
  const { isOnline, isSlowConnection } = useNetworkStatus();
  
  const [activeView, setActiveView] = useState<'login' | 'signup'>('login');
  const [selectedMethod, setSelectedMethod] = useState<'email' | 'phone'>('email');
  const [isFormLoading, setIsFormLoading] = useState(false);

  // Redirection si déjà connecté
  useEffect(() => {
    if (user && !isLoading) {
      router.replace('/famille');
    }
  }, [user, isLoading, router]);

  // Handler de connexion
  const handleLogin = async (credentials: any) => {
    if (!isOnline) {
      toast.error('Connexion internet requise pour se connecter');
      return;
    }

    setIsFormLoading(true);
    
    try {
      await login(credentials);
      toast.success('🎉 Bienvenue dans Claudyne !');
      router.push('/famille');
    } catch (error: any) {
      toast.error(error.message || 'Erreur de connexion');
    } finally {
      setIsFormLoading(false);
    }
  };

  // Handler d'inscription
  const handleSignup = async (userData: any) => {
    if (!isOnline) {
      toast.error('Connexion internet requise pour créer un compte');
      return;
    }

    setIsFormLoading(true);
    
    try {
      await register(userData);
      toast.success('🎉 Compte créé avec succès !');
      router.push('/famille');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création du compte');
    } finally {
      setIsFormLoading(false);
    }
  };

  // Loading initial
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-green via-accent-purple to-claudine-gold flex items-center justify-center">
        <div className="text-center text-white">
          <Logo size="lg" className="mb-6" />
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  // Si utilisateur connecté, on affiche un loader pendant la redirection
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-green via-accent-purple to-claudine-gold flex items-center justify-center">
        <div className="text-center text-white">
          <Logo size="lg" className="mb-6" />
          <p className="text-lg mb-4">Redirection en cours...</p>
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Claudyne - Connexion | La force du savoir en héritage</title>
        <meta name="description" content="Connectez-vous à Claudyne, la plateforme éducative inspirée par Meffo Mehtah Tchandjio Claudine pour les familles camerounaises." />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-green via-accent-purple to-claudine-gold">
        <div className="min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            {/* Carte de connexion */}
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* En-tête avec logo */}
              <div className="px-8 pt-8 pb-6 text-center">
                <Logo size="md" className="mb-4" />
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h1 className="text-2xl font-bold text-gradient-claudine mb-2">
                    Claudyne
                  </h1>
                  <p className="text-sm text-neutral-500 italic">
                    La force du savoir en héritage
                  </p>
                  
                  {/* Hommage à Claudine */}
                  <motion.div 
                    className="mt-4 p-3 bg-claudine-gold/10 rounded-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <p className="text-xs text-neutral-600 italic">
                      "En mémoire de Meffo Mehtah Tchandjio Claudine"
                    </p>
                  </motion.div>
                </motion.div>
              </div>

              {/* Onglets de navigation */}
              <div className="px-8 pb-4">
                <div className="flex bg-neutral-100 rounded-lg p-1">
                  <button
                    onClick={() => setActiveView('login')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                      activeView === 'login'
                        ? 'bg-white text-claudine-gold shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-800'
                    }`}
                  >
                    Se connecter
                  </button>
                  <button
                    onClick={() => setActiveView('signup')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                      activeView === 'signup'
                        ? 'bg-white text-claudine-gold shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-800'
                    }`}
                  >
                    S'inscrire
                  </button>
                </div>
              </div>

              {/* Contenu des formulaires */}
              <div className="px-8 pb-8">
                <AnimatePresence mode="wait">
                  {activeView === 'login' && (
                    <motion.div
                      key="login"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Sélection méthode de connexion */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          Se connecter avec :
                        </label>
                        <div className="flex gap-2">
                          {loginMethods.map((method) => (
                            <button
                              key={method.type}
                              onClick={() => setSelectedMethod(method.type)}
                              className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                                selectedMethod === method.type
                                  ? 'bg-claudine-gold text-white'
                                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                              }`}
                            >
                              <span className="mr-2">{method.icon}</span>
                              {method.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <LoginForm
                        method={selectedMethod}
                        onSubmit={handleLogin}
                        isLoading={isFormLoading}
                        isSlowConnection={isSlowConnection}
                      />
                    </motion.div>
                  )}

                  {activeView === 'signup' && (
                    <motion.div
                      key="signup"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <SignupForm
                        onSubmit={handleSignup}
                        isLoading={isFormLoading}
                        isSlowConnection={isSlowConnection}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Pied de page */}
              <div className="px-8 py-4 bg-neutral-50 border-t">
                <div className="text-center">
                  <p className="text-xs text-neutral-500 mb-2">
                    Première connexion ?{' '}
                    <span className="font-medium text-claudine-gold">
                      7 jours d'essai gratuit
                    </span>
                  </p>
                  
                  {/* Indicateur de connexion */}
                  {!isOnline && (
                    <div className="flex items-center justify-center text-xs text-error">
                      <div className="w-2 h-2 bg-error rounded-full mr-2"></div>
                      Mode hors ligne
                    </div>
                  )}
                  
                  {isOnline && isSlowConnection && (
                    <div className="flex items-center justify-center text-xs text-warning">
                      <div className="w-2 h-2 bg-warning rounded-full mr-2"></div>
                      Connexion lente détectée
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Lien vers les informations */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-8 text-center"
            >
              <p className="text-white/80 text-sm mb-2">
                Une plateforme éducative pour les familles camerounaises
              </p>
              <div className="flex justify-center gap-6 text-white/60 text-xs">
                <a href="#" className="hover:text-white transition-colors">
                  À propos
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  Contact
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  Support
                </a>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Éléments décoratifs de fond */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full"
          />
          <motion.div
            animate={{
              scale: [1.1, 1, 1.1],
              rotate: [0, -3, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -bottom-32 -left-32 w-64 h-64 bg-white/5 rounded-full"
          />
        </div>
      </div>
    </>
  );
}