const express = require('express');
const router = express.Router();
const verificarToken = require('../middleware/verificarToken');
const direccionesController = require('../controllers/direccionesController');

router.get('/', verificarToken, direccionesController.obtenerDirecciones);
router.post('/', verificarToken, direccionesController.crearDireccion);
router.delete('/:id', verificarToken, direccionesController.eliminarDireccion);

module.exports = router;
