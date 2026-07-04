// server.js — Hotel Green Land: Express app (static site + API + admin CMS)
const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'green-land-dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 8 }, // 8 hours
  })
);

// ---------- Uploads (admin gallery/room images) ----------
const UPLOAD_DIR = path.join(__dirname, 'public', 'images', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safe = file.originalname.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
    cb(null, Date.now() + '-' + safe);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (/^image\/(png|jpe?g|webp|gif|svg\+xml)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// ---------- Auth middleware ----------
function requireAdminApi(req, res, next) {
  if (req.session && req.session.adminId) return next();
  res.status(401).json({ error: 'Unauthorized' });
}
function requireAdminPage(req, res, next) {
  if (req.session && req.session.adminId) return next();
  res.redirect('/admin/login.html');
}

// ============================================================
// PUBLIC API
// ============================================================
app.get('/api/rooms', (req, res) => {
  res.json(db.prepare('SELECT * FROM rooms ORDER BY price DESC').all());
});

app.get('/api/menu', (req, res) => {
  res.json(
    db
      .prepare(
        "SELECT * FROM menu_items ORDER BY CASE category WHEN 'breakfast' THEN 1 WHEN 'lunch' THEN 2 WHEN 'dinner' THEN 3 ELSE 4 END, name"
      )
      .all()
  );
});

app.get('/api/gallery', (req, res) => {
  res.json(db.prepare('SELECT * FROM gallery ORDER BY id DESC').all());
});

app.post('/api/bookings', (req, res) => {
  const { name, phone, email, room_type, check_in, check_out, guests, message } = req.body || {};
  if (!name || !String(name).trim() || !phone || !String(phone).trim()) {
    return res.status(400).json({ error: 'Name and phone number are required.' });
  }
  const info = db
    .prepare(
      `INSERT INTO bookings (name, phone, email, room_type, check_in, check_out, guests, message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      String(name).trim(),
      String(phone).trim(),
      String(email || '').trim(),
      String(room_type || '').trim(),
      String(check_in || '').trim(),
      String(check_out || '').trim(),
      parseInt(guests, 10) || 1,
      String(message || '').trim()
    );
  res.status(201).json({ ok: true, id: info.lastInsertRowid });
});

// ============================================================
// ADMIN AUTH
// ============================================================
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(String(username || ''));
  if (!admin || !bcrypt.compareSync(String(password || ''), admin.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }
  req.session.adminId = admin.id;
  res.json({ ok: true });
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.post('/api/admin/change-password', requireAdminApi, (req, res) => {
  const { current_password, new_password } = req.body || {};
  const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(req.session.adminId);
  if (!admin || !bcrypt.compareSync(String(current_password || ''), admin.password_hash)) {
    return res.status(400).json({ error: 'Current password is incorrect.' });
  }
  if (!new_password || String(new_password).length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }
  db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(
    bcrypt.hashSync(String(new_password), 10),
    admin.id
  );
  res.json({ ok: true });
});

// ============================================================
// ADMIN API — bookings
// ============================================================
app.get('/api/admin/bookings', requireAdminApi, (req, res) => {
  res.json(db.prepare('SELECT * FROM bookings ORDER BY created_at DESC, id DESC').all());
});

app.patch('/api/admin/bookings/:id', requireAdminApi, (req, res) => {
  const { status } = req.body || {};
  const allowed = ['new', 'contacted', 'confirmed', 'cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status.' });
  const info = db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Booking not found.' });
  res.json({ ok: true });
});

app.delete('/api/admin/bookings/:id', requireAdminApi, (req, res) => {
  db.prepare('DELETE FROM bookings WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ============================================================
// ADMIN API — rooms CRUD
// ============================================================
app.post('/api/admin/rooms', requireAdminApi, upload.single('image'), (req, res) => {
  const { name, description, price, capacity, features } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Room name is required.' });
  const image = req.file ? '/images/uploads/' + req.file.filename : req.body.image || '';
  const info = db
    .prepare('INSERT INTO rooms (name, description, price, capacity, image, features) VALUES (?, ?, ?, ?, ?, ?)')
    .run(name, description || '', parseFloat(price) || 0, parseInt(capacity, 10) || 2, image, features || '');
  res.status(201).json({ ok: true, id: info.lastInsertRowid });
});

app.put('/api/admin/rooms/:id', requireAdminApi, upload.single('image'), (req, res) => {
  const existing = db.prepare('SELECT * FROM rooms WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Room not found.' });
  const { name, description, price, capacity, features } = req.body || {};
  const image = req.file ? '/images/uploads/' + req.file.filename : existing.image;
  db.prepare(
    'UPDATE rooms SET name = ?, description = ?, price = ?, capacity = ?, image = ?, features = ? WHERE id = ?'
  ).run(
    name || existing.name,
    description !== undefined ? description : existing.description,
    price !== undefined ? parseFloat(price) || 0 : existing.price,
    capacity !== undefined ? parseInt(capacity, 10) || 2 : existing.capacity,
    image,
    features !== undefined ? features : existing.features,
    req.params.id
  );
  res.json({ ok: true });
});

app.delete('/api/admin/rooms/:id', requireAdminApi, (req, res) => {
  db.prepare('DELETE FROM rooms WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ============================================================
// ADMIN API — menu CRUD
// ============================================================
app.post('/api/admin/menu', requireAdminApi, (req, res) => {
  const { name, category, price, description } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Item name is required.' });
  const allowed = ['breakfast', 'lunch', 'dinner', 'drinks'];
  const cat = allowed.includes(category) ? category : 'lunch';
  const info = db
    .prepare('INSERT INTO menu_items (name, category, price, description) VALUES (?, ?, ?, ?)')
    .run(name, cat, parseFloat(price) || 0, description || '');
  res.status(201).json({ ok: true, id: info.lastInsertRowid });
});

app.put('/api/admin/menu/:id', requireAdminApi, (req, res) => {
  const existing = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Menu item not found.' });
  const { name, category, price, description } = req.body || {};
  const allowed = ['breakfast', 'lunch', 'dinner', 'drinks'];
  db.prepare('UPDATE menu_items SET name = ?, category = ?, price = ?, description = ? WHERE id = ?').run(
    name || existing.name,
    allowed.includes(category) ? category : existing.category,
    price !== undefined ? parseFloat(price) || 0 : existing.price,
    description !== undefined ? description : existing.description,
    req.params.id
  );
  res.json({ ok: true });
});

app.delete('/api/admin/menu/:id', requireAdminApi, (req, res) => {
  db.prepare('DELETE FROM menu_items WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ============================================================
// ADMIN API — gallery CRUD
// ============================================================
app.post('/api/admin/gallery', requireAdminApi, upload.single('image'), (req, res) => {
  const { title, category } = req.body || {};
  if (!req.file && !req.body.image_path) return res.status(400).json({ error: 'Image is required.' });
  const image_path = req.file ? '/images/uploads/' + req.file.filename : req.body.image_path;
  const info = db
    .prepare('INSERT INTO gallery (title, category, image_path) VALUES (?, ?, ?)')
    .run(title || 'Untitled', category || 'hotel', image_path);
  res.status(201).json({ ok: true, id: info.lastInsertRowid });
});

app.delete('/api/admin/gallery/:id', requireAdminApi, (req, res) => {
  const row = db.prepare('SELECT * FROM gallery WHERE id = ?').get(req.params.id);
  if (row && row.image_path && row.image_path.startsWith('/images/uploads/')) {
    const file = path.join(__dirname, 'public', row.image_path);
    fs.unlink(file, () => {});
  }
  db.prepare('DELETE FROM gallery WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ============================================================
// ADMIN DASHBOARD STATS
// ============================================================
app.get('/api/admin/stats', requireAdminApi, (req, res) => {
  res.json({
    bookings_total: db.prepare('SELECT COUNT(*) AS c FROM bookings').get().c,
    bookings_new: db.prepare("SELECT COUNT(*) AS c FROM bookings WHERE status = 'new'").get().c,
    rooms: db.prepare('SELECT COUNT(*) AS c FROM rooms').get().c,
    menu_items: db.prepare('SELECT COUNT(*) AS c FROM menu_items').get().c,
    gallery: db.prepare('SELECT COUNT(*) AS c FROM gallery').get().c,
  });
});

// ============================================================
// STATIC SERVING
// ============================================================
// Admin pages (gated, except login)
app.get('/admin', (req, res) => res.redirect('/admin/dashboard.html'));
app.get('/admin/login.html', (req, res) =>
  res.sendFile(path.join(__dirname, 'admin', 'login.html'))
);
app.use(
  '/admin',
  (req, res, next) => {
    // css/js assets for the login page must load without a session
    if (req.path.startsWith('/css/') || req.path.startsWith('/js/')) return next();
    return requireAdminPage(req, res, next);
  },
  express.static(path.join(__dirname, 'admin'))
);

// Public site
app.use(express.static(path.join(__dirname, 'public')));

// Multer/other error handler
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(400).json({ error: err.message || 'Something went wrong.' });
});

app.listen(PORT, () => {
  console.log(`Hotel Green Land running at http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin (default: admin / admin123)`);
});
