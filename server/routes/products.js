import { Router } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import pool from '../db.js';
import { authMiddleware } from '../auth.js';

const router = Router();
const query = (text, params) => pool.query(text, params);
let productColumnsReady = false;

const isPrivateOrLocalHost = (hostname = '') => {
  const host = hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.local')) return true;
  if (host === '127.0.0.1' || host === '::1') return true;

  if (/^10\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;

  return false;
};

const normalizePublicAssetUrl = (value) => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  if (raw.startsWith('//')) {
    return `https:${raw}`;
  }

  if (raw.startsWith('https://')) {
    return raw;
  }

  if (raw.startsWith('http://')) {
    try {
      const parsed = new URL(raw);
      if (isPrivateOrLocalHost(parsed.hostname)) {
        return null;
      }
      return `https://${raw.slice('http://'.length)}`;
    } catch {
      return null;
    }
  }

  return raw;
};

const sanitizeProduct = (row = {}) => ({
  ...row,
  image_urls: (() => {
    const rawList = Array.isArray(row.image_urls) ? row.image_urls : [];
    const normalizedList = rawList
      .map((item) => normalizePublicAssetUrl(item))
      .filter(Boolean);

    const primary = normalizePublicAssetUrl(row.image_url);
    if (primary && !normalizedList.includes(primary)) {
      normalizedList.unshift(primary);
    }

    return normalizedList;
  })(),
  image_url: (() => {
    const primary = normalizePublicAssetUrl(row.image_url);
    if (primary) return primary;
    if (Array.isArray(row.image_urls) && row.image_urls.length > 0) {
      return normalizePublicAssetUrl(row.image_urls[0]);
    }
    return null;
  })(),
});

const ensureProductColumns = async () => {
  if (productColumnsReady) return;

  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Jackets';`);
  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS chest_length VARCHAR(50);`);
  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS shoulder_length VARCHAR(50);`);
  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS show_on_main BOOLEAN NOT NULL DEFAULT true;`);
  await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS image_urls JSONB NOT NULL DEFAULT '[]'::jsonb;`);

  productColumnsReady = true;
};

const parseBoolean = (value, fallback = null) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
    if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  }
  return fallback;
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: 'wht-products' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(buffer);
  });
};

// GET /api/products - all products (optional category filter)
router.get('/', async (req, res) => {
  try {
    await ensureProductColumns();

    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';

    const baseQuery = 'SELECT * FROM products';
    const whereClause = category ? ' WHERE category = $1' : '';
    const params = category ? [category] : [];

    const result = await query(
      `${baseQuery}${whereClause} ORDER BY created_at DESC`,
      params
    );
    return res.json({ success: true, products: result.rows.map(sanitizeProduct) });
  } catch (err) {
    console.error('❌ GET /api/products error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/products - create product with image upload
router.post('/', authMiddleware, upload.fields([{ name: 'images', maxCount: 10 }, { name: 'image', maxCount: 1 }]), async (req, res) => {
  try {
    await ensureProductColumns();

    const { name, price, size, fit, condition, category, chest_length, shoulder_length, show_on_main } = req.body;

    if (!name || !price) {
      return res.status(400).json({ success: false, error: 'Name and price are required' });
    }

    const imageFiles = [
      ...((req.files && Array.isArray(req.files.images)) ? req.files.images : []),
      ...((req.files && Array.isArray(req.files.image)) ? req.files.image : []),
    ];

    const uploadedImages = imageFiles.length > 0
      ? await Promise.all(imageFiles.map((file) => uploadToCloudinary(file.buffer)))
      : [];

    const imageUrls = uploadedImages
      .map((item) => item?.secure_url)
      .filter(Boolean);

    const image_url = imageUrls[0] || null;

    const showOnMain = parseBoolean(show_on_main, true);
    const productCategory = category?.trim() || 'Jackets';

    const result = await query(
      `INSERT INTO products (name, price, stock, size, fit, condition, image_url, image_urls, category, chest_length, shoulder_length, show_on_main)
       VALUES ($1, $2, 1, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11)
       RETURNING *`,
      [name, price, size || null, fit || null, condition || null, image_url, JSON.stringify(imageUrls), productCategory, chest_length || null, shoulder_length || null, showOnMain]
    );

    return res.status(201).json({ success: true, product: sanitizeProduct(result.rows[0]) });
  } catch (err) {
    console.error('❌ POST /api/products error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/products/:id - edit product details
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    await ensureProductColumns();

    const { name, price, size, fit, condition, image_url, image_urls, category, chest_length, shoulder_length, show_on_main } = req.body;
    const showOnMain = parseBoolean(show_on_main);

    let parsedImageUrls = null;
    if (Array.isArray(image_urls)) {
      parsedImageUrls = image_urls;
    } else if (typeof image_urls === 'string' && image_urls.trim()) {
      try {
        const maybeArray = JSON.parse(image_urls);
        if (Array.isArray(maybeArray)) parsedImageUrls = maybeArray;
      } catch {
        parsedImageUrls = null;
      }
    }

    const result = await query(
      `UPDATE products
       SET name = COALESCE($1, name),
           price = COALESCE($2, price),
           size = COALESCE($3, size),
           fit = COALESCE($4, fit),
           condition = COALESCE($5, condition),
           image_url = COALESCE($6, image_url),
           category = COALESCE($7, category),
           chest_length = COALESCE($8, chest_length),
           shoulder_length = COALESCE($9, shoulder_length),
           show_on_main = COALESCE($10, show_on_main),
           image_urls = COALESCE($11::jsonb, image_urls)
         WHERE id = $12
         RETURNING *`,
        [name, price, size, fit, condition, image_url, category, chest_length, shoulder_length, showOnMain, parsedImageUrls ? JSON.stringify(parsedImageUrls) : null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    return res.json({ success: true, product: sanitizeProduct(result.rows[0]) });
  } catch (err) {
    console.error('❌ PUT /api/products/:id error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /api/products/:id/sold - toggle stock 1 <-> 0
router.patch('/:id/sold', authMiddleware, async (req, res) => {
  try {
    await ensureProductColumns();

    const result = await query(
      `UPDATE products
       SET stock = CASE WHEN stock > 0 THEN 0 ELSE 1 END
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    return res.json({ success: true, product: sanitizeProduct(result.rows[0]) });
  } catch (err) {
    console.error('❌ PATCH /api/products/:id/sold error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /api/products/:id/visibility - toggle homepage visibility
router.patch('/:id/visibility', authMiddleware, async (req, res) => {
  try {
    await ensureProductColumns();

    const result = await query(
      `UPDATE products
       SET show_on_main = NOT COALESCE(show_on_main, true)
       WHERE id = $1
       RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    return res.json({ success: true, product: sanitizeProduct(result.rows[0]) });
  } catch (err) {
    console.error('❌ PATCH /api/products/:id/visibility error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/products/:id - delete product
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await ensureProductColumns();

    const result = await query('DELETE FROM products WHERE id = $1 RETURNING id', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    return res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    console.error('❌ DELETE /api/products/:id error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
