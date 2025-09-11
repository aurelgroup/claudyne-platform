/**
 * Hook de statut réseau
 * Détection de la connexion internet et de la vitesse
 */

import { useState, useEffect } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string | null;
}

export const useNetworkStatus = (): NetworkStatus => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
    isSlowConnection: false,
    connectionType: null
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateNetworkStatus = () => {
      const isOnline = navigator.onLine;
      let isSlowConnection = false;
      let connectionType = null;

      // Détecter le type de connexion si disponible
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connectionType = connection?.effectiveType || null;
        
        // Considérer 2G/3G comme connexion lente
        if (connection?.effectiveType === '2g' || connection?.effectiveType === '3g') {
          isSlowConnection = true;
        }
        
        // Si RTT élevé ou bande passante faible
        if (connection?.rtt > 1000 || connection?.downlink < 1.5) {
          isSlowConnection = true;
        }
      }

      setNetworkStatus({
        isOnline,
        isSlowConnection,
        connectionType
      });
    };

    // Écouter les changements de connexion
    const handleOnline = () => updateNetworkStatus();
    const handleOffline = () => updateNetworkStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Écouter les changements de type de connexion
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.addEventListener('change', updateNetworkStatus);
    }

    // Mise à jour initiale
    updateNetworkStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connection?.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, []);

  return networkStatus;
};