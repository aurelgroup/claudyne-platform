// ======================================
// ADMIN AUTHENTICATION SYSTEM
// ======================================

// Générer token admin automatique
app.post('/api/admin/generate-token', (req, res) => {
    try {
        const { adminKey } = req.body;

        // Clé admin simple pour accès interface
        if (adminKey === 'claudyne-admin-2024') {
            const adminToken = 'admin-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

            // Stocker le token (en production, utiliser Redis ou base de données)
            global.adminTokens = global.adminTokens || [];
            global.adminTokens.push({
                token: adminToken,
                created: Date.now(),
                expires: Date.now() + (24 * 60 * 60 * 1000) // 24h
            });

            console.log('🔑 Token admin généré:', adminToken.substring(0, 15) + '...');

            res.json({
                success: true,
                token: adminToken,
                message: 'Token admin généré avec succès'
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Clé admin invalide'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Middleware de validation token admin
function validateAdminToken(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token d\'authentification manquant',
            code: 'NO_TOKEN'
        });
    }

    // Vérifier le token
    global.adminTokens = global.adminTokens || [];
    const validToken = global.adminTokens.find(t =>
        t.token === token && t.expires > Date.now()
    );

    if (!validToken) {
        return res.status(401).json({
            success: false,
            message: 'Token invalide ou expiré',
            code: 'INVALID_TOKEN'
        });
    }

    req.adminToken = validToken;
    next();
}

// Appliquer le middleware à tous les endpoints admin
app.use('/api/admin/email-config', validateAdminToken);
app.use('/api/admin/pricing-config', validateAdminToken);
app.use('/api/admin/api-config', validateAdminToken);
app.use('/api/admin/team-members', validateAdminToken);
app.use('/api/admin/quick-message', validateAdminToken);
app.use('/api/admin/generate-report', validateAdminToken);
app.use('/api/admin/automation-config', validateAdminToken);
app.use('/api/admin/schedule-report', validateAdminToken);
app.use('/api/admin/force-backup', validateAdminToken);
app.use('/api/admin/logs/recent', validateAdminToken);