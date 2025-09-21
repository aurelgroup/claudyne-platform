/**
 * Serveur principal pour Claudyne
 * Interface principale et toutes les routes
 * En hommage à Meffo Mehtah Tchandjio Claudine
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000; // Port différent pour éviter les conflits

// Types MIME
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    let filePath = '.' + parsedUrl.pathname;
    
    // CORS headers pour les API
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Routing spécifique pour toutes les interfaces Claudyne
    if (parsedUrl.pathname === '/') {
        filePath = './index.html'; // Interface principale
    } else if (parsedUrl.pathname === '/admin' || parsedUrl.pathname === '/admin-secure-k7m9x4n2p8w5z1c6' || parsedUrl.pathname === '/admin-secure-fresh-bypass') {
        filePath = './admin-interface-fresh.html'; // Interface admin sécurisée - NOUVEAU FICHIER ANTI-CACHE
    } else if (parsedUrl.pathname === '/moderator') {
        filePath = './moderator-interface.html'; // Interface modérateur
    } else if (parsedUrl.pathname === '/teacher') {
        filePath = './teacher-interface.html'; // Interface enseignant
    } else if (parsedUrl.pathname === '/student' || parsedUrl.pathname === '/student-interface' || parsedUrl.pathname === '/student-interface/') {
        filePath = './student-interface-modern.html'; // Interface étudiant
    } else if (parsedUrl.pathname === '/parent' || parsedUrl.pathname === '/parent-interface' || parsedUrl.pathname === '/parent-interface/') {
        filePath = './parent-interface/index.html'; // Interface parent
    } else if (parsedUrl.pathname === '/offline') {
        filePath = './offline.html'; // Page offline
    } else if (parsedUrl.pathname.startsWith('/api')) {
        // Proxy vers le backend pour les routes API
        res.writeHead(302, { 'Location': `http://localhost:3001${parsedUrl.pathname}${parsedUrl.search || ''}` });
        res.end();
        return;
    }
    
    // Si pas d'extension et pas un dossier existant, essayer .html
    if (path.extname(filePath) === '' && !fs.existsSync(filePath)) {
        if (fs.existsSync(filePath + '.html')) {
            filePath += '.html';
        }
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeType = mimeTypes[extname] || 'application/octet-stream';

    // Headers de sécurité
    const securityHeaders = {
        'Content-Type': mimeType,
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)'
    };

    // Headers spéciaux pour Service Worker
    if (filePath.endsWith('sw.js')) {
        securityHeaders['Service-Worker-Allowed'] = '/';
        securityHeaders['Cache-Control'] = 'public, max-age=0, must-revalidate';
    }

    // Headers de cache pour les assets statiques
    if (extname === '.css' || extname === '.js') {
        securityHeaders['Cache-Control'] = 'public, max-age=31536000, immutable';
    }

    // Headers anti-cache pour l'interface admin pour forcer rechargement
    if (filePath.includes('admin-interface')) {
        securityHeaders['Cache-Control'] = 'no-cache, no-store, must-revalidate';
        securityHeaders['Pragma'] = 'no-cache';
        securityHeaders['Expires'] = '0';
        securityHeaders['Last-Modified'] = new Date().toUTCString();
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // Fichier non trouvé - rediriger vers la page principale pour les routes SPA
                if (!filePath.includes('.')) {
                    fs.readFile('./index.html', (err, indexContent) => {
                        if (err) {
                            res.writeHead(404, { 'Content-Type': 'text/html' });
                            res.end(`
                                <div style="font-family: Arial; padding: 50px; text-align: center;">
                                    <h1>404 - Page non trouvée</h1>
                                    <p>La page demandée n'existe pas.</p>
                                    <a href="/" style="color: #D4AF37;">🏠 Retour à l'accueil</a>
                                </div>
                            `, 'utf-8');
                        } else {
                            res.writeHead(200, securityHeaders);
                            res.end(indexContent, 'utf-8');
                        }
                    });
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end(`
                        <div style="font-family: Arial; padding: 50px; text-align: center; background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; min-height: 100vh;">
                            <h1 style="color: #FFD700;">404 - Ressource non trouvée</h1>
                            <p>La ressource demandée n'existe pas sur Claudyne.</p>
                            <a href="/" style="color: #D4AF37; text-decoration: none; border: 1px solid #D4AF37; padding: 10px 20px; border-radius: 5px; display: inline-block; margin-top: 20px;">
                                🏠 Retour à l'accueil Claudyne
                            </a>
                            <div style="margin-top: 40px; opacity: 0.7;">
                                <p><em>"La force du savoir en héritage"</em></p>
                                <p>👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine</p>
                            </div>
                        </div>
                    `, 'utf-8');
                }
            } else {
                // Erreur serveur
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end(`
                    <div style="font-family: Arial; padding: 50px; text-align: center; background: linear-gradient(135deg, #1a1a2e, #16213e); color: white; min-height: 100vh;">
                        <h1 style="color: #ff6b6b;">500 - Erreur Serveur</h1>
                        <p>Une erreur s'est produite sur le serveur Claudyne.</p>
                        <p style="opacity: 0.7;">Code: ${error.code}</p>
                        <div style="margin-top: 40px; opacity: 0.7;">
                            <p><em>"La force du savoir en héritage"</em></p>
                            <p>👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine</p>
                        </div>
                    </div>
                `, 'utf-8');
            }
        } else {
            // Succès
            res.writeHead(200, securityHeaders);
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log('🎓 ============================================');
    console.log('   SERVEUR PRINCIPAL CLAUDYNE');
    console.log('🎓 ============================================');
    console.log('');
    console.log(`✅ Interfaces disponibles:`);
    console.log(`🏠 Interface Principale:     http://localhost:${PORT}/`);
    console.log(`👨‍💼 Interface Admin:         http://localhost:${PORT}/admin`);
    console.log(`👮 Interface Modérateur:     http://localhost:${PORT}/moderator`);
    console.log(`👨‍🏫 Interface Enseignant:     http://localhost:${PORT}/teacher`);
    console.log(`🎓 Interface Étudiant:       http://localhost:${PORT}/student`);
    console.log(`👨‍👩‍👧‍👦 Interface Parent:        http://localhost:${PORT}/parent`);
    console.log(`📴 Page Offline:            http://localhost:${PORT}/offline`);
    console.log('');
    console.log('💡 Ouvrez une de ces URLs dans votre navigateur');
    console.log('🔄 Pour l\'API backend, utilisez le port 3001');
    console.log('');
    console.log('👨‍👩‍👧‍👦 En hommage à Meffo Mehtah Tchandjio Claudine');
    console.log('"La force du savoir en héritage"');
    console.log('');
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`❌ Le port ${PORT} est déjà utilisé.`);
        console.log('💡 Solutions:');
        console.log('   • Arrêtez le processus existant avec: netstat -ano | findstr :3000');
        console.log('   • Ou changez le port dans server.js');
        console.log('   • Ou utilisez: taskkill /PID [PID_NUMBER] /F');
    } else {
        console.log('❌ Erreur serveur:', err.message);
    }
});

// Gestion gracieuse de l'arrêt
process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt du serveur Claudyne...');
    console.log('👨‍👩‍👧‍👦 Merci d\'avoir utilisé Claudyne !');
    server.close(() => {
        console.log('✅ Serveur arrêté proprement.');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Signal SIGTERM reçu, arrêt du serveur...');
    server.close(() => {
        console.log('✅ Serveur arrêté proprement.');
        process.exit(0);
    });
});