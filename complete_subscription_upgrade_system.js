// ===== SYSTÈME COMPLET DE GESTION DES ABONNEMENTS =====
// À intégrer dans student-interface-modern.html
// Date: 18 Octobre 2025

// PARTIE 1: HTML du modal (à ajouter avant </body>)
/*
<!-- Modal de sélection des plans d'abonnement -->
<div id="subscriptionPlansModal" class="modal" style="display: none;">
    <div class="modal-content" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
        <span class="close" onclick="closeSubscriptionPlansModal()">&times;</span>
        <h2 style="margin-bottom: 1rem;">Choisissez votre formule</h2>
        <p style="color: #6B7280; margin-bottom: 2rem;">Sélectionnez le plan qui vous convient le mieux</p>

        <div id="plansContainer" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
            <!-- Plans chargés dynamiquement -->
        </div>

        <div style="text-align: center; color: #6B7280; font-size: 0.9rem;">
            <p>🔒 Paiement sécurisé • 📧 Confirmation par email</p>
        </div>
    </div>
</div>

<style>
    /* Styles pour le modal des plans */
    .plan-selection-card {
        border: 2px solid #E5E7EB;
        border-radius: 12px;
        padding: 1.5rem;
        background: white;
        transition: all 0.3s ease;
        cursor: pointer;
        position: relative;
    }

    .plan-selection-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        border-color: #3B82F6;
    }

    .plan-selection-card.featured {
        border-color: #F59E0B;
        background: linear-gradient(135deg, #FFF7ED 0%, #FFFFFF 100%);
    }

    .plan-selection-card.featured::before {
        content: '⭐ RECOMMANDÉ';
        position: absolute;
        top: -12px;
        left: 50%;
        transform: translateX(-50%);
        background: #F59E0B;
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: bold;
    }

    .plan-selection-card.disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background: #F3F4F6;
    }

    .plan-selection-card.disabled:hover {
        transform: none;
        box-shadow: none;
        border-color: #E5E7EB;
    }

    .plan-name {
        font-size: 1.5rem;
        font-weight: bold;
        margin-bottom: 0.5rem;
        color: #1F2937;
    }

    .plan-price {
        font-size: 2rem;
        font-weight: bold;
        color: #3B82F6;
        margin: 1rem 0;
    }

    .plan-price.free {
        color: #10B981;
    }

    .plan-original-price {
        text-decoration: line-through;
        color: #9CA3AF;
        font-size: 1rem;
        margin-right: 0.5rem;
    }

    .plan-discount-badge {
        background: #10B981;
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 6px;
        font-size: 0.75rem;
        display: inline-block;
        margin-top: 0.5rem;
    }

    .plan-features {
        list-style: none;
        padding: 0;
        margin: 1rem 0;
    }

    .plan-features li {
        padding: 0.5rem 0;
        border-bottom: 1px solid #F3F4F6;
        font-size: 0.9rem;
        color: #6B7280;
    }

    .plan-features li::before {
        content: '✓';
        color: #10B981;
        font-weight: bold;
        margin-right: 0.5rem;
    }

    .plan-cta-button {
        width: 100%;
        padding: 0.75rem;
        border: none;
        border-radius: 8px;
        background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
        color: white;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-top: 1rem;
    }

    .plan-cta-button:hover {
        background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
        transform: scale(1.02);
    }

    .plan-cta-button.featured {
        background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
    }

    .plan-cta-button.featured:hover {
        background: linear-gradient(135deg, #D97706 0%, #B45309 100%);
    }

    .plan-cta-button:disabled {
        background: #9CA3AF;
        cursor: not-allowed;
        transform: none;
    }
</style>
*/

// PARTIE 2: Fonctions JavaScript

// Mapping entre anciens noms de plans (DB) et nouveaux IDs (API)
const PLAN_MAPPING = {
    'INDIVIDUAL_STUDENT': 'plan_student_monthly',
    'FAMILY_MANAGER': 'plan_family_monthly',
    'INDIVIDUAL_TEACHER': 'plan_discovery_trial', // Enseignant → Gratuit
    'NONE': 'plan_discovery_trial'
};

// Fonction pour obtenir l'ID du plan depuis le nom de la DB
function getPlanIdFromDbName(dbPlanName) {
    return PLAN_MAPPING[dbPlanName] || dbPlanName;
}

// Fonction pour obtenir le nom DB depuis l'ID du plan
function getDbNameFromPlanId(planId) {
    const reversedMapping = Object.entries(PLAN_MAPPING).find(([key, value]) => value === planId);
    return reversedMapping ? reversedMapping[0] : planId;
}

// Fonction principale: Ouvrir le modal de renouvellement/changement de plan
async function openRenewalModal() {
    const API_BASE = 'https://claudyne.com';

    try {
        showToast('📋 Chargement des formules disponibles...', 'info');

        const token = localStorage.getItem('claudyne_token');
        if (!token) {
            showToast('⚠️ Veuillez vous connecter', 'warning');
            return;
        }

        // Récupérer le plan actuel de l'utilisateur
        const userStr = localStorage.getItem('claudyne_user');
        let currentDbPlan = 'NONE';

        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                currentDbPlan = user.subscriptionPlan || 'NONE';
            } catch (e) {
                console.error('Erreur parsing user:', e);
            }
        }

        const currentPlanId = getPlanIdFromDbName(currentDbPlan);
        console.log(`Plan actuel: ${currentDbPlan} (${currentPlanId})`);

        // Récupérer tous les plans disponibles depuis l'API admin
        const plansResponse = await fetch(`${API_BASE}/api/admin/pricing-plans`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!plansResponse.ok) {
            throw new Error('Impossible de récupérer les plans');
        }

        const plansData = await plansResponse.json();
        console.log('Plans récupérés:', plansData);

        if (!plansData.success || !plansData.data || !Array.isArray(plansData.data.plans)) {
            throw new Error('Format de données invalide');
        }

        // Filtrer les plans: uniquement les plans actifs
        const activePlans = plansData.data.plans.filter(plan => plan.status === 'active');

        if (activePlans.length === 0) {
            showToast('Aucun plan disponible actuellement', 'warning');
            return;
        }

        // Afficher le modal avec les plans
        displaySubscriptionPlansModal(activePlans, currentPlanId, currentDbPlan);
        gainXP(5, 'Consultation des plans');

    } catch (error) {
        console.error('Erreur lors du chargement des plans:', error);
        showToast(`❌ Erreur: ${error.message}`, 'error');
    }
}

