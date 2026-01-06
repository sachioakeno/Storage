const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // TAMBAHKAN BARIS INI AGAR KODE BISA TERSIMPAN
  code: { 
    type: String, 
    required: true, // Wajib ada
  
  },
  name: {
    type: String,
    required: [true, 'Nama produk harus diisi']
  },
  stock: {
    type: Number,
    required: [true, 'Stok harus diisi'],
    min: [0, 'Stok tidak boleh minus']
  },
  buyPrice: { type: Number, default: 0 }, 
  sellPrice: { type: Number, default: 0 }, 
  category: {
    type: String,
    required: [true, 'Kategori harus diisi']
  },
  expiryDate: {
    type: Date,
    required: [true, 'Tanggal kadaluwarsa harus diisi']
  },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', productSchema);