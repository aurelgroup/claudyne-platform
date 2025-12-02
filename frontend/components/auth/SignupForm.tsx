/**
 * Formulaire d'inscription
 * Interface de création de compte famille
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import LoadingSpinner from '../ui/LoadingSpinner';

interface SignupFormProps {
  onSubmit: (userData: any) => void;
  isLoading: boolean;
  isSlowConnection?: boolean;
}

export default function SignupForm({
  onSubmit,
  isLoading,
  isSlowConnection = false
}: SignupFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    familyName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [contactMethod, setContactMethod] = useState<'email' | 'phone'>('email');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Noms requis
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Prénom requis';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Nom requis';
    }
    if (!formData.familyName.trim()) {
      newErrors.familyName = 'Nom de famille requis';
    }

    // Contact (email ou téléphone)
    if (contactMethod === 'email') {
      if (!formData.email.trim()) {
        newErrors.email = 'Email requis';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Format d\'email invalide';
      }
    } else {
      if (!formData.phone.trim()) {
        newErrors.phone = 'Numéro de téléphone requis';
      } else if (!/^(\+237|237)?[26][0-9]{8}$/.test(formData.phone.replace(/\s|-/g, ''))) {
        newErrors.phone = 'Format camerounais invalide (ex: +237600000000 ou 260000000)';
      }
    }

    // Mot de passe - Aligner avec les règles du backend
    if (!formData.password) {
      newErrors.password = 'Mot de passe requis';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Mot de passe trop court (min 8 caractères)';
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = 'Le mot de passe doit contenir au moins une minuscule';
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Le mot de passe doit contenir au moins une majuscule';
    } else if (!/\d/.test(formData.password)) {
      newErrors.password = 'Le mot de passe doit contenir au moins un chiffre';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    // Acceptation des conditions obligatoire
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Vous devez accepter les conditions d\'utilisation';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      const submitData = {
        ...formData,
        // Clear unused contact field
        email: contactMethod === 'email' ? formData.email : '',
        phone: contactMethod === 'phone' ? formData.phone : '',
        // Convertir acceptTerms en string 'true' pour le backend
        acceptTerms: formData.acceptTerms ? 'true' : 'false',
        // Par défaut, compte PARENT pour inscription depuis le formulaire
        accountType: 'PARENT'
      };
      onSubmit(submitData);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      {/* Noms */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Prénom
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="Votre prénom"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent transition-colors ${
              errors.firstName ? 'border-red-300' : 'border-neutral-300'
            }`}
            disabled={isLoading}
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Nom
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Votre nom"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent transition-colors ${
              errors.lastName ? 'border-red-300' : 'border-neutral-300'
            }`}
            disabled={isLoading}
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
          )}
        </div>
      </div>

      {/* Nom de famille */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Nom de famille
        </label>
        <input
          type="text"
          name="familyName"
          value={formData.familyName}
          onChange={handleChange}
          placeholder="Ex: Famille Mbarga"
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent transition-colors ${
            errors.familyName ? 'border-red-300' : 'border-neutral-300'
          }`}
          disabled={isLoading}
        />
        {errors.familyName && (
          <p className="mt-1 text-sm text-red-600">{errors.familyName}</p>
        )}
      </div>

      {/* Méthode de contact */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Comment souhaitez-vous être contacté ?
        </label>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => setContactMethod('email')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              contactMethod === 'email'
                ? 'bg-primary-green text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            📧 Email
          </button>
          <button
            type="button"
            onClick={() => setContactMethod('phone')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              contactMethod === 'phone'
                ? 'bg-primary-green text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            📱 Téléphone
          </button>
        </div>

        {contactMethod === 'email' ? (
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="votre@email.com"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent transition-colors ${
              errors.email ? 'border-red-300' : 'border-neutral-300'
            }`}
            disabled={isLoading}
          />
        ) : (
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+237 6XX XXX XXX"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent transition-colors ${
              errors.phone ? 'border-red-300' : 'border-neutral-300'
            }`}
            disabled={isLoading}
          />
        )}
        {(errors.email || errors.phone) && (
          <p className="mt-1 text-sm text-red-600">{errors.email || errors.phone}</p>
        )}
      </div>

      {/* Mots de passe */}
      <div className="grid grid-cols-1 gap-3">
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

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Confirmer le mot de passe
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-green focus:border-transparent transition-colors ${
              errors.confirmPassword ? 'border-red-300' : 'border-neutral-300'
            }`}
            disabled={isLoading}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
          )}
        </div>
      </div>

      {/* Connexion lente */}
      {isSlowConnection && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center text-yellow-700 text-sm">
            <span className="mr-2">⚡</span>
            Connexion lente détectée - L'inscription peut prendre plus de temps
          </div>
        </div>
      )}

      {/* Acceptation des conditions */}
      <div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="acceptTerms"
            checked={formData.acceptTerms}
            onChange={handleChange}
            disabled={isLoading}
            className="mt-1 w-5 h-5 rounded border-neutral-300 text-primary-green focus:ring-2 focus:ring-primary-green cursor-pointer"
          />
          <span className="text-sm text-neutral-600">
            J'accepte les <span className="font-medium">conditions d'utilisation</span> et la <span className="font-medium">politique de confidentialité</span> de Claudyne
          </span>
        </label>
        {errors.acceptTerms && (
          <p className="mt-2 text-sm text-red-600">{errors.acceptTerms}</p>
        )}
      </div>

      {/* Bouton de soumission */}
      <motion.button
        type="submit"
        disabled={isLoading}
        whileHover={{ scale: isLoading ? 1 : 1.02 }}
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
        className="w-full bg-claudine-gold text-white py-3 px-4 rounded-lg font-medium hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <LoadingSpinner size="sm" className="mr-2" color="white" />
            Création en cours...
          </>
        ) : (
          'Créer mon compte famille'
        )}
      </motion.button>

      {/* Essai gratuit */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center text-green-700 text-sm">
          <span className="mr-2">🎉</span>
          <div>
            <div className="font-medium">Essai gratuit de 7 jours inclus !</div>
            <div className="text-xs">Aucun paiement requis pour commencer</div>
          </div>
        </div>
      </div>
    </motion.form>
  );
}