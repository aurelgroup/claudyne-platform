/**
 * Utilitaire de génération de mots de passe temporaires sécurisés
 */

/**
 * Génère un mot de passe temporaire aléatoire sécurisé
 * Format: 2 majuscules + 6 chiffres + 2 caractères spéciaux (mélangés)
 * Exemple: 3@7Y4#85K2
 *
 * @returns {string} Mot de passe temporaire
 */
function generateTempPassword() {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Sans I et O pour éviter confusion
  const numbers = '23456789'; // Sans 0 et 1
  const special = '@#$%';

  let password = '';

  // Ajouter 2 majuscules
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];

  // Ajouter 6 chiffres
  for (let i = 0; i < 6; i++) {
    password += numbers[Math.floor(Math.random() * numbers.length)];
  }

  // Ajouter 2 caractères spéciaux
  password += special[Math.floor(Math.random() * special.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Mélanger les caractères pour plus de sécurité
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

module.exports = {
  generateTempPassword
};
