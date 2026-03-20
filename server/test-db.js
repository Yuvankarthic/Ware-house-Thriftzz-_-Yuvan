import pool from './db.js';
const query = (text, params) => pool.query(text, params);

async function test() {
  try {
    const res = await query('SELECT 1');
    console.log('✅ DB Connection Successful:', res.rows);
    process.exit(0);
  } catch (err) {
    console.error('❌ DB Connection Failed:', err.message);
    process.exit(1);
  }
}

test();

