# 🎓 Guide de Génération de Contenu Pédagogique

## 📋 Vue d'ensemble

Ce guide explique comment utiliser le **script interactif de génération de contenu** pour créer des matières, chapitres et leçons selon le **programme camerounais MINESEC**.

---

## 🚀 Utilisation du Script Interactif

### Lancement

```bash
cd /opt/claudyne/backend
node src/scripts/generate-content-interactive.js
```

### Étapes du Script

Le script vous guide étape par étape :

#### 1️⃣ Choix du Cycle Scolaire

```
1. Primaire (CP → CM2)
2. Collège (6ème → 3ème)
3. Lycée (2nde → Terminale)
```

#### 2️⃣ Choix du Niveau

```
Tapez le numéro OU "tous" pour sélectionner tous les niveaux
```

**Exemples:**
- `1` → Sélectionne uniquement le premier niveau
- `tous` → Sélectionne tous les niveaux du cycle

#### 3️⃣ Choix de la Matière

Le script affiche les matières disponibles pour le cycle :

**Primaire:**
- 📐 Mathématiques
- 📚 Français
- 🔬 Sciences et Vie
- 🗺️ Histoire-Géographie
- 🇬🇧 Anglais

**Collège:**
- 📐 Mathématiques
- ⚛️ Physique-Chimie
- 🌿 SVT
- 📚 Français
- 🇬🇧 Anglais
- 🗺️ Histoire-Géographie
- ⚽ EPS
- 💻 Informatique

**Lycée:**
- 📐 Mathématiques
- ⚛️ Physique
- ⚗️ Chimie
- 🌿 SVT
- 📚 Français
- 🤔 Philosophie
- 🇬🇧 Anglais
- 🗺️ Histoire-Géographie
- 💻 Informatique

#### 4️⃣ Options de Génération

```
Nombre de leçons par chapitre (1-5) [défaut: 3]:
Inclure des quiz ? (o/n) [défaut: o]:
Type de contenu (1=Simple, 2=Riche) [défaut: 2]:
```

**Type de contenu:**
- **Simple (1)** : Transcript basique uniquement
- **Riche (2)** : Contenu complet avec exercices, ressources, exemples camerounais

#### 5️⃣ Confirmation

Le script affiche un résumé :

```
📝 RÉSUMÉ DE LA GÉNÉRATION:
   Cycle: college
   Niveaux: 6ème
   Matières: Mathématiques
   Leçons par chapitre: 3
   Quiz: Oui
   Type: Riche

Confirmer la génération ? (o/n):
```

---

## 📊 Résultats de la Génération

### Structure Créée

Pour chaque combinaison **Matière × Niveau**, le script crée :

```
Subject (Matière)
├── Chapter 1 (Trimestre 1)
│   ├── Leçon 1 (Gratuite 🆓)
│   ├── Leçon 2
│   └── Leçon 3 (avec Quiz 📝)
├── Chapter 2 (Trimestre 2)
│   ├── Leçon 1
│   ├── Leçon 2
│   └── Leçon 3 (avec Quiz 📝)
└── Chapter 3 (Trimestre 3)
    ├── Leçon 1
    ├── Leçon 2
    └── Leçon 3 (avec Quiz 📝)
```

### Contenu des Leçons Riches

Chaque leçon inclut :

✅ **Transcript** : Cours structuré en markdown
✅ **Points Clés** : Concepts essentiels
✅ **Exercices** : 3 niveaux (facile, moyen, difficile)
✅ **Ressources** : PDFs, vidéos, liens
✅ **Contexte Camerounais** : Exemples locaux
✅ **Quiz** (optionnel) : QCM, Vrai/Faux, Réponses multiples

### Exemples Camerounais Intégrés

Le script utilise des références locales :

**Mathématiques:**
- Prix du marché de Mokolo
- Distance Douala-Yaoundé
- Population du Cameroun
- Mont Cameroun (4070m)

