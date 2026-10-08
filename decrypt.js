/* kr-decrypt: full-page decryption effect for kishore.run home
 * Every visible text block on the page starts as scrambled glyphs that
 * lock into the real letters top-to-bottom, like a decryption scanline
 * sweeping down the page. The hero name gets the deluxe treatment with
 * glowing orange unscrambling characters.
 * Home page only. ~2.5s. Click/keypress skips to the final text.
 * Respects prefers-reduced-motion. Zero dependencies.
 */
(function () {
  'use strict';

  var path = window.location.pathname || '';
  var isHome = /(^|\/)index\.html$/.test(path) || /\/$/.test(path);
  if (!isHome) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var GLYPHS = '█▓▒░<>/\\|{}[]()*&^%$#@!?+=—';
  var STAGGER_MS = 9;    // delay between nodes, top to bottom
  var NODE_DUR_MS = 560; // per-node decrypt time

  function pick() { return GLYPHS[(Math.random() * GLYPHS.length) | 0]; }

  var SKIP_SEL = '.kr-chat,.kr-chat-btn,.kr-teaser,.kr-toast,.kr-modal-overlay,.kr-msg';

  function collect() {
    var out = [];
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var v = n.nodeValue;
        if (!v || !v.trim()) return NodeFilter.FILTER_REJECT;
        var el = n.parentElement;
        if (!el) return NodeFilter.FILTER_REJECT;
        var tag = el.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' ||
            tag === 'TEXTAREA' || tag === 'INPUT') return NodeFilter.FILTER_REJECT;
        if (el.closest && el.closest(SKIP_SEL)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var n;
    while ((n = walker.nextNode())) {
      out.push({
        node: n,
        text: n.nodeValue,
        chars: n.nodeValue.split(''),
        hero: !!(n.parentElement && n.parentElement.closest &&
                 n.parentElement.closest('.hero h1')),
        done: false,
        start: 0
      });
    }
    return out;
  }

  var items = [];
  var finished = false;
  var raf = 0;
  var start = null;

  function restoreAll() {
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (it.hero && it.node.parentElement) {
        it.node.parentElement.textContent = it.text;
      } else {
        try { it.node.nodeValue = it.text; } catch (e) {}
      }
      it.done = true;
    }
  }

  function finish() {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(raf);
    restoreAll();
  }

  function renderHero(it, lockedCount) {
    var html = '';
    for (var c = 0; c < it.chars.length; c++) {
      var ch = it.chars[c];
      if (ch === ' ' || c < lockedCount) {
        var hot = ch !== ' ' && c >= lockedCount - 3;
        html += hot ? '<span style="color:#ff6a00">' + ch + '</span>' : ch;
      } else {
        html += '<span style="color:#8a4d1c">' + pick() + '</span>';
      }
    }
    it.node.parentElement.innerHTML = html;
  }

  function frame(now) {
    if (finished) return;
    if (start === null) start = now;
    var t = now - start;
    var allDone = true;

    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (it.done) continue;
      var lt = t - it.start;
      if (lt < 0) { allDone = false; continue; }
      if (lt >= NODE_DUR_MS) {
        if (it.hero && it.node.parentElement) it.node.parentElement.textContent = it.text;
        else { try { it.node.nodeValue = it.text; } catch (e) {} }
        it.done = true;
        continue;
      }
      allDone = false;
      var lockedCount = Math.floor((lt / NODE_DUR_MS) * it.chars.length);
      if (it.hero && it.node.parentElement) {
        renderHero(it, lockedCount);
      } else {
        var out = '';
        for (var c = 0; c < it.chars.length; c++) {
          out += (it.chars[c] === ' ' || c < lockedCount) ? it.chars[c] : pick();
        }
        try { it.node.nodeValue = out; } catch (e) { it.done = true; }
      }
    }

    if (!allDone) {
      raf = requestAnimationFrame(frame);
    } else {
      finish();
    }
  }

  function run() {
    items = collect();
    for (var i = 0; i < items.length; i++) items[i].start = i * STAGGER_MS;
    window.addEventListener('pointerdown', finish);
    window.addEventListener('keydown', finish);
    // absolute safety: never leave the page scrambled
    window.setTimeout(finish, items.length * STAGGER_MS + NODE_DUR_MS + 4000);
    raf = requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
