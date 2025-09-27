/**
 * Logger sécurisé pour informations sensibles
 * Stocke les informations sensibles dans un fichier sécurisé séparé
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SecureLogger {
    constructor() {
        this.secureLogPath = path.join(__dirname, '../../logs/secure.log');
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        const logDir = path.dirname(this.secureLogPath);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true, mode: 0o700 });
        }
    }

    logTemporaryPassword(email, password, context = 'admin-init') {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            context,
            email,
            password,
            sessionId: crypto.randomBytes(8).toString('hex')
        };

        const logLine = `[${timestamp}] TEMP_PASSWORD: ${context} - ${email} - ${password} - Session: ${logEntry.sessionId}\n`;

        try {
            fs.appendFileSync(this.secureLogPath, logLine, { mode: 0o600 });
            console.log(`🔐 Mot de passe temporaire enregistré dans logs sécurisés (Session: ${logEntry.sessionId})`);
            return logEntry.sessionId;
        } catch (error) {
            console.error('❌ Erreur écriture logs sécurisés:', error.message);
            // Fallback: afficher le mot de passe en cas d'erreur de log
            console.log(`🔑 FALLBACK - Mot de passe temporaire: ${password}`);
            return null;
        }
    }

    logTokenGeneration(tokenType, tokenPrefix, context = 'auth') {
        const timestamp = new Date().toISOString();
        const logLine = `[${timestamp}] TOKEN_GENERATED: ${context} - ${tokenType} - ${tokenPrefix}...\n`;

        try {
            fs.appendFileSync(this.secureLogPath, logLine, { mode: 0o600 });
        } catch (error) {
            console.error('❌ Erreur log token:', error.message);
        }
    }

    getSecureLogPath() {
        return this.secureLogPath;
    }
}

module.exports = new SecureLogger();