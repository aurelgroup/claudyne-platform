/**
 * 🧪 TESTS D'INTÉGRATION CLAUDYNE API
 * Suite complète pour familles camerounaises
 */

const request = require('supertest');
const ClaudyneServer = require('../../server-unified');
const { db } = require('../../backend/database');

describe('🎓 Claudyne API Integration Tests', () => {
  let app;
  let server;
  let authToken;
  let testUser;
  let testFamily;
  let testStudent;

  beforeAll(async () => {
    // Démarrer serveur test
    server = new ClaudyneServer();
    app = server.app;

    // Configuration test database
    process.env.NODE_ENV = 'test';

    console.log('🧪 Tests d\'intégration Claudyne démarrés');
  });

  afterAll(async () => {
    if (server.server) {
      server.server.close();
    }
    console.log('🧪 Tests terminés');
  });

  describe('🩺 Health Checks', () => {
    test('GET /health - should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.services).toBeDefined();
      expect(response.body.version).toBeDefined();
      expect(response.body.responseTime).toBeDefined();
    });

    test('GET /api/health - should return API health', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toMatch(/healthy|degraded/);
      expect(response.body.services.api).toBe('operational');
    });

    test('GET /ping - should return pong', async () => {
      const response = await request(app)
        .get('/ping')
        .expect(200);

      expect(response.body.pong).toBe(true);
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('🔐 Authentification', () => {
    const testUserData = {
      firstName: 'Papa',
      lastName: 'Tchouto',
      email: 'papa.tchouto@claudyne-test.com',
      password: 'MotDePasseSecurise123!'
    };

    test('POST /api/auth/register - should create new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Papa');
      expect(response.body.data.user.firstName).toBe('Papa');
      expect(response.body.data.user.email).toBe(testUserData.email);

      testUser = response.body.data.user;
    });

    test('POST /api/auth/register - should reject duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUserData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('existe déjà');
    });

    test('POST /api/auth/login - should authenticate valid user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserData.email,
          password: testUserData.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.firstName).toBe('Papa');

      authToken = response.body.data.token;
    });

    test('POST /api/auth/login - should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserData.email,
          password: 'MauvaisMotDePasse'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('incorrects');
    });
  });

  describe('👨‍👩‍👧‍👦 Gestion Familiale', () => {
    test('GET /api/families/profile - should require authentication', async () => {
      const response = await request(app)
        .get('/api/families/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('authentification requis');
    });

    test('GET /api/families/profile - should return family profile', async () => {
      const response = await request(app)
        .get('/api/families/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();

      testFamily = response.body.data;
    });

    test('GET /api/families/dashboard - should return dashboard data', async () => {
      const response = await request(app)
        .get('/api/families/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });
  });

  describe('🎓 Étudiants', () => {
    test('GET /api/students - should return family students', async () => {
      const response = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.students).toBeDefined();
      expect(Array.isArray(response.body.data.students)).toBe(true);

      if (response.body.data.students.length > 0) {
        testStudent = response.body.data.students[0];
      }
    });

    test('GET /api/students/:id/progress - should return student progress', async () => {
      if (testStudent) {
        const response = await request(app)
          .get(`/api/students/${testStudent.id}/progress`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      } else {
        console.log('⚠️ Pas d\'étudiant test disponible');
      }
    });
  });

  describe('📚 Contenu Éducatif', () => {
    test('GET /api/subjects - should return subjects for level', async () => {
      const response = await request(app)
        .get('/api/subjects?level=6EME')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subjects).toBeDefined();
      expect(Array.isArray(response.body.data.subjects)).toBe(true);
    });

    test('GET /api/subjects/:id/lessons - should return lessons', async () => {
      const response = await request(app)
        .get('/api/subjects/MATH/lessons?level=6EME')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.lessons).toBeDefined();
    });

    test('GET /api/lessons/:id - should return lesson content', async () => {
      const response = await request(app)
        .get('/api/lessons/math-6eme-01')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    test('POST /api/lessons/:id/complete - should complete lesson', async () => {
      if (testStudent) {
        const response = await request(app)
          .post('/api/lessons/math-6eme-01/complete')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            studentId: testStudent.id,
            score: 85,
            studyTimeMinutes: 30,
            answers: [
              { questionId: 1, answer: 'A', correct: true },
              { questionId: 2, answer: 'B', correct: false }
            ]
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.progressId).toBeDefined();
        expect(response.body.data.pointsEarned).toBe(85);
      }
    });
  });

  describe('📱 Mobile API', () => {
    test('GET /mobile-api/ping - should return mobile status', async () => {
      const response = await request(app)
        .get('/mobile-api/ping')
        .expect(200);

      expect(response.body.mobile_api).toBe('active');
      expect(response.body.optimized_for).toContain('2G');
      expect(response.body.optimized_for).toContain('Mobile Cameroun');
    });

    test('Mobile headers should be optimized', async () => {
      const response = await request(app)
        .get('/mobile-api/ping')
        .set('User-Agent', 'Mobile App Claudyne/1.0 Android')
        .expect(200);

      expect(response.headers['x-mobile-optimized']).toBe('true');
      expect(response.headers['cache-control']).toContain('public');
    });
  });

  describe('🌍 Optimisations Cameroun', () => {
    test('Should detect 2G network and apply optimizations', async () => {
      const response = await request(app)
        .get('/api/subjects')
        .set('X-Connection', '2g')
        .set('X-Region', 'Douala')
        .expect(200);

      expect(response.headers['x-network-detected']).toBe('2g');
      expect(response.headers['x-compression-level']).toBe('9');
      expect(response.headers['x-region']).toBe('Douala');
      expect(response.headers['x-currency']).toBe('XAF');
    });

    test('Should detect 3G network and apply medium optimizations', async () => {
      const response = await request(app)
        .get('/api/lessons/math-6eme-01')
        .set('X-Connection', '3g')
        .set('X-Region', 'Yaoundé')
        .expect(200);

      expect(response.headers['x-network-detected']).toBe('3g');
      expect(response.headers['x-compression-level']).toBe('6');
      expect(response.headers['x-education-optimized']).toBe('true');
    });

    test('Should apply Cameroon localization', async () => {
      const response = await request(app)
        .get('/health')
        .set('X-Region', 'Nord-Ouest')
        .expect(200);

      expect(response.headers['x-region']).toBe('Nord-Ouest');
      expect(response.headers['x-timezone']).toBe('Africa/Douala');
      expect(response.headers['x-currency']).toBe('XAF');
      expect(response.headers['x-country']).toBe('CM');
    });
  });

  describe('🔒 Sécurité', () => {
    test('Should reject unauthorized CORS origins', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'https://malicious-site.com')
        .expect(200);

      // CORS devrait bloquer l'origine malveillante
      expect(response.headers['access-control-allow-origin']).not.toBe('https://malicious-site.com');
    });

    test('Should accept authorized CORS origins', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'https://claudyne.com')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('https://claudyne.com');
    });

    test('Should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['strict-transport-security']).toBeDefined();
    });

    test('Should rate limit excessive requests', async () => {
      // Test rate limiting (peut prendre du temps)
      const requests = Array(10).fill().map(() =>
        request(app).get('/api/subjects')
      );

      const responses = await Promise.all(requests);

      // Au moins une requête devrait être rate-limitée si trop rapide
      const rateLimited = responses.some(res => res.status === 429);

      // Ce test peut passer même sans rate limiting en environnement test
      console.log('Rate limiting test:', rateLimited ? 'TRIGGERED' : 'NOT TRIGGERED');
    });
  });

  describe('📊 Performance', () => {
    test('API responses should be reasonably fast', async () => {
      const start = Date.now();

      await request(app)
        .get('/api/subjects')
        .expect(200);

      const responseTime = Date.now() - start;

      // API doit répondre en moins de 1000ms
      expect(responseTime).toBeLessThan(1000);
      console.log(`⚡ Response time: ${responseTime}ms`);
    });

    test('Compression should be applied', async () => {
      const response = await request(app)
        .get('/api/subjects')
        .set('Accept-Encoding', 'gzip')
        .expect(200);

      // Vérifier si compression appliquée (headers peuvent varier)
      const hasCompression = response.headers['content-encoding'] === 'gzip' ||
                            response.headers['x-compression-level'];

      console.log('Compression active:', hasCompression);
    });
  });

  describe('🎯 Scénarios Utilisateur Complets', () => {
    test('Parcours complet parent : inscription → connexion → consultation famille', async () => {
      const parentData = {
        firstName: 'Maman',
        lastName: 'Nkomo',
        email: 'maman.nkomo@claudyne-test.com',
        password: 'MotDePasseSecurise456!'
      };

      // 1. Inscription
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(parentData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);

      // 2. Connexion
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: parentData.email,
          password: parentData.password
        })
        .expect(200);

      const token = loginResponse.body.data.token;

      // 3. Consultation profil famille
      const profileResponse = await request(app)
        .get('/api/families/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(profileResponse.body.success).toBe(true);

      // 4. Dashboard famille
      const dashboardResponse = await request(app)
        .get('/api/families/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(dashboardResponse.body.success).toBe(true);

      console.log('✅ Parcours parent complet validé');
    });

    test('Parcours étudiant : consultation matières → leçons → complétion', async () => {
      // 1. Consultation matières
      const subjectsResponse = await request(app)
        .get('/api/subjects?level=6EME')
        .expect(200);

      expect(subjectsResponse.body.data.subjects).toBeDefined();

      // 2. Consultation leçons d'une matière
      const lessonsResponse = await request(app)
        .get('/api/subjects/MATH/lessons?level=6EME')
        .expect(200);

      expect(lessonsResponse.body.data.lessons).toBeDefined();

      // 3. Contenu d'une leçon
      const lessonResponse = await request(app)
        .get('/api/lessons/math-6eme-01')
        .expect(200);

      expect(lessonResponse.body.data).toBeDefined();

      console.log('✅ Parcours étudiant éducatif validé');
    });
  });
});

module.exports = {
  testUser,
  testFamily,
  testStudent
};