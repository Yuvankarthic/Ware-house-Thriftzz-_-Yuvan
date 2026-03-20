// Quick script to add a fake order for dashboard testing
import dotenv from 'dotenv';
import pool from './db.js';
const query = (text, params) => pool.query(text, params);

dotenv.config();

async function addTestOrder() {
    try {
        console.log('\n=== 📦 Adding Test Order to Dashboard ===\n');

        // Get list of available products
        console.log('🔍 Checking available products...');
        const allProducts = await query('SELECT id, name, price, stock FROM products LIMIT 5');
        if (allProducts.rows.length === 0) {
            console.log('❌ No products found in database');
            process.exit(1);
        }
        
        console.log(`✅ Found ${allProducts.rows.length} products`);
        allProducts.rows.forEach(p => console.log(`   - ID: ${p.id}, Name: ${p.name}, Stock: ${p.stock}`));

        // Use first product with stock
        let product = allProducts.rows.find(p => p.stock > 0);
        if (!product) {
            console.log('\n⚠️  No products with stock available, using first product anyway...');
            product = allProducts.rows[0];
        }

        console.log(`\n✅ Using product: ${product.name} (ID: ${product.id})\n`);

        // Create order - don't reset stock, just create with current stock
        console.log('📝 Creating order...');
        const orderResult = await query(
            `INSERT INTO orders
                (customer_name, email, phone, full_address, city, pincode,
                 product_name, product_id, quantity, order_value,
                 payment_method, payment_status, payment_id, order_status)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'New Order')
             RETURNING *`,
            ['Priya Sharma', 'priya@example.com', '9876543210', '123 MG Road, Bangalore', 'Bangalore', '560001',
             product.name, product.id, 1, product.price,
             'Prepaid', 'paid', 'PAY_TEST_' + Date.now()]
        );

        const order = orderResult.rows[0];
        console.log(`✅ Order created: #${order.id}`);

        // Add timeline entry
        await query(
            `INSERT INTO order_timeline (order_id, status, note) VALUES ($1, 'New Order', 'Test order created for dashboard demo')`,
            [order.id]
        );
        console.log('✅ Timeline entry added');

        console.log('\n' + '='.repeat(50));
        console.log('🎉 TEST ORDER SUCCESSFULLY CREATED!');
        console.log('='.repeat(50));
        console.log(`\n📋 Order Details:`);
        console.log(`   Order ID: #${order.id}`);
        console.log(`   Customer: ${order.customer_name}`);
        console.log(`   Phone: ${order.phone}`);
        console.log(`   Address: ${order.full_address}`);
        console.log(`   Product: ${order.product_name}`);
        console.log(`   Price: ₹${order.order_value}`);
        console.log(`   Status: ${order.order_status}`);
        console.log(`   Payment: ${order.payment_status}`);
        console.log(`\n👉 Visit http://localhost:3004/admin to see it!`);
        console.log(`   Login: admin@wht.store / admin123\n`);

        process.exit(0);

    } catch (err) {
        console.error('\n❌ Error:', err.message);
        console.error('Stack:', err.stack);
        process.exit(1);
    }
}

addTestOrder();