**Sciences:**
- Réserve de Dja
- Climat de Bamenda
- Faune de Waza

**Français:**
- Proverbes Bamiléké
- Contes Bëti
- Légendes locales

---

## 🎯 Exemples d'Utilisation

### Exemple 1 : Générer Maths pour toute la 6ème

```bash
node src/scripts/generate-content-interactive.js
```

**Sélections:**
1. Cycle: `2` (Collège)
2. Niveau: `1` (6ème)
3. Matière: `1` (Mathématiques)
4. Leçons: `3`
5. Quiz: `o`
6. Type: `2` (Riche)

**Résultat:**
- 1 Subject: Mathématiques 6ème
- 5 Chapters (Nombres, Opérations, Fractions, Géométrie, Proportionnalité)
- 15 Leçons (3 par chapitre)
- 5 Quiz (1 par chapitre)

### Exemple 2 : Générer tout le Primaire pour Français

```bash
node src/scripts/generate-content-interactive.js
```

**Sélections:**
1. Cycle: `1` (Primaire)
2. Niveau: `tous`
3. Matière: `2` (Français)
4. Leçons: `4`
5. Quiz: `o`
6. Type: `2`

**Résultat:**
- 5 Subjects (CP, CE1, CE2, CM1, CM2)
- ~15 Chapters (3 par niveau)
- ~60 Leçons (4 par chapitre)

### Exemple 3 : Générer Terminale C Sciences

```bash
node src/scripts/generate-content-interactive.js
```

**Sélections:**
1. Cycle: `3` (Lycée)
2. Niveau: `3` (Terminale)
3. Matière: `tous` (Toutes les matières scientifiques)
4. Leçons: `5`
5. Quiz: `o`
6. Type: `2`

**Résultat:**
- Subjects: Maths, Physique, Chimie, SVT, etc.
- Chapitres organisés par trimestre
- Leçons avec quiz pour chaque chapitre

---

## 📂 Chapitres Prédéfinis

### Mathématiques 6ème

1. **Nombres entiers et décimaux** (T1)
2. **Les quatre opérations** (T1)
3. **Fractions** (T2)
4. **Géométrie plane** (T2)
5. **Proportionnalité** (T3)

### Mathématiques Terminale C/D

1. **Fonctions numériques** (T1)
2. **Suites numériques** (T1)
3. **Exponentielles et logarithmes** (T2)
4. **Probabilités** (T2)
5. **Nombres complexes** (T3)

### Français 6ème

1. **Grammaire de base** (T1)
2. **Le récit** (T1)
3. **La poésie** (T2)
4. **Le théâtre** (T3)

### Physique-Chimie 3ème

1. **Électricité** (T1)
2. **Mécanique** (T2)
3. **Chimie des solutions** (T2)
4. **Atomes et molécules** (T3)

---

## 🔍 Vérification du Contenu Généré

### Via PostgreSQL

```bash
psql -U postgres -d claudyne_db

SELECT level, category, COUNT(*) as subjects
FROM subjects
WHERE "isActive" = true
GROUP BY level, category;

SELECT s.title as subject, COUNT(l.id) as lessons
FROM subjects s
LEFT JOIN lessons l ON l."subjectId" = s.id
GROUP BY s.id, s.title;
```

### Via l'API

```bash
# Lister tous les subjects
curl http://89.117.58.53:3001/api/students/subjects

# Voir un subject spécifique
curl http://89.117.58.53:3001/api/students/subjects/mathematiques-6eme
```

### Via l'Interface Admin

1. Se connecter : `https://www.claudyne.com/admin-interface.html`
2. Section **"Contenu"**
3. Onglet **"Cours"**
4. Filtrer par niveau et matière

---

## 💡 Conseils et Bonnes Pratiques

### 🎯 Pour Commencer

1. **Tester d'abord avec un seul niveau**
   - Choisir 6ème ou CP
   - Générer 1 matière
   - Vérifier le résultat

