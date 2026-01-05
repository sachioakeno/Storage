const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Cek apakah variabel MONGO_URI terbaca
    if (!process.env.MONGO_URI) {
      console.error("❌ ERROR: MONGO_URI tidak ditemukan di file .env!");
      return;
    }

    console.log("⏳ Mencoba menyambung ke database...");
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    console.log(`✅ MongoDB Terhubung: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Gagal koneksi: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;