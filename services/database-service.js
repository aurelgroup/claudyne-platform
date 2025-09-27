/**
 * CLAUDYNE DATABASE SERVICE
 * Service robuste avec fallback PostgreSQL/JSON et retry automatique
 * En hommage à Meffo Mehtah Tchandjio Claudine
 */

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');
const winston = require('winston');

class DatabaseService {
    constructor(config) {
        this.config = config || {};
        this.pool = null;
        this.isConnected = false;
        this.useDatabase = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 seconde de base

        // Fallback vers fichier JSON
        this.jsonPath = path.join(__dirname, '../data/users.json');
        this.dataPath = path.join(__dirname, '../data');

        // Logger
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            transports: [
                new winston.transports.Console({
                    format: winston.format.simple()
                })
            ]
        });

        this.setupJSONFallback();
    }

    // ================================
    // INITIALISATION
    // ================================
    async initialize() {
        this.logger.info('🗄️ Initialisation du service de base de données...');

        try {
            await this.initializePostgreSQL();
        } catch (error) {
            this.logger.warn('⚠️ PostgreSQL non disponible, utilisation du fallback JSON');
            await this.initializeJSONFallback();
        }
    }

    async initializePostgreSQL() {
        if (!this.config.host || !this.config.database) {
            throw new Error('Configuration PostgreSQL manquante');
        }

        const dbConfig = {
            host: this.config.host,
            port: this.config.port || 5432,
            database: this.config.database,
            user: this.config.username || this.config.user,
            password: this.config.password,
            ssl: this.config.ssl || false,
            max: this.config.pool?.max || 20,
            idleTimeoutMillis: this.config.pool?.idleTimeoutMillis || 30000,
            connectionTimeoutMillis: this.config.pool?.connectionTimeoutMillis || 5000,
        };

        this.pool = new Pool(dbConfig);

        // Test de connexion avec retry
        await this.testConnectionWithRetry();

        // Initialiser le schéma si nécessaire
        await this.initializeSchema();

        this.useDatabase = true;
        this.isConnected = true;

        this.logger.info(`✅ PostgreSQL connecté (${dbConfig.database}@${dbConfig.host}:${dbConfig.port})`);

        // Gestion des erreurs de connexion
        this.pool.on('error', (err) => {
            this.logger.error('❌ Erreur PostgreSQL:', err);
            this.handleConnectionError();
        });
    }

    async testConnectionWithRetry() {
        let attempts = 0;
        const maxAttempts = this.maxRetries;

        while (attempts < maxAttempts) {
            try {
                const client = await this.pool.connect();
                await client.query('SELECT NOW()');
                client.release();
                return; // Succès
            } catch (error) {
                attempts++;
                this.logger.warn(`⚠️ Tentative de connexion ${attempts}/${maxAttempts} échouée:`, error.message);

                if (attempts >= maxAttempts) {
                    throw new Error(`Impossible de se connecter après ${maxAttempts} tentatives`);
                }

                // Exponential backoff
                const delay = this.retryDelay * Math.pow(2, attempts - 1);
                this.logger.info(`⏳ Retry dans ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    async initializeSchema() {
        const client = await this.pool.connect();

        try {
            // Créer les tables si elles n'existent pas
            await client.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    firstname VARCHAR(100) NOT NULL,
                    lastname VARCHAR(100) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    role VARCHAR(50) DEFAULT 'PARENT',
                    phone VARCHAR(20),
                    address TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP,
                    is_active BOOLEAN DEFAULT true
                );
            `);

            await client.query(`
                CREATE TABLE IF NOT EXISTS families (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(200) NOT NULL,
                    user_id INTEGER REFERENCES users(id),
                    address TEXT,
                    phone VARCHAR(20),
                    emergency_contact VARCHAR(20),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            await client.query(`
                CREATE TABLE IF NOT EXISTS students (
                    id SERIAL PRIMARY KEY,
                    firstname VARCHAR(100) NOT NULL,
                    lastname VARCHAR(100) NOT NULL,
                    family_id INTEGER REFERENCES families(id),
                    date_of_birth DATE,
                    gender VARCHAR(10),
                    level VARCHAR(20),
                    school VARCHAR(200),
                    avatar_url TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    is_active BOOLEAN DEFAULT true
                );
            `);

            await client.query(`
                CREATE TABLE IF NOT EXISTS subjects (
                    id SERIAL PRIMARY KEY,
                    code VARCHAR(20) UNIQUE NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    level VARCHAR(20) NOT NULL,
                    description TEXT,
                    icon_url TEXT,
                    color VARCHAR(7),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            await client.query(`
                CREATE TABLE IF NOT EXISTS lessons (
                    id SERIAL PRIMARY KEY,
                    subject_code VARCHAR(20) REFERENCES subjects(code),
                    level VARCHAR(20) NOT NULL,
                    title VARCHAR(200) NOT NULL,
                    description TEXT,
                    content JSONB,
                    duration_minutes INTEGER DEFAULT 30,
                    difficulty VARCHAR(20) DEFAULT 'MEDIUM',
                    order_index INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    is_active BOOLEAN DEFAULT true
                );
            `);

            await client.query(`
                CREATE TABLE IF NOT EXISTS student_progress (
                    id SERIAL PRIMARY KEY,
                    student_id INTEGER REFERENCES students(id),
                    lesson_id INTEGER REFERENCES lessons(id),
                    status VARCHAR(20) DEFAULT 'NOT_STARTED',
                    score INTEGER DEFAULT 0,
                    study_time_minutes INTEGER DEFAULT 0,
                    started_at TIMESTAMP,
                    completed_at TIMESTAMP,
                    answers JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(student_id, lesson_id)
                );
            `);

            // Index pour les performances
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
                CREATE INDEX IF NOT EXISTS idx_families_user_id ON families(user_id);
                CREATE INDEX IF NOT EXISTS idx_students_family_id ON students(family_id);
                CREATE INDEX IF NOT EXISTS idx_lessons_subject_level ON lessons(subject_code, level);
                CREATE INDEX IF NOT EXISTS idx_progress_student_lesson ON student_progress(student_id, lesson_id);
            `);

            this.logger.info('✅ Schéma PostgreSQL initialisé');
        } finally {
            client.release();
        }
    }

    async setupJSONFallback() {
        try {
            await fs.mkdir(this.dataPath, { recursive: true });

            // Créer le fichier JSON s'il n'existe pas
            try {
                await fs.access(this.jsonPath);
            } catch {
                const initialData = {
                    users: [],
                    families: [],
                    students: [],
                    subjects: this.getDefaultSubjects(),
                    lessons: this.getDefaultLessons(),
                    progress: []
                };
                await fs.writeFile(this.jsonPath, JSON.stringify(initialData, null, 2));
                this.logger.info('📄 Fichier JSON créé avec données par défaut');
            }
        } catch (error) {
            this.logger.error('❌ Erreur setup JSON fallback:', error);
        }
    }

    async initializeJSONFallback() {
        this.useDatabase = false;
        this.isConnected = false;
        this.logger.info('📄 Mode fallback JSON activé');
    }

    // ================================
    // GESTION DES ERREURS
    // ================================
    async handleConnectionError() {
        if (this.useDatabase) {
            this.logger.warn('⚠️ Perte de connexion PostgreSQL, passage en mode fallback JSON');
            this.useDatabase = false;
            this.isConnected = false;
        }
    }

    async executeWithFallback(pgQuery, jsonOperation) {
        if (this.useDatabase && this.pool) {
            try {
                return await pgQuery();
            } catch (error) {
                this.logger.error('❌ Erreur PostgreSQL, fallback vers JSON:', error.message);
                this.handleConnectionError();
                return await jsonOperation();
            }
        } else {
            return await jsonOperation();
        }
    }

    // ================================
    // OPERATIONS JSON
    // ================================
    async readJSONData() {
        try {
            const data = await fs.readFile(this.jsonPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            this.logger.error('❌ Erreur lecture JSON:', error);
            throw error;
        }
    }

    async writeJSONData(data) {
        try {
            await fs.writeFile(this.jsonPath, JSON.stringify(data, null, 2));
        } catch (error) {
            this.logger.error('❌ Erreur écriture JSON:', error);
            throw error;
        }
    }

    // ================================
    // API PUBLIQUE - AUTHENTIFICATION
    // ================================
    async authenticateUser(email, password) {
        const pgQuery = async () => {
            const client = await this.pool.connect();
            try {
                const result = await client.query(
                    'SELECT * FROM users WHERE email = $1 AND is_active = true',
                    [email]
                );

                if (result.rows.length === 0) return null;

                const user = result.rows[0];
                const isValid = await bcrypt.compare(password, user.password);
                return isValid ? user : null;
            } finally {
                client.release();
            }
        };

        const jsonOperation = async () => {
            const data = await this.readJSONData();
            const user = data.users.find(u => u.email === email && u.is_active !== false);

            if (!user) return null;

            const isValid = await bcrypt.compare(password, user.password);
            return isValid ? user : null;
        };

        return await this.executeWithFallback(pgQuery, jsonOperation);
    }

    async createUser(userData) {
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        const user = {
            ...userData,
            password: hashedPassword,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_active: true
        };

        const pgQuery = async () => {
            const client = await this.pool.connect();
            try {
                const result = await client.query(`
                    INSERT INTO users (firstname, lastname, email, password, role, phone, address, created_at, updated_at, is_active)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    RETURNING *
                `, [
                    user.firstname, user.lastname, user.email, user.password,
                    user.role || 'PARENT', user.phone || null, user.address || null,
                    user.created_at, user.updated_at, user.is_active
                ]);

                return result.rows[0];
            } finally {
                client.release();
            }
        };

        const jsonOperation = async () => {
            const data = await this.readJSONData();
            const newUser = {
                ...user,
                id: data.users.length > 0 ? Math.max(...data.users.map(u => u.id)) + 1 : 1
            };
            data.users.push(newUser);
            await this.writeJSONData(data);
            return newUser;
        };

        return await this.executeWithFallback(pgQuery, jsonOperation);
    }

    async getUserByEmail(email) {
        const pgQuery = async () => {
            const client = await this.pool.connect();
            try {
                const result = await client.query(
                    'SELECT * FROM users WHERE email = $1',
                    [email]
                );
                return result.rows[0] || null;
            } finally {
                client.release();
            }
        };

        const jsonOperation = async () => {
            const data = await this.readJSONData();
            return data.users.find(u => u.email === email) || null;
        };

        return await this.executeWithFallback(pgQuery, jsonOperation);
    }

    async updateLastLogin(userId) {
        const now = new Date().toISOString();

        const pgQuery = async () => {
            const client = await this.pool.connect();
            try {
                await client.query(
                    'UPDATE users SET last_login = $1, updated_at = $1 WHERE id = $2',
                    [now, userId]
                );
            } finally {
                client.release();
            }
        };

        const jsonOperation = async () => {
            const data = await this.readJSONData();
            const user = data.users.find(u => u.id === userId);
            if (user) {
                user.last_login = now;
                user.updated_at = now;
                await this.writeJSONData(data);
            }
        };

        return await this.executeWithFallback(pgQuery, jsonOperation);
    }

    // ================================
    // API PUBLIQUE - FAMILLES
    // ================================
    async getFamilyProfileByUserId(userId) {
        const pgQuery = async () => {
            const client = await this.pool.connect();
            try {
                const result = await client.query(`
                    SELECT f.*, u.firstname as user_firstname, u.lastname as user_lastname, u.email as user_email
                    FROM families f
                    JOIN users u ON f.user_id = u.id
                    WHERE f.user_id = $1
                `, [userId]);

                return result.rows[0] || null;
            } finally {
                client.release();
            }
        };

        const jsonOperation = async () => {
            const data = await this.readJSONData();
            const family = data.families.find(f => f.user_id === userId);
            if (!family) return null;

            const user = data.users.find(u => u.id === userId);
            return {
                ...family,
                user_firstname: user?.firstname,
                user_lastname: user?.lastname,
                user_email: user?.email
            };
        };

        return await this.executeWithFallback(pgQuery, jsonOperation);
    }

    async getFamilyDashboard(familyId) {
        // Retourner des données de dashboard par défaut
        return {
            familyId,
            totalStudents: 2,
            activeStudents: 2,
            totalLessons: 120,
            completedLessons: 45,
            averageScore: 85,
            weeklyActivity: [
                { day: 'Lun', lessons: 3, time: 45 },
                { day: 'Mar', lessons: 4, time: 60 },
                { day: 'Mer', lessons: 2, time: 30 },
                { day: 'Jeu', lessons: 5, time: 75 },
                { day: 'Ven', lessons: 3, time: 45 },
                { day: 'Sam', lessons: 1, time: 15 },
                { day: 'Dim', lessons: 2, time: 30 }
            ],
            recentAchievements: [
                { student: 'Marie', subject: 'MATH', achievement: 'Leçon terminée avec 95%' },
                { student: 'Paul', subject: 'FRANCAIS', achievement: 'Exercice parfait' }
            ]
        };
    }

    // ================================
    // API PUBLIQUE - ÉTUDIANTS
    // ================================
    async getStudentsByFamily(familyId) {
        const pgQuery = async () => {
            const client = await this.pool.connect();
            try {
                const result = await client.query(
                    'SELECT * FROM students WHERE family_id = $1 AND is_active = true ORDER BY created_at',
                    [familyId]
                );
                return result.rows;
            } finally {
                client.release();
            }
        };

        const jsonOperation = async () => {
            const data = await this.readJSONData();
            return data.students.filter(s => s.family_id == familyId && s.is_active !== false);
        };

        const students = await this.executeWithFallback(pgQuery, jsonOperation);

        // Retourner des étudiants par défaut si aucun trouvé
        if (!students || students.length === 0) {
            return this.getDefaultStudents(familyId);
        }

        return students;
    }

    async getStudentProgress(studentId) {
        const pgQuery = async () => {
            const client = await this.pool.connect();
            try {
                const result = await client.query(`
                    SELECT sp.*, l.title as lesson_title, s.name as subject_name
                    FROM student_progress sp
                    JOIN lessons l ON sp.lesson_id = l.id
                    JOIN subjects s ON l.subject_code = s.code
                    WHERE sp.student_id = $1
                    ORDER BY sp.updated_at DESC
                `, [studentId]);
                return result.rows;
            } finally {
                client.release();
            }
        };

        const jsonOperation = async () => {
            const data = await this.readJSONData();
            return data.progress.filter(p => p.student_id == studentId);
        };

        const progress = await this.executeWithFallback(pgQuery, jsonOperation);
        return progress || [];
    }

    // ================================
    // API PUBLIQUE - MATIÈRES & LEÇONS
    // ================================
    async getSubjectsByLevel(level) {
        const pgQuery = async () => {
            const client = await this.pool.connect();
            try {
                const result = await client.query(
                    'SELECT * FROM subjects WHERE level = $1 ORDER BY name',
                    [level]
                );
                return result.rows;
            } finally {
                client.release();
            }
        };

        const jsonOperation = async () => {
            const data = await this.readJSONData();
            return data.subjects.filter(s => s.level === level);
        };

        const subjects = await this.executeWithFallback(pgQuery, jsonOperation);
        return subjects || this.getDefaultSubjects().filter(s => s.level === level);
    }

    async getLessonsBySubject(subjectCode, level) {
        const pgQuery = async () => {
            const client = await this.pool.connect();
            try {
                const result = await client.query(
                    'SELECT * FROM lessons WHERE subject_code = $1 AND level = $2 AND is_active = true ORDER BY order_index',
                    [subjectCode, level]
                );
                return result.rows;
            } finally {
                client.release();
            }
        };

        const jsonOperation = async () => {
            const data = await this.readJSONData();
            return data.lessons.filter(l => l.subject_code === subjectCode && l.level === level && l.is_active !== false);
        };

        const lessons = await this.executeWithFallback(pgQuery, jsonOperation);
        return lessons || this.getDefaultLessons().filter(l => l.subject_code === subjectCode && l.level === level);
    }

    async getLessonContent(lessonId, studentId) {
        const pgQuery = async () => {
            const client = await this.pool.connect();
            try {
                const result = await client.query(
                    'SELECT * FROM lessons WHERE id = $1 AND is_active = true',
                    [lessonId]
                );
                return result.rows[0] || null;
            } finally {
                client.release();
            }
        };

        const jsonOperation = async () => {
            const data = await this.readJSONData();
            return data.lessons.find(l => l.id == lessonId && l.is_active !== false) || null;
        };

        return await this.executeWithFallback(pgQuery, jsonOperation);
    }

    async updateLessonProgress(studentId, lessonId, progressData) {
        const now = new Date().toISOString();
        const progress = {
            student_id: studentId,
            lesson_id: lessonId,
            ...progressData,
            updated_at: now
        };

        const pgQuery = async () => {
            const client = await this.pool.connect();
            try {
                const result = await client.query(`
                    INSERT INTO student_progress (student_id, lesson_id, status, score, study_time_minutes, completed_at, answers, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    ON CONFLICT (student_id, lesson_id)
                    DO UPDATE SET
                        status = EXCLUDED.status,
                        score = EXCLUDED.score,
                        study_time_minutes = EXCLUDED.study_time_minutes,
                        completed_at = EXCLUDED.completed_at,
                        answers = EXCLUDED.answers,
                        updated_at = EXCLUDED.updated_at
                    RETURNING id
                `, [
                    studentId, lessonId, progress.status, progress.score,
                    progress.studyTimeMinutes, now, JSON.stringify(progress.answers), now
                ]);

                return result.rows[0].id;
            } finally {
                client.release();
            }
        };

        const jsonOperation = async () => {
            const data = await this.readJSONData();
            const existingIndex = data.progress.findIndex(p => p.student_id == studentId && p.lesson_id == lessonId);

            if (existingIndex >= 0) {
                data.progress[existingIndex] = { ...data.progress[existingIndex], ...progress };
            } else {
                progress.id = data.progress.length > 0 ? Math.max(...data.progress.map(p => p.id)) + 1 : 1;
                data.progress.push(progress);
            }

            await this.writeJSONData(data);
            return progress.id;
        };

        return await this.executeWithFallback(pgQuery, jsonOperation);
    }

    // ================================
    // DONNÉES PAR DÉFAUT
    // ================================
    getDefaultStudents(familyId) {
        return [
            {
                id: 1,
                firstname: 'Marie',
                lastname: 'Dubois',
                family_id: familyId,
                date_of_birth: '2010-03-15',
                gender: 'F',
                level: '6EME',
                school: 'Collège Claudyne',
                avatar_url: '/parent-interface/images/avatar-marie.png',
                is_active: true
            },
            {
                id: 2,
                firstname: 'Paul',
                lastname: 'Dubois',
                family_id: familyId,
                date_of_birth: '2012-07-22',
                gender: 'M',
                level: 'CM2',
                school: 'École Primaire Claudyne',
                avatar_url: '/parent-interface/images/avatar-paul.png',
                is_active: true
            }
        ];
    }

    getDefaultSubjects() {
        return [
            {
                id: 1,
                code: 'MATH',
                name: 'Mathématiques',
                level: '6EME',
                description: 'Mathématiques niveau 6ème',
                icon_url: '📐',
                color: '#4CAF50'
            },
            {
                id: 2,
                code: 'FRANCAIS',
                name: 'Français',
                level: '6EME',
                description: 'Français niveau 6ème',
                icon_url: '📚',
                color: '#2196F3'
            },
            {
                id: 3,
                code: 'ANGLAIS',
                name: 'Anglais',
                level: '6EME',
                description: 'Anglais niveau 6ème',
                icon_url: '🇬🇧',
                color: '#FF9800'
            },
            {
                id: 4,
                code: 'SVT',
                name: 'Sciences de la Vie et de la Terre',
                level: '6EME',
                description: 'SVT niveau 6ème',
                icon_url: '🌱',
                color: '#8BC34A'
            }
        ];
    }

    getDefaultLessons() {
        return [
            {
                id: 1,
                subject_code: 'MATH',
                level: '6EME',
                title: 'Les nombres entiers',
                description: 'Introduction aux nombres entiers',
                content: {
                    type: 'lesson',
                    sections: [
                        { type: 'text', content: 'Les nombres entiers sont...' },
                        { type: 'exercise', question: 'Qu\'est-ce qu\'un nombre entier ?' }
                    ]
                },
                duration_minutes: 30,
                difficulty: 'EASY',
                order_index: 1,
                is_active: true
            },
            {
                id: 2,
                subject_code: 'FRANCAIS',
                level: '6EME',
                title: 'Le présent de l\'indicatif',
                description: 'Conjugaison du présent',
                content: {
                    type: 'lesson',
                    sections: [
                        { type: 'text', content: 'Le présent de l\'indicatif...' },
                        { type: 'exercise', question: 'Conjuguez le verbe "être"' }
                    ]
                },
                duration_minutes: 25,
                difficulty: 'MEDIUM',
                order_index: 1,
                is_active: true
            }
        ];
    }

    // ================================
    // UTILITIES & MONITORING
    // ================================
    isHealthy() {
        return this.useDatabase ? this.isConnected : true;
    }

    getStatus() {
        if (this.useDatabase && this.isConnected) {
            return 'PostgreSQL Connected';
        } else if (this.useDatabase && !this.isConnected) {
            return 'PostgreSQL Disconnected (JSON Fallback)';
        } else {
            return 'JSON Fallback Mode';
        }
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
            this.isConnected = false;
            this.logger.info('🗄️ Pool PostgreSQL fermé');
        }
    }

    // ================================
    // BACKUP & SYNC
    // ================================
    async syncToDatabase() {
        if (!this.useDatabase || !this.isConnected) {
            throw new Error('PostgreSQL non disponible pour la synchronisation');
        }

        const data = await this.readJSONData();
        this.logger.info('🔄 Synchronisation JSON → PostgreSQL...');

        // Synchroniser les utilisateurs
        for (const user of data.users) {
            await this.syncUser(user);
        }

        this.logger.info('✅ Synchronisation terminée');
    }

    async syncUser(user) {
        const client = await this.pool.connect();
        try {
            await client.query(`
                INSERT INTO users (id, firstname, lastname, email, password, role, phone, address, created_at, updated_at, last_login, is_active)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                ON CONFLICT (email) DO UPDATE SET
                    firstname = EXCLUDED.firstname,
                    lastname = EXCLUDED.lastname,
                    updated_at = EXCLUDED.updated_at
            `, [
                user.id, user.firstname, user.lastname, user.email, user.password,
                user.role, user.phone, user.address, user.created_at, user.updated_at,
                user.last_login, user.is_active
            ]);
        } finally {
            client.release();
        }
    }
}

module.exports = DatabaseService;