/* ============================================================
   FUEGO — sticky-header live flames
   Subtle ember/fire along the header's bottom edge.
   Runs ONLY on desktop and ONLY while the header is in its
   sticky (.scrolled) state. Faded at the top so it never
   covers nav text. Respects prefers-reduced-motion.
   ============================================================ */
(function () {
  'use strict';
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var header = document.getElementById('header') || document.querySelector('.site-header');
  if (!header) return;

  var canvas = document.createElement('canvas');
  canvas.className = 'header-fire';
  canvas.setAttribute('aria-hidden', 'true');
  header.insertBefore(canvas, header.firstChild);
  var ctx = canvas.getContext('2d');

  // low-res offscreen buffer (upscaled for a soft glow)
  var buf = document.createElement('canvas');
  var bctx = buf.getContext('2d');

  // muted ember palette (transparent -> deep red -> orange -> soft amber)
  var N = 37, palette = [];
  for (var i = 0; i < N; i++) {
    var t = i / (N - 1);
    palette.push([
      Math.round(Math.pow(t, 0.7) * 226),
      Math.round(Math.pow(t, 1.7) * 116),
      Math.round(Math.pow(t, 3.2) * 42),
      Math.round(Math.min(1, t * 1.25) * 255)
    ]);
  }
  palette[0] = [0, 0, 0, 0];
  var PMAX = N - 1;

  var fw, fh, fire, img, raf = null;

  function setup() {
    var w = Math.min(header.clientWidth || window.innerWidth, 1600);
    canvas.width = w;
    canvas.height = 36;
    fw = Math.max(80, Math.round(w / 7));   // fire columns
    fh = 17;                                 // fire rows
    buf.width = fw; buf.height = fh;
    img = bctx.createImageData(fw, fh);
    fire = new Uint8Array(fw * fh);
    // seed bottom row hot
    for (var x = 0; x < fw; x++) fire[(fh - 1) * fw + x] = PMAX;
  }

  function spread(from) {
    var px = fire[from];
    if (px === 0) { fire[from - fw] = 0; return; }
    var rand = Math.floor(Math.random() * 3) & 3;
    var to = from - fw - rand + 1;
    if (to < 0) to = 0;
    fire[to] = px - (rand & 1);
  }

  function step() {
    for (var x = 0; x < fw; x++) fire[(fh - 1) * fw + x] = PMAX;
    for (var x2 = 0; x2 < fw; x2++)
      for (var y = 1; y < fh; y++) spread(y * fw + x2);
  }

  function render() {
    var d = img.data, k = 0;
    for (var p = 0; p < fire.length; p++) {
      var c = palette[fire[p]];
      d[k++] = c[0]; d[k++] = c[1]; d[k++] = c[2]; d[k++] = c[3];
    }
    bctx.putImageData(img, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(buf, 0, 0, canvas.width, canvas.height);
  }

  function active() {
    return window.innerWidth > 1040 && header.classList.contains('scrolled');
  }

  function loop() {
    if (!active()) { canvas.classList.remove('lit'); raf = null; return; }
    canvas.classList.add('lit');
    step(); render();
    raf = requestAnimationFrame(loop);
  }
  function start() { if (!raf && active()) { if (!fire) setup(); raf = requestAnimationFrame(loop); } }

  setup();
  window.addEventListener('scroll', start, { passive: true });
  window.addEventListener('resize', function () { setup(); start(); });
  if (window.MutationObserver) new MutationObserver(start).observe(header, { attributes: true, attributeFilter: ['class'] });
  start();
})();
