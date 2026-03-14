// ─────────────────────────────────────────────
//  Database Migration & Product Seed
//  Run:  node migrate.js
// ─────────────────────────────────────────────
import dotenv from 'dotenv';
import { query } from './db.js';

dotenv.config();

async function migrate() {
    console.log('🔄 Running database migrations…');

    // ── Products table ──
    await query(`
        CREATE TABLE IF NOT EXISTS products (
            id          SERIAL PRIMARY KEY,
            name        VARCHAR(255) NOT NULL,
            price       NUMERIC(10, 2) NOT NULL,
            stock       INTEGER NOT NULL DEFAULT 1,
            size        VARCHAR(20),
            fit         VARCHAR(50),
            condition   VARCHAR(50),
            created_at  TIMESTAMPTZ DEFAULT NOW()
        );
    `);
    console.log('  ✅ products table ready');

    // ── Orders table ──
    await query(`
        CREATE TABLE IF NOT EXISTS orders (
            id              SERIAL PRIMARY KEY,
            customer_name   VARCHAR(255) NOT NULL,
            email           VARCHAR(255),
            phone           VARCHAR(20) NOT NULL,
            address         TEXT NOT NULL,
            city            VARCHAR(100) NOT NULL,
            pincode         VARCHAR(10) NOT NULL,
            product_id      INTEGER REFERENCES products(id),
            quantity        INTEGER NOT NULL DEFAULT 1,
            price           NUMERIC(10, 2) NOT NULL,
            shipment_id     VARCHAR(100),
            tracking_url    TEXT,
            order_status    VARCHAR(50) DEFAULT 'processing',
            payment_id      VARCHAR(100),
            created_at      TIMESTAMPTZ DEFAULT NOW()
        );
    `);
    console.log('  ✅ orders table ready');

    // ── Seed products (only if table is empty) ──
    const existing = await query('SELECT COUNT(*)::int AS count FROM products');
    if (existing.rows[0].count === 0) {
        console.log('🌱 Seeding products…');

        const products = [
            { id: 101, name: "Women's Cropped Black Jacket",  price: 1,   stock: 1, size: 'XS',  fit: 'Cropped', condition: 'A' },
            { id: 102, name: 'Colorblock Fleece Jacket',      price: 699, stock: 1, size: 'S/M', fit: 'Regular', condition: 'Vintage' },
            { id: 103, name: 'Hooded Black Winter Layer',     price: 499, stock: 1, size: 'M-L', fit: 'Relaxed', condition: 'A' },
            { id: 104, name: 'Patterned Vintage Jacket',      price: 499, stock: 1, size: 'M',   fit: 'Boxy',    condition: 'Vintage' },
            { id: 105, name: 'Velvet Retro Party Jacket',     price: 499, stock: 1, size: 'M',   fit: 'Regular', condition: 'Vintage' },
            { id: 106, name: 'Black Utility Vest',            price: 499, stock: 1, size: 'XS',  fit: 'Regular', condition: 'Vintage' },
            { id: 107, name: 'Classic Black Trench',          price: 549, stock: 1, size: 'M',   fit: 'Regular', condition: 'Vintage' },
            { id: 108, name: 'Premium Suede Jacket',          price: 599, stock: 1, size: 'M',   fit: 'Regular', condition: 'Vintage' },
            { id: 109, name: 'Cozy Suede Winter Jacket',      price: 699, stock: 1, size: 'S',   fit: 'Regular', condition: 'Vintage' },
        ];

        for (const p of products) {
            await query(
                `INSERT INTO products (id, name, price, stock, size, fit, condition)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 ON CONFLICT (id) DO NOTHING`,
                [p.id, p.name, p.price, p.stock, p.size, p.fit, p.condition]
            );
        }

        // Reset the sequence to avoid conflicts with future inserts
        await query(`SELECT setval('products_id_seq', (SELECT MAX(id) FROM products))`);
        console.log('  ✅ 9 products seeded');
    } else {
        console.log('  ℹ️  Products already exist — skipping seed');
    }

    console.log('🎉 Migration complete!');
    process.exit(0);
}

migrate().catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
