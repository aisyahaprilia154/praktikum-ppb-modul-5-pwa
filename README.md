# Praktikum PPB Modul 5 PWA II

Website: https://praktikum-ppb-modul-5-pwa.vercel.app

Repository: https://github.com/aisyahaprilia154/praktikum-ppb-modul-5-pwa

Project React + Vite berdasarkan langkah kerja modul dan tambahan tantangan poin 1–9. Kode awal: https://github.com/SekarBnY/PWA2_PrakPPB.

## Menjalankan

Buka `PWA-Modul-5.code-workspace` menggunakan Visual Studio Code.

```powershell
npm install
npm run dev
```

Jika `.env` belum ada, salin `.env.example` menjadi `.env`. URL Supabase dan publishable key mengikuti modul. Jangan gunakan service-role key di aplikasi browser. Environment Production sudah diatur pada project Vercel.

```powershell
npm run lint
npm run build
npm run preview
npm run verify:challenges
```

## Implementasi poin 1–9

| No. | Permintaan | Implementasi dan cara memeriksa |
| --- | --- | --- |
| 1 | Share link unik | Tombol share pada kartu dan detail. Buka tautan `/#/gun/ID` di tab baru atau reload; produk yang sama dimuat dari ID server. Copy link juga tersedia. |
| 2 | Lazy load | Halaman dimuat melalui React.lazy dan Suspense. Build menghasilkan chunk terpisah per halaman. Gambar katalog memakai loading=lazy dan decoding=async. |
| 3 | Query caching | TanStack Query membagi cache katalog/detail/favorit/ulasan, mendeduplikasi permintaan, dan menandai cache usang setelah perubahan. Cache segar selama 2 menit, disimpan lokal maksimal 24 jam untuk kunjungan ulang/offline. Tombol Refresh catalog memuat ulang secara eksplisit. |
| 4 | About dan Contact di profil | Kedua bagian berada di halaman Profile, tidak lagi menjadi menu utama terpisah. |
| 5 | Semua draft di profil | Profile menampilkan daftar draft create/edit, nama, waktu simpan, tombol Continue draft, dan hapus draft. Continue langsung memulihkan form dari draft yang dipilih. |
| 6 | Soft delete / arsip | Archive menggantikan hapus produk permanen. Produk disembunyikan dari katalog/favorit dan dapat dipulihkan dari Profile > Product archive. Record tetap berada di database. |
| 7 | CRUD dan reaksi ulasan | Tambah/baca ulasan, edit/hapus milik identitas browser sendiri, thumbs up/down dengan jumlah dan status pilihan. Reaksi yang sama membatalkan suara, reaksi lain mengganti suara. Data disimpan di server. |
| 8 | Edit profil di halaman baru | Tombol Edit profile membuka `/#/profile/edit` untuk nama, bio, dan avatar. Save kembali ke profil; formulir tidak berada di bawah profil. |
| 9 | Keranjang dan checkout WhatsApp | Menu Merch & Cart berisi T-shirt, notebook, dan stiker. Tambah/kurangi/hapus, jumlah, total, dan localStorage. Checkout membuka WhatsApp dengan pesan “Hi aku mau pesan …” berisi barang dan total. Keranjang khusus merchandise non-senjata untuk simulasi praktikum. |

Tanpa nomor tujuan yang dikonfigurasi, WhatsApp menampilkan pilihan penerima. Untuk mengarah ke nomor tertentu, tambahkan `VITE_WHATSAPP_NUMBER` dengan format internasional, misalnya `628...`, lalu build/deploy ulang. Aplikasi hanya menyiapkan pesan; pengguna memeriksa dan mengirimnya sendiri.

## Penyimpanan dan backend

Katalog, ulasan, dan favorit menggunakan backend Supabase modul. Database praktikum tidak menyediakan kolom deleted_at dan tabel reaksi. Metadata berversi disimpan dalam field teks yang sudah tersedia:

- `products.specs`: entri `__pwa_meta_v1__:` menyimpan archived_at, langkah form, grade, dan status featured. Normalizer menyembunyikannya dari daftar spesifikasi yang ditampilkan.
- `reviews.comment`: entri `__pwa_review_v1__:` menyimpan teks ulasan dan pilihan reaksi per identitas browser. Ulasan lama berbentuk teks biasa tetap terbaca. Perubahan reaksi menggunakan pembandingan nilai lama dan retry untuk mengurangi benturan pembaruan.

Dengan demikian fitur baru bekerja tanpa meminta akses administrator untuk migrasi database. Profil, draft, keranjang, dan cadangan query berada di browser. Identitas ulasan memakai UUID lokal sesuai pola modul; ini bukan sistem login terverifikasi untuk penggunaan produksi dengan data sensitif.

Bucket Storage `guns` belum tersedia pada backend modul. Upload tetap mendukung validasi gambar dan fallback data URL permanen. Gambar dan draft tidak bergantung pada URL blob sementara.

## PWA dan deploy

Manifest, ikon 192/512, service worker, cache app shell, dan prompt instalasi tetap aktif. Service worker memasukkan chunk halaman lazy dalam precache produksi. Setelah kunjungan online pertama, halaman dan aset lokal dapat dimuat offline; operasi tulis API membutuhkan jaringan.

GitHub terhubung ke Vercel dan push ke main memicu build produksi. Build command: `npm run build`; output: `dist`. File `.env`, `.vercel`, node_modules, dist, dan service worker pengembangan tidak dimasukkan ke Git.

Di HP, buka website HTTPS lalu pilih Install app atau Add to Home Screen. iPhone: Share > Add to Home Screen.

## Validasi

`npm run verify:challenges` menguji tautan, metadata produk, cache dan invalidasi, daftar draft, arsip/pemulihan, CRUD ulasan, kepemilikan identitas, pergantian reaksi, profil, dan pesan WhatsApp. Skrip membuat record sementara terpisah dan membersihkannya setelah pemeriksaan. Jangan menghentikan proses sebelum pembersihan selesai.

Pemeriksaan browser juga mencakup halaman edit profil, simpan/pulihkan draft dari Profile, tautan share, tambah/edit ulasan dan reaksi, arsip lalu restore, keranjang, serta tampilan mobile. Sampel data server untuk pengujian telah dibersihkan.
