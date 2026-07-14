/* ============================================================
   FUEGO STEAKHOUSE — interactions
   ============================================================ */
(function () {
  'use strict';

  /* ---------- form output: Google Sheet endpoint ----------
     Paste your Apps Script Web App /exec URL between the quotes.
     Leave empty to disable sending (forms still work locally). */
  function SHEET_ENDPOINT() { return 'https://script.google.com/macros/s/AKfycbwN3E1KFTJQ4_x7bZ_ZBMgT1aQCzXAh6GQwT3Y1w7ExqrwA-uv5VOAV8FZ-RPI2NFlURA/exec'; }

  function sendToSheet(formType, fields) {
    var url = SHEET_ENDPOINT();
    if (!url) return;
    var payload = {
      form: formType,
      location: 'North Bergen',
      formId: 'fuego-web',
      submitted: new Date().toISOString()
    };
    Object.keys(fields).forEach(function (k) { payload[k] = fields[k]; });
    try {
      fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
    } catch (e) {}
  }

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


  var currentMode = '';
  function openModal(mode) {
    currentMode = mode === 'event' ? 'event' : '';
    lastFocus = document.activeElement;
    scrim.hidden = false;
    requestAnimationFrame(function () { scrim.classList.add('open'); });
    document.body.style.overflow = 'hidden';
    if (success) success.remove();
    if (form) form.remove();
    if (otWrap) otWrap.hidden = false;
    var mt = scrim.querySelector('.modal-top');
    if (mt) mt.querySelectorAll('.eyebrow, #modalTitle, #modalSub').forEach(function (el) { el.remove(); });
  }
  function closeModal() {
    scrim.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(function () { scrim.hidden = true; }, 350);
    if (lastFocus) lastFocus.focus();
  }

  /* OpenTable widget injected into the reserve modal (opens in-page) */
  var otWrap = document.getElementById('otWidget');
  if (!otWrap && form) {
    otWrap = document.createElement('div');
    otWrap.id = 'otWidget';
    otWrap.className = 'modal-body ot-widget';
    otWrap.hidden = true;
    form.parentNode.insertBefore(otWrap, form);
    var otScript = document.createElement('script');
    otScript.type = 'text/javascript';
    otScript.src = '//www.opentable.com/widget/reservation/loader?rid=1473520&type=standard&theme=tall&color=3&dark=true&iframe=true&domain=com&lang=en-US&newtab=false&ot_source=Restaurant%20website&cfe=true';
    otWrap.appendChild(otScript);
  }
  document.querySelectorAll('[data-reserve]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); openModal(b.getAttribute('data-mode')); });
  });
  document.getElementById('modalClose').addEventListener('click', closeModal);
  var successDoneBtn = document.getElementById('successDone');
  if (successDoneBtn) successDoneBtn.addEventListener('click', closeModal);
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

    sendToSheet(currentMode === 'event' ? 'Private Events' : 'Reservations', {
      name: name.value.trim(),
      email: email.value.trim(),
      phone: phone.value.trim(),
      date: date.value,
      time: time.value,
      party: partySize
    });

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
    sendToSheet('Newsletter', { email: v });
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

  /* ---------- menu viewer (in-page PDF modal + keep download) ---------- */
  (function initMenuViewer() {
    var scrim = document.createElement('div');
    scrim.className = 'mv-scrim';
    scrim.hidden = true;
    scrim.innerHTML =
      '<div class="mv" role="dialog" aria-modal="true" aria-label="Menu viewer">' +
        '<div class="mv-head">' +
          '<h3 class="mv-title">Menu</h3>' +
          '<div class="mv-actions">' +
            '<a class="btn btn-ghost mv-open" target="_blank" rel="noopener"><span class="lbl">Open</span> &#8599;</a>' +
            '<a class="btn btn-gold mv-dl" download><span class="lbl">Download</span> Menu</a>' +
            '<button class="mv-close" type="button" aria-label="Close menu">&times;</button>' +
          '</div>' +
        '</div>' +
        '<iframe class="mv-frame" title="Menu preview"></iframe>' +
      '</div>';
    document.body.appendChild(scrim);

    var frame = scrim.querySelector('.mv-frame');
    var titleEl = scrim.querySelector('.mv-title');
    var openA = scrim.querySelector('.mv-open');
    var dlA = scrim.querySelector('.mv-dl');
    var lastMvFocus = null;

    function openViewer(url, label) {
      lastMvFocus = document.activeElement;
      titleEl.textContent = label || 'Menu';
      frame.src = url + (url.indexOf('#') === -1 ? '#view=FitH&toolbar=0' : '');
      openA.href = url;
      dlA.href = url;
      scrim.hidden = false;
      requestAnimationFrame(function () { scrim.classList.add('open'); });
      document.body.style.overflow = 'hidden';
    }
    function closeViewer() {
      scrim.classList.remove('open');
      document.body.style.overflow = '';
      setTimeout(function () { scrim.hidden = true; frame.src = 'about:blank'; }, 380);
      if (lastMvFocus) { try { lastMvFocus.focus(); } catch (e) {} }
    }

    scrim.querySelector('.mv-close').addEventListener('click', closeViewer);
    scrim.addEventListener('click', function (e) { if (e.target === scrim) closeViewer(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && scrim.classList.contains('open')) closeViewer();
    });

    function labelFor(a) {
      var l = a.getAttribute('data-menu-title');
      if (l) return l;
      var h = a.querySelector('h3, h4');
      if (h && h.textContent.trim()) return h.textContent.trim();
      l = a.getAttribute('aria-label');
      if (l) return l.replace(/\s*\(pdf\)/i, '').trim();
      return (a.textContent || 'Menu').replace(/view menu/i, '').trim() || 'Menu';
    }

    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href]');
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (a.hasAttribute('data-no-viewer')) return;
      if (!/\.pdf(\?|#|$)/i.test(href)) return;
      e.preventDefault();
      openViewer(a.href, labelFor(a));
    });
  })();
})();
