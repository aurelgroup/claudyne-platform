/**
 * Script temporaire pour lister les utilisateurs via HTTP
 * À exécuter: node backend/list-users-temp.js
 */

require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = 3002;

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'claudyne_prod',
    user: process.env.DB_USER || 'claudyne_user',
    password: process.env.DB_PASSWORD || 'aujourdhui18D@',
    ssl: false
});

app.get('/list-users', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                id,
                email,
                "firstName",
                "lastName",
                phone,
                role,
                "userType",
                "isActive",
                "createdAt"
            FROM users
            ORDER BY "createdAt" DESC
            LIMIT 20
        `);

        res.json({
            success: true,
            count: result.rows.length,
            users: result.rows
        });
    } catch (error) {
        res.json({
            success: false,
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Server listening on http://localhost:${PORT}`);
    console.log(`📋 Liste des utilisateurs: http://localhost:${PORT}/list-users`);
});
