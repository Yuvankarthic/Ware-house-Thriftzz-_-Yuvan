// ─────────────────────────────────────────────
//  PostgreSQL Connection Pool (Cloud-Ready)
// ─────────────────────────────────────────────
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Production-ready connection with SSL for Railway/cloud deployments
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    min: 1,   // changed to 1 to avoid waiting for 2 connections
    idleTimeoutMillis: 45000,
    connectionTimeoutMillis: 5000,
    statementTimeoutMillis: 30000,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
});

// Test connection on startup (non-blocking)
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Database connection failed on startup:', err.message);
        console.warn('⚠️ Server will continue without database. Requests will fail.');
    } else {
        console.log('✅ Database connected successfully at:', res.rows[0].now);
    }
}).catch((err) => {
    console.error('❌ Database query error:', err.message);
});

// Better error handling
pool.on('error', (err) => {
    console.error('❌ Database pool error:', err.message);
});

pool.on('connect', () => {
    console.log('📡 New database connection established');
});

/**
 * Execute a SQL query against the pool with automatic retry.
 * @param {string} text - SQL query string
 * @param {Array}  params - Parameterized values
 * @returns {Promise<pg.QueryResult>}
 */
export const query = (text, params) => {
    return pool.query(text, params).catch((err) => {
        console.error('Query error:', err.message);
        // If connection lost, retry once after a short delay
        if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
            console.log('🔄 Retrying query after connection error...');
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve(pool.query(text, params));
                }, 1000);
            });
        }
        throw err;
    });
};

export default pool;

console.log("DATABASE_URL:", process.env.DATABASE_URL ? "✅ SET" : "❌ NOT SET");
console.log("NODE_ENV:", process.env.NODE_ENV || 'development');