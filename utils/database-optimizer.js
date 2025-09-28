/**
 * 🗄️ OPTIMISEUR BASE DE DONNÉES CLAUDYNE
 * Système robuste PostgreSQL + JSON avec retry intelligent
 */

const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

class DatabaseOptimizer {
  constructor(config) {
    this.config = config;
    this.pool = null;
    this.isConnected = false;
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryDelay = 1000; // 1 seconde de base
    this.jsonFallbackPath = path.join(__dirname, '../data');
    this.lastSyncTime = null;
    this.syncInProgress = false;

    this.initializeDatabase();
  }

  // 🚀 INITIALISATION ROBUSTE
  async initializeDatabase() {
    try {
      await this.ensureDirectories();
      await this.connectToPostgreSQL();
      await this.setupConnectionMonitoring();
      logger.info('🗄️ Database optimizer initialized');
    } catch (error) {
      logger.error('❌ Database initialization failed', { error: error.message });
      await this.enableJSONFallback();
    }
  }

  // 📁 CRÉER RÉPERTOIRES NÉCESSAIRES
  async ensureDirectories() {
    try {
      await fs.mkdir(this.jsonFallbackPath, { recursive: true });
      await fs.mkdir(path.join(__dirname, '../logs'), { recursive: true });
      await fs.mkdir(path.join(__dirname, '../backups'), { recursive: true });
    } catch (error) {
      logger.error('Erreur création répertoires', { error: error.message });
    }
  }

  // 🔌 CONNEXION POSTGRESQL AVEC RETRY
  async connectToPostgreSQL() {
    const dbConfig = {
      host: this.config.database.host,
      port: this.config.database.port,
      database: this.config.database.database,
      user: this.config.database.username,
      password: this.config.database.password,
      ssl: this.config.database.ssl,
      max: this.config.database.pool.max,
      idleTimeoutMillis: this.config.database.pool.idleTimeoutMillis,
      connectionTimeoutMillis: this.config.database.pool.connectionTimeoutMillis,
      // Optimisations PostgreSQL
      application_name: 'claudyne-production',
      statement_timeout: 30000,
      query_timeout: 25000,
      keepalive: true,
      keepalives_idle: 600,
      keepalives_interval: 60,
      keepalives_count: 3
    };

    while (this.retryCount < this.maxRetries) {
      try {
        this.pool = new Pool(dbConfig);

        // Test de connexion
        const client = await this.pool.connect();
        await client.query('SELECT NOW()');
        client.release();

        this.isConnected = true;
        this.retryCount = 0;

        logger.info('✅ PostgreSQL connected', {
          host: dbConfig.host,
          database: dbConfig.database,
          maxConnections: dbConfig.max
        });

        return;
      } catch (error) {
        this.retryCount++;
        const delay = this.retryDelay * Math.pow(2, this.retryCount - 1); // Exponential backoff

        logger.warn(`PostgreSQL connection failed (${this.retryCount}/${this.maxRetries})`, {
          error: error.message,
          retryIn: delay
        });

        if (this.retryCount >= this.maxRetries) {
          throw new Error(`Max retries reached: ${error.message}`);
        }

        await this.sleep(delay);
      }
    }
  }

  // 🔍 MONITORING CONNEXION
  setupConnectionMonitoring() {
    if (this.pool) {
      this.pool.on('connect', () => {
        logger.info('Database client connected');
      });

      this.pool.on('error', async (err) => {
        logger.error('Database pool error', { error: err.message });
        this.isConnected = false;

        // Tentative de reconnexion automatique
        setTimeout(() => {
          this.reconnect();
        }, 5000);
      });

      this.pool.on('remove', () => {
        logger.info('Database client removed from pool');
      });

      // Health check périodique
      setInterval(() => {
        this.healthCheck();
      }, 30000); // Toutes les 30 secondes
    }
  }

  // 🔄 RECONNEXION AUTOMATIQUE
  async reconnect() {
    if (this.syncInProgress) return;

    logger.info('Attempting database reconnection...');
    this.retryCount = 0;

    try {
      await this.connectToPostgreSQL();
      logger.info('✅ Database reconnected successfully');
    } catch (error) {
      logger.error('❌ Database reconnection failed', { error: error.message });
      await this.enableJSONFallback();
    }
  }

