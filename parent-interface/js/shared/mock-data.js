/**
 * Claudyne Parent Interface - Mock Data Configuration
 * Mock data extracted from original parent-interface.html
 */

export const mockData = {
    // Dashboard metrics
    dashboard: {
        metrics: {
            totalExercises: {
                value: 127,
                label: "Exercices complétés cette semaine",
                change: "+15% vs semaine dernière",
                type: "positive"
            },
            averageScore: {
                value: "89%",
                label: "Score moyen général",
                change: "+3% ce mois",
                type: "positive"
            },
            studyTime: {
                value: "24h",
                label: "Temps d'étude cette semaine",
                change: "-2h vs objectif",
                type: "negative"
            },
            achievements: {
                value: 15,
                label: "Nouveaux badges débloqués",
                change: "+8 ce mois",
                type: "positive"
            }
        },

        aiInsight: {
            type: "warning",
            title: "Insight IA - Action recommandée",
            message: "Richy montre des difficultés en géométrie (score de 65% sur les 5 derniers exercices). L'IA recommande une session de révision interactive de 30 minutes sur les théorèmes de Thalès.",
            actions: [
                { text: "Démarrer la session IA", icon: "fas fa-play", type: "primary" },
                { text: "Programmer plus tard", icon: "fas fa-calendar", type: "secondary" }
            ]
        },

        recentActivities: [
            {
                icon: "fas fa-medal",
                iconColor: "var(--secondary)",
                title: "Blandine a obtenu 95% en Français",
                meta: "Il y a 2 heures • Dissertation sur Candide"
            },
            {
                icon: "fas fa-star",
                iconColor: "var(--primary)",
                title: "Richy a complété 5 exercices de Math",
                meta: "Il y a 4 heures • Géométrie dans l'espace"
            },
            {
                icon: "fas fa-exclamation",
                iconColor: "var(--warning)",
                title: "Session de révision IA programmée",
                meta: "Demain 16h00 • Physique-Chimie pour Richy"
            },
            {
                icon: "fas fa-trophy",
                iconColor: "var(--secondary)",
                title: "Badge \"Persévérance\" débloqué",
                meta: "Hier • Blandine - 7 jours consécutifs"
            }
        ],

        subjectPerformance: {
            richy: [
                { subject: "Mathématiques", score: 65, color: "var(--warning)" },
                { subject: "Physique-Chimie", score: 78, color: "var(--secondary)" },
                { subject: "SVT", score: 85, color: "var(--secondary)" },
                { subject: "Français", score: 72, color: "var(--primary)" },
                { subject: "Histoire-Géo", score: 88, color: "var(--secondary)" }
            ],
            blandine: [
                { subject: "Français", score: 95, color: "var(--secondary)" },
                { subject: "Histoire-Géo", score: 92, color: "var(--secondary)" },
                { subject: "Anglais", score: 87, color: "var(--secondary)" },
                { subject: "SVT", score: 83, color: "var(--secondary)" },
                { subject: "Mathématiques", score: 79, color: "var(--primary)" }
            ]
        }
    },

    // Children data
    children: [
        {
            id: "richy",
            name: "Richy",
            age: 12,
            grade: "6ème",
            avatar: "/assets/images/user-placeholder.svg",
            subjects: ["Mathématiques", "Physique-Chimie", "SVT", "Français", "Histoire-Géo"],
            averageScore: 78,
            weeklyProgress: 15,
            studyStreak: 5,
            badges: ["Matheux", "Scientifique", "Curieux"],
            recentAchievements: [
                { title: "5 exercices de Math complétés", date: "Aujourd'hui" },
                { title: "Badge Persévérance", date: "Hier" }
            ],
            weeklyStats: {
                exercisesCompleted: 24,
                studyHours: 12.5,
                averageScore: 78,
                improvement: "+5%"
            },
            subjectScores: {
                "Mathématiques": 65,
                "Physique-Chimie": 78,
                "SVT": 85,
                "Français": 72,
                "Histoire-Géo": 88
            }
        },
        {
            id: "blandine",
            name: "Blandine",
            age: 14,
            grade: "4ème",
            avatar: "/assets/images/user-placeholder.svg",
            subjects: ["Français", "Histoire-Géo", "Anglais", "SVT", "Mathématiques"],
            averageScore: 87,
            weeklyProgress: 12,
            studyStreak: 8,
            badges: ["Littéraire", "Historienne", "Polyglotte"],
            recentAchievements: [
                { title: "95% en Français", date: "Il y a 2 heures" },
                { title: "Badge Persévérance", date: "Hier" }
            ],
            weeklyStats: {
                exercisesCompleted: 32,
                studyHours: 18.2,
                averageScore: 87,
                improvement: "+8%"
            },
            subjectScores: {
                "Français": 95,
                "Histoire-Géo": 92,
                "Anglais": 87,
                "SVT": 83,
                "Mathématiques": 79
            }
        }
    ],

    // Planning data
    planning: {
        todaySchedule: [
            {
                time: "14:00",
                subject: "Mathématiques",
                child: "Richy",
                type: "exercise",
                title: "Géométrie - Théorèmes de Thalès",
                duration: "45 min"
            },
            {
                time: "15:30",
                subject: "Français",
                child: "Blandine",
                type: "lesson",
                title: "Analyse littéraire - Candide",
                duration: "60 min"
            },
            {
                time: "16:45",
                subject: "Physique-Chimie",
                child: "Richy",
                type: "ai_session",
                title: "Session IA - Révision recommandée",
                duration: "30 min"
            }
        ],

        weeklyPlanning: {
            "Lundi": [
                { time: "14:00", subject: "Math", child: "Richy" },
                { time: "15:30", subject: "Français", child: "Blandine" }
            ],
            "Mardi": [
                { time: "14:00", subject: "SVT", child: "Richy" },
                { time: "16:00", subject: "Histoire", child: "Blandine" }
            ],
            "Mercredi": [
                { time: "10:00", subject: "Physique", child: "Richy" },
                { time: "14:30", subject: "Anglais", child: "Blandine" }
            ]
        }
    },

    // Messages data
    messages: {
        conversations: [
            {
                id: "conv_richy",
                name: "Richy",
                avatar: "/assets/images/user-placeholder.svg",
                lastMessage: "J'ai fini mes exercices de math !",
                timestamp: "Il y a 10 min",
                unread: 2,
                status: "online"
            },
            {
                id: "conv_blandine",
                name: "Blandine",
                avatar: "/assets/images/user-placeholder.svg",
                lastMessage: "Merci pour l'aide en français 😊",
                timestamp: "Il y a 1h",
                unread: 0,
                status: "away"
            }
        ],

        messages: {
            conv_richy: [
                {
                    id: "msg_1",
                    sender: "richy",
                    content: "Salut Papa ! Comment ça va ?",
                    timestamp: "14:30",
                    type: "received"
                },
                {
                    id: "msg_2",
                    sender: "parent",
                    content: "Salut mon grand ! Ça va très bien, et toi ?",
                    timestamp: "14:32",
                    type: "sent"
                },
                {
                    id: "msg_3",
                    sender: "richy",
                    content: "J'ai fini mes exercices de math !",
                    timestamp: "15:45",
                    type: "received"
                }
            ],
            conv_blandine: [
                {
                    id: "msg_4",
                    sender: "blandine",
                    content: "Merci pour l'aide en français 😊",
                    timestamp: "13:15",
                    type: "received"
                },
                {
                    id: "msg_5",
                    sender: "parent",
                    content: "De rien ma chérie ! Tu t'en sors très bien",
                    timestamp: "13:20",
                    type: "sent"
                }
            ]
        }
    },

    // Psychology data
    psychology: {
        emotionalState: {
            richy: {
                current: "Légèrement stressé",
                score: 7,
                trend: "stable",
                factors: ["Difficultés en mathématiques", "Fatigue scolaire"],
                recommendations: [
                    "Session de détente de 15 minutes",
                    "Pause récréative avant les devoirs",
                    "Discussion sur les mathématiques"
                ]
            },
            blandine: {
                current: "Très motivée",
                score: 9,
                trend: "positive",
                factors: ["Réussite en français", "Confiance en soi"],
                recommendations: [
                    "Maintenir le rythme actuel",
                    "Nouveaux défis stimulants",
                    "Reconnaissance des efforts"
                ]
            }
        },

        weeklyAnalysis: [
            {
                day: "Lundi",
                richy: { mood: 8, energy: 7, focus: 6 },
                blandine: { mood: 9, energy: 8, focus: 9 }
            },
            {
                day: "Mardi",
                richy: { mood: 6, energy: 6, focus: 5 },
                blandine: { mood: 8, energy: 9, focus: 8 }
            },
            {
                day: "Mercredi",
                richy: { mood: 7, energy: 8, focus: 7 },
                blandine: { mood: 9, energy: 8, focus: 9 }
            }
        ]
    },

    // Reports data
    reports: {
        weeklyReport: {
            period: "Semaine du 11-17 Mars 2024",
            summary: {
                totalStudyTime: "42h 30min",
                exercisesCompleted: 89,
                averageScore: 83,
                improvement: "+12%"
            },
            children: [
                {
                    name: "Richy",
                    studyTime: "18h 15min",
                    exercises: 35,
                    averageScore: 78,
                    strengths: ["SVT", "Histoire-Géo"],
                    improvements: ["Mathématiques"]
                },
                {
                    name: "Blandine",
                    studyTime: "24h 15min",
                    exercises: 54,
                    averageScore: 87,
                    strengths: ["Français", "Histoire-Géo"],
                    improvements: ["Mathématiques"]
                }
            ]
        }
    },

    // Finance data
    finance: {
        currentPlan: "Premium Family",
        monthlyFee: "89€",
        nextBilling: "15 Avril 2024",
        features: [
            "Accès illimité pour 2 enfants",
            "IA personnalisée avancée",
            "Copilote émotionnel",
            "Rapports détaillés",
            "Support prioritaire"
        ],
        usage: {
            aiSessions: 47,
            maxAiSessions: 100,
            reports: 12,
            maxReports: "Illimité"
        }
    },

    // Community data
    community: {
        forums: [
            {
                title: "Aide aux devoirs - Mathématiques",
                category: "Matières",
                posts: 342,
                lastActivity: "Il y a 15 min"
            },
            {
                title: "Motivation et organisation",
                category: "Psychologie",
                posts: 189,
                lastActivity: "Il y a 2h"
            },
            {
                title: "Retours d'expérience Claudyne",
                category: "Général",
                posts: 456,
                lastActivity: "Il y a 30 min"
            }
        ],

        recentPosts: [
            {
                author: "MarieP_Parent",
                avatar: "/assets/images/user-placeholder.svg",
                title: "Comment motiver mon fils en mathématiques ?",
                excerpt: "Mon fils de 12 ans a des difficultés en math et perd confiance...",
                replies: 8,
                timestamp: "Il y a 2h"
            },
            {
                author: "Papa_Digital",
                avatar: "/assets/images/user-placeholder.svg",
                title: "Excellent résultats avec l'IA de Claudyne !",
                excerpt: "Ma fille a progressé de 15% en français grâce aux sessions personnalisées...",
                replies: 12,
                timestamp: "Il y a 4h"
            }
        ]
    },

    // Settings data
    settings: {
        profile: {
            name: "Jean Dupont",
            email: "jean.dupont@email.com",
            phone: "+237 6XX XXX XXX",
            address: "Douala, Cameroun",
            avatar: "/assets/images/user-placeholder.svg"
        },

        preferences: {
            notifications: {
                email: true,
                sms: false,
                push: true,
                weeklyReport: true,
                aiInsights: true
            },

            privacy: {
                dataSharing: false,
                analytics: true,
                childDataRetention: "2 ans"
            },

            language: "fr",
            timezone: "Africa/Douala",
            theme: "light"
        },

        children: [
            {
                name: "Richy",
                screenTime: "2h/jour",
                subjects: ["Math", "Sciences", "Français"],
                restrictions: ["Pas d'écran après 20h"]
            },
            {
                name: "Blandine",
                screenTime: "2h30/jour",
                subjects: ["Français", "Histoire", "Langues"],
                restrictions: ["Pause obligatoire toutes les heures"]
            }
        ]
    }
};

// Helper function to get mock data with fallback
export function getMockData(path, fallback = null) {
    const keys = path.split('.');
    let current = mockData;

    for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
            current = current[key];
        } else {
            return fallback;
        }
    }

    return current;
}

// Helper function to simulate API delay
export function mockApiCall(data, delay = 500) {
    return new Promise(resolve => {
        setTimeout(() => resolve(data), delay);
    });
}

export default mockData;