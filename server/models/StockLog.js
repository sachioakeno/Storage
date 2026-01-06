const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  productName: String,
  type: { type: String, enum: ['IN', 'OUT', 'NEW'] },
  quantity: Number,
  reason: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StockLog', logSchema);