/**
 * Layout principal Claudyne
 * Gère la structure globale et la navigation
 */

import { ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';

// Hooks
import { useAuth } from '../hooks/useAuth';

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
  const authContext = useAuth();
  const user = authContext.user;
  const isLoading = authContext.isLoading;

  const isPublicPage = publicPages.includes(router.pathname);
  const needsAuthentication = !isPublicPage;

  // Pages publiques (login, etc.)
  if (isPublicPage) {
    return (
      <div className="min-h-screen">
        {children}
      </div>
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

  // Layout authentifié basique
  return (
    <div className="min-h-screen bg-neutral-50">
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
    </div>
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