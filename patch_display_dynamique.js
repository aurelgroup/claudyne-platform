// ===== PATCH: AFFICHAGE DYNAMIQUE ABONNEMENT ET PROFIL =====
// À insérer dans student-interface-modern.html AVANT la ligne console.log('✅ Profil chargé:', profile.data);

// Fonction 1: Mettre à jour l'affichage du profil utilisateur
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

// Fonction 2: Mettre à jour l'affichage de l'abonnement
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
                    urgencyClass = 'subscription-urgent'; // Rouge
                } else if (diffDays <= 30) {
                    urgencyClass = 'subscription-warning'; // Orange
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

// ===== APPEL DES FONCTIONS =====
// Remplacer la ligne:
//     console.log('✅ Profil chargé:', profile.data);
//
// Par:
//     console.log('✅ Profil chargé:', profile.data);
//     updateUserProfile(profile.data);
//     updateSubscriptionInfo(profile.data);

// ===== CSS À AJOUTER (si pas déjà présent) =====
/*
.subscription-urgent {
    background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
    animation: pulse 2s infinite;
}

.subscription-warning {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.subscription-expired {
    background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
    opacity: 0.7;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
}
*/
