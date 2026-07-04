// pages.js — page-specific: fetch rooms/menu/gallery from API, booking + contact forms
(function () {
  'use strict';

  const WHATSAPP_NUMBER = '9779800000000'; // TODO: replace with the hotel's real WhatsApp number

  const esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );

  // ---------- Rooms ----------
  const roomsGrid = document.querySelector('[data-rooms]');
  if (roomsGrid) {
    fetch('/api/rooms')
      .then((r) => r.json())
      .then((rooms) => {
        if (!rooms.length) {
          roomsGrid.innerHTML = '<p style="text-align:center">Rooms will be listed soon.</p>';
          return;
        }
        roomsGrid.innerHTML = rooms
          .map(
            (room) => `
          <div class="room-card reveal visible">
            <img src="${esc(room.image || '/images/room-standard.svg')}" alt="${esc(room.name)}">
            <div class="room-card-body">
              <h3>${esc(room.name)}</h3>
              <div class="room-price">Rs. ${Number(room.price).toLocaleString()} <small>/ night · up to ${esc(room.capacity)} guests</small></div>
              <p>${esc(room.description)}</p>
              <div class="room-features">
                ${String(room.features || '').split(',').filter(Boolean).map((f) => `<span>${esc(f.trim())}</span>`).join('')}
              </div>
              <a class="btn btn-green" href="booking.html?room=${encodeURIComponent(room.name)}">Book This Room</a>
            </div>
          </div>`
          )
          .join('');
      })
      .catch(() => (roomsGrid.innerHTML = '<p style="text-align:center">Could not load rooms.</p>'));
  }

  // ---------- Menu ----------
  const menuWrap = document.querySelector('[data-menu]');
  if (menuWrap) {
    const CATS = { breakfast: '🌅 Breakfast', lunch: '🍛 Lunch', dinner: '🌙 Dinner', drinks: '🥤 Drinks & Beverages' };
    fetch('/api/menu')
      .then((r) => r.json())
      .then((items) => {
        const byCat = {};
        items.forEach((i) => ((byCat[i.category] = byCat[i.category] || []).push(i)));
        menuWrap.innerHTML = Object.keys(CATS)
          .filter((c) => byCat[c] && byCat[c].length)
          .map(
            (c) => `
          <div class="menu-cat reveal visible" style="margin-bottom:44px">
            <h3 style="font-size:1.5rem;margin-bottom:20px;border-bottom:2px solid var(--accent);display:inline-block;padding-bottom:6px">${CATS[c]}</h3>
            <div style="display:grid;gap:14px">
              ${byCat[c]
                .map(
                  (i) => `
                <div style="background:var(--white);border-radius:10px;padding:18px 22px;box-shadow:var(--shadow);display:flex;justify-content:space-between;gap:16px;align-items:baseline">
                  <div>
                    <strong style="font-size:1.02rem">${esc(i.name)}</strong>
                    <p style="color:var(--muted);font-size:0.88rem;margin-top:4px">${esc(i.description)}</p>
                  </div>
                  <span style="color:var(--accent-dark);font-weight:700;white-space:nowrap">Rs. ${Number(i.price).toLocaleString()}</span>
                </div>`
                )
                .join('')}
            </div>
          </div>`
          )
          .join('');
      })
      .catch(() => (menuWrap.innerHTML = '<p style="text-align:center">Could not load menu.</p>'));
  }

  // ---------- Gallery ----------
  const galleryGrid = document.querySelector('[data-gallery]');
  if (galleryGrid) {
    const filters = document.querySelector('.gallery-filters');
    fetch('/api/gallery')
      .then((r) => r.json())
      .then((images) => {
        function render(cat) {
          const list = cat === 'all' ? images : images.filter((g) => g.category === cat);
          galleryGrid.innerHTML = list.length
            ? list
                .map(
                  (g) => `
              <div class="gallery-item">
                <img src="${esc(g.image_path)}" alt="${esc(g.title)}" loading="lazy">
                <div class="gallery-caption">${esc(g.title)}</div>
              </div>`
                )
                .join('')
            : '<p style="text-align:center;grid-column:1/-1">No images in this category yet.</p>';
        }
        if (filters) {
          const cats = ['all'].concat([...new Set(images.map((g) => g.category))]);
          filters.innerHTML = cats
            .map((c, i) => `<button class="tab-btn ${i === 0 ? 'active' : ''}" data-cat="${esc(c)}">${esc(c.charAt(0).toUpperCase() + c.slice(1))}</button>`)
            .join('');
          filters.querySelectorAll('button').forEach((b) =>
            b.addEventListener('click', () => {
              filters.querySelectorAll('button').forEach((x) => x.classList.remove('active'));
              b.classList.add('active');
              render(b.dataset.cat);
            })
          );
        }
        render('all');
      })
      .catch(() => (galleryGrid.innerHTML = '<p style="text-align:center">Could not load gallery.</p>'));
  }

  // ---------- Booking form ----------
  const bookingForm = document.getElementById('booking-form');
  if (bookingForm) {
    // Preselect room from ?room= and populate the room dropdown from API
    const select = bookingForm.querySelector('[name=room_type]');
    const preselect = new URLSearchParams(location.search).get('room');
    if (select) {
      fetch('/api/rooms')
        .then((r) => r.json())
        .then((rooms) => {
          rooms.forEach((room) => {
            const opt = document.createElement('option');
            opt.value = room.name;
            opt.textContent = `${room.name} — Rs. ${Number(room.price).toLocaleString()}/night`;
            select.appendChild(opt);
          });
          if (preselect) select.value = preselect;
        })
        .catch(() => {});
    }

    const msg = document.getElementById('booking-msg');
    const waBtn = document.getElementById('booking-whatsapp');

    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(bookingForm).entries());
      msg.className = 'form-msg';
      fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
        .then(async (r) => {
          const body = await r.json();
          if (!r.ok) throw new Error(body.error || 'Failed to submit.');
          msg.textContent = '✅ Thank you, ' + data.name + '! Your booking request has been received. We will contact you shortly to confirm.';
          msg.classList.add('success');
          if (waBtn) {
            const text = encodeURIComponent(
              `Hello Hotel Green Land! I just sent a booking request.\n` +
                `Name: ${data.name}\nPhone: ${data.phone}\nRoom: ${data.room_type || 'Any'}\n` +
                `Check-in: ${data.check_in || '-'}\nCheck-out: ${data.check_out || '-'}\nGuests: ${data.guests || 1}\n` +
                (data.message ? `Note: ${data.message}` : '')
            );
            waBtn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
            waBtn.style.display = 'inline-block';
          }
          bookingForm.reset();
        })
        .catch((err) => {
          msg.textContent = '⚠️ ' + err.message;
          msg.classList.add('error');
        });
    });
  }

  // ---------- Contact form (saved as a booking query with room_type 'General Enquiry') ----------
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    const msg = document.getElementById('contact-msg');
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(contactForm).entries());
      data.room_type = 'General Enquiry';
      msg.className = 'form-msg';
      fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
        .then(async (r) => {
          const body = await r.json();
          if (!r.ok) throw new Error(body.error || 'Failed to send.');
          msg.textContent = '✅ Message sent! We will get back to you soon.';
          msg.classList.add('success');
          contactForm.reset();
        })
        .catch((err) => {
          msg.textContent = '⚠️ ' + err.message;
          msg.classList.add('error');
        });
    });
  }
})();
