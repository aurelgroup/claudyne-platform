/**
 * Claudyne Parent Interface - Finance Module
 * Gestion des finances et frais scolaires
 */

export default class Finance {
    constructor() {
        this.container = null;
        this.currentTab = 'overview';
        this.transactions = [];
        this.budgets = [];
    }

    async render() {
        console.log('[Finance] Rendering finance module...');

        this.container = document.getElementById('finance');
        if (!this.container) return;

        // Load mock data
        await this.loadFinanceData();

        // Render interface
        this.container.innerHTML = this.getHTML();

        // Setup interactions
        this.setupEventListeners();

        console.log('[Finance] Finance module ready');
    }

    async loadFinanceData() {
        this.transactions = this.getMockTransactions();
        this.budgets = this.getMockBudgets();
    }

    getHTML() {
        return `
            <div class="finance-container">
                <div class="finance-header">
                    <h2>💰 Gestion Financière</h2>
                    <p>Suivi des dépenses et budget scolaire</p>
                </div>

                <div class="finance-summary">
                    <div class="budget-card">
                        <h3>Budget mensuel</h3>
                        <div class="amount">125 000 FCFA</div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 65%"></div>
                        </div>
                        <div class="usage">65% utilisé ce mois</div>
                    </div>

                    <div class="expenses-card">
                        <h3>Dépenses totales</h3>
                        <div class="amount">81 250 FCFA</div>
                        <div class="breakdown">
                            <div class="expense-item">
                                <span>Frais de scolarité</span>
                                <span>50 000 FCFA</span>
                            </div>
                            <div class="expense-item">
                                <span>Matériel scolaire</span>
                                <span>18 750 FCFA</span>
                            </div>
                            <div class="expense-item">
                                <span>Transport</span>
                                <span>12 500 FCFA</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="finance-tabs">
                    <button class="tab-btn active" data-tab="transactions" onclick="finance.switchTab('transactions')">
                        Transactions
                    </button>
                    <button class="tab-btn" data-tab="budgets" onclick="finance.switchTab('budgets')">
                        Budgets
                    </button>
                    <button class="tab-btn" data-tab="payments" onclick="finance.switchTab('payments')">
                        Paiements
                    </button>
                </div>

                <div class="tab-content active" id="transactions-tab">
                    ${this.renderTransactions()}
                </div>

                <div class="tab-content" id="budgets-tab">
                    ${this.renderBudgets()}
                </div>

                <div class="tab-content" id="payments-tab">
                    ${this.renderPayments()}
                </div>
            </div>
        `;
    }

    renderTransactions() {
        return `
            <div class="transactions-list">
                <h3>Transactions récentes</h3>
                ${this.transactions.map(transaction => `
                    <div class="transaction-item">
                        <div class="transaction-info">
                            <div class="transaction-title">${transaction.title}</div>
                            <div class="transaction-date">${transaction.date}</div>
                        </div>
                        <div class="transaction-amount ${transaction.type}">
                            ${transaction.type === 'expense' ? '-' : '+'}${transaction.amount} FCFA
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderBudgets() {
        return `
            <div class="budgets-overview">
                <h3>Budgets par catégorie</h3>
                ${this.budgets.map(budget => `
                    <div class="budget-item">
                        <div class="budget-info">
                            <div class="budget-name">${budget.category}</div>
                            <div class="budget-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${budget.used}%"></div>
                                </div>
                                <span>${budget.spent} / ${budget.total} FCFA</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderPayments() {
        return `
            <div class="payments-section">
                <h3>Paiements en attente</h3>
                <div class="payment-item pending">
                    <div class="payment-info">
                        <div class="payment-title">Frais de scolarité T2</div>
                        <div class="payment-due">Échéance: 30 septembre</div>
                    </div>
                    <div class="payment-amount">75 000 FCFA</div>
                    <button class="btn-primary">Payer</button>
                </div>
            </div>
        `;
    }

    getMockTransactions() {
        return [
            {
                id: 't1',
                title: 'Frais de scolarité',
                amount: '50 000',
                type: 'expense',
                date: '15 Sep 2025'
            },
            {
                id: 't2',
                title: 'Matériel scolaire',
                amount: '18 750',
                type: 'expense',
                date: '12 Sep 2025'
            }
        ];
    }

    getMockBudgets() {
        return [
            {
                category: 'Scolarité',
                total: '100 000',
                spent: '50 000',
                used: 50
            },
            {
                category: 'Matériel',
                total: '25 000',
                spent: '18 750',
                used: 75
            }
        ];
    }

    setupEventListeners() {
        // Tab switching handled by global click handler
    }

    switchTab(tabName) {
        this.currentTab = tabName;

        document.querySelectorAll('#finance .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        document.querySelectorAll('#finance .tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
    }
}

// Export global pour les interactions HTML
if (typeof window !== 'undefined') {
    window.finance = new Finance();
}

export default Finance;