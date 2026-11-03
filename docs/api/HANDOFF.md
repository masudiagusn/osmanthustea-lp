> Salinan untuk repo OsmaLP. Sumber kanonik: `OsmaPOS/docs/api/HANDOFF.md`.

# Handoff Integrasi â€” Osma POS Â· CRM Â· LP

**Tanggal:** 3 November 2026
**Kontrak API:** v1
**Status:** kode portal sudah di-commit di POS & CRM; staging POS sudah memuat portal; staging CRM belum (404); produksi belum memakai portal.

---

## 1. Baca dulu (urut prioritas)

### Semua sesi
1. `docs/api/README.md` â€” arsitektur, auth HMAC, environment, error, idempotensi.
2. `docs/api/openapi.yaml` â€” kontrak machine-readable (OpenAPI 3.1).

### Sesi OsmaCRM (repo `E:\02-AI-dev\OsmaCRM\osmanthus-crm`)
1. `docs/api/README.md` â€” salinan panduan khusus CRM.
2. `docs/api/openapi.yaml` â€” salinan spec.
3. `lib/pos-portal.ts` â€” logika portal (GET snapshot + 4 aksi).
4. `app/api/pos/portal/route.ts` â€” endpoint portal.
5. `app/api/pos/sales/route.ts` â€” endpoint sales harian.
6. `lib/pos-url.ts` â€” redirect franchisee ke POS.
7. `prisma/schema.prisma` â€” field `Order.channel`, `Order.externalRef`,
   `StockAdjustment.externalRef`.
8. `README.md` bagian **Environment POS** dan **Sinkronisasi penjualan**.

### Sesi OsmaLP (repo `E:\02-AI-dev\OsmaLP`)
1. `docs/api/README.md` â€” panduan galeri + pendaftaran.
2. `index.html` â€” CTA kemitraan.
3. `js/gallery.js` â€” pemanggilan API galeri.
4. (referensi kanonik) `OsmaPOS/docs/api/consumers/LP.md`.

---

## 2. Status saat ini

| Item | Status |
|---|---|
| POS portal (`pasokan.php`, `includes/crm.php`) | committed `ae5357a`, sudah di `staging` |
| CRM portal (`app/api/pos/portal`, `lib/pos-portal.ts`) | committed `a180741`, sudah di `staging` |
| CRM Dockerfile migrasi nullable unique | committed `baa5820`, sudah di `staging` |
| POS staging | sudah memuat portal (`pasokan.php` â†’ 303 login) |
| CRM staging | **masih 404** untuk `/api/pos/portal`; deployment belum berhasil/pick-up |
| Produksi POS/CRM | **belum** memakai portal |
| LP CTA + docs | committed `a0af098`, **belum di-push/deploy** |

**Blocker:** MCP Helipod tidak tersedia di sesi ini, jadi log deployment CRM staging belum bisa dilihat. Perlu redeploy dari dashboard Helipod.

---

## 3. Tugas sesi CRM

1. **Redeploy staging CRM dari dashboard Helipod**, lalu cek log container:
   - cari `prisma db push`;
   - pastikan tidak ada error unique index;
   - pastikan `npm start` berjalan.
2. Verifikasi endpoint:
   - `GET https://osmacrm-staging.helipod.app/api/pos/portal` tanpa signature â†’ **401** (bukan 404).
   - `GET /app` â†’ redirect ke `https://osma-pos-staging.helipod.app`.
3. Pastikan environment:
   ```env
   POS_API_URL=https://osma-pos-staging.helipod.app
   POS_APP_URL=https://osma-pos-staging.helipod.app   # opsional; fallback POS_API_URL
   POS_API_KEY=<sama dengan OSMA_CRM_KEY POS staging>
   POS_WEBHOOK_SECRET=<sama>
   POS_PORTAL_SECRET=<opsional>
   POS_SALES_SECRET=<opsional>
   ```
4. Uji dari POS staging (login owner PT Osma Delta):
   - buka **Pasokan** â†’ data CRM tampil;
   - buat order bahan baku;
   - adjust stok dua kali dengan `external_ref` sama â†’ qty tidak berubah dua kali.
5. Setelah staging lolos, **deploy POS + CRM ke `main` bersamaan** (schema dan endpoint saling bergantung). Backup DB POS & CRM dulu.
6. Jangan mengubah kontrak tanpa menaikkan versi; jangan hapus `docs/api/`.

**Acceptance CRM staging:**
- `/api/pos/portal` GET/POST = 200 dengan signature valid.
- `/api/pos/sales` tetap 200 (sales sync tidak rusak).
- `/app` redirect ke POS staging.
- `pasokan.php` menampilkan katalog + order + tagihan tanpa error.

---

## 4. Tugas sesi LP

1. Review CTA di `index.html`:
   - target: `https://crm.osmanthustea.id/daftar?utm_source=landing&utm_medium=cta&utm_campaign=kemitraan`
   - `target="_blank" rel="noopener"`.
2. Pastikan galeri tetap memakai:
   `https://pos.osmanthustea.id/api/galeri.php?limit=...`
3. Tangani kegagalan galeri dengan empty state/placeholder (jangan error mentah).
4. Setelah review, push/deploy LP.
5. Jangan menambahkan form pendaftaran atau API key di LP.

**Acceptance LP:**
- Tombol â€œAjukan Kemitraanâ€ / â€œIsi Formulir Kemitraanâ€ membuka form CRM.
- Galeri tetap tampil; `count: 0` tidak error.
- Tidak ada console error/CORS.

---

## 5. Aturan kontrak (jangan dilanggar)

- CRM = sumber kebenaran master/supply/finance; POS = sumber kebenaran penjualan.
- LP hanya membaca galeri dan mengarahkan pendaftaran ke CRM.
- Semua server-to-server memakai HMAC + timestamp; jangan kirim secret di URL.
- Idempotensi: `external_ref` (order, stock), `(outlet_code, date)` (sales), `crm_ref` (provisioning).
- Perubahan breaking harus versi baru; perubahan aditif boleh tanpa versi.
- Jangan akses DB aplikasi lain secara langsung.

---

## 6. File kanonik vs salinan

| File | Lokasi kanonik | Salinan |
|---|---|---|
| `docs/api/README.md` | `OsmaPOS/docs/api/README.md` | `OsmaCRM/.../docs/api/README.md` |
| `docs/api/openapi.yaml` | `OsmaPOS/docs/api/openapi.yaml` | `OsmaCRM/.../docs/api/openapi.yaml` |
| Panduan CRM | `OsmaPOS/docs/api/consumers/CRM.md` | `OsmaCRM/.../docs/api/README.md` |
| Panduan LP | `OsmaPOS/docs/api/consumers/LP.md` | `OsmaLP/docs/api/README.md` |

Jika kontrak berubah, perbarui file kanonik lalu salin ulang ke repo konsumen.

