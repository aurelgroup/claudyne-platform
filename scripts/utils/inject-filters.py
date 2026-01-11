#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script pour ajouter les filtres de contenu à l'interface admin
"""

import sys
import re
from datetime import datetime

def inject_filters(input_file, output_file):
    """Injecte les filtres dans le fichier admin-interface.html"""

    print("📖 Lecture du fichier...")
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # HTML des filtres à insérer
    filters_html = '''
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
'''

    # JavaScript des filtres à ajouter
    filters_js = '''
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

            let text = `Affichage de ${filtered} sur ${total} matières`;
            const filters = [];
            if (category) filters.push(`Catégorie: ${category}`);
            if (level) filters.push(`Niveau: ${level}`);
            if (search) filters.push(`Recherche: "${search}"`);

            if (filters.length > 0) {
                text += ` (${filters.join(', ')})`;
            }

            summary.textContent = text;
        }

        function displayFilteredSubjects(subjects) {
            const coursesHtml = `
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
                        ${subjects.length > 0 ? subjects.map(subject => `
                            <tr>
                                <td style="font-weight: 500;">${subject.title}</td>
                                <td><span style="background: #DBEAFE; color: #1E40AF; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 500;">${subject.level || '-'}</span></td>
                                <td><span style="background: #D1FAE5; color: #065F46; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 500;">${subject.category || '-'}</span></td>
                                <td>${subject.chapters || 0}</td>
                                <td>${subject.lessons || 0}</td>
                                <td><span class="status-badge active">Actif</span></td>
                                <td>
                                    <button class="btn btn-secondary btn-sm">📊 Détails</button>
                                    <button class="btn btn-secondary btn-sm">✏️ Modifier</button>
                                </td>
                            </tr>
                        `).join('') : `
                            <tr>
                                <td colspan="7" style="text-align: center; color: #64748b; padding: 2rem;">
                                    Aucune matière trouvée avec les filtres actuels.
                                </td>
                            </tr>
                        `}
                    </tbody>
                </table>
            `;

            const coursesTableEl = document.getElementById('courses-table');
            if (coursesTableEl) {
                coursesTableEl.innerHTML = coursesHtml;
            }
        }

        function resetContentFilters() {
            if (document.getElementById('contentCategoryFilter')) document.getElementById('contentCategoryFilter').value = '';
            if (document.getElementById('contentLevelFilter')) document.getElementById('contentLevelFilter').value = '';
            if (document.getElementById('contentSearchFilter')) document.getElementById('contentSearchFilter').value = '';
            filterContentByCategoryAndLevel();
        }

        // Patch de loadCoursesData pour utiliser les filtres
        const originalLoadCoursesData = window.loadCoursesData;
        window.loadCoursesData = async function() {
            try {
                const data = await authenticatedFetch(`${API_BASE}/api/admin/content`);
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
'''

    print("🔍 Recherche du point d'insertion pour le HTML...")
    # Trouver la section content et insérer les filtres après section-header
    # On cherche: </div> qui ferme section-header, puis on insère avant <div class="section-content">
    pattern = r'(<!-- Content Management Tabs -->.*?</div>\s*</div>\s*)\n(\s*<div class="section-content">)'

    if re.search(pattern, content, re.DOTALL):
        content = re.sub(
            pattern,
            r'\1\n' + filters_html + r'\n\2',
            content,
            flags=re.DOTALL,
            count=1
        )
        print("✅ Filtres HTML insérés")
    else:
        print("⚠️  Pattern HTML non trouvé, tentative alternative...")
        # Essayer un pattern plus simple
        alt_pattern = r'(<div class="content-section glass-card animate-fadeInUp">.*?</div>\s*)\n(\s*<div class="section-content">)'
        if re.search(alt_pattern, content, re.DOTALL):
            content = re.sub(
                alt_pattern,
                r'\1\n' + filters_html + r'\n\2',
                content,
                flags=re.DOTALL,
                count=1
            )
            print("✅ Filtres HTML insérés (méthode alternative)")
        else:
            print("❌ Impossible de trouver le point d'insertion HTML")
            return False

    print("🔍 Recherche du point d'insertion pour le JavaScript...")
    # Insérer le JavaScript avant la fonction loadCoursesData
    js_pattern = r'(// Load Courses Data\s*async function loadCoursesData\(\))'

    if re.search(js_pattern, content):
        content = re.sub(
            js_pattern,
            filters_js + r'\n\n        \1',
            content,
            count=1
        )
        print("✅ JavaScript inséré")
    else:
        print("⚠️  Pattern JavaScript non trouvé, ajout en fin de script...")
        # Essayer d'ajouter avant la dernière balise </script>
        content = re.sub(
            r'(\s*</script>\s*</body>)',
            '\n' + filters_js + r'\n\1',
            content,
            count=1
        )
        print("✅ JavaScript ajouté (fin de script)")

    print(f"💾 Écriture du fichier modifié: {output_file}")
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)

    print("✅ Modifications terminées avec succès!")
    return True

if __name__ == '__main__':
    input_file = 'admin-interface-prod.html'
    output_file = 'admin-interface-modified.html'

    print("🚀 Injection des filtres dans l'interface admin")
    print(f"📄 Fichier source: {input_file}")
    print(f"📄 Fichier sortie: {output_file}")
    print()

    success = inject_filters(input_file, output_file)

    if success:
        print()
        print("=" * 60)
        print("🎉 SUCCÈS!")
        print("=" * 60)
        print(f"Le fichier modifié a été créé: {output_file}")
        print()
        print("Prochaines étapes:")
        print("1. Vérifier le fichier modifié")
        print("2. Déployer sur le serveur avec:")
        print(f"   scp {output_file} root@89.117.58.53:/opt/claudyne/admin-interface.html")
        print("3. Tester sur https://claudyne.com/admin-secure-k7m9x4n2p8w5z1c6")
    else:
        print()
        print("❌ ÉCHEC de l'injection")
        sys.exit(1)
