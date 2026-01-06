const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes'); // Import rute auth

const app = express();
app.use(cors());
app.use(express.json());

// DAFTARKAN RUTE
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// GUNAKAN ALAMAT LEGACY (Agar tidak "Koneksi Gagal" lagi)
const ATLAS_URI = "mongodb+srv://admin123:admin321@cluster0.8xn1lpj.mongodb.net/?appName=Cluster0";

mongoose.connect(ATLAS_URI)
  .then(() => console.log("✅ DATABASE TERHUBUNG & AUTH AKTIF"))
  .catch(err => console.error("❌ KONEKSI GAGAL:", err.message));

app.listen(5000, () => console.log("🚀 SERVER GUDANGKU JALAN DI PORT 5000"));