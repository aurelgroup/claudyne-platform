/**
 * Page Progression - ULTRA MODERNE v2.0 🚀
 * Design glassmorphism, graphiques animés, timeline moderne
 * Optimisé pour visualiser les progrès d'apprentissage
 */

import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
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

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12
    }
  }
};

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

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'quiz_completed': return 'from-purple-500 to-purple-600';
      case 'lesson_completed': return 'from-blue-500 to-blue-600';
      case 'achievement_unlocked': return 'from-yellow-400 to-yellow-500';
      default: return 'from-neutral-400 to-neutral-500';
    }
  };

  const subjectNames: { [key: string]: string } = {
    'math-6eme': 'Mathématiques 6ème',
    'francais-6eme': 'Français 6ème',
    'sciences-6eme': 'Sciences 6ème',
    'histoire-geo-6eme': 'Histoire-Géo 6ème',
    'anglais-6eme': 'Anglais 6ème'
  };

  const subjectColors: { [key: string]: string } = {
    'math-6eme': '#667eea',
    'francais-6eme': '#f56565',
    'sciences-6eme': '#48bb78',
    'histoire-geo-6eme': '#ed8936',
    'anglais-6eme': '#4299e1'
  };

  // Calculer le max pour le graphique hebdomadaire
  const maxWeeklyLessons = useMemo(() => {
    if (!progressData?.weeklyStats) return 1;
    return Math.max(...progressData.weeklyStats.map(s => s.lessonsCompleted), 1);
  }, [progressData]);

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

  const lessonsPercentage = (progressData.global.totalLessonsCompleted / progressData.global.totalLessons) * 100;
  const quizzesPercentage = (progressData.global.totalQuizzesCompleted / progressData.global.totalQuizzes) * 100;

  return (
    <>
      <Head>
        <title>Ma progression - {family?.name || 'Test'} | Claudyne</title>
        <meta name="description" content="Suivez votre progression d'apprentissage avec Claudyne" />
      </Head>

      <Layout>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* 🎨 HEADER GLASSMORPHISM */}
          <motion.div variants={itemVariants}>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-1">
              <div className="relative bg-gradient-to-br from-blue-500/95 via-purple-500/95 to-pink-500/95 backdrop-blur-xl rounded-3xl p-8">
                {/* Animated background */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-1/4 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
                  <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-yellow-300 rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>

                <div className="relative z-10">
                  <motion.h1
                    className="text-4xl md:text-5xl font-bold text-white mb-3"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    📊 Ma Progression
                  </motion.h1>
                  <motion.p
                    className="text-xl text-white/90"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Suivez votre évolution et célébrez vos réussites ! 🎉
                  </motion.p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 📊 STATISTIQUES GLOBALES */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  value: progressData.global.claudinePointsTotal,
                  label: 'Points Claudine',
                  icon: '🏆',
                  gradient: 'from-yellow-400 to-yellow-600',
                  delay: 0
                },
                {
                  value: progressData.global.totalLessonsCompleted,
                  label: 'Leçons terminées',
                  icon: '📚',
                  gradient: 'from-blue-400 to-blue-600',
                  delay: 0.1
                },
                {
                  value: `${progressData.global.averageScore}%`,
                  label: 'Score moyen',
                  icon: '🎯',
                  gradient: 'from-purple-400 to-purple-600',
                  delay: 0.2
                },
                {
                  value: `${progressData.global.currentStreak} 🔥`,
                  label: 'Jours consécutifs',
                  icon: '📅',
                  gradient: 'from-orange-400 to-orange-600',
                  delay: 0.3
                }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: stat.delay }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="group"
                >
                  <div className="relative glassmorphism rounded-2xl p-6 text-center border border-white/30 overflow-hidden">
                    {/* Gradient overlay on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                    <div className="relative z-10">
                      <div className="text-4xl mb-2">{stat.icon}</div>
                      <div className="text-3xl font-bold text-neutral-800 mb-1">
                        {stat.value}
                      </div>
                      <div className="text-sm text-neutral-600 font-medium">
                        {stat.label}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* 📈 ONGLETS MODERNES */}
          <motion.div variants={itemVariants}>
            <div className="glassmorphism rounded-2xl overflow-hidden border border-white/30">
              {/* Tabs Header */}
              <div className="border-b border-neutral-200/50 bg-white/50 backdrop-blur-sm">
                <div className="flex flex-wrap gap-2 p-2">
                  {[
                    { key: 'overview', label: '📈 Vue d\'ensemble', icon: '📈' },
                    { key: 'subjects', label: '📚 Par matière', icon: '📚' },
                    { key: 'achievements', label: '🏆 Récompenses', icon: '🏆' }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`flex-1 md:flex-none px-6 py-3 font-medium rounded-xl transition-all ${
                        activeTab === tab.key
                          ? 'bg-gradient-to-r from-primary-green to-accent-purple text-white shadow-lg scale-105'
                          : 'text-neutral-700 hover:bg-white/50 hover:scale-105'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tabs Content */}
              <div className="p-8">
                <AnimatePresence mode="wait">
                  {activeTab === 'overview' && (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-8"
                    >
                      {/* Progression globale */}
                      <div>
                        <h3 className="text-2xl font-bold text-neutral-800 mb-6">
                          📊 Progression générale
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Leçons */}
                          <div className="glassmorphism rounded-2xl p-6 border border-white/30">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-bold text-neutral-800 text-lg flex items-center gap-2">
                                <span className="text-2xl">📚</span>
                                Leçons
                              </h4>
                              <span className="text-2xl font-bold text-blue-600">
                                {Math.round(lessonsPercentage)}%
                              </span>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between text-sm text-neutral-600">
                                <span>Terminées</span>
                                <span className="font-semibold">
                                  {progressData.global.totalLessonsCompleted}/{progressData.global.totalLessons}
                                </span>
                              </div>
                              <div className="relative w-full h-4 bg-neutral-200 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${lessonsPercentage}%` }}
                                  transition={{ duration: 1.5, ease: "easeOut" }}
                                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600 relative"
                                >
                                  <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                                    animate={{ x: ['-100%', '100%'] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                  />
                                </motion.div>
                              </div>
                            </div>
                          </div>

                          {/* Quiz */}
                          <div className="glassmorphism rounded-2xl p-6 border border-white/30">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-bold text-neutral-800 text-lg flex items-center gap-2">
                                <span className="text-2xl">🧠</span>
                                Quiz
                              </h4>
                              <span className="text-2xl font-bold text-purple-600">
                                {Math.round(quizzesPercentage)}%
                              </span>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between text-sm text-neutral-600">
                                <span>Terminés</span>
                                <span className="font-semibold">
                                  {progressData.global.totalQuizzesCompleted}/{progressData.global.totalQuizzes}
                                </span>
                              </div>
                              <div className="relative w-full h-4 bg-neutral-200 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${quizzesPercentage}%` }}
                                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                                  className="h-full bg-gradient-to-r from-purple-400 to-purple-600 relative"
                                >
                                  <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                                    animate={{ x: ['-100%', '100%'] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                  />
                                </motion.div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Graphique hebdomadaire AMÉLIORÉ */}
                      <div>
                        <h3 className="text-2xl font-bold text-neutral-800 mb-6">
                          📅 Activité de la semaine
                        </h3>
                        <div className="glassmorphism rounded-2xl p-6 border border-white/30">
                          <div className="flex items-end justify-between gap-4 h-48">
                            {progressData.weeklyStats.map((stat, index) => {
                              const heightPercentage = (stat.lessonsCompleted / maxWeeklyLessons) * 100;
                              return (
                                <motion.div
                                  key={index}
                                  className="flex-1 flex flex-col items-center gap-2"
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                >
                                  <div className="text-sm font-semibold text-neutral-700">
                                    {stat.lessonsCompleted}
                                  </div>
                                  <motion.div
                                    className="w-full bg-gradient-to-t from-primary-green to-accent-purple rounded-t-lg relative group cursor-pointer"
                                    initial={{ height: 0 }}
                                    animate={{ height: `${Math.max(heightPercentage, 5)}%` }}
                                    transition={{ duration: 0.8, delay: index * 0.1 }}
                                    whileHover={{ scale: 1.1 }}
                                  >
                                    {/* Tooltip on hover */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-neutral-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                      {stat.lessonsCompleted} leçon{stat.lessonsCompleted > 1 ? 's' : ''}
                                      <br />
                                      {formatTime(stat.studyTime)}
                                    </div>
                                  </motion.div>
                                  <div className="text-xs text-neutral-500 font-medium">
                                    {stat.day}
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Timeline des activités récentes */}
                      <div>
                        <h3 className="text-2xl font-bold text-neutral-800 mb-6">
                          ⏱️ Activités récentes
                        </h3>
                        <div className="relative">
                          {/* Timeline line */}
                          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-green via-accent-purple to-transparent" />

                          <div className="space-y-4">
                            {progressData.recentActivities.map((activity, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="relative pl-16"
                              >
                                {/* Timeline dot */}
                                <motion.div
                                  className={`absolute left-3 top-3 w-6 h-6 rounded-full bg-gradient-to-br ${getActivityColor(activity.type)} flex items-center justify-center text-xs`}
                                  whileHover={{ scale: 1.2, rotate: 360 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  {getActivityIcon(activity.type)}
                                </motion.div>

                                <motion.div
                                  className="glassmorphism rounded-xl p-4 border border-white/30 hover:border-white/50 transition-all"
                                  whileHover={{ x: 5 }}
                                >
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1">
                                      <div className="font-semibold text-neutral-800 mb-1">
                                        {activity.title}
                                      </div>
                                      <div className="text-sm text-neutral-600">
                                        {activity.subjectId && subjectNames[activity.subjectId]} • {formatDate(activity.timestamp)}
                                        {activity.score && (
                                          <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                            Score: {activity.score}%
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-bold text-claudine-gold text-lg">
                                        +{activity.claudinePoints}
                                      </div>
                                      <div className="text-xs text-neutral-500">points</div>
                                    </div>
                                  </div>
                                </motion.div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'subjects' && (
                    <motion.div
                      key="subjects"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-6"
                    >
                      <h3 className="text-2xl font-bold text-neutral-800">
                        📚 Progression par matière
                      </h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        {progressData.subjects.map((subject, index) => (
                          <motion.div
                            key={subject.subjectId}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -5, scale: 1.02 }}
                            className="glassmorphism rounded-2xl p-6 border border-white/30 hover:border-white/50 transition-all"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-bold text-neutral-800 text-lg">
                                {subjectNames[subject.subjectId] || subject.subjectId}
                              </h4>
                              <div className="text-2xl font-bold" style={{ color: subjectColors[subject.subjectId] || '#667eea' }}>
                                {subject.progressPercentage}%
                              </div>
                            </div>

                            {/* Barre de progression */}
                            <div className="relative w-full h-3 bg-neutral-200 rounded-full overflow-hidden mb-6">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${subject.progressPercentage}%` }}
                                transition={{ duration: 1, delay: index * 0.1 }}
                                className="h-full rounded-full relative"
                                style={{ backgroundColor: subjectColors[subject.subjectId] || '#667eea' }}
                              >
                                <motion.div
                                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                                  animate={{ x: ['-100%', '100%'] }}
                                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                />
                              </motion.div>
                            </div>

                            {/* Statistiques en grille */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="text-center p-3 bg-white/50 rounded-xl">
                                <div className="text-2xl font-bold text-neutral-800">
                                  {subject.lessonsCompleted}/{subject.totalLessons}
                                </div>
                                <div className="text-xs text-neutral-600 font-medium">Leçons</div>
                              </div>
                              <div className="text-center p-3 bg-white/50 rounded-xl">
                                <div className="text-2xl font-bold text-neutral-800">
                                  {subject.quizzesCompleted}/{subject.totalQuizzes}
                                </div>
                                <div className="text-xs text-neutral-600 font-medium">Quiz</div>
                              </div>
                              <div className="text-center p-3 bg-white/50 rounded-xl">
                                <div className="text-2xl font-bold text-green-600">
                                  {subject.averageScore}%
                                </div>
                                <div className="text-xs text-neutral-600 font-medium">Score moyen</div>
                              </div>
                              <div className="text-center p-3 bg-white/50 rounded-xl">
                                <div className="text-sm font-bold text-neutral-800">
                                  {formatDate(subject.lastActivity).split(',')[0]}
                                </div>
                                <div className="text-xs text-neutral-600 font-medium">Dernière activité</div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'achievements' && achievements && (
                    <motion.div
                      key="achievements"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-8"
                    >
                      {/* Récompenses débloquées */}
                      <div>
                        <h3 className="text-2xl font-bold text-neutral-800 mb-6 flex items-center gap-2">
                          <span className="text-3xl">🏆</span>
                          Récompenses débloquées
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          {achievements.unlocked.map((achievement, index) => (
                            <motion.div
                              key={achievement.id}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1 }}
                              whileHover={{ scale: 1.05, rotate: 1 }}
                              className="relative overflow-hidden rounded-2xl p-1 bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500"
                            >
                              <div className="relative bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6">
                                <div className="flex items-center gap-4">
                                  <motion.div
                                    className="text-5xl"
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                  >
                                    {achievement.icon}
                                  </motion.div>
                                  <div className="flex-1">
                                    <h4 className="font-bold text-lg text-neutral-800 mb-1">
                                      {achievement.title}
                                    </h4>
                                    <p className="text-sm text-neutral-600 mb-2">
                                      {achievement.description}
                                    </p>
                                    <div className="text-xs text-neutral-500">
                                      Débloqué le {formatDate(achievement.unlockedAt!)}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-2xl text-yellow-600">
                                      +{achievement.claudinePoints}
                                    </div>
                                    <div className="text-xs text-neutral-500">points</div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Objectifs en cours */}
                      <div>
                        <h3 className="text-2xl font-bold text-neutral-800 mb-6 flex items-center gap-2">
                          <span className="text-3xl">🎯</span>
                          Objectifs en cours
                        </h3>
                        <div className="space-y-4">
                          {achievements.available.map((achievement, index) => {
                            const progressPercent = ((achievement.progress || 0) / (achievement.target || 1)) * 100;
                            return (
                              <motion.div
                                key={achievement.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ x: 5 }}
                                className="glassmorphism rounded-2xl p-6 border border-white/30 hover:border-white/50 transition-all"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="text-4xl grayscale">
                                    {achievement.icon}
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-bold text-neutral-800 mb-2 text-lg">
                                      {achievement.title}
                                    </h4>
                                    <p className="text-sm text-neutral-600 mb-4">
                                      {achievement.description}
                                    </p>

                                    {/* Barre de progression */}
                                    <div className="space-y-2">
                                      <div className="flex justify-between text-sm font-medium">
                                        <span className="text-neutral-600">Progression</span>
                                        <span className="text-neutral-800">
                                          {achievement.progress}/{achievement.target}
                                        </span>
                                      </div>
                                      <div className="relative w-full h-3 bg-neutral-200 rounded-full overflow-hidden">
                                        <motion.div
                                          initial={{ width: 0 }}
                                          animate={{ width: `${progressPercent}%` }}
                                          transition={{ duration: 1, delay: index * 0.1 }}
                                          className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 relative"
                                        >
                                          <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                                            animate={{ x: ['-100%', '100%'] }}
                                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                          />
                                        </motion.div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-2xl text-claudine-gold">
                                      +{achievement.claudinePoints}
                                    </div>
                                    <div className="text-xs text-neutral-500">points</div>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </Layout>
    </>
  );
}
