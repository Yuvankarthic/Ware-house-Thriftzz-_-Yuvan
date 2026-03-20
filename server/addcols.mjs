import pool from './db.js';

await pool.query(`
  ALTER TABLE products ADD COLUMN IF NOT EXISTS chest_length VARCHAR(50);
  ALTER TABLE products ADD COLUMN IF NOT EXISTS shoulder_length VARCHAR(50);
  ALTER TABLE products ADD COLUMN IF NOT EXISTS show_on_main BOOLEAN NOT NULL DEFAULT true;
`);
console.log('✅ Columns added (chest_length, shoulder_length, show_on_main)!');
process.exit(0);