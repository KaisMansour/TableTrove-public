require('dotenv').config();
const mysql = require('mysql2/promise');

async function closeConnections() {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || '40.82.161.22',
      user: process.env.DB_USER || 'tabletrove_user',
      password: process.env.DB_PASSWORD || 'password123',
      database: process.env.DB_NAME || 'TableTrove'
    });
    
    console.log('Closing all database connections...');
    await pool.end();
    console.log('All connections closed successfully.');
  } catch (err) {
    console.error('Error closing connections:', err);
  }
}

closeConnections();