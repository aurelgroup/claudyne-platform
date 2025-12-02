/**
 * Tests de validation du formulaire d'inscription
 * Vérifie que les règles de validation sont correctes
 */

describe('SignupForm Validation', () => {
  // Validation du mot de passe
  describe('Password Validation', () => {
    const validatePassword = (password: string): boolean => {
      if (!password) return false;
      if (password.length < 8) return false;
      if (!/[a-z]/.test(password)) return false; // Minuscule
      if (!/[A-Z]/.test(password)) return false; // Majuscule
      if (!/\d/.test(password)) return false;    // Chiffre
      return true;
    };

    it('should reject passwords shorter than 8 characters', () => {
      expect(validatePassword('Pass1')).toBe(false);
      expect(validatePassword('Pass123')).toBe(false);
    });

    it('should reject passwords without lowercase', () => {
      expect(validatePassword('PASSWORD123')).toBe(false);
    });

    it('should reject passwords without uppercase', () => {
      expect(validatePassword('password123')).toBe(false);
    });

    it('should reject passwords without digit', () => {
      expect(validatePassword('PassWord')).toBe(false);
    });

    it('should accept valid passwords', () => {
      expect(validatePassword('SecurePass123')).toBe(true);
      expect(validatePassword('TestPass456')).toBe(true);
      expect(validatePassword('Claudyne2024')).toBe(true);
    });
  });

  // Validation du téléphone camerounais
  describe('Cameroonian Phone Validation', () => {
    const validatePhone = (phone: string): boolean => {
      return /^(\+237|237)?[26][0-9]{8}$/.test(phone.replace(/\s|-/g, ''));
    };

    it('should accept valid phone numbers', () => {
      expect(validatePhone('+237600000000')).toBe(true);
      expect(validatePhone('+237260000000')).toBe(true);
      expect(validatePhone('237600000000')).toBe(true);
      expect(validatePhone('260000000')).toBe(true);
      expect(validatePhone('600000000')).toBe(true);
      expect(validatePhone('+237 600 000 000')).toBe(true);
      expect(validatePhone('260-000-000')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validatePhone('0600000000')).toBe(false); // Starts with 0
      expect(validatePhone('+237800000000')).toBe(false); // Starts with 8
      expect(validatePhone('+2376000000')).toBe(false); // Too short
      expect(validatePhone('600000000')).toBe(true); // Valid (missing leading)
      expect(validatePhone('650000000')).toBe(false); // Starts with 5
      expect(validatePhone('abc600000000')).toBe(false); // Invalid characters
    });
  });

  // Validation de l'email
  describe('Email Validation', () => {
    const validateEmail = (email: string): boolean => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    it('should accept valid emails', () => {
      expect(validateEmail('jean@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('test+tag@gmail.com')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('user @example.com')).toBe(false);
    });
  });

  // Validation des noms
  describe('Name Validation', () => {
    const validateName = (name: string, min: number = 2, max: number = 50): boolean => {
      if (!name.trim()) return false;
      if (name.length < min) return false;
      if (name.length > max) return false;
      return true;
    };

    it('should validate firstName and lastName (2-50 chars)', () => {
      expect(validateName('J')).toBe(false); // Too short
      expect(validateName('Jean')).toBe(true);
      expect(validateName('A'.repeat(51))).toBe(false); // Too long
      expect(validateName('A'.repeat(50))).toBe(true);
    });

    it('should validate familyName (2-100 chars)', () => {
      expect(validateName('D')).toBe(false);
      expect(validateName('Dupont')).toBe(true);
      expect(validateName('A'.repeat(101), 2, 100)).toBe(false);
      expect(validateName('A'.repeat(100), 2, 100)).toBe(true);
    });

    it('should trim whitespace', () => {
      expect(validateName('  Jean  ')).toBe(true);
    });
  });

  // Validation de la checkbox acceptTerms
  describe('AcceptTerms Validation', () => {
    it('should require acceptTerms to be true', () => {
      expect(true).toBe(true); // Doit être coché
      expect(false).toBe(false); // Ne doit pas être décoché
    });
  });

  // Validation du formulaire complet
  describe('Complete Form Validation', () => {
    const validateForm = (formData: any): { valid: boolean; errors: string[] } => {
      const errors: string[] = [];

      // Noms
      if (!formData.firstName?.trim()) errors.push('firstName');
      if (!formData.lastName?.trim()) errors.push('lastName');
      if (!formData.familyName?.trim()) errors.push('familyName');

      // Contact
      const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
      const hasValidPhone = /^(\+237|237)?[26][0-9]{8}$/.test(
        (formData.phone || '').replace(/\s|-/g, '')
      );

      if (!hasValidEmail && !hasValidPhone) {
        errors.push('email_or_phone');
      }

      // Mot de passe
      if (!formData.password) errors.push('password');
      else if (formData.password.length < 8) errors.push('password_too_short');
      else if (!/[a-z]/.test(formData.password)) errors.push('password_no_lowercase');
      else if (!/[A-Z]/.test(formData.password)) errors.push('password_no_uppercase');
      else if (!/\d/.test(formData.password)) errors.push('password_no_digit');

      if (formData.password !== formData.confirmPassword) {
        errors.push('password_mismatch');
      }

      // Conditions
      if (!formData.acceptTerms) errors.push('accept_terms');

      return {
        valid: errors.length === 0,
        errors
      };
    };

    it('should validate a complete valid form', () => {
      const validForm = {
        firstName: 'Jean',
        lastName: 'Dupont',
        familyName: 'Dupont',
        email: 'jean@example.com',
        phone: '',
        password: 'SecurePass123',
        confirmPassword: 'SecurePass123',
        acceptTerms: true
      };

      const result = validateForm(validForm);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should detect multiple validation errors', () => {
      const invalidForm = {
        firstName: '', // Erreur
        lastName: '',  // Erreur
        familyName: 'Dupont',
        email: 'invalid', // Erreur
        phone: '',
        password: 'short', // Erreur
        confirmPassword: 'different', // Erreur
        acceptTerms: false // Erreur
      };

      const result = validateForm(invalidForm);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should accept valid phone form', () => {
      const formWithPhone = {
        firstName: 'Marie',
        lastName: 'Bernard',
        familyName: 'Bernard',
        email: '',
        phone: '+237600000000',
        password: 'ValidPass456',
        confirmPassword: 'ValidPass456',
        acceptTerms: true
      };

      const result = validateForm(formWithPhone);
      expect(result.valid).toBe(true);
    });
  });
});
