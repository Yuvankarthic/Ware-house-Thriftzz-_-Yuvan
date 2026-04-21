import pool from './db.js';

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query(`
            ALTER TABLE system_actions 
            ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
        `);
        console.log('✅ Added user_id column to system_actions');
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_system_actions_user_id 
            ON system_actions(user_id);
        `);
        console.log('✅ Created index on user_id');
        
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_system_actions_status 
            ON system_actions(status);
        `);
        console.log('✅ Created index on status');
        
    } catch (error) {
        console.error('❌ Migration error:', error.message);
    } finally {
        client.release();
    }
}

migrate().then(() => process.exit(0));