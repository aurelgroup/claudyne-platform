const fs = require('fs');

console.log('🚀 Injection des filtres V2 (sans boucle infinie)\n');

const inputFile = '/opt/claudyne/admin-interface.html';
const backupFile = `/opt/claudyne/admin-interface.backup.v2.${Date.now()}.html`;

// Créer backup
console.log('💾 Création backup...');
fs.copyFileSync(inputFile, backupFile);

// Lire le fichier
console.log('📖 Lecture du fichier...');
let content = fs.readFileSync(inputFile, 'utf8');

// HTML des filtres
const filtersHTML = `
                    <!-- Filtres de contenu -->
                    <div id="content-filters" style="padding: 1.5rem; background: #F9FAFB; border-radius: 8px; margin-bottom: 1.5rem; border: 1px solid #E5E7EB;">
                        <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: center;">
                            <div style="flex: 1; min-width: 200px;">
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151;">Catégorie</label>
                                <select id="contentCategoryFilter" style="width: 100%; padding: 0.75rem; border: 1px solid #D1D5DB; border-radius: 6px; background: white; color: #1F2937;">
                                    <option value="">Toutes les catégories</option>
                                    <option value="Sciences">Sciences</option>
                                    <option value="Langues">Langues</option>
                                    <option value="Sciences Humaines">Sciences Humaines</option>
                                </select>
                            </div>
                            <div style="flex: 1; min-width: 200px;">
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151;">Niveau</label>
                                <select id="contentLevelFilter" style="width: 100%; padding: 0.75rem; border: 1px solid #D1D5DB; border-radius: 6px; background: white; color: #1F2937;">
                                    <option value="">Tous les niveaux</option>
                                    <option value="CP">CP</option>
                                    <option value="CE1">CE1</option>
                                    <option value="CE2">CE2</option>
                                    <option value="CM1">CM1</option>
                                    <option value="CM2">CM2</option>
                                    <option value="6ème">6ème</option>
                                    <option value="5ème">5ème</option>
                                    <option value="4ème">4ème</option>
                                    <option value="3ème">3ème</option>
                                    <option value="2nde">2nde</option>
                                    <option value="1ère">1ère</option>
                                    <option value="Tle">Tle</option>
                                </select>
                            </div>
                            <div style="flex: 1; min-width: 200px;">
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151;">Recherche</label>
                                <input type="text" id="contentSearchFilter" placeholder="Rechercher une matière..." style="width: 100%; padding: 0.75rem; border: 1px solid #D1D5DB; border-radius: 6px; color: #1F2937;">
                            </div>
                            <div style="display: flex; align-items: flex-end;">
                                <button id="resetFiltersBtn" style="padding: 0.75rem 1.5rem; background: #6B7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                                    Réinitialiser
                                </button>
                            </div>
                        </div>
                        <div id="filterSummary" style="margin-top: 1rem; color: #6B7280; font-size: 0.875rem;"></div>
                    </div>
`;

