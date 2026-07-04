// Generates branded SVG placeholder images for Hotel Green Land
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'public', 'images');
fs.mkdirSync(OUT, { recursive: true });

const palettes = {
  green: ['#1b5e3b', '#2e7d4f'],
  dark: ['#12241a', '#1b5e3b'],
  gold: ['#b8860b', '#d4a941'],
  teal: ['#14532d', '#166534'],
};

function svg(name, label, sub, palette, w = 1200, h = 700, icon = '🏨') {
  const [c1, c2] = palettes[palette] || palettes.green;
  const content = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
    <pattern id="dots" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="20" cy="20" r="1.5" fill="rgba(255,255,255,0.12)"/>
    </pattern>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <rect width="${w}" height="${h}" fill="url(#dots)"/>
  <circle cx="${w * 0.85}" cy="${h * 0.2}" r="${h * 0.35}" fill="rgba(255,255,255,0.05)"/>
  <circle cx="${w * 0.1}" cy="${h * 0.9}" r="${h * 0.4}" fill="rgba(0,0,0,0.08)"/>
  <text x="50%" y="42%" text-anchor="middle" font-size="${h * 0.14}" font-family="Georgia, serif">${icon}</text>
  <text x="50%" y="58%" text-anchor="middle" fill="#ffffff" font-size="${h * 0.075}" font-weight="bold" font-family="Georgia, 'Times New Roman', serif">${label}</text>
  <text x="50%" y="67%" text-anchor="middle" fill="#d4a941" font-size="${h * 0.04}" font-family="Arial, sans-serif" letter-spacing="3">${sub.toUpperCase()}</text>
</svg>`;
  fs.writeFileSync(path.join(OUT, name), content);
  console.log('wrote', name);
}

// Hero slides (wide)
svg('hero-1.svg', 'Welcome to Hotel Green Land', 'Binayi Tribeni Ward No. 06', 'dark', 1920, 900, '🏨');
svg('hero-2.svg', 'Comfort Meets Nature', 'Peaceful stays in Tribeni', 'green', 1920, 900, '🌿');
svg('hero-3.svg', 'In-House Restaurant', 'Local & continental cuisine', 'teal', 1920, 900, '🍽️');
svg('hero-4.svg', 'Your Home Away From Home', 'Good hospitality, always', 'dark', 1920, 900, '🛎️');

// Rooms
svg('room-deluxe.svg', 'Deluxe Room', 'Queen bed · Garden view', 'green', 900, 600, '🛏️');
svg('room-standard.svg', 'Standard Room', 'Comfortable & affordable', 'teal', 900, 600, '🛏️');
svg('room-family.svg', 'Family Suite', 'Space for the whole family', 'dark', 900, 600, '👨‍👩‍👧‍👦');
svg('room-twin.svg', 'Twin Room', 'Two single beds', 'green', 900, 600, '🛏️');

// Gallery
svg('gallery-front.svg', 'Hotel Front View', 'Hotel Green Land', 'dark', 900, 700, '🏨');
svg('gallery-lobby.svg', 'Reception & Lobby', 'Warm welcome', 'green', 900, 700, '🛎️');
svg('gallery-room.svg', 'Deluxe Room Interior', 'Rest well', 'teal', 900, 700, '🛏️');
svg('gallery-restaurant.svg', 'In-House Restaurant', 'Dine with us', 'gold', 900, 700, '🍽️');
svg('gallery-food.svg', 'Signature Dishes', 'Fresh & local', 'green', 900, 700, '🍛');
svg('gallery-garden.svg', 'Garden & Surroundings', 'Nature at Tribeni', 'teal', 900, 700, '🌿');

// About / banners
svg('about-hotel.svg', 'Hotel Green Land', 'Since 2015 · Tribeni', 'green', 1000, 800, '🏨');
svg('hospitality.svg', 'Good Hospitality', 'Our promise to every guest', 'gold', 1600, 500, '🤝');

console.log('All placeholders generated.');
