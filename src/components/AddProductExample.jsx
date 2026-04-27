import React, { useState } from 'react';
import { ProductImageUpload, useExistingImages } from './AddProductReact';

const SAMPLE_EXISTING_PRODUCT = {
  name: 'Vintage Levi\'s Trucker Jacket',
  price: '2499',
  category: 'Jackets',
  size: 'M',
  fit: 'Regular',
  condition: 'Excellent',
  chest_length: '42 inches',
  shoulder_length: '18 inches',
  show_on_main: true,
  image_urls: [
    'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
    'https://images.unsplash.com/photo-1591047139829-d91aecb6dca1?w=400',
    'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=400',
  ],
};

const INITIAL_FORM = {
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

export default function AddProductExample({ isEdit = false }) {
  const [form, setForm] = useState(isEdit ? SAMPLE_EXISTING_PRODUCT : INITIAL_FORM);
  const [existingImages] = useState(() =>
    isEdit ? useExistingImages(SAMPLE_EXISTING_PRODUCT) : []
  );
  const [images, setImages] = useState(existingImages);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (images.length === 0) {
      alert('Please add at least one product image');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...form,
        price: Number(form.price),
        images: images.map((img, idx) => ({
          url: img.url || null,
          file: img.file || null,
          isPrimary: idx === 0,
        })),
      };

      console.log('Submit payload:', payload);
      console.log(
        'Image order (index 0 = cover):',
        images.map((img) => img.preview || img.url)
      );

      await new Promise((r) => setTimeout(r, 1000));
      alert('Product saved! Check console for payload.');
    } catch (err) {
      alert('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="add-product-page">
      <div className="add-product-container">
        <header className="add-product-header">
          <h1>{isEdit ? 'Edit Product' : 'Add Product'}</h1>
          <p className="add-product-subtitle">
            {isEdit
              ? 'Update your vintage piece details'
              : 'List a unique vintage find'}
          </p>
        </header>

        <section className="add-product-form">
          <div className="form-group">
            <label htmlFor="name">Product Name *</label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={updateField('name')}
              placeholder="e.g. Vintage Levi's Trucker Jacket"
              className="form-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Price (₹) *</label>
              <input
                id="price"
                type="number"
                step="0.01"
                value={form.price}
                onChange={updateField('price')}
                placeholder="2499"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                value={form.category}
                onChange={updateField('category')}
                className="form-input"
              >
                <option value="Jackets">Jackets</option>
                <option value="Shirts">Shirts</option>
                <option value="Pants">Pants</option>
                <option value="Accessories">Accessories</option>
                <option value="Footwear">Footwear</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="size">Size</label>
              <input
                id="size"
                type="text"
                value={form.size}
                onChange={updateField('size')}
                placeholder="M / 38 / 42"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="fit">Fit</label>
              <input
                id="fit"
                type="text"
                value={form.fit}
                onChange={updateField('fit')}
                placeholder="Regular / Slim / Oversized"
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="condition">Condition</label>
            <input
              id="condition"
              type="text"
              value={form.condition}
              onChange={updateField('condition')}
              placeholder="Excellent / Good / Fair / Distressed"
              className="form-input"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="chest_length">Chest Width</label>
              <input
                id="chest_length"
                type="text"
                value={form.chest_length}
                onChange={updateField('chest_length')}
                placeholder="e.g. 42 inches"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="shoulder_length">Shoulder Width</label>
              <input
                id="shoulder_length"
                type="text"
                value={form.shoulder_length}
                onChange={updateField('shoulder_length')}
                placeholder="e.g. 18 inches"
                className="form-input"
              />
            </div>
          </div>
        </section>

        <section className="image-upload-section">
          <h2>Product Images *</h2>
          <p className="section-hint">
            Drag to reorder. First image becomes the cover (shown in product cards).
          </p>
          <ProductImageUpload
            images={images}
            onChange={setImages}
            maxImages={10}
          />
        </section>

        <div className="form-actions">
          <button
            type="button"
            className="btn-submit"
            onClick={handleSubmit}
            disabled={saving || images.length === 0}
          >
            {saving
              ? 'Saving...'
              : isEdit
              ? 'Update Product'
              : 'Publish Product'}
          </button>
        </div>
      </div>

      <style>{`
        .add-product-page {
          min-height: 100vh;
          background: #fafafa;
          padding: 24px;
        }

        .add-product-container {
          max-width: 640px;
          margin: 0 auto;
          background: #fff;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
        }

        .add-product-header {
          margin-bottom: 32px;
        }

        .add-product-header h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1a1a2e;
          margin: 0 0 4px;
        }

        .add-product-subtitle {
          color: #6b7280;
          font-size: 0.95rem;
          margin: 0;
        }

        .add-product-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 32px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #374151;
        }

        .form-input {
          padding: 12px 14px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 0.95rem;
          transition: all 0.2s ease;
          background: #fff;
        }

        .form-input:focus {
          outline: none;
          border-color: #1a1a2e;
          box-shadow: 0 0 0 3px rgba(26, 26, 46, 0.1);
        }

        .form-input::placeholder {
          color: #9ca3af;
        }

        .image-upload-section {
          margin-bottom: 32px;
        }

        .image-upload-section h2 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1a1a2e;
          margin: 0 0 4px;
        }

        .section-hint {
          font-size: 0.85rem;
          color: #6b7280;
          margin: 0 0 16px;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
        }

        .btn-submit {
          width: 100%;
          padding: 14px 24px;
          background: #1a1a2e;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-submit:hover:not(:disabled) {
          background: #2d2d4a;
          transform: translateY(-1px);
        }

        .btn-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .add-product-page {
            padding: 16px;
          }

          .add-product-container {
            padding: 24px;
          }

          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}