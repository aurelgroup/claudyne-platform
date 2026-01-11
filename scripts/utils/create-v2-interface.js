const fs = require('fs');
const path = require('path');

// Lire le fichier backup original
const backupPath = path.join(__dirname, 'frontend/pages/apprentissage/[subjectId].tsx.backup');
const v2Path = path.join(__dirname, 'frontend/pages/apprentissage/[subjectId]-v2.tsx');

let content = fs.readFileSync(backupPath, 'utf8');

// 1. Mettre à jour le header
content = content.replace(
  `/**
 * Page d'apprentissage pour une matière spécifique
 * Affiche les leçons et permet de naviguer dans le contenu pédagogique
 * Design Claudyne - Dark theme with glassmorphism
 */`,
  `/**
 * Page d'apprentissage ULTRA FLUIDE v2.0
 * 🚀 Nouvelle version avec barre de recherche, table des matières, et raccourcis clavier
 * Design Claudyne - Dark theme with glassmorphism
 */`
);

// 2. Ajouter useMemo aux imports
content = content.replace(
  `import { useState, useEffect, useRef } from 'react';`,
  `import { useState, useEffect, useRef, useMemo } from 'react';`
);

// 3. Ajouter l'interface TOCItem après l'interface Subject
const tocInterface = `

interface TOCItem {
  id: string;
  text: string;
  level: number;
}`;

content = content.replace(
  `interface Subject {
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
}`,
  `interface Subject {
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
}${tocInterface}`
);

// 4. Ajouter les nouveaux états après activeTab
content = content.replace(
  `const [activeTab, setActiveTab] = useState<'lessons' | 'quiz'>('lessons');`,
  `const [activeTab, setActiveTab] = useState<'lessons' | 'quiz'>('lessons');

  // 🆕 V2.0 Features
  const [searchQuery, setSearchQuery] = useState('');
  const [tocItems, setTocItems] = useState<TOCItem[]>([]);
  const [showTOC, setShowTOC] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);`
);

// 5. Remplacer la fonction parseMarkdown pour inclure la génération de TOC
const oldParseMarkdown = `  /**
   * Parser markdown simple pour rendre le contenu de manière lisible
   */
  const parseMarkdown = (markdown: string): string => {
    if (!markdown) return '';

    let html = markdown;

    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-gray-100 mt-6 mb-3">$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-neutral-900 mt-8 mb-4 pb-2 border-b-2 border-primary-green">$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-neutral-900 mt-4 mb-6">$1</h1>');`;

const newParseMarkdown = `  /**
   * 🆕 Parser markdown AMÉLIORÉ avec génération de TOC
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
    });`;

content = content.replace(oldParseMarkdown, newParseMarkdown);

// 6. Mettre à jour tous les appels à parseMarkdown pour utiliser .html
content = content.replace(
  /parseMarkdown\(([^)]+)\)/g,
  'parseMarkdown($1).html'
);

// 7. Ajouter les fonctions de filtrage et stats après parseMarkdown
const additionalFunctions = `

  // 🆕 Filtrage des leçons avec recherche (optimisé avec useMemo)
  const filteredLessons = useMemo(() => {
    if (!searchQuery.trim()) return lessons;

    const query = searchQuery.toLowerCase();
    return lessons.filter(lesson =>
      lesson.title.toLowerCase().includes(query) ||
      lesson.description.toLowerCase().includes(query) ||
      lesson.type.toLowerCase().includes(query)
    );
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
  };`;

// Insérer après la définition de parseMarkdown (avant la redirection)
content = content.replace(
  `  // Redirection si non connecté`,
  `${additionalFunctions}

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

  // Redirection si non connecté`
);

// 8. Modifier handleLessonSelect pour générer la TOC
content = content.replace(
  `      if (response.success && response.data) {
        const fullLesson = response.data.lesson || response.data;
        setSelectedLesson(fullLesson);
      } else {
        setSelectedLesson(lesson);
      }`,
  `      if (response.success && response.data) {
        const fullLesson = response.data.lesson || response.data;
        setSelectedLesson(fullLesson);

        // 🆕 Générer la TOC pour cette leçon
        if (fullLesson.content?.transcript) {
          const { toc } = parseMarkdown(fullLesson.content.transcript);
          setTocItems(toc);
        }
      } else {
        setSelectedLesson(lesson);
      }`
);

// 9. Ajouter breadcrumbs avant Hero Header
content = content.replace(
  `      <Layout>
        <div className="claudyne-learning-page min-h-screen p-4 md:p-8">
          {/* Hero Header */}`,
  `      <Layout>
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

          {/* Hero Header */}`
);

// 10. Remplacer la barre de progression par la version améliorée
content = content.replace(
  `          {/* Progress Bar */}
          <div className="claudyne-progress-container claudyne-animate-in">
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold text-lg">Progression du cours</span>
              <span className="text-2xl font-bold claudyne-gradient-text">{(subject.progress || 0)}%</span>
            </div>
            <div className="claudyne-progress-bar-bg">
              <div className="claudyne-progress-bar-fill" style={{ width: \`\${(subject.progress || 0)}%\` }} />
            </div>
            <div className="mt-2 text-sm text-gray-400">
              {Math.ceil(lessons.length * (subject.progress || 0) / 100)} / {lessons.length} leçons terminées
            </div>
          </div>`,
  `          {/* 🆕 Statistiques améliorées */}
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
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
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
          </div>`
);

// 11. Modifier la grille principale pour supporter le mode focus
content = content.replace(
  `        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8">`,
  `        <div className={\`grid gap-8 mt-8 transition-all \${isFocusMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-4'}\`}>`
);

// 12. Conditionner l'affichage du sidebar avec le mode focus
content = content.replace(
  `          {/* Sidebar - Liste des leçons */}
          <div className="lg:col-span-1">`,
  `          {/* Sidebar - Liste des leçons */}
          {!isFocusMode && (
          <div className="lg:col-span-1">`
);

// 13. Fermer la condition du sidebar
content = content.replace(
  `                </div>
              </div>
            </div>
          </div>

          {/* Contenu principal */}`,
  `                </div>
              </div>
            </div>
          </div>
          )}\n
          {/* Contenu principal */}`
);

// 14. Modifier le contenu principal pour supporter le mode focus
content = content.replace(
  `          {/* Contenu principal */}
          <div className="lg:col-span-3" >`,
  `          {/* Contenu principal */}
          <div className={isFocusMode ? 'col-span-1 max-w-4xl mx-auto w-full' : 'lg:col-span-3'}>`
);

// 15. Utiliser filteredLessons au lieu de lessons dans la sidebar
content = content.replace(
  `                    <h3 className="claudyne-section-title text-lg mb-4">
                      <span className="claudyne-section-icon">📚</span>
                      Leçons ({lessons.length})
                    </h3>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto claudyne-scrollbar pr-2">
                      {lessons.map((lesson, index) => (`,
  `                    <h3 className="claudyne-section-title text-lg mb-4">
                      <span className="claudyne-section-icon">📚</span>
                      Leçons ({filteredLessons.length})
                    </h3>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto claudyne-scrollbar pr-2">
                      {filteredLessons.map((lesson, index) => (`
);

// Écrire le fichier modifié
fs.writeFileSync(v2Path, content, 'utf8');

console.log('✅ Fichier v2 créé avec succès!');
console.log('📍 Chemin:', v2Path);
console.log('📏 Taille:', fs.statSync(v2Path).size, 'octets');
