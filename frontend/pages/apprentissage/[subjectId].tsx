/**
 * Page d'apprentissage pour une matière spécifique
 * Affiche les leçons et permet de naviguer dans le contenu pédagogique
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// Components
import Layout from '../../components/Layout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

// Hooks
import { useAuth } from '../../hooks/useAuth';

// Services
import { apiService } from '../../services/api';

// Types
interface LessonContent {
  transcript?: string | null;
  keyPoints?: string[];
  exercises?: string[];
  resources?: string[];
  downloadableFiles?: string[];
  videoUrl?: string | null;
}

interface Lesson {
  id: number;
  title: string;
  description: string;
  estimatedDuration: number;
  type: 'video' | 'interactive' | 'reading';
  content: LessonContent;
  objectives?: string[];
  prerequisites?: string[];
  hasQuiz: boolean;
  completed: boolean;
  score: number | null;
  progress?: {
    status: string;
    completionPercentage: number;
    timeSpent: number;
    lastScore: number | null;
  };
}

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

export default function ApprentissagePage() {
  const router = useRouter();
  const { subjectId } = router.query;
  const { user, isLoading } = useAuth();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<'lessons' | 'quiz'>('lessons');

  /**
   * Helper pour parser les champs qui peuvent être string JSON ou tableau
   */
  const parseArrayField = (field: any): string[] => {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    if (typeof field === 'string') {
      try {
        const parsed = JSON.parse(field);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  // Redirection si non connecté
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  // Charger les données de la matière
  useEffect(() => {
    if (subjectId && user) {
      fetchSubjectData();
      fetchLessons();
    }
  }, [subjectId, user]);

  const fetchSubjectData = async () => {
    try {
      const response = await apiService.getSubject(subjectId as string);

      if (response.success && response.data) {
        setSubject(response.data.subject || null);
      }
    } catch (error: any) {
      console.error('Erreur chargement matière:', error);
      toast.error(error.message || 'Erreur lors du chargement de la matière');
    }
  };

  const fetchLessons = async () => {
    try {
      const response = await apiService.getSubjectLessons(subjectId as string);

      if (response.success && response.data) {
        const lessonsList = response.data.lessons || [];
        setLessons(lessonsList);

        // Charger le contenu complet de la première leçon
        if (lessonsList.length > 0) {
          await handleLessonSelect(lessonsList[0]);
        } else {
          setIsLoadingData(false);
        }
      } else {
        setIsLoadingData(false);
      }
    } catch (error: any) {
      console.error('Erreur chargement leçons:', error);
      toast.error(error.message || 'Erreur lors du chargement des leçons');
      setIsLoadingData(false);
    }
  };

  const handleLessonSelect = async (lesson: Lesson) => {
    try {
      setIsLoadingData(true);
      setActiveTab('lessons');

      // Charger le contenu complet de la leçon
      const response = await apiService.getLesson(subjectId as string, lesson.id);

      if (response.success && response.data) {
        const fullLesson = response.data.lesson || response.data;
        setSelectedLesson(fullLesson);
      } else {
        // Si le chargement échoue, utiliser les données de base
        setSelectedLesson(lesson);
      }
    } catch (error: any) {
      console.error('Erreur chargement leçon:', error);
      toast.error('Erreur lors du chargement de la leçon');
      // Utiliser les données de base en cas d'erreur
      setSelectedLesson(lesson);
    } finally {
      setIsLoadingData(false);
    }
  };

  const startQuiz = async (lessonId: number) => {
    router.push(`/quiz/${lessonId}`);
  };

  const markLessonComplete = async () => {
    if (!selectedLesson) return;

    try {
      const response = await apiService.markLessonComplete(
        subjectId as string,
        selectedLesson.id,
        { timeSpent: 0, notes: null }
      );

      if (response.success) {
        toast.success('Leçon terminée ! +10 points Claudine 🎉');

        setLessons(prev => prev.map(l =>
          l.id === selectedLesson.id ? { ...l, completed: true } : l
        ));
        setSelectedLesson(prev => prev ? { ...prev, completed: true } : null);
        fetchSubjectData();
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la validation');
    }
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

  // Matière non trouvée
  if (!subject) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-neutral-800 mb-4">
            Matière non trouvée
          </h1>
          <p className="text-neutral-600 mb-6">
            La matière demandée n'existe pas ou n'est plus disponible.
          </p>
          <Link href="/famille">
            <div className="inline-block bg-primary-green text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors">
              Retour au tableau de bord
            </div>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>{subject.title} - Apprentissage | Claudyne</title>
        <meta name="description" content={`Cours de ${subject.title} - ${subject.description}`} />
      </Head>

      <Layout>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Liste des leçons */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
              {/* En-tête matière */}
              <div className="text-center mb-6">
                <div
                  className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-white text-2xl mb-4"
                  style={{ backgroundColor: subject.color }}
                >
                  {subject.icon}
                </div>
                <h1 className="text-lg font-bold text-neutral-800">
                  {subject.title}
                </h1>
                <p className="text-sm text-neutral-500">
                  {subject.difficulty}
                </p>
              </div>

              {/* Progression */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span>Progression</span>
                  <span>{subject.progress}%</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${subject.progress}%`,
                      backgroundColor: subject.color
                    }}
                  />
                </div>
              </div>

              {/* Liste des leçons */}
              <div>
                <h3 className="font-semibold text-neutral-800 mb-3">
                  📚 Leçons ({lessons.length})
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {lessons.map((lesson, index) => (
                    <motion.div
                      key={lesson.id}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleLessonSelect(lesson)}
                      className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border-l-4 ${
                        selectedLesson?.id === lesson.id
                          ? 'bg-gradient-to-r from-primary-green to-green-600 text-white shadow-lg border-green-400'
                          : 'bg-white hover:bg-neutral-50 text-neutral-700 shadow-sm hover:shadow-md border-neutral-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                          lesson.completed
                            ? 'bg-green-500 text-white ring-2 ring-green-300'
                            : selectedLesson?.id === lesson.id
                            ? 'bg-white text-primary-green'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          {lesson.completed ? '✓' : index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-semibold text-sm leading-tight mb-1 ${
                            selectedLesson?.id === lesson.id ? 'text-white' : 'text-neutral-900'
                          }`}>
                            {lesson.title}
                          </div>
                          <div className={`flex items-center gap-2 text-xs ${
                            selectedLesson?.id === lesson.id ? 'text-white/90' : 'text-neutral-500'
                          }`}>
                            <span className="flex items-center gap-1">
                              ⏱️ {lesson.estimatedDuration} min
                            </span>
                            <span>•</span>
                            <span>{lesson.type === 'video' ? '🎥 Vidéo' : lesson.type === 'interactive' ? '🎮 Interactif' : '📖 Lecture'}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Retour */}
              <div className="mt-6 pt-6 border-t border-neutral-200">
                <Link href="/famille">
                  <div className="flex items-center text-neutral-600 hover:text-neutral-800 transition-colors text-sm">
                    <span className="mr-2">←</span>
                    Retour au tableau de bord
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Onglets */}
              <div className="border-b border-neutral-200">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('lessons')}
                    className={`px-6 py-4 font-medium transition-colors ${
                      activeTab === 'lessons'
                        ? 'text-primary-green border-b-2 border-primary-green'
                        : 'text-neutral-600 hover:text-neutral-800'
                    }`}
                  >
                    📖 Contenu de la leçon
                  </button>
                  <button
                    onClick={() => setActiveTab('quiz')}
                    className={`px-6 py-4 font-medium transition-colors ${
                      activeTab === 'quiz'
                        ? 'text-primary-green border-b-2 border-primary-green'
                        : 'text-neutral-600 hover:text-neutral-800'
                    }`}
                    disabled={!selectedLesson}
                  >
                    🧠 Quiz
                  </button>
                </div>
              </div>

              {/* Contenu des onglets */}
              <div className="p-8">
                <AnimatePresence mode="wait">
                  {/* Indicateur de chargement */}
                  {isLoadingData && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-12"
                    >
                      <LoadingSpinner size="lg" />
                      <p className="text-neutral-600 mt-4">Chargement de la leçon...</p>
                    </motion.div>
                  )}

                  {activeTab === 'lessons' && selectedLesson && !isLoadingData && (
                    <motion.div
                      key="lesson-content"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* En-tête de la leçon */}
                      <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h2 className="text-2xl font-bold text-neutral-800">
                              {selectedLesson.title}
                            </h2>
                            <p className="text-neutral-600 mt-2">
                              {selectedLesson.description}
                            </p>
                          </div>
                          <div className="text-sm text-neutral-500">
                            {selectedLesson.estimatedDuration} minutes
                          </div>
                        </div>
                        
                        {/* Badges de type */}
                        <div className="flex gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            selectedLesson.type === 'video'
                              ? 'bg-red-100 text-red-700'
                              : selectedLesson.type === 'interactive'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {selectedLesson.type === 'video' ? '🎥 Vidéo' : 
                             selectedLesson.type === 'interactive' ? '🎮 Interactif' : 
                             '📖 Lecture'}
                          </span>
                          {selectedLesson.completed && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              ✓ Terminé
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Contenu de la leçon */}
                      <div className="space-y-6">
                        {selectedLesson.type === 'video' && (
                          <div className="space-y-6">
                            <div className="bg-neutral-800 rounded-xl aspect-video flex items-center justify-center text-white mb-4">
                              {selectedLesson.content?.videoUrl ? (
                                <iframe
                                  src={selectedLesson.content.videoUrl}
                                  className="w-full h-full rounded-xl"
                                  allowFullScreen
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                />
                              ) : (
                                <div className="text-center">
                                  <div className="text-6xl mb-4">🎥</div>
                                  <p className="text-lg">{selectedLesson.title}</p>
                                  <p className="text-sm opacity-75 mt-2">Vidéo en cours d'ajout</p>
                                </div>
                              )}
                            </div>

                            {/* Transcription */}
                            {selectedLesson.content?.transcript && (
                              <div className="bg-neutral-50 rounded-xl p-6">
                                <h3 className="font-semibold text-neutral-800 mb-3">📄 Transcription</h3>
                                <div className="text-neutral-700 text-sm leading-relaxed whitespace-pre-wrap">
                                  {selectedLesson.content.transcript}
                                </div>
                              </div>
                            )}

                            {parseArrayField(selectedLesson.content?.keyPoints).length > 0 && (
                              <div className="bg-neutral-50 rounded-xl p-6">
                                <h3 className="font-semibold text-neutral-800 mb-3">
                                  📝 Points clés à retenir
                                </h3>
                                <ul className="space-y-2">
                                  {parseArrayField(selectedLesson.content?.keyPoints).map((point: string, index: number) => (
                                    <li key={index} className="flex items-start">
                                      <span className="w-2 h-2 bg-primary-green rounded-full mt-2 mr-3 flex-shrink-0" />
                                      <span className="text-neutral-700">{point}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Exercices */}
                            {parseArrayField(selectedLesson.content?.exercises).length > 0 && (
                              <div className="bg-blue-50 rounded-xl p-6">
                                <h3 className="font-semibold text-blue-800 mb-3">✏️ Exercices</h3>
                                <ul className="space-y-2">
                                  {parseArrayField(selectedLesson.content?.exercises).map((exercise, index) => (
                                    <li key={index} className="flex items-start">
                                      <span className="font-semibold text-blue-700 mr-3">{index + 1}.</span>
                                      <span className="text-blue-700">{exercise}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {selectedLesson.type === 'interactive' && (
                          <div className="space-y-6">
                            <div className="bg-blue-50 rounded-xl p-6">
                              <h3 className="font-semibold text-blue-800 mb-4">
                                🎮 Exercice interactif
                              </h3>
                              <div className="bg-white rounded-lg p-6">
                                <p className="text-neutral-700 mb-4">
                                  Les exercices interactifs vous permettent de pratiquer immédiatement ce que vous apprenez.
                                </p>
                                <div className="text-center py-8 text-neutral-500">
                                  <div className="text-4xl mb-4">🚧</div>
                                  <p>Contenu interactif en cours de développement</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedLesson.type === 'reading' && (
                          <div className="space-y-6">
                            {/* Transcript principal */}
                            {selectedLesson.content?.transcript && (
                              <div className="prose max-w-none">
                                <div className="bg-white rounded-xl p-6 border border-neutral-200">
                                  <div
                                    className="text-neutral-700 leading-relaxed"
                                    dangerouslySetInnerHTML={{
                                      __html: selectedLesson.content.transcript.replace(/\n/g, '<br />')
                                    }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Objectifs */}
                            {parseArrayField(selectedLesson.objectives).length > 0 && (
                              <div className="bg-blue-50 rounded-xl p-6">
                                <h3 className="font-semibold text-blue-800 mb-3">🎯 Objectifs</h3>
                                <ul className="space-y-2">
                                  {parseArrayField(selectedLesson.objectives).map((obj, i) => (
                                    <li key={i} className="flex items-start">
                                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                                      <span className="text-blue-700">{obj}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Points clés */}
                            {parseArrayField(selectedLesson.content?.keyPoints).length > 0 && (
                              <div className="bg-green-50 rounded-xl p-6">
                                <h3 className="font-semibold text-green-800 mb-3">📝 Points clés</h3>
                                <ul className="space-y-2">
                                  {parseArrayField(selectedLesson.content?.keyPoints).map((point, i) => (
                                    <li key={i} className="flex items-start">
                                      <span className="w-2 h-2 bg-primary-green rounded-full mt-2 mr-3 flex-shrink-0" />
                                      <span className="text-green-700">{point}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Exercices */}
                            {parseArrayField(selectedLesson.content?.exercises).length > 0 && (
                              <div className="bg-yellow-50 rounded-xl p-6">
                                <h3 className="font-semibold text-yellow-800 mb-3">✏️ Exercices</h3>
                                <ul className="space-y-2">
                                  {parseArrayField(selectedLesson.content?.exercises).map((ex, i) => (
                                    <li key={i} className="flex items-start">
                                      <span className="font-semibold text-yellow-700 mr-3">{i + 1}.</span>
                                      <span className="text-yellow-700">{ex}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Ressources */}
                            {parseArrayField(selectedLesson.content?.resources).length > 0 && (
                              <div className="bg-purple-50 rounded-xl p-6">
                                <h3 className="font-semibold text-purple-800 mb-3">📚 Ressources</h3>
                                <ul className="space-y-2">
                                  {parseArrayField(selectedLesson.content?.resources).map((res, i) => (
                                    <li key={i} className="flex items-start">
                                      <span className="text-purple-500 mr-3">•</span>
                                      <span className="text-purple-700">{res}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-6 border-t border-neutral-200">
                          <div className="flex gap-3">
                            {!selectedLesson.completed && (
                              <button
                                className="bg-primary-green text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
                                onClick={markLessonComplete}
                              >
                                Marquer comme terminé
                              </button>
                            )}
                            <button
                              onClick={() => startQuiz(selectedLesson.id)}
                              className="bg-claudine-gold text-white px-6 py-3 rounded-lg hover:bg-yellow-500 transition-colors"
                            >
                              🧠 Faire le quiz
                            </button>
                          </div>
                          
                          {selectedLesson.score && (
                            <div className="text-right">
                              <div className="text-sm text-neutral-500">Dernier score</div>
                              <div className="font-semibold text-green-600">
                                {selectedLesson.score}/100
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'quiz' && (
                    <motion.div
                      key="quiz-content"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="text-center py-12"
                    >
                      <div className="text-6xl mb-6">🧠</div>
                      <h3 className="text-2xl font-bold text-neutral-800 mb-4">
                        Quiz interactif
                      </h3>
                      <p className="text-neutral-600 mb-8 max-w-md mx-auto">
                        Testez vos connaissances avec des questions adaptées à votre niveau et gagnez des points Claudine !
                      </p>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 max-w-md mx-auto">
                        <div className="text-yellow-600 mb-2">🚧 En cours de développement</div>
                        <p className="text-sm text-yellow-700">
                          Les quiz interactifs seront bientôt disponibles !
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}