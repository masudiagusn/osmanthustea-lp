> Salinan untuk repo OsmaLP. Sumber kanonik: `OsmaPOS/docs/api/HANDOFF.md`.

# Handoff Integrasi â€” Osma POS Â· CRM Â· LP

**Tanggal:** 3 November 2026
**Kontrak API:** v1
**Status:** **portal aktif di staging dan produksi.** CRM, POS, dan LP sudah terhubung.

---

## 1. Hasil verifikasi (3 Nov 2026)

| Item | Hasil |
|---|---|
| CRM staging `/api/pos/portal` | **401** (route hidup, menolak tanpa signature) |
| CRM produksi `/api/pos/portal` | **401** |
| CRM staging `/app` | **307** â†’ `https://osma-pos-staging.helipod.app` |
| CRM produksi `/app` | **307** â†’ `https://pos.osmanthustea.id` |
| POS staging `pasokan.php` | login â†’ data CRM tampil; order uji **OS-2611-911** berhasil |
| POS produksi `pasokan.php` | data CRM tampil untuk **CFD Sidoarjo** dan **Play Gency** |
| CRM produksi `/api/pos/sales` | **200** (health endpoint) |
| LP produksi | CTA ke `https://crm.osmanthustea.id/daftar?...`; galeri **200** |
| CRM `/daftar` staging & produksi | **200** |

Commit terakhir:
- POS: `71f10df` (link tenant via env) + `ae5357a` (portal)
- CRM: `3472fd2` (portal + idempotensi + WIB)
- LP: `e535f32` (gallery cache/placeholder)

---

## 2. Baca dulu

### Semua sesi
1. `docs/api/README.md` â€” arsitektur, auth HMAC, environment, error, idempotensi.
2. `docs/api/openapi.yaml` â€” kontrak OpenAPI 3.1.

### OsmaCRM
- `docs/api/README.md` + `docs/api/openapi.yaml` (salinan)
- `lib/pos-portal.ts`, `app/api/pos/portal/route.ts`
- `app/api/pos/sales/route.ts`
- `lib/pos-url.ts`
- `prisma/schema.prisma` (`Order.channel`, `Order.externalRef`,
  `StockAdjustment.externalRef`)

### OsmaLP
- `docs/api/README.md`
- `index.html` (CTA kemitraan)
- `js/gallery.js`

---

## 3. Catatan penting

1. **Tenant #1 produksi** berisi dua cabang milik franchisee berbeda:
   - `CFD-SDA` â†’ PT Osma Delta
   - `PGGCY` â†’ PT Osma Padel Nusantara

   Portal produksi saat ini bisa menampilkan keduanya. Untuk jangka panjang,
   putuskan apakah tenant #1 dipertahankan sebagai legacy atau data per cabang
   dipisahkan ke tenant franchisee masing-masing.

2. **Sales sync** memakai `crm_ref` tenant. Jika tenant #1 dipakai untuk dua
   franchisee, penjualan dari cabang yang tidak cocok dengan `crm_ref` bisa
   ditolak CRM (retry/FAILED). Cek `tools/sync-status.php` sebelum mengaktifkan
   penjualan di cabang kedua.

3. **LP** hanya membaca galeri dan mengarahkan pendaftaran ke CRM. Tidak ada
   form atau secret di LP.

4. **CRM** adalah sumber kebenaran master/supply/finance; POS sumber kebenaran
   penjualan. LP tidak menyimpan data operasional.

---

## 4. Checklist jika deploy ulang

### CRM
- [ ] `POS_API_URL` = URL POS environment tersebut.
- [ ] `POS_APP_URL` opsional; fallback `POS_API_URL`.
- [ ] `POS_API_KEY` / `POS_WEBHOOK_SECRET` sama dengan `OSMA_CRM_KEY` POS.
- [ ] `POS_PORTAL_SECRET` / `POS_SALES_SECRET` opsional bila memisahkan kunci.
- [ ] `prisma db push` berhasil (Dockerfile sudah `--accept-data-loss` untuk
      kolom nullable baru).
- [ ] `/api/pos/portal` = 401 tanpa signature; `/app` redirect ke POS.
- [ ] `/api/pos/sales` = 200.

### POS
- [ ] `OSMA_CRM_URL` = URL CRM.
- [ ] `OSMA_CRM_KEY` = kunci yang sama dengan CRM.
- [ ] `OSMA_SYNC_ENABLED=1`, `OSMA_SYNC_INTERVAL=60`.
- [ ] `OSMA_DEMO_MODE=0` di produksi.
- [ ] `OSMA_LINK_TENANT_ID` + `OSMA_LINK_CRM_REF` hanya untuk linking legacy
      (idempotent; tidak menimpa `crm_ref` yang sudah ada).
- [ ] `pasokan.php` menampilkan data; `tools/sync-status.php` FAILED = 0.

### LP
- [ ] CTA ke `https://crm.osmanthustea.id/daftar?utm_source=landing...`.
- [ ] Galeri memakai `https://pos.osmanthustea.id/api/galeri.php`.
- [ ] Fallback/placeholder saat API galeri gagal.

---

## 5. Aturan kontrak

- HMAC + timestamp untuk semua server-to-server; toleransi 300 detik.
- Idempotensi: `external_ref` (order/stok), `(outlet_code, date)` (sales),
  `crm_ref` (provisioning).
- Jangan akses DB aplikasi lain; jangan menaruh secret di URL.
- Perubahan breaking harus versi baru; perubahan aditif boleh tanpa versi.
- File kanonik: `OsmaPOS/docs/api/README.md` + `openapi.yaml`; salinan di
  `OsmaCRM/.../docs/api/` dan `OsmaLP/docs/api/`.

