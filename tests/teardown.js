/**
 * Teardown global après tous les tests
 */

module.exports = async () => {
  // Nettoyer la base de données test
  if (global.testDb) {
    try {
      await global.testDb.end();
      console.log('🧹 Base de données test fermée');
    } catch (error) {
      console.error('Erreur fermeture DB test:', error.message);
    }
  }

  // Nettoyer les timers
  jest.clearAllTimers();

  // Force garbage collection si disponible
  if (global.gc) {
    global.gc();
  }

  console.log('🧪 Teardown test terminé');
};