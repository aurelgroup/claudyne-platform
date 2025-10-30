        async function openRenewalModal() {
            const API_BASE = 'https://claudyne.com';

            try {
                showToast('👑 Ouverture du panneau de renouvellement Premium...', 'info');

                const token = localStorage.getItem('claudyne_token');
                if (!token) {
                    showToast('⚠️ Veuillez vous connecter', 'warning');
                    return;
                }

                // Récupérer les infos utilisateur
                const userStr = localStorage.getItem('claudyne_user');
                let currentPlan = 'INDIVIDUAL_STUDENT';
                let userPhone = null;

                if (userStr) {
                    try {
                        const user = JSON.parse(userStr);
                        currentPlan = user.subscriptionPlan || 'INDIVIDUAL_STUDENT';
                        userPhone = user.phone || user.phoneNumber || user.telephone || null;
                    } catch (e) {
                        console.error('Erreur parsing user:', e);
                    }
                }

                // Demander le numéro de téléphone si non disponible
                if (!userPhone) {
                    userPhone = prompt('📱 Entrez votre numéro de téléphone mobile money (ex: +237690000000 ou 237690000000):');

                    if (!userPhone) {
                        showToast('⚠️ Numéro de téléphone requis pour le paiement mobile', 'warning');
                        return;
                    }

                    // Nettoyer le numéro
                    userPhone = userPhone.replace(/\s+/g, '').replace(/\+/g, '');

                    // Ajouter l'indicatif pays si manquant
                    if (!userPhone.startsWith('237')) {
                        userPhone = '237' + userPhone;
                    }
                }

                // Récupérer les plans d'abonnement depuis l'API
                console.log('📥 Récupération des plans d\'abonnement...');
                const plansResponse = await fetch(`${API_BASE}/api/payments/subscriptions/plans`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                let planAmount = 8000; // Fallback par défaut
                let planCurrency = 'XAF';

                if (plansResponse.ok) {
                    const plansData = await plansResponse.json();
                    console.log('✅ Plans récupérés:', plansData);

                    // Chercher le plan actuel dans les données de l'API
                    if (plansData.success && plansData.data && Array.isArray(plansData.data.plans)) {
                        const plans = plansData.data.plans;
                        const currentPlanData = plans.find(p =>
                            p.name.toLowerCase() === currentPlan.toLowerCase() ||
                            p.id === currentPlan
                        );

                        if (currentPlanData) {
                            planAmount = currentPlanData.monthlyPrice || currentPlanData.price || planAmount;
                            planCurrency = currentPlanData.currency || planCurrency;
                            console.log(`💰 Tarif trouvé pour ${currentPlan}: ${planAmount} ${planCurrency}`);
                        } else {
                            console.warn(`⚠️ Plan ${currentPlan} non trouvé, utilisation fallback`);
                        }
                    }
                } else {
                    console.warn('⚠️ Impossible de récupérer les plans, utilisation fallback');
                }

                // Préparer les données de renouvellement avec TOUS les paramètres requis
                const renewalData = {
                    // Paramètres obligatoires API
                    amount: planAmount,
                    paymentMethod: 'mtn_momo',
                    type: 'subscription',
                    currency: planCurrency,
                    phone: userPhone,

                    // Paramètres spécifiques renouvellement
                    subscriptionPlan: currentPlan,
                    isRenewal: true,
                    sendEmail: true,
                    sendSMS: true,
                    returnUrl: window.location.origin + '/student',
                    cancelUrl: window.location.origin + '/student'
                };

                console.log('📤 Envoi demande de renouvellement:', renewalData);

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

                    gainXP(10, 'Renouvellement Premium');

                    if (result.emailSent) {
                        showToast('📧 Email de renouvellement envoyé !', 'success');
                    }

                    if (result.smsSent) {
                        showToast('📱 SMS de renouvellement envoyé !', 'success');
                    }

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
                        showToast('✅ Demande de renouvellement traitée avec succès !', 'success');
                    }, 3000);

                } else {
                    let errorMsg = 'Erreur lors du renouvellement';

                    try {
                        const errorData = await response.json();
                        errorMsg = errorData.message || errorData.error || errorMsg;
                        console.error('❌ Détails erreur API:', errorData);
                    } catch (e) {
                        errorMsg = `Erreur ${response.status}: ${response.statusText}`;
                    }

                    console.error('❌ Erreur API renouvellement:', errorMsg);
                    showToast(`❌ ${errorMsg}`, 'error');

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