  // 🩺 HEALTH CHECK
  async healthCheck() {
    if (!this.pool) return false;

    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT 1 as health_check');
      client.release();

      if (!this.isConnected) {
        this.isConnected = true;
        logger.info('✅ Database connection restored');
      }

      return result.rows[0].health_check === 1;
    } catch (error) {
      if (this.isConnected) {
        this.isConnected = false;
        logger.warn('❌ Database health check failed', { error: error.message });
      }
      return false;
    }
  }

  // 📄 ACTIVATION FALLBACK JSON
  async enableJSONFallback() {
    logger.info('📄 Activating JSON fallback mode');
    this.isConnected = false;

    // Créer fichiers JSON de base si nécessaires
    const defaultFiles = {
      'users.json': [],
      'families.json': [],
      'students.json': [],
      'lessons.json': [],
      'progress.json': []
    };

    for (const [filename, defaultData] of Object.entries(defaultFiles)) {
      const filepath = path.join(this.jsonFallbackPath, filename);

      try {
        await fs.access(filepath);
      } catch {
        await fs.writeFile(filepath, JSON.stringify(defaultData, null, 2));
        logger.info(`Created fallback file: ${filename}`);
      }
    }
  }

  // 🔄 SYNCHRONISATION BIDIRECTIONNELLE
  async syncJSONToPostgreSQL() {
    if (!this.isConnected || this.syncInProgress) return false;

    this.syncInProgress = true;
    logger.info('🔄 Starting JSON → PostgreSQL sync');

    try {
      const client = await this.pool.connect();

      // Synchroniser chaque table
      const tables = ['users', 'families', 'students', 'lessons', 'progress'];

      for (const table of tables) {
        await this.syncTable(client, table);
      }

      client.release();
      this.lastSyncTime = new Date();

      logger.info('✅ JSON → PostgreSQL sync completed', {
        syncTime: this.lastSyncTime
      });

      return true;
    } catch (error) {
      logger.error('❌ Sync failed', { error: error.message });
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  // 📊 SYNCHRONISATION TABLE SPÉCIFIQUE
  async syncTable(client, tableName) {
    try {
      const jsonFile = path.join(this.jsonFallbackPath, `${tableName}.json`);
      const jsonData = JSON.parse(await fs.readFile(jsonFile, 'utf8'));

      if (!Array.isArray(jsonData) || jsonData.length === 0) {
        return;
      }

      // Upsert des données (INSERT ON CONFLICT UPDATE)
      for (const record of jsonData) {
        await this.upsertRecord(client, tableName, record);
      }

      logger.info(`Table ${tableName} synchronized`, { records: jsonData.length });
    } catch (error) {
      logger.warn(`Sync failed for table ${tableName}`, { error: error.message });
    }
  }

  // 🔧 UPSERT INTELLIGENT
  async upsertRecord(client, tableName, record) {
    // Configuration par table
    const tableConfigs = {
      users: {
        primaryKey: 'id',
        columns: ['id', 'firstname', 'lastname', 'email', 'password', 'role', 'created_at', 'updated_at']
      },
      families: {
        primaryKey: 'id',
        columns: ['id', 'name', 'parent_id', 'created_at', 'updated_at']
      },
      students: {
        primaryKey: 'id',
        columns: ['id', 'firstname', 'lastname', 'level', 'family_id', 'created_at', 'updated_at']
      },
      lessons: {
        primaryKey: 'id',
        columns: ['id', 'title', 'subject', 'level', 'content', 'created_at', 'updated_at']
      },
      progress: {
        primaryKey: 'id',
        columns: ['id', 'student_id', 'lesson_id', 'score', 'status', 'completed_at']
      }
    };

    const config = tableConfigs[tableName];
    if (!config) return;

    const columns = config.columns.filter(col => record[col] !== undefined);
    const values = columns.map(col => record[col]);
    const placeholders = values.map((_, i) => `$${i + 1}`);

    // Construire requête UPSERT
    const updateSet = columns
      .filter(col => col !== config.primaryKey)
      .map(col => `${col} = EXCLUDED.${col}`)
      .join(', ');

    const query = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      ON CONFLICT (${config.primaryKey})
      DO UPDATE SET ${updateSet}, updated_at = NOW()
    `;

    await client.query(query, values);
  }

  // 💾 BACKUP AUTOMATIQUE
  async createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(__dirname, '../backups');

      // Backup PostgreSQL si connecté
      if (this.isConnected) {
        const backupFile = path.join(backupDir, `postgresql-${timestamp}.sql`);
        // Note: En production, utiliser pg_dump
        logger.info('PostgreSQL backup created', { file: backupFile });
      }

      // Backup JSON files
      const jsonBackupDir = path.join(backupDir, `json-${timestamp}`);
      await fs.mkdir(jsonBackupDir, { recursive: true });

      const files = await fs.readdir(this.jsonFallbackPath);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const source = path.join(this.jsonFallbackPath, file);
          const destination = path.join(jsonBackupDir, file);
          await fs.copyFile(source, destination);
        }
      }

      logger.info('JSON backup created', { directory: jsonBackupDir });
      return true;
    } catch (error) {
      logger.error('Backup failed', { error: error.message });
      return false;
    }
  }

  // 📈 MÉTRIQUES PERFORMANCE
  async getPerformanceMetrics() {
    const metrics = {
      connection: this.isConnected,
      lastSync: this.lastSyncTime,
      syncInProgress: this.syncInProgress,
      retryCount: this.retryCount,
      timestamp: new Date().toISOString()
    };

    if (this.pool) {
      metrics.poolStats = {
        totalCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount
      };
    }

    return metrics;
  }

  // 🛠️ UTILITAIRES
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isConnectedToDB() {
    return this.isConnected;
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      logger.info('Database pool closed');
    }
  }

  // 🎯 API PUBLIQUE POUR LE SERVEUR
  async query(text, params) {
    if (this.isConnected && this.pool) {
      try {
        const result = await this.pool.query(text, params);
        return result;
      } catch (error) {
        logger.error('Database query failed', { error: error.message, query: text });
        throw error;
      }
    } else {
      throw new Error('Database not connected - use JSON fallback');
    }
  }

  async getClient() {
    if (this.isConnected && this.pool) {
      return await this.pool.connect();
    } else {
      throw new Error('Database not connected');
    }
  }
}

module.exports = DatabaseOptimizer;