/**
 * Layout principal Claudyne
 * Gère la structure globale et la navigation
 */

import { ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import Header from './navigation/Header';
import Sidebar from './navigation/Sidebar';
import BottomNavigation from './navigation/BottomNavigation';
import LoadingBar from './ui/LoadingBar';

// Hooks
import { useAuth } from '../hooks/useAuth';
import { useWindowSize } from '../hooks/useWindowSize';

// Types
interface LayoutProps {
  children: ReactNode;
}

// Pages qui n'ont pas besoin de l'interface complète
const publicPages = ['/', '/auth/login', '/auth/register', '/auth/forgot-password'];

// Pages qui utilisent le layout mobile uniquement
const mobileOnlyPages = ['/bataille', '/science-lab'];

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { width, isMobile, isTablet } = useWindowSize();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);

  const isPublicPage = publicPages.includes(router.pathname);
  const isMobileOnlyPage = mobileOnlyPages.includes(router.pathname);
  const needsAuthentication = !isPublicPage;
  const showCompleteLayout = user && !isPublicPage;

  // Gestion du loading lors des changements de page
  useEffect(() => {
    const handleStart = () => setIsPageLoading(true);
    const handleComplete = () => setIsPageLoading(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  // Fermer la sidebar sur mobile lors des changements de route
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [router.pathname, isMobile]);

  // Auto-fermer sidebar sur desktop si écran trop petit
  useEffect(() => {
    if (width && width < 1024) {
      setSidebarOpen(false);
    }
  }, [width]);

  // Pages publiques (login, etc.)
  if (isPublicPage) {
    return (
      <>
        {isPageLoading && <LoadingBar />}
        <div className="min-h-screen">
          {children}
        </div>
      </>
    );
  }

  // Loading de l'authentification
  if (needsAuthentication && isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="avatar-claudyne mb-4 mx-auto animate-pulse">
            👩🏾‍🏫
          </div>
          <h2 className="text-lg font-semibold text-neutral-700 mb-2">
            Chargement de Claudyne...
          </h2>
          <div className="w-48 h-1 bg-neutral-200 rounded-full mx-auto">
            <div className="h-1 bg-claudine-gradient rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Redirection si non authentifié
  if (needsAuthentication && !user) {
    if (typeof window !== 'undefined') {
      router.push('/');
    }
    return null;
  }

  // Layout mobile uniquement pour certaines pages
  if (isMobileOnlyPage) {
    return (
      <>
        {isPageLoading && <LoadingBar />}
        <div className="min-h-screen bg-neutral-50">
          <Header 
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            showMenuButton={false}
          />
          <main className="pt-20">
            {children}
          </main>
          <BottomNavigation />
        </div>
      </>
    );
  }

  // Layout complet pour utilisateurs connectés
  return (
    <>
      {isPageLoading && <LoadingBar />}
      
      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          showMenuButton={!isTablet && !sidebarOpen}
        />

        <div className="flex">
          {/* Sidebar Desktop */}
          {!isMobile && (
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div
                  initial={{ x: -280, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -280, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="fixed left-0 top-20 h-[calc(100vh-80px)] z-30"
                >
                  <Sidebar onClose={() => setSidebarOpen(false)} />
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* Sidebar Mobile */}
          {isMobile && (
            <AnimatePresence>
              {sidebarOpen && (
                <>
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={() => setSidebarOpen(false)}
                  />
                  
                  {/* Sidebar */}
                  <motion.div
                    initial={{ x: -320, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -320, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="fixed left-0 top-0 h-full z-50"
                  >
                    <Sidebar onClose={() => setSidebarOpen(false)} isMobile />
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          )}

          {/* Contenu principal */}
          <main className={`
            flex-1 transition-all duration-300 ease-in-out
            ${!isMobile && sidebarOpen ? 'ml-80' : ''}
            ${isMobile ? 'pt-20 pb-20' : 'pt-20'}
          `}>
            <div className="container mx-auto px-4 py-6 max-w-7xl">
              <motion.div
                key={router.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {children}
              </motion.div>
            </div>
          </main>
        </div>

        {/* Navigation mobile en bas */}
        {isMobile && <BottomNavigation />}

        {/* Overlay pour fermer la sidebar sur desktop */}
        {!isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-transparent z-20"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </>
  );
}

// Composants additionnels pour certains layouts spéciaux

export function FullscreenLayout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}

export function CenteredLayout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}

export function AdminLayout({ children }: LayoutProps) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !['ADMIN', 'MODERATOR'].includes(user.role)) {
      router.push('/famille');
    }
  }, [user, router]);

  if (!user || !['ADMIN', 'MODERATOR'].includes(user.role)) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-neutral-700 mb-2">
            Accès non autorisé
          </h2>
          <p className="text-neutral-500 mb-4">
            Cette section est réservée aux administrateurs.
          </p>
          <button
            onClick={() => router.push('/famille')}
            className="btn-claudine"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="border-b bg-white px-6 py-4">
        <h1 className="text-xl font-bold text-gradient-claudine">
          Administration Claudyne
        </h1>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}