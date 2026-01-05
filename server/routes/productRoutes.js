const express = require('express');
const router = express.Router();
const productController = require('../controller/productController');

// Logs harus di atas agar tidak dianggap sebagai ID barang
router.get('/logs', productController.getLogs); 
router.get('/', productController.getProducts);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;