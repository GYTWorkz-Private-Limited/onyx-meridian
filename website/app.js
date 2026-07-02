/* =========================================================================
   ONYX · MERIDIAN — interactions
   Vanilla JS, classic script (opens over file:// with no build step).
   ========================================================================= */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.documentElement.style.scrollPaddingTop = '84px';

  /* ----------------------------------------------------------------------
     Sticky nav + scroll progress
  ---------------------------------------------------------------------- */
  var nav = document.getElementById('nav');
  var progress = document.getElementById('scrollProgress');

  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    if (nav) nav.classList.toggle('scrolled', y > 12);
    if (progress) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ----------------------------------------------------------------------
     Mobile menu
  ---------------------------------------------------------------------- */
  var burger = document.getElementById('navBurger');
  var navLinks = document.getElementById('navLinks');
  if (burger && navLinks) {
    burger.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navLinks.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        navLinks.classList.remove('open');
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ----------------------------------------------------------------------
     Active-section highlight in nav
  ---------------------------------------------------------------------- */
  var linkMap = {};
  [].forEach.call(document.querySelectorAll('.nav-links a'), function (a) {
    var id = a.getAttribute('href').replace('#', '');
    linkMap[id] = a;
  });
  var sections = [].filter.call(
    document.querySelectorAll('main section[id]'),
    function (s) { return linkMap[s.id]; }
  );
  if ('IntersectionObserver' in window && sections.length) {
    var secObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          for (var id in linkMap) linkMap[id].classList.remove('active');
          if (linkMap[en.target.id]) linkMap[en.target.id].classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(function (s) { secObs.observe(s); });
  }

  /* ----------------------------------------------------------------------
     Scroll reveal with stagger
  ---------------------------------------------------------------------- */
  var reveals = [].slice.call(document.querySelectorAll('[data-reveal]'));
  // stagger: delay by order within the same parent
  reveals.forEach(function (el) {
    var sibs = [].filter.call(el.parentNode.children, function (c) {
      return c.hasAttribute && c.hasAttribute('data-reveal');
    });
    var idx = sibs.indexOf(el);
    if (idx > 0 && !reduceMotion) {
      el.style.transitionDelay = Math.min(idx * 70, 420) + 'ms';
    }
  });
  if ('IntersectionObserver' in window && !reduceMotion) {
    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          revObs.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { revObs.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ----------------------------------------------------------------------
     Count-up numbers
  ---------------------------------------------------------------------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var suffix = el.getAttribute('data-suffix') || '';
    if (isNaN(target)) return;
    if (reduceMotion) { el.textContent = target.toFixed(decimals) + suffix; return; }
    var dur = 1300, start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);          // easeOutCubic
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toFixed(decimals) + suffix;
    }
    requestAnimationFrame(step);
  }
  var counters = [].slice.call(document.querySelectorAll('[data-count]'));
  if ('IntersectionObserver' in window) {
    var cObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { animateCount(en.target); cObs.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cObs.observe(el); });
  } else {
    counters.forEach(animateCount);
  }

  /* ----------------------------------------------------------------------
     Team tabs
  ---------------------------------------------------------------------- */
  var tabs = [].slice.call(document.querySelectorAll('.tab'));
  var panels = [].slice.call(document.querySelectorAll('.tab-panel'));
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var key = tab.getAttribute('data-tab');
      tabs.forEach(function (t) { t.classList.toggle('active', t === tab); });
      panels.forEach(function (p) {
        p.classList.toggle('active', p.getAttribute('data-panel') === key);
      });
    });
  });

  /* ----------------------------------------------------------------------
     Onyxperts carousel
  ---------------------------------------------------------------------- */
  var track = document.getElementById('expTrack');
  var prev = document.getElementById('expPrev');
  var next = document.getElementById('expNext');
  if (track && prev && next) {
    var step = function () {
      var card = track.querySelector('.exp-card');
      return card ? card.offsetWidth + 22 : 320;
    };
    prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
  }

  /* ----------------------------------------------------------------------
     Accelerator spotlight follow
  ---------------------------------------------------------------------- */
  [].forEach.call(document.querySelectorAll('.acc-card[data-accent]'), function (card) {
    card.addEventListener('mousemove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ----------------------------------------------------------------------
     Integrations marquee — duplicate for seamless loop
  ---------------------------------------------------------------------- */
  var marquee = document.getElementById('marquee');
  if (marquee) {
    marquee.innerHTML += marquee.innerHTML;
  }

  /* ----------------------------------------------------------------------
     Digital Twin — live knowledge graph (canvas)
  ---------------------------------------------------------------------- */
  var canvas = document.getElementById('graphCanvas');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var COLORS = { hub: '#ffffff', user: '#2563eb', sys: '#10b981', flow: '#f97316', dec: '#7c3aed' };
    var nodes = [], links = [], pulses = [], raf = null;

    function build() {
      nodes = [];
      links = [];
      pulses = [];
      var hub = { x: 0.5, y: 0.5, r: 9, type: 'hub', label: 'Twin', fx: true,
                  vx: 0, vy: 0, ph: 0 };
      nodes.push(hub);
      var ring = [
        ['user', 'CRM'], ['user', 'Sales'], ['user', 'Ops'],
        ['sys', 'ERP'], ['sys', 'Data'], ['sys', 'API'],
        ['flow', 'O2C'], ['flow', 'Approve'], ['flow', 'Sync'],
        ['dec', 'Risk'], ['dec', 'Forecast'], ['dec', 'Route']
      ];
      var n = ring.length;
      for (var i = 0; i < n; i++) {
        var ang = (i / n) * Math.PI * 2 - Math.PI / 2;
        var rad = 0.30 + ((i % 3) * 0.045);
        nodes.push({
          x: 0.5 + Math.cos(ang) * rad,
          y: 0.5 + Math.sin(ang) * rad,
          r: 4.2 + Math.random() * 1.6,
          type: ring[i][0],
          vx: (Math.random() - 0.5) * 0.00018,
          vy: (Math.random() - 0.5) * 0.00018,
          ph: Math.random() * Math.PI * 2,
          baseAng: ang, baseRad: rad
        });
        links.push([0, i + 1]);
      }
      // a few cross links for texture
      var cross = [[1, 4], [4, 7], [7, 10], [2, 5], [5, 8], [8, 11], [3, 6], [9, 12]];
      cross.forEach(function (c) {
        if (c[0] < nodes.length && c[1] < nodes.length) links.push(c);
      });
      // travelling pulses on a subset of links
      for (var k = 0; k < links.length; k += 2) {
        pulses.push({ link: k, t: Math.random(), speed: 0.003 + Math.random() * 0.004 });
      }
    }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = Math.max(1, W * dpr);
      canvas.height = Math.max(1, H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function px(node) { return { x: node.x * W, y: node.y * H }; }

    var t0 = 0;
    function frame(ts) {
      var time = ts * 0.001;
      ctx.clearRect(0, 0, W, H);

      // gentle drift around base position
      for (var i = 1; i < nodes.length; i++) {
        var nd = nodes[i];
        var wob = 0.012;
        nd.x = 0.5 + Math.cos(nd.baseAng) * nd.baseRad + Math.cos(time * 0.5 + nd.ph) * wob;
        nd.y = 0.5 + Math.sin(nd.baseAng) * nd.baseRad + Math.sin(time * 0.6 + nd.ph) * wob;
      }

      // links
      for (var l = 0; l < links.length; l++) {
        var a = px(nodes[links[l][0]]), b = px(nodes[links[l][1]]);
        ctx.strokeStyle = 'rgba(255,255,255,0.10)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }

      // pulses
      for (var p = 0; p < pulses.length; p++) {
        var pl = pulses[p];
        pl.t += pl.speed;
        if (pl.t > 1) pl.t = 0;
        var la = px(nodes[links[pl.link][0]]), lb = px(nodes[links[pl.link][1]]);
        var x = la.x + (lb.x - la.x) * pl.t, y = la.y + (lb.y - la.y) * pl.t;
        ctx.fillStyle = 'rgba(96,165,250,0.9)';
        ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill();
      }

      // nodes
      for (var m = 0; m < nodes.length; m++) {
        var no = nodes[m], pp = px(no);
        var col = COLORS[no.type];
        var pulse = no.type === 'hub' ? (1 + Math.sin(time * 1.6) * 0.12) : 1;
        // glow
        var g = ctx.createRadialGradient(pp.x, pp.y, 0, pp.x, pp.y, no.r * 4);
        g.addColorStop(0, col);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = no.type === 'hub' ? 0.5 : 0.30;
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(pp.x, pp.y, no.r * 4 * pulse, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        // core
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(pp.x, pp.y, no.r * pulse, 0, Math.PI * 2); ctx.fill();
        if (no.type === 'hub') {
          ctx.strokeStyle = 'rgba(255,255,255,0.4)';
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(pp.x, pp.y, no.r * pulse + 5, 0, Math.PI * 2); ctx.stroke();
        }
      }
      raf = requestAnimationFrame(frame);
    }

    function start() {
      resize();
      build();
      if (reduceMotion) {
        // single static frame
        frame(0);
        cancelAnimationFrame(raf);
      } else if (!raf) {
        raf = requestAnimationFrame(frame);
      }
    }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

    var ro;
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(function () { resize(); });
      ro.observe(canvas);
    } else {
      window.addEventListener('resize', resize);
    }

    // only animate while in view
    if ('IntersectionObserver' in window) {
      var vis = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { if (!raf && !reduceMotion) raf = requestAnimationFrame(frame); }
          else { stop(); }
        });
      }, { threshold: 0.05 });
      vis.observe(canvas);
    }
    start();
  }
})();
