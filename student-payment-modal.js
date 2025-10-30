/**
 * Module de gestion du modal de paiement pour l'interface student
 * À inclure dans student-interface-modern.html
 */

// Variables globales pour le paiement
let availablePlans = [];
let availablePaymentMethods = [];
let selectedPlan = null;
let selectedPaymentMethod = null;
let currentPaymentStep = 1;

// ============ OUVRIR LE MODAL DE PAIEMENT ============
async function openRenewalModal() {
    const API_BASE = 'https://claudyne.com';
    const token = localStorage.getItem('claudyne_token');

    if (!token) {
        showToast('⚠️ Veuillez vous connecter', 'warning');
        return;
    }

    try {
        showToast('🔄 Chargement des options de paiement...', 'info');

        // Charger les plans et moyens de paiement
        const [plansResponse, methodsResponse] = await Promise.all([
            fetch(`${API_BASE}/api/payments/subscriptions/plans`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            }),
            fetch(`${API_BASE}/api/payments/methods`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            })
        ]);

        if (plansResponse.ok && methodsResponse.ok) {
            const plansData = await plansResponse.json();
            const methodsData = await methodsResponse.json();

            if (plansData.success && methodsData.success) {
                availablePlans = plansData.data.plans || [];
                availablePaymentMethods = methodsData.data.methods || [];

                // Afficher le modal
                const modal = document.getElementById('paymentModal');
                if (modal) {
                    modal.classList.add('active');
                    renderPlans();
                    currentPaymentStep = 1;
                    updatePaymentProgress();
                } else {
                    console.error('❌ Modal de paiement non trouvé dans le DOM');
                    showToast('❌ Erreur d\'affichage du modal', 'error');
                }
            } else {
                throw new Error('Données invalides reçues de l\'API');
            }
        } else {
            throw new Error(`Erreur API: Plans=${plansResponse.status}, Methods=${methodsResponse.status}`);
        }

    } catch (error) {
        console.error('❌ Erreur ouverture modal paiement:', error);
        showToast(`❌ ${error.message}`, 'error');
    }
}

function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) {
        modal.classList.remove('active');
        resetPaymentModal();
    }
}

function resetPaymentModal() {
    selectedPlan = null;
    selectedPaymentMethod = null;
    currentPaymentStep = 1;
    document.querySelectorAll('.payment-step').forEach(step => step.style.display = 'none');
    const stepPlan = document.getElementById('step-plan');
    if (stepPlan) {
        stepPlan.style.display = 'block';
        stepPlan.classList.add('active');
    }
    updatePaymentProgress();
}

function renderPlans() {
    const grid = document.getElementById('plansGrid');
    if (!grid) {
        console.error('❌ Grid de plans non trouvé');
        return;
    }

    grid.innerHTML = availablePlans.map(plan => `
        <div class="plan-card ${plan.popular ? 'popular' : ''}" data-plan-id="${plan.id}" onclick="selectPlan('${plan.id}')">
            <div class="plan-name">${plan.name}</div>
            <div class="plan-price">
                ${plan.price.toLocaleString()}
                <span class="plan-price-currency">${plan.currency}</span>
            </div>
            <div class="plan-duration">${getDurationLabel(plan.duration)}</div>
            <div class="plan-description">${plan.description}</div>
            <ul class="plan-features">
                ${plan.features.slice(0, 5).map(f => `<li>${f}</li>`).join('')}
            </ul>
        </div>
    `).join('');
}

function getDurationLabel(duration) {
    const labels = {
        'monthly': 'Par mois',
        'yearly': 'Par an',
        'trial': '7 jours gratuits'
    };
    return labels[duration] || duration;
}

