/* =========================================================
   OSMA — data galeri event
   ---------------------------------------------------------
   Sumber: api/galeri.php di OSMA POS (hanya foto berstatus
   APPROVED). Bila API kosong / belum siap, dipakai data statis
   di bawah supaya halaman tidak pernah kosong.

   Bentuk objek: { venue, city, caption, image, wide? }
   ========================================================= */
window.OSMA_GALLERY_API = 'https://pos.osmanthustea.id/api/galeri.php';

window.OSMA_GALLERY = [
  {
    venue: 'Pasar-Pasaran',
    city: 'Jakarta',
    caption: 'Dua hari, 2.200+ cup terjual',
    image: 'assets/gallery/popup-crowd.jpg',
    wide: true
  },
  {
    venue: 'Bazaar Kota',
    city: 'Bandung',
    caption: 'Momen di depan booth',
    image: 'assets/gallery/pelanggan-cup.jpg'
  },
  {
    venue: 'Car Free Day',
    city: 'Surabaya',
    caption: 'Antrean di jam sibuk',
    image: 'assets/gallery/booth-bazaar.jpg'
  },
  {
    venue: 'Grand Opening',
    city: 'Semarang',
    caption: 'Sapaan hangat di setiap acara',
    image: 'assets/gallery/momen-booth.jpg'
  },
  {
    venue: 'Mall Kota',
    city: 'Yogyakarta',
    caption: 'Segar, satu cup demi satu cup',
    image: 'assets/gallery/antrean.jpg'
  }
];

/* ------------------------------------------------------------------ util */
window.osmaEsc = function (v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
};

window.osmaPinIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6.5-6 6.5-11a6.5 6.5 0 1 0-13 0C5.5 15 12 21 12 21Z"/><circle cx="12" cy="10" r="2.5"/></svg>';

/**
 * Ambil foto dari OSMA POS. Resolve ke array (bisa kosong) dan tidak
 * pernah reject — pemanggil cukup pakai fallback bila hasilnya kosong.
 */
window.loadGalleryData = function (limit) {
  var url = window.OSMA_GALLERY_API + '?limit=' + encodeURIComponent(limit || 48);
  if (!window.fetch || !window.AbortController) {
    return Promise.resolve([]);
  }
  var ctrl = new AbortController();
  var timer = setTimeout(function () { ctrl.abort(); }, 4500);

  return fetch(url, { signal: ctrl.signal, mode: 'cors', credentials: 'omit' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (res) { return (res && Array.isArray(res.data)) ? res.data : []; })
    .catch(function () { return []; })
    .then(function (data) { clearTimeout(timer); return data; });
};

/* ------------------------------------------------- beranda: galeri teaser */
(function () {
  'use strict';

  function renderGallery(items) {
    var grid = document.getElementById('gal-grid');
    if (!grid || !items.length) return;

    // Dari API belum tentu ada penanda "wide": pakai kartu pertama sebagai kartu lebar.
    if (!items.some(function (i) { return i.wide; })) {
      items = items.map(function (it, idx) {
        return idx === 0 ? Object.assign({}, it, { wide: true }) : it;
      });
    }

    var eager = /(\?|&)flat/.test(location.search);

    grid.innerHTML = items.map(function (ev) {
      var loc = [ev.venue, ev.city].filter(Boolean).join(', ');
      var alt = loc ? loc + ' — ' + ev.caption : ev.caption;
      return '' +
        '<figure class="gal-item' + (ev.wide ? ' gal-wide' : '') + '">' +
          '<img src="' + osmaEsc(ev.image) + '" alt="' + osmaEsc(alt) + '"' + (eager ? '' : ' loading="lazy"') + '>' +
          '<figcaption>' +
            '<span class="gal-loc">' + osmaPinIcon + '<span class="gal-loc__txt">' + osmaEsc(loc) + '</span></span>' +
            '<span class="gal-name">' + osmaEsc(ev.caption) + '</span>' +
          '</figcaption>' +
        '</figure>';
    }).join('');

    document.dispatchEvent(new CustomEvent('osma:gallery', { detail: { count: items.length } }));
  }

  window.renderGallery = renderGallery;

  if (!document.getElementById('gal-grid')) {
    return; // halaman ini tidak punya teaser galeri
  }

  renderGallery(window.OSMA_GALLERY || []);

  window.loadGalleryData(12).then(function (data) {
    if (data && data.length) {
      renderGallery(data);
    }
  });
})();
