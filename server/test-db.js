import { query } from './db.js';

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
