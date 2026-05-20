const express = require('express');
const router = express.Router();
const verificarToken = require('../middleware/verificarToken');
const resenasController = require('../controllers/resenasController');

router.get('/:productoNombre', resenasController.obtenerResenasPorProducto);
router.post('/', verificarToken, resenasController.crearResena);
router.delete('/:id', verificarToken, resenasController.eliminarResena);

module.exports = router;
