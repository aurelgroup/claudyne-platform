/**
 * Claudyne Parent Interface - Advanced Form Validation
 * Système de validation avancée pour les formulaires parent
 */

class FormValidator {
    constructor() {
        this.rules = {};
        this.messages = {};
        this.errorContainer = null;
        this.realTimeValidation = true;
        this.validators = this.initializeValidators();
    }

    // Initialisation des validateurs prédéfinis
    initializeValidators() {
        return {
            required: (value) => value !== '' && value !== null && value !== undefined,
            email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            phone: (value) => /^(\+237|237)?[0-9]{9}$/.test(value.replace(/\s/g, '')),
            minLength: (value, length) => value.length >= length,
            maxLength: (value, length) => value.length <= length,
            numeric: (value) => !isNaN(value) && !isNaN(parseFloat(value)),
            integer: (value) => Number.isInteger(Number(value)),
            positiveNumber: (value) => Number(value) > 0,
            date: (value) => !isNaN(Date.parse(value)),
            futureDate: (value) => new Date(value) > new Date(),
            pastDate: (value) => new Date(value) < new Date(),
            strongPassword: (value) => {
                // Au moins 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
                return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value);
            },
            cameroonianName: (value) => {
                // Validation pour noms camerounais (lettres, espaces, apostrophes, traits d'union)
                return /^[A-Za-zÀ-ÿ\s\-']+$/.test(value);
            },
            schoolLevel: (value) => {
                const validLevels = ['CP', 'CE1', 'CE2', 'CM1', 'CM2', '6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Tle'];
                return validLevels.includes(value);
            },
            gradeRange: (value) => {
                const grade = Number(value);
                return grade >= 0 && grade <= 20;
            }
        };
    }

    // Messages d'erreur par défaut
    getDefaultMessages() {
        return {
            required: 'Ce champ est obligatoire',
            email: 'Veuillez saisir une adresse email valide',
            phone: 'Numéro de téléphone camerounais invalide (ex: +237 6XX XXX XXX)',
            minLength: 'Minimum {0} caractères requis',
            maxLength: 'Maximum {0} caractères autorisés',
            numeric: 'Veuillez saisir un nombre valide',
            integer: 'Veuillez saisir un nombre entier',
            positiveNumber: 'Le nombre doit être positif',
            date: 'Veuillez saisir une date valide',
            futureDate: 'La date doit être dans le futur',
            pastDate: 'La date doit être dans le passé',
            strongPassword: 'Mot de passe : 8+ caractères, majuscule, minuscule, chiffre, caractère spécial',
            cameroonianName: 'Nom invalide (lettres, espaces, apostrophes, traits d\'union uniquement)',
            schoolLevel: 'Niveau scolaire invalide',
            gradeRange: 'Note doit être entre 0 et 20',
            match: 'Les champs ne correspondent pas'
        };
    }

    // Configuration des règles pour un champ
    addRule(fieldName, validatorName, param = null, customMessage = null) {
        if (!this.rules[fieldName]) {
            this.rules[fieldName] = [];
        }

        this.rules[fieldName].push({
            validator: validatorName,
            param: param,
            message: customMessage || this.getDefaultMessages()[validatorName] || 'Valeur invalide'
        });

        return this;
    }

    // Configuration pour formulaire d'ajout d'enfant
    setupChildForm() {
        this.addRule('childName', 'required')
            .addRule('childName', 'cameroonianName')
            .addRule('childName', 'minLength', 2)
            .addRule('childName', 'maxLength', 50);

        this.addRule('childAge', 'required')
            .addRule('childAge', 'integer')
            .addRule('childAge', 'positiveNumber');

        this.addRule('childClass', 'required')
            .addRule('childClass', 'schoolLevel');

        this.addRule('childSchool', 'required')
            .addRule('childSchool', 'minLength', 3)
            .addRule('childSchool', 'maxLength', 100);

        return this;
    }

    // Configuration pour formulaire de message
    setupMessageForm() {
        this.addRule('messageSubject', 'required')
            .addRule('messageSubject', 'minLength', 5)
            .addRule('messageSubject', 'maxLength', 100);

        this.addRule('messageContent', 'required')
            .addRule('messageContent', 'minLength', 10)
            .addRule('messageContent', 'maxLength', 1000);

        this.addRule('messageRecipient', 'required');

        return this;
    }

    // Configuration pour formulaire d'événement
    setupEventForm() {
        this.addRule('eventTitle', 'required')
            .addRule('eventTitle', 'minLength', 3)
            .addRule('eventTitle', 'maxLength', 100);

        this.addRule('eventDate', 'required')
            .addRule('eventDate', 'date')
            .addRule('eventDate', 'futureDate');

        this.addRule('eventType', 'required');

        return this;
    }

    // Configuration pour changement de mot de passe
    setupPasswordForm() {
        this.addRule('currentPassword', 'required');

        this.addRule('newPassword', 'required')
            .addRule('newPassword', 'strongPassword');

        this.addRule('confirmPassword', 'required');

        return this;
    }

