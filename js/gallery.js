/* =========================================================
   OSMA — data galeri event
   ---------------------------------------------------------
   Bentuk tiap baris sengaja dibuat sama dengan respons
   `api/galeri.php` di OSMA POS, supaya nanti tinggal diganti:

     fetch('https://pos.osmanthustea.id/api/galeri.php')
       .then(r => r.json())
       .then(res => renderGallery(res.data));

   Saat ini masih data statis (foto dokumentasi lama).
   venue & kota di bawah adalah contoh — akan terisi otomatis
   dari foto yang dikirim franchisee lewat menu "Kirim Foto".
   ========================================================= */
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

(function () {
  'use strict';

  var PIN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6.5-6 6.5-11a6.5 6.5 0 1 0-13 0C5.5 15 12 21 12 21Z"/><circle cx="12" cy="10" r="2.5"/></svg>';

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function renderGallery(items) {
    var grid = document.getElementById('gal-grid');
    if (!grid) return;

    // Saat dirender untuk tangkapan layar (?flat), muat semua gambar langsung.
    var eager = /(\?|&)flat/.test(location.search);

    grid.innerHTML = items.map(function (ev) {
      var loc = [ev.venue, ev.city].filter(Boolean).join(', ');
      var alt = loc ? loc + ' — ' + ev.caption : ev.caption;
      return '' +
        '<figure class="gal-item' + (ev.wide ? ' gal-wide' : '') + '">' +
          '<img src="' + esc(ev.image) + '" alt="' + esc(alt) + '"' + (eager ? '' : ' loading="lazy"') + '>' +
          '<figcaption>' +
            '<span class="gal-loc">' + PIN + esc(loc) + '</span>' +
            '<span class="gal-name">' + esc(ev.caption) + '</span>' +
          '</figcaption>' +
        '</figure>';
    }).join('');

    // Beri tahu animasi skrip utama bahwa kartu baru sudah siap.
    document.dispatchEvent(new CustomEvent('osma:gallery', { detail: { count: items.length } }));
  }

  window.renderGallery = renderGallery;
  renderGallery(window.OSMA_GALLERY || []);
})();
