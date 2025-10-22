/**
 * Page principale de la famille - Dashboard Claudyne
 * Tableau de bord avec accès aux matières et suivi de progression
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
}

export default function FamillePage() {
  const router = useRouter();
  const { user, family, isLoading } = useAuth();
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [stats, setStats] = useState<FamilyStats | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

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
    // Mock data pour les statistiques de famille
    setStats({
      totalClaudinePoints: family?.totalClaudinePoints || 87,
      walletBalance: family?.walletBalance || 12500,
      monthlyProgress: 68,
      completedLessons: 12,
      totalLessons: 45
    });
    setIsLoadingData(false);
  };

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

  return (
    <>
      <Head>
        <title>Tableau de bord - Famille {family?.name || 'Test'} | Claudyne</title>
        <meta name="description" content="Tableau de bord familial Claudyne - Suivi des apprentissages et Prix Claudine" />
      </Head>

      <Layout>
        <div className="space-y-8">
          {/* En-tête de bienvenue */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-primary-green to-accent-purple text-white rounded-2xl p-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Bonjour, {user.firstName} ! 👋
                </h1>
                <p className="text-lg opacity-90">
                  Bienvenue dans l'espace famille {family?.displayName || 'Test'}
                </p>
                <p className="text-sm opacity-75 mt-2">
                  "La force du savoir en héritage"
                </p>
              </div>
              
              {/* Statistiques rapides */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-white/20 rounded-xl p-4">
                  <div className="text-2xl font-bold">{stats?.totalClaudinePoints}</div>
                  <div className="text-sm opacity-90">Points Claudine</div>
                </div>
                <div className="bg-white/20 rounded-xl p-4">
                  <div className="text-2xl font-bold">{stats?.walletBalance} F</div>
                  <div className="text-sm opacity-90">Portefeuille</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Progression mensuelle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-neutral-800">
                📊 Progression de ce mois
              </h2>
              <div className="text-sm text-neutral-500">
                {stats?.completedLessons}/{stats?.totalLessons} leçons terminées
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>Progression globale</span>
                <span className="font-medium">{stats?.monthlyProgress}%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats?.monthlyProgress}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="bg-gradient-to-r from-primary-green to-claudine-gold h-3 rounded-full"
                />
              </div>
            </div>
          </motion.div>

          {/* Matières disponibles */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-neutral-800">
                📚 Matières disponibles
              </h2>
              <div className="text-sm text-neutral-500">
                Niveau 6ème - Curriculum camerounais
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((subject, index) => (
                <motion.div
                  key={subject.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-neutral-100"
                >
                  <Link href={`/apprentissage/${subject.id}`}>
                    <div className="p-6 cursor-pointer">
                      {/* En-tête de la carte */}
                      <div className="flex items-center mb-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold mr-4"
                          style={{ backgroundColor: subject.color }}
                        >
                          {subject.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-neutral-800 text-lg">
                            {subject.title}
                          </h3>
                          <p className="text-sm text-neutral-500">
                            {subject.difficulty}
                          </p>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-neutral-600 text-sm mb-4 line-clamp-2">
                        {subject.description}
                      </p>

                      {/* Statistiques */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="text-center p-2 bg-neutral-50 rounded-lg">
                          <div className="font-semibold text-neutral-800">{subject.lessons}</div>
                          <div className="text-xs text-neutral-500">Leçons</div>
                        </div>
                        <div className="text-center p-2 bg-neutral-50 rounded-lg">
                          <div className="font-semibold text-neutral-800">{subject.quizzes}</div>
                          <div className="text-xs text-neutral-500">Quiz</div>
                        </div>
                      </div>

                      {/* Barre de progression */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progression</span>
                          <span>{subject.progress}%</span>
                        </div>
                        <div className="w-full bg-neutral-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${subject.progress}%`,
                              backgroundColor: subject.color
                            }}
                          />
                        </div>
                      </div>

                      {/* Bouton d'action */}
                      <div className="mt-4 pt-4 border-t border-neutral-100">
                        <div
                          className="w-full py-2 px-4 rounded-lg text-white text-center font-medium text-sm transition-colors"
                          style={{ backgroundColor: subject.color }}
                        >
                          {subject.progress > 0 ? 'Continuer' : 'Commencer'}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Actions rapides */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <Link href="/prix-claudine">
              <div className="bg-gradient-to-br from-claudine-gold to-yellow-500 text-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer">
                <div className="text-2xl mb-2">🏆</div>
                <h3 className="font-semibold mb-1">Prix Claudine</h3>
                <p className="text-sm opacity-90">Voir le classement et les récompenses</p>
              </div>
            </Link>

            <Link href="/progression">
              <div className="bg-gradient-to-br from-accent-purple to-purple-600 text-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer">
                <div className="text-2xl mb-2">📊</div>
                <h3 className="font-semibold mb-1">Ma Progression</h3>
                <p className="text-sm opacity-90">Suivre mes statistiques d'apprentissage</p>
              </div>
            </Link>

            <Link href="/support">
              <div className="bg-gradient-to-br from-primary-green to-green-600 text-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer">
                <div className="text-2xl mb-2">💬</div>
                <h3 className="font-semibold mb-1">Support</h3>
                <p className="text-sm opacity-90">Aide et assistance technique</p>
              </div>
            </Link>
          </motion.div>
        </div>
      </Layout>
    </>
  );
}