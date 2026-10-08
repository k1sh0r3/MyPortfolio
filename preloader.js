/* kr-preloader: TIME REWIND opening animation for kishore.run
 * The finished homepage shows for a beat, then violently rewinds —
 * sections fly backward into an orange vortex — black pause —
 * then everything plays forward and cascades back in.
 * Home page only, once per session. Click/keypress skips.
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
  var BEAT_MS = 750;    // real page visible before the rewind hits
  var REWIND_MS = 1300; // everything flies backward
  var HOLD_MS = 500;    // black + vortex
  var PLAY_MS = 1150;   // cascade back in

  /* ---------- overlay + canvas ---------- */
  var style = document.createElement('style');
  style.textContent =
    '#kr-rw{position:fixed;inset:0;z-index:99999;cursor:pointer;background:transparent;}' +
    '#kr-rw canvas{position:absolute;inset:0;width:100%;height:100%;display:block;}' +
    '#kr-rw .kr-veil{position:absolute;inset:0;background:' + BG + ';opacity:0;transition:opacity 380ms ease;}';
  document.head.appendChild(style);

  var overlay = document.createElement('div');
  overlay.id = 'kr-rw';
  overlay.setAttribute('aria-hidden', 'true');
  var veil = document.createElement('div');
  veil.className = 'kr-veil';
  var canvas = document.createElement('canvas');
  overlay.appendChild(veil);
  overlay.appendChild(canvas);
  document.body.appendChild(overlay);
  var ctx = canvas.getContext('2d');

  var w = 0, h = 0, cx = 0, cy = 0;
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = w / 2; cy = h / 2;
  }
  resize();
  window.addEventListener('resize', resize);

  /* ---------- page blocks (top-level body children) ---------- */
  var blocks = [];
  Array.prototype.forEach.call(document.body.children, function (el) {
    if (el === overlay || el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
    blocks.push(el);
  });

  function setBlockTransition(el, delay, dur) {
    el.style.transition =
      'transform ' + dur + 'ms cubic-bezier(.7,0,.3,1) ' + delay + 'ms,' +
      'opacity ' + dur + 'ms ease ' + delay + 'ms,' +
      'filter ' + dur + 'ms ease ' + delay + 'ms';
  }
  function clearBlock(el) {
    el.style.transition = '';
    el.style.transform = '';
    el.style.opacity = '';
    el.style.filter = '';
  }

  /* ---------- vortex canvas ---------- */
  function rnd(a, b) { return a + Math.random() * (b - a); }

  var swirl = [];
  for (var i = 0; i < 260; i++) {
    swirl.push({
      a: rnd(0, Math.PI * 2),
      r: rnd(60, Math.max(w, h) * 0.55 + 60),
      sp: rnd(1.2, 3.8),
      sz: rnd(0.8, 3.2),
      al: rnd(0.25, 0.85)
    });
  }
  var streaks = [];
  for (var j = 0; j < 130; j++) {
    streaks.push({
      x: rnd(0, w),
      y: rnd(0, h),
      len: rnd(40, 170),
      sp: rnd(500, 1400),
      al: rnd(0.15, 0.65),
      wd: rnd(1, 3.5)
    });
  }

  var mode = 'idle'; // idle | rewind | hold | play
  var modeT0 = 0;
  var finished = false;
  var raf = 0;

  function drawSwirl(now) {
    var t = (now - modeT0) / 1000;
    var intensity = mode === 'rewind' ? Math.min(1, t / 0.9)
      : mode === 'hold' ? 1
      : Math.max(0, 1 - t / 0.8);

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = BG;
    ctx.globalAlpha = mode === 'hold' ? 0.35 : 0.22;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'lighter';

    var k, x, y, fade;
    for (k = 0; k < swirl.length; k++) {
      var p = swirl[k];
      var dir = mode === 'play' ? -0.4 : 1;
      var ang = p.a + t * p.sp * dir;
      var rr = p.r * (mode === 'rewind' ? Math.max(0.12, 1 - t * 0.55) : 1);
      x = cx + Math.cos(ang) * rr;
      y = cy + Math.sin(ang) * rr * 0.9;
      fade = p.al * intensity;
      if (fade <= 0.01) continue;
      ctx.strokeStyle = 'rgba(' + ACCENT + ',' + fade.toFixed(3) + ')';
      ctx.lineWidth = p.sz;
      ctx.lineCap = 'round';
      ctx.beginPath();
      var pa = ang - 0.06 * p.sp;
      ctx.moveTo(cx + Math.cos(pa) * (rr + 14), cy + Math.sin(pa) * (rr + 14) * 0.9);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    // vertical streaks: the page flying backward
    if ((mode === 'rewind' || mode === 'hold') && intensity > 0.02) {
      for (k = 0; k < streaks.length; k++) {
        var s = streaks[k];
        var span = h + s.len;
        var y2 = (((s.y - t * s.sp) % span) + span) % span - s.len;
        var a2 = s.al * intensity * Math.max(0, 1 - (y2 / h) * 0.35);
        if (a2 <= 0.01) continue;
        ctx.strokeStyle = 'rgba(' + ACCENT + ',' + a2.toFixed(3) + ')';
        ctx.lineWidth = s.wd;
        ctx.beginPath();
        ctx.moveTo(s.x, y2);
        ctx.lineTo(s.x, y2 + s.len);
        ctx.stroke();
      }
    }

    // core glow
    if (intensity > 0.02) {
      var R = 120 * intensity + 20;
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      g.addColorStop(0, 'rgba(' + ACCENT + ',' + (0.5 * intensity).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(' + ACCENT + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop(now) {
    if (mode === 'idle' || finished) return;
    drawSwirl(now);
    raf = requestAnimationFrame(loop);
  }

  /* ---------- phases ---------- */
  var timers = [];
  function later(fn, ms) { timers.push(window.setTimeout(fn, ms)); }

  function finish() {
    if (finished) return;
    finished = true;
    for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
    cancelAnimationFrame(raf);
    for (var b = 0; b < blocks.length; b++) clearBlock(blocks[b]);
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    if (style.parentNode) style.parentNode.removeChild(style);
  }
  overlay.addEventListener('pointerdown', finish);
  window.addEventListener('keydown', finish);

  function phaseRewind() {
    if (finished) return;
    mode = 'rewind'; modeT0 = performance.now();
    veil.style.opacity = '0';
    var n = blocks.length;
    for (var i = 0; i < n; i++) {
      var el = blocks[i];
      var rev = n - 1 - i; // bottom sections leave first: time flowing backward
      var delay = Math.round(rev * (REWIND_MS * 0.45 / Math.max(n - 1, 1)));
      setBlockTransition(el, delay, Math.round(REWIND_MS * 0.62));
      void el.offsetWidth; // reflow so the transition triggers
      el.style.transform = 'translateY(-70px) scale(0.93)';
      el.style.opacity = '0';
      el.style.filter = 'blur(5px) saturate(1.6)';
    }
    loop(performance.now());
    later(phaseHold, REWIND_MS);
  }

  function phaseHold() {
    if (finished) return;
    mode = 'hold'; modeT0 = performance.now();
    veil.style.opacity = '1'; // pure black + vortex
    later(phasePlay, HOLD_MS);
  }

  function phasePlay() {
    if (finished) return;
    mode = 'play'; modeT0 = performance.now();
    veil.style.opacity = '0';
    var n = blocks.length;
    for (var i = 0; i < n; i++) {
      (function (el, idx) {
        var delay = Math.round(idx * (PLAY_MS * 0.5 / Math.max(n - 1, 1)));
        el.style.transition = 'none';
        el.style.transform = 'translateY(46px) scale(0.985)';
        el.style.opacity = '0';
        el.style.filter = 'blur(3px)';
        void el.offsetWidth;
        setBlockTransition(el, delay, Math.round(PLAY_MS * 0.55));
        el.style.transform = 'translateY(0) scale(1)';
        el.style.opacity = '1';
        el.style.filter = 'blur(0px)';
      })(blocks[i], i);
    }
    later(finish, PLAY_MS + 200);
  }

  later(phaseRewind, BEAT_MS); // let the real page show for a beat, then rewind
  later(finish, BEAT_MS + REWIND_MS + HOLD_MS + PLAY_MS + 3000); // absolute safety
})();
