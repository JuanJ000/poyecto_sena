/**
 * TIENDA X - Backend API
 * Aplicación refactorizada con arquitectura modular
 * 
 * Estructura:
 * - src/config    → Configuración centralizada
 * - src/models    → Modelos Mongoose
 * - src/middleware → Middlewares (autenticación, errores)
 * - src/utils     → Utilidades (validación, email, bloqueos IP)
 * - src/controllers → Lógica de negocio
 * - src/routes    → Definición de rutas
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Importar configuración y middlewares
const config = require('./src/config/config');
const errorHandler = require('./src/middleware/errorHandler');
const { limpiarIpsExpiradas } = require('./src/utils/ipBlocking');

// Importar rutas
const authRoutes = require('./src/routes/authRoutes');
const usuariosRoutes = require('./src/routes/usuariosRoutes');
const pedidosRoutes = require('./src/routes/pedidosRoutes');
const resenasRoutes = require('./src/routes/resenasRoutes');
const productosRoutes = require('./src/routes/productosRoutes');
const carritoRoutes = require('./src/routes/carritoRoutes');
const direccionesRoutes = require('./src/routes/direccionesRoutes');
const favoritosRoutes = require('./src/routes/favoritosRoutes');
const cuponesRoutes = require('./src/routes/cuponesRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

const app = express();

// ══════════════════════════════════════════════
// CONFIGURACIÓN INICIAL
// ══════════════════════════════════════════════

// CORS
app.use(cors({
    origin: config.CORS_ORIGINS,
    credentials: true
}));

// Headers de seguridad
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Body parser
app.use(express.json({ limit: '10mb' }));

// ══════════════════════════════════════════════
// CONEXIÓN A MONGODB
// ══════════════════════════════════════════════

mongoose.connect(config.MONGO_URI)
    .then(() => console.log('✅ Conectado a MongoDB'))
    .catch(err => {
        console.error('❌ Error conectando a MongoDB:', err.message);
        process.exit(1);
    });

// ══════════════════════════════════════════════
// LIMPIEZA PERIÓDICA
// ══════════════════════════════════════════════

// Limpiar IPs bloqueadas cada hora
setInterval(limpiarIpsExpiradas, 60 * 60 * 1000);

// ══════════════════════════════════════════════
// RUTAS
// ══════════════════════════════════════════════

app.use('/api', authRoutes);
app.use('/api/perfil', usuariosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/resenas', resenasRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/carrito', carritoRoutes);
app.use('/api/direcciones', direccionesRoutes);
app.use('/api/favoritos', favoritosRoutes);
app.use('/api/cupones', cuponesRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ══════════════════════════════════════════════
// MANEJO DE ERRORES
// ══════════════════════════════════════════════

app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use(errorHandler);

// ══════════════════════════════════════════════
// INICIAR SERVIDOR
// ══════════════════════════════════════════════

const PORT = config.PORT;
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════╗
║        🚀 TIENDA X BACKEND INICIADO 🚀        ║
╠═══════════════════════════════════════════════╣
║ 🌐 URL: http://localhost:${PORT}
║ 📁 Entorno: ${config.NODE_ENV}
║ 💾 Base de datos: ${config.MONGO_URI.split('/').pop()}
╚═══════════════════════════════════════════════╝
    `);
});

module.exports = app;
