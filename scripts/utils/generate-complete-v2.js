const fs = require('fs');
const path = require('path');

const v2Content = `/**
 * Page d'apprentissage ULTRA FLUIDE v2.0 🚀
 * Features: Barre de recherche, Table des matières, Raccourcis clavier, KaTeX, localStorage
 * Design Claudyne - Dark theme with glassmorphism
 */

import { useState, useEffect, useRef, useMemo } from 'react';
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

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export default function ApprentissagePage() {
  const router = useRouter();
  const { subjectId } = router.query;
  const { user, isLoading } = useAuth();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const hasLoadedRef = useRef(false);
  const [activeTab, setActiveTab] = useState<'lessons' | 'quiz'>('lessons');

  // 🆕 V2.0 Features
  const [searchQuery, setSearchQuery] = useState('');
  const [tocItems, setTocItems] = useState<TOCItem[]>([]);
  const [showTOC, setShowTOC] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

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

  /**
   * Helper pour rendre une valeur de manière sécurisée
   */
  const renderValue = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'object') {
      if (value.text) return value.text;
      if (value.title) return value.title;
      if (value.content) return value.content;
      if (value.label) return value.label;
      if (value.question) return value.question;
      if (value.description) return value.description;
      return JSON.stringify(value);
    }
    return String(value);
  };

  /**
   * 🆕 Parser markdown AMÉLIORÉ avec génération TOC + support KaTeX
   */
  const parseMarkdown = (markdown: string): { html: string; toc: TOCItem[] } => {
    if (!markdown) return { html: '', toc: [] };

    let html = markdown;
    const toc: TOCItem[] = [];
    let sectionCounter = 0;

    // Headers avec IDs pour la TOC
    html = html.replace(/^### (.+)$/gm, (match, text) => {
      sectionCounter++;
      const id = \`section-\${sectionCounter}\`;
      toc.push({ id, text, level: 3 });
      return \`<h3 id="\${id}" class="text-lg font-semibold text-gray-100 mt-6 mb-3 scroll-mt-24">\${text}</h3>\`;
    });

    html = html.replace(/^## (.+)$/gm, (match, text) => {
      sectionCounter++;
      const id = \`section-\${sectionCounter}\`;
      toc.push({ id, text, level: 2 });
      return \`<h2 id="\${id}" class="text-xl font-bold text-neutral-900 mt-8 mb-4 pb-2 border-b-2 border-primary-green scroll-mt-24">\${text}</h2>\`;
    });

    html = html.replace(/^# (.+)$/gm, (match, text) => {
      sectionCounter++;
      const id = \`section-\${sectionCounter}\`;
      toc.push({ id, text, level: 1 });
      return \`<h1 id="\${id}" class="text-2xl font-bold text-neutral-900 mt-4 mb-6 scroll-mt-24">\${text}</h1>\`;
    });

    // 🆕 KaTeX: Formules BLOCK ($$...$$)
    html = html.replace(/\\$\\$([^$]+)\\$\\$/g, (match, formula) => {
      return \`<div class="katex-block my-4" data-formula="\${formula.trim()}"></div>\`;
    });

    // 🆕 KaTeX: Formules INLINE ($...$)
    html = html.replace(/\\$([^$]+)\\$/g, (match, formula) => {
      return \`<span class="katex-inline" data-formula="\${formula.trim()}"></span>\`;
    });

    // Bold and italic
    html = html.replace(/\\*\\*(.+?)\\*\\*/g, '<strong class="font-semibold text-neutral-900">$1</strong>');
    html = html.replace(/\\*(.+?)\\*/g, '<em class="italic">$1</em>');

    // Code inline (éviter de confondre avec formules)
    html = html.replace(/\`([^\`]+)\`/g, '<code class="bg-neutral-100 px-2 py-1 rounded text-sm font-mono text-primary-green">$1</code>');

    // Links
    html = html.replace(/\\[(.+?)\\]\\((.+?)\\)/g, '<a href="$2" class="text-primary-green hover:underline" target="_blank">$1</a>');

    // Listes non ordonnées
    html = html.replace(/^- (.+)$/gm, '<li class="ml-6 mb-2 list-disc">$1</li>');
    html = html.replace(/(<li class="ml-6 mb-2 list-disc">.+<\\/li>\\n?)+/g, '<ul class="my-4">$&</ul>');

    // Listes ordonnées
    html = html.replace(/^\\d+\\. (.+)$/gm, '<li class="ml-6 mb-2 list-decimal">$1</li>');

    // Paragraphes
    const lines = html.split('\\n');
    const processedLines = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<')) return line;
      if (trimmed.match(/^(#{1,3}|[-*]|\\d+\\.)\\s/)) return line;
      return \`<p class="mb-4 leading-relaxed text-gray-200">\${line}</p>\`;
    });
    html = processedLines.join('\\n');

    return { html, toc };
  };

  /**
   * 🆕 Rendu KaTeX après mise à jour du DOM
   */
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).katex) {
      const katex = (window as any).katex;

      // Rendre les formules block
      document.querySelectorAll('.katex-block').forEach((el) => {
        const formula = el.getAttribute('data-formula');
        if (formula) {
          try {
            katex.render(formula, el, { displayMode: true, throwOnError: false });
          } catch (e) {
            console.error('KaTeX error:', e);
          }
        }
      });

      // Rendre les formules inline
      document.querySelectorAll('.katex-inline').forEach((el) => {
        const formula = el.getAttribute('data-formula');
        if (formula) {
          try {
            katex.render(formula, el, { displayMode: false, throwOnError: false });
          } catch (e) {
            console.error('KaTeX error:', e);
          }
        }
      });
    }
  }, [selectedLesson, isLoadingData]);

  // 🆕 Filtrage des leçons avec recherche ÉTENDUE (optimisé avec useMemo)
  const filteredLessons = useMemo(() => {
    if (!searchQuery.trim()) return lessons;

    const query = searchQuery.toLowerCase();
    return lessons.filter(lesson => {
      const matchTitle = lesson.title.toLowerCase().includes(query);
      const matchDescription = lesson.description.toLowerCase().includes(query);
      const matchType = lesson.type.toLowerCase().includes(query);
      const matchTranscript = lesson.content?.transcript?.toLowerCase().includes(query) || false;
      const matchKeyPoints = lesson.content?.keyPoints?.some((point: any) =>
        String(point).toLowerCase().includes(query)
      ) || false;
      const matchObjectives = lesson.objectives?.some((obj: any) =>
        String(obj).toLowerCase().includes(query)
      ) || false;
      const matchExercises = lesson.content?.exercises?.some((ex: any) =>
        String(ex).toLowerCase().includes(query)
      ) || false;

      return matchTitle || matchDescription || matchType || matchTranscript ||
             matchKeyPoints || matchObjectives || matchExercises;
    });
  }, [lessons, searchQuery]);

  // 🆕 Statistiques améliorées
  const stats = useMemo(() => {
    const completed = lessons.filter(l => l.completed).length;
    const total = lessons.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const remaining = total - completed;
    const totalTime = lessons.reduce((sum, l) => sum + l.estimatedDuration, 0);
    const remainingTime = lessons
      .filter(l => !l.completed)
      .reduce((sum, l) => sum + l.estimatedDuration, 0);

    return { completed, total, percentage, remaining, totalTime, remainingTime };
  }, [lessons]);

  // 🆕 Navigation leçon précédente/suivante
  const getCurrentLessonIndex = () => {
    return lessons.findIndex(l => l.id === selectedLesson?.id);
  };

  const goToPreviousLesson = () => {
    const currentIndex = getCurrentLessonIndex();
    if (currentIndex > 0) {
      handleLessonSelect(lessons[currentIndex - 1]);
    }
  };

  const goToNextLesson = () => {
    const currentIndex = getCurrentLessonIndex();
    if (currentIndex >= 0 && currentIndex < lessons.length - 1) {
      handleLessonSelect(lessons[currentIndex + 1]);
    }
  };

  // 🆕 Scroll vers section de la TOC
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      });
    }
  };

  // 🆕 localStorage: Restaurer l'état au chargement
  useEffect(() => {
    const savedFocusMode = localStorage.getItem('claudyne_focusMode');
    const savedShowTOC = localStorage.getItem('claudyne_showTOC');

    if (savedFocusMode !== null) setIsFocusMode(savedFocusMode === 'true');
    if (savedShowTOC !== null) setShowTOC(savedShowTOC === 'true');
  }, []);

  // 🆕 localStorage: Sauvegarder l'état quand il change
  useEffect(() => {
    localStorage.setItem('claudyne_focusMode', String(isFocusMode));
  }, [isFocusMode]);

  useEffect(() => {
    localStorage.setItem('claudyne_showTOC', String(showTOC));
  }, [showTOC]);

  useEffect(() => {
    if (selectedLesson) {
      localStorage.setItem('claudyne_lastLessonId', String(selectedLesson.id));
    }
  }, [selectedLesson]);

  // 🆕 Raccourcis clavier
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case 'ArrowLeft':
          if (getCurrentLessonIndex() > 0) {
            goToPreviousLesson();
          }
          break;
        case 'ArrowRight':
          if (getCurrentLessonIndex() >= 0 && getCurrentLessonIndex() < lessons.length - 1) {
            goToNextLesson();
          }
          break;
        case 'f':
        case 'F':
          setIsFocusMode(prev => !prev);
          break;
        case 't':
        case 'T':
          setShowTOC(prev => !prev);
          break;
        case 'k':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            document.getElementById('search-input')?.focus();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [lessons, selectedLesson]);

  // Redirection si non connecté
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  // Charger les données de la matière
  useEffect(() => {
    if (subjectId && user && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
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

        // Restaurer la dernière leçon vue si disponible
        const savedLastLesson = localStorage.getItem('claudyne_lastLessonId');
        if (savedLastLesson && lessonsList.length > 0) {
          const lastLesson = lessonsList.find((l: Lesson) => l.id === parseInt(savedLastLesson));
          if (lastLesson) {
            await handleLessonSelect(lastLesson);
            return;
          }
        }

        // Sinon charger la première leçon
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

      const response = await apiService.getLesson(subjectId as string, lesson.id);

      if (response.success && response.data) {
        const fullLesson = response.data.lesson || response.data;
        setSelectedLesson(fullLesson);

        // 🆕 Générer la TOC pour cette leçon
        if (fullLesson.content?.transcript) {
          const { toc } = parseMarkdown(fullLesson.content.transcript);
          setTocItems(toc);
        }
      } else {
        setSelectedLesson(lesson);
      }
    } catch (error: any) {
      console.error('Erreur chargement leçon:', error);
      toast.error('Erreur lors du chargement de la leçon');
      setSelectedLesson(lesson);
    } finally {
      setIsLoadingData(false);
    }
  };

  const startQuiz = async (lessonId: number) => {
    router.push(\`/quiz/\${lessonId}\`);
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
          <h1 className="text-2xl font-bold text-gray-100 mb-4">
            Matière non trouvée
          </h1>
          <p className="text-gray-300 mb-6">
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
        <meta name="description" content={\`Cours de \${subject.title} - \${subject.description}\`} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@100;400;700;900&display=swap" rel="stylesheet" />

        {/* 🆕 KaTeX CDN */}
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV" crossOrigin="anonymous" />
        <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js" integrity="sha384-XjKyOOlGwcjNTAIQHIpgOno0Hl1YQqzUOEleOLALmuqehneUG+vnGctmUb0ZY0l8" crossOrigin="anonymous"></script>
      </Head>

      <Layout>
        <div className="claudyne-learning-page min-h-screen p-4 md:p-8">
          {/* 🆕 Breadcrumbs */}
          <div className="mb-4 text-sm text-gray-400">
            <Link href="/famille" className="hover:text-gray-200 transition-colors">
              Dashboard
            </Link>
            <span className="mx-2">›</span>
            <span className="text-gray-200">{subject.title}</span>
            {selectedLesson && (
              <>
                <span className="mx-2">›</span>
                <span className="text-gray-200">{selectedLesson.title}</span>
              </>
            )}
          </div>

          {/* Hero Header */}
          <div className="claudyne-hero-header claudyne-animate-in mb-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="claudyne-subject-icon">
                {subject.icon}
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="claudyne-gradient-text text-4xl md:text-5xl mb-2">
                  {subject.title}
                </h1>
                <p className="text-lg text-gray-300 mb-4">{subject.description}</p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start items-center">
                  <span className="claudyne-lesson-type-badge">{subject.difficulty}</span>
                  <span className="text-gray-400">📚 {lessons.length} leçons</span>
                  <span className="text-gray-400">🎯 {subject.category}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 🆕 Statistiques améliorées */}
          <div className="claudyne-progress-container claudyne-animate-in mb-6">
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold text-lg">Progression du cours</span>
              <span className="text-2xl font-bold claudyne-gradient-text">{stats.percentage}%</span>
            </div>
            <div className="claudyne-progress-bar-bg">
              <div className="claudyne-progress-bar-fill" style={{ width: \`\${stats.percentage}%\` }} />
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-400">
              <span>✅ {stats.completed} / {stats.total} leçons terminées</span>
              <span>📖 {stats.remaining} leçons restantes</span>
              <span>⏱️ {stats.remainingTime} min restantes</span>
            </div>
          </div>

          {/* 🆕 Barre de recherche */}
          <div className="mb-6">
            <div className="relative">
              <input
                id="search-input"
                type="text"
                placeholder="🔍 Rechercher une leçon... (Ctrl+K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent transition-all"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                🔍
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  aria-label="Effacer la recherche"
                >
                  ✕
                </button>
              )}
            </div>
            {searchQuery && (
              <div className="mt-2 text-sm text-gray-400">
                {filteredLessons.length} résultat{filteredLessons.length !== 1 ? 's' : ''} trouvé{filteredLessons.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* 🆕 Indicateur mode focus et raccourcis */}
          <div className="mb-4 flex flex-wrap gap-2 text-xs text-gray-500">
            <span>💡 Raccourcis: ← → (navigation) • F (focus) • T (table des matières) • Ctrl+K (recherche)</span>
            {isFocusMode && <span className="text-primary-green">🎯 Mode Focus activé</span>}
          </div>

          <div className={\`grid gap-8 mt-8 transition-all \${isFocusMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-4'}\`}>
            {/* Sidebar - Liste des leçons */}
            {!isFocusMode && (
              <div className="lg:col-span-1">
                <div className="claudyne-glass-card sticky top-6">
                  <div>
                    <h3 className="claudyne-section-title text-lg mb-4">
                      <span className="claudyne-section-icon" aria-hidden="true">📚</span>
                      Leçons ({filteredLessons.length})
                    </h3>
                    <nav role="navigation" aria-label="Liste des leçons" className="space-y-2 max-h-[600px] overflow-y-auto claudyne-scrollbar pr-2">
                      {filteredLessons.map((lesson, index) => (
                        <motion.div
                          key={lesson.id}
                          whileHover={{ scale: 1.02, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleLessonSelect(lesson)}
                          className={\`claudyne-lesson-card \${
                            selectedLesson?.id === lesson.id ? 'active' : ''
                          } \${lesson.completed ? 'claudyne-completed' : ''}\`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="claudyne-lesson-number" aria-hidden="true">
                              {lesson.completed ? '✓' : index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm leading-tight mb-2 text-gray-100">
                                {lesson.title}
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  ⏱️ {lesson.estimatedDuration} min
                                </span>
                                <span className={\`claudyne-lesson-type-badge \${lesson.type}\`}>
                                  {lesson.type === 'video' ? '🎥 Vidéo' : lesson.type === 'interactive' ? '🎮 Interactif' : '📖 Lecture'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </nav>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-800">
                    <Link href="/famille">
                      <div className="flex items-center text-gray-400 hover:text-gray-200 transition-colors text-sm font-medium">
                        <span className="mr-2">←</span>
                        Retour au tableau de bord
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Contenu principal */}
            <div className={isFocusMode ? 'col-span-1 max-w-4xl mx-auto w-full' : 'lg:col-span-3'}>
              {/* Onglets */}
              <div className="claudyne-tabs" role="tablist" aria-label="Sections de la leçon">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'lessons'}
                  aria-controls="lessons-panel"
                  onClick={() => setActiveTab('lessons')}
                  className={\`claudyne-tab \${activeTab === 'lessons' ? 'active' : ''}\`}
                >
                  📖 Contenu de la leçon
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'quiz'}
                  aria-controls="quiz-panel"
                  onClick={() => setActiveTab('quiz')}
                  className={\`claudyne-tab \${activeTab === 'quiz' ? 'active' : ''}\`}
                  disabled={!selectedLesson}
                  aria-disabled={!selectedLesson}
                >
                  🧠 Quiz
                </button>
              </div>

              {/* Contenu des onglets */}
              <div>
                <AnimatePresence mode="wait">
                  {isLoadingData && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-12"
                    >
                      <LoadingSpinner size="lg" />
                      <p className="text-gray-300 mt-4">Chargement de la leçon...</p>
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
                      {/* 🆕 Navigation Précédent/Suivant */}
                      <div className="flex justify-between items-center mb-6">
                        <button
                          type="button"
                          onClick={goToPreviousLesson}
                          disabled={getCurrentLessonIndex() === 0}
                          className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label="Leçon précédente"
                        >
                          ← Précédent
                        </button>
                        <button
                          type="button"
                          onClick={goToNextLesson}
                          disabled={getCurrentLessonIndex() === lessons.length - 1}
                          className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label="Leçon suivante"
                        >
                          Suivant →
                        </button>
                      </div>

                      {/* En-tête de la leçon */}
                      <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h2 className="text-2xl font-bold text-gray-100">
                              {selectedLesson.title}
                            </h2>
                            <p className="text-gray-300 mt-2">
                              {selectedLesson.description}
                            </p>
                          </div>
                          <div className="text-sm text-gray-400">
                            {selectedLesson.estimatedDuration} minutes
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <span className={\`px-3 py-1 rounded-full text-xs font-medium \${
                            selectedLesson.type === 'video'
                              ? 'bg-red-100 text-red-700'
                              : selectedLesson.type === 'interactive'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }\`}>
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

                      {/* 🆕 Table des matières flottante */}
                      {showTOC && tocItems.length > 0 && (
                        <div className="mb-6 bg-gray-800/30 border border-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-100">📑 Table des matières</h3>
                            <button
                              type="button"
                              onClick={() => setShowTOC(false)}
                              className="text-gray-500 hover:text-gray-300 text-sm"
                              aria-label="Masquer la table des matières"
                            >
                              Masquer
                            </button>
                          </div>
                          <nav role="navigation" aria-label="Table des matières">
                            <div className="space-y-2">
                              {tocItems.map((item, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => scrollToSection(item.id)}
                                  className={\`block w-full text-left text-sm text-gray-400 hover:text-primary-green transition-colors \${
                                    item.level === 1 ? 'font-semibold' : item.level === 2 ? 'pl-4' : 'pl-8'
                                  }\`}
                                >
                                  {item.text}
                                </button>
                              ))}
                            </div>
                          </nav>
                        </div>
                      )}

                      {/* Contenu de la leçon */}
                      <div className="space-y-6" ref={contentRef}>
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

                            {selectedLesson.content?.transcript && (
                              <div className="claudyne-content-section">
                                <h3 className="claudyne-section-title">
                                  <span className="claudyne-section-icon" aria-hidden="true">📄</span>
                                  Transcription
                                </h3>
                                <div
                                  className="claudyne-markdown-content"
                                  dangerouslySetInnerHTML={{
                                    __html: parseMarkdown(selectedLesson.content.transcript).html
                                  }}
                                />
                              </div>
                            )}

                            {parseArrayField(selectedLesson.content?.keyPoints).length > 0 && (
                              <div className="claudyne-content-section">
                                <h3 className="claudyne-section-title">
                                  <span className="claudyne-section-icon" aria-hidden="true">📝</span>
                                  Points clés à retenir
                                </h3>
                                <div className="space-y-3">
                                  {parseArrayField(selectedLesson.content?.keyPoints).map((point: string, index: number) => (
                                    <div key={index} className="claudyne-objective-item">
                                      <span className="claudyne-objective-icon" aria-hidden="true">✓</span>
                                      <span className="text-gray-200">{renderValue(point)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {parseArrayField(selectedLesson.content?.exercises).length > 0 && (
                              <div className="claudyne-content-section">
                                <h3 className="claudyne-section-title">
                                  <span className="claudyne-section-icon" aria-hidden="true">✏️</span>
                                  Exercices
                                </h3>
                                <div className="space-y-3">
                                  {parseArrayField(selectedLesson.content?.exercises).map((exercise, index) => (
                                    <div key={index} className="claudyne-objective-item">
                                      <span className="claudyne-objective-icon" aria-hidden="true">{index + 1}</span>
                                      <span className="text-gray-200">{renderValue(exercise)}</span>
                                    </div>
                                  ))}
                                </div>
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
                                <p className="text-gray-200 mb-4">
                                  Les exercices interactifs vous permettent de pratiquer immédiatement ce que vous apprenez.
                                </p>
                                <div className="text-center py-8 text-gray-400">
                                  <div className="text-4xl mb-4">🚧</div>
                                  <p>Contenu interactif en cours de développement</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedLesson.type === 'reading' && (
                          <div className="space-y-6">
                            {selectedLesson.content?.transcript && (
                              <div className="claudyne-content-section">
                                <div
                                  className="claudyne-markdown-content"
                                  dangerouslySetInnerHTML={{
                                    __html: parseMarkdown(selectedLesson.content.transcript).html
                                  }}
                                />
                              </div>
                            )}

                            {parseArrayField(selectedLesson.objectives).length > 0 && (
                              <div className="claudyne-content-section">
                                <h3 className="claudyne-section-title">
                                  <span className="claudyne-section-icon" aria-hidden="true">🎯</span>
                                  Objectifs d'apprentissage
                                </h3>
                                <div className="space-y-3">
                                  {parseArrayField(selectedLesson.objectives).map((obj, i) => (
                                    <div key={i} className="claudyne-objective-item">
                                      <span className="claudyne-objective-icon" aria-hidden="true">→</span>
                                      <span className="text-gray-200">{renderValue(obj)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {parseArrayField(selectedLesson.content?.keyPoints).length > 0 && (
                              <div className="bg-green-50 rounded-xl p-6">
                                <h3 className="font-semibold text-green-800 mb-3">📝 Points clés</h3>
                                <ul className="space-y-2">
                                  {parseArrayField(selectedLesson.content?.keyPoints).map((point, i) => (
                                    <li key={i} className="flex items-start">
                                      <span className="w-2 h-2 bg-primary-green rounded-full mt-2 mr-3 flex-shrink-0" />
                                      <span className="text-green-700">{renderValue(point)}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {parseArrayField(selectedLesson.content?.exercises).length > 0 && (
                              <div className="bg-yellow-50 rounded-xl p-6">
                                <h3 className="font-semibold text-yellow-800 mb-3">✏️ Exercices</h3>
                                <ul className="space-y-2">
                                  {parseArrayField(selectedLesson.content?.exercises).map((ex, i) => (
                                    <li key={i} className="flex items-start">
                                      <span className="font-semibold text-yellow-700 mr-3">{i + 1}.</span>
                                      <span className="text-yellow-700">{renderValue(ex)}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {parseArrayField(selectedLesson.content?.resources).length > 0 && (
                              <div className="bg-purple-50 rounded-xl p-6">
                                <h3 className="font-semibold text-purple-800 mb-3">📚 Ressources</h3>
                                <ul className="space-y-2">
                                  {parseArrayField(selectedLesson.content?.resources).map((res, i) => (
                                    <li key={i} className="flex items-start">
                                      <span className="text-purple-500 mr-3">•</span>
                                      <span className="text-purple-700">{renderValue(res)}</span>
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
                                type="button"
                                className="bg-primary-green text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
                                onClick={markLessonComplete}
                                aria-label="Marquer la leçon comme terminée"
                              >
                                Marquer comme terminé
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => startQuiz(selectedLesson.id)}
                              className="bg-claudine-gold text-white px-6 py-3 rounded-lg hover:bg-yellow-500 transition-colors"
                              aria-label="Commencer le quiz"
                            >
                              🧠 Faire le quiz
                            </button>
                          </div>

                          {selectedLesson.score && (
                            <div className="text-right">
                              <div className="text-sm text-gray-400">Dernier score</div>
                              <div className="font-semibold text-green-600">
                                {selectedLesson.score}/100
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 🆕 Navigation Précédent/Suivant (bas de page) */}
                      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-800">
                        <button
                          type="button"
                          onClick={goToPreviousLesson}
                          disabled={getCurrentLessonIndex() === 0}
                          className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label="Leçon précédente"
                        >
                          ← Précédent
                        </button>
                        <button
                          type="button"
                          onClick={goToNextLesson}
                          disabled={getCurrentLessonIndex() === lessons.length - 1}
                          className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label="Leçon suivante"
                        >
                          Suivant →
                        </button>
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
                      <h3 className="text-2xl font-bold text-gray-100 mb-4">
                        Quiz interactif
                      </h3>
                      <p className="text-gray-300 mb-8 max-w-md mx-auto">
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
`;

