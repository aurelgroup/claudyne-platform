/**
 * Serveur simple pour servir l'interface admin
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3007;

// Types MIME
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    
    // Page par défaut
    if (filePath === './') {
        filePath = './admin-interface.html';
    }
    
    // Si pas d'extension, essayer .html
    if (path.extname(filePath) === '') {
        filePath += '.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // Fichier non trouvé
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - Page non trouvée</h1>', 'utf-8');
            } else {
                // Erreur serveur
                res.writeHead(500);
                res.end(`Erreur serveur: ${error.code}`, 'utf-8');
            }
        } else {
            // Succès
            res.writeHead(200, { 'Content-Type': mimeType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log('🌐 ============================================');
    console.log('   SERVEUR ADMIN CLAUDYNE');
    console.log('🌐 ============================================');
    console.log('');
    console.log(`✅ Interface Admin disponible sur:`);
    console.log(`🖥️  http://localhost:${PORT}`);
    console.log(`📊 http://localhost:${PORT}/admin-interface.html`);
    console.log('');
    console.log('💡 Ouvrez cette URL dans votre navigateur');
    console.log('🔄 Assurez-vous que le backend est démarré sur le port 3001');
    console.log('');
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.log(`❌ Le port ${PORT} est déjà utilisé.`);
        console.log('Solution: Arrêtez le processus existant ou changez le port.');
    } else {
        console.log('❌ Erreur serveur:', err.message);
    }
});