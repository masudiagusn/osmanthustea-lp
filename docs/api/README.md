> Salinan untuk repo OsmaLP. Sumber kanonik: `OsmaPOS/docs/api/consumers/LP.md`. Sinkron 3 Nov 2026.

# Panduan Integrasi untuk Osma LP

LP adalah situs statis publik. LP **tidak menyimpan data operasional** dan
**tidak memegang secret**. Interaksinya hanya dua:

1. **Membaca galeri** dari POS.
2. **Mengarahkan pendaftaran** ke CRM.

## 1. Galeri event

Endpoint:

```
GET https://pos.osmanthustea.id/api/galeri.php?limit=12
```

- Publik, tanpa API key.
- Hanya foto berstatus `APPROVED`.
- `Access-Control-Allow-Origin: *`
- `Cache-Control: public, max-age=300`
- `limit`: 1â€“48, default 12.

Respons:

```json
{
  "ok": true,
  "count": 2,
  "data": [
    {
      "venue": "Alun-alun",
      "city": "Solo",
      "caption": "Dua hari, 2.200+ cup terjual",
      "image": "https://pos.osmanthustea.id/assets/uploads/event/3/ev-20261020-120000-a1b2c3.webp",
      "date": "2026-10-20",
      "branch": "CFD Sidoarjo"
    }
  ]
}
```

### Contoh pemakaian (vanilla JS)

```js
const res = await fetch("https://pos.osmanthustea.id/api/galeri.php?limit=12", {
  mode: "cors",
  credentials: "omit"
});
const json = await res.json();
if (json.ok) {
  renderGallery(json.data);
}
```

### Aturan tampilan

- Jangan menampilkan foto yang tidak ada di respons.
- Tangani `count: 0` dengan empty state.
- Jika fetch gagal/timeout, tampilkan galeri cache/empty state â€” **jangan**
  menampilkan error mentah ke pengunjung.
- Gambar berasal dari domain POS. Jika POS down, gambar bisa gagal dimuat;
  sediakan fallback/placeholder.
- Untuk performa, cache respons di CDN atau `localStorage` singkat (5 menit).

## 2. Pendaftaran kemitraan

LP tidak mengirim data pendaftaran sendiri. CTA harus membuka form CRM:

```
https://crm.osmanthustea.id/daftar?utm_source=landing&utm_medium=cta&utm_campaign=kemitraan
```

Aturan:

- Gunakan `target="_blank" rel="noopener"`.
- Jangan membuat form kedua di LP; CRM adalah pemilik data aplikasi.
- Jangan menaruh email/telepon pendaftar di query string.
- UTM boleh ditambahkan untuk atribusi.

## 3. Yang tidak boleh dilakukan LP

- Memanggil endpoint internal CRM/POS selain galeri publik.
- Menyimpan API key.
- Membaca database POS/CRM.
- Menampilkan data franchisee, invoice, stok, atau penjualan.

## 4. Environment

| Halaman | API galeri |
|---|---|
| Produksi | `https://pos.osmanthustea.id/api/galeri.php` |
| Staging | `https://osma-pos-staging.helipod.app/api/galeri.php` |

Jika domain POS berubah, cukup ubah `window.OSMA_GALLERY_API` di
`js/gallery.js`.

