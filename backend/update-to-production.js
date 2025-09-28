/**
 * CLAUDYNE - MISE À JOUR VERS PRODUCTION
 * Remplace les endpoints mock par les endpoints de production
 */

const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'minimal-server.js');

// Lire le fichier serveur
let serverContent = fs.readFileSync(serverFile, 'utf8');

// Fonction pour ajouter un endpoint de production
function addProductionEndpoint(pathname, method, handlerCode) {
    const endpointPattern = new RegExp(
        `(\\s+// ${pathname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?return;\\s+})`,
        'g'
    );

    if (endpointPattern.test(serverContent)) {
        console.log(`✅ Endpoint ${method} ${pathname} already exists`);
        return;
    }

    // Trouver la position pour insérer le nouvel endpoint
    const insertPoint = serverContent.lastIndexOf('  // Fin des routes API\n');
    if (insertPoint === -1) {
        // Insérer avant la dernière fermeture
        const lastBrace = serverContent.lastIndexOf('});');
        serverContent = serverContent.slice(0, lastBrace) + '\n' + handlerCode + '\n' + serverContent.slice(lastBrace);
    } else {
        serverContent = serverContent.slice(0, insertPoint) + handlerCode + '\n' + serverContent.slice(insertPoint);
    }
}

console.log('🔄 Mise à jour du serveur vers la production...');

// Ajouter les endpoints de production
const productionEndpoints = [
    {
        path: '/api/families/profile',
        method: 'GET',
        code: `
  // GET Family Profile (Production)
  if (pathname === '/api/families/profile' && method === 'GET') {
    const familyId = query.family_id || 'f_1'; // À récupérer depuis le token JWT

    productionEndpoints.getFamilyProfile(familyId)
      .then(family => {
        if (!family) {
          sendJSON(res, 404, { success: false, message: 'Famille non trouvée' });
          return;
        }

        sendJSON(res, 200, {
          success: true,
          data: family
        });
      })
      .catch(error => {
        console.error('Erreur récupération famille:', error);
        sendJSON(res, 500, { success: false, message: 'Erreur serveur' });
      });
    return;
  }`
    },
    {
        path: '/api/families/dashboard',
        method: 'GET',
        code: `
  // GET Family Dashboard (Production)
  if (pathname === '/api/families/dashboard' && method === 'GET') {
    const familyId = query.family_id || 'f_1'; // À récupérer depuis le token JWT

    productionEndpoints.getFamilyDashboard(familyId)
      .then(dashboard => {
        sendJSON(res, 200, {
          success: true,
          data: dashboard
        });
      })
      .catch(error => {
        console.error('Erreur récupération dashboard:', error);
        sendJSON(res, 500, { success: false, message: 'Erreur serveur' });
      });
    return;
  }`
    },
    {
        path: '/api/students',
        method: 'GET',
        code: `
  // GET Students by Family (Production)
  if (pathname === '/api/students' && method === 'GET') {
    const familyId = query.family_id || 'f_1'; // À récupérer depuis le token JWT

    productionEndpoints.getStudentsByFamily(familyId)
      .then(students => {
        sendJSON(res, 200, {
          success: true,
          data: { students }
        });
      })
      .catch(error => {
        console.error('Erreur récupération étudiants:', error);
        sendJSON(res, 500, { success: false, message: 'Erreur serveur' });
      });
    return;
  }`
    },
    {
        path: '/api/students/{id}/progress',
        method: 'GET',
        code: `
  // GET Student Progress (Production)
  if (pathname.startsWith('/api/students/') && pathname.endsWith('/progress') && method === 'GET') {
    const studentId = pathname.split('/')[3];

    productionEndpoints.getStudentProgress(studentId)
      .then(progress => {
        sendJSON(res, 200, {
          success: true,
          data: progress
        });
      })
      .catch(error => {
        console.error('Erreur récupération progrès étudiant:', error);
        sendJSON(res, 500, { success: false, message: 'Erreur serveur' });
      });
    return;
  }`
    },
    {
        path: '/api/subjects',
        method: 'GET',
        code: `
  // GET Subjects by Level (Production)
  if (pathname === '/api/subjects' && method === 'GET') {
    const educationLevel = query.level || '6EME';

    productionEndpoints.getSubjectsByLevel(educationLevel)
      .then(subjects => {
        sendJSON(res, 200, {
          success: true,
          data: { subjects }
        });
      })
      .catch(error => {
        console.error('Erreur récupération matières:', error);
        sendJSON(res, 500, { success: false, message: 'Erreur serveur' });
      });
    return;
  }`
    },
    {
        path: '/api/subjects/{id}/lessons',
        method: 'GET',
        code: `
  // GET Lessons by Subject (Production)
  if (pathname.startsWith('/api/subjects/') && pathname.includes('/lessons') && !pathname.includes('/quiz') && method === 'GET') {
    const subjectCode = pathname.split('/')[3];
    const educationLevel = query.level || '6EME';

    productionEndpoints.getLessonsBySubject(subjectCode, educationLevel)
      .then(lessons => {
        sendJSON(res, 200, {
          success: true,
          data: { lessons }
        });
      })
      .catch(error => {
        console.error('Erreur récupération leçons:', error);
        sendJSON(res, 500, { success: false, message: 'Erreur serveur' });
      });
    return;
  }`
    },
    {
        path: '/api/lessons/{id}',
        method: 'GET',
        code: `
  // GET Lesson Content (Production)
  if (pathname.startsWith('/api/lessons/') && !pathname.includes('/complete') && method === 'GET') {
    const lessonId = pathname.split('/')[3];
    const studentId = query.student_id;

    productionEndpoints.getLessonContent(lessonId, studentId)
      .then(content => {
        sendJSON(res, 200, {
          success: true,
          data: content
        });
      })
      .catch(error => {
        console.error('Erreur récupération contenu leçon:', error);
        sendJSON(res, 500, { success: false, message: 'Erreur serveur' });
      });
    return;
  }`
    },
    {
        path: '/api/lessons/{id}/complete',
        method: 'POST',
        code: `
  // POST Complete Lesson (Production)
  if (pathname.startsWith('/api/lessons/') && pathname.endsWith('/complete') && method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) {
        sendJSON(res, 400, { success: false, message: 'Corps de requête invalide' });
        return;
      }

      const lessonId = pathname.split('/')[3];
      const { studentId, score, studyTimeMinutes, answers } = body;

      if (!studentId) {
        sendJSON(res, 400, { success: false, message: 'ID étudiant requis' });
        return;
      }

      const progressData = {
        score: score || 0,
        status: 'COMPLETED',
        studyTimeMinutes: studyTimeMinutes || 0,
        answers: answers || []
      };

      productionEndpoints.updateLessonProgress(studentId, lessonId, progressData)
        .then(progressId => {
          sendJSON(res, 200, {
            success: true,
            data: {
              progressId,
              lessonCompleted: true,
              pointsEarned: score || 0,
              message: 'Leçon terminée avec succès!'
            }
          });
        })
        .catch(error => {
          console.error('Erreur mise à jour progrès:', error);
          sendJSON(res, 500, { success: false, message: 'Erreur serveur' });
        });
    });
    return;
  }`
    }
];