// Afficher le modal avec les plans
function displaySubscriptionPlansModal(plans, currentPlanId, currentDbPlan) {
    const modal = document.getElementById('subscriptionPlansModal');
    const container = document.getElementById('plansContainer');

    if (!modal || !container) {
        console.error('Modal ou container non trouvé');
        return;
    }

    // Générer le HTML des plans
    const plansHtml = plans.map(plan => {
        const isCurrentPlan = plan.id === currentPlanId;
        const isTrial = plan.interval === 'trial';
        const isFree = plan.price === 0;

        // Déterminer le texte du bouton
        let buttonText = 'Souscrire';
        if (isCurrentPlan) {
            buttonText = isFree ? 'Plan actuel (Gratuit)' : 'Renouveler';
        } else if (plan.price > 0) {
            buttonText = 'Choisir ce plan';
        } else {
            buttonText = 'Essai gratuit';
        }

        // Prix formaté
        const priceDisplay = isFree ? 'Gratuit' : `${plan.price.toLocaleString()} ${plan.currency}`;
        const intervalText = {
            'monthly': '/mois',
            'quarterly': '/trimestre',
            'annual': '/an',
            'trial': isFree ? '' : '/période'
        }[plan.interval] || '';

        // HTML des features
        const featuresHtml = (plan.features || []).map(feature =>
            `<li>${feature}</li>`
        ).join('');

        // Badge de réduction
        const discountHtml = plan.discount ?
            `<div class="plan-discount-badge">💰 Économisez ${plan.discount.toLocaleString()} ${plan.currency}</div>` : '';

        // Prix original barré
        const originalPriceHtml = plan.originalPrice && plan.originalPrice > plan.price ?
            `<div class="plan-original-price">${plan.originalPrice.toLocaleString()} ${plan.currency}</div>` : '';

        return `
            <div class="plan-selection-card ${plan.featured ? 'featured' : ''} ${isCurrentPlan && isFree ? 'disabled' : ''}"
                 onclick="selectSubscriptionPlan('${plan.id}', ${plan.price}, '${plan.name}', ${isCurrentPlan}, '${currentDbPlan}')">
                <div class="plan-name">${plan.name}</div>
                <div style="color: #6B7280; font-size: 0.9rem; margin-bottom: 0.5rem;">${plan.description || ''}</div>

                ${originalPriceHtml}
                <div class="plan-price ${isFree ? 'free' : ''}">${priceDisplay}${intervalText}</div>
                ${discountHtml}

                ${plan.intervalCount && isTrial ? `<div style="color: #6B7280; font-size: 0.85rem; margin-top: 0.5rem;">${plan.intervalCount} jours d'essai</div>` : ''}

                <ul class="plan-features">
                    ${featuresHtml}
                </ul>

                <button class="plan-cta-button ${plan.featured ? 'featured' : ''}"
                        ${isCurrentPlan && isFree ? 'disabled' : ''}>
                    ${buttonText}
                </button>
            </div>
        `;
    }).join('');

    container.innerHTML = plansHtml;
    modal.style.display = 'block';
}

// Fermer le modal
function closeSubscriptionPlansModal() {
    const modal = document.getElementById('subscriptionPlansModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Sélectionner et souscrire à un plan
async function selectSubscriptionPlan(planId, planPrice, planName, isCurrentPlan, currentDbPlan) {
    const API_BASE = 'https://claudyne.com';

    // Ne rien faire si c'est le plan actuel et qu'il est gratuit
    if (isCurrentPlan && planPrice === 0) {
        return;
    }

    try {
        const token = localStorage.getItem('claudyne_token');
        if (!token) {
            showToast('⚠️ Veuillez vous connecter', 'warning');
            return;
        }

        // Fermer le modal
        closeSubscriptionPlansModal();

        // Message différent selon si c'est un renouvellement ou un changement
        const actionType = isCurrentPlan ? 'renouvellement' : 'changement de formule';
        showToast(`👑 Traitement de votre ${actionType} vers ${planName}...`, 'info');

        // Récupérer les infos utilisateur pour le téléphone
        const userStr = localStorage.getItem('claudyne_user');
        let userPhone = null;

        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                userPhone = user.phone || user.phoneNumber || null;
            } catch (e) {
                console.error('Erreur parsing user:', e);
            }
        }

        // Convertir le plan ID en nom DB pour l'envoyer à l'API
        const targetDbPlan = getDbNameFromPlanId(planId);

        // Préparer les données pour l'API
        const subscriptionData = {
            // Paramètres obligatoires
            amount: planPrice,
            paymentMethod: 'mobile_money',
            type: 'subscription',
            currency: 'FCFA',

            // Identifiants du plan
            planId: planId,  // Nouvel ID (plan_student_monthly, etc.)
            subscriptionPlan: targetDbPlan, // Ancien nom (INDIVIDUAL_STUDENT, etc.)

            // Type d'opération
            isRenewal: isCurrentPlan,
            isUpgrade: !isCurrentPlan && planPrice > 0,

            // Notifications
            sendEmail: true,
            sendSMS: true,

            // URLs de retour
            returnUrl: window.location.origin + '/student',
            cancelUrl: window.location.origin + '/student'
        };

        // Ajouter le téléphone si disponible
        if (userPhone) {
            subscriptionData.phoneNumber = userPhone;
        }

        console.log('📤 Envoi demande de souscription:', subscriptionData);

        // Appel API pour initialiser le paiement
        const response = await fetch(`${API_BASE}/api/payments/initialize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(subscriptionData)
        });

        console.log('📥 Réponse API:', response.status);

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Souscription initialisée:', result);

            // Ajouter XP
            gainXP(15, `Souscription ${planName}`);

            // Afficher les notifications de succès
            if (result.emailSent) {
                showToast('📧 Email de confirmation envoyé !', 'success');
            }

            if (result.smsSent) {
                showToast('📱 SMS de confirmation envoyé !', 'success');
            }

            // Rediriger vers la page de paiement si disponible
            if (result.paymentUrl || result.data?.paymentUrl) {
                const paymentUrl = result.paymentUrl || result.data.paymentUrl;
                showToast('💳 Redirection vers l\'espace de paiement...', 'info');

                setTimeout(() => {
                    window.open(paymentUrl, '_blank');
                    showToast('🔗 Page de paiement ouverte dans un nouvel onglet', 'success');
                }, 1500);
            } else {
                showToast('🔗 Lien de paiement généré - Vérifiez vos emails et SMS', 'success');
            }

            setTimeout(() => {
                showToast(`✅ ${isCurrentPlan ? 'Renouvellement' : 'Changement de plan'} traité avec succès !`, 'success');
            }, 3000);

        } else {
            // Gestion des erreurs HTTP
            let errorMsg = 'Erreur lors de la souscription';

            try {
                const errorData = await response.json();
                errorMsg = errorData.message || errorData.error || errorMsg;
                console.error('❌ Détails erreur API:', errorData);
            } catch (e) {
                errorMsg = `Erreur ${response.status}: ${response.statusText}`;
            }

            console.error('❌ Erreur API:', errorMsg);
            showToast(`❌ ${errorMsg}`, 'error');

            if (response.status === 401) {
                setTimeout(() => {
                    showToast('🔒 Session expirée - Veuillez vous reconnecter', 'warning');
                }, 2000);
            }
        }

    } catch (error) {
        console.error('❌ Exception lors de la souscription:', error);
        showToast(`❌ Erreur: ${error.message || 'Impossible de contacter le serveur'}`, 'error');
    }
}

// ===== FIN DU SYSTÈME =====
