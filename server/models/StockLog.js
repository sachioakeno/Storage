const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  productName: String,
  type: { type: String, enum: ['IN', 'OUT', 'NEW'] }, // Masuk, Keluar, atau Baru
  quantity: Number,
  reason: String,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StockLog', logSchema);