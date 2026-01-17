const mysql = require('mysql2/promise'); // Utilisez directement la version promise
//require('dotenv').config(); // Seulement necessaire dans app.js

// Configuration améliorée avec valeurs par défaut
const pool = mysql.createPool({
    host: process.env.DB_HOST || '40.82.161.22', // Vous aviez oublié process.env
    user: process.env.DB_USER || 'tabletrove_user', //root
    password: process.env.DB_PASSWORD || 'password123', // ''
    database: process.env.DB_NAME || 'TableTrove', //restaurant_reservations
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+00:00' // Pour éviter les problèmes de fuseau horaire
});

// Test de connexion au démarrage (optionnel mais recommandé)
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Connecté à la base de données MySQL');
        connection.release();
    } catch (err) {
        console.error('❌ Erreur de connexion à la base de données:', err.message);
        process.exit(1); // Quitte l'application si la connexion échoue
    }
}

testConnection();

module.exports = pool;