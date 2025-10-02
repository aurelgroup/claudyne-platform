/**
 * Application principale Claudyne Frontend
 * Configuration globale et providers
 */

import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { Toaster } from 'react-hot-toast';
import Head from 'next/head';
import { useState, useEffect } from 'react';

// Styles
import '../styles/globals.css';

// Stores et contexts
import { AuthProvider } from '../contexts/AuthContext';


// Components
import Layout from '../components/Layout';
import LoadingSpinner from '../components/ui/LoadingSpinner';


// Configuration React Query optimisée pour les connexions lentes
const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache plus long pour les connexions lentes
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        
        // Retry moins agressif pour préserver la bande passante
        retry: (failureCount, error: any) => {
          // Ne pas retry si erreur 4xx (client error)
          if (error?.response?.status >= 400 && error?.response?.status < 500) {
            return false;
          }
          return failureCount < 2; // Maximum 2 tentatives
        },
        
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // Background refetch moins fréquent
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: true,
        
        // Optimisation pour mobile
        refetchInterval: false, // Désactive le refetch automatique
        refetchIntervalInBackground: false
      },
      mutations: {
        retry: 1,
        retryDelay: 2000
      }
    }
  });
};

interface ClaudyneAppProps extends AppProps {
  pageProps: any;
}

function ClaudyneApp({ Component, pageProps }: ClaudyneAppProps) {
  const [queryClient] = useState(() => createQueryClient());
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline] = useState(true);
  const [isSlowConnection] = useState(false);
  const [updateAvailable] = useState(false);

  // Initialisation de l'application
  useEffect(() => {
    const initApp = async () => {
      try {
        // Simule le chargement initial
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Ready
        console.log('Claudyne app initialized');
        
        setIsLoading(false);
      } catch (error) {
        console.error('Erreur initialisation app:', error);
        setIsLoading(false);
      }
    };

    initApp();
  }, []);

  // Loading initial
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="avatar-claudyne mb-4 mx-auto">
            👩🏾‍🏫
          </div>
          <h1 className="text-2xl font-bold text-gradient-claudine mb-2">
            Claudyne
          </h1>
          <p className="text-neutral-600 mb-4">
            La force du savoir en héritage
          </p>
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Métadonnées de base */}
        <title>Claudyne - La force du savoir en héritage</title>
        <meta name="description" content="Plateforme éducative pour les familles camerounaises. Apprentissage interactif, Prix Claudine, Battle Royale éducatif." />
        <meta name="keywords" content="éducation, Cameroun, famille, apprentissage, Prix Claudine, Meffo Mehtah Tchandjio Claudine" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Claudyne" />
        <meta property="og:title" content="Claudyne - La force du savoir en héritage" />
        <meta property="og:description" content="Plateforme éducative inspirée par Claudine pour les familles camerounaises" />
        <meta property="og:image" content="/images/og-claudyne.jpg" />
        <meta property="og:url" content="https://claudyne.com" />
        <meta property="og:locale" content="fr_CM" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Claudyne - La force du savoir en héritage" />
        <meta name="twitter:description" content="Plateforme éducative pour familles camerounaises" />
        <meta name="twitter:image" content="/images/twitter-claudyne.jpg" />
        
        {/* PWA */}
        <meta name="theme-color" content="#D4AF37" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Claudyne" />
        <meta name="application-name" content="Claudyne" />
        
        {/* Icons */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Preconnect pour optimiser les performances */}
        <link rel="preconnect" href="https://api.claudyne.com" />
        <link rel="preconnect" href="https://cdn.claudyne.com" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        
        {/* Configuration pour les connexions lentes */}
        {isSlowConnection && (
          <meta httpEquiv="Save-Data" content="on" />
        )}
      </Head>

      <QueryClientProvider client={queryClient}>
        <AuthProvider>
                <Layout>
                  {/* Composant principal */}
                  <Component {...pageProps} />
                  
                  {/* Notification de mise à jour PWA */}
                  {updateAvailable && (
                    <div className="fixed bottom-4 right-4 z-50">
                      <div className="bg-white rounded-lg shadow-lg p-4 max-w-sm">
                        <div className="flex items-center mb-2">
                          <div className="w-8 h-8 bg-claudine-gradient rounded-full flex items-center justify-center mr-3">
                            📱
                          </div>
                          <h3 className="font-semibold">Mise à jour disponible</h3>
                        </div>
                        <p className="text-sm text-neutral-600 mb-3">
                          Une nouvelle version de Claudyne est disponible avec des améliorations.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => window.location.reload()}
                            className="btn-claudine text-sm px-3 py-1 flex-1"
                          >
                            Mettre à jour
                          </button>
                          <button className="text-sm px-3 py-1 text-neutral-500">
                            Plus tard
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </Layout>
        </AuthProvider>
        
        {/* React Query Devtools (développement uniquement) */}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
        
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#FFFFFF',
              color: '#2C3E50',
              border: '1px solid #E9ECEF',
              borderRadius: '12px',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)'
            },
            success: {
              iconTheme: {
                primary: '#27AE60',
                secondary: '#FFFFFF'
              }
            },
            error: {
              iconTheme: {
                primary: '#E74C3C',
                secondary: '#FFFFFF'
              }
            }
          }}
        />
      </QueryClientProvider>
    </>
  );
}

export default ClaudyneApp;