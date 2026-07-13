/* ============================================================
   FUEGO STEAKHOUSE — interactions
   ============================================================ */
(function () {
  'use strict';

  /* ---------- hero video: start + loop from 4s ---------- */
  var hv = document.getElementById('heroVideo');
  if (hv) {
    var START = 4;
    var seekStart = function () { try { if (hv.currentTime < START) hv.currentTime = START; } catch (e) {} };
    hv.addEventListener('loadedmetadata', seekStart);
    if (hv.readyState >= 1) seekStart();
    hv.addEventListener('ended', function () { hv.currentTime = START; hv.play().catch(function () {}); });
    // safety: catch loop wrap on browsers that ignore removed loop attr
    hv.addEventListener('timeupdate', function () {
      if (hv.duration && hv.currentTime < START - 0.25 && hv.played.length) hv.currentTime = START;
    });
  }

  /* ---------- sticky header ---------- */
  var header = document.getElementById('header');
  function onScroll() {
    if (window.scrollY > 40) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- mobile nav ---------- */
  var burger = document.getElementById('burger');
  function toggleMenu(force) {
    var open = force !== undefined ? force : !document.body.classList.contains('menu-open');
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', function () { toggleMenu(); });
  document.querySelectorAll('[data-mclose]').forEach(function (el) {
    el.addEventListener('click', function () { toggleMenu(false); });
  });

  /* ---------- stars ---------- */
  var starSVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z"/></svg>';
  document.querySelectorAll('.stars').forEach(function (s) {
    s.innerHTML = starSVG.repeat(5);
  });

  /* ---------- reviews carousel ---------- */
  var track = document.getElementById('reviewTrack');
  if (track) {
    var idx = 0;
    var total = track.children.length;
    function perView() { return window.innerWidth < 760 ? 1 : 3; }
    function update() {
      var pv = perView();
      var max = Math.max(0, total - pv);
      if (idx > max) idx = max;
      var card = track.children[0];
      var gap = parseFloat(getComputedStyle(track).columnGap) || 30;
      var step = card.getBoundingClientRect().width + gap;
      track.style.transform = 'translateX(' + (-idx * step) + 'px)';
      track.style.transition = 'transform .5s cubic-bezier(.22,.61,.36,1)';
    }
    var nextBtn = document.getElementById('revNext');
    var prevBtn = document.getElementById('revPrev');
    if (nextBtn) nextBtn.addEventListener('click', function () {
      idx = Math.min(idx + 1, Math.max(0, total - perView())); update();
    });
    if (prevBtn) prevBtn.addEventListener('click', function () {
      idx = Math.max(idx - 1, 0); update();
    });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------- reveal on scroll ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- reserve modal ---------- */
  var scrim = document.getElementById('modalScrim');
  var form = document.getElementById('reserveForm');
  var success = document.getElementById('reserveSuccess');
  var lastFocus = null;

  function openModal(mode) {
    lastFocus = document.activeElement;
    scrim.hidden = false;
    requestAnimationFrame(function () { scrim.classList.add('open'); });
    document.body.style.overflow = 'hidden';
    form.hidden = false; success.hidden = true;
    var ev = mode === 'event';
    document.getElementById('modalEyebrow').textContent = ev ? 'Private Events' : 'Reservations';
    document.getElementById('modalTitle').textContent = ev ? 'Book a Private Event' : 'Reserve a Table';
    document.getElementById('modalSub').textContent = ev
      ? 'Tell us about your celebration and our events team will reach out to craft it.'
      : "Forged by fire, set for you. Tell us when and we'll handle the rest.";
    document.getElementById('partyLabel').textContent = ev ? 'Estimated Guests' : 'Party Size';
    document.getElementById('reserveSubmit').textContent = ev ? 'Request Event' : 'Confirm Reservation';
    var dateInput = document.getElementById('rDate');
    dateInput.min = new Date().toISOString().split('T')[0];
    setTimeout(function () { document.getElementById('rName').focus(); }, 120);
  }
  function closeModal() {
    scrim.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(function () { scrim.hidden = true; }, 350);
    if (lastFocus) lastFocus.focus();
  }

  document.querySelectorAll('[data-reserve]').forEach(function (b) {
    b.addEventListener('click', function () { openModal(b.getAttribute('data-mode')); });
  });
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('successDone').addEventListener('click', closeModal);
  scrim.addEventListener('click', function (e) { if (e.target === scrim) closeModal(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && scrim.classList.contains('open')) closeModal();
  });

  /* focus trap */
  scrim.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    var f = scrim.querySelectorAll('button, input, select, a[href]');
    f = Array.prototype.filter.call(f, function (el) { return el.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* party pills */
  var partySize = '2';
  document.getElementById('partyPills').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    this.querySelectorAll('button').forEach(function (x) { x.classList.remove('sel'); });
    b.classList.add('sel'); partySize = b.getAttribute('data-size');
  });

  /* submit */
  var msg = document.getElementById('reserveMsg');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    msg.textContent = '';
    var name = document.getElementById('rName');
    var email = document.getElementById('rEmail');
    var phone = document.getElementById('rPhone');
    var date = document.getElementById('rDate');
    var time = document.getElementById('rTime');
    var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
    if (!name.value.trim()) { msg.textContent = 'Please enter your name.'; name.focus(); return; }
    if (!emailOk) { msg.textContent = 'Please enter a valid email address.'; email.focus(); return; }
    if (!phone.value.trim()) { msg.textContent = 'Please enter a phone number.'; phone.focus(); return; }
    if (!date.value) { msg.textContent = 'Please choose a date.'; date.focus(); return; }
    if (!time.value) { msg.textContent = 'Please choose a time.'; time.focus(); return; }

    form.hidden = true; success.hidden = false;
    document.getElementById('successMsg').textContent =
      'Thank you, ' + name.value.trim().split(' ')[0] + ' — a request for ' + partySize +
      ' on ' + new Date(date.value + 'T00:00').toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' }) +
      ' at ' + time.value + ' has been received. We\u2019ll confirm shortly.';
    document.getElementById('successDone').focus();
  });

  /* ---------- newsletter ---------- */
  var news = document.getElementById('newsForm');
  var newsMsg = document.getElementById('newsMsg');
  news.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = document.getElementById('newsEmail').value.trim();
    var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    if (!ok) { newsMsg.textContent = 'Enter a valid email address.'; newsMsg.className = 'msg err'; return; }
    newsMsg.textContent = "You're on the list — welcome to Fuego.";
    newsMsg.className = 'msg ok';
    news.reset();
  });

  /* ---------- active nav on scroll ---------- */
  var sections = ['entertainment', 'private-events', 'contact'];
  var navLinks = document.querySelectorAll('.nav a');
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          navLinks.forEach(function (a) {
            a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id);
          });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (id) { var el = document.getElementById(id); if (el) spy.observe(el); });
    var top = document.getElementById('top');
    if (top) spy.observe(top);
  }
})();
