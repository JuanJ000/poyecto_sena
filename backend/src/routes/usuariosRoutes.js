const express = require('express');
const router = express.Router();
const verificarToken = require('../middleware/verificarToken');
const usuariosController = require('../controllers/usuariosController');

router.get('/perfil', verificarToken, usuariosController.obtenerPerfil);
router.put('/perfil', verificarToken, usuariosController.actualizarPerfil);

module.exports = router;