function selectPlan(planId) {
    selectedPlan = availablePlans.find(p => p.id === planId);
    if (!selectedPlan) {
        console.error('❌ Plan non trouvé:', planId);
        return;
    }

    // Mettre à jour l'UI
    document.querySelectorAll('.plan-card').forEach(card => {
        card.classList.remove('selected');
    });
    const selectedCard = document.querySelector(`[data-plan-id="${planId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }

    // Passer à l'étape suivante
    setTimeout(() => {
        nextPaymentStep();
        renderPaymentMethods();
    }, 500);
}

function renderPaymentMethods() {
    const grid = document.getElementById('paymentMethodsGrid');
    if (!grid) {
        console.error('❌ Grid de moyens de paiement non trouvé');
        return;
    }

    const methods = availablePaymentMethods.filter(m => m.available);

    grid.innerHTML = methods.map(method => `
        <div class="payment-method-card" data-method-id="${method.id}" onclick="selectPaymentMethod('${method.id}')">
            <div class="payment-method-icon">${method.icon}</div>
            <div class="payment-method-name">${method.name}</div>
            <div class="payment-method-desc">${method.description}</div>
            <div class="payment-method-fees">Frais: ${method.fees}</div>
        </div>
    `).join('');
}

function selectPaymentMethod(methodId) {
    selectedPaymentMethod = availablePaymentMethods.find(m => m.id === methodId);
    if (!selectedPaymentMethod) {
        console.error('❌ Moyen de paiement non trouvé:', methodId);
        return;
    }

    // Mettre à jour l'UI
    document.querySelectorAll('.payment-method-card').forEach(card => {
        card.classList.remove('selected');
    });
    const selectedCard = document.querySelector(`[data-method-id="${methodId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }

    // Passer à l'étape suivante
    setTimeout(() => {
        nextPaymentStep();
        updatePaymentSummary();
        showPaymentFields();
    }, 500);
}

function updatePaymentSummary() {
    document.getElementById('selectedPlanName').textContent = selectedPlan.name;
    document.getElementById('selectedMethodName').textContent = selectedPaymentMethod.name;
    document.getElementById('selectedAmount').textContent = `${selectedPlan.price.toLocaleString()} ${selectedPlan.currency}`;
}

function showPaymentFields() {
    document.getElementById('phoneNumberField').style.display = 'none';
    document.getElementById('cardFields').style.display = 'none';

    if (['mtn_momo', 'orange_money'].includes(selectedPaymentMethod.id)) {
        document.getElementById('phoneNumberField').style.display = 'block';
        document.getElementById('paymentPhone').required = true;
    } else if (selectedPaymentMethod.id === 'card') {
        document.getElementById('cardFields').style.display = 'block';
        document.getElementById('cardNumber').required = true;
        document.getElementById('cardExpiry').required = true;
        document.getElementById('cardCVV').required = true;
    }
}

async function processPayment(event) {
    event.preventDefault();

    const API_BASE = 'https://claudyne.com';
    const token = localStorage.getItem('claudyne_token');

    if (!token) {
        showToast('⚠️ Session expirée', 'warning');
        return;
    }

    try {
        showToast('💳 Traitement du paiement...', 'info');

        const paymentData = {
            amount: selectedPlan.price,
            paymentMethod: selectedPaymentMethod.id,
            type: 'subscription',
            planId: selectedPlan.id,
            currency: selectedPlan.currency,
            description: `Abonnement ${selectedPlan.name}`
        };

        if (['mtn_momo', 'orange_money'].includes(selectedPaymentMethod.id)) {
            let phone = document.getElementById('paymentPhone').value.trim();
            phone = phone.replace(/\s+/g, '');
            if (!phone.startsWith('+')) {
                phone = '+' + phone;
            }
            if (!phone.startsWith('+237')) {
                phone = '+237' + phone.replace(/^\+?/, '');
            }
            paymentData.phone = phone;
            paymentData.email = currentUser?.email || '';
        } else if (selectedPaymentMethod.id === 'card') {
            paymentData.cardNumber = document.getElementById('cardNumber').value;
            paymentData.cardExpiry = document.getElementById('cardExpiry').value;
            paymentData.cardCVV = document.getElementById('cardCVV').value;
        }

        console.log('📤 Envoi paiement:', paymentData);

        const response = await fetch(`${API_BASE}/api/payments/initialize`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentData)
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Paiement initialisé:', result);

            if (result.success) {
                showToast('✅ Paiement initialisé avec succès !', 'success');
                showToast(`💬 ${result.data.message}`, 'info');

                closePaymentModal();

                if (selectedPaymentMethod.id === 'mtn_momo') {
                    setTimeout(() => {
                        showToast('📱 Composez *126# pour confirmer le paiement', 'info');
                    }, 2000);
                } else if (selectedPaymentMethod.id === 'orange_money') {
                    setTimeout(() => {
                        showToast('📱 Vérifiez vos SMS pour confirmer le paiement', 'info');
                    }, 2000);
                }

                setTimeout(() => {
                    loadRealUserData();
                }, 5000);
            } else {
                throw new Error(result.message || 'Erreur lors du paiement');
            }
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erreur serveur');
        }

    } catch (error) {
        console.error('❌ Erreur paiement:', error);
        showToast(`❌ ${error.message}`, 'error');
    }
}

function nextPaymentStep() {
    if (currentPaymentStep < 3) {
        currentPaymentStep++;
        updatePaymentSteps();
        updatePaymentProgress();
    }
}

function previousPaymentStep() {
    if (currentPaymentStep > 1) {
        currentPaymentStep--;
        updatePaymentSteps();
        updatePaymentProgress();
    }
}

function updatePaymentSteps() {
    document.querySelectorAll('.payment-step').forEach(step => {
        step.style.display = 'none';
    });

    const steps = {
        1: 'step-plan',
        2: 'step-payment-method',
        3: 'step-payment-info'
    };

    const currentStepId = steps[currentPaymentStep];
    if (currentStepId) {
        const stepElement = document.getElementById(currentStepId);
        if (stepElement) {
            stepElement.style.display = 'block';
        }
    }
}

function updatePaymentProgress() {
    document.querySelectorAll('.progress-step').forEach((step, index) => {
        if (index + 1 <= currentPaymentStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}
