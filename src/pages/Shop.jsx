import React, { useEffect, useState } from 'react';
import BASE_URL from '../config/api';

const API = `${BASE_URL}/api`;

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API}/products`);
      const data = await res.json();
      if (data.success) {
        const inStock = (data.products || []).filter((p) => Number(p.stock) > 0);
        setProducts(inStock);
      }
    } catch (_err) {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    const id = setInterval(fetchProducts, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <main style={{ maxWidth: 1200, margin: '20px auto 80px', padding: '0 16px' }}>
      <h1 style={{ marginBottom: 6 }}>Shop</h1>
      <p style={{ opacity: 0.75, marginTop: 0, marginBottom: 20 }}>Fresh thrift drops, only in-stock pieces.</p>

      {loading ? (
        <p>Loading products...</p>
      ) : products.length === 0 ? (
        <p>No in-stock products right now.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {products.map((p) => (
            <article key={p.id} style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
              <div style={{ height: 240, background: '#f4f4f4' }}>
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>No Image</div>
                )}
              </div>

              <div style={{ padding: 12 }}>
                <h3 style={{ margin: 0, marginBottom: 6, fontSize: '1rem' }}>{p.name}</h3>
                <p style={{ margin: 0, marginBottom: 8, fontWeight: 700 }}>₹{p.price}</p>
                <p style={{ margin: 0, color: '#555', fontSize: '0.88rem' }}>Size: {p.size || '—'} | Fit: {p.fit || '—'}</p>
                <span style={{ display: 'inline-block', marginTop: 8, fontSize: '0.75rem', padding: '3px 8px', borderRadius: 99, background: '#eaf7ef', color: '#166534' }}>
                  {p.condition || 'Vintage'}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
