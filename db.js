// db.js — SQLite database init + seed data for Hotel Green Land
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'hotel.db'));
db.pragma('journal_mode = WAL');

// ---------- Schema ----------
db.exec(`
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price REAL DEFAULT 0,
  capacity INTEGER DEFAULT 2,
  image TEXT DEFAULT '',
  features TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS menu_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'lunch',
  price REAL DEFAULT 0,
  description TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS gallery (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'hotel',
  image_path TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT DEFAULT '',
  room_type TEXT DEFAULT '',
  check_in TEXT DEFAULT '',
  check_out TEXT DEFAULT '',
  guests INTEGER DEFAULT 1,
  message TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// ---------- Seed ----------
const adminCount = db.prepare('SELECT COUNT(*) AS c FROM admins').get().c;
if (adminCount === 0) {
  // Default credentials: admin / admin123  (CHANGE THIS after first login)
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run('admin', hash);
  console.log('[db] Seeded default admin (admin / admin123) — please change the password.');
}

const roomCount = db.prepare('SELECT COUNT(*) AS c FROM rooms').get().c;
if (roomCount === 0) {
  const insert = db.prepare(
    'INSERT INTO rooms (name, description, price, capacity, image, features) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const rooms = [
    ['Deluxe Room', 'Spacious air-conditioned room with a queen-size bed, garden view, and modern furnishings — perfect for couples and business travellers.', 2500, 2, '/images/room-deluxe.svg', 'AC, Queen Bed, Garden View, TV, WiFi, Attached Bathroom'],
    ['Standard Room', 'Comfortable and affordable room with all daily essentials, ideal for solo travellers and short stays.', 1500, 2, '/images/room-standard.svg', 'Fan/Cooler, Double Bed, TV, WiFi, Attached Bathroom'],
    ['Family Suite', 'Two connected rooms with extra beds and seating area — great for families and small groups.', 4000, 5, '/images/room-family.svg', 'AC, 2 Rooms, Extra Beds, Seating Area, TV, WiFi'],
    ['Twin Room', 'Two single beds with a work desk — a practical choice for friends or colleagues travelling together.', 2000, 2, '/images/room-twin.svg', 'AC, Twin Beds, Work Desk, TV, WiFi'],
  ];
  const tx = db.transaction(() => rooms.forEach((r) => insert.run(...r)));
  tx();
  console.log('[db] Seeded rooms.');
}

const menuCount = db.prepare('SELECT COUNT(*) AS c FROM menu_items').get().c;
if (menuCount === 0) {
  const insert = db.prepare(
    'INSERT INTO menu_items (name, category, price, description) VALUES (?, ?, ?, ?)'
  );
  const items = [
    ['Aloo Paratha with Curd', 'breakfast', 120, 'Two stuffed parathas served with fresh curd and pickle.'],
    ['Puri Sabji', 'breakfast', 100, 'Fluffy puris with spiced potato curry.'],
    ['Masala Omelette & Toast', 'breakfast', 90, 'Farm eggs with onion, chilli and coriander.'],
    ['Veg Thali', 'lunch', 180, 'Rice, dal, two seasonal vegetables, roti, salad and papad.'],
    ['Chicken Thali', 'lunch', 280, 'Rice, dal, chicken curry, roti, salad and papad.'],
    ['Fish Curry & Rice', 'lunch', 260, 'Fresh river fish curry with steamed rice.'],
    ['Paneer Butter Masala', 'dinner', 220, 'Cottage cheese in a rich tomato-butter gravy, served with roti or rice.'],
    ['Chicken Biryani', 'dinner', 250, 'Fragrant basmati rice with tender chicken and raita.'],
    ['Dal Tadka with Jeera Rice', 'dinner', 160, 'Yellow dal tempered with ghee, garlic and cumin.'],
    ['Masala Chai', 'drinks', 30, 'Traditional spiced milk tea.'],
    ['Fresh Lassi', 'drinks', 60, 'Sweet or salted, made from fresh curd.'],
    ['Cold Drinks & Mineral Water', 'drinks', 40, 'Assorted soft drinks and bottled water.'],
  ];
  const tx = db.transaction(() => items.forEach((i) => insert.run(...i)));
  tx();
  console.log('[db] Seeded menu items.');
}

const galleryCount = db.prepare('SELECT COUNT(*) AS c FROM gallery').get().c;
if (galleryCount === 0) {
  const insert = db.prepare('INSERT INTO gallery (title, category, image_path) VALUES (?, ?, ?)');
  const images = [
    ['Hotel Front View', 'hotel', '/images/gallery-front.svg'],
    ['Reception & Lobby', 'hotel', '/images/gallery-lobby.svg'],
    ['Deluxe Room Interior', 'rooms', '/images/gallery-room.svg'],
    ['In-House Restaurant', 'dining', '/images/gallery-restaurant.svg'],
    ['Signature Dishes', 'dining', '/images/gallery-food.svg'],
    ['Garden & Surroundings', 'hotel', '/images/gallery-garden.svg'],
  ];
  const tx = db.transaction(() => images.forEach((g) => insert.run(...g)));
  tx();
  console.log('[db] Seeded gallery.');
}

module.exports = db;
