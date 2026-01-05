const Product = require('../models/Product');
const StockLog = require('../models/StockLog');

// 1. Fungsi tambah barang + Catat Riwayat
exports.createProduct = async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    const savedProduct = await newProduct.save();

    // OTOMATIS: Catat ke riwayat saat barang pertama kali diinput
    await StockLog.create({
      productName: savedProduct.name,
      type: 'NEW',
      quantity: savedProduct.stock,
      reason: req.body.logReason || 'Stok awal barang baru',
      date: new Date()
    });

    res.status(201).json(savedProduct);
  } catch (err) {
    res.status(500).json({ error: "Gagal tambah: " + err.message });
  }
};

// 2. Fungsi ambil semua barang
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ expiryDate: 1 });
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Fungsi Edit Barang + Catat Perubahan Stok
exports.updateProduct = async (req, res) => {
  try {
    const oldProduct = await Product.findById(req.params.id);
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    // Logika otomatis: Bandingkan stok lama dan baru
    const diff = updatedProduct.stock - oldProduct.stock;
    if (diff !== 0) {
      await StockLog.create({
        productName: updatedProduct.name,
        type: diff > 0 ? 'IN' : 'OUT', // IN jika bertambah, OUT jika berkurang
        quantity: Math.abs(diff),
        reason: req.body.logReason || 'Pembaruan Data'
      });
    }
    res.status(200).json(updatedProduct);
  } catch (err) { 
    res.status(400).json({ message: "Gagal update: " + err.message }); 
  }
};

// 4. Fungsi Ambil Riwayat (WAJIB ADA untuk tab History)
exports.getLogs = async (req, res) => {
  try {
    const logs = await StockLog.find().sort({ date: -1 }); // Urutkan dari yang terbaru
    res.status(200).json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 5. Fungsi Hapus Barang
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    await Product.findByIdAndDelete(req.params.id);
    
    // Opsional: Catat riwayat saat barang dihapus
    await StockLog.create({
      productName: product.name,
      type: 'OUT',
      quantity: product.stock,
      reason: 'Barang dihapus dari sistem'
    });

    res.status(200).json({ message: "Produk berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};