/**
 * Fichier de test pour vérifier la détection des erreurs d'échappement
 * Ce fichier contient INTENTIONNELLEMENT des erreurs pour tester ESLint
 *
 * Exécutez : npm run lint test-eslint-escapes.js
 */

// ==========================================
// TEST 1 : Apostrophe sur-échappé
// ==========================================

// ❌ ERREUR : Apostrophe inutilement échappé dans string simple
// eslint-disable-next-line no-useless-escape
const message1 = "Démarrage de l\\'agent Claudyne";

// ✅ CORRECT
const message1Fixed = "Démarrage de l'agent Claudyne";

// ❌ ERREUR : Apostrophe dans template string (pas besoin d'échapper)
// eslint-disable-next-line no-useless-escape
const message2 = `Arrêt de l\\'agent`;

// ✅ CORRECT
const message2Fixed = `Arrêt de l'agent`;


// ==========================================
// TEST 2 : Newline double-échappé
// ==========================================

// ❌ ERREUR : Newline double-échappé
const text1 = 'Ligne 1\\nLigne 2';

// ✅ CORRECT
const text1Fixed = 'Ligne 1\nLigne 2';

// ❌ ERREUR : Split sur newline double-échappé
const lines = 'a\\nb\\nc'.split('\\n');

// ✅ CORRECT
const linesFixed = 'a\nb\nc'.split('\n');

// ❌ ERREUR : Concaténation avec newline double-échappé
const multiline = 'Première ligne' + '\\n' + 'Deuxième ligne';

// ✅ CORRECT
const multilineFixed = 'Première ligne' + '\n' + 'Deuxième ligne';


// ==========================================
// TEST 3 : Caractères inutilement échappés
// ==========================================

// ❌ ERREUR : Point d'exclamation échappé
const warning = 'Attention\!';

// ✅ CORRECT
const warningFixed = 'Attention!';

// ❌ ERREUR : Parenthèse échappée hors regex
const parens = 'Texte \(entre parenthèses\)';

// ✅ CORRECT
const parensFixed = 'Texte (entre parenthèses)';

// ❌ ERREUR : Espace échappé
const spaced = 'Mot\ suivant';

// ✅ CORRECT
const spacedFixed = 'Mot suivant';


// ==========================================
// TEST 4 : Regex (cas légitime VS incorrect)
// ==========================================

// ❌ ERREUR : Échappement inutile dans regex
const regex1 = /\!/;

// ✅ CORRECT
const regex1Fixed = /!/;

// ✅ CORRECT : Échappement nécessaire pour métacaractères
const regexValid1 = /\./;  // Point doit être échappé
const regexValid2 = /\(/;  // Parenthèse ouvrante doit être échappée
const regexValid3 = /\\/;  // Backslash doit être échappé


// ==========================================
// TEST 5 : Template strings
// ==========================================

// ❌ ERREUR : Newline échappé dans template string
const template1 = `Première ligne\\nDeuxième ligne`;

// ✅ CORRECT : Vrai retour à la ligne dans template
const template1Fixed = `Première ligne
Deuxième ligne`;

// ✅ CORRECT : Newline échappé si on veut un littéral
const template2Fixed = `Première ligne\nDeuxième ligne`;


// ==========================================
// TEST 6 : Commandes shell (cas particulier)
// ==========================================

// ❌ ERREUR : Dans une string JavaScript, pas besoin de double escape
const shellCmd1 = "tr ',' '\\n' | wc -l";

// ✅ CORRECT : Simple escape suffit
const shellCmd1Fixed = "tr ',' '\n' | wc -l";


// ==========================================
// TEST 7 : Séquences octales (obsolètes)
// ==========================================

// ❌ ERREUR : Séquence octale obsolète
const octal = '\123';

// ✅ CORRECT : Utiliser Unicode
const octalFixed = '\u0053';


// ==========================================
// RÉSUMÉ DES ERREURS ATTENDUES
// ==========================================

/*
ESLint devrait détecter ces lignes avec des erreurs :
- Ligne 13 : l\\'agent
- Ligne 19 : l\\'agent
- Ligne 28 : \\n dans string
- Ligne 33 : \\n dans split
- Ligne 38 : \\n en concaténation
- Ligne 49 : \!
- Ligne 54 : \( et \)
- Ligne 59 : \ avant espace
- Ligne 70 : \! dans regex
- Ligne 85 : \\n dans template
- Ligne 99 : \\n dans commande shell
- Ligne 110 : \123 séquence octale

Total : ~12 erreurs d'échappement à détecter
*/

console.log('Fichier de test chargé - Exécutez: npm run lint test-eslint-escapes.js');
