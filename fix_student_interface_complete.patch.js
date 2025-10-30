/**
 * PATCH COMPLET POUR L'INTERFACE STUDENT
 * Corrections:
 * 1. Modal de paiement direct (sans liens SMS/Email)
 * 2. Suppression des données mockées
 * 3. Fix des erreurs API
 */

// ============ PARTIE 1: NOUVEAU MODAL DE PAIEMENT HTML ============
const paymentModalHTML = `
    <!-- Modal de Paiement/Renouvellement -->
    <div class="modal-overlay" id="paymentModal">
        <div class="modal-container" style="max-width: 900px;">
            <div class="modal-header">
                <h3><i class="fas fa-credit-card"></i> Renouveler mon abonnement</h3>
                <button class="modal-close" onclick="closePaymentModal()">×</button>
            </div>
            <div class="modal-content">

                <!-- Étape 1: Sélection du plan -->
                <div id="step-plan" class="payment-step active">
                    <h4>Choisissez votre formule</h4>
                    <div class="plans-grid" id="plansGrid">
                        <!-- Les plans seront chargés dynamiquement -->
                    </div>
                </div>

                <!-- Étape 2: Sélection du moyen de paiement -->
                <div id="step-payment-method" class="payment-step" style="display:none;">
                    <h4>Choisissez votre moyen de paiement</h4>
                    <div class="payment-methods-grid" id="paymentMethodsGrid">
                        <!-- Les moyens de paiement seront chargés dynamiquement -->
                    </div>
                </div>

                <!-- Étape 3: Informations de paiement -->
                <div id="step-payment-info" class="payment-step" style="display:none;">
                    <h4>Finaliser le paiement</h4>
                    <form id="paymentForm" onsubmit="processPayment(event)">
                        <div class="payment-summary">
                            <div class="summary-item">
                                <span>Formule:</span>
                                <strong id="selectedPlanName">-</strong>
                            </div>
                            <div class="summary-item">
                                <span>Moyen de paiement:</span>
                                <strong id="selectedMethodName">-</strong>
                            </div>
                            <div class="summary-item">
                                <span>Montant:</span>
                                <strong id="selectedAmount">-</strong>
                            </div>
                        </div>

                        <div id="phoneNumberField" class="form-group" style="display:none;">
                            <label for="paymentPhone">Numéro de téléphone Mobile Money</label>
                            <input type="tel" id="paymentPhone" class="form-input"
                                   placeholder="+237690123456" pattern="^\+?237[0-9]{9}$">
                            <small>Format: +237690123456 ou 237690123456</small>
                        </div>

                        <div id="cardFields" class="form-group" style="display:none;">
                            <label>Informations de carte</label>
                            <input type="text" id="cardNumber" class="form-input"
                                   placeholder="Numéro de carte" maxlength="19">
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-top:1rem;">
                                <input type="text" id="cardExpiry" class="form-input"
                                       placeholder="MM/AA" maxlength="5">
                                <input type="text" id="cardCVV" class="form-input"
                                       placeholder="CVV" maxlength="4">
                            </div>
                        </div>

                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" onclick="previousPaymentStep()">
                                <i class="fas fa-arrow-left"></i> Retour
                            </button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-check"></i> Confirmer le paiement
                            </button>
                        </div>
                    </form>
                </div>

                <!-- Indicateur de progression -->
                <div class="payment-progress">
                    <div class="progress-step active" data-step="1">
                        <div class="step-circle">1</div>
                        <div class="step-label">Formule</div>
                    </div>
                    <div class="progress-line"></div>
                    <div class="progress-step" data-step="2">
                        <div class="step-circle">2</div>
                        <div class="step-label">Paiement</div>
                    </div>
                    <div class="progress-line"></div>
                    <div class="progress-step" data-step="3">
                        <div class="step-circle">3</div>
                        <div class="step-label">Confirmation</div>
                    </div>
                </div>

            </div>
        </div>
    </div>
`;

