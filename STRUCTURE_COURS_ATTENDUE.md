# 📚 STRUCTURE COMPLÈTE D'UN COURS CLAUDYNE

## 🎯 Vue d'ensemble

Ce document décrit la structure **exacte** attendue pour créer des cours pédagogiques dans Claudyne via l'interface admin.

---

## 1️⃣ STRUCTURE D'UN SUBJECT (Matière)

### Champs Obligatoires

```json
{
  "id": "mathematiques-terminale-001",
  "title": "Mathématiques Terminale C",
  "description": "Programme complet de mathématiques pour la classe de Terminale C selon le curriculum camerounais",
  "level": "Terminale",           // CP, CE1, CE2, CM1, CM2, 6ème, 5ème, 4ème, 3ème, 2nde, 1ère, Terminale
  "category": "Mathématiques",    // Mathématiques, Sciences, Français, Langues, Histoire-Géographie, Informatique, Sport, Arts
  "icon": "📐",
  "color": "#3B82F6",
  "difficulty": "Avancé",         // Débutant, Intermédiaire, Avancé
  "estimatedDuration": 120,       // Durée totale en heures
  "isActive": true,
  "isPremium": false,
  "order": 1
}
```

### Champs Optionnels (mais recommandés)

```json
{
  "prerequisites": ["mathematiques-1ere-001"],
  "objectives": [
    "Maîtriser les fonctions exponentielles et logarithmes",
    "Résoudre des équations différentielles",
    "Appliquer les théorèmes de probabilités"
  ],
  "competencies": [
    {
      "code": "C1",
      "description": "Résoudre des problèmes complexes",
      "level": "expert"
    }
  ],
  "cameroonCurriculum": {
    "officialCode": "MAT-TLE-C-2024",
    "ministerialRef": "Arrêté n°XXX du MINESEC",
    "examType": "Baccalauréat C",
    "coefficent": 5
  }
}
```

---

## 2️⃣ STRUCTURE D'UNE LESSON (Leçon)

### Métadonnées de la Leçon

```json
{
  "title": "Les Fonctions Exponentielles",
  "description": "Introduction aux fonctions exponentielles : définition, propriétés et applications",
  "subjectId": "mathematiques-terminale-001",
  "order": 1,
  "type": "interactive",          // video, interactive, reading, exercise, lab, quiz
  "difficulty": "Intermédiaire",  // Débutant, Intermédiaire, Avancé
  "estimatedDuration": 45,        // En minutes
  "isActive": true,
  "isPremium": false,
  "isFree": false,
  "reviewStatus": "approved"      // draft, pending_review, approved, rejected, needs_revision
}
```

### Objectifs Pédagogiques

```json
{
  "objectives": [
    "Comprendre la définition de la fonction exponentielle",
    "Étudier les propriétés de base (e^0 = 1, e^(a+b) = e^a × e^b)",
    "Tracer la courbe représentative",
    "Résoudre des équations exponentielles simples"
  ]
}
```

### Prérequis

```json
{
  "prerequisites": [
    "Les puissances et racines",
    "Les fonctions numériques de base",
    "Le plan cartésien et les repères"
  ]
}
```

### Contenu Principal (CRITICAL ⚠️)

Le champ `content` est un **objet JSON structuré**, pas du texte simple :