// JavaScript des filtres (VERSION CORRIGÉE SANS RÉCURSION)
const filtersJS = `
        // === FILTRES DE CONTENU V2 (SANS RÉCURSION) ===
        let allSubjectsGlobal = [];
        let isFilteringInProgress = false;

        function initContentFilters() {
            // Attacher les événements
            const categoryFilter = document.getElementById('contentCategoryFilter');
            const levelFilter = document.getElementById('contentLevelFilter');
            const searchFilter = document.getElementById('contentSearchFilter');
            const resetBtn = document.getElementById('resetFiltersBtn');

            if (categoryFilter) {
                categoryFilter.addEventListener('change', () => applyContentFilters());
            }
            if (levelFilter) {
                levelFilter.addEventListener('change', () => applyContentFilters());
            }
            if (searchFilter) {
                searchFilter.addEventListener('input', () => applyContentFilters());
            }
            if (resetBtn) {
                resetBtn.addEventListener('click', () => resetContentFilters());
            }
        }

        function applyContentFilters() {
            if (isFilteringInProgress) {
                console.log('⚠️ Filtrage déjà en cours, abandon...');
                return;
            }

            isFilteringInProgress = true;

            try {
                const categoryFilter = document.getElementById('contentCategoryFilter')?.value || '';
                const levelFilter = document.getElementById('contentLevelFilter')?.value || '';
                const searchFilter = document.getElementById('contentSearchFilter')?.value.toLowerCase() || '';

                let filteredSubjects = [...allSubjectsGlobal];

                if (categoryFilter) {
                    filteredSubjects = filteredSubjects.filter(s => s.category === categoryFilter);
                }

                if (levelFilter) {
                    filteredSubjects = filteredSubjects.filter(s => s.level === levelFilter);
                }

                if (searchFilter) {
                    filteredSubjects = filteredSubjects.filter(s =>
                        s.title.toLowerCase().includes(searchFilter)
                    );
                }

                updateFilterSummaryV2(filteredSubjects.length, allSubjectsGlobal.length, categoryFilter, levelFilter, searchFilter);
                renderFilteredSubjects(filteredSubjects);
            } finally {
                isFilteringInProgress = false;
            }
        }

        function updateFilterSummaryV2(filtered, total, category, level, search) {
            const summary = document.getElementById('filterSummary');
            if (!summary) return;

            let text = \`Affichage de \${filtered} sur \${total} matières\`;
            const filters = [];
            if (category) filters.push(\`Catégorie: \${category}\`);
            if (level) filters.push(\`Niveau: \${level}\`);
            if (search) filters.push(\`Recherche: "\${search}"\`);

            if (filters.length > 0) {
                text += \` (\${filters.join(', ')})\`;
            }

            summary.textContent = text;
        }

        function renderFilteredSubjects(subjects) {
            const coursesHtml = \`
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Matière</th>
                            <th>Niveau</th>
                            <th>Catégorie</th>
                            <th>Chapitres</th>
                            <th>Leçons</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        \${subjects.length > 0 ? subjects.map(subject => \`
                            <tr>
                                <td style="font-weight: 500;">\${subject.title}</td>
                                <td><span style="background: #DBEAFE; color: #1E40AF; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 500;">\${subject.level || '-'}</span></td>
                                <td><span style="background: #D1FAE5; color: #065F46; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 500;">\${subject.category || '-'}</span></td>
                                <td>\${subject.chapters || 0}</td>
                                <td>\${subject.lessons || 0}</td>
                                <td><span class="status-badge active">Actif</span></td>
                                <td>
                                    <button class="btn btn-secondary btn-sm">📊 Détails</button>
                                    <button class="btn btn-secondary btn-sm">✏️ Modifier</button>
                                </td>
                            </tr>
                        \`).join('') : \`
                            <tr>
                                <td colspan="7" style="text-align: center; color: #64748b; padding: 2rem;">
                                    Aucune matière trouvée avec les filtres actuels.
                                </td>
                            </tr>
                        \`}
                    </tbody>
                </table>
            \`;

            const coursesTableEl = document.getElementById('courses-table');
            if (coursesTableEl) {
                coursesTableEl.innerHTML = coursesHtml;
            }
        }

        function resetContentFilters() {
            if (document.getElementById('contentCategoryFilter')) {
                document.getElementById('contentCategoryFilter').value = '';
            }
            if (document.getElementById('contentLevelFilter')) {
                document.getElementById('contentLevelFilter').value = '';
            }
            if (document.getElementById('contentSearchFilter')) {
                document.getElementById('contentSearchFilter').value = '';
            }
            applyContentFilters();
        }

        // === FIN FILTRES DE CONTENU V2 ===
`;

console.log('🔍 Recherche du point d\'insertion HTML...');
const htmlPattern = /(<!-- Content Management Tabs -->[\s\S]*?<\/div>\s*<\/div>\s*)\n(\s*<div class="section-content">)/;

if (htmlPattern.test(content)) {
    content = content.replace(htmlPattern, `$1\n${filtersHTML}\n$2`);
    console.log('✅ Filtres HTML insérés');
} else {
    console.log('❌ Pattern HTML non trouvé');
    process.exit(1);
}

console.log('🔍 Recherche du point d\'insertion JavaScript...');
const jsPattern = /(\/\/ Load Courses Data\s*async function loadCoursesData\(\))/;

if (jsPattern.test(content)) {
    content = content.replace(jsPattern, `${filtersJS}\n\n        $1`);
    console.log('✅ JavaScript inséré');

    // Modifier loadCoursesData pour utiliser les filtres
    content = content.replace(
        /(async function loadCoursesData\(\) \{[\s\S]*?const subjects = .*?;)/,
        `$1

                // Stocker les sujets pour les filtres
                allSubjectsGlobal = subjects;

                // Initialiser les filtres
                setTimeout(() => {
                    initContentFilters();
                    applyContentFilters();
                }, 100);

                return; // Ne pas afficher le tableau ici, les filtres s'en chargeront`
    );
    console.log('✅ loadCoursesData modifiée');
} else {
    console.log('❌ Pattern JavaScript non trouvé');
    process.exit(1);
}

console.log('💾 Écriture du fichier modifié...');
fs.writeFileSync(inputFile, content);

console.log('\n✅ MODIFICATIONS TERMINÉES!');
console.log(`📋 Backup: ${backupFile}`);
console.log('🎉 Les filtres V2 (sans récursion) ont été ajoutés');
console.log('🔄 Rafraîchir la page admin pour voir les changements');
