import pool from './db.js';

async function createSystemActionsTable() {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS system_actions (
                id SERIAL PRIMARY KEY,
                intent VARCHAR(100) NOT NULL,
                data JSONB DEFAULT '{}',
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log('✅ system_actions table created');
    } catch (error) {
        console.error('❌ Error creating system_actions table:', error.message);
    } finally {
        client.release();
    }
}

createSystemActionsTable().then(() => process.exit(0));