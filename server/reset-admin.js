import bcrypt from 'bcryptjs';
import { query } from './db.js';

async function resetAdmin() {
    try {
        const email = 'admin@wht.store';
        const password = 'admin123';
        const hash = await bcrypt.hash(password, 10);

        const res = await query('SELECT * FROM staff WHERE email = $1', [email]);
        
        if (res.rows.length > 0) {
            await query('UPDATE staff SET password_hash = $1 WHERE email = $2', [hash, email]);
            console.log(`✅ Password for ${email} has been reset to: ${password}`);
        } else {
            await query(
                `INSERT INTO staff (name, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
                ['Admin', email, hash, 'admin']
            );
            console.log(`✅ New admin user created: ${email} / ${password}`);
        }
        process.exit(0);
    } catch (err) {
        console.error('❌ Error resetting admin:', err);
        process.exit(1);
    }
}

resetAdmin();
