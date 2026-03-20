// Add new admin users to the dashboard
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import pool from './db.js';
const query = (text, params) => pool.query(text, params);

dotenv.config();

async function addAdminUsers() {
    try {
        console.log('\n=== 👥 Adding Admin Users ===\n');

        const newUsers = [
            {
                name: 'joyboy',
                email: 'joyboy@wht.store',
                password: 'joyboy',
                role: 'admin'
            },
            {
                name: 'akash',
                email: 'akash@wht.store',
                password: 'Akash',
                role: 'admin'
            }
        ];

        for (const user of newUsers) {
            console.log(`🔐 Processing user: ${user.name}...`);

            // Check if user already exists
            const existing = await query(
                'SELECT id FROM staff WHERE email = $1 OR LOWER(name) = $2',
                [user.email.toLowerCase(), user.name.toLowerCase()]
            );

            if (existing.rows.length > 0) {
                console.log(`⚠️  User "${user.name}" already exists (ID: ${existing.rows[0].id})`);
                continue;
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(user.password, salt);
            console.log(`✅ Password hashed`);

            // Add user to database
            const result = await query(
                `INSERT INTO staff (name, email, password_hash, role)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id, name, email, role`,
                [user.name, user.email, passwordHash, user.role]
            );

            const newUser = result.rows[0];
            console.log(`✅ User created: ${newUser.name}`);
            console.log(`   ID: ${newUser.id}`);
            console.log(`   Email: ${newUser.email}`);
            console.log(`   Role: ${newUser.role}\n`);
        }

        console.log('='.repeat(50));
        console.log('🎉 ADMIN USERS ADDED SUCCESSFULLY!');
        console.log('='.repeat(50));
        console.log('\n📝 Login Credentials:\n');
        console.log('User 1:');
        console.log('   Email: joyboy@wht.store');
        console.log('   Username: joyboy');
        console.log('   Password: joyboy');
        console.log('   Role: admin\n');
        console.log('User 2:');
        console.log('   Email: akash@wht.store');
        console.log('   Username: akash');
        console.log('   Password: Akash');
        console.log('   Role: admin\n');
        console.log('👉 Dashboard: http://localhost:3004/admin');
        console.log('   You can now login with either username or email\n');

        process.exit(0);

    } catch (err) {
        console.error('\n❌ Error:', err.message);
        console.error('Stack:', err.stack);
        process.exit(1);
    }
}

addAdminUsers();

