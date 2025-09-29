// ====================================================================
// 📚 CURRICULUM ÉDUCATIF CAMEROUNAIS - 13 NIVEAUX & 24 MATIÈRES
// ====================================================================

// ====================================================================
// 🎓 NIVEAUX ÉDUCATIFS CAMEROUNAIS (13 NIVEAUX)
// ====================================================================
const NIVEAUX_CAMEROUNAIS = [
  // MATERNELLE
  { id: 1, code: 'SIL', name: 'Section des Initiés à la Lecture (SIL)', cycle: 'maternelle', order: 1 },

  // PRIMAIRE
  { id: 2, code: 'CP', name: 'Cours Préparatoire (CP)', cycle: 'primaire', order: 2 },
  { id: 3, code: 'CE1', name: 'Cours Élémentaire 1ère année (CE1)', cycle: 'primaire', order: 3 },
  { id: 4, code: 'CE2', name: 'Cours Élémentaire 2ème année (CE2)', cycle: 'primaire', order: 4 },
  { id: 5, code: 'CM1', name: 'Cours Moyen 1ère année (CM1)', cycle: 'primaire', order: 5 },
  { id: 6, code: 'CM2', name: 'Cours Moyen 2ème année (CM2)', cycle: 'primaire', order: 6 },

  // SECONDAIRE 1ER CYCLE
  { id: 7, code: '6EME', name: 'Classe de 6ème', cycle: 'secondaire_1', order: 7 },
  { id: 8, code: '5EME', name: 'Classe de 5ème', cycle: 'secondaire_1', order: 8 },
  { id: 9, code: '4EME', name: 'Classe de 4ème', cycle: 'secondaire_1', order: 9 },
  { id: 10, code: '3EME', name: 'Classe de 3ème', cycle: 'secondaire_1', order: 10 },

  // SECONDAIRE 2ÈME CYCLE
  { id: 11, code: '2NDE', name: 'Classe de 2nde', cycle: 'secondaire_2', order: 11 },
  { id: 12, code: '1ERE', name: 'Classe de 1ère', cycle: 'secondaire_2', order: 12 },
  { id: 13, code: 'TERM', name: 'Classe de Terminale', cycle: 'secondaire_2', order: 13 }
];

// ====================================================================
// 📖 MATIÈRES DU CURRICULUM CAMEROUNAIS (24 MATIÈRES)
// ====================================================================
const MATIERES_CAMEROUNAISES = [
  // MATIÈRES FONDAMENTALES
  { id: 1, code: 'FRANCAIS', name: 'Français', domaine: 'langues', obligatoire: true },
  { id: 2, code: 'ANGLAIS', name: 'Anglais', domaine: 'langues', obligatoire: true },
  { id: 3, code: 'MATHS', name: 'Mathématiques', domaine: 'sciences', obligatoire: true },
  { id: 4, code: 'PHYSIQUE', name: 'Physique', domaine: 'sciences', obligatoire: false },
  { id: 5, code: 'CHIMIE', name: 'Chimie', domaine: 'sciences', obligatoire: false },
  { id: 6, code: 'SVT', name: 'Sciences de la Vie et de la Terre', domaine: 'sciences', obligatoire: true },

  // SCIENCES HUMAINES
  { id: 7, code: 'HISTOIRE', name: 'Histoire', domaine: 'sciences_humaines', obligatoire: true },
  { id: 8, code: 'GEOGRAPHIE', name: 'Géographie', domaine: 'sciences_humaines', obligatoire: true },
  { id: 9, code: 'ECM', name: 'Éducation à la Citoyenneté et à la Morale', domaine: 'sciences_humaines', obligatoire: true },
  { id: 10, code: 'PHILOSOPHIE', name: 'Philosophie', domaine: 'sciences_humaines', obligatoire: false },

  // LANGUES NATIONALES
  { id: 11, code: 'LANGUES_NAT', name: 'Langues Nationales', domaine: 'langues', obligatoire: false },
  { id: 12, code: 'ALLEMAND', name: 'Allemand', domaine: 'langues', obligatoire: false },
  { id: 13, code: 'ESPAGNOL', name: 'Espagnol', domaine: 'langues', obligatoire: false },

  // ARTS ET CULTURE
  { id: 14, code: 'ARTS_PLAST', name: 'Arts Plastiques', domaine: 'arts', obligatoire: false },
  { id: 15, code: 'MUSIQUE', name: 'Éducation Musicale', domaine: 'arts', obligatoire: false },
  { id: 16, code: 'DANSE', name: 'Danse Traditionnelle', domaine: 'arts', obligatoire: false },

  // ÉDUCATION PHYSIQUE ET TECHNIQUE
  { id: 17, code: 'EPS', name: 'Éducation Physique et Sportive', domaine: 'physique', obligatoire: true },
  { id: 18, code: 'TECHNO', name: 'Technologie', domaine: 'technique', obligatoire: false },
  { id: 19, code: 'INFORMATIQUE', name: 'Informatique', domaine: 'technique', obligatoire: false },

  // FORMATION PROFESSIONNELLE
  { id: 20, code: 'COMPTABILITE', name: 'Comptabilité', domaine: 'professionnel', obligatoire: false },
  { id: 21, code: 'ECONOMIE', name: 'Économie', domaine: 'professionnel', obligatoire: false },
  { id: 22, code: 'GESTION', name: 'Organisation et Gestion', domaine: 'professionnel', obligatoire: false },

  // DÉVELOPPEMENT PERSONNEL
  { id: 23, code: 'LECTURE', name: 'Lecture et Compréhension', domaine: 'developpement', obligatoire: true },
  { id: 24, code: 'ECRITURE', name: 'Expression Écrite', domaine: 'developpement', obligatoire: true }
];

