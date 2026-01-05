const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const productRoutes = require('./routes/productRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Hubungkan ke rute produk
app.use('/api/products', productRoutes);

// KONEKSI STABIL (Gunakan URI ini untuk menembus blokir jaringan)
const ATLAS_URI = "mongodb+srv://admin123:admin321@cluster0.8xn1lpj.mongodb.net/?appName=Cluster0";

mongoose.connect(ATLAS_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => console.log("✅ DATABASE BERHASIL TERHUBUNG"))
  .catch(err => {
    console.error("❌ KONEKSI GAGAL:", err.message);
    console.log("👉 Tip: Jika masih merah, ganti ke HOTSPOT HP sebentar.");
  });

app.listen(5000, () => {
  console.log("🚀 SERVER AKTIF DI PORT 5000");
});