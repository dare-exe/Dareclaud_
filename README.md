# Hotel Green Land — Website + Admin CMS

Full website for **Hotel Green Land** (Binayi Tribeni Ward No. 06) — a hotel & in-house restaurant.
Frontend: plain HTML/CSS/JS · Backend: Node.js + Express + SQLite.

## Quick Start

```bash
npm install
npm start
# open http://localhost:3000  (or PORT=4000 npm start)
```

The SQLite database (`data/hotel.db`) is created and seeded automatically on first run.

## Admin Panel

- URL: `http://localhost:3000/admin`
- Default login: **admin / admin123** — ⚠️ change it immediately in **Settings → Change Password**.

Admin features:
- **Dashboard** — stats + recent booking queries
- **Bookings** — view queries, update status (new → contacted → confirmed / cancelled), delete
- **Rooms** — add/edit/delete room types with image upload
- **Menu** — add/edit/delete restaurant menu items by category
- **Gallery** — upload/delete photos shown on the public gallery page

## Public Pages

| Page | Purpose |
|---|---|
| `index.html` | Home — hero slider, stats, services (Lodging/Dining tabs), gallery preview, amenities marquee, CTA |
| `about.html` | Story + Good Hospitality banner + why choose us |
| `rooms.html` | Room types & rates (loaded from DB) |
| `dining.html` | Restaurant menu (loaded from DB) |
| `gallery.html` | Full gallery with category filters (loaded from DB) |
| `booking.html` | Booking query form → saved to DB + optional WhatsApp send |
| `contact.html` | Contact info, message form, map placeholder |
| `faq.html` | FAQ accordion |

## Before Going Live — Replace Placeholders

1. **Phone / WhatsApp number** — search for `9779800000000` and replace everywhere
   (also `WHATSAPP_NUMBER` at the top of `public/js/pages.js`).
2. **Email** — search for `hotelgreenland@gmail.com`.
3. **Images** — replace the SVG placeholders in `public/images/` with real photos
   (or upload via the admin Gallery/Rooms pages).
4. **Google Map** — paste your Maps embed iframe in `contact.html` (marked placeholder block).
5. **Social links** — fill the `#` links for Facebook/Instagram.
6. **Session secret** — set `SESSION_SECRET` env var in production.
7. **Admin password** — change from the default!

## Project Structure

```
server.js          Express server: static + API + admin auth
db.js              SQLite schema + seed data
public/            Public website (HTML/CSS/JS)
admin/             Admin panel (session-gated)
scripts/           gen-placeholders.js (regenerate placeholder SVGs)
data/hotel.db      SQLite database (auto-created, gitignored)
```