// ====================================================================
// 🎯 CORRESPONDANCE NIVEAUX-MATIÈRES
// ====================================================================
const PROGRAMME_PAR_NIVEAU = {
  // MATERNELLE (SIL)
  'SIL': [1, 2, 23, 24, 15, 17], // Français, Anglais, Lecture, Écriture, Musique, EPS

  // PRIMAIRE
  'CP': [1, 2, 3, 23, 24, 17], // Français, Anglais, Maths, Lecture, Écriture, EPS
  'CE1': [1, 2, 3, 6, 9, 17], // + SVT, ECM
  'CE2': [1, 2, 3, 6, 7, 8, 9, 17], // + Histoire, Géographie
  'CM1': [1, 2, 3, 6, 7, 8, 9, 14, 15, 17], // + Arts, Musique
  'CM2': [1, 2, 3, 6, 7, 8, 9, 14, 15, 17, 18], // + Technologie

  // SECONDAIRE 1ER CYCLE
  '6EME': [1, 2, 3, 4, 5, 6, 7, 8, 9, 14, 15, 17, 18, 19], // Base complète
  '5EME': [1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 14, 15, 17, 18, 19], // + Allemand
  '4EME': [1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 13, 14, 15, 17, 18, 19], // + Espagnol
  '3EME': [1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 13, 14, 15, 17, 18, 19, 20], // + Comptabilité

  // SECONDAIRE 2ÈME CYCLE
  '2NDE': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 17, 18, 19, 20, 21], // + Philosophie, Économie
  '1ERE': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 17, 19, 20, 21, 22], // + Gestion
  'TERM': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 17, 19, 20, 21, 22] // Programme complet
};

// ====================================================================
// 🎭 RESTRICTIONS PAR FORMULE
// ====================================================================
const ACCES_PAR_FORMULE = {
  'DISCOVERY': {
    matieres_autorisees: [1, 2, 3], // Français, Anglais, Maths seulement
    niveaux_autorises: ['SIL', 'CP', 'CE1'], // Niveaux de base
    duree_jours: 7,
    description: '3 matières de base pour découvrir la plateforme'
  },
  'INDIVIDUAL': {
    matieres_autorisees: 'ALL', // Toutes les matières
    niveaux_autorises: 'ALL', // Tous les niveaux
    max_students: 1,
    description: 'Accès complet pour 1 élève'
  },
  'FAMILY': {
    matieres_autorisees: 'ALL', // Toutes les matières
    niveaux_autorises: 'ALL', // Tous les niveaux
    max_students: 3,
    features_bonus: ['dashboard_parents', 'suivi_personnalise', 'rapports_detailles'],
    description: 'Accès complet pour jusqu\'à 3 enfants avec dashboard parents'
  }
};

module.exports = {
  NIVEAUX_CAMEROUNAIS,
  MATIERES_CAMEROUNAISES,
  PROGRAMME_PAR_NIVEAU,
  ACCES_PAR_FORMULE
};