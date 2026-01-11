#!/bin/bash
# Script d'application du patch affichage dynamique
# Date: 18 Octobre 2025
# Fichier cible: /opt/claudyne/student-interface-modern.html

set -e  # Arrêt en cas d'erreur

echo "🔧 Application du patch affichage dynamique..."

cd /opt/claudyne

# 1. Backup de sécurité
echo "📦 Création backup de sécurité..."
cp student-interface-modern.html student-interface-modern.html.backup-before-dynamic-display
echo "✅ Backup créé: student-interface-modern.html.backup-before-dynamic-display"

# 2. Créer le fichier avec les fonctions
echo "📝 Création des fonctions JavaScript..."
cat > /tmp/dynamic_display_functions.js << 'EOF'

        // ===== FONCTIONS AFFICHAGE DYNAMIQUE =====
        function updateUserProfile(profileData) {
            if (!profileData) return;

            try {
                // Mise à jour du nom
                const nameEl = document.getElementById('user-display-name');
                if (nameEl && profileData.firstName && profileData.lastName) {
                    nameEl.textContent = `${profileData.firstName} ${profileData.lastName}`;
                }

                // Mise à jour des détails (niveau + école)
                const detailsEl = document.getElementById('user-display-details');
                if (detailsEl) {
                    const level = profileData.educationLevel || 'Niveau non renseigné';
                    const school = profileData.schoolName || 'Établissement non renseigné';
                    detailsEl.textContent = `${level} • ${school}`;
                }

                console.log('✅ Profil utilisateur mis à jour');
            } catch (e) {
                console.error('❌ Erreur updateUserProfile:', e);
            }
        }

        function updateSubscriptionInfo(profileData) {
            if (!profileData) return;

            try {
                const subEl = document.getElementById('subscription-display');
                if (!subEl) return;

                // Récupérer le nom du plan
                const planName = profileData.subscriptionPlan || 'Premium';

                // Calculer le temps restant
                let displayText = planName;
                let urgencyClass = '';

                if (profileData.subscriptionEndDate) {
                    const endDate = new Date(profileData.subscriptionEndDate);
                    const now = new Date();
                    const diffTime = endDate - now;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays > 0) {
                        const months = Math.floor(diffDays / 30);
                        const days = diffDays % 30;

                        if (months > 0 && days > 0) {
                            displayText += ` - Expire dans ${months} mois, ${days} jours`;
                        } else if (months > 0) {
                            displayText += ` - Expire dans ${months} mois`;
                        } else {
                            displayText += ` - Expire dans ${days} jours`;
                        }

                        // Urgence: rouge si <= 7 jours, orange si <= 30 jours
                        if (diffDays <= 7) {
                            urgencyClass = 'subscription-urgent';
                        } else if (diffDays <= 30) {
                            urgencyClass = 'subscription-warning';
                        }
                    } else {
                        displayText += ' - Expiré';
                        urgencyClass = 'subscription-expired';
                    }
                } else {
                    displayText += ' - Date non définie';
                }

                // Mise à jour du HTML
                subEl.innerHTML = `<i class="fas fa-crown"></i> ${displayText}`;

                // Appliquer les classes d'urgence
                subEl.className = 'subscription-badge';
                if (urgencyClass) {
                    subEl.classList.add(urgencyClass);
                }

                console.log('✅ Informations abonnement mises à jour');
            } catch (e) {
                console.error('❌ Erreur updateSubscriptionInfo:', e);
            }
        }
        // ===== FIN FONCTIONS AFFICHAGE DYNAMIQUE =====
EOF

echo "✅ Fonctions créées"

# 3. Insérer les fonctions AVANT console.log('✅ Profil chargé:')
echo "🔧 Insertion des fonctions..."
# Trouver le numéro de ligne
LINE_NUM=$(grep -n "console.log('✅ Profil chargé:', profile.data);" student-interface-modern.html | head -1 | cut -d: -f1)

if [ -z "$LINE_NUM" ]; then
    echo "❌ ERREUR: Ligne 'console.log Profil chargé' non trouvée"
    exit 1
fi

echo "   Ligne trouvée: $LINE_NUM"

# Insérer AVANT cette ligne
BEFORE_LINE=$((LINE_NUM - 1))
sed -i "${BEFORE_LINE}r /tmp/dynamic_display_functions.js" student-interface-modern.html

echo "✅ Fonctions insérées avant ligne $LINE_NUM"

# 4. Ajouter les appels de fonctions APRÈS console.log('✅ Profil chargé:')
echo "🔧 Ajout des appels de fonctions..."
# Créer le fichier avec les appels
cat > /tmp/function_calls.txt << 'EOF'
                        updateUserProfile(profile.data);
                        updateSubscriptionInfo(profile.data);
EOF

# Nouvelle ligne après insertion précédente
NEW_LINE_NUM=$((LINE_NUM + 86))  # 86 lignes de fonctions ajoutées
sed -i "${NEW_LINE_NUM}r /tmp/function_calls.txt" student-interface-modern.html

echo "✅ Appels de fonctions ajoutés"

# 5. Ajouter le CSS pour les classes d'urgence
echo "🎨 Ajout du CSS..."

# Trouver la ligne </style> dans le head
STYLE_LINE=$(grep -n "</style>" student-interface-modern.html | head -1 | cut -d: -f1)

if [ -z "$STYLE_LINE" ]; then
    echo "⚠️ Balise </style> non trouvée - CSS non ajouté"
else
    cat > /tmp/urgency_css.css << 'EOF'

        /* Styles pour affichage abonnement dynamique */
        .subscription-urgent {
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%) !important;
            animation: pulse 2s infinite;
        }

        .subscription-warning {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%) !important;
        }

        .subscription-expired {
            background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%) !important;
            opacity: 0.7;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
        }
EOF

    BEFORE_STYLE=$((STYLE_LINE - 1))
    sed -i "${BEFORE_STYLE}r /tmp/urgency_css.css" student-interface-modern.html
    echo "✅ CSS ajouté"
fi

# 6. Vérification
echo ""
echo "🔍 Vérification..."
if grep -q "function updateUserProfile" student-interface-modern.html && \
   grep -q "function updateSubscriptionInfo" student-interface-modern.html && \
   grep -q "updateUserProfile(profile.data)" student-interface-modern.html; then
    echo "✅ SUCCÈS: Toutes les modifications ont été appliquées correctement"
    echo ""
    echo "📊 Résumé:"
    echo "   - Fonctions ajoutées: updateUserProfile, updateSubscriptionInfo"
    echo "   - Appels de fonctions ajoutés après console.log('Profil chargé')"
    echo "   - CSS d'urgence ajouté"
    echo "   - Backup: student-interface-modern.html.backup-before-dynamic-display"
    echo ""
    echo "🌐 Tester: https://claudyne.com/student"
else
    echo "❌ ERREUR: Certaines modifications n'ont pas été appliquées"
    echo "   Restaurer le backup si nécessaire:"
    echo "   cp student-interface-modern.html.backup-before-dynamic-display student-interface-modern.html"
    exit 1
fi

# Nettoyage
rm -f /tmp/dynamic_display_functions.js /tmp/function_calls.txt /tmp/urgency_css.css

echo ""
echo "✨ Patch appliqué avec succès!"
