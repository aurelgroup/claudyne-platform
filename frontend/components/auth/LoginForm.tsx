/**
 * Formulaire de connexion
 * Interface de connexion avec email ou téléphone
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import LoadingSpinner from '../ui/LoadingSpinner';

interface LoginFormProps {
  method: 'email' | 'phone';
  onSubmit: (credentials: any) => void;
  isLoading: boolean;
  isSlowConnection?: boolean;
}

export default function LoginForm({
  method,
  onSubmit,
  isLoading,
  isSlowConnection = false
}: LoginFormProps) {
  const [formData, setFormData] = useState({
    credential: '',
    password: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.credential.trim()) {
      newErrors.credential = method === 'email' ? 'Email requis' : 'Numéro de téléphone requis';
    } else if (method === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.credential)) {
      newErrors.credential = 'Format d\'email invalide';
    } else if (method === 'phone' && !/^\+?[0-9\s-]+$/.test(formData.credential)) {
      newErrors.credential = 'Format de numéro invalide';
    }

    if (!formData.password) {
      newErrors.password = 'Mot de passe requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mot de passe trop court (min 6 caractères)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      {/* Champ de connexion (email ou téléphone) */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {method === 'email' ? 'Adresse email' : 'Numéro de téléphone'}
        </label>
        <input
          type={method === 'email' ? 'email' : 'tel'}
          name="credential"
          value={formData.credential}
          onChange={handleChange}
          placeholder={method === 'email' ? 'votre@email.com' : '+237 6XX XXX XXX'}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent transition-colors ${
            errors.credential ? 'border-red-300' : 'border-neutral-300'
          }`}
          disabled={isLoading}
        />
        {errors.credential && (
          <p className="mt-1 text-sm text-red-600">{errors.credential}</p>
        )}
      </div>

      {/* Mot de passe */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Mot de passe
        </label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="••••••••"
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent transition-colors ${
            errors.password ? 'border-red-300' : 'border-neutral-300'
          }`}
          disabled={isLoading}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password}</p>
        )}
      </div>

      {/* Connexion lente */}
      {isSlowConnection && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center text-yellow-700 text-sm">
            <span className="mr-2">⚡</span>
            Connexion lente détectée - Le chargement peut prendre plus de temps
          </div>
        </div>
      )}

      {/* Bouton de soumission */}
      <motion.button
        type="submit"
        disabled={isLoading}
        whileHover={{ scale: isLoading ? 1 : 1.02 }}
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
        className="w-full bg-primary-green text-white py-3 px-4 rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <LoadingSpinner size="sm" className="mr-2" color="white" />
            Connexion en cours...
          </>
        ) : (
          'Se connecter'
        )}
      </motion.button>

      {/* Mot de passe oublié */}
      <div className="text-center">
        <button
          type="button"
          className="text-sm text-primary-green hover:text-green-600 transition-colors"
          disabled={isLoading}
        >
          Mot de passe oublié ?
        </button>
      </div>

      {/* Comptes de test */}
      <div className="bg-neutral-50 rounded-lg p-4 mt-6">
        <div className="text-sm text-neutral-600 text-center mb-2">
          💡 Comptes de test disponibles:
        </div>
        <div className="text-xs text-neutral-500 space-y-1">
          <div>📧 Email: test@claudyne.com</div>
          <div>📱 Téléphone: +237612345678</div>
          <div>🔑 Mot de passe: 123456</div>
        </div>
      </div>
    </motion.form>
  );
}