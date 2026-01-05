const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');

const app = express();

app.use(cors());
app.use(express.json()); // Wajib ada agar server bisa baca data

// Logger untuk melihat request di terminal
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ke ${req.url}`);
  next();
});

// Daftarkan rute
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// Gunakan koneksi database kamu (Cloud/Atlas) sesuai screenshot kamu
mongoose.connect('mongodb+srv://sachio:sachio123@ac-9zmrw1u.mongodb.net/gudangku')
  .then(() => console.log("✅ DATABASE BERHASIL TERHUBUNG"))
  .catch(err => console.error("❌ GAGAL KONEKSI DB:", err));

app.listen(5000, () => {
  console.log("🚀 SERVER AKTIF DI PORT 5000");
  console.log("----------------------------");
});