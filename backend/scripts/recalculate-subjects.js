/**
 * Script pour recalculer les agrégats de subjects basés sur les cours/quiz existants
 */

const fs = require('fs');
const path = require('path');

const contentStoreFile = path.join(__dirname, '../content-store.json');

const SUBJECT_LABELS = {
  mathematiques: 'Mathématiques',
  physique: 'Physique',
  chimie: 'Chimie',
  biologie: 'Biologie',
  francais: 'Français',
  anglais: 'Anglais',
  histoire: 'Histoire',
  geographie: 'Géographie',
  informatique: 'Informatique'
};

const getSubjectLabel = (subjectId) => SUBJECT_LABELS[subjectId] || subjectId || 'Matière';

const refreshSubjectAggregates = (store) => {
  const subjectIndex = {};

  store.courses.forEach((course) => {
    const id = course.subject || 'autre';
    if (!subjectIndex[id]) {
      subjectIndex[id] = {
        id,
        title: getSubjectLabel(id),
        lessons: 0,
        quizzes: 0,
        students: 0,
        averageScore: 0,
        status: 'active'
      };
    }
    subjectIndex[id].lessons++;
  });

  store.quizzes.forEach((quiz) => {
    const id = quiz.subject || 'autre';
    if (!subjectIndex[id]) {
      subjectIndex[id] = {
        id,
        title: getSubjectLabel(id),
        lessons: 0,
        quizzes: 0,
        students: 0,
        averageScore: 0,
        status: 'active'
      };
    }
    subjectIndex[id].quizzes++;
  });

  return Object.values(subjectIndex);
};

// Lire le fichier
console.log('Lecture de content-store.json...');
const data = fs.readFileSync(contentStoreFile, 'utf8');
const store = JSON.parse(data);

console.log('État actuel:');
console.log(`- Courses: ${store.courses.length}`);
console.log(`- Quizzes: ${store.quizzes.length}`);
console.log(`- Resources: ${store.resources.length}`);
console.log(`- Subjects (avant): ${store.subjects.length}`);

// Recalculer les subjects
store.subjects = refreshSubjectAggregates(store);

console.log(`- Subjects (après): ${store.subjects.length}`);
console.log('\nDétails des subjects:');
store.subjects.forEach(subject => {
  console.log(`  - ${subject.title}: ${subject.lessons} cours, ${subject.quizzes} quiz`);
});

// Sauvegarder
fs.writeFileSync(contentStoreFile, JSON.stringify(store, null, 2), 'utf8');
console.log('\n✅ Fichier sauvegardé avec succès !');
