// admin.js — shared helpers + page logic for the admin panel
(function () {
  'use strict';

  const esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );

  async function api(url, opts = {}) {
    const res = await fetch(url, opts);
    if (res.status === 401 && !url.includes('/login')) {
      location.href = '/admin/login.html';
      throw new Error('Session expired');
    }
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || 'Request failed');
    return body;
  }

  function showMsg(el, text, type) {
    if (!el) return;
    el.textContent = text;
    el.className = 'msg ' + type;
    setTimeout(() => (el.className = 'msg'), 4000);
  }

  // Highlight active sidebar link
  const page = location.pathname.split('/').pop();
  document.querySelectorAll('.sidebar nav a').forEach((a) => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });

  // Logout
  const logoutBtn = document.querySelector('.logout');
  if (logoutBtn)
    logoutBtn.addEventListener('click', async () => {
      await api('/api/admin/logout', { method: 'POST' });
      location.href = '/admin/login.html';
    });

  // ============ LOGIN ============
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    const msg = document.getElementById('login-msg');
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(loginForm).entries());
      try {
        await api('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        location.href = '/admin/dashboard.html';
      } catch (err) {
        showMsg(msg, err.message, 'error');
      }
    });
  }

  // ============ DASHBOARD ============
  const statsWrap = document.getElementById('stat-cards');
  if (statsWrap) {
    api('/api/admin/stats').then((s) => {
      statsWrap.innerHTML = `
        <div class="stat-card gold"><h3>${s.bookings_new}</h3><p>New Booking Queries</p></div>
        <div class="stat-card"><h3>${s.bookings_total}</h3><p>Total Bookings</p></div>
        <div class="stat-card"><h3>${s.rooms}</h3><p>Room Types</p></div>
        <div class="stat-card"><h3>${s.menu_items}</h3><p>Menu Items</p></div>
        <div class="stat-card"><h3>${s.gallery}</h3><p>Gallery Images</p></div>`;
    });
    // recent bookings preview
    api('/api/admin/bookings').then((rows) => {
      const tbody = document.getElementById('recent-bookings');
      if (!tbody) return;
      tbody.innerHTML = rows.slice(0, 6).map(bookingRow).join('') ||
        '<tr><td colspan="7" style="text-align:center;color:var(--muted)">No bookings yet.</td></tr>';
      bindBookingActions(tbody);
    });
  }

  // ============ BOOKINGS ============
  function bookingRow(b) {
    return `
      <tr data-id="${b.id}">
        <td>#${b.id}</td>
        <td><strong>${esc(b.name)}</strong><br><small>${esc(b.phone)}${b.email ? ' · ' + esc(b.email) : ''}</small></td>
        <td>${esc(b.room_type || '-')}</td>
        <td>${esc(b.check_in || '-')} → ${esc(b.check_out || '-')}<br><small>${b.guests} guest(s)</small></td>
        <td style="max-width:200px"><small>${esc(b.message || '-')}</small></td>
        <td>
          <select class="status-select" data-action="status">
            ${['new', 'contacted', 'confirmed', 'cancelled']
              .map((s) => `<option value="${s}" ${b.status === s ? 'selected' : ''}>${s}</option>`)
              .join('')}
          </select>
          <span class="badge ${esc(b.status)}">${esc(b.status)}</span>
        </td>
        <td>
          <small>${esc((b.created_at || '').slice(0, 16))}</small><br>
          <button class="btn btn-sm btn-danger" data-action="delete">Delete</button>
        </td>
      </tr>`;
  }

  function bindBookingActions(root) {
    root.querySelectorAll('[data-action=status]').forEach((sel) =>
      sel.addEventListener('change', async () => {
        const id = sel.closest('tr').dataset.id;
        await api('/api/admin/bookings/' + id, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: sel.value }),
        });
        const badge = sel.closest('tr').querySelector('.badge');
        badge.className = 'badge ' + sel.value;
        badge.textContent = sel.value;
      })
    );
    root.querySelectorAll('[data-action=delete]').forEach((btn) =>
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this booking?')) return;
        const tr = btn.closest('tr');
        await api('/api/admin/bookings/' + tr.dataset.id, { method: 'DELETE' });
        tr.remove();
      })
    );
  }

  const bookingsTable = document.getElementById('bookings-table');
  if (bookingsTable) {
    api('/api/admin/bookings').then((rows) => {
      bookingsTable.innerHTML = rows.map(bookingRow).join('') ||
        '<tr><td colspan="7" style="text-align:center;color:var(--muted)">No bookings yet.</td></tr>';
      bindBookingActions(bookingsTable);
    });
  }

  // ============ ROOMS ============
  const roomsTable = document.getElementById('rooms-table');
  const roomForm = document.getElementById('room-form');
  if (roomsTable && roomForm) {
    const msg = document.getElementById('room-msg');
    const idField = roomForm.querySelector('[name=id]');

    async function loadRooms() {
      const rooms = await api('/api/rooms');
      roomsTable.innerHTML = rooms
        .map(
          (r) => `
        <tr data-id="${r.id}">
          <td><img class="thumb" src="${esc(r.image || '/images/room-standard.svg')}" alt=""></td>
          <td><strong>${esc(r.name)}</strong><br><small>${esc(r.features)}</small></td>
          <td>Rs. ${Number(r.price).toLocaleString()}</td>
          <td>${r.capacity}</td>
          <td>
            <button class="btn btn-sm btn-light" data-action="edit">Edit</button>
            <button class="btn btn-sm btn-danger" data-action="delete">Delete</button>
          </td>
        </tr>`
        )
        .join('');
      roomsTable.querySelectorAll('[data-action=delete]').forEach((btn) =>
        btn.addEventListener('click', async () => {
          if (!confirm('Delete this room?')) return;
          await api('/api/admin/rooms/' + btn.closest('tr').dataset.id, { method: 'DELETE' });
          loadRooms();
        })
      );
      roomsTable.querySelectorAll('[data-action=edit]').forEach((btn) =>
        btn.addEventListener('click', () => {
          const room = rooms.find((r) => r.id == btn.closest('tr').dataset.id);
          idField.value = room.id;
          roomForm.querySelector('[name=name]').value = room.name;
          roomForm.querySelector('[name=price]').value = room.price;
          roomForm.querySelector('[name=capacity]').value = room.capacity;
          roomForm.querySelector('[name=features]').value = room.features;
          roomForm.querySelector('[name=description]').value = room.description;
          roomForm.querySelector('button[type=submit]').textContent = 'Update Room';
          roomForm.scrollIntoView({ behavior: 'smooth' });
        })
      );
    }

    roomForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(roomForm);
      const id = fd.get('id');
      fd.delete('id');
      try {
        if (id) await api('/api/admin/rooms/' + id, { method: 'PUT', body: fd });
        else await api('/api/admin/rooms', { method: 'POST', body: fd });
        showMsg(msg, id ? 'Room updated.' : 'Room added.', 'success');
        roomForm.reset();
        idField.value = '';
        roomForm.querySelector('button[type=submit]').textContent = 'Add Room';
        loadRooms();
      } catch (err) {
        showMsg(msg, err.message, 'error');
      }
    });

    loadRooms();
  }

  // ============ MENU ============
  const menuTable = document.getElementById('menu-table');
  const menuForm = document.getElementById('menu-form');
  if (menuTable && menuForm) {
    const msg = document.getElementById('menu-msg');
    const idField = menuForm.querySelector('[name=id]');

    async function loadMenu() {
      const items = await api('/api/menu');
      menuTable.innerHTML = items
        .map(
          (i) => `
        <tr data-id="${i.id}">
          <td><strong>${esc(i.name)}</strong><br><small>${esc(i.description)}</small></td>
          <td><span class="badge confirmed">${esc(i.category)}</span></td>
          <td>Rs. ${Number(i.price).toLocaleString()}</td>
          <td>
            <button class="btn btn-sm btn-light" data-action="edit">Edit</button>
            <button class="btn btn-sm btn-danger" data-action="delete">Delete</button>
          </td>
        </tr>`
        )
        .join('');
      menuTable.querySelectorAll('[data-action=delete]').forEach((btn) =>
        btn.addEventListener('click', async () => {
          if (!confirm('Delete this menu item?')) return;
          await api('/api/admin/menu/' + btn.closest('tr').dataset.id, { method: 'DELETE' });
          loadMenu();
        })
      );
      menuTable.querySelectorAll('[data-action=edit]').forEach((btn) =>
        btn.addEventListener('click', () => {
          const item = items.find((i) => i.id == btn.closest('tr').dataset.id);
          idField.value = item.id;
          menuForm.querySelector('[name=name]').value = item.name;
          menuForm.querySelector('[name=category]').value = item.category;
          menuForm.querySelector('[name=price]').value = item.price;
          menuForm.querySelector('[name=description]').value = item.description;
          menuForm.querySelector('button[type=submit]').textContent = 'Update Item';
          menuForm.scrollIntoView({ behavior: 'smooth' });
        })
      );
    }

    menuForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(menuForm).entries());
      const id = data.id;
      delete data.id;
      try {
        if (id)
          await api('/api/admin/menu/' + id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
        else
          await api('/api/admin/menu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
        showMsg(msg, id ? 'Item updated.' : 'Item added.', 'success');
        menuForm.reset();
        idField.value = '';
        menuForm.querySelector('button[type=submit]').textContent = 'Add Item';
        loadMenu();
      } catch (err) {
        showMsg(msg, err.message, 'error');
      }
    });

    loadMenu();
  }

  // ============ GALLERY ============
  const galleryTable = document.getElementById('gallery-table');
  const galleryForm = document.getElementById('gallery-form');
  if (galleryTable && galleryForm) {
    const msg = document.getElementById('gallery-msg');

    async function loadGallery() {
      const images = await api('/api/gallery');
      galleryTable.innerHTML = images
        .map(
          (g) => `
        <tr data-id="${g.id}">
          <td><img class="thumb" src="${esc(g.image_path)}" alt=""></td>
          <td><strong>${esc(g.title)}</strong></td>
          <td><span class="badge contacted">${esc(g.category)}</span></td>
          <td><button class="btn btn-sm btn-danger" data-action="delete">Delete</button></td>
        </tr>`
        )
        .join('');
      galleryTable.querySelectorAll('[data-action=delete]').forEach((btn) =>
        btn.addEventListener('click', async () => {
          if (!confirm('Delete this image?')) return;
          await api('/api/admin/gallery/' + btn.closest('tr').dataset.id, { method: 'DELETE' });
          loadGallery();
        })
      );
    }

    galleryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api('/api/admin/gallery', { method: 'POST', body: new FormData(galleryForm) });
        showMsg(msg, 'Image uploaded.', 'success');
        galleryForm.reset();
        loadGallery();
      } catch (err) {
        showMsg(msg, err.message, 'error');
      }
    });

    loadGallery();
  }

  // ============ CHANGE PASSWORD ============
  const pwForm = document.getElementById('password-form');
  if (pwForm) {
    const msg = document.getElementById('password-msg');
    pwForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(pwForm).entries());
      try {
        await api('/api/admin/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        showMsg(msg, 'Password changed successfully.', 'success');
        pwForm.reset();
      } catch (err) {
        showMsg(msg, err.message, 'error');
      }
    });
  }
})();
