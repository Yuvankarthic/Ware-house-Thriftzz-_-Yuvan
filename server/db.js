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
    ssl: {
        rejectUnauthorized: false
    }
});

pool.on('error', (err) => {
    console.error('❌ Unexpected PostgreSQL pool error:', err);
    process.exit(-1);
});

/**
 * Execute a SQL query against the pool.
 * @param {string} text - SQL query string
 * @param {Array}  params - Parameterized values
 * @returns {Promise<pg.QueryResult>}
 */
export const query = (text, params) => pool.query(text, params);

export default pool;
