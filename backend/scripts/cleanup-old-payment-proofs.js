/**
 * Script de nettoyage des anciennes preuves de paiement
 *
 * Supprime les fichiers de preuve de tickets approuvés/rejetés de plus de 90 jours
 * pour libérer de l'espace disque.
 *
 * Usage:
 *   node scripts/cleanup-old-payment-proofs.js [--dry-run] [--days=90]
 *
 * Options:
 *   --dry-run : Affiche ce qui serait supprimé sans le faire
 *   --days=N  : Nombre de jours de rétention (défaut: 90)
 */

// Load environment variables (same as server.js)
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load .env.production first if it exists (takes priority)
if (fs.existsSync(path.join(__dirname, '../.env.production'))) {
  dotenv.config({ path: path.join(__dirname, '../.env.production') });
}
// Load .env.postgres for database credentials (overrides previous DB settings)
if (fs.existsSync(path.join(__dirname, '../.env.postgres'))) {
  dotenv.config({ path: path.join(__dirname, '../.env.postgres'), override: true });
}
// Fallback to .env if others don't exist
if (fs.existsSync(path.join(__dirname, '../.env'))) {
  dotenv.config({ path: path.join(__dirname, '../.env') });
}

const fsPromises = fs.promises;
const logger = require('../src/utils/logger');

// Configuration
const RETENTION_DAYS = parseInt(process.argv.find(arg => arg.startsWith('--days='))?.split('=')[1]) || 90;
const DRY_RUN = process.argv.includes('--dry-run');
const UPLOAD_DIR = path.join(__dirname, '../uploads/payment-proofs');

async function cleanupOldProofs() {
  try {
    console.log('🧹 Nettoyage des preuves de paiement anciennes');
    console.log(`📅 Rétention: ${RETENTION_DAYS} jours`);
    console.log(`🔍 Mode: ${DRY_RUN ? 'DRY RUN (simulation)' : 'PRODUCTION'}`);
    console.log('');

    // Initialiser la base de données
    const database = require('../src/config/database');
    const models = database.initializeModels();
    const { PaymentTicket } = models;

    // Date limite (tickets plus anciens seront nettoyés)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

    console.log(`🗓️  Date limite: ${cutoffDate.toISOString()}`);
    console.log('');

    // Récupérer les tickets approuvés/rejetés anciens avec preuve
    const oldTickets = await PaymentTicket.findAll({
      where: {
        status: ['APPROVED', 'REJECTED'],
        reviewedAt: {
          [models.sequelize.Sequelize.Op.lt]: cutoffDate
        },
        proofImageUrl: {
          [models.sequelize.Sequelize.Op.not]: null
        }
      }
    });

    console.log(`📊 Tickets trouvés: ${oldTickets.length}`);
    console.log('');

    let deletedCount = 0;
    let deletedSize = 0;
    let errors = 0;

    for (const ticket of oldTickets) {
      try {
        const filePath = ticket.proofImageUrl;

        // Vérifier que le fichier existe
        const stats = await fsPromises.stat(filePath);
        const fileSize = stats.size;

        console.log(`📄 Ticket ${ticket.ticketReference}:`);
        console.log(`   Status: ${ticket.status}`);
        console.log(`   Reviewed: ${ticket.reviewedAt.toISOString()}`);
        console.log(`   File: ${path.basename(filePath)}`);
        console.log(`   Size: ${(fileSize / 1024).toFixed(2)} KB`);

        if (!DRY_RUN) {
          // Supprimer le fichier
          await fsPromises.unlink(filePath);

          // Mettre à jour le ticket (effacer les infos de preuve)
          await ticket.update({
            proofImageUrl: null,
            proofImageSize: null,
            proofImageType: null
          });

          console.log(`   ✅ Supprimé`);
        } else {
          console.log(`   🔍 Serait supprimé (dry-run)`);
        }

        deletedCount++;
        deletedSize += fileSize;
        console.log('');

      } catch (error) {
        if (error.code === 'ENOENT') {
          console.log(`   ⚠️  Fichier déjà absent`);

          // Nettoyer l'entrée DB même si le fichier n'existe pas
          if (!DRY_RUN) {
            await ticket.update({
              proofImageUrl: null,
              proofImageSize: null,
              proofImageType: null
            });
          }
        } else {
          console.log(`   ❌ Erreur: ${error.message}`);
          errors++;
        }
        console.log('');
      }
    }

    // Résumé
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📈 RÉSUMÉ:');
    console.log(`   Fichiers traités: ${deletedCount}`);
    console.log(`   Espace libéré: ${(deletedSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Erreurs: ${errors}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (DRY_RUN) {
      console.log('');
      console.log('💡 Mode DRY RUN - Aucune suppression effectuée');
      console.log('   Relancer sans --dry-run pour supprimer réellement');
    }

    // Logger l'opération
    logger.info('Cleanup payment proofs completed', {
      retentionDays: RETENTION_DAYS,
      dryRun: DRY_RUN,
      filesProcessed: deletedCount,
      sizeFreed: deletedSize,
      errors: errors
    });

    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    logger.error('Cleanup payment proofs failed', { error: error.message });
    process.exit(1);
  }
}

// Lancer le nettoyage
cleanupOldProofs();
