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

/* --------------------------------------------------------- cache 5 menit */
var GALLERY_TTL = 5 * 60 * 1000;

function galleryCacheKey(limit) {
  return 'osma:gallery:v1:' + limit;
}

function readGalleryCache(limit) {
  try {
    var raw = window.localStorage.getItem(galleryCacheKey(limit));
    if (!raw) return null;
    var saved = JSON.parse(raw);
    if (!saved || !Array.isArray(saved.data)) return null;
    return { data: saved.data, ts: Number(saved.ts) || 0 };
  } catch (err) {
    return null;
  }
}

function writeGalleryCache(limit, data) {
  try {
    window.localStorage.setItem(galleryCacheKey(limit), JSON.stringify({
      ts: Date.now(),
      data: data
    }));
  } catch (err) {
    /* localStorage penuh/diblokir: abaikan, galeri tetap tampil */
  }
}

/* ------------------------------------------------- fallback gambar rusak */
window.osmaBrokenImage = function (img) {
  if (!img || img.getAttribute('data-broken') === '1') return;
  img.setAttribute('data-broken', '1');
  img.style.display = 'none';
  var fig = img.closest ? img.closest('figure') : null;
  if (fig) fig.classList.add('is-broken');
};

/** Pantau gambar di dalam container; ganti dengan placeholder bila gagal. */
window.osmaWatchImages = function (container) {
  if (!container) return;
  container.addEventListener('error', function (e) {
    if (e.target && e.target.tagName === 'IMG') window.osmaBrokenImage(e.target);
  }, true);
};

/**
 * Ambil foto dari OSMA POS. Resolve ke array (bisa kosong) dan tidak
 * pernah reject — pemanggil cukup pakai fallback bila hasilnya kosong.
 * Respons disimpan 5 menit di localStorage; bila jaringan gagal, cache
 * terakhir dipakai supaya galeri tidak kosong.
 */
window.loadGalleryData = function (limit) {
  var lim = limit || 48;
  var cached = readGalleryCache(lim);

  if (cached && Date.now() - cached.ts < GALLERY_TTL) {
    return Promise.resolve(cached.data);
  }

  var url = window.OSMA_GALLERY_API + '?limit=' + encodeURIComponent(lim);
  if (!window.fetch || !window.AbortController) {
    return Promise.resolve(cached ? cached.data : []);
  }

  var ctrl = new AbortController();
  var timer = setTimeout(function () { ctrl.abort(); }, 4500);

  return fetch(url, { signal: ctrl.signal, mode: 'cors', credentials: 'omit' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (res) {
      // Respons sukses tapi kosong tetap disimpan: foto yang sudah tidak
      // tayang tidak boleh muncul lagi dari cache lama.
      if (!res || !Array.isArray(res.data)) {
        return cached ? cached.data : [];
      }
      writeGalleryCache(lim, res.data);
      return res.data;
    })
    .catch(function () {
      return cached ? cached.data : [];
    })
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

  var grid = document.getElementById('gal-grid');
  if (!grid) {
    return; // halaman ini tidak punya teaser galeri
  }

  window.osmaWatchImages(grid);
  renderGallery(window.OSMA_GALLERY || []);

  window.loadGalleryData(12).then(function (data) {
    if (data && data.length) {
      renderGallery(data);
    }
  });
})();
