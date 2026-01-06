require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// Membaca rahasia dari file .env
const ATLAS_URI = process.env.ATLAS_URI;
const PORT = process.env.PORT || 5000;

mongoose.connect(ATLAS_URI)
  .then(() => console.log("✅ DATABASE TERHUBUNG (MODE AMAN)"))
  .catch(err => console.error("❌ KONEKSI GAGAL:", err.message));

app.listen(PORT, () => console.log(`🚀 SERVER JALAN DI PORT ${PORT}`));