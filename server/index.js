import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config(); // Memuat dotenv di level root aplikasi sebelum semua rute di-load

import UserRoute from './src/routes/usersRoute.js';
import SpotRoute from './src/routes/spotsRoute.js';
import SessionRoute from './src/routes/sessionsRoute.js';
import AuthRoute from './src/routes/authRoute.js';
import BookingRoute from './src/routes/bookingsRoute.js';
import ReviewRoute from './src/routes/reviewRoute.js';
import BaitsRoute from './src/routes/baitsRoute.js';
import BlogRoute from './src/routes/blogRoute.js';
import FishingGearsRoute from './src/routes/fishingGearsRoute.js';
import HistoryRoute from './src/routes/historyRoute.js';
import GearsRoute from './src/routes/gearsRoute.js';
import SpotGearsRoute from "./src/routes/spotGearsRoute.js";

const app = express();
const port = process.env.PORT || 3000;

/**
 * Middleware keamanan global
 * - Helmet: menambahkan berbagai header HTTP untuk meningkatkan keamanan
 * - CORS: mengatur domain mana yang diizinkan mengakses API (sementara terbuka untuk development)
 * - Rate Limiting: membatasi jumlah request agar terhindar dari brute force atau spam
 */
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

app.use(cors({
  origin: '*', // Saat production, ubah ke domain frontend yang valid
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use(rateLimit({
  windowMs: 60 * 1000, // Interval 1 menit
  max: 100,            // Maksimum 100 request per IP
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => req.ip
}));

/**
 * Parser body request
 * Membatasi ukuran JSON untuk mencegah serangan payload besar
 */
app.use(express.json({ limit: '50kb' }));
app.set('trust proxy', 1);
app.use('/assets', express.static('assets'));

// Registrasi seluruh rute API
app.use(UserRoute);
app.use(SpotRoute);
app.use(SessionRoute);
app.use(AuthRoute);
app.use(BookingRoute);
app.use(ReviewRoute);
app.use(BaitsRoute);
app.use(BlogRoute);
app.use(FishingGearsRoute);
app.use(HistoryRoute);
app.use(SpotGearsRoute);
app.use(GearsRoute);

/**
 * Middleware penanganan error global
 * Menyembunyikan rincian teknis di lingkungan produksi
 */
app.use((err, req, res, next) => {
  console.error('Error caught:', err);
  const isDev = process.env.NODE_ENV === 'development';

  res.status(err.status || 500).json({
    success: false,
    message: isDev ? err.message : 'Terjadi kesalahan pada server'
  });
});

/**
 * Menjalankan server HTTP
 */
app.listen(port, () => {
  console.log(`Server berjalan di port ${port}`);
});
