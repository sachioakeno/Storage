const express = require('express');
const router = express.Router();
const productController = require('../controller/productController');
const auth = require('../middleware/authMiddleware'); // Pastikan file ini ada

// Tambahkan 'auth' di setiap jalur simpan dan ambil data
router.get('/', auth, productController.getProducts);
router.post('/', auth, productController.createProduct);
router.get('/logs', auth, productController.getLogs);
router.put('/:id', auth, productController.updateProduct);
router.delete('/:id', auth, productController.deleteProduct);

module.exports = router;