const Product = require('../models/Product');
const StockLog = require('../models/StockLog');

// Ambil Semua Produk
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// Ambil Semua Riwayat
exports.getLogs = async (req, res) => {
  try {
    const logs = await StockLog.find().sort({ date: -1 });
    res.json(logs);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// Simpan Produk Baru + Log 'NEW'
exports.createProduct = async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    const savedProduct = await newProduct.save();

    // Catat Log Baru
    const newLog = new StockLog({
      productName: savedProduct.name,
      type: 'NEW',
      quantity: savedProduct.stock,
      reason: req.body.logReason || 'Input Barang Baru'
    });
    await newLog.save();

    res.status(201).json(savedProduct);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

// Update Produk + Log 'IN'/'OUT' otomatis
exports.updateProduct = async (req, res) => {
  try {
    const oldProduct = await Product.findById(req.params.id);
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // Bandingkan stok lama dan baru untuk mencatat riwayat
    if (oldProduct.stock !== updatedProduct.stock) {
      const diff = updatedProduct.stock - oldProduct.stock;
      const newLog = new StockLog({
        productName: updatedProduct.name,
        type: diff > 0 ? 'IN' : 'OUT',
        quantity: Math.abs(diff),
        reason: req.body.logReason || 'Pembaruan Data'
      });
      await newLog.save();
    }
    res.json(updatedProduct);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

// Hapus Produk
exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Produk dihapus" });
  } catch (error) { res.status(500).json({ message: error.message }); }
};