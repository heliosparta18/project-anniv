# Panduan Kustomisasi Website Anniversary (5-Minute Quickstart Guide)

Selamat datang di template website anniversary! Website ini dirancang dengan estetika lembut, hangat, dan feminin (*soft, warm & feminine*), dengan seluruh data terpusat di satu file sehingga kamu bisa mengubah nama pasangan, tanggal jadian, foto kenangan, surat cinta, dan lagu latar hanya dalam waktu kurang dari 5 menit.

---

## ⚡ Langkah Cepat (Summary 5 Menit)

1. Buka file `src/data/anniversaryData.ts`.
2. Ubah `partnerName`, `myName`, dan `anniversaryDate`.
3. Masukkan foto-foto kamu ke folder `public/photos/`.
4. (Opsional) Masukkan file lagu `.mp3` ke folder `public/audio/`.
5. Jalankan `npm run dev` di terminal untuk melihat hasilnya seketika!

---

## 1. Mengubah Profil Pasangan & Tanggal Jadian

Buka file **`src/data/anniversaryData.ts`**, temukan bagian `coupleProfile`:

```typescript
export const coupleProfile: CoupleProfile = {
  partnerName: 'Dinda',             // Nama panggilan pasanganmu
  myName: 'Daffa',                  // Nama panggilan kamu
  anniversaryDate: '2025-05-04T00:00:00', // Format ISO: YYYY-MM-DDTHH:mm:ss
  tagline: '365 Days of Loving You',     // Judul utama di Hero section
  subtagline: 'Still my favorite person to do absolutely nothing with. Happy 1st anniversary, sayang.',
};
```

> 💡 **Tips Tanggal:**  
> Live Anniversary Counter akan otomatis menghitung durasi waktu (Tahun, Bulan, Hari, Jam, Menit, Detik) secara *real-time* mulai dari tanggal yang kamu masukkan di `anniversaryDate`.

---

## 2. Mengganti & Menambahkan Foto Kenangan

Semua media statis disimpan di dalam folder **`public/photos/`**.

### Daftar File Foto Default:
| Bagian Website | Lokasi File Default | Format Rekomendasi | Aspek Rasio Ideal |
| :--- | :--- | :--- | :--- |
| **Milestone 1** (Pertama Ketemu) | `public/photos/milestone-1.jpg` | JPG / PNG / WebP | 3:2 atau 16:9 (600x400 px) |
| **Milestone 2** (Midnight Talks) | `public/photos/milestone-2.jpg` | JPG / PNG / WebP | 3:2 atau 16:9 (600x400 px) |
| **Milestone 3** (Resmi Jadian) | `public/photos/milestone-3.jpg` | JPG / PNG / WebP | 3:2 atau 16:9 (600x400 px) |
| **Milestone 4** (Kehujanan) | `public/photos/milestone-4.jpg` | JPG / PNG / WebP | 3:2 atau 16:9 (600x400 px) |
| **Milestone 5** (Anniversary) | `public/photos/milestone-5.jpg` | JPG / PNG / WebP | 3:2 atau 16:9 (600x400 px) |
| **Polaroid 1 s/d 6** (Scrapbook) | `public/photos/polaroid-1.jpg` s/d `polaroid-6.jpg` | JPG / PNG / WebP | 1:1 atau 4:5 (600x600 px) |

### Cara Mengganti Foto:
1. Siapkan foto kamu dengan ukuran file ideal (di bawah 1MB per foto agar website memuat super cepat).
2. Simpan foto ke folder `public/photos/` dengan nama yang sama (misal `polaroid-1.jpg`, `polaroid-2.jpg`, dst).
3. Jika kamu ingin menggunakan nama file berbeda atau URL eksternal (misal dari Cloudinary atau Imgur), kamu cukup ubah nilai `url` / `image` di `src/data/anniversaryData.ts`:
   ```typescript
   {
     id: 'polaroid-1',
     url: '/photos/foto-liburan-bali.jpg', // atau URL https://...
     ...
   }
   ```

