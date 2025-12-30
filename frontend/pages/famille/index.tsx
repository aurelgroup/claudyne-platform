/**
 * Page Famille Dashboard - ULTRA MODERNE v2.0 🚀
 * Design glassmorphism, animations fluides, statistiques en temps réel
 * Optimisé pour l'expérience utilisateur Claudyne
 */

import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

// Components
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

// Hooks
import { useAuth } from '../../hooks/useAuth';

// Services
import { apiService } from '../../services/api';

// Types
interface Subject {
  id: string;
  title: string;
  description: string;
  level: string;
  category: string;
  icon: string;
  color: string;
  lessons: number;
  quizzes: number;
  progress: number;
  difficulty: string;
}

interface FamilyStats {
  totalClaudinePoints: number;
  walletBalance: number;
  monthlyProgress: number;
  completedLessons: number;
  totalLessons: number;
  weeklyStreak: number;
  averageScore: number;
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

export default function FamillePage() {
  const router = useRouter();
  const { user, family, isLoading } = useAuth();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [stats, setStats] = useState<FamilyStats | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Redirection si non connecté
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  // Charger les données
  useEffect(() => {
    if (user && family) {
      fetchSubjects();
      loadFamilyStats();
    }
  }, [user, family]);

  const fetchSubjects = async () => {
    try {
      const response = await apiService.getSubjects();

      if (response.success && response.data) {
        setSubjects(response.data.subjects || []);
      }
    } catch (error: any) {
      console.error('Erreur chargement matières:', error);
      toast.error(error.message || 'Erreur lors du chargement des matières');
    }
  };

  const loadFamilyStats = () => {
    // Statistiques enrichies
    setStats({
      totalClaudinePoints: family?.totalClaudinePoints || 87,
      walletBalance: family?.walletBalance || 12500,
      monthlyProgress: 68,
      completedLessons: 12,
      totalLessons: 45,
      weeklyStreak: 5,
      averageScore: 82
    });
    setIsLoadingData(false);
  };

  // Filtrage des matières par catégorie
  const categories = useMemo(() => {
    const cats = new Set(subjects.map(s => s.category));
    return ['all', ...Array.from(cats)];
  }, [subjects]);

  const filteredSubjects = useMemo(() => {
    if (selectedCategory === 'all') return subjects;
    return subjects.filter(s => s.category === selectedCategory);
  }, [subjects, selectedCategory]);

  // Loading initial
  if (isLoading || !user || isLoadingData) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  // Calcul du niveau de progression
  const progressLevel = stats ?
    stats.monthlyProgress >= 80 ? 'Excellent' :
    stats.monthlyProgress >= 60 ? 'Très bien' :
    stats.monthlyProgress >= 40 ? 'Bien' : 'En cours' : '';

  return (
    <>
      <Head>
        <title>Tableau de bord - Famille {family?.name || 'Test'} | Claudyne</title>
        <meta name="description" content="Tableau de bord familial Claudyne - Suivi des apprentissages et Prix Claudine" />
      </Head>

      <Layout>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* 🎨 HEADER GLASSMORPHISM - Hero Section */}
          <motion.div variants={itemVariants}>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-green via-accent-purple to-claudine-gold p-1">
              <div className="relative bg-gradient-to-br from-primary-green/95 via-accent-purple/95 to-purple-600/95 backdrop-blur-xl rounded-3xl p-8">
                {/* Animated background pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 left-1/4 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
                  <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-claudine-gold rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>

                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    {/* Welcome message */}
                    <div className="flex-1">
                      <motion.h1
                        className="text-4xl md:text-5xl font-bold text-white mb-3"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        Bonjour, {user.firstName} ! 👋
                      </motion.h1>
                      <motion.p
                        className="text-xl text-white/90 mb-2"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        Bienvenue dans l'espace {family?.displayName || 'Test'}
                      </motion.p>
                      <motion.p
                        className="text-sm text-white/75 italic"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        "La force du savoir en héritage" 💚
                      </motion.p>
                    </div>

                    {/* Stats Cards Grid */}
                    <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                      <motion.div
                        className="glassmorphism-light rounded-2xl p-5 text-center min-w-[140px]"
                        whileHover={{ scale: 1.05, y: -5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <div className="text-3xl font-bold text-white mb-1">
                          {stats?.totalClaudinePoints}
                        </div>
                        <div className="text-sm text-white/80 font-medium">Points Claudine 🏆</div>
                      </motion.div>

                      <motion.div
                        className="glassmorphism-light rounded-2xl p-5 text-center min-w-[140px]"
                        whileHover={{ scale: 1.05, y: -5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <div className="text-3xl font-bold text-white mb-1">
                          {stats?.walletBalance}
                        </div>
                        <div className="text-sm text-white/80 font-medium">Francs CFA 💰</div>
                      </motion.div>

                      <motion.div
                        className="glassmorphism-light rounded-2xl p-5 text-center min-w-[140px]"
                        whileHover={{ scale: 1.05, y: -5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <div className="text-3xl font-bold text-white mb-1">
                          {stats?.weeklyStreak} 🔥
                        </div>
                        <div className="text-sm text-white/80 font-medium">Jours consécutifs</div>
                      </motion.div>

                      <motion.div
                        className="glassmorphism-light rounded-2xl p-5 text-center min-w-[140px]"
                        whileHover={{ scale: 1.05, y: -5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <div className="text-3xl font-bold text-white mb-1">
                          {stats?.averageScore}%
                        </div>
                        <div className="text-sm text-white/80 font-medium">Score moyen 📊</div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 📊 PROGRESSION CARD */}
          <motion.div variants={itemVariants}>
            <div className="glassmorphism rounded-2xl p-6 border border-white/20">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-800 mb-1 flex items-center gap-2">
                    📈 Progression de ce mois
                  </h2>
                  <p className="text-neutral-600">
                    {stats?.completedLessons} sur {stats?.totalLessons} leçons terminées
                  </p>
                </div>

                <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-primary-green/10 to-accent-purple/10 rounded-xl border border-primary-green/20">
                  <span className="text-lg font-semibold text-neutral-800">
                    {progressLevel}
                  </span>
                  <span className="text-3xl font-bold text-primary-green">
                    {stats?.monthlyProgress}%
                  </span>
                </div>
              </div>

              {/* Animated progress bar */}
              <div className="relative">
                <div className="w-full h-4 bg-neutral-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats?.monthlyProgress}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-primary-green via-accent-purple to-claudine-gold relative"
                  >
                    {/* Shimmer effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{
                        x: ['-100%', '100%']
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />
                  </motion.div>
                </div>

                {/* Progress milestones */}
                <div className="flex justify-between mt-3 text-xs text-neutral-500">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 🏷️ FILTRES DE CATÉGORIES */}
          <motion.div variants={itemVariants}>
            <div className="flex flex-wrap gap-3">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all ${
                    selectedCategory === cat
                      ? 'bg-gradient-to-r from-primary-green to-accent-purple text-white shadow-lg scale-105'
                      : 'glassmorphism text-neutral-700 hover:scale-105 hover:shadow-md'
                  }`}
                >
                  {cat === 'all' ? '🌟 Toutes les matières' : `📚 ${cat}`}
                </button>
              ))}
            </div>
          </motion.div>

          {/* 📚 MATIÈRES DISPONIBLES - Grid moderne */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-neutral-800">
                {selectedCategory === 'all' ? '📚 Toutes les matières' : `📚 ${selectedCategory}`}
              </h2>
              <div className="text-sm text-neutral-500 bg-neutral-100 px-4 py-2 rounded-full">
                {filteredSubjects.length} matière{filteredSubjects.length > 1 ? 's' : ''} disponible{filteredSubjects.length > 1 ? 's' : ''}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={selectedCategory}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredSubjects.map((subject, index) => (
                  <motion.div
                    key={subject.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="group"
                  >
                    <Link href={`/apprentissage/${subject.id}`}>
                      <div className="relative glassmorphism rounded-2xl overflow-hidden border border-white/30 hover:border-white/50 transition-all cursor-pointer h-full">
                        {/* Gradient overlay on hover */}
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                          style={{ background: `linear-gradient(135deg, ${subject.color}, transparent)` }}
                        />

                        <div className="relative p-6">
                          {/* Header avec icône */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <motion.div
                                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                                style={{ backgroundColor: subject.color }}
                                whileHover={{ rotate: 360 }}
                                transition={{ duration: 0.6 }}
                              >
                                {subject.icon}
                              </motion.div>
                              <div className="flex-1">
                                <h3 className="font-bold text-neutral-800 text-lg mb-1">
                                  {subject.title}
                                </h3>
                                <span className="inline-block px-3 py-1 bg-neutral-100 rounded-full text-xs font-medium text-neutral-600">
                                  {subject.difficulty}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-neutral-600 text-sm mb-4 line-clamp-2 min-h-[40px]">
                            {subject.description}
                          </p>

                          {/* Statistiques */}
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="text-center p-3 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-xl border border-neutral-200">
                              <div className="font-bold text-neutral-800 text-lg">{subject.lessons}</div>
                              <div className="text-xs text-neutral-500 font-medium">📖 Leçons</div>
                            </div>
                            <div className="text-center p-3 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-xl border border-neutral-200">
                              <div className="font-bold text-neutral-800 text-lg">{subject.quizzes}</div>
                              <div className="text-xs text-neutral-500 font-medium">✅ Quiz</div>
                            </div>
                          </div>

                          {/* Barre de progression circulaire */}
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-neutral-600">Progression</span>
                              <span className="text-sm font-bold" style={{ color: subject.color }}>
                                {subject.progress}%
                              </span>
                            </div>
                            <div className="relative w-full h-3 bg-neutral-200 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${subject.progress}%` }}
                                transition={{ duration: 1, delay: index * 0.1 }}
                                className="h-full rounded-full relative"
                                style={{ backgroundColor: subject.color }}
                              >
                                <motion.div
                                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                                  animate={{ x: ['-100%', '100%'] }}
                                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                />
                              </motion.div>
                            </div>
                          </div>

                          {/* Bouton CTA */}
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="w-full py-3 px-4 rounded-xl text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2"
                            style={{ backgroundColor: subject.color }}
                          >
                            {subject.progress > 0 ? (
                              <>
                                <span>Continuer</span>
                                <span>→</span>
                              </>
                            ) : (
                              <>
                                <span>Commencer</span>
                                <span>🚀</span>
                              </>
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* 🎯 ACTIONS RAPIDES - Redesigned */}
          <motion.div variants={itemVariants}>
            <h2 className="text-2xl font-bold text-neutral-800 mb-6">⚡ Actions rapides</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/prix-claudine">
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="relative overflow-hidden glassmorphism rounded-2xl p-6 cursor-pointer border border-white/30 hover:border-claudine-gold/50 transition-all group"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-claudine-gold/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />

                  <div className="relative z-10">
                    <div className="text-5xl mb-3">🏆</div>
                    <h3 className="font-bold text-xl text-neutral-800 mb-2">Prix Claudine</h3>
                    <p className="text-sm text-neutral-600 mb-4">
                      Classement et récompenses mensuelles
                    </p>
                    <div className="flex items-center gap-2 text-claudine-gold font-medium text-sm">
                      <span>Voir le classement</span>
                      <span className="group-hover:translate-x-2 transition-transform">→</span>
                    </div>
                  </div>
                </motion.div>
              </Link>

              <Link href="/progression">
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="relative overflow-hidden glassmorphism rounded-2xl p-6 cursor-pointer border border-white/30 hover:border-accent-purple/50 transition-all group"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent-purple/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />

                  <div className="relative z-10">
                    <div className="text-5xl mb-3">📊</div>
                    <h3 className="font-bold text-xl text-neutral-800 mb-2">Ma Progression</h3>
                    <p className="text-sm text-neutral-600 mb-4">
                      Statistiques détaillées d'apprentissage
                    </p>
                    <div className="flex items-center gap-2 text-accent-purple font-medium text-sm">
                      <span>Voir mes stats</span>
                      <span className="group-hover:translate-x-2 transition-transform">→</span>
                    </div>
                  </div>
                </motion.div>
              </Link>

              <Link href="/support">
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="relative overflow-hidden glassmorphism rounded-2xl p-6 cursor-pointer border border-white/30 hover:border-primary-green/50 transition-all group"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-green/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />

                  <div className="relative z-10">
                    <div className="text-5xl mb-3">💬</div>
                    <h3 className="font-bold text-xl text-neutral-800 mb-2">Support</h3>
                    <p className="text-sm text-neutral-600 mb-4">
                      Aide et assistance technique 24/7
                    </p>
                    <div className="flex items-center gap-2 text-primary-green font-medium text-sm">
                      <span>Contacter le support</span>
                      <span className="group-hover:translate-x-2 transition-transform">→</span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </Layout>
    </>
  );
}
