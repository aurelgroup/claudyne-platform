/**
 * Système de notifications pour les tickets de paiement
 * Gère l'envoi d'emails/SMS lors de la création, approbation et rejet de tickets
 */

const logger = require('./logger');

/**
 * Envoie une notification lors de la création d'un ticket
 * @param {Object} ticket - Le ticket créé
 * @param {Object} user - L'utilisateur qui a créé le ticket
 */
async function notifyTicketCreated(ticket, user) {
  try {
    // Notification à l'utilisateur
    const userMessage = `
🎟️ Ticket de paiement créé

Bonjour ${user.firstName || 'cher utilisateur'},

Votre ticket de paiement a été créé avec succès !

📋 Détails:
- Référence: ${ticket.ticketReference}
- Montant: ${ticket.amount} ${ticket.currency}
- Plan: ${ticket.getPlanTypeLabel ? ticket.getPlanTypeLabel() : ticket.planType}
- Statut: En attente de validation

Notre équipe va examiner votre demande dans les plus brefs délais (généralement sous 24h).

Vous recevrez une notification dès que votre ticket sera traité.

Merci de votre confiance ! 🙏
L'équipe Claudyne
    `.trim();

    // TODO: Intégrer avec votre service email/SMS
    logger.info('Notification ticket créé envoyée à l\'utilisateur', {
      ticketId: ticket.id,
      ticketReference: ticket.ticketReference,
      userId: user.id,
      userEmail: user.email,
      userPhone: user.phone
    });

    // Notification aux admins
    const adminMessage = `
🔔 Nouveau ticket de paiement

Un nouveau ticket de paiement nécessite votre attention:

📋 Détails:
- Référence: ${ticket.ticketReference}
- Utilisateur: ${user.firstName} ${user.lastName} (${user.email})
- Montant: ${ticket.amount} ${ticket.currency}
- Plan: ${ticket.getPlanTypeLabel ? ticket.getPlanTypeLabel() : ticket.planType}
- Méthode: ${ticket.getPaymentMethodLabel ? ticket.getPaymentMethodLabel() : ticket.paymentMethod}
- Justificatif: ${ticket.proofImageUrl ? 'Oui' : 'Non'}

🔗 Lien admin: https://claudyne.com/admin-payment-tickets.html
    `.trim();

    logger.info('Notification nouveau ticket envoyée aux admins', {
      ticketId: ticket.id,
      ticketReference: ticket.ticketReference
    });

    // Retourner les messages pour éventuellement les envoyer via email/SMS
    return {
      success: true,
      userNotification: userMessage,
      adminNotification: adminMessage
    };

  } catch (error) {
    logger.error('Erreur envoi notification création ticket:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Envoie une notification lors de l'approbation d'un ticket
 * @param {Object} ticket - Le ticket approuvé
 * @param {Object} user - L'utilisateur propriétaire du ticket
 * @param {Object} family - La famille associée
 * @param {Date} newExpirationDate - La nouvelle date d'expiration
 */
async function notifyTicketApproved(ticket, user, family, newExpirationDate) {
  try {
    const expiryDateStr = newExpirationDate ? newExpirationDate.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : 'N/A';

    const userMessage = `
✅ Ticket de paiement approuvé !

Bonjour ${user.firstName || 'cher utilisateur'},

Excellente nouvelle ! Votre ticket de paiement a été approuvé.

📋 Détails:
- Référence: ${ticket.ticketReference}
- Montant: ${ticket.amount} ${ticket.currency}
- Plan: ${ticket.getPlanTypeLabel ? ticket.getPlanTypeLabel() : ticket.planType}
- Durée: ${ticket.durationDays} jours

🎉 Votre abonnement a été prolongé !
📅 Nouvelle date d'expiration: ${expiryDateStr}

Vous pouvez maintenant profiter pleinement de tous les avantages de votre abonnement Claudyne.

Connectez-vous pour commencer: https://claudyne.com

Merci de votre confiance ! 🙏
L'équipe Claudyne
    `.trim();

    logger.info('Notification ticket approuvé envoyée', {
      ticketId: ticket.id,
      ticketReference: ticket.ticketReference,
      userId: user.id,
      userEmail: user.email,
      userPhone: user.phone,
      newExpirationDate: newExpirationDate
    });

    return {
      success: true,
      userNotification: userMessage
    };

  } catch (error) {
    logger.error('Erreur envoi notification approbation:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Envoie une notification lors du rejet d'un ticket
 * @param {Object} ticket - Le ticket rejeté
 * @param {Object} user - L'utilisateur propriétaire du ticket
 * @param {string} rejectionReason - La raison du rejet
 */
async function notifyTicketRejected(ticket, user, rejectionReason) {
  try {
    const userMessage = `
❌ Ticket de paiement non validé

Bonjour ${user.firstName || 'cher utilisateur'},

Votre ticket de paiement n'a pas pu être validé.

📋 Détails:
- Référence: ${ticket.ticketReference}
- Montant: ${ticket.amount} ${ticket.currency}
- Plan: ${ticket.getPlanTypeLabel ? ticket.getPlanTypeLabel() : ticket.planType}

🔍 Motif du rejet:
${rejectionReason}

💡 Que faire maintenant ?
- Vérifiez les informations de votre paiement
- Assurez-vous que le justificatif est clair et lisible
- Soumettez un nouveau ticket avec les corrections nécessaires

Pour toute question, n'hésitez pas à nous contacter.

L'équipe Claudyne reste à votre disposition ! 🙏
https://claudyne.com
    `.trim();

    logger.info('Notification ticket rejeté envoyée', {
      ticketId: ticket.id,
      ticketReference: ticket.ticketReference,
      userId: user.id,
      userEmail: user.email,
      userPhone: user.phone,
      rejectionReason: rejectionReason
    });

    return {
      success: true,
      userNotification: userMessage
    };

  } catch (error) {
    logger.error('Erreur envoi notification rejet:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  notifyTicketCreated,
  notifyTicketApproved,
  notifyTicketRejected
};