### 🛡️ Fitur Proteksi Fallback (Zero Broken Images):
Jika kamu belum sempat memasukkan foto asli, jangan khawatir! Sistem dilengkapi **Aesthetic SVG Gradient Fallback Generator**. Website tidak akan pernah menampilkan ikon gambar rusak (*broken image icon*), melainkan akan menampilkan grafis siluet bernuansa pastel cream & blush rose yang cantik secara otomatis.

---

## 3. Mengatur Musik Latar (Aesthetic Vinyl Player)

Website ini dilengkapi pemutar musik analog berupa piringan hitam (*vinyl turntable*) yang bisa berputar saat lagu dimainkan.

### Cara Menambahkan Lagu:
1. Siapkan file musik berekstensi `.mp3` (misal lagu favorit kalian berdua).
2. Masukkan file tersebut ke dalam folder: **`public/audio/`**  
   *(Contoh: `public/audio/our-song.mp3`)*
3. Daftarkan di bagian `musicTracks` pada `src/data/anniversaryData.ts`:
   ```typescript
   export const musicTracks: MusicTrack[] = [
     {
       id: 'track-1',
       title: 'Until I Found You',
       artist: 'Stephen Sanchez',
       src: '/audio/our-song.mp3', // Path ke file lagu kamu
       notes: 'Lagu yang pertama kali bikin aku sadar kalau kehadiran kamu di hidup aku itu beneran seindah itu.'
     },
     // Kamu bisa menambahkan lagu lainnya di sini
   ];
   ```

### 🎹 Web Audio Synthesizer Fallback:
Jika kamu tidak menambahkan file MP3, pemutar musik tidak akan error. Sistem secara cerdas akan mengaktifkan **Web Audio Harmonic Synthesizer** yang memainkan progresi akor instrumental piano/chime akustik (`Cmaj7` → `Am7` → `Fmaj7` → `G7`) secara prosedural.

---

## 4. Menyesuaikan Surat Cinta, Alasan Sayang, & Voucher

Semua teks romantis dalam website ini menggunakan gaya bahasa Gen-Z kontemporer yang manis, tulus, dan tidak klise (*ga alay*). Kamu bebas mengeditnya sesuai kisah cinta kalian berdua di `src/data/anniversaryData.ts`:

### A. Surat Cinta (Love Letter / Wax-Sealed Envelope)
Edit bagian `loveLetter`:
- `salutation`: Kalimat sapaan pembuka (contoh: *"To My Favorite Human in the Entire World,"*).
- `paragraphs`: Paragraf isi surat (dalam bentuk array teks, kamu bisa tambah atau kurangi paragraf).
- `closing`: Kalimat penutup cinta.
- `signature`: Tanda tangan namamu.
- `sealText`: Inisial stempel lilin pada amplop (contoh: *"D & D"*).

### B. 12 Alasan Kenapa Aku Sayang Kamu (`loveReasons`)
Setiap kartu memiliki teks alasan, kategori (`quirks`, `habits`, `memories`, `feelings`), dan ikon Lucide (`Smile`, `Sparkles`, `Heart`, `Coffee`, dll).

### C. 8 Voucher Hubungan (`coupons`)
Voucher lucu yang bisa diklaim oleh pasanganmu (seperti *"Bebas Pilih Tempat Makan"*, *"Late Night Boba Run"*, *"Pijat Punggung 20 Menit"*). Saat pasangan menekan tombol "Klaim", stempel digital merah "REDEEMED" akan muncul dan tersimpan di memori browser (*localStorage*).

### D. Bucket List Impian Bersama (`bucketListItems`)
Daftar impian kecil dan petualangan yang ingin diwujudkan bersama. Centang item yang sudah terwujud atau tambahkan impian baru beserta target tahunnya.

---

## 5. Menjalankan Website & Verifikasi

Buka terminal di folder project (`D:\anniv`) dan jalankan:

```bash
# Menjalankan server lokal pengembangan
npm run dev
```

Buka URL yang muncul di browser (biasanya `http://localhost:5173/`).

Untuk membuat versi siap rilis/hosting (misal di Vercel atau Netlify):
```bash
# Build file produksi
npm run build
```

Hasil build akan berada di folder `dist/` dan siap di-deploy secara gratis ke Vercel, Netlify, atau GitHub Pages!
