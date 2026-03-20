import React, { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import BASE_URL from '../../config/api';

const API = `${BASE_URL}/api`;

const initialForm = {
  name: '',
  price: '',
  category: 'Jackets',
  size: '',
  fit: '',
  condition: '',
  chest_length: '',
  shoulder_length: '',
  show_on_main: true,
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
      category: product.category || 'Jackets',
      size: product.size || '',
      fit: product.fit || '',
      condition: product.condition || '',
      chest_length: product.chest_length || '',
      shoulder_length: product.shoulder_length || '',
      show_on_main: product.show_on_main !== false,
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
            category: form.category,
            size: form.size,
            fit: form.fit,
            condition: form.condition,
            chest_length: form.chest_length,
            shoulder_length: form.shoulder_length,
            show_on_main: form.show_on_main,
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
        fd.append('category', form.category);
        fd.append('size', form.size);
        fd.append('fit', form.fit);
        fd.append('condition', form.condition);
        fd.append('chest_length', form.chest_length);
        fd.append('shoulder_length', form.shoulder_length);
        fd.append('show_on_main', String(form.show_on_main));

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

  const toggleMainVisibility = async (id) => {
    try {
      const res = await fetch(`${API}/products/${id}/visibility`, {
        method: 'PATCH',
        headers: authHeaders,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to toggle visibility');
      await fetchProducts();
    } catch (err) {
      setError(err.message || 'Visibility update failed');
    }
  };

  return (
    <div className="admin-products-page">
      <div className="admin-page-header">
        <div>
          <h1>Products</h1>
          <span className="admin-subtext">{products.length} total items</span>
        </div>
        <div className="header-actions">
          <button type="button" className="btn-admin ghost" onClick={fetchProducts}>Refresh</button>
          <button type="button" className="btn-admin primary" onClick={openAdd}>Add Product</button>
        </div>
      </div>

      {error && <div className="admin-alert error">{error}</div>}

      {loading ? (
        <p className="admin-subtext">Loading products...</p>
      ) : (
        <div className="admin-products-grid">
          {products.map((p) => {
            const sold = Number(p.stock) === 0;
            return (
              <article key={p.id} className="admin-product-card">
                <div className="admin-product-image-wrap">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="admin-product-image" />
                  ) : (
                    <div className="admin-product-no-image">No Image</div>
                  )}
                  {sold && <div className="admin-product-sold-overlay">Sold</div>}
                </div>

                <div className="admin-product-content">
                  <h3>{p.name}</h3>
                  <p className="admin-product-price">₹{p.price}</p>
                  <p className="admin-product-meta">Size: {p.size || '—'} | Fit: {p.fit || '—'}</p>
                  <p className="admin-product-meta">Category: {p.category || 'Jackets'}</p>
                  <p className="admin-product-meta">Condition: {p.condition || '—'}</p>
                  {(p.chest_length || p.shoulder_length) && (
                    <p className="admin-product-meta">
                      Chest: {p.chest_length || '—'} | Shoulder: {p.shoulder_length || '—'}
                    </p>
                  )}
                  <p className="admin-product-meta">
                    Main Website: {p.show_on_main === false ? 'Hidden' : 'Visible'}
                  </p>

                  <div className="admin-product-actions">
                    <button
                      type="button"
                      className={`btn-admin btn-visibility ${p.show_on_main === false ? 'off' : 'on'}`}
                      onClick={() => toggleMainVisibility(p.id)}
                      title={p.show_on_main === false ? 'Turn ON for main website' : 'Turn OFF from main website'}
                    >
                      {p.show_on_main === false ? <EyeOff size={14} /> : <Eye size={14} />}
                      {p.show_on_main === false ? 'OFF Main' : 'ON Main'}
                    </button>
                    <button type="button" className="btn-admin" onClick={() => openEdit(p)}>Edit</button>
                    <button type="button" className={`btn-admin ${sold ? 'success' : 'warning'}`} onClick={() => toggleSold(p.id)}>
                      {sold ? 'Mark as Available' : 'Mark as Sold'}
                    </button>
                    <button type="button" className="btn-admin danger" onClick={() => remove(p.id)}>Delete</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {open && (
        <div className="admin-modal-overlay">
          <form onSubmit={submit} className="admin-modal-card">
            <h2>{editing ? 'Edit Product' : 'Add Product'}</h2>

            {!editing && (
              <label className="admin-file-upload">
                <span>Image Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
              </label>
            )}

            <div className="admin-product-form-grid">
              <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="search-input" />
              <input required type="number" step="0.01" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="search-input" />
              <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="search-input">
                <option value="Jackets">Jackets</option>
                <option value="Shirts">Shirts</option>
                <option value="Pants">Pants</option>
              </select>
              <input placeholder="Size" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className="search-input" />
              <input placeholder="Fit" value={form.fit} onChange={(e) => setForm({ ...form, fit: e.target.value })} className="search-input" />
              <input placeholder="Condition" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className="search-input" />
              <input placeholder="e.g. 42 inches" value={form.chest_length} onChange={(e) => setForm({ ...form, chest_length: e.target.value })} className="search-input" />
              <input placeholder="e.g. 18 inches" value={form.shoulder_length} onChange={(e) => setForm({ ...form, shoulder_length: e.target.value })} className="search-input" />
              <select value={form.show_on_main ? 'true' : 'false'} onChange={(e) => setForm({ ...form, show_on_main: e.target.value === 'true' })} className="search-input">
                <option value="true">Show on Main Website</option>
                <option value="false">Keep Hidden from Main Website</option>
              </select>
            </div>

            <div className="admin-modal-actions">
              <button type="button" className="btn-admin ghost" onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" className="btn-admin primary" disabled={saving}>{saving ? 'Saving...' : 'Save Product'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
