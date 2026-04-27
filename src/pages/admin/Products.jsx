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
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [step, setStep] = useState('form');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

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
    setImageFiles([]);
    setImagePreviews([]);
    setStep('form');
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
    setImageFiles([]);
    setImagePreviews([]);
    setStep('form');
    setOpen(true);
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setImageFiles(prev => [...prev, ...files]);
    
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...previews]);
    
    // Reset file input so selecting the same file again works
    e.target.value = '';
  };

  const removeImage = (indexToRemove) => {
    setImageFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    setImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const moveImage = (index, direction) => {
    if (direction === -1 && index === 0) return;
    if (direction === 1 && index === imageFiles.length - 1) return;
    
    const newFiles = [...imageFiles];
    const newPreviews = [...imagePreviews];
    
    const tempFile = newFiles[index];
    newFiles[index] = newFiles[index + direction];
    newFiles[index + direction] = tempFile;
    
    const tempPreview = newPreviews[index];
    newPreviews[index] = newPreviews[index + direction];
    newPreviews[index + direction] = tempPreview;
    
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const shuffleImages = () => {
    const files = [...imageFiles];
    const previews = [...imagePreviews];
    for (let i = files.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [files[i], files[j]] = [files[j], files[i]];
      [previews[i], previews[j]] = [previews[j], previews[i]];
    }
    setImageFiles(files);
    setImagePreviews(previews);
  };

  const goToPreview = () => {
    if (!form.name || !form.price) {
      setError('Please fill in name and price');
      return;
    }
    setError('');
    setStep('preview');
  };

  const goBackToForm = () => {
    setStep('form');
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
        if (imageFiles.length === 0 && imagePreviews.length === 0) throw new Error('Please upload at least one image');
        const fd = new FormData();
        imageFiles.forEach((file) => fd.append('images', file));
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
      setStep('form');
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

  const previewCardStyle = {
    background: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    maxWidth: 280,
    margin: '0 auto',
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
            const imageList = Array.isArray(p.image_urls) ? p.image_urls : (p.image_url ? [p.image_url] : []);
            const primaryImage = imageList[0] || null;
            return (
              <article key={p.id} className="admin-product-card">
                <div className="admin-product-image-wrap">
                  {primaryImage ? (
                    <img src={primaryImage} alt={p.name} className="admin-product-image" />
                  ) : (
                    <div className="admin-product-no-image">No Image</div>
                  )}
                  {imageList.length > 1 && <div className="admin-product-image-count">+{imageList.length - 1} more</div>}
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
          <div className="admin-modal-card" style={{ maxWidth: 600 }}>
            <h2>{editing ? 'Edit Product' : 'Add Product'}</h2>
            
            {step === 'form' && (
              <>
                {!editing && (
                  <div className="admin-file-upload">
                    <label style={{ display: 'block', width: '100%' }}>
                      <span style={{ display: 'block', marginBottom: 8 }}>Image Upload (Multiple)</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageSelect}
                        style={{ width: '100%', padding: '8px', border: '1px dashed #ccc', borderRadius: '4px' }}
                      />
                    </label>
                    {imagePreviews.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <button type="button" onClick={shuffleImages} style={{ padding: '6px 12px', fontSize: 13, borderRadius: 4, cursor: 'pointer', marginBottom: 12, background: '#f0f0f0', border: '1px solid #ddd', display: 'flex', alignItems: 'center', gap: 4 }}>
                          🔀 Shuffle / Randomize Images
                        </button>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          {imagePreviews.map((src, i) => (
                            <div key={i} style={{ position: 'relative', width: 90, height: 90, border: '1px solid #eee', borderRadius: 8, overflow: 'hidden' }}>
                              <img src={src} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              
                              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', opacity: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 4, transition: 'opacity 0.2s' }}
                                   onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                   onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}>
                                
                                <button type="button" onClick={(e) => { e.preventDefault(); removeImage(i); }} style={{ alignSelf: 'flex-end', background: '#ff4444', color: 'white', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, padding: 0 }}>
                                  ×
                                </button>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <button type="button" onClick={(e) => { e.preventDefault(); moveImage(i, -1); }} disabled={i === 0} style={{ background: 'white', border: 'none', borderRadius: 4, cursor: i === 0 ? 'not-allowed' : 'pointer', opacity: i === 0 ? 0.5 : 1, padding: '2px 8px', fontSize: 14 }}>
                                    &lt;
                                  </button>
                                  <button type="button" onClick={(e) => { e.preventDefault(); moveImage(i, 1); }} disabled={i === imagePreviews.length - 1} style={{ background: 'white', border: 'none', borderRadius: 4, cursor: i === imagePreviews.length - 1 ? 'not-allowed' : 'pointer', opacity: i === imagePreviews.length - 1 ? 0.5 : 1, padding: '2px 8px', fontSize: 14 }}>
                                    &gt;
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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
                  <button type="button" className="btn-admin primary" onClick={goToPreview}>Preview</button>
                </div>
              </>
            )}

            {step === 'preview' && (
              <>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <h3 style={{ color: '#1a1a2e', marginBottom: 4 }}>Preview How It Will Look</h3>
                  <p style={{ color: '#666', fontSize: '0.9rem' }}>This is how customers will see your product</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                  <div style={previewCardStyle}>
                    <div style={{ position: 'relative', height: 200, background: '#f5f5f5' }}>
                      {imagePreviews.length > 0 ? (
                        <img src={imagePreviews[0]} alt={form.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
                          No Image
                        </div>
                      )}
                      <span style={{ position: 'absolute', top: 8, right: 8, background: '#1a1a2e', color: '#fff', padding: '4px 8px', borderRadius: 4, fontSize: '0.8rem' }}>
                        {form.category}
                      </span>
                    </div>
                    <div style={{ padding: 16 }}>
                      <h4 style={{ margin: '0 0 8px', color: '#1a1a2e', fontSize: '1rem' }}>{form.name || 'Product Name'}</h4>
                      <p style={{ margin: '0 0 8px', color: '#f97316', fontWeight: 700, fontSize: '1.2rem' }}>₹{form.price || 0}</p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                        {form.size && <span style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem' }}>Size: {form.size}</span>}
                        {form.fit && <span style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem' }}>Fit: {form.fit}</span>}
                        {form.condition && <span style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem' }}>{form.condition}</span>}
                      </div>
                      <button style={{ width: '100%', background: '#1a1a2e', color: '#fff', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>

                <div className="admin-modal-actions">
                  <button type="button" className="btn-admin ghost" onClick={goBackToForm}>← Back to Edit</button>
                  <button type="button" className="btn-admin primary" onClick={submit} disabled={saving}>
                    {saving ? 'Publishing...' : '✅ Publish to Website'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}