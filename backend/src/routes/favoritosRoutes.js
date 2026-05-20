const express = require('express');
const router = express.Router();
const verificarToken = require('../middleware/verificarToken');
const favoritosController = require('../controllers/favoritosController');

router.get('/', verificarToken, favoritosController.obtenerFavoritos);
router.post('/', verificarToken, favoritosController.agregarFavorito);
router.delete('/:id', verificarToken, favoritosController.eliminarFavorito);

module.exports = router;
