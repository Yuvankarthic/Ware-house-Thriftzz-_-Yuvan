import pool from './db.js';

await pool.query(`
  ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Jackets';
  ALTER TABLE products ADD COLUMN IF NOT EXISTS chest_length VARCHAR(50);
  ALTER TABLE products ADD COLUMN IF NOT EXISTS shoulder_length VARCHAR(50);
  ALTER TABLE products ADD COLUMN IF NOT EXISTS show_on_main BOOLEAN NOT NULL DEFAULT true;
`);
await pool.query(`
  CREATE TABLE IF NOT EXISTS order_email_events (
    id              SERIAL PRIMARY KEY,
    order_id        INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    event_type      VARCHAR(50) NOT NULL,
    delivery_status VARCHAR(20) NOT NULL,
    reason          TEXT,
    recipient       VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_order_email_events_order_id_created_at
  ON order_email_events(order_id, created_at DESC);
`);
console.log('✅ Columns added (category, chest_length, shoulder_length, show_on_main) and email events table ready!');
process.exit(0);