```json
{
  "content": {
    "videoUrl": "https://www.youtube.com/watch?v=xxxxx",
    "transcript": "Bienvenue dans cette leçon sur les fonctions exponentielles...\n\nI. Définition\nLa fonction exponentielle est définie par...",
    "keyPoints": [
      {
        "title": "Définition",
        "content": "La fonction exponentielle f(x) = e^x est l'unique fonction dérivable sur ℝ qui vérifie : f'(x) = f(x) et f(0) = 1"
      },
      {
        "title": "Propriétés algébriques",
        "content": "Pour tous réels a et b : e^(a+b) = e^a × e^b et e^(-a) = 1/e^a"
      },
      {
        "title": "Étude graphique",
        "content": "La fonction exponentielle est strictement croissante sur ℝ, lim(x→-∞) e^x = 0 et lim(x→+∞) e^x = +∞"
      }
    ],
    "exercises": [
      {
        "id": 1,
        "title": "Calcul direct",
        "question": "Calculer e^2 × e^3",
        "answer": "e^5",
        "explanation": "On utilise la propriété e^(a+b) = e^a × e^b, donc e^2 × e^3 = e^(2+3) = e^5",
        "difficulty": "facile"
      },
      {
        "id": 2,
        "title": "Équation exponentielle",
        "question": "Résoudre e^x = e^5",
        "answer": "x = 5",
        "explanation": "La fonction exponentielle est injective, donc e^x = e^5 ⇔ x = 5",
        "difficulty": "moyen"
      }
    ],
    "resources": [
      {
        "type": "pdf",
        "title": "Formulaire des exponentielles",
        "url": "/resources/formulaire-expo.pdf",
        "description": "Toutes les formules à connaître"
      },
      {
        "type": "video",
        "title": "Démonstration de e^(a+b) = e^a × e^b",
        "url": "https://www.youtube.com/watch?v=demo",
        "duration": "8:30"
      },
      {
        "type": "interactive",
        "title": "Graphique interactif",
        "url": "https://www.geogebra.org/m/xxxxx",
        "description": "Manipuler les paramètres de la fonction"
      }
    ],
    "downloadableFiles": [
      {
        "name": "Exercices supplémentaires",
        "url": "/downloads/exercices-expo.pdf",
        "size": "1.2 MB",
        "format": "PDF"
      },
      {
        "name": "Correction détaillée",
        "url": "/downloads/correction-expo.pdf",
        "size": "850 KB",
        "format": "PDF"
      }
    ]
  }
}
```

### Contexte Camerounais (Optionnel mais valorisé)

```json
{
  "cameroonContext": {
    "localExamples": [
      "Croissance démographique du Cameroun (modèle exponentiel)",
      "Évolution du taux de change FCFA/Euro",
      "Progression d'une épidémie (COVID-19 au Cameroun)"
    ],
    "culturalReferences": [
      "Les marchés exponentiels de Douala",
      "Proverbe Bamiléké : 'La richesse croît comme le mil' (croissance exponentielle)"
    ],
    "localLanguageTerms": {
      "exponentielle": "Fonction qui grandit vite-vite (pidgin)",
      "croissance": "Augmentation rapide"
    }
  }
}
```

### Quiz Intégré (si hasQuiz = true)