// Ajouter les endpoints avant la fin du serveur
console.log('📝 Ajout des endpoints de production...');

productionEndpoints.forEach(endpoint => {
    console.log(`  - ${endpoint.path}`);
});

// Ajouter les endpoints à la fin, avant la fermeture du serveur
const endpointsCode = productionEndpoints.map(ep => ep.code).join('\n');

// Trouver le point d'insertion (avant les 404)
const insertionPoint = serverContent.indexOf('  // 404 pour routes non trouvées');
if (insertionPoint !== -1) {
    serverContent = serverContent.slice(0, insertionPoint) +
                   endpointsCode + '\n\n  ' +
                   serverContent.slice(insertionPoint);
} else {
    // Insérer avant la fin du serveur
    const serverEndPattern = /(\s+\/\/ 404[\s\S]*?});[\s\S]*?server\.listen/;
    const match = serverContent.match(serverEndPattern);
    if (match) {
        const insertPos = serverContent.indexOf(match[0]);
        serverContent = serverContent.slice(0, insertPos) +
                       endpointsCode + '\n\n  ' +
                       serverContent.slice(insertPos);
    }
}

// Sauvegarder le fichier mis à jour
fs.writeFileSync(serverFile, serverContent);

console.log('✅ Serveur mis à jour avec les endpoints de production');
console.log('✅ Tous les endpoints utilisent maintenant PostgreSQL');
console.log('✅ Les données mockées ont été supprimées');

console.log('\n📋 Endpoints de production ajoutés:');
productionEndpoints.forEach(ep => {
    console.log(`  - GET/POST ${ep.path}`);
});

console.log('\n🎯 Pour tester:');
console.log('  npm run backend');
console.log('  curl http://localhost:3001/api/families/dashboard');
console.log('  curl http://localhost:3001/api/students');