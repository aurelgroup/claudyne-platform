const fs = require('fs');

console.log('🚨 CORRECTIF D\'URGENCE - Boucle infinie dans les filtres\n');

const inputFile = '/opt/claudyne/admin-interface.html';
const backupFile = `/opt/claudyne/admin-interface.backup.emergency.${Date.now()}.html`;

// Créer un backup d'urgence
console.log('💾 Création backup d\'urgence...');
fs.copyFileSync(inputFile, backupFile);
console.log(`✅ Backup: ${backupFile}`);

// Lire le fichier
console.log('📖 Lecture du fichier...');
let content = fs.readFileSync(inputFile, 'utf8');

// Le problème: displayFilteredSubjects appelle filterContentByCategoryAndLevel
// Solution: Supprimer l'appel récursif

console.log('🔧 Correction de la boucle infinie...');

// Trouver et remplacer le code problématique
// Le problème est que displayFilteredSubjects() appelle filterContentByCategoryAndLevel()

// Nouvelle version corrigée de displayFilteredSubjects
const fixedDisplayFunction = `
        function displayFilteredSubjects(subjects) {
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
        }`;

// Nouvelle version corrigée de filterContentByCategoryAndLevel
const fixedFilterFunction = `
        async function filterContentByCategoryAndLevel() {
            const categoryFilter = document.getElementById('contentCategoryFilter')?.value || '';
            const levelFilter = document.getElementById('contentLevelFilter')?.value || '';
            const searchFilter = document.getElementById('contentSearchFilter')?.value.toLowerCase() || '';

            let filteredSubjects = [...allSubjects]; // Copie pour éviter les mutations

            if (categoryFilter) {
                filteredSubjects = filteredSubjects.filter(subject =>
                    subject.category === categoryFilter
                );
            }

            if (levelFilter) {
                filteredSubjects = filteredSubjects.filter(subject =>
                    subject.level === levelFilter
                );
            }

            if (searchFilter) {
                filteredSubjects = filteredSubjects.filter(subject =>
                    subject.title.toLowerCase().includes(searchFilter)
                );
            }

            updateFilterSummary(filteredSubjects.length, allSubjects.length, categoryFilter, levelFilter, searchFilter);
            displayFilteredSubjects(filteredSubjects);
        }`;

// Remplacer les fonctions problématiques
content = content.replace(
    /async function filterContentByCategoryAndLevel\(\) \{[\s\S]*?\n        \}/m,
    fixedFilterFunction
);

content = content.replace(
    /function displayFilteredSubjects\(subjects\) \{[\s\S]*?\n        \}/m,
    fixedDisplayFunction
);

console.log('💾 Écriture du fichier corrigé...');
fs.writeFileSync(inputFile, content);

console.log('\n✅ CORRECTIF APPLIQUÉ AVEC SUCCÈS!');
console.log('📋 Backup: ' + backupFile);
console.log('🔄 Rafraîchir la page admin pour voir les corrections');