// ============ PARTIE 2: STYLES CSS POUR LE MODAL ============
const paymentModalCSS = `
    <style>
        /* Plans Grid */
        .plans-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-top: 1.5rem;
        }

        .plan-card {
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1));
            border: 2px solid rgba(139, 92, 246, 0.3);
            border-radius: 12px;
            padding: 1.5rem;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
        }

        .plan-card:hover {
            transform: translateY(-5px);
            border-color: rgba(139, 92, 246, 0.6);
            box-shadow: 0 10px 30px rgba(139, 92, 246, 0.3);
        }

        .plan-card.selected {
            border-color: #8B5CF6;
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2));
        }

        .plan-card.popular::before {
            content: "⭐ Populaire";
            position: absolute;
            top: -10px;
            right: 10px;
            background: #FFCC02;
            color: #000;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: bold;
        }

        .plan-name {
            font-size: 1.3rem;
            font-weight: bold;
            color: #fff;
            margin-bottom: 0.5rem;
        }

        .plan-price {
            font-size: 2rem;
            font-weight: bold;
            color: #8B5CF6;
            margin: 0.5rem 0;
        }

        .plan-price-currency {
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.7);
        }

        .plan-duration {
            color: rgba(255, 255, 255, 0.6);
            font-size: 0.9rem;
            margin-bottom: 1rem;
        }

        .plan-features {
            list-style: none;
            padding: 0;
            margin: 1rem 0;
        }

        .plan-features li {
            padding: 0.4rem 0;
            color: rgba(255, 255, 255, 0.8);
            font-size: 0.9rem;
        }

        .plan-features li::before {
            content: "✓ ";
            color: #10B981;
            font-weight: bold;
            margin-right: 0.5rem;
        }

        /* Payment Methods Grid */
        .payment-methods-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-top: 1.5rem;
        }

        .payment-method-card {
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 1.5rem;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: center;
        }

        .payment-method-card:hover {
            transform: translateY(-3px);
            border-color: rgba(139, 92, 246, 0.5);
            box-shadow: 0 8px 20px rgba(139, 92, 246, 0.2);
        }

        .payment-method-card.selected {
            border-color: #8B5CF6;
            background: rgba(139, 92, 246, 0.1);
        }

        .payment-method-icon {
            font-size: 3rem;
            margin-bottom: 0.5rem;
        }

        .payment-method-name {
            font-size: 1.1rem;
            font-weight: bold;
            color: #fff;
            margin-bottom: 0.5rem;
        }

        .payment-method-desc {
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.6);
            margin-bottom: 0.5rem;
        }

        .payment-method-fees {
            font-size: 0.8rem;
            color: #FFCC02;
        }

        /* Payment Summary */
        .payment-summary {
            background: rgba(139, 92, 246, 0.1);
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
        }

        .summary-item {
            display: flex;
            justify-content: space-between;
            padding: 0.5rem 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .summary-item:last-child {
            border-bottom: none;
            font-size: 1.2rem;
            margin-top: 0.5rem;
        }

        /* Payment Progress */
        .payment-progress {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: 2rem;
            padding-top: 2rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .progress-step {
            display: flex;
            flex-direction: column;
            align-items: center;
            opacity: 0.4;
            transition: all 0.3s ease;
        }

        .progress-step.active {
            opacity: 1;
        }

        .step-circle {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid rgba(255, 255, 255, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-bottom: 0.5rem;
        }

        .progress-step.active .step-circle {
            background: #8B5CF6;
            border-color: #8B5CF6;
            color: #fff;
        }

        .step-label {
            font-size: 0.85rem;
            color: rgba(255, 255, 255, 0.6);
        }

        .progress-step.active .step-label {
            color: #fff;
        }

        .progress-line {
            width: 60px;
            height: 2px;
            background: rgba(255, 255, 255, 0.2);
            margin: 0 0.5rem 1.5rem;
        }

        /* Form Inputs */
        .form-group {
            margin-bottom: 1.5rem;
        }

        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            color: #fff;
            font-weight: 500;
        }

        .form-input {
            width: 100%;
            padding: 0.75rem;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            color: #fff;
            font-size: 1rem;
        }

        .form-input:focus {
            outline: none;
            border-color: #8B5CF6;
            background: rgba(139, 92, 246, 0.1);
        }

        .form-group small {
            display: block;
            margin-top: 0.5rem;
            color: rgba(255, 255, 255, 0.5);
            font-size: 0.85rem;
        }
    </style>
`;

