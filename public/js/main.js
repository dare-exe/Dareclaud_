// main.js — shared behaviour: mobile nav, hero slider, counters, FAQ accordion, reveal, tabs
(function () {
  'use strict';

  // ---------- Mobile nav ----------
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
      toggle.textContent = links.classList.contains('open') ? '✕' : '☰';
    });
    links.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.textContent = '☰';
      })
    );
  }

  // ---------- Active nav link ----------
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach((a) => {
    const href = a.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) a.classList.add('active');
  });

  // ---------- Hero slider ----------
  const slides = document.querySelectorAll('.hero-slide');
  if (slides.length > 1) {
    const dotsWrap = document.querySelector('.hero-dots');
    let current = 0;
    let timer;

    slides.forEach((_, i) => {
      const b = document.createElement('button');
      b.setAttribute('aria-label', 'Slide ' + (i + 1));
      b.addEventListener('click', () => go(i));
      dotsWrap && dotsWrap.appendChild(b);
    });
    const dots = dotsWrap ? dotsWrap.querySelectorAll('button') : [];

    function render() {
      slides.forEach((s, i) => s.classList.toggle('active', i === current));
      dots.forEach((d, i) => d.classList.toggle('active', i === current));
    }
    function go(i) {
      current = (i + slides.length) % slides.length;
      render();
      restart();
    }
    function restart() {
      clearInterval(timer);
      timer = setInterval(() => go(current + 1), 5500);
    }
    const prev = document.querySelector('.hero-arrow.prev');
    const next = document.querySelector('.hero-arrow.next');
    prev && prev.addEventListener('click', () => go(current - 1));
    next && next.addEventListener('click', () => go(current + 1));

    render();
    restart();
  }

  // ---------- Animated counters ----------
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          io.unobserve(el);
          const target = parseInt(el.dataset.count, 10) || 0;
          const suffix = el.dataset.suffix || '';
          const dur = 1600;
          const start = performance.now();
          function tick(now) {
            const p = Math.min((now - start) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased).toLocaleString() + suffix;
            if (p < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach((c) => io.observe(c));
  }

  // ---------- FAQ accordion ----------
  document.querySelectorAll('.faq-item').forEach((item) => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    if (!q || !a) return;
    q.addEventListener('click', () => {
      const open = item.classList.toggle('open');
      a.style.maxHeight = open ? a.scrollHeight + 'px' : '0';
    });
  });

  // ---------- Tabs (Lodging / Dining switcher) ----------
  document.querySelectorAll('[data-tabs]').forEach((wrap) => {
    const btns = wrap.querySelectorAll('.tab-btn');
    const panels = wrap.querySelectorAll('.tab-panel');
    btns.forEach((btn) =>
      btn.addEventListener('click', () => {
        btns.forEach((b) => b.classList.remove('active'));
        panels.forEach((p) => p.classList.remove('active'));
        btn.classList.add('active');
        const panel = wrap.querySelector('#' + btn.dataset.target);
        panel && panel.classList.add('active');
      })
    );
  });

  // ---------- Scroll reveal ----------
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    const rio = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            rio.unobserve(e.target);
          }
        }),
      { threshold: 0.12 }
    );
    reveals.forEach((r) => rio.observe(r));
  }
})();
