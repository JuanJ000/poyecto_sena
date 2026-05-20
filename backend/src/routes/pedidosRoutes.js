const express = require('express');
const router = express.Router();
const verificarToken = require('../middleware/verificarToken');
const pedidosController = require('../controllers/pedidosController');
const verificarAdmin = require('../middleware/verificarAdmin');

router.get('/', verificarToken, pedidosController.obtenerPedidos);
router.get('/:id', verificarToken, pedidosController.obtenerPedidoPorId);
router.post('/', verificarToken, pedidosController.crearPedido);
router.put('/:id/estado', verificarToken, verificarAdmin, pedidosController.actualizarEstadoPedido);
router.put('/:id/tracking', verificarToken, verificarAdmin, pedidosController.actualizarTracking);

module.exports = router;
