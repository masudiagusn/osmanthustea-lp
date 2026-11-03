/* =========================================================
   OSMA — halaman galeri lengkap
   Pagination 20 foto per halaman + lightbox.
   ========================================================= */
(function () {
  'use strict';

  var PER_PAGE = 20;

  var grid    = document.getElementById('fg-grid');
  var pager   = document.getElementById('fg-pager');
  var range   = document.getElementById('fg-range');
  var countEl = document.getElementById('fg-count');
  var emptyEl = document.getElementById('fg-empty');
  if (!grid) return;

  if (window.osmaWatchImages) {
    window.osmaWatchImages(grid);
  }

  var items = [];
  var page = 1;
  var pageItems = [];

  var esc = window.osmaEsc || function (v) { return String(v == null ? '' : v); };
  var PIN = window.osmaPinIcon || '';

  /* ------------------------------------------------------------ render */
  function card(ev, index) {
    var loc = [ev.venue, ev.city].filter(Boolean).join(', ');
    var alt = loc ? loc + ' — ' + ev.caption : ev.caption;
    return '' +
      '<figure class="fg-card" data-i="' + index + '" tabindex="0" role="button" aria-label="Perbesar foto ' + esc(loc) + '">' +
        '<img src="' + esc(ev.image) + '" alt="' + esc(alt) + '" loading="lazy" decoding="async">' +
        '<figcaption class="fg-card__cap">' +
          '<span class="gal-loc">' + PIN + '<span class="gal-loc__txt">' + esc(loc) + '</span></span>' +
          '<span class="fg-card__name">' + esc(ev.caption) + '</span>' +
        '</figcaption>' +
        '<span class="fg-card__zoom" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M16 16l4.5 4.5M11 8.5v5M8.5 11h5"/></svg></span>' +
      '</figure>';
  }

  function totalPages() {
    return Math.max(1, Math.ceil(items.length / PER_PAGE));
  }

  function render() {
    var start = (page - 1) * PER_PAGE;
    pageItems = items.slice(start, start + PER_PAGE);

    grid.innerHTML = pageItems.map(function (ev, i) {
      return card(ev, start + i);
    }).join('');

    renderPager();

    if (range) {
      var from = items.length ? start + 1 : 0;
      var to = start + pageItems.length;
      range.textContent = 'Menampilkan ' + from + '–' + to + ' dari ' + items.length + ' foto';
    }

    // naikkan pelan ke awal grid saat pindah halaman
    if (window.scrollY > grid.offsetTop) {
      window.scrollTo({ top: grid.offsetTop - 100, behavior: 'smooth' });
    }
  }

  function pageWindow(total) {
    if (total <= 7) {
      var all = [];
      for (var i = 1; i <= total; i++) all.push(i);
      return all;
    }
    var set = [1];
    var from = Math.max(2, page - 1);
    var to = Math.min(total - 1, page + 1);
    if (from > 2) set.push('…');
    for (var p = from; p <= to; p++) set.push(p);
    if (to < total - 1) set.push('…');
    set.push(total);
    return set;
  }

  function renderPager() {
    if (!pager) return;
    var total = totalPages();

    var html = '<button class="pager__btn' + (page === 1 ? ' is-disabled' : '') + '" type="button" data-page="' + (page - 1) + '"' + (page === 1 ? ' disabled' : '') + '>Sebelumnya</button>';
    html += '<div class="pager__pages">';
    pageWindow(total).forEach(function (p) {
      if (p === '…') {
        html += '<span class="pager__gap">…</span>';
      } else {
        html += '<button class="pager__num' + (p === page ? ' is-active' : '') + '" type="button" data-page="' + p + '"' +
          (p === page ? ' aria-current="page"' : '') + '>' + p + '</button>';
      }
    });
    html += '</div>';
    html += '<button class="pager__btn' + (page === total ? ' is-disabled' : '') + '" type="button" data-page="' + (page + 1) + '"' + (page === total ? ' disabled' : '') + '>Berikutnya</button>';

    pager.innerHTML = html;
  }

  function goto(n) {
    var total = totalPages();
    if (n < 1 || n > total || n === page) return;
    page = n;
    render();
  }

  /* ---------------------------------------------------------- lightbox */
  var lb       = document.getElementById('lb');
  var lbImg    = document.getElementById('lb-img');
  var lbLoc    = document.getElementById('lb-loc');
  var lbName   = document.getElementById('lb-name');
  var lbCount  = document.getElementById('lb-counter');
  var lastFocus = null;
  var current = 0;

  if (window.osmaWatchImages) {
    window.osmaWatchImages(lb);
  }

  function openLB(indexInPage) {
    current = indexInPage;
    paintLB();
    lastFocus = document.activeElement;
    lb.hidden = false;
    document.body.classList.add('lb-open');
    document.getElementById('lb-close').focus();
  }

  function paintLB() {
    var ev = pageItems[current];
    if (!ev) return;
    var loc = [ev.venue, ev.city].filter(Boolean).join(', ');
    lbImg.src = ev.image;
    lbImg.alt = loc ? loc + ' — ' + ev.caption : ev.caption;
    lbLoc.textContent = loc;
    lbLoc.hidden = !loc;
    lbName.textContent = ev.caption || '';
    if (lbCount) lbCount.textContent = (current + 1) + ' / ' + pageItems.length;

    var multiple = pageItems.length > 1;
    document.getElementById('lb-prev').hidden = !multiple;
    document.getElementById('lb-next').hidden = !multiple;
  }

  function step(dir) {
    if (pageItems.length < 2) return;
    current = (current + dir + pageItems.length) % pageItems.length;
    paintLB();
  }

  function closeLB() {
    lb.hidden = true;
    document.body.classList.remove('lb-open');
    lbImg.src = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ------------------------------------------------------------ events */
  grid.addEventListener('click', function (e) {
    var el = e.target.closest('.fg-card');
    if (!el) return;
    openLB(parseInt(el.getAttribute('data-i'), 10) - (page - 1) * PER_PAGE);
  });

  grid.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var el = e.target.closest('.fg-card');
    if (!el) return;
    e.preventDefault();
    openLB(parseInt(el.getAttribute('data-i'), 10) - (page - 1) * PER_PAGE);
  });

  if (pager) {
    pager.addEventListener('click', function (e) {
      var b = e.target.closest('[data-page]');
      if (!b) return;
      goto(parseInt(b.getAttribute('data-page'), 10));
    });
  }

  document.getElementById('lb-close').addEventListener('click', closeLB);
  document.querySelector('[data-lb-close]').addEventListener('click', closeLB);
  document.getElementById('lb-prev').addEventListener('click', function () { step(-1); });
  document.getElementById('lb-next').addEventListener('click', function () { step(1); });

  lb.addEventListener('click', function (e) {
    // klik di area gelap di luar gambar juga menutup
    if (e.target === lb) closeLB();
  });

  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLB();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });

  /* -------------------------------------------------------------- init */
  function boot(list) {
    items = (list || []).filter(function (ev) { return ev && ev.image; });
    if (countEl) {
      countEl.textContent = items.length + ' foto · diperbarui otomatis dari OSMA POS';
    }
    if (!items.length) {
      emptyEl.hidden = false;
      grid.hidden = true;
      if (pager) pager.hidden = true;
      if (range) range.textContent = '';
      return;
    }
    emptyEl.hidden = true;
    grid.hidden = false;
    render();
  }

  // Tampilkan data statis lebih dulu (instan), lalu ganti bila POS punya foto tayang.
  boot(window.OSMA_GALLERY || []);

  if (window.loadGalleryData) {
    window.loadGalleryData(48).then(function (data) {
      if (data && data.length) {
        page = 1;
        boot(data);
      }
    });
  }
})();
