const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const productRoutes = require('./routes/productRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Langsung gunakan rute produk tanpa proteksi login
app.use('/api/products', productRoutes);

// KONEKSI VERSI LEGACY (Paling tahan banting untuk internet di Indonesia)
const ATLAS_URI = "mongodb://sachio:sachio123@ac-9zmrw1u-shard-00-00.mongodb.net:27017,ac-9zmrw1u-shard-00-01.mongodb.net:27017,ac-9zmrw1u-shard-00-02.mongodb.net:27017/gudangku?ssl=true&replicaSet=atlas-v9y836-shard-0&authSource=admin&retryWrites=true&w=majority";

mongoose.connect(ATLAS_URI)
  .then(() => {
    console.log("---------------------------------------");
    console.log("✅ BERHASIL! DATABASE TERHUBUNG KEMBALI");
    console.log("---------------------------------------");
  })
  .catch(err => {
    console.error("❌ KONEKSI GAGAL:", err.message);
  });

app.listen(5000, () => {
  console.log("🚀 SERVER GUDANGKU AKTIF DI PORT 5000");
});