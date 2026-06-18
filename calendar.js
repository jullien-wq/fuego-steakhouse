/* ============================================================
   FUEGO — Events Calendar (admin, browser-persisted)
   ============================================================ */
(function () {
  'use strict';

  var STORE = 'fuego_events_v1';
  var DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var FULLDOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  /* ---------- state ---------- */
  // recurring weekly events. weekday: single 0=Sun..6=Sat, OR weekdays: [array]
  var SEED_RECURRING = [
    { id: 'seed-thu',          title: 'Social Night',   time: '3:00 PM – 6:00 PM',  weekday: 4 },
    { id: 'seed-happy',        title: 'Happy Hour',     time: '12:00 PM – 7:00 PM', weekdays: [1, 2, 3, 4, 5] },
    { id: 'seed-brunch-wk',    title: 'Brunch',         time: '11:00 AM – 3:30 PM', weekdays: [1, 2, 3, 4, 5] },
    { id: 'seed-brunch-wknd',  title: 'Weekend Brunch', time: '9:00 AM – 3:30 PM',  weekdays: [0, 6] }
  ];
  function seed() {
    return {
      recurring: SEED_RECURRING.map(function (r) { return Object.assign({}, r); }),
      events: [],
      seededV2: true
    };
  }
  function load() {
    try {
      var raw = localStorage.getItem(STORE);
      if (!raw) { var s = seed(); save(s); return s; }
      var d = JSON.parse(raw);
      if (!d.recurring) d.recurring = [];
      if (!d.events) d.events = [];
      // one-time migration: inject the CH weekly events without wiping the user's own
      if (!d.seededV2) {
        SEED_RECURRING.forEach(function (r) {
          if (!d.recurring.some(function (x) { return x.id === r.id; })) d.recurring.push(Object.assign({}, r));
        });
        d.seededV2 = true;
        save(d);
      }
      return d;
    } catch (e) { return seed(); }
  }
  function save(d) { try { localStorage.setItem(STORE, JSON.stringify(d)); } catch (e) {} }

  var data = load();
  var view = new Date(); view.setDate(1);
  var uid = function () { return 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); };
  var iso = function (y, m, d) { return y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0'); };

  /* ---------- elements ---------- */
  var grid = document.getElementById('calGrid');
  var titleEl = document.getElementById('calTitle');

  /* ---------- render ---------- */
  function occurrencesFor(y, m, d, weekday) {
    var list = [];
    var dateStr = iso(y, m, d);
    data.events.forEach(function (ev) { if (ev.date === dateStr) list.push({ ev: ev, recurring: false }); });
    data.recurring.forEach(function (rc) {
      var match = rc.weekdays ? rc.weekdays.indexOf(weekday) >= 0 : rc.weekday === weekday;
      if (match) list.push({ ev: rc, recurring: true, date: dateStr });
    });
    return list;
  }

  function render() {
    var y = view.getFullYear(), m = view.getMonth();
    titleEl.textContent = MONTHS[m] + ' ' + y;

    var first = new Date(y, m, 1).getDay();        // weekday of the 1st
    var daysIn = new Date(y, m + 1, 0).getDate();
    var prevDays = new Date(y, m, 0).getDate();

    var today = new Date();
    var todayStr = iso(today.getFullYear(), today.getMonth(), today.getDate());

    grid.innerHTML = '';
    // 6 rows × 7 = 42 cells
    for (var i = 0; i < 42; i++) {
      var cell = document.createElement('div');
      cell.className = 'cal-cell';
      var dayNum, cy = y, cm = m, other = false;

      if (i < first) { dayNum = prevDays - first + 1 + i; cm = m - 1; other = true; if (cm < 0) { cm = 11; cy = y - 1; } }
      else if (i >= first + daysIn) { dayNum = i - first - daysIn + 1; cm = m + 1; other = true; if (cm > 11) { cm = 0; cy = y + 1; } }
      else { dayNum = i - first + 1; }

      var weekday = new Date(cy, cm, dayNum).getDay();
      var dateStr = iso(cy, cm, dayNum);
      if (other) cell.classList.add('other-month');
      if (dateStr === todayStr) cell.classList.add('today');
      cell.dataset.date = dateStr;

      var head = document.createElement('div');
      head.className = 'cal-cell-head';
      var num = document.createElement('span'); num.className = 'cal-num'; num.textContent = dayNum;
      head.appendChild(num);
      cell.appendChild(head);

      var evWrap = document.createElement('div'); evWrap.className = 'cal-events';
      var occ = occurrencesFor(cy, cm, dayNum, weekday);
      occ.forEach(function (o) {
        var chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'cal-event' + (o.recurring ? ' is-recurring' : '');
        chip.innerHTML = (o.ev.time ? '<span class="ce-time">' + o.ev.time.split('–')[0].trim() + '</span>' : '') +
                         '<span class="ce-title">' + escapeHtml(o.ev.title) + '</span>';
        chip.addEventListener('click', function (e) {
          e.stopPropagation();
          openModal(o.recurring ? 'edit-recurring' : 'edit', o.ev, o.recurring ? null : dateStr, dateStr);
        });
        evWrap.appendChild(chip);
      });
      cell.appendChild(evWrap);

      var add = document.createElement('span'); add.className = 'cal-add'; add.setAttribute('aria-hidden', 'true'); add.textContent = '+';
      cell.appendChild(add);

      (function (ds) {
        cell.addEventListener('click', function () { openModal('add', null, ds, ds); });
      })(dateStr);

      grid.appendChild(cell);
    }
  }

  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- navigation ---------- */
  function go(delta) { view.setMonth(view.getMonth() + delta); render(); }
  document.getElementById('calPrev').addEventListener('click', function () { go(-1); });
  document.getElementById('calNext').addEventListener('click', function () { go(1); });
  document.getElementById('calToday').addEventListener('click', function () { view = new Date(); view.setDate(1); render(); });
  document.addEventListener('keydown', function (e) {
    if (scrim.classList.contains('open')) return;
    if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'ArrowRight') go(1);
  });

  /* ---------- modal ---------- */
  var scrim = document.getElementById('calModal');
  var form = document.getElementById('calForm');
  var fTitle = document.getElementById('cTitle');
  var fDate = document.getElementById('cDate');
  var fTime = document.getElementById('cTime');
  var fRepeat = document.getElementById('cRepeat');
  var repeatRow = document.getElementById('cRepeatRow');
  var delBtn = document.getElementById('cDelete');
  var modalTitle = document.getElementById('calModalTitle');
  var modalSub = document.getElementById('calModalSub');
  var msg = document.getElementById('calMsg');
  var lastFocus = null;
  var editing = null; // {mode, ref}

  function fmtDate(ds) {
    var p = ds.split('-'); return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }

  function openModal(mode, ev, date, displayDate) {
    lastFocus = document.activeElement;
    editing = { mode: mode, ref: ev };
    msg.textContent = '';
    form.reset();

    var isEdit = mode === 'edit' || mode === 'edit-recurring';
    modalTitle.textContent = isEdit ? 'Edit Event' : 'Add Event';
    modalSub.textContent = displayDate ? fmtDate(displayDate) : '';
    delBtn.hidden = !isEdit;
    document.getElementById('calSubmit').textContent = isEdit ? 'Save Changes' : 'Add Event';

    if (isEdit) {
      fTitle.value = ev.title || '';
      fTime.value = ev.time || '';
      if (mode === 'edit-recurring') {
        repeatRow.style.display = 'none';
        fDate.closest('.field').style.display = 'none';
        modalSub.textContent = ev.weekdays
          ? 'Repeats weekly · ' + ev.weekdays.slice().sort(function (a, b) { return a - b; }).map(function (w) { return DOW[w]; }).join(', ')
          : 'Repeats every ' + FULLDOW[ev.weekday];
      } else {
        repeatRow.style.display = '';
        fDate.closest('.field').style.display = '';
        fDate.value = ev.date;
      }
    } else {
      repeatRow.style.display = '';
      fDate.closest('.field').style.display = '';
      fDate.value = date;
    }

    scrim.hidden = false;
    requestAnimationFrame(function () { scrim.classList.add('open'); });
    document.body.style.overflow = 'hidden';
    setTimeout(function () { fTitle.focus(); }, 120);
  }
  function closeModal() {
    scrim.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(function () { scrim.hidden = true; }, 320);
    if (lastFocus) lastFocus.focus();
  }
  document.getElementById('calModalClose').addEventListener('click', closeModal);
  scrim.addEventListener('click', function (e) { if (e.target === scrim) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && scrim.classList.contains('open')) closeModal(); });

  // focus trap
  scrim.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab') return;
    var f = Array.prototype.filter.call(scrim.querySelectorAll('button, input'), function (el) { return el.offsetParent !== null && !el.disabled; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ---------- submit / delete ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var title = fTitle.value.trim();
    if (!title) { msg.textContent = 'Please enter an event title.'; fTitle.focus(); return; }

    if (editing.mode === 'edit-recurring') {
      editing.ref.title = title;
      editing.ref.time = fTime.value.trim();
    } else if (editing.mode === 'edit') {
      editing.ref.title = title;
      editing.ref.time = fTime.value.trim();
      editing.ref.date = fDate.value || editing.ref.date;
    } else {
      // add
      if (fRepeat.checked) {
        var wd = new Date(fDate.value + 'T00:00').getDay();
        data.recurring.push({ id: uid(), title: title, time: fTime.value.trim(), weekday: wd });
      } else {
        data.events.push({ id: uid(), title: title, time: fTime.value.trim(), date: fDate.value });
      }
    }
    save(data); render(); closeModal();
  });

  delBtn.addEventListener('click', function () {
    if (!editing) return;
    if (editing.mode === 'edit-recurring') {
      data.recurring = data.recurring.filter(function (r) { return r.id !== editing.ref.id; });
    } else {
      data.events = data.events.filter(function (ev) { return ev.id !== editing.ref.id; });
    }
    save(data); render(); closeModal();
  });

  /* ---------- toolbar add ---------- */
  document.getElementById('calAdd').addEventListener('click', function () {
    var t = new Date();
    openModal('add', null, iso(t.getFullYear(), t.getMonth(), t.getDate()), iso(t.getFullYear(), t.getMonth(), t.getDate()));
  });

  render();
})();
