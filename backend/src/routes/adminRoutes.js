const express = require('express');
const router = express.Router();
const verificarToken = require('../middleware/verificarToken');
const verificarAdmin = require('../middleware/verificarAdmin');
const adminController = require('../controllers/adminController');

// Estadísticas
router.get('/estadisticas', verificarToken, verificarAdmin, adminController.obtenerEstadisticas);

// Pedidos
router.get('/pedidos', verificarToken, verificarAdmin, adminController.obtenerTodosPedidos);

// Usuarios
router.get('/usuarios', verificarToken, verificarAdmin, adminController.obtenerTodosUsuarios);
router.delete('/usuarios/:id', verificarToken, verificarAdmin, adminController.eliminarUsuario);

// Reseñas
router.get('/resenas', verificarToken, verificarAdmin, adminController.obtenerTodasResenas);
router.delete('/resenas/:id', verificarToken, verificarAdmin, adminController.eliminarResenaPorAdmin);

// Productos
router.get('/productos', verificarToken, verificarAdmin, adminController.obtenerTodosProductos);
router.post('/productos', verificarToken, verificarAdmin, adminController.crearProducto);
router.put('/productos/:id', verificarToken, verificarAdmin, adminController.actualizarProducto);
router.delete('/productos/:id', verificarToken, verificarAdmin, adminController.eliminarProducto);

// Cupones
router.get('/cupones', verificarToken, verificarAdmin, adminController.obtenerTodosCupones);
router.post('/cupones', verificarToken, verificarAdmin, adminController.crearCupon);
router.put('/cupones/:id', verificarToken, verificarAdmin, adminController.actualizarCupon);
router.delete('/cupones/:id', verificarToken, verificarAdmin, adminController.eliminarCupon);

// Informes
router.get('/informes', verificarToken, verificarAdmin, adminController.obtenerInformes);
router.post('/guardar-informe', verificarToken, verificarAdmin, adminController.guardarInforme);

module.exports = router;
