/**
 * 🛡️ UTILITAIRES DE SÉCURITÉ CLAUDYNE
 * Niveau sécurité: BANQUE CENTRALE
 */

export class SecurityUtils {
  // Politique de mot de passe ULTRA RENFORCÉE
  private static readonly PASSWORD_REGEX = {
    MIN_LENGTH: /^.{8,}$/,
    HAS_LOWERCASE: /[a-z]/,
    HAS_UPPERCASE: /[A-Z]/,
    HAS_NUMBER: /\d/,
    HAS_SPECIAL: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    NO_SPACES: /^\S*$/,
  };

  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Rate limiting pour tentatives de connexion
  private static loginAttempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private static readonly MAX_LOGIN_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  /**
   * Validation email ultra-stricte
   */
  static validateEmail(email: string): { isValid: boolean; error?: string } {
    if (!email || !email.trim()) {
      return { isValid: false, error: 'Email requis' };
    }

    email = email.trim().toLowerCase();

    if (!this.EMAIL_REGEX.test(email)) {
      return { isValid: false, error: 'Format email invalide' };
    }

    // Vérifications supplémentaires
    if (email.length > 254) {
      return { isValid: false, error: 'Email trop long' };
    }

    const [localPart, domain] = email.split('@');
    if (localPart.length > 64) {
      return { isValid: false, error: 'Partie locale trop longue' };
    }

    // Domaines suspects
    const suspiciousDomains = ['tempmail.org', '10minutemail.com', 'guerrillamail.com'];
    if (suspiciousDomains.some(d => domain.includes(d))) {
      return { isValid: false, error: 'Domaine email non autorisé' };
    }

    return { isValid: true };
  }

  /**
   * Validation mot de passe ULTRA SÉCURISÉE
   */
  static validatePassword(password: string): {
    isValid: boolean;
    score: number;
    errors: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    if (!password) {
      return {
        isValid: false,
        score: 0,
        errors: ['Mot de passe requis'],
        suggestions: ['Saisissez un mot de passe']
      };
    }

    // Longueur minimale
    if (!this.PASSWORD_REGEX.MIN_LENGTH.test(password)) {
      errors.push('Au moins 8 caractères requis');
      suggestions.push('Ajoutez plus de caractères');
    } else {
      score += 1;
    }

    // Minuscule
    if (!this.PASSWORD_REGEX.HAS_LOWERCASE.test(password)) {
      errors.push('Au moins une minuscule requise');
      suggestions.push('Ajoutez une lettre minuscule (a-z)');
    } else {
      score += 1;
    }

    // Majuscule
    if (!this.PASSWORD_REGEX.HAS_UPPERCASE.test(password)) {
      errors.push('Au moins une majuscule requise');
      suggestions.push('Ajoutez une lettre majuscule (A-Z)');
    } else {
      score += 1;
    }

    // Chiffre
    if (!this.PASSWORD_REGEX.HAS_NUMBER.test(password)) {
      errors.push('Au moins un chiffre requis');
      suggestions.push('Ajoutez un chiffre (0-9)');
    } else {
      score += 1;
    }

    // Caractère spécial
    if (!this.PASSWORD_REGEX.HAS_SPECIAL.test(password)) {
      errors.push('Au moins un caractère spécial requis');
      suggestions.push('Ajoutez un symbole (!@#$%^&*)');
    } else {
      score += 1;
    }

    // Pas d'espaces
    if (!this.PASSWORD_REGEX.NO_SPACES.test(password)) {
      errors.push('Espaces non autorisés');
      suggestions.push('Supprimez les espaces');
    } else {
      score += 0.5;
    }

    // Longueur bonus
    if (password.length >= 12) {
      score += 1;
    }
    if (password.length >= 16) {
      score += 1;
    }

    // Mots de passe faibles communs
    const weakPasswords = [
      'password', '123456', 'admin', 'claudyne',
      'cameroun', 'azerty', 'qwerty', 'motdepasse'
    ];

    if (weakPasswords.some(weak => password.toLowerCase().includes(weak))) {
      errors.push('Mot de passe trop commun');
      suggestions.push('Évitez les mots courants');
      score -= 2;
    }

    const isValid = errors.length === 0 && score >= 5;

    return {
      isValid,
      score: Math.max(0, Math.min(10, score)),
      errors,
      suggestions
    };
  }

