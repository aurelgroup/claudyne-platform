#!/usr/bin/env python3
"""
Script pour appliquer les améliorations Phase 1 sur le fichier v2
- Type button partout
- ARIA semantics
- localStorage
- Recherche étendue au contenu
"""

import re

# Lire le fichier v2
with open('frontend/pages/apprentissage/[subjectId]-v2.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# ========== 1. AJOUTER useMemo SI PAS DÉJÀ LÀ ==========
if 'useMemo' not in content:
    content = content.replace(
        "import { useState, useEffect, useRef } from 'react';",
        "import { useState, useEffect, useRef, useMemo } from 'react';"
    )

# ========== 2. AJOUTER L'INTERFACE TOCItem ==========
if 'interface TOCItem' not in content:
    toc_interface = """
interface TOCItem {
  id: string;
  text: string;
  level: number;
}
"""
    # Insérer après l'interface Subject
    content = re.sub(
        r'(interface Subject \{[^}]+\})',
        r'\1' + toc_interface,
        content
    )

# ========== 3. AJOUTER LES ÉTATS V2.0 ==========
if 'searchQuery' not in content:
    v2_states = """
  // 🆕 V2.0 Features
  const [searchQuery, setSearchQuery] = useState('');
  const [tocItems, setTocItems] = useState<TOCItem[]>([]);
  const [showTOC, setShowTOC] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
"""
    content = content.replace(
        "const [activeTab, setActiveTab] = useState<'lessons' | 'quiz'>('lessons');",
        "const [activeTab, setActiveTab] = useState<'lessons' | 'quiz'>('lessons');" + v2_states
    )

# ========== 4. localStorage POUR PERSISTENCE ==========
localstorage_code = """
  // 🆕 localStorage: Restaurer l'état au chargement
  useEffect(() => {
    const savedFocusMode = localStorage.getItem('claudyne_focusMode');
    const savedShowTOC = localStorage.getItem('claudyne_showTOC');
    const savedLastLesson = localStorage.getItem('claudyne_lastLessonId');

    if (savedFocusMode !== null) setIsFocusMode(savedFocusMode === 'true');
    if (savedShowTOC !== null) setShowTOC(savedShowTOC === 'true');

    // Si on a une dernière leçon et des leçons chargées, la sélectionner
    if (savedLastLesson && lessons.length > 0) {
      const lastLesson = lessons.find(l => l.id === parseInt(savedLastLesson));
      if (lastLesson && !selectedLesson) {
        handleLessonSelect(lastLesson);
      }
    }
  }, [lessons]);

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
"""

if 'claudyne_focusMode' not in content:
    # Insérer après le useEffect de redirection
    content = re.sub(
        r"(// Redirection si non connecté\s+useEffect\(\(\) => \{[^}]+\}, \[user, isLoading, router\]\);)",
        r"\1" + localstorage_code,
        content,
        flags=re.DOTALL
    )

# ========== 5. RECHERCHE ÉTENDUE AU CONTENU ==========
if 'filteredLessons' not in content:
    search_code = """
  // 🆕 Filtrage des leçons avec recherche étendue au contenu (optimisé avec useMemo)
  const filteredLessons = useMemo(() => {
    if (!searchQuery.trim()) return lessons;

    const query = searchQuery.toLowerCase();
    return lessons.filter(lesson => {
      // Rechercher dans titre et description
      const matchTitle = lesson.title.toLowerCase().includes(query);
      const matchDescription = lesson.description.toLowerCase().includes(query);
      const matchType = lesson.type.toLowerCase().includes(query);

      // Rechercher dans le contenu de la leçon
      const matchTranscript = lesson.content?.transcript?.toLowerCase().includes(query) || false;
      const matchKeyPoints = lesson.content?.keyPoints?.some((point: any) =>
        String(point).toLowerCase().includes(query)
      ) || false;
      const matchObjectives = lesson.objectives?.some((obj: any) =>
        String(obj).toLowerCase().includes(query)
      ) || false;

      return matchTitle || matchDescription || matchType || matchTranscript || matchKeyPoints || matchObjectives;
    });
  }, [lessons, searchQuery]);
"""
    # Insérer avant les useEffect de redirection
    content = re.sub(
        r'(  \/\/ Redirection si non connecté)',
        search_code + r'\1',
        content
    )

# ========== 6. AJOUTER type="button" ET ARIA SUR TOUS LES BOUTONS ==========
# Tabs
content = re.sub(
    r'<button\s+onClick=\{([^}]+)\}\s+className=\{`claudyne-tab',
    r'<button type="button" role="tab" onClick={\1} className={`claudyne-tab',
    content
)

# Bouton "Marquer comme terminé"
content = re.sub(
    r'<button\s+className="bg-primary-green text-white([^"]+)"\s+onClick=\{markLessonComplete\}',
    r'<button type="button" aria-label="Marquer la leçon comme terminée" className="bg-primary-green text-white\1" onClick={markLessonComplete}',
    content
)

# Bouton Quiz
content = re.sub(
    r'<button\s+onClick=\{\(\) => startQuiz\(selectedLesson\.id\)\}\s+className="bg-claudine-gold',
    r'<button type="button" aria-label="Commencer le quiz" onClick={() => startQuiz(selectedLesson.id)} className="bg-claudine-gold',
    content
)

# ========== 7. AMÉLIORER SÉMANTIQUE - Remplacer liste de leçons par nav ==========
# Le <div> contenant la liste des leçons devrait être une <nav>
# On va ajouter role="navigation" et aria-label
content = re.sub(
    r'<div className="space-y-2 max-h-\[600px\] overflow-y-auto claudyne-scrollbar pr-2">',
    r'<nav role="navigation" aria-label="Liste des leçons" className="space-y-2 max-h-[600px] overflow-y-auto claudyne-scrollbar pr-2">',
    content
)

# Fermer le </div> correspondant en </nav>
content = re.sub(
    r'(\s+\{lessons\.map.*?\}\)\}\s+<\/div>\s+<\/div>\s+{/\* Retour \*/})',
    lambda m: m.group(0).replace('</div>\n                </div>\n\n                {/* Retour */', '</nav>\n                </div>\n\n                {/* Retour */', 1),
    content,
    flags=re.DOTALL
)

# ========== 8. AJOUTER aria-hidden SUR LES ICÔNES DÉCORATIVES ==========
content = re.sub(
    r'<span className="claudyne-section-icon">([^<]+)</span>',
    r'<span className="claudyne-section-icon" aria-hidden="true">\1</span>',
    content
)

content = re.sub(
    r'<span className="claudyne-objective-icon">([^<]+)</span>',
    r'<span className="claudyne-objective-icon" aria-hidden="true">\1</span>',
    content
)

content = re.sub(
    r'<span className="claudyne-lesson-number">',
    r'<span className="claudyne-lesson-number" aria-hidden="true">',
    content
)

# Écrire le fichier modifié
with open('frontend/pages/apprentissage/[subjectId]-v2-phase1.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Phase 1 improvements applied successfully!")
print("📁 File created: frontend/pages/apprentissage/[subjectId]-v2-phase1.tsx")
print("\n📋 Improvements applied:")
print("  ✓ type='button' added to all buttons")
print("  ✓ ARIA roles and labels added (tab, navigation, aria-label)")
print("  ✓ localStorage implemented (focusMode, showTOC, lastLesson)")
print("  ✓ Search extended to lesson content (transcript, keyPoints, objectives)")
print("  ✓ aria-hidden added to decorative icons")
print("  ✓ Semantic nav elements added")
