import bcrypt from 'bcryptjs';
import { query } from './db.js';

async function seedNewUsers() {
    try {
        const users = [
            { name: 'Akash', email: 'akash@wht.store', password: 'wht123', role: 'staff' },
            { name: 'Joyboy', email: 'joyboy@wht.store', password: 'wht123', role: 'staff' }
        ];

        for (const u of users) {
            const hash = await bcrypt.hash(u.password, 10);
            
            // Using email as the unique identifier for login
            await query(
                `INSERT INTO staff (name, email, password_hash, role) 
                 VALUES ($1, $2, $3, $4) 
                 ON CONFLICT (email) DO UPDATE SET password_hash = $3`,
                [u.name, u.email, hash, u.role]
            );
            console.log(`✅ User ${u.name} ready. Login: ${u.email} / ${u.password}`);
        }
        process.exit(0);
    } catch (err) {
        console.error('❌ Error seeding users:', err);
        process.exit(1);
    }
}

seedNewUsers();