// ============ PARTIE 3: NOUVEAU JAVASCRIPT POUR LE FLUX DE PAIEMENT ============
const paymentModalJS = `
    <script>
        // Variables globales pour le paiement
        let availablePlans = [];
        let availablePaymentMethods = [];
        let selectedPlan = null;
        let selectedPaymentMethod = null;
        let currentPaymentStep = 1;

        // ========== OUVRIR LE MODAL DE PAIEMENT ==========
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
                    fetch(\`\${API_BASE}/api/payments/subscriptions/plans\`, {
                        headers: { 'Authorization': \`Bearer \${token}\` }
                    }),
                    fetch(\`\${API_BASE}/api/payments/methods\`, {
                        headers: { 'Authorization': \`Bearer \${token}\` }
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
                        }
                    }
                } else {
                    throw new Error('Erreur lors du chargement des options');
                }

            } catch (error) {
                console.error('Erreur ouverture modal paiement:', error);
                showToast('❌ Erreur lors du chargement', 'error');
            }
        }

        // ========== FERMER LE MODAL ==========
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
            document.getElementById('step-plan').style.display = 'block';
            document.getElementById('step-plan').classList.add('active');
            updatePaymentProgress();
        }

        // ========== AFFICHER LES PLANS ==========
        function renderPlans() {
            const grid = document.getElementById('plansGrid');
            if (!grid) return;

            grid.innerHTML = availablePlans.map(plan => \`
                <div class="plan-card \${plan.popular ? 'popular' : ''}" onclick="selectPlan('\${plan.id}')">
                    <div class="plan-name">\${plan.name}</div>
                    <div class="plan-price">
                        \${plan.price.toLocaleString()}
                        <span class="plan-price-currency">\${plan.currency}</span>
                    </div>
                    <div class="plan-duration">\${getDurationLabel(plan.duration)}</div>
                    <div class="plan-description">\${plan.description}</div>
                    <ul class="plan-features">
                        \${plan.features.slice(0, 5).map(f => \`<li>\${f}</li>\`).join('')}
                    </ul>
                </div>
            \`).join('');
        }

        function getDurationLabel(duration) {
            const labels = {
                'monthly': 'Par mois',
                'yearly': 'Par an',
                'trial': '7 jours gratuits'
            };
            return labels[duration] || duration;
        }

        // ========== SÉLECTIONNER UN PLAN ==========
        function selectPlan(planId) {
            selectedPlan = availablePlans.find(p => p.id === planId);
            if (!selectedPlan) return;

            // Mettre à jour l'UI
            document.querySelectorAll('.plan-card').forEach(card => {
                card.classList.remove('selected');
            });
            event.currentTarget.classList.add('selected');

            // Passer à l'étape suivante
            setTimeout(() => {
                nextPaymentStep();
                renderPaymentMethods();
            }, 500);
        }

        // ========== AFFICHER LES MOYENS DE PAIEMENT ==========
        function renderPaymentMethods() {
            const grid = document.getElementById('paymentMethodsGrid');
            if (!grid) return;

            // Filtrer les méthodes disponibles
            const methods = availablePaymentMethods.filter(m => m.available);

            grid.innerHTML = methods.map(method => \`
                <div class="payment-method-card" onclick="selectPaymentMethod('\${method.id}')">
                    <div class="payment-method-icon">\${method.icon}</div>
                    <div class="payment-method-name">\${method.name}</div>
                    <div class="payment-method-desc">\${method.description}</div>
                    <div class="payment-method-fees">Frais: \${method.fees}</div>
                </div>
            \`).join('');
        }

        // ========== SÉLECTIONNER UN MOYEN DE PAIEMENT ==========
        function selectPaymentMethod(methodId) {
            selectedPaymentMethod = availablePaymentMethods.find(m => m.id === methodId);
            if (!selectedPaymentMethod) return;

            // Mettre à jour l'UI
            document.querySelectorAll('.payment-method-card').forEach(card => {
                card.classList.remove('selected');
            });
            event.currentTarget.classList.add('selected');

            // Passer à l'étape suivante
            setTimeout(() => {
                nextPaymentStep();
                updatePaymentSummary();
                showPaymentFields();
            }, 500);
        }

        // ========== METTRE À JOUR LE RÉSUMÉ ==========
        function updatePaymentSummary() {
            document.getElementById('selectedPlanName').textContent = selectedPlan.name;
            document.getElementById('selectedMethodName').textContent = selectedPaymentMethod.name;
            document.getElementById('selectedAmount').textContent =
                \`\${selectedPlan.price.toLocaleString()} \${selectedPlan.currency}\`;
        }

        // ========== AFFICHER LES CHAMPS DE PAIEMENT ==========
        function showPaymentFields() {
            // Masquer tous les champs
            document.getElementById('phoneNumberField').style.display = 'none';
            document.getElementById('cardFields').style.display = 'none';

            // Afficher les champs nécessaires
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

        // ========== TRAITER LE PAIEMENT ==========
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
                    description: \`Abonnement \${selectedPlan.name}\`
                };

                // Ajouter les données spécifiques au moyen de paiement
                if (['mtn_momo', 'orange_money'].includes(selectedPaymentMethod.id)) {
                    let phone = document.getElementById('paymentPhone').value.trim();
                    // Formater le numéro
                    phone = phone.replace(/\\s+/g, '');
                    if (!phone.startsWith('+')) {
                        phone = '+' + phone;
                    }
                    if (!phone.startsWith('+237')) {
                        phone = '+237' + phone.replace(/^\\+?/, '');
                    }
                    paymentData.phone = phone;
                    paymentData.email = currentUser?.email || '';
                } else if (selectedPaymentMethod.id === 'card') {
                    paymentData.cardNumber = document.getElementById('cardNumber').value;
                    paymentData.cardExpiry = document.getElementById('cardExpiry').value;
                    paymentData.cardCVV = document.getElementById('cardCVV').value;
                }

                console.log('📤 Envoi paiement:', paymentData);

                const response = await fetch(\`\${API_BASE}/api/payments/initialize\`, {
                    method: 'POST',
                    headers: {
                        'Authorization': \`Bearer \${token}\`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(paymentData)
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('✅ Paiement initialisé:', result);

                    if (result.success) {
                        showToast('✅ Paiement initialisé avec succès !', 'success');
                        showToast(\`💬 \${result.data.message}\`, 'info');

                        // Fermer le modal
                        closePaymentModal();

                        // Afficher les instructions selon le moyen de paiement
                        if (selectedPaymentMethod.id === 'mtn_momo') {
                            setTimeout(() => {
                                showToast('📱 Composez *126# pour confirmer le paiement', 'info');
                            }, 2000);
                        } else if (selectedPaymentMethod.id === 'orange_money') {
                            setTimeout(() => {
                                showToast('📱 Vérifiez vos SMS pour confirmer le paiement', 'info');
                            }, 2000);
                        }

                        // Recharger les données après 5 secondes
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
                showToast(\`❌ \${error.message}\`, 'error');
            }
        }

        // ========== NAVIGATION ENTRE LES ÉTAPES ==========
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
                document.getElementById(currentStepId).style.display = 'block';
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

        // ========== CLIC EN DEHORS DU MODAL ==========
        document.addEventListener('click', function(e) {
            const modal = document.getElementById('paymentModal');
            if (modal && e.target === modal) {
                closePaymentModal();
            }
        });
    </script>
`;

console.log('✅ Patch complet préparé');
console.log('Ce patch contient:');
console.log('- HTML du modal de paiement');
console.log('- CSS pour le style');
console.log('- JavaScript pour la logique de paiement');