// Écrire le fichier
const outputPath = path.join(__dirname, 'frontend/pages/apprentissage/[subjectId]-ULTRA-FLUIDE-V2.tsx');
fs.writeFileSync(outputPath, v2Content, 'utf8');

console.log('COMPLETE V2.0 FILE GENERATED!');
console.log('File:', outputPath);
console.log('Size:', fs.statSync(outputPath).size, 'bytes');
console.log('\n=== FEATURES INCLUDED ===');
console.log('PHASE 1:');
console.log('  - type="button" on all buttons');
console.log('  - ARIA roles & labels (tab, navigation, aria-label, aria-hidden)');
console.log('  - localStorage persistence (focusMode, showTOC, lastLessonId)');
console.log('  - Extended search (title, description, transcript, keyPoints, objectives, exercises)');
console.log('\nPHASE 2:');
console.log('  - KaTeX integration (CDN in Head)');
console.log('  - Math formula rendering (inline $...$ and block $$...$$)');
console.log('  - Auto-render after DOM update');
console.log('\nUI V2.0:');
console.log('  - Breadcrumbs navigation');
console.log('  - Search bar with clear button');
console.log('  - Improved stats (completed, remaining lessons & time)');
console.log('  - Focus mode (hide sidebar)');
console.log('  - Table of contents (auto-generated from markdown)');
console.log('  - Keyboard shortcuts (Arrows, F, T, Ctrl+K)');
console.log('  - Previous/Next navigation buttons');
console.log('  - Shortcuts indicator');
