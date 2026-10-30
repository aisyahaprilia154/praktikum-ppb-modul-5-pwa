# Praktikum PPB Modul 5 React PWA II

Project berdasarkan bagian Langkah Kerja modul, menggunakan kode dasar https://github.com/SekarBnY/PWA2_PrakPPB.

## Menjalankan project

Buka `PWA-Modul-5.code-workspace` di Visual Studio Code, lalu jalankan:

```powershell
npm install
npm run dev
```

Build dan preview produksi:

```powershell
npm run build
npm run preview
```

Node.js yang digunakan untuk pemeriksaan adalah v24.13.0. File `.env` lokal sudah diisi sesuai modul. Saat memindahkan project, salin `.env.example` menjadi `.env`, lalu restart server.

## Implementasi langkah kerja

- React dan Vite sebagai SPA; navigasi katalog, favorit, profil, About, Contact, tambah, edit, dan detail.
- Axios dengan konfigurasi environment dan penanganan error.
- Hooks produk, favorit, dan ulasan; services CRUD produk, ulasan, favorit, upload, dan profil.
- Katalog dengan pencarian, kategori, urutan harga/nama, serta tampilan loading dan error.
- Form tambah/edit dengan validasi, pilihan gambar preset/upload, spesifikasi, langkah perawatan, dan draft localStorage.
- Konfirmasi sebelum menghapus produk.
- Favorit server dengan cadangan localStorage; profil dan draft tersimpan lokal.
- Ikon PWA 192/512, manifest, service worker, cache app shell, indikator offline, dan prompt instalasi.
- Dependensi lucide-react, vite-plugin-pwa, Tailwind CSS, dan Axios.
- Konfigurasi Vercel tersedia di `vercel.json`.

## Pemeriksaan

```powershell
npm run lint
npm run verify:api
```

`verify:api` membuat satu produk sementara, menguji baca/tambah/ubah/hapus, ulasan, serta favorit, lalu membersihkan data uji. Pemeriksaan juga mencakup draft, identitas/profil lokal, validasi gambar, dan fallback unggah gambar. Jangan menghentikan pemeriksaan sebelum pembersihan selesai.

Backend modul saat diperiksa belum memiliki bucket Storage bernama `guns`. Sesuai fallback pada modul, file gambar dikonversi menjadi data URL dan dapat disimpan bersama produk. Ini berbeda dari URL blob sementara yang tidak bertahan setelah reload.

App shell dan aset lokal tersedia offline setelah kunjungan online pertama. Operasi CRUD/ulasan membutuhkan API. Saat offline, katalog statis lokal tetap tersedia; favorit dan draft menggunakan localStorage. Untuk uji manual, buka versi produksi sekali saat online, tunggu service worker aktif, aktifkan Offline di DevTools > Network, lalu reload.

Lint selesai tanpa error; tiga peringatan set-state-in-effect berasal dari hooks modul. Audit dependensi setelah pembaruan menyisakan empat temuan rendah pada rantai deepmerge/Workbox. Downgrade besar plugin PWA tidak diterapkan.

## GitHub dan Vercel

Repository project: https://github.com/aisyahaprilia154/praktikum-ppb-modul-5-pwa

Remote `origin` mengarah ke repository project sendiri, sedangkan `upstream` menunjuk kode dasar modul. File `.env`, `.vercel`, `node_modules`, `dist`, dan hasil service worker pengembangan tidak dimasukkan ke Git.

Environment Vercel Production menggunakan:

- `VITE_API_BASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Build command adalah `npm run build` dan output directory adalah `dist`. Perubahan selanjutnya dikirim dengan `git add .`, commit, lalu `git push origin main`.

## Instalasi pada smartphone

Buka URL HTTPS hasil deploy menggunakan browser smartphone. Di Android pilih Install app atau Add to Home Screen. Di iPhone pilih Share > Add to Home Screen. Konfirmasi instalasi dilakukan langsung pada perangkat yang akan digunakan.

## Hasil deploy dan verifikasi akhir

Website produksi: https://praktikum-ppb-modul-5-pwa.vercel.app

Repository sudah terhubung ke project Vercel. Environment Production terpasang dan build pertama berstatus Ready. Halaman, manifest, service worker, serta ikon dapat diakses dengan HTTP 200.

Pemeriksaan berhasil untuk CRUD produk, CRUD ulasan, favorit server, penyimpanan profil dan draft, validasi gambar, serta fallback data URL. Melalui website produksi, tambah produk dan perubahan harga berhasil tersimpan di Supabase; halaman favorit menampilkan produk yang ditandai. Semua data uji dibersihkan setelah pemeriksaan.

Draft juga diuji langsung melalui form: simpan, pindah halaman, lalu pulihkan. Tampilan mobile diperiksa pada viewport 390 x 844. Cache app shell diuji menggunakan build produksi lokal: setelah kunjungan awal, server preview dihentikan dan aplikasi tetap berhasil dimuat ulang dari service worker. Ini menguji ketersediaan app shell, bukan ketersediaan API ketika jaringan terputus.

Instalasi pada smartphone fisik perlu dilakukan dari perangkat yang digunakan melalui langkah Add to Home Screen di atas.
