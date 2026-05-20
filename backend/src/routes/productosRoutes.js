const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');

router.get('/:genero', productosController.obtenerProductosPorGenero);

module.exports = router;
