/* wow.js: shared motion layer. Light, no libraries, pauses when off screen or hidden. */
(function () {
  'use strict';
  var d = document, de = d.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var q = function (s, r) { return (r || d).querySelector(s); };
  var qa = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };

  /* ---------- scroll reveals ---------- */
  function reveals() {
    if (reduce || !('IntersectionObserver' in window)) return;
    var sets = [
      ['.sec-head', 'up'], ['.bento>.card', 'zoom'], ['.values>*', 'up'], ['.step', 'up'],
      ['.proj', 'zoom'], ['.faq .item, .faq details, .faq>*', 'up'], ['.about-short>*', 'up'],
      ['.cta .wrap>*', 'up'], ['.post-card', 'zoom'], ['.grid>.card', 'zoom'], ['.area-card', 'zoom'], ['.ind-card', 'zoom']
    ];
    var els = [];
    sets.forEach(function (s) {
      qa(s[0]).forEach(function (el, i) {
        if (el.hasAttribute('data-wow') || el.closest('.hero') || el.closest('.page-hero') || el.classList.contains('rise')) return;
        el.setAttribute('data-wow', s[1] === 'up' ? '' : s[1]);
        el.style.setProperty('--wd', ((i % 3) * 0.09).toFixed(2) + 's');
        els.push(el);
      });
    });
    if (!els.length) return;
    de.classList.add('wow-on');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('wow-in'); io.unobserve(e.target);
        setTimeout(function () { e.target.removeAttribute('data-wow'); e.target.classList.remove('wow-in'); e.target.style.removeProperty('--wd'); }, 1400);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- hero: aurora, living network, pointer depth ---------- */
  function hero() {
    var hh = q('.hero') || q('.page-hero');
    if (!hh) return;
    var isHome = hh.classList.contains('hero');
    var au = d.createElement('div'); au.className = 'hero-aurora'; au.setAttribute('aria-hidden', 'true');
    au.innerHTML = '<i></i><i></i><i></i>';
    hh.insertBefore(au, hh.firstChild);

    var cv = d.createElement('canvas'); cv.className = 'hero-net'; cv.setAttribute('aria-hidden', 'true');
    hh.insertBefore(cv, au.nextSibling);
    var ctx = cv.getContext('2d');
    if (!ctx) return;

    var W = 0, H = 0, dpr = 1, nodes = [], mx = -999, my = -999, raf = 0, vis = true, last = 0;
    var gold = 'rgba(255,217,120,', cyan = 'rgba(116,240,255,', blue = 'rgba(160,190,255,';
    function build() {
      var r = hh.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      var n = Math.round(Math.min(isHome ? 64 : 34, Math.max(16, W / (W < 700 ? 15 : 22))));
      nodes = [];
      for (var i = 0; i < n; i++) {
        nodes.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .28, vy: (Math.random() - .5) * .28,
          r: Math.random() * 1.6 + .8, c: Math.random() < .16 ? gold : (Math.random() < .5 ? cyan : blue), ph: Math.random() * 6.28 });
      }
    }
    function frame(t) {
      raf = 0;
      if (!vis || d.hidden) return;
      if (t - last < 33) { raf = requestAnimationFrame(frame); return; }
      last = t;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      var link = W < 700 ? 96 : 138, L2 = link * link, i, j, a, b;
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        if (!reduce) { a.x += a.vx; a.y += a.vy; if (a.x < -20) a.x = W + 20; else if (a.x > W + 20) a.x = -20; if (a.y < -20) a.y = H + 20; else if (a.y > H + 20) a.y = -20; }
        var dx = a.x - mx, dy = a.y - my, dd = dx * dx + dy * dy;
        if (dd < 22000 && dd > 1) { var f = (1 - dd / 22000) * .6; a.x += dx / Math.sqrt(dd) * f; a.y += dy / Math.sqrt(dd) * f; }
        for (j = i + 1; j < nodes.length; j++) {
          b = nodes[j]; var ex = a.x - b.x, ey = a.y - b.y, e2 = ex * ex + ey * ey;
          if (e2 < L2) { ctx.strokeStyle = cyan + ((1 - e2 / L2) * .30).toFixed(3) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        }
        if (dd < 36000) { ctx.strokeStyle = gold + ((1 - dd / 36000) * .55).toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mx, my); ctx.stroke(); }
        var pulse = .55 + .45 * Math.sin(t / 900 + a.ph);
        ctx.fillStyle = a.c + (.5 + .4 * pulse).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r * (a.c === gold ? 1.5 : 1) * (.9 + .25 * pulse), 0, 6.283); ctx.fill();
      }
      if (!reduce) raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf) raf = requestAnimationFrame(frame); }
    build(); start();
    var rt = 0; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { build(); start(); }, 200); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { vis = e[0].isIntersecting; if (vis) start(); }, { threshold: 0 }).observe(hh);
    d.addEventListener('visibilitychange', function () { if (!d.hidden) start(); });

    /* pointer: network reacts and the dashboard tilts in 3D */
    var gf = q('.gf'), pending = false, px = 0, py = 0;
    if (fine && !reduce) {
      hh.addEventListener('pointermove', function (e) {
        var r = hh.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top;
        px = (e.clientX / window.innerWidth - .5) * 2; py = (e.clientY / window.innerHeight - .5) * 2;
        if (gf && !pending) { pending = true; requestAnimationFrame(function () { pending = false; gf.style.setProperty('--tx', px.toFixed(3)); gf.style.setProperty('--ty', py.toFixed(3)); }); }
      }, { passive: true });
      hh.addEventListener('pointerleave', function () { mx = my = -999; if (gf) { gf.style.setProperty('--tx', 0); gf.style.setProperty('--ty', 0); } });
    }

    /* floating chat bubble, clearly part of the visual concept */
    if (gf && !q('.gf-bub', gf)) {
      var b = d.createElement('div'); b.className = 'gf-bub'; b.setAttribute('aria-hidden', 'true');
      b.innerHTML = '<span class="wa"><svg viewBox="0 0 24 24"><path d="M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9l-4.500 4v-4H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/></svg></span><span class="t"><span class="dots"><i></i><i></i><i></i></span><span class="msg">Hi, what are your prices?</span></span>';
      gf.appendChild(b);
    }
  }

  /* ---------- magnetic call-to-action buttons (mouse only) ---------- */
  function magnets() {
    if (!fine || reduce) return;
    qa('.btn-hero, .btn-primary.btn-lg, .cta .btn-primary').forEach(function (el) {
      el.classList.add('mag');
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.translate = ((e.clientX - r.left - r.width / 2) * .14).toFixed(1) + 'px ' + ((e.clientY - r.top - r.height / 2) * .22).toFixed(1) + 'px';
      });
      el.addEventListener('pointerleave', function () { el.style.translate = ''; });
    });
  }

  function init() { try { reveals(); } catch (e) {} try { hero(); } catch (e) {} try { magnets(); } catch (e) {} }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init); else init();
})();
