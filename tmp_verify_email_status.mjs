const base = 'http://localhost:4000';

const request = async (path, options = {}) => {
  const res = await fetch(`${base}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} for ${path}`);
    err.payload = data;
    throw err;
  }
  return data;
};

const stamp = Date.now();
const email = `qa.verify+${stamp}@example.com`;

const health = await request('/health', { method: 'GET', headers: {} });
const login = await request('/api/auth/quick-login', {
  method: 'POST',
  body: JSON.stringify({ email: 'admin@wearhouse.com', password: 'wearhouse' }),
});
const token = login.token;

const orderCreate = await request('/api/orders', {
  method: 'POST',
  body: JSON.stringify({
    customer_name: 'Mail Verify',
    email,
    phone: '9999999998',
    address: 'Verify Street',
    city: 'Hyderabad',
    pincode: '500001',
    product_name: 'Verification Product',
    order_value: 999,
    quantity: 1,
    payment_id: `pay_verify_${stamp}`,
  }),
});

const orderId = orderCreate?.order?.order_id;
const authHeader = { Authorization: `Bearer ${token}` };

const before = await request(`/api/orders/${orderId}/email-status`, {
  method: 'GET',
  headers: authHeader,
});

const updateChecks = [];
for (const status of ['Packed', 'Out for Delivery', 'Delivered']) {
  const updateResponse = await request(`/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: authHeader,
    body: JSON.stringify({ status }),
  });

  const emailStatusSnapshot = await request(`/api/orders/${orderId}/email-status`, {
    method: 'GET',
    headers: authHeader,
  });

  updateChecks.push({
    status_update: status,
    update_response: updateResponse,
    email_status_snapshot: emailStatusSnapshot,
  });
}

const result = {
  health,
  login_ok: Boolean(token),
  order_id: orderId,
  customer_email: email,
  order_create_response: orderCreate,
  email_status_before_updates: before,
  update_checks: updateChecks,
};

await import('node:fs/promises').then((fs) =>
  fs.writeFile('c:/websiteu1/tmp_verify_email_status.json', JSON.stringify(result, null, 2), 'utf8')
);

console.log('Wrote c:/websiteu1/tmp_verify_email_status.json');
