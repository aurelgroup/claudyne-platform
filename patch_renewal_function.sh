#!/bin/bash
# Patch pour remplacer openRenewalModal() par une vraie implémentation API
# Date: 18 Octobre 2025

set -e

echo "🔧 Remplacement de la fonction openRenewalModal()..."

cd /opt/claudyne

# 1. Backup
echo "📦 Backup..."
cp student-interface-modern.html student-interface-modern.html.backup-before-renewal
echo "✅ Backup créé"

# 2. Créer la nouvelle fonction
cat > /tmp/new_renewal_function.js << 'EOF'
        async function openRenewalModal() {
            const API_BASE = 'https://claudyne.com';

            try {
                showToast('👑 Ouverture du panneau de renouvellement Premium...', 'info');

                // Récupérer le token
                const token = localStorage.getItem('claudyne_token');
                if (!token) {
                    showToast('⚠️ Veuillez vous connecter', 'warning');
                    return;
                }

                // Récupérer les infos utilisateur pour le plan actuel
                const userStr = localStorage.getItem('claudyne_user');
                let currentPlan = 'premium';
                if (userStr) {
                    try {
                        const user = JSON.parse(userStr);
                        currentPlan = user.subscriptionPlan || 'premium';
                    } catch (e) {
                        console.error('Erreur parsing user:', e);
                    }
                }

                // Préparer les données de renouvellement
                const renewalData = {
                    subscriptionPlan: currentPlan,
                    isRenewal: true,
                    sendEmail: true,
                    sendSMS: true,
                    returnUrl: window.location.origin + '/student',
                    cancelUrl: window.location.origin + '/student'
                };

                console.log('📤 Envoi demande de renouvellement:', renewalData);

                // Appel API pour initialiser le paiement de renouvellement
                const response = await fetch(`${API_BASE}/api/payments/initialize`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(renewalData)
                });

                console.log('📥 Réponse API renouvellement:', response.status);

                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ Données renouvellement:', result);

                    // Ajouter XP pour l'action de renouvellement
                    gainXP(10, 'Renouvellement Premium');

                    // Afficher les messages de succès
                    if (result.emailSent) {
                        showToast('📧 Email de renouvellement envoyé !', 'success');
                    }

                    if (result.smsSent) {
                        showToast('📱 SMS de renouvellement envoyé !', 'success');
                    }

                    // Si un lien de paiement est retourné, ouvrir dans un nouvel onglet
                    if (result.paymentUrl || result.data?.paymentUrl) {
                        const paymentUrl = result.paymentUrl || result.data.paymentUrl;
                        showToast('💳 Redirection vers l\'espace de paiement...', 'info');

                        setTimeout(() => {
                            window.open(paymentUrl, '_blank');
                            showToast('🔗 Page de paiement ouverte dans un nouvel onglet', 'success');
                        }, 1500);
                    } else {
                        // Fallback: afficher le lien dans un toast si pas d'URL
                        showToast('🔗 Lien de paiement généré - Vérifiez vos emails et SMS', 'success');
                    }

                    // Message de confirmation finale
                    setTimeout(() => {
                        showToast('✅ Demande de renouvellement traitée avec succès !', 'success');
                    }, 3000);

                } else {
                    // Gestion des erreurs HTTP
                    let errorMsg = 'Erreur lors du renouvellement';

                    try {
                        const errorData = await response.json();
                        errorMsg = errorData.message || errorData.error || errorMsg;
                    } catch (e) {
                        // Si impossible de parser la réponse
                        errorMsg = `Erreur ${response.status}: ${response.statusText}`;
                    }

                    console.error('❌ Erreur API renouvellement:', errorMsg);
                    showToast(`❌ ${errorMsg}`, 'error');

                    // Si erreur d'authentification, suggérer de se reconnecter
                    if (response.status === 401) {
                        setTimeout(() => {
                            showToast('🔒 Session expirée - Veuillez vous reconnecter', 'warning');
                        }, 2000);
                    }
                }

            } catch (error) {
                console.error('❌ Exception lors du renouvellement:', error);
                showToast(`❌ Erreur: ${error.message || 'Impossible de contacter le serveur'}`, 'error');
            }
        }
EOF

echo "✅ Nouvelle fonction créée"

# 3. Trouver et remplacer l'ancienne fonction
echo "🔧 Remplacement de l'ancienne fonction..."

# Trouver la ligne de début
START_LINE=$(grep -n "function openRenewalModal()" student-interface-modern.html | cut -d: -f1)

if [ -z "$START_LINE" ]; then
    echo "❌ ERREUR: Fonction openRenewalModal() non trouvée"
    exit 1
fi

# Trouver la ligne de fin (le } fermant la fonction avant studentLogout)
# On cherche la ligne avec juste "        }" après openRenewalModal
END_LINE=$(awk -v start="$START_LINE" 'NR > start && /^        \}$/ {print NR; exit}' student-interface-modern.html)

if [ -z "$END_LINE" ]; then
    echo "❌ ERREUR: Fin de fonction non trouvée"
    exit 1
fi

echo "   Fonction trouvée: lignes $START_LINE à $END_LINE"

# Supprimer l'ancienne fonction (du début au } fermant)
sed -i "${START_LINE},${END_LINE}d" student-interface-modern.html

echo "✅ Ancienne fonction supprimée"

# Insérer la nouvelle fonction à la même position
BEFORE_LINE=$((START_LINE - 1))
sed -i "${BEFORE_LINE}r /tmp/new_renewal_function.js" student-interface-modern.html

echo "✅ Nouvelle fonction insérée"

# 4. Vérification
echo ""
echo "🔍 Vérification..."

if grep -q "async function openRenewalModal()" student-interface-modern.html && \
   grep -q "/api/payments/initialize" student-interface-modern.html && \
   grep -q "isRenewal: true" student-interface-modern.html; then
    echo "✅ SUCCÈS: Fonction openRenewalModal() remplacée avec succès"
    echo ""
    echo "📊 Nouvelle fonction inclut:"
    echo "   - Appel API: POST /api/payments/initialize"
    echo "   - Envoi email: sendEmail: true"
    echo "   - Envoi SMS: sendSMS: true"
    echo "   - Ajout XP: gainXP(10, 'Renouvellement Premium')"
    echo "   - Ouverture lien paiement: window.open(paymentUrl)"
    echo "   - Gestion erreurs complète"
    echo ""
    echo "🌐 Tester: https://claudyne.com/student"
    echo "   Cliquer sur 'Renouveler mon abonnement'"
else
    echo "❌ ERREUR: Remplacement incomplet"
    echo "   Restaurer le backup:"
    echo "   cp student-interface-modern.html.backup-before-renewal student-interface-modern.html"
    exit 1
fi

# Nettoyage
rm -f /tmp/new_renewal_function.js

echo ""
echo "✨ Patch de renouvellement appliqué avec succès!"