```json
{
  "hasQuiz": true,
  "quiz": {
    "title": "Évaluation : Fonctions Exponentielles",
    "description": "Testez vos connaissances sur les exponentielles",
    "timeLimit": 20,            // En minutes (null = pas de limite)
    "passingScore": 12,         // Sur 20
    "totalPoints": 20,
    "shuffleQuestions": true,
    "showCorrectAnswers": true,  // Après soumission
    "questions": [
      {
        "id": 1,
        "type": "multiple_choice",
        "question": "Quelle est la valeur de e^0 ?",
        "points": 2,
        "options": [
          { "id": "a", "text": "0", "isCorrect": false },
          { "id": "b", "text": "1", "isCorrect": true },
          { "id": "c", "text": "e", "isCorrect": false },
          { "id": "d", "text": "Indéfini", "isCorrect": false }
        ],
        "explanation": "Par définition, e^0 = 1 pour tout nombre e (propriété des exposants)",
        "difficulty": "facile"
      },
      {
        "id": 2,
        "type": "calculation",
        "question": "Simplifier : e^3 × e^5 / e^2",
        "points": 4,
        "correctAnswer": "e^6",
        "acceptedAnswers": ["e^6", "e⁶"],
        "explanation": "e^3 × e^5 / e^2 = e^(3+5-2) = e^6",
        "difficulty": "moyen"
      },
      {
        "id": 3,
        "type": "true_false",
        "question": "La fonction exponentielle est décroissante sur ℝ",
        "points": 2,
        "correctAnswer": false,
        "explanation": "FAUX. La fonction exponentielle est strictement CROISSANTE sur ℝ",
        "difficulty": "facile"
      },
      {
        "id": 4,
        "type": "multiple_response",
        "question": "Quelles sont les propriétés vraies ? (Plusieurs réponses)",
        "points": 5,
        "options": [
          { "id": "a", "text": "e^(a+b) = e^a + e^b", "isCorrect": false },
          { "id": "b", "text": "e^(a+b) = e^a × e^b", "isCorrect": true },
          { "id": "c", "text": "e^(-a) = 1/e^a", "isCorrect": true },
          { "id": "d", "text": "(e^a)^b = e^(a×b)", "isCorrect": true }
        ],
        "explanation": "b, c et d sont correctes. La propriété a est FAUSSE : e^(a+b) = e^a × e^b (multiplication, pas addition)",
        "difficulty": "avancé",
        "partialCredit": true  // Points proportionnels si partiellement correct
      },
      {
        "id": 5,
        "type": "open_ended",
        "question": "Résoudre l'équation : e^(2x-1) = e^5",
        "points": 7,
        "correctAnswer": "x = 3",
        "steps": [
          "2x - 1 = 5 (car la fonction exp est injective)",
          "2x = 6",
          "x = 3"
        ],
        "explanation": "Comme e^(2x-1) = e^5, on a 2x-1 = 5, donc 2x = 6, d'où x = 3",
        "difficulty": "moyen"
      }
    ]
  }
}
```

### Métadonnées Additionnelles

```json
{
  "metadata": {
    "tags": [
      "mathématiques",
      "analyse",
      "fonctions",
      "exponentielle",
      "terminale"
    ],
    "searchKeywords": [
      "e puissance x",
      "exp(x)",
      "croissance exponentielle",
      "logarithme naturel",
      "limite exponentielle"
    ],
    "language": "fr",
    "version": "2.0",
    "authorNotes": "Leçon mise à jour selon le nouveau programme MINESEC 2024",
    "lastReviewDate": "2024-12-01",
    "reviewerComments": "Excellent contenu, exercices progressifs"
  }
}
```

### Statistiques (Gérées automatiquement)

```json
{
  "stats": {
    "viewCount": 245,
    "completionCount": 187,
    "averageScore": 14.5,       // Sur 20
    "averageTime": 38,          // Minutes
    "likeCount": 156,
    "difficulty_rating": 3.2    // Sur 5 (feedback utilisateurs)
  }
}
```

---

## 3️⃣ EXEMPLE COMPLET D'UNE LEÇON