2. **Utiliser le contenu riche**
   - Les exemples camerounais enrichissent l'apprentissage
   - Les exercices progressifs aident les élèves

3. **Inclure les quiz**
   - Évaluation automatique
   - Feedback immédiat
   - Statistiques de progression

### ⚠️ Limitations Actuelles

- Les chapitres sont prédéfinis pour certaines matières
- Pour les matières sans chapitres définis, 3 chapitres génériques sont créés
- Le contenu est en français uniquement

### 🚀 Pour Aller Plus Loin

**Ajouter de nouveaux chapitres:**
Modifier la constante `CHAPITRES_PAR_MATIERE` dans le script :

```javascript
'mathematiques-5eme': [
  {
    num: 1,
    titre: 'Nombres relatifs',
    trimestre: 1,
    objectifs: ['Additionner', 'Soustraire', 'Multiplier']
  },
  // ... autres chapitres
]
```

**Personnaliser le contenu:**
Modifier les fonctions `genererContenuLecon()` et `genererQuiz()`

---

## 📞 Support

En cas de problème :

1. Vérifier que PostgreSQL est actif
2. Vérifier les variables d'environnement (.env)
3. Consulter les logs du script

**Logs:**
```bash
tail -f /opt/claudyne/backend/logs/app.log
```

---

## 🎓 Exemple Complet de Session

```bash
$ node src/scripts/generate-content-interactive.js

🎓 GÉNÉRATEUR DE CONTENU PÉDAGOGIQUE CLAUDYNE
📚 Programme Camerounais MINESEC

============================================================
  🎯 Choisissez le cycle scolaire
============================================================

  1. Primaire
  2. College
  3. Lycee

Votre choix (1-3): 2

✅ Cycle sélectionné: COLLEGE

============================================================
  📊 Choisissez le niveau
============================================================

  1. 6ème
  2. 5ème
  3. 4ème
  4. 3ème

Votre choix (numéro ou "tous"): 1

============================================================
  📖 Choisissez la matière
============================================================

  1. 📐 Mathématiques
  2. ⚛️ Physique-Chimie
  3. 🌿 Sciences de la Vie et de la Terre
  4. 📚 Français
  5. 🇬🇧 Anglais
  6. 🗺️ Histoire-Géographie
  7. ⚽ Éducation Physique et Sportive
  8. 💻 Informatique

Votre choix (numéro ou "tous"): 1

⚙️ OPTIONS DE GÉNÉRATION

Nombre de leçons par chapitre (1-5) [défaut: 3]: 3
Inclure des quiz ? (o/n) [défaut: o]: o
Type de contenu (1=Simple, 2=Riche) [défaut: 2]: 2

📝 RÉSUMÉ DE LA GÉNÉRATION:
   Cycle: college
   Niveaux: 6ème
   Matières: Mathématiques
   Leçons par chapitre: 3
   Quiz: Oui
   Type: Riche

Confirmer la génération ? (o/n): o

🚀 DÉMARRAGE DE LA GÉNÉRATION...

📚 Création: Mathématiques - 6ème
   ✅ Subject créé: Mathématiques 6ème
      📂 Chapitre 1: Nombres entiers et décimaux
         🆓 Leçon 1: reading
         Leçon 2: video
         Leçon 3: interactive 📝
      📂 Chapitre 2: Les quatre opérations
         🆓 Leçon 1: reading
         Leçon 2: video
         Leçon 3: interactive 📝
      ...

============================================================
  ✅ GÉNÉRATION TERMINÉE AVEC SUCCÈS !
============================================================

📊 STATISTIQUES:
   🎯 Subjects créés: 1
   📂 Chapitres créés: 5
   📚 Leçons créées: 15

💡 Les données ont été insérées dans PostgreSQL
🌐 Accessible via l'API /api/students/subjects
🖥️  Visible dans l'interface admin
```

---

**💚 La force du savoir en héritage - Claudine 💚**