    // Validation d'un champ spécifique
    validateField(fieldName, value, allValues = {}) {
        const fieldRules = this.rules[fieldName] || [];
        const errors = [];

        for (const rule of fieldRules) {
            let isValid = false;

            switch (rule.validator) {
                case 'match':
                    // Validation spéciale pour champs correspondants
                    const matchField = rule.param;
                    isValid = value === allValues[matchField];
                    break;

                default:
                    const validator = this.validators[rule.validator];
                    if (validator) {
                        isValid = rule.param !== null
                            ? validator(value, rule.param)
                            : validator(value);
                    }
            }

            if (!isValid) {
                let message = rule.message;
                if (rule.param && message.includes('{0}')) {
                    message = message.replace('{0}', rule.param);
                }
                errors.push(message);
            }
        }

        return errors;
    }

    // Validation complète d'un formulaire
    validateForm(form) {
        const formData = new FormData(form);
        const values = {};
        const errors = {};

        // Extraire toutes les valeurs
        for (const [key, value] of formData.entries()) {
            values[key] = value;
        }

        // Valider chaque champ
        for (const fieldName in this.rules) {
            const fieldValue = values[fieldName] || '';
            const fieldErrors = this.validateField(fieldName, fieldValue, values);

            if (fieldErrors.length > 0) {
                errors[fieldName] = fieldErrors;
            }
        }

        // Validations spéciales pour certains formulaires
        if (form.id === 'passwordForm' && values.newPassword && values.confirmPassword) {
            if (values.newPassword !== values.confirmPassword) {
                if (!errors.confirmPassword) errors.confirmPassword = [];
                errors.confirmPassword.push('Les mots de passe ne correspondent pas');
            }
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors,
            values
        };
    }

    // Affichage des erreurs
    displayErrors(errors, form) {
        // Nettoyer les erreurs précédentes
        this.clearErrors(form);

        for (const [fieldName, fieldErrors] of Object.entries(errors)) {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                this.showFieldError(field, fieldErrors[0]); // Afficher la première erreur
            }
        }
    }

    // Affichage d'erreur pour un champ spécifique
    showFieldError(field, message) {
        field.classList.add('error');

        // Créer ou mettre à jour le message d'erreur
        let errorElement = field.parentNode.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            field.parentNode.appendChild(errorElement);
        }

        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    // Nettoyage des erreurs
    clearErrors(form) {
        form.querySelectorAll('.error').forEach(field => {
            field.classList.remove('error');
        });

        form.querySelectorAll('.error-message').forEach(errorElement => {
            errorElement.remove();
        });
    }

    // Nettoyage d'erreur pour un champ spécifique
    clearFieldError(field) {
        field.classList.remove('error');
        const errorElement = field.parentNode.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
    }

    // Initialisation de la validation en temps réel
    initRealTimeValidation(form) {
        if (!this.realTimeValidation) return;

        const fields = form.querySelectorAll('input, select, textarea');

        fields.forEach(field => {
            // Validation sur perte de focus
            field.addEventListener('blur', () => {
                const fieldName = field.name;
                if (this.rules[fieldName]) {
                    const errors = this.validateField(fieldName, field.value);
                    if (errors.length > 0) {
                        this.showFieldError(field, errors[0]);
                    } else {
                        this.clearFieldError(field);
                    }
                }
            });

            // Nettoyage de l'erreur lors de la saisie
            field.addEventListener('input', () => {
                if (field.classList.contains('error')) {
                    this.clearFieldError(field);
                }
            });
        });
    }

    // Styles CSS pour la validation
    addValidationStyles() {
        if (document.getElementById('validation-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'validation-styles';
        styles.textContent = `
            .error {
                border-color: #ef4444 !important;
                box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
            }

            .error-message {
                color: #ef4444;
                font-size: 0.875rem;
                margin-top: 0.5rem;
                display: none;
                animation: slideInError 0.3s ease;
            }

            @keyframes slideInError {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .valid {
                border-color: #10b981 !important;
                box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1) !important;
            }

            .form-group.success .form-input::after {
                content: "✓";
                position: absolute;
                right: 12px;
                top: 50%;
                transform: translateY(-50%);
                color: #10b981;
                font-weight: bold;
            }
        `;

        document.head.appendChild(styles);
    }
}

// Instance globale de validation
const formValidator = new FormValidator();

// Initialisation automatique lors du chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    formValidator.addValidationStyles();

    // Configuration automatique selon les formulaires présents
    const childForm = document.querySelector('#addChildModal form');
    if (childForm) {
        formValidator.setupChildForm();
        formValidator.initRealTimeValidation(childForm);
    }

    const messageForm = document.querySelector('#messageForm');
    if (messageForm) {
        formValidator.setupMessageForm();
        formValidator.initRealTimeValidation(messageForm);
    }

    const eventForm = document.querySelector('#addEventModal form');
    if (eventForm) {
        formValidator.setupEventForm();
        formValidator.initRealTimeValidation(eventForm);
    }

    const passwordForm = document.querySelector('#changePasswordModal form');
    if (passwordForm) {
        formValidator.setupPasswordForm();
        formValidator.initRealTimeValidation(passwordForm);
    }
});

// Export pour utilisation globale
if (typeof window !== 'undefined') {
    window.FormValidator = FormValidator;
    window.formValidator = formValidator;
}