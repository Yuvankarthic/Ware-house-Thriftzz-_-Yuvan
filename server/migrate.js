// ─────────────────────────────────────────────
//  Database Migration & Seed
//  Run:  node migrate.js
// ─────────────────────────────────────────────
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import pool from './db.js';
const query = (text, params) => pool.query(text, params);

dotenv.config();

async function migrate() {
    console.log('🔄 Running database migrations…\n');

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
    await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;`);
    await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS chest_length VARCHAR(50);`);
    await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS shoulder_length VARCHAR(50);`);
    console.log('  ✅ products table ready');

    // ── Staff table ──
    await query(`
        CREATE TABLE IF NOT EXISTS staff (
            id              SERIAL PRIMARY KEY,
            name            VARCHAR(255) NOT NULL,
            email           VARCHAR(255) UNIQUE NOT NULL,
            password_hash   TEXT NOT NULL,
            role            VARCHAR(50) DEFAULT 'staff',
            created_at      TIMESTAMPTZ DEFAULT NOW()
        );
    `);
    console.log('  ✅ staff table ready');

    // ── Orders table (expanded) ──
    await query(`
        CREATE TABLE IF NOT EXISTS orders (
            id                  SERIAL PRIMARY KEY,
            customer_name       VARCHAR(255) NOT NULL,
            phone               VARCHAR(20) NOT NULL,
            email               VARCHAR(255),
            full_address        TEXT NOT NULL,
            city                VARCHAR(100) NOT NULL,
            pincode             VARCHAR(10) NOT NULL,
            product_name        VARCHAR(255),
            product_id          INTEGER REFERENCES products(id),
            quantity            INTEGER NOT NULL DEFAULT 1,
            order_value         NUMERIC(10, 2) NOT NULL,
            payment_method      VARCHAR(50) DEFAULT 'Prepaid',
            payment_status      VARCHAR(50) DEFAULT 'paid',
            payment_id          VARCHAR(100),
            order_status        VARCHAR(50) DEFAULT 'New Order',
            assigned_to         INTEGER REFERENCES staff(id),
            delivery_partner    VARCHAR(100),
            delivery_notes      TEXT,
            rider_phone         VARCHAR(20),
            tracking_ref        VARCHAR(200),
            created_at          TIMESTAMPTZ DEFAULT NOW(),
            updated_at          TIMESTAMPTZ DEFAULT NOW()
        );
    `);
    console.log('  ✅ orders table ready');

    // ── Order timeline table (for status history) ──
    await query(`
        CREATE TABLE IF NOT EXISTS order_timeline (
            id          SERIAL PRIMARY KEY,
            order_id    INTEGER REFERENCES orders(id) ON DELETE CASCADE,
            status      VARCHAR(50) NOT NULL,
            changed_by  INTEGER REFERENCES staff(id),
            note        TEXT,
            created_at  TIMESTAMPTZ DEFAULT NOW()
        );
    `);
    console.log('  ✅ order_timeline table ready');

    // ── Seed products (only if empty) ──
    const existingProducts = await query('SELECT COUNT(*)::int AS count FROM products');
    if (existingProducts.rows[0].count === 0) {
        console.log('\n🌱 Seeding products…');
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
        await query(`SELECT setval('products_id_seq', (SELECT MAX(id) FROM products))`);
        console.log('  ✅ 9 products seeded');
    } else {
        console.log('\n  ℹ️  Products already exist — skipping seed');
    }

    // ── Seed default admin (only if no staff exist) ──
    const existingStaff = await query('SELECT COUNT(*)::int AS count FROM staff');
    if (existingStaff.rows[0].count === 0) {
        console.log('\n🌱 Seeding default admin…');
        const hash = await bcrypt.hash('admin123', 10);
        await query(
            `INSERT INTO staff (name, email, password_hash, role)
             VALUES ($1, $2, $3, $4)`,
            ['Admin', 'admin@wht.store', hash, 'admin']
        );
        console.log('  ✅ Default admin created (admin@wht.store / admin123)');
    } else {
        console.log('\n  ℹ️  Staff already exist — skipping seed');
    }

    console.log('\n🎉 Migration complete!');
    process.exit(0);
}

migrate().catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});