  /**
   * Vérifier si un utilisateur est bloqué (rate limiting)
   */
  static isUserLocked(identifier: string): { isLocked: boolean; timeRemaining?: number } {
    const attempts = this.loginAttempts.get(identifier);

    if (!attempts) {
      return { isLocked: false };
    }

    if (attempts.count >= this.MAX_LOGIN_ATTEMPTS) {
      const timeElapsed = Date.now() - attempts.lastAttempt;
      const timeRemaining = this.LOCKOUT_DURATION - timeElapsed;

      if (timeRemaining > 0) {
        return {
          isLocked: true,
          timeRemaining: Math.ceil(timeRemaining / 1000) // en secondes
        };
      } else {
        // Réinitialiser après expiration
        this.loginAttempts.delete(identifier);
        return { isLocked: false };
      }
    }

    return { isLocked: false };
  }

  /**
   * Enregistrer une tentative de connexion
   */
  static recordLoginAttempt(identifier: string, success: boolean): void {
    if (success) {
      // Supprimer les tentatives en cas de succès
      this.loginAttempts.delete(identifier);
      return;
    }

    const current = this.loginAttempts.get(identifier) || { count: 0, lastAttempt: 0 };

    this.loginAttempts.set(identifier, {
      count: current.count + 1,
      lastAttempt: Date.now()
    });
  }

  /**
   * Générer un ID de session sécurisé
   */
  static generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2);
    const extraRandom = Math.random().toString(36).substring(2);

    return `claudyne_${timestamp}_${randomPart}_${extraRandom}`;
  }

  /**
   * Nettoyer les données sensibles d'un objet pour les logs
   */
  static sanitizeForLogging(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'auth',
      'credential', 'pin', 'biometric', 'fingerprint'
    ];

    const sanitized = { ...obj };

    for (const [key, value] of Object.entries(sanitized)) {
      const keyLower = key.toLowerCase();

      if (sensitiveKeys.some(sensitive => keyLower.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeForLogging(value);
      }
    }

    return sanitized;
  }

  /**
   * Vérifier l'entropie d'un mot de passe
   */
  static calculatePasswordEntropy(password: string): number {
    if (!password) return 0;

    let charSpace = 0;

    // Calculer l'espace des caractères possibles
    if (/[a-z]/.test(password)) charSpace += 26;
    if (/[A-Z]/.test(password)) charSpace += 26;
    if (/[0-9]/.test(password)) charSpace += 10;
    if (/[^a-zA-Z0-9]/.test(password)) charSpace += 32;

    // Entropie = log2(charSpace^length)
    const entropy = password.length * Math.log2(charSpace);

    return Math.round(entropy);
  }

  /**
   * Obtenir le niveau de sécurité d'un mot de passe
   */
  static getPasswordStrengthLevel(password: string): {
    level: 'weak' | 'fair' | 'good' | 'strong' | 'excellent';
    color: string;
    percentage: number;
  } {
    const validation = this.validatePassword(password);
    const entropy = this.calculatePasswordEntropy(password);

    // Combiner score de validation et entropie
    const combinedScore = (validation.score * 10) + (entropy / 10);
    const percentage = Math.min(100, Math.round(combinedScore));

    if (percentage < 20) {
      return { level: 'weak', color: '#FF4444', percentage };
    } else if (percentage < 40) {
      return { level: 'fair', color: '#FFA500', percentage };
    } else if (percentage < 60) {
      return { level: 'good', color: '#FFD700', percentage };
    } else if (percentage < 80) {
      return { level: 'strong', color: '#90EE90', percentage };
    } else {
      return { level: 'excellent', color: '#00FF00', percentage };
    }
  }
}

export default SecurityUtils;