```json
{
  "title": "Les Limites de Fonctions",
  "description": "Étude complète des limites : définition, calculs, théorèmes et applications pratiques",
  "subjectId": "mathematiques-terminale-001",
  "order": 5,
  "type": "interactive",
  "difficulty": "Avancé",
  "estimatedDuration": 60,
  "isActive": true,
  "isPremium": false,
  "isFree": false,
  "reviewStatus": "approved",

  "objectives": [
    "Comprendre la notion intuitive et formelle de limite",
    "Calculer des limites en utilisant les théorèmes",
    "Lever les formes indéterminées",
    "Étudier les asymptotes"
  ],

  "prerequisites": [
    "Les fonctions numériques",
    "Les opérations sur les fonctions",
    "Les fonctions de référence (polynômes, rationnelles, exponentielles)"
  ],

  "content": {
    "videoUrl": "https://www.youtube.com/watch?v=demo-limites",
    "transcript": "# Les Limites de Fonctions\n\n## Introduction\nLa notion de limite est fondamentale en analyse...\n\n## I. Définition intuitive\nIntuitivement, dire que f(x) tend vers L quand x tend vers a signifie...",

    "keyPoints": [
      {
        "title": "Définition formelle (ε-δ)",
        "content": "lim(x→a) f(x) = L ⇔ ∀ε>0, ∃δ>0 : |x-a|<δ ⇒ |f(x)-L|<ε"
      },
      {
        "title": "Théorèmes sur les limites",
        "content": "Si lim f = L et lim g = M, alors : lim(f+g) = L+M, lim(f×g) = L×M, lim(f/g) = L/M (si M≠0)"
      },
      {
        "title": "Formes indéterminées",
        "content": "Les 7 formes indéterminées : ∞-∞, 0×∞, ∞/∞, 0/0, 0^0, 1^∞, ∞^0"
      }
    ],

    "exercises": [
      {
        "id": 1,
        "title": "Limite directe",
        "question": "Calculer lim(x→2) (3x + 5)",
        "answer": "11",
        "explanation": "Par continuité des polynômes : lim(x→2) (3x + 5) = 3(2) + 5 = 11",
        "difficulty": "facile"
      },
      {
        "id": 2,
        "title": "Forme indéterminée 0/0",
        "question": "Calculer lim(x→1) (x²-1)/(x-1)",
        "answer": "2",
        "explanation": "On factorise : (x²-1)/(x-1) = (x-1)(x+1)/(x-1) = x+1 pour x≠1. Donc lim = 1+1 = 2",
        "difficulty": "moyen"
      }
    ],

    "resources": [
      {
        "type": "pdf",
        "title": "Tableau des limites usuelles",
        "url": "/resources/limites-usuelles.pdf"
      },
      {
        "type": "interactive",
        "title": "Visualisation des limites",
        "url": "https://www.desmos.com/calculator/limits"
      }
    ],

    "downloadableFiles": [
      {
        "name": "Fiche récapitulative",
        "url": "/downloads/fiche-limites.pdf",
        "size": "500 KB",
        "format": "PDF"
      }
    ]
  },

  "cameroonContext": {
    "localExamples": [
      "Limite de capacité du stade de Japoma (60,000 places)",
      "Asymptote horizontale = niveau maximum du barrage de Lagdo",
      "Croissance de la population de Yaoundé (modèle avec limite)"
    ],
    "culturalReferences": [
      "Proverbe : 'Le palmier pousse mais ne touche pas le ciel' (limite naturelle)"
    ]
  },

  "hasQuiz": true,
  "quiz": {
    "title": "QCM : Les Limites",
    "timeLimit": 30,
    "passingScore": 12,
    "totalPoints": 20,
    "questions": [
      {
        "id": 1,
        "type": "multiple_choice",
        "question": "Quelle est lim(x→+∞) (1/x) ?",
        "points": 3,
        "options": [
          { "id": "a", "text": "0", "isCorrect": true },
          { "id": "b", "text": "+∞", "isCorrect": false },
          { "id": "c", "text": "1", "isCorrect": false },
          { "id": "d", "text": "N'existe pas", "isCorrect": false }
        ],
        "explanation": "Quand x tend vers +∞, 1/x tend vers 0",
        "difficulty": "facile"
      }
    ]
  },

  "metadata": {
    "tags": ["mathématiques", "analyse", "limites", "terminale", "continuité"],
    "searchKeywords": ["limite", "asymptote", "infiniment grand", "infiniment petit"],
    "language": "fr",
    "version": "1.0"
  }
}
```

---

## 4️⃣ TYPES DE LEÇONS DISPONIBLES

| Type | Description | Exemple |
|------|-------------|---------|
| **video** | Cours en vidéo avec transcript | Cours magistral filmé |
| **interactive** | Contenu avec exercices interactifs | Simulations, manipulations |
| **reading** | Texte pédagogique structuré | Cours théorique détaillé |
| **exercise** | Série d'exercices pratiques | Feuille d'exercices |
| **lab** | Travaux pratiques/expériences | TP de sciences |
| **quiz** | Évaluation de connaissances | QCM, exercices notés |

---

