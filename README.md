# Mancingku - Platform Booking Spot Pemancingan & Rental Alat Pancing 🎣

**Mancingku** adalah platform digital berbasis web yang dirancang untuk mempermudah para pemancing melakukan reservasi (*booking*) spot pemancingan, menyewa alat pancing, serta berbagi ulasan mengenai spot pemancingan favorit. Platform ini juga menyediakan fitur blog seputar tips, trik, dan informasi dunia pemancingan.

---

## Fitur Utama

- **Otentikasi & Keamanan Pengguna**: Registrasi & Login dengan pengamanan JWT (*JSON Web Tokens*) serta enkripsi password menggunakan `bcrypt`.
- **Manajemen & Reservasi Spot**:
  * Pencarian spot pemancingan populer.
  * Informasi detail spot meliputi kapasitas, fasilitas, lokasi, dan jam operasional.
  * Pemilihan sesi pemancingan (pagi/siang/sore) secara real-time dengan penghitungan kursi yang tersisa (*seats left*).
- **Rental Peralatan Pancing (Gear Rental)**:
  * Pilihan alat pancing yang tersedia di masing-masing spot.
  * Penghitungan otomatis stok alat pancing saat pemesanan dibuat.
- **Rekomendasi Umpan & Alat**: Informasi umpan pancing (*baits*) yang cocok untuk berbagai jenis ikan beserta tautan pembelian.
- **Sistem Ulasan (Reviews)**: Ulasan dan penilaian (*rating*) bintang 1–5 dari pengguna terverifikasi untuk meningkatkan transparansi kualitas spot.
- **Blog Komunitas**: Artikel informatif seputar dunia pemancingan.
- **Manajemen Riwayat Pesanan**: Akses riwayat pemesanan yang aktif maupun yang sudah lampau.

---

## Tech Stack (Backend)

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL (menggunakan `mysql2/promise` dengan pooling koneksi)
- **Security & Utilities**:
  * `jsonwebtoken` (Otentikasi berbasis token)
  * `bcrypt` (Enkripsi password aman)
  * `helmet` (Pengamanan HTTP headers)
  * `cors` (Pengaturan Cross-Origin Resource Sharing)
  * `express-rate-limit` (Proteksi dari serangan DoS / Brute-Force)
  * `dotenv` (Manajemen konfigurasi environment variables)

---

## Struktur Proyek (Backend)

```text
server/
├── assets/                     # Berkas statis (gambar spot, gears, baits)
├── src/
│   ├── config/
│   │   └── db.js               # Konfigurasi koneksi database MySQL
│   ├── controllers/            # Logika pemrosesan API (controllers)
│   ├── middleware/             # Verifikasi token JWT & otorisasi Admin
│   ├── models/                 # Query database (prepared statements)
│   └── routes/                 # Definisi rute/endpoint API
├── .env.example                # Templat variabel lingkungan
├── index.js                    # Titik masuk utama aplikasi (Entrypoint)
├── package.json
└── README.md
```

---

##  Cara Memulai (Local Setup)

### Prasyarat
- Node.js (versi 16 atau lebih baru)
- MySQL / MariaDB

### Langkah Instalasi

1. **Clone Repositori**:
   ```bash
   git clone https://github.com/username/Mancingku.git
   cd Mancingku/server
   ```

2. **Instal Dependensi**:
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables**:
   Salin file `.env` dan sesuaikan dengan database lokal Anda:
   ```bash
   cp .env.example .env
   ```
   *Sesuaikan parameter berikut:*
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=mancingku_dev
   JWT_SECRET=rahasia_jwt_anda
   NODE_ENV=development
   ```

4. **Jalankan Server**:
   Untuk mode pengembangan (dengan nodemon):
   ```bash
   npm run dev
   ```
   Server akan berjalan di port `3000` (atau sesuai konfigurasi `.env` Anda).
