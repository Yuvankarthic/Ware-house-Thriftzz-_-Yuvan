import React, { useEffect, useMemo, useState } from 'react';
import BASE_URL from '../../config/api';

const API = `${BASE_URL}/api`;

const initialForm = {
  name: '',
  price: '',
  size: '',
  fit: '',
  condition: '',
};

export default function Products({ token }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/products`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch products');
      setProducts(data.products || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    const id = setInterval(fetchProducts, 5000);
    return () => clearInterval(id);
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(initialForm);
    setImageFile(null);
    setOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({
      name: product.name || '',
      price: product.price || '',
      size: product.size || '',
      fit: product.fit || '',
      condition: product.condition || '',
    });
    setImageFile(null);
    setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (editing) {
        const res = await fetch(`${API}/products/${editing.id}`, {
          method: 'PUT',
          headers: {
            ...authHeaders,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: form.name,
            price: Number(form.price),
            size: form.size,
            fit: form.fit,
            condition: form.condition,
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to update product');
      } else {
        if (!imageFile) throw new Error('Please upload an image');
        const fd = new FormData();
        fd.append('image', imageFile);
        fd.append('name', form.name);
        fd.append('price', form.price);
        fd.append('size', form.size);
        fd.append('fit', form.fit);
        fd.append('condition', form.condition);

        const res = await fetch(`${API}/products`, {
          method: 'POST',
          headers: authHeaders,
          body: fd,
        });

        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to create product');
      }

      setOpen(false);
      await fetchProducts();
    } catch (err) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleSold = async (id) => {
    try {
      const res = await fetch(`${API}/products/${id}/sold`, {
        method: 'PATCH',
        headers: authHeaders,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to update stock');
      await fetchProducts();
    } catch (err) {
      setError(err.message || 'Stock update failed');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      const res = await fetch(`${API}/products/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to delete product');
      await fetchProducts();
    } catch (err) {
      setError(err.message || 'Delete failed');
    }
  };

  return (
    <div>
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Products</h1>
          <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>{products.length} total items</span>
        </div>
        <button className="btn-admin primary" onClick={openAdd}>Add Product</button>
      </div>

      {error && (
        <div style={{ background: 'var(--admin-danger-soft)', border: '1px solid var(--admin-danger)', color: 'var(--admin-danger)', padding: '10px', borderRadius: '10px', marginBottom: '14px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--admin-text-muted)' }}>Loading products...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
          {products.map((p) => {
            const sold = Number(p.stock) === 0;
            return (
              <div key={p.id} className="admin-card" style={{ position: 'relative', padding: 0, overflow: 'hidden' }}>
                <div style={{ position: 'relative', height: 220, background: 'rgba(255,255,255,0.04)' }}>
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-text-muted)' }}>No Image</div>
                  )}
                  {sold && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                      SOLD
                    </div>
                  )}
                </div>

                <div style={{ padding: '12px' }}>
                  <h3 style={{ margin: 0, marginBottom: 6 }}>{p.name}</h3>
                  <p style={{ margin: 0, marginBottom: 8, color: 'var(--admin-accent)', fontWeight: 700 }}>₹{p.price}</p>
                  <p style={{ margin: 0, color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>
                    Size: {p.size || '—'} | Fit: {p.fit || '—'}
                  </p>
                  <p style={{ margin: 0, color: 'var(--admin-text-muted)', fontSize: '0.85rem' }}>
                    Condition: {p.condition || '—'}
                  </p>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                    <button className="btn-admin" onClick={() => openEdit(p)}>Edit</button>
                    <button className="btn-admin warning" onClick={() => toggleSold(p.id)}>{sold ? 'Mark In Stock' : 'Mark as Sold'}</button>
                    <button className="btn-admin danger" onClick={() => remove(p.id)}>Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <form onSubmit={submit} className="admin-card" style={{ width: '100%', maxWidth: 520, padding: 18 }}>
            <h2 style={{ marginTop: 0 }}>{editing ? 'Edit Product' : 'Add Product'}</h2>

            {!editing && (
              <label style={{ display: 'block', marginBottom: 10 }}>
                <span style={{ display: 'block', marginBottom: 6, color: 'var(--admin-text-muted)' }}>Image Upload (Drag & Drop supported)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px dashed var(--admin-border)', background: 'var(--admin-surface-2)', color: 'var(--admin-text)' }}
                />
              </label>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="search-input" />
              <input required type="number" step="0.01" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="search-input" />
              <input placeholder="Size" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className="search-input" />
              <input placeholder="Fit" value={form.fit} onChange={(e) => setForm({ ...form, fit: e.target.value })} className="search-input" />
              <input placeholder="Condition" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className="search-input" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
              <button type="button" className="btn-admin" onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" className="btn-admin primary" disabled={saving}>{saving ? 'Saving...' : 'Save Product'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
