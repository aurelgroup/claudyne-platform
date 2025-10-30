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
            type: "info",
            title: "Insight IA - Action recommandée",
            message: "L'IA analyse les performances de vos enfants pour vous proposer des sessions de révision personnalisées.",
            actions: [
                { text: "Voir les recommandations", icon: "fas fa-lightbulb", type: "primary" },
                { text: "Plus tard", icon: "fas fa-calendar", type: "secondary" }
            ]
        },

        recentActivities: [],

        subjectPerformance: {}
    },

    // Children data - Dynamic generation based on family context
    // Will be populated from family API or use template
    children: [],

    // Planning data
    planning: {
        todaySchedule: [],
        weeklyPlanning: {}
    },

    // Messages data
    messages: {
        conversations: [],
        messages: {}
    },

    // Psychology data
    psychology: {
        emotionalState: {},
        weeklyAnalysis: []
    },

    // Reports data
    reports: {
        weeklyReport: {
            period: "Semaine en cours",
            summary: {
                totalStudyTime: "0h",
                exercisesCompleted: 0,
                averageScore: 0,
                improvement: "0%"
            },
            children: []
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

        children: []
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

// Helper function to generate mock child data dynamically
export function generateMockChildData(child) {
    const subjects = ["Mathématiques", "Français", "Histoire-Géo", "SVT", "Physique-Chimie", "Anglais"];
    const randomScore = () => Math.floor(Math.random() * 30) + 65; // 65-95

    const subjectScores = {};
    subjects.forEach(subject => {
        subjectScores[subject] = randomScore();
    });

    const avgScore = Math.floor(Object.values(subjectScores).reduce((a, b) => a + b, 0) / subjects.length);

    return {
        id: child.id || child.student_id,
        name: child.name || child.first_name,
        age: child.age || 12,
        grade: child.grade || child.class_level || "Collège",
        avatar: child.avatar || child.profile_picture || "/assets/images/user-placeholder.svg",
        subjects: child.subjects || subjects,
        averageScore: child.average_score || avgScore,
        weeklyProgress: child.weekly_progress || Math.floor(Math.random() * 20),
        studyStreak: child.study_streak || Math.floor(Math.random() * 10),
        badges: child.badges || [],
        recentAchievements: child.recent_achievements || [],
        weeklyStats: {
            exercisesCompleted: child.exercises_completed || Math.floor(Math.random() * 40),
            studyHours: child.study_hours || (Math.random() * 20).toFixed(1),
            averageScore: avgScore,
            improvement: `+${Math.floor(Math.random() * 15)}%`
        },
        subjectScores
    };
}

// Helper function to populate mock data with family context
export function populateMockDataWithFamily(familyData) {
    if (familyData && familyData.children && familyData.children.length > 0) {
        mockData.children = familyData.children.map(child => generateMockChildData(child));

        // Generate subject performance for each child
        mockData.dashboard.subjectPerformance = {};
        mockData.children.forEach(child => {
            mockData.dashboard.subjectPerformance[child.id] = Object.entries(child.subjectScores).map(([subject, score]) => ({
                subject,
                score,
                color: score >= 85 ? "var(--secondary)" : score >= 70 ? "var(--primary)" : "var(--warning)"
            }));
        });

        // Generate recent activities
        if (mockData.children.length > 0) {
            mockData.dashboard.recentActivities = mockData.children.slice(0, 2).map((child, idx) => ({
                icon: idx === 0 ? "fas fa-medal" : "fas fa-star",
                iconColor: idx === 0 ? "var(--secondary)" : "var(--primary)",
                title: `${child.name} a complété des exercices`,
                meta: `Il y a ${idx + 1} heures`
            }));
        }
    }

    return mockData;
}

export default mockData;