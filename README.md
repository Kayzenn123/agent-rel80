# REL80 — Jadwal KRL Lintas Bogor ala Manual Teknis 80-an

Hari 20 · 30 Days of Code · 2026-10-29

Seluruh halaman adalah **satu jalur rel horizontal**: 22 stasiun KRL lintas
Bogor–Jakarta Kota digulir ke kanan seperti kereta berjalan — tanpa scroll
vertikal, tanpa hero marketing. Di ujung, kamera **zoom-out** memperlihatkan
seluruh peta lintas sekaligus.

## Fitur (semua berfungsi, bukan mockup)

- **Papan keberangkatan per stasiun** — 3 jam contoh + hitung mundur live ke
  keberangkatan berikutnya (deterministik per stasiun).
- **Bengkel perencana** — pilih asal–tujuan → estimasi berhenti, durasi, tarif
  (semua berlabel CONTOH), validasi ala Pak PPKA ("Sinyal merah…").
- **Favorit** tersimpan di `localStorage` (`rel80-v1`, berversi, tahan data rusak).
- **Deep-link**: `?dari=citayam&ke=bogor`, `?stasiun=depok`.
- **Tiket** bernomor acak + tilt 3D mengikuti pointer, cetak ulang via ketuk 2×.
- **Ekspor**: salin rencana (clipboard + fallback), unduh JSON/CSV, salin/unduh
  semua jadwal contoh.
- **Denah lintas** SVG interaktif — hover/ketuk titik stasiun mengubah warna
  dinas seluruh halaman (hijau/biru/merah); di HP diganti daftar tombol 48px.
- **Easter egg**: ketik `klakson`.

Semua jam/tarif/durasi = **CONTOH peraga**, dicap di UI. Nama stasiun = fakta publik.

## Teknik

- Tanpa framework, tanpa dependency JS (mesin scroll hand-rolled: sticky +
  satu rAF loop). Dulu pakai GSAP+ScrollTrigger → dibuang demi budget performa.
- 5 layer parallax, 2 marquee diagonal (skew by scroll-velocity + tombol jeda),
  variable-font wght denyut, nama stasiun outline→isi (clip-path wipe),
  rel digambar (stroke-dashoffset scrub), zoom-out 1→0,42 di terminus.
- Font self-host woff2: Noto Sans Old Permic, Lexend Giga variable, Raleway Dots.
- `prefers-reduced-motion` → rel jadi gulir horizontal native; toggle "Gerak"
  manual; mode ringan otomatis (CPU/RAM kecil, Save-Data).

## Skor

- Lighthouse mobile **99**/100/100/100 (LCP 1,7 dtk, CLS 0), desktop **93**/100/100/100.
- qa.js exit 0 (chromium, 4 viewport + reduced-motion); fps4x **59,6**.
- WebKit tidak bisa jalan di VM (libgstreamer hilang — keterbatasan environment).

## Menjalankan

```sh
cd site && python3 -m http.server 8000
# buka http://localhost:8000/
```

## Kredit

- Font: Noto Sans Old Permic, Lexend Giga, Raleway Dots (semua SIL OFL, via Fontsource).
- Ikon kereta di marquee: digambar sendiri (SVG inline). Tidak ada aset pihak ketiga lain.
