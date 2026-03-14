// ─────────────────────────────────────────────
//  PostgreSQL Connection Pool
// ─────────────────────────────────────────────
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
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
