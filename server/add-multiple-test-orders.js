// Add multiple test orders with different statuses
import dotenv from 'dotenv';
import { query } from './db.js';

dotenv.config();

async function addMultipleTestOrders() {
    try {
        console.log('\n=== 📦 Adding Multiple Test Orders ===\n');

        const testOrders = [
            {
                name: 'Raj Kumar',
                phone: '9988776655',
                address: '456 Silk Street, Mumbai',
                city: 'Mumbai',
                product_id: 102,
                status: 'Accepted',
                delivery_partner: 'Porter'
            },
            {
                name: 'Neha Patel',
                phone: '9876543211',
                address: '789 Fashion Lane, Delhi',
                city: 'Delhi',
                product_id: 104,
                status: 'Packing',
                delivery_partner: 'Rapido Parcel'
            },
            {
                name: 'Arjun Singh',
                phone: '9765432109',
                address: '321 Gold Road, Pune',
                city: 'Pune',
                product_id: 105,
                status: 'Packed',
                delivery_partner: 'Self Delivery'
            },
            {
                name: 'Kavya Desai',
                phone: '9655443322',
                address: '654 Pearl Avenue, Hyderabad',
                city: 'Hyderabad',
                product_id: 106,
                status: 'Out for Delivery',
                delivery_partner: 'Porter'
            }
        ];

        for (const testOrder of testOrders) {
            // Get product
            const prodResult = await query('SELECT * FROM products WHERE id = $1', [testOrder.product_id]);
            if (prodResult.rows.length === 0) {
                console.log(`⚠️  Product ID ${testOrder.product_id} not found, skipping...`);
                continue;
            }

            const product = prodResult.rows[0];
            const fullAddress = `${testOrder.address}, ${testOrder.city}`;

            // Create order
            const orderResult = await query(
                `INSERT INTO orders
                    (customer_name, email, phone, full_address, city, pincode,
                     product_name, product_id, quantity, order_value,
                     payment_method, payment_status, payment_id, order_status,
                     delivery_partner, rider_phone, tracking_ref)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
                 RETURNING *`,
                [testOrder.name, `${testOrder.name.toLowerCase().replace(' ', '')}@example.com`, testOrder.phone, fullAddress, testOrder.city, '560001',
                 product.name, testOrder.product_id, 1, product.price,
                 'Prepaid', 'paid', `PAY_${Date.now()}`, testOrder.status,
                 testOrder.delivery_partner, '9999888877', `TRK_${Math.random().toString(36).substr(2, 9).toUpperCase()}`]
            );

            const order = orderResult.rows[0];
            
            // Add timeline entries for status progression
            const statuses = ['New Order', 'Accepted', 'Packing', 'Packed', 'Out for Delivery', 'Delivered'];
            const statusIndex = statuses.indexOf(testOrder.status);
            
            for (let i = 0; i <= statusIndex; i++) {
                await query(
                    `INSERT INTO order_timeline (order_id, status, note) VALUES ($1, $2, $3)`,
                    [order.id, statuses[i], `Status updated to ${statuses[i]}`]
                );
            }

            console.log(`✅ Created Order #${order.id}`);
            console.log(`   Customer: ${testOrder.name}`);
            console.log(`   Status: ${testOrder.status}`);
            console.log(`   Partner: ${testOrder.delivery_partner}\n`);
        }

        console.log('='.repeat(50));
        console.log('🎉 MULTIPLE TEST ORDERS CREATED SUCCESSFULLY!');
        console.log('='.repeat(50));
        console.log('\n📊 Dashboard will now show:');
        console.log('   - 1x "New Order" (Priya Sharma)');
        console.log('   - 1x "Accepted" (Raj Kumar)');
        console.log('   - 1x "Packing" (Neha Patel)');
        console.log('   - 1x "Packed" (Arjun Singh)');
        console.log('   - 1x "Out for Delivery" (Kavya Desai)');
        console.log('\n👉 Refresh dashboard to see all orders!');
        console.log(`   http://localhost:3004/admin\n`);

        process.exit(0);

    } catch (err) {
        console.error('\n❌ Error:', err.message);
        console.error('Stack:', err.stack);
        process.exit(1);
    }
}

addMultipleTestOrders();
