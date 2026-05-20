const express = require('express');
const router = express.Router();
const verificarToken = require('../middleware/verificarToken');
const carritoController = require('../controllers/carritoController');

router.get('/', verificarToken, carritoController.obtenerCarrito);
router.put('/', verificarToken, carritoController.actualizarCarrito);
router.delete('/', verificarToken, carritoController.vaciarCarrito);

module.exports = router;