## 5️⃣ NIVEAUX ET CATÉGORIES

### Niveaux (educationLevel)
```
Primaire : CP, CE1, CE2, CM1, CM2
Collège  : 6ème, 5ème, 4ème, 3ème
Lycée    : 2nde, 1ère, Terminale
```

### Catégories de Matières
```
- Mathématiques (📐 #3B82F6)
- Sciences (🔬 #10B981)
- Français (📚 #F59E0B)
- Langues (🌍 #8B5CF6)
- Histoire-Géographie (🗺️ #EF4444)
- Informatique (💻 #06B6D4)
- Sport (⚽ #84CC16)
- Arts (🎨 #EC4899)
```

---

## 6️⃣ WORKFLOW DE CRÉATION

### Via l'Interface Admin

1. **Connexion Admin** → `admin@claudyne.com`
2. **Section "Contenu"** → "Créer un cours"
3. **Remplir les champs obligatoires** :
   - Titre, Description
   - Matière (Subject), Niveau
   - Type de leçon, Difficulté
   - Durée estimée

4. **Structurer le contenu JSON** :
   ```javascript
   {
     "content": {
       "transcript": "Votre cours ici...",
       "keyPoints": [...],
       "exercises": [...],
       "resources": [...]
     }
   }
   ```

5. **Ajouter un Quiz** (optionnel) :
   - Cocher "Contient un quiz"
   - Structurer les questions selon le format ci-dessus

6. **Statut de révision** :
   - `draft` → Brouillon (non visible)
   - `pending_review` → En attente de validation
   - `approved` → Publié et visible aux étudiants

7. **Sauvegarder** → Le cours sera dans `content-store.json`

8. **Migrer vers la base de données** :
   ```bash
   cd /opt/claudyne/backend
   node scripts/migrate-courses-to-db.js
   ```

---

## 7️⃣ CONSEILS PÉDAGOGIQUES

### ✅ BONNES PRATIQUES

1. **Progression logique** :
   - Commencer par des concepts simples
   - Augmenter progressivement la difficulté
   - Relier aux prérequis explicitement

2. **Ancrage local** :
   - Utiliser des exemples camerounais
   - Références culturelles pertinentes
   - Termes en langues locales quand approprié

3. **Multimodalité** :
   - Combiner vidéo + texte + exercices
   - Ajouter des ressources externes (liens, PDFs)
   - Proposer des manipulations interactives

4. **Évaluation progressive** :
   - Exercices après chaque point clé
   - Quiz récapitulatif en fin de leçon
   - Niveaux de difficulté variés

### ❌ ERREURS À ÉVITER

1. **Contenu trop dense** : Diviser en plusieurs leçons si > 60 min
2. **Absence d'exemples** : Toujours illustrer les concepts
3. **Quiz trop difficile** : Adapter au niveau et au contenu
4. **Pas de contexte** : Expliquer "pourquoi c'est utile"
5. **Mauvais JSON** : Valider la syntaxe avant sauvegarde

---

## 8️⃣ VALIDATION ET TESTS

### Avant Publication

- [ ] Tous les champs obligatoires remplis
- [ ] JSON syntaxiquement correct
- [ ] Durée cohérente avec le contenu
- [ ] Exercices avec solutions
- [ ] Quiz testé (si présent)
- [ ] Références camerounaises incluses
- [ ] Orthographe et grammaire vérifiées

### Après Migration

```bash
# Vérifier que la leçon est en DB
sqlite3 database/claudyne_dev.sqlite "SELECT id, title FROM lessons WHERE title LIKE '%Votre titre%';"

# Tester via l'API
curl http://localhost:3001/api/students/subjects
```

---

## 📞 SUPPORT

Pour toute question sur la création de contenu :
- **Email** : admin@claudyne.com
- **Documentation** : `/docs/content-creation`
- **Exemples** : Voir les cours existants dans l'interface admin

---

**💚 La force du savoir en héritage - Claudine 💚**
