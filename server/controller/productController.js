const Product = require('../models/Product');
const StockLog = require('../models/StockLog');

// 1. Ambil Produk (Hanya milik user login)
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// 2. Ambil Riwayat (Hanya milik user login)
exports.getLogs = async (req, res) => {
  try {
    const logs = await StockLog.find({ owner: req.user.id }).sort({ date: -1 });
    res.json(logs);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// 3. Simpan Barang (FITUR: Memasukkan owner agar data tersimpan)
// Ganti fungsi createProduct di productController.js kamu dengan ini:
exports.createProduct = async (req, res) => {
  try {
    // 1. Buat data produk baru dengan tambahan ID pemilik dari Token
    const newProduct = new Product({ 
      ...req.body, 
      owner: req.user.id // PENTING: Mengambil ID dari authMiddleware
    });
    const savedProduct = await newProduct.save();

    // 2. Catat riwayat stok dengan ID pemilik juga
    const newLog = new StockLog({
      productName: savedProduct.name,
      type: 'NEW',
      quantity: savedProduct.stock,
      reason: req.body.logReason || 'Input Barang Baru',
      owner: req.user.id
    });
    await newLog.save();

    res.status(201).json(savedProduct);
  } catch (error) { 
    console.error("Database menolak simpan:", error.message);
    res.status(400).json({ message: "Data tidak lengkap", detail: error.message }); 
  }
};

// 4. Update Barang (Wajib cek owner)
exports.updateProduct = async (req, res) => {
  try {
    const oldProduct = await Product.findOne({ _id: req.params.id, owner: req.user.id });
    if (!oldProduct) return res.status(404).json({ message: "Data tidak ditemukan" });

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (oldProduct.stock !== updatedProduct.stock) {
      const diff = updatedProduct.stock - oldProduct.stock;
      await new StockLog({
        productName: updatedProduct.name,
        type: diff > 0 ? 'IN' : 'OUT',
        quantity: Math.abs(diff),
        reason: req.body.logReason || 'Update Data',
        owner: req.user.id
      }).save();
    }
    res.json(updatedProduct);
  } catch (error) { res.status(400).json({ message: error.message }); }
};

// 5. Hapus Barang
exports.deleteProduct = async (req, res) => {
  try {
    await Product.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    res.json({ message: "Dihapus" });
  } catch (error) { res.status(500).json({ message: error.message }); }
};