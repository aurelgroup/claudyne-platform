/**
 * Page de suivi de progression
 * Affiche les statistiques détaillées et l'évolution de l'apprentissage
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

// Components
import Layout from '../components/Layout';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Hooks
import { useAuth } from '../hooks/useAuth';

// Services
import { apiService } from '../services/api';

// Types
interface GlobalProgress {
  totalLessonsCompleted: number;
  totalLessons: number;
  totalQuizzesCompleted: number;
  totalQuizzes: number;
  averageScore: number;
  claudinePointsTotal: number;
  studyTimeMinutes: number;
  currentStreak: number;
}

interface SubjectProgress {
  subjectId: string;
  lessonsCompleted: number;
  totalLessons: number;
  quizzesCompleted: number;
  totalQuizzes: number;
  averageScore: number;
  progressPercentage: number;
  lastActivity: string;
}

interface Activity {
  type: 'quiz_completed' | 'lesson_completed' | 'achievement_unlocked';
  subjectId?: string;
  title: string;
  score?: number;
  claudinePoints: number;
  timestamp: string;
  description?: string;
}

interface WeeklyStat {
  day: string;
  lessonsCompleted: number;
  studyTime: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress?: number;
  target?: number;
  claudinePoints: number;
  unlocked?: boolean;
  unlockedAt?: string;
}

interface ProgressData {
  global: GlobalProgress;
  subjects: SubjectProgress[];
  recentActivities: Activity[];
  weeklyStats: WeeklyStat[];
}

export default function ProgressionPage() {
  const router = useRouter();
  const { user, family, isLoading } = useAuth();
  
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [achievements, setAchievements] = useState<{available: Achievement[], unlocked: Achievement[]} | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'subjects' | 'achievements'>('overview');

  // Redirection si non connecté
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  // Charger les données
  useEffect(() => {
    if (user && family) {
      fetchProgressData();
      fetchAchievements();
    }
  }, [user, family]);

  const fetchProgressData = async () => {
    try {
      const response = await apiService.getProgress();

      if (response.success && response.data) {
        setProgressData(response.data);
      }
    } catch (error: any) {
      console.error('Erreur chargement progression:', error);
      toast.error(error.message || 'Erreur lors du chargement de la progression');
    }
  };

  const fetchAchievements = async () => {
    try {
      const response = await apiService.getAchievements();

      if (response.success && response.data) {
        setAchievements(response.data);
      }
      setIsLoadingData(false);
    } catch (error: any) {
      console.error('Erreur chargement récompenses:', error);
      toast.error(error.message || 'Erreur lors du chargement des récompenses');
      setIsLoadingData(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'quiz_completed': return '🧠';
      case 'lesson_completed': return '📚';
      case 'achievement_unlocked': return '🏆';
      default: return '📝';
    }
  };

  const subjectNames: { [key: string]: string } = {
    'math-6eme': 'Mathématiques 6ème',
    'francais-6eme': 'Français 6ème',
    'sciences-6eme': 'Sciences 6ème',
    'histoire-geo-6eme': 'Histoire-Géo 6ème',
    'anglais-6eme': 'Anglais 6ème'
  };

  // Loading initial
  if (isLoading || isLoadingData) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!progressData) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-neutral-800 mb-4">
            Données non disponibles
          </h1>
          <p className="text-neutral-600">
            Impossible de charger vos données de progression.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>Ma progression - {family?.name || 'Test'} | Claudyne</title>
        <meta name="description" content="Suivez votre progression d'apprentissage avec Claudyne" />
      </Head>

      <Layout>
        <div className="space-y-8">
          {/* En-tête */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-neutral-800 mb-2">
              📊 Ma progression
            </h1>
            <p className="text-neutral-600">
              Suivez votre évolution et célébrez vos réussites !
            </p>
          </motion.div>

          {/* Statistiques globales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="text-3xl font-bold text-primary-green mb-2">
                {progressData.global.claudinePointsTotal}
              </div>
              <div className="text-sm text-neutral-600">Points Claudine</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {progressData.global.totalLessonsCompleted}
              </div>
              <div className="text-sm text-neutral-600">Leçons terminées</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {progressData.global.averageScore}%
              </div>
              <div className="text-sm text-neutral-600">Score moyen</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {progressData.global.currentStreak}
              </div>
              <div className="text-sm text-neutral-600">Jours consécutifs</div>
            </div>
          </motion.div>

          {/* Onglets */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="border-b border-neutral-200">
              <div className="flex">
                {[
                  { key: 'overview', label: '📈 Vue d\'ensemble', },
                  { key: 'subjects', label: '📚 Par matière' },
                  { key: 'achievements', label: '🏆 Récompenses' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`px-6 py-4 font-medium transition-colors ${
                      activeTab === tab.key
                        ? 'text-primary-green border-b-2 border-primary-green'
                        : 'text-neutral-600 hover:text-neutral-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-8">
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* Progression globale */}
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-800 mb-6">
                      Progression générale
                    </h3>
                    <div className="grid md:grid-cols-2 gap-8">
                      {/* Leçons */}
                      <div className="bg-neutral-50 rounded-xl p-6">
                        <h4 className="font-semibold text-neutral-800 mb-4">📚 Leçons</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span>Terminées</span>
                            <span>{progressData.global.totalLessonsCompleted}/{progressData.global.totalLessons}</span>
                          </div>
                          <div className="w-full bg-neutral-200 rounded-full h-3">
                            <div
                              className="bg-blue-500 h-3 rounded-full"
                              style={{ 
                                width: `${(progressData.global.totalLessonsCompleted / progressData.global.totalLessons) * 100}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Quiz */}
                      <div className="bg-neutral-50 rounded-xl p-6">
                        <h4 className="font-semibold text-neutral-800 mb-4">🧠 Quiz</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span>Terminés</span>
                            <span>{progressData.global.totalQuizzesCompleted}/{progressData.global.totalQuizzes}</span>
                          </div>
                          <div className="w-full bg-neutral-200 rounded-full h-3">
                            <div
                              className="bg-purple-500 h-3 rounded-full"
                              style={{ 
                                width: `${(progressData.global.totalQuizzesCompleted / progressData.global.totalQuizzes) * 100}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Statistiques hebdomadaires */}
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-800 mb-6">
                      Activité de la semaine
                    </h3>
                    <div className="bg-neutral-50 rounded-xl p-6">
                      <div className="grid grid-cols-7 gap-4">
                        {progressData.weeklyStats.map((stat, index) => (
                          <div key={index} className="text-center">
                            <div className="text-sm text-neutral-600 mb-2">{stat.day}</div>
                            <div 
                              className="bg-primary-green rounded-lg mx-auto mb-2"
                              style={{
                                height: `${Math.max(stat.lessonsCompleted * 10, 4)}px`,
                                width: '20px'
                              }}
                            />
                            <div className="text-xs text-neutral-500">
                              {stat.lessonsCompleted} leçons
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Activités récentes */}
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-800 mb-6">
                      Activités récentes
                    </h3>
                    <div className="space-y-3">
                      {progressData.recentActivities.map((activity, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-neutral-50 rounded-lg p-4 flex items-center"
                        >
                          <div className="text-2xl mr-4">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-neutral-800">
                              {activity.title}
                            </div>
                            <div className="text-sm text-neutral-600">
                              {activity.subjectId && subjectNames[activity.subjectId]} • {formatDate(activity.timestamp)}
                              {activity.score && ` • Score: ${activity.score}%`}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-claudine-gold">
                              +{activity.claudinePoints}
                            </div>
                            <div className="text-xs text-neutral-500">points</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'subjects' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-neutral-800">
                    Progression par matière
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {progressData.subjects.map((subject, index) => (
                      <motion.div
                        key={subject.subjectId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-neutral-50 rounded-xl p-6"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-neutral-800">
                            {subjectNames[subject.subjectId] || subject.subjectId}
                          </h4>
                          <div className="text-sm text-neutral-500">
                            {subject.progressPercentage}%
                          </div>
                        </div>

                        {/* Barre de progression */}
                        <div className="w-full bg-neutral-200 rounded-full h-2 mb-4">
                          <div
                            className="bg-primary-green h-2 rounded-full"
                            style={{ width: `${subject.progressPercentage}%` }}
                          />
                        </div>

                        {/* Statistiques */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-neutral-600">Leçons</div>
                            <div className="font-semibold">
                              {subject.lessonsCompleted}/{subject.totalLessons}
                            </div>
                          </div>
                          <div>
                            <div className="text-neutral-600">Quiz</div>
                            <div className="font-semibold">
                              {subject.quizzesCompleted}/{subject.totalQuizzes}
                            </div>
                          </div>
                          <div>
                            <div className="text-neutral-600">Score moyen</div>
                            <div className="font-semibold text-green-600">
                              {subject.averageScore}%
                            </div>
                          </div>
                          <div>
                            <div className="text-neutral-600">Dernière activité</div>
                            <div className="font-semibold">
                              {formatDate(subject.lastActivity)}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'achievements' && achievements && (
                <div className="space-y-8">
                  {/* Récompenses débloquées */}
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-800 mb-6">
                      🏆 Récompenses débloquées
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {achievements.unlocked.map((achievement, index) => (
                        <motion.div
                          key={achievement.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-gradient-to-r from-claudine-gold to-yellow-500 text-white rounded-xl p-6"
                        >
                          <div className="flex items-center">
                            <div className="text-3xl mr-4">{achievement.icon}</div>
                            <div className="flex-1">
                              <h4 className="font-bold text-lg">{achievement.title}</h4>
                              <p className="text-sm opacity-90">{achievement.description}</p>
                              <div className="text-xs opacity-75 mt-2">
                                Débloqué le {formatDate(achievement.unlockedAt!)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">+{achievement.claudinePoints}</div>
                              <div className="text-xs opacity-75">points</div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Récompenses en cours */}
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-800 mb-6">
                      🎯 Objectifs en cours
                    </h3>
                    <div className="space-y-4">
                      {achievements.available.map((achievement, index) => (
                        <motion.div
                          key={achievement.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-neutral-50 rounded-xl p-6"
                        >
                          <div className="flex items-center">
                            <div className="text-3xl mr-4 grayscale">{achievement.icon}</div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-neutral-800 mb-2">{achievement.title}</h4>
                              <p className="text-sm text-neutral-600 mb-3">{achievement.description}</p>
                              
                              {/* Progression */}
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>Progression</span>
                                  <span>{achievement.progress}/{achievement.target}</span>
                                </div>
                                <div className="w-full bg-neutral-200 rounded-full h-2">
                                  <div
                                    className="bg-claudine-gold h-2 rounded-full"
                                    style={{ width: `${((achievement.progress || 0) / (achievement.target || 1)) * 100}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-claudine-gold">+{achievement.claudinePoints}</div>
                              <div className="text-xs text-neutral-500">points</div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}