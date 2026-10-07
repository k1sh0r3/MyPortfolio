/* kr-preloader: neural-spiral opening animation for kishore.run
 * Plays once per session on the home page. No text, pure animation.
 * ~2s spiral collapse -> glowing ring pulse -> fade. Click/key skips.
 * Respects prefers-reduced-motion. Zero dependencies.
 */
(function () {
  'use strict';

  var path = window.location.pathname || '';
  var isHome = /(^|\/)index\.html$/.test(path) || /\/$/.test(path);
  if (!isHome) return;

  var SEEN_KEY = 'kr-preloader-seen';
  try {
    if (window.sessionStorage.getItem(SEEN_KEY)) return;
    window.sessionStorage.setItem(SEEN_KEY, '1');
  } catch (e) { /* storage unavailable: play anyway */ }

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var ACCENT = '255,106,0'; // #ff6a00
  var BG = '#0a0a0c';
  var SPIRAL_MS = 2000;   // particles collapse
  var RING_MS = 500;      // ring pulse hold
  var FADE_MS = 600;      // overlay fade

  var style = document.createElement('style');
  style.textContent =
    '#kr-preloader{position:fixed;inset:0;z-index:99999;background:' + BG + ';' +
    'cursor:pointer;overflow:hidden;transition:opacity ' + FADE_MS + 'ms ease;}' +
    '#kr-preloader.kr-done{opacity:0;pointer-events:none;}' +
    '#kr-preloader canvas{position:absolute;inset:0;width:100%;height:100%;display:block;}';
  document.head.appendChild(style);

  var overlay = document.createElement('div');
  overlay.id = 'kr-preloader';
  overlay.setAttribute('aria-hidden', 'true');
  var canvas = document.createElement('canvas');
  overlay.appendChild(canvas);
  document.body.appendChild(overlay);

  var ctx = canvas.getContext('2d');
  var w = 0, h = 0, dpr = 1, cx = 0, cy = 0, maxR = 0, ringR = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = w / 2; cy = h / 2;
    maxR = Math.hypot(w, h) / 2;
    ringR = Math.max(44, Math.min(90, Math.min(w, h) * 0.085));
  }
  resize();
  window.addEventListener('resize', resize);

  function rand(a, b) { return a + Math.random() * (b - a); }
  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  var N = Math.max(220, Math.min(650, Math.floor((w * h) / 2600)));
  var parts = [];
  for (var i = 0; i < N; i++) {
    parts.push({
      theta: rand(0, Math.PI * 2),
      r0: rand(maxR * 0.35, maxR * 1.02),
      spin: rand(0.9, 2.4) * (Math.random() < 0.5 ? 1 : 1), // all swirl same way
      size: rand(0.7, 2.3),
      alpha: rand(0.35, 0.95),
      wob: rand(0, Math.PI * 2)
    });
  }

  var start = null, finished = false;

  function finish() {
    if (finished) return;
    finished = true;
    overlay.classList.add('kr-done');
    window.setTimeout(function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (style.parentNode) style.parentNode.removeChild(style);
    }, FADE_MS + 80);
  }
  overlay.addEventListener('pointerdown', finish);
  window.addEventListener('keydown', finish);

  function frame(now) {
    if (finished) return;
    if (start === null) start = now;
    var t = now - start;

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = BG;
    ctx.globalAlpha = 0.28; // trail fade -> motion streaks
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'lighter';

    var p = Math.min(t / SPIRAL_MS, 1);
    var e = easeInOut(p);
    var tSec = t / 1000;

    for (var i = 0; i < parts.length; i++) {
      var pt = parts[i];
      var th = pt.theta + tSec * pt.spin;
      var r = pt.r0 * (1 - e) + ringR * e;
      r += Math.sin(tSec * 3 + pt.wob) * 3 * (1 - e);
      var x = cx + Math.cos(th) * r;
      var y = cy + Math.sin(th) * r * 0.92;

      // short trail segment along the swirl direction
      var thPrev = th - 0.045 * pt.spin;
      var xPrev = cx + Math.cos(thPrev) * (r + 6 * (1 - e));
      var yPrev = cy + Math.sin(thPrev) * (r + 6 * (1 - e)) * 0.92;

      var fade = pt.alpha * (1 - e * 0.55);
      ctx.strokeStyle = 'rgba(' + ACCENT + ',' + fade.toFixed(3) + ')';
      ctx.lineWidth = pt.size;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(xPrev, yPrev);
      ctx.lineTo(x, y);
      ctx.stroke();

      // sparkle dot on the brighter particles
      if (pt.alpha > 0.7) {
        ctx.fillStyle = 'rgba(255,170,80,' + (fade * 0.9).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(x, y, pt.size * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // glowing ring: fades in during the last stretch, pulses at the end
    if (p > 0.55) {
      var rp = (p - 0.55) / 0.45;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(' + ACCENT + ',' + (0.25 + rp * 0.75).toFixed(3) + ')';
      ctx.lineWidth = 3 + rp * 2;
      ctx.shadowColor = 'rgba(' + ACCENT + ',0.9)';
      ctx.shadowBlur = 28;
      ctx.beginPath();
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (p < 1) {
      requestAnimationFrame(frame);
    } else {
      // ring pulse, then fade the whole overlay
      var pulseStart = null;
      (function pulse(now2) {
        if (finished) return;
        if (pulseStart === null) pulseStart = now2;
        var q = Math.min((now2 - pulseStart) / RING_MS, 1);
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = BG;
        ctx.globalAlpha = 0.35;
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'lighter';
        ctx.save();
        ctx.strokeStyle = 'rgba(' + ACCENT + ',' + (1 - q * 0.6).toFixed(3) + ')';
        ctx.lineWidth = 5 - q * 2;
        ctx.shadowColor = 'rgba(' + ACCENT + ',0.9)';
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(cx, cy, ringR * (1 + q * 0.18), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        if (q < 1) requestAnimationFrame(pulse);
        else finish();
      })(performance.now());
    }
  }
  requestAnimationFrame(frame);

  // safety: never trap the user behind the overlay
  window.setTimeout(finish, SPIRAL_MS + RING_MS + 2500);
})();
