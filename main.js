(function () {
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  // Menu burger
  var burger = document.getElementById('burger'), nav = document.getElementById('nav');
  var toggle = function (open) {
    nav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
  };
  burger.addEventListener('click', function () { toggle(!nav.classList.contains('open')); });
  nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') toggle(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') toggle(false); });

  // Personnages : si l'image est absente, on la retire
  document.querySelectorAll('.pp, .pb').forEach(function (img) {
    var bad = function () { img.remove(); };
    img.addEventListener('error', bad);
    if (img.complete && img.naturalWidth === 0) bad();
  });

  // Intro (accueil)
  var intro = document.getElementById('intro');
  if (intro) {
    var seen = false;
    try { seen = sessionStorage.getItem('intro') === '1'; } catch (e) {}
    var close = function () {
      intro.classList.add('out');
      setTimeout(function () { intro.remove(); }, 800);
      try { sessionStorage.setItem('intro', '1'); } catch (e) {}
    };
    if (seen) { intro.remove(); }
    else {
      document.getElementById('skip').addEventListener('click', close);
      setTimeout(close, 4200);
    }
  }

  // Puzzle (accueil)
  var cards = document.querySelectorAll('.pc'), msg = document.querySelector('.done-msg');
  if (cards.length) {
    if (!('IntersectionObserver' in window)) {
      cards.forEach(function (c) { c.classList.add('in'); });
      if (msg) msg.classList.add('show');
    } else {
      var count = 0;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add('in');
          io.unobserve(e.target);
          count++;
          if (count === cards.length) setTimeout(function () { msg.classList.add('show'); }, 1000);
        });
      }, { threshold: 0.35 });
      cards.forEach(function (c) { io.observe(c); });
    }
  }

  // Carte (contact) : chargée seulement au clic
  var showmap = document.getElementById('showmap');
  if (showmap) {
    showmap.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = 'https://www.google.com/maps?q=341+route+de+Bresse+01240+Lent&output=embed';
      f.title = 'Plan d’accès à la Brasserie Puzzle';
      f.loading = 'lazy';
      document.getElementById('map').replaceChildren(f);
    });
  }

  // Événements (liste modifiée depuis /admin, enregistrée dans evenements.json)
  function parseDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || '');
    if (m) return new Date(+m[1], m[2] - 1, +m[3]);
    m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s || '');
    return m ? new Date(+m[3], m[2] - 1, +m[1]) : null;
  }

  function loadEvents() {
    var fb = window.FB, req;
    if (fb && fb.projectId) {
      var today = new Date(), iso = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
      req = fetch('https://firestore.googleapis.com/v1/projects/' + fb.projectId + '/databases/(default)/documents:runQuery?key=' + fb.apiKey, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ structuredQuery: {
          from: [{ collectionId: 'evenements' }],
          where: { fieldFilter: { field: { fieldPath: 'date' }, op: 'GREATER_THAN_OR_EQUAL', value: { stringValue: iso } } },
          orderBy: [{ field: { fieldPath: 'date' }, direction: 'ASCENDING' }]
        } })
      }).then(function (r) { return r.json(); }).then(function (rows) {
        return rows.filter(function (r) { return r.document; }).map(function (r) {
          var o = {}, f = r.document.fields || {};
          Object.keys(f).forEach(function (k) { o[k] = f[k].stringValue || ''; });
          return o;
        });
      });
    } else {
      req = fetch('evenements.json').then(function (r) { return r.json(); }).then(function (data) {
        return Array.isArray(data) ? data : (data.evenements || []);
      });
    }
    return req.then(function (list) {
      var t0 = new Date(); t0.setHours(0, 0, 0, 0);
      return list.map(function (e) { e.d = parseDate(e.date); return e; })
        .filter(function (e) { return e.d && e.d >= t0 && e.titre; })
        .sort(function (a, b) { return a.d - b.d; });
    }).catch(function () { return []; });
  }

  function fmt(e) {
    return e.d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  function detail(e) { return [e.heure, e.lieu].filter(Boolean).join(' – '); }

  function fill(a, e) {
    if (e.photo) {
      var p = el('img', 'ph');
      p.src = /^(https?:|data:|\/)/.test(e.photo) ? e.photo : 'images/evenements/' + e.photo;
      p.alt = e.titre; p.loading = 'lazy';
      a.append(p);
    }
    a.append(el('p', 'sd', fmt(e)), el('h3', '', e.titre), el('p', '', detail(e)), el('p', '', e.description));
  }

  var slides = document.getElementById('slides'), list = document.getElementById('list');
  if (slides || list) {
    loadEvents().then(function (events) {
      if (list) {
        document.getElementById('none').hidden = events.length > 0;
        events.forEach(function (e) {
          var a = el('article', 'ev');
          fill(a, e);
          list.append(a);
        });
      }
      if (!slides || !events.length) return;
      var dots = document.getElementById('dots'), timer;
      events.forEach(function (e) {
        var a = el('article', 'slide');
        fill(a, e);
        slides.append(a);
        dots.append(el('i'));
      });
      document.getElementById('events').hidden = false;
      var go = function (i) {
        var n = slides.children.length;
        slides.children[(i + n) % n].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      };
      var cur = function () { return Math.round(slides.scrollLeft / (slides.children[0].offsetWidth + 16)); };
      var mark = function () {
        Array.prototype.forEach.call(dots.children, function (d, k) { d.classList.toggle('on', k === cur()); });
      };
      slides.addEventListener('scroll', mark);
      mark();
      document.getElementById('prev').addEventListener('click', function () { go(cur() - 1); });
      document.getElementById('next').addEventListener('click', function () { go(cur() + 1); });
      var stop = function () { clearInterval(timer); };
      ['pointerdown', 'focusin'].forEach(function (t) { document.getElementById('events').addEventListener(t, stop); });
      if (events.length > 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        timer = setInterval(function () { go(cur() + 1); }, 6000);
      }
    });
  }
})();
