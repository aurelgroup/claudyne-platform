/**
 * Claudyne Parent Interface - Community Module
 * Espace communautaire parents et échange d'expériences
 */

export default class Community {
    constructor() {
        this.container = null;
        this.currentTab = 'feed';
        this.posts = [];
        this.groups = [];
    }

    async render() {
        console.log('[Community] Rendering community module...');

        this.container = document.getElementById('community');
        if (!this.container) return;

        // Load mock data
        await this.loadCommunityData();

        // Render interface
        this.container.innerHTML = this.getHTML();

        // Setup interactions
        this.setupEventListeners();

        console.log('[Community] Community module ready');
    }

    async loadCommunityData() {
        this.posts = this.getMockPosts();
        this.groups = this.getMockGroups();
    }

    getHTML() {
        return `
            <div class="community-container">
                <div class="community-header">
                    <h2>👥 Communauté des Parents</h2>
                    <p>Échangez avec d'autres parents et partagez vos expériences</p>
                </div>

                <div class="community-stats">
                    <div class="stat-card">
                        <div class="stat-number">1,247</div>
                        <div class="stat-label">Parents actifs</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">23</div>
                        <div class="stat-label">Groupes</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">156</div>
                        <div class="stat-label">Discussions</div>
                    </div>
                </div>

                <div class="community-tabs">
                    <button class="tab-btn active" data-tab="feed" onclick="community.switchTab('feed')">
                        Fil d'actualité
                    </button>
                    <button class="tab-btn" data-tab="groups" onclick="community.switchTab('groups')">
                        Groupes
                    </button>
                    <button class="tab-btn" data-tab="events" onclick="community.switchTab('events')">
                        Événements
                    </button>
                </div>

                <div class="tab-content active" id="feed-tab">
                    ${this.renderFeed()}
                </div>

                <div class="tab-content" id="groups-tab">
                    ${this.renderGroups()}
                </div>

                <div class="tab-content" id="events-tab">
                    ${this.renderEvents()}
                </div>
            </div>
        `;
    }

    renderFeed() {
        return `
            <div class="community-feed">
                <div class="create-post">
                    <textarea placeholder="Partagez votre expérience avec la communauté..." rows="3"></textarea>
                    <div class="post-actions">
                        <button class="btn-secondary">
                            <i class="fas fa-image"></i> Photo
                        </button>
                        <button class="btn-primary">Publier</button>
                    </div>
                </div>

                <div class="posts-list">
                    ${this.posts.map(post => `
                        <div class="post-item">
                            <div class="post-header">
                                <img src="${post.avatar}" alt="${post.author}" class="author-avatar">
                                <div class="post-info">
                                    <div class="author-name">${post.author}</div>
                                    <div class="post-time">${post.time}</div>
                                </div>
                            </div>
                            <div class="post-content">
                                <p>${post.content}</p>
                            </div>
                            <div class="post-actions">
                                <button class="action-btn">
                                    <i class="fas fa-heart"></i> ${post.likes}
                                </button>
                                <button class="action-btn">
                                    <i class="fas fa-comment"></i> ${post.comments}
                                </button>
                                <button class="action-btn">
                                    <i class="fas fa-share"></i> Partager
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderGroups() {
        return `
            <div class="groups-section">
                <div class="groups-header">
                    <h3>Vos groupes</h3>
                    <button class="btn-primary">Créer un groupe</button>
                </div>

                <div class="groups-grid">
                    ${this.groups.map(group => `
                        <div class="group-card">
                            <div class="group-info">
                                <h4>${group.name}</h4>
                                <p>${group.description}</p>
                                <div class="group-stats">
                                    <span>${group.members} membres</span>
                                    <span>${group.posts} publications</span>
                                </div>
                            </div>
                            <button class="btn-secondary">Rejoindre</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderEvents() {
        return `
            <div class="events-section">
                <h3>Événements à venir</h3>

                <div class="event-item">
                    <div class="event-date">
                        <div class="day">25</div>
                        <div class="month">SEP</div>
                    </div>
                    <div class="event-info">
                        <h4>Réunion parents-professeurs</h4>
                        <p>Lycée de Yaoundé - 14h00</p>
                        <div class="event-attendees">32 participants</div>
                    </div>
                    <button class="btn-primary">Participer</button>
                </div>

                <div class="event-item">
                    <div class="event-date">
                        <div class="day">30</div>
                        <div class="month">SEP</div>
                    </div>
                    <div class="event-info">
                        <h4>Atelier orientation scolaire</h4>
                        <p>En ligne - 16h00</p>
                        <div class="event-attendees">78 participants</div>
                    </div>
                    <button class="btn-primary">Participer</button>
                </div>
            </div>
        `;
    }

    getMockPosts() {
        return [
            {
                id: 'p1',
                author: 'Marie Dupont',
                avatar: 'https://i.ibb.co/b34Xp9M/user-placeholder.png',
                content: 'Excellents résultats de ma fille en mathématiques grâce aux sessions IA de Claudyne ! Merci pour cette plateforme innovante.',
                time: 'Il y a 2h',
                likes: 15,
                comments: 4
            },
            {
                id: 'p2',
                author: 'Jean Mbarga',
                avatar: 'https://i.ibb.co/b34Xp9M/user-placeholder.png',
                content: 'Quelqu\'un a-t-il des conseils pour motiver un adolescent en physique ? Mon fils a des difficultés...',
                time: 'Il y a 4h',
                likes: 8,
                comments: 12
            }
        ];
    }

    getMockGroups() {
        return [
            {
                id: 'g1',
                name: 'Parents Lycée Yaoundé',
                description: 'Échanges entre parents d\'élèves du lycée',
                members: 156,
                posts: 89
            },
            {
                id: 'g2',
                name: 'Préparation Baccalauréat',
                description: 'Conseils et soutien pour la préparation du bac',
                members: 234,
                posts: 178
            }
        ];
    }

    setupEventListeners() {
        // Tab switching handled by global click handler
    }

    switchTab(tabName) {
        this.currentTab = tabName;

        document.querySelectorAll('#community .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        document.querySelectorAll('#community .tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
    }
}

// Export global pour les interactions HTML
if (typeof window !== 'undefined') {
    window.community = new Community();
}