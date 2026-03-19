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
    max: 10,  // reduced from 20 to prevent pool exhaustion
    min: 2,   // keep minimum 2 connections alive
    idleTimeoutMillis: 45000,  // increased from 30s to 45s
    connectionTimeoutMillis: 5000,  // increased from 2s to 5s for Railway
    statementTimeoutMillis: 30000,  // added statement timeout
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false,
    // Enable connection validation
    validate: (connection) => {
        return Promise.resolve(connection);
    }
});

// Test connection on startup
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Database connection failed on startup:', err.message);
    } else {
        console.log('✅ Database connected successfully at:', res.rows[0].now);
    }
});

pool.on('error', (err) => {
    console.error('❌ Unexpected PostgreSQL pool error:', err.message);
    // Attempt to reconnect
    setTimeout(() => {
        console.log('🔄 Attempting to reconnect to database...');
        pool.query('SELECT NOW()', (err, res) => {
            if (err) {
                console.error('❌ Reconnection failed:', err.message);
            } else {
                console.log('✅ Reconnected to database successfully');
            }
        });
    }, 5000);
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