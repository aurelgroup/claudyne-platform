#!/bin/bash

# Script pour ajouter les filtres de contenu à l'interface admin

ADMIN_FILE="/opt/claudyne/admin-interface.html"
BACKUP_FILE="/opt/claudyne/admin-interface.backup.$(date +%Y%m%d%H%M%S).html"

echo "📦 Sauvegarde du fichier actuel..."
cp "$ADMIN_FILE" "$BACKUP_FILE"

echo "✏️ Ajout des filtres de contenu..."

# Créer un fichier temporaire avec les filtres
cat > /tmp/content-filters.html << 'EOF'

                    <!-- Filtres de contenu -->
                    <div style="padding: 1.5rem; background: #F9FAFB; border-radius: 8px; margin-bottom: 1.5rem; border: 1px solid #E5E7EB;">
                        <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: center;">
                            <div style="flex: 1; min-width: 200px;">
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151;">Catégorie</label>
                                <select id="contentCategoryFilter" onchange="filterContentByCategoryAndLevel()" style="width: 100%; padding: 0.75rem; border: 1px solid #D1D5DB; border-radius: 6px; background: white; color: #1F2937;">
                                    <option value="">Toutes les catégories</option>
                                    <option value="Sciences">Sciences</option>
                                    <option value="Langues">Langues</option>
                                    <option value="Sciences Humaines">Sciences Humaines</option>
                                </select>
                            </div>
                            <div style="flex: 1; min-width: 200px;">
                                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151;">Niveau</label>
                                <select id="contentLevelFilter" onchange="filterContentByCategoryAndLevel()" style="width: 100%; padding: 0.75rem; border: 1px solid #D1D5DB; border-radius: 6px; background: white; color: #1F2937;">
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
                                <input type="text" id="contentSearchFilter" oninput="filterContentByCategoryAndLevel()" placeholder="Rechercher une matière..." style="width: 100%; padding: 0.75rem; border: 1px solid #D1D5DB; border-radius: 6px; color: #1F2937;">
                            </div>
                            <div style="display: flex; align-items: flex-end;">
                                <button onclick="resetContentFilters()" style="padding: 0.75rem 1.5rem; background: #6B7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
                                    Réinitialiser
                                </button>
                            </div>
                        </div>
                        <div id="filterSummary" style="margin-top: 1rem; color: #6B7280; font-size: 0.875rem;"></div>
                    </div>
EOF

# Utiliser awk pour insérer les filtres après la ligne qui contient '</div>' suivant la ligne 2824
# Plus précisément après </div> de la section section-header
awk '
/<!-- Content Management Tabs -->/ {print; in_content=1; next}
in_content && /<div class="section-content">/ {
    system("cat /tmp/content-filters.html")
    in_content=0
}
{print}
' "$ADMIN_FILE" > /tmp/admin-interface-new.html

# Remplacer le fichier
mv /tmp/admin-interface-new.html "$ADMIN_FILE"

echo "✅ Filtres HTML ajoutés"

# Ajouter le JavaScript nécessaire
echo "✏️ Ajout du JavaScript pour les filtres..."

# Trouver la ligne avec loadCoursesData et ajouter le code JavaScript avant la fermeture du script
# Pour simplifier, on va ajouter le JS à la fin du fichier, juste avant </script>

# Créer le fichier JS temporaire
cat > /tmp/filter-functions.js << 'JSEOF'

        // Fonction pour filtrer le contenu par catégorie et niveau
        let allSubjects = [];

        async function filterContentByCategoryAndLevel() {
            const categoryFilter = document.getElementById('contentCategoryFilter')?.value || '';
            const levelFilter = document.getElementById('contentLevelFilter')?.value || '';
            const searchFilter = document.getElementById('contentSearchFilter')?.value.toLowerCase() || '';

            let filteredSubjects = allSubjects;

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
        }

        function updateFilterSummary(filtered, total, category, level, search) {
            const summary = document.getElementById('filterSummary');
            if (!summary) return;

            let text = 'Affichage de ' + filtered + ' sur ' + total + ' matières';
            const filters = [];
            if (category) filters.push('Catégorie: ' + category);
            if (level) filters.push('Niveau: ' + level);
            if (search) filters.push('Recherche: "' + search + '"');

            if (filters.length > 0) {
                text += ' (' + filters.join(', ') + ')';
            }

            summary.textContent = text;
        }

        function displayFilteredSubjects(subjects) {
            const coursesHtml = '<table class="data-table"><thead><tr><th>Matière</th><th>Niveau</th><th>Catégorie</th><th>Chapitres</th><th>Leçons</th><th>Statut</th><th>Actions</th></tr></thead><tbody>' +
                (subjects.length > 0 ? subjects.map(subject =>
                    '<tr>' +
                    '<td style="font-weight: 500;">' + subject.title + '</td>' +
                    '<td><span style="background: #DBEAFE; color: #1E40AF; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 500;">' + (subject.level || '-') + '</span></td>' +
                    '<td><span style="background: #D1FAE5; color: #065F46; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 500;">' + (subject.category || '-') + '</span></td>' +
                    '<td>' + (subject.chapters || 0) + '</td>' +
                    '<td>' + (subject.lessons || 0) + '</td>' +
                    '<td><span class="status-badge active">Actif</span></td>' +
                    '<td><button class="btn btn-secondary btn-sm">📊 Détails</button> <button class="btn btn-secondary btn-sm">✏️ Modifier</button></td>' +
                    '</tr>'
                ).join('') : '<tr><td colspan="7" style="text-align: center; color: #64748b; padding: 2rem;">Aucune matière trouvée avec les filtres actuels.</td></tr>') +
                '</tbody></table>';

            const coursesTableEl = document.getElementById('courses-table');
            if (coursesTableEl) {
                coursesTableEl.innerHTML = coursesHtml;
            }
        }

        function resetContentFilters() {
            document.getElementById('contentCategoryFilter').value = '';
            document.getElementById('contentLevelFilter').value = '';
            document.getElementById('contentSearchFilter').value = '';
            filterContentByCategoryAndLevel();
        }

        // Modifier loadCoursesData pour utiliser les filtres
        const originalLoadCoursesData = loadCoursesData;
        loadCoursesData = async function() {
            try {
                const data = await authenticatedFetch(API_BASE + '/api/admin/content');
                allSubjects = (data?.success && data?.data?.subjects) ? data.data.subjects : [];
                filterContentByCategoryAndLevel();
            } catch (error) {
                console.error('Erreur chargement courses:', error);
                const coursesTableEl = document.getElementById('courses-table');
                if (coursesTableEl) {
                    coursesTableEl.innerHTML = '<p style="color: #EF4444;">❌ Erreur de chargement</p>';
                }
            }
        };

JSEOF

# Insérer le JavaScript avant la dernière balise </script>
sed -i '/<\/script>/i\
\
'"$(cat /tmp/filter-functions.js)"'
' "$ADMIN_FILE"

echo "✅ JavaScript ajouté"
echo "📋 Sauvegarde créée: $BACKUP_FILE"
echo "🎉 Modifications terminées!"
