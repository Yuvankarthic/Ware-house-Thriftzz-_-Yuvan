import { Router } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import pool from '../db.js';
import { authMiddleware } from '../auth.js';

const router = Router();
const query = (text, params) => pool.query(text, params);
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

// GET /api/products - all products
router.get('/', async (_req, res) => {
  try {
    const result = await query(
      `SELECT id, name, price, stock, size, fit, condition, image_url, chest_length, shoulder_length, show_on_main, created_at
       FROM products
       ORDER BY created_at DESC`
    );
    return res.json({ success: true, products: result.rows });
  } catch (err) {
    console.error('❌ GET /api/products error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/products - create product with image upload
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { name, price, size, fit, condition, chest_length, shoulder_length, show_on_main } = req.body;

    if (!name || !price) {
      return res.status(400).json({ success: false, error: 'Name and price are required' });
    }

    const imageUploadResult = req.file ? await uploadToCloudinary(req.file.buffer) : null;
    const image_url = imageUploadResult?.secure_url || null;

    const showOnMain = parseBoolean(show_on_main, true);

    const result = await query(
      `INSERT INTO products (name, price, stock, size, fit, condition, image_url, chest_length, shoulder_length, show_on_main)
       VALUES ($1, $2, 1, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, name, price, stock, size, fit, condition, image_url, chest_length, shoulder_length, show_on_main, created_at`,
      [name, price, size || null, fit || null, condition || null, image_url, chest_length || null, shoulder_length || null, showOnMain]
    );

    return res.status(201).json({ success: true, product: result.rows[0] });
  } catch (err) {
    console.error('❌ POST /api/products error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/products/:id - edit product details
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, price, size, fit, condition, image_url, chest_length, shoulder_length, show_on_main } = req.body;
    const showOnMain = parseBoolean(show_on_main);

    const result = await query(
      `UPDATE products
       SET name = COALESCE($1, name),
           price = COALESCE($2, price),
           size = COALESCE($3, size),
           fit = COALESCE($4, fit),
           condition = COALESCE($5, condition),
           image_url = COALESCE($6, image_url),
           chest_length = COALESCE($7, chest_length),
           shoulder_length = COALESCE($8, shoulder_length),
           show_on_main = COALESCE($9, show_on_main)
         WHERE id = $10
         RETURNING id, name, price, stock, size, fit, condition, image_url, chest_length, shoulder_length, show_on_main, created_at`,
        [name, price, size, fit, condition, image_url, chest_length, shoulder_length, showOnMain, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    return res.json({ success: true, product: result.rows[0] });
  } catch (err) {
    console.error('❌ PUT /api/products/:id error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /api/products/:id/sold - toggle stock 1 <-> 0
router.patch('/:id/sold', authMiddleware, async (req, res) => {
  try {
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

    return res.json({ success: true, product: result.rows[0] });
  } catch (err) {
    console.error('❌ PATCH /api/products/:id/sold error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PATCH /api/products/:id/visibility - toggle homepage visibility
router.patch('/:id/visibility', authMiddleware, async (req, res) => {
  try {
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

    return res.json({ success: true, product: result.rows[0] });
  } catch (err) {
    console.error('❌ PATCH /api/products/:id/visibility error:', err.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/products/:id - delete product
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
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
