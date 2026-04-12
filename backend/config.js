// ════════════════════════════════════════════════════════════════════
// backend/config.js
// Configuración centralizada del backend
// ════════════════════════════════════════════════════════════════════

require('dotenv').config();

module.exports = {
    // ─── SERVIDOR ─────────────────────────────────────
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',

    // ─── MONGODB ───────────────────────────────────────
    MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/tiendax',
    
    // ─── AUTENTICACIÓN ────────────────────────────────
    JWT_SECRET: process.env.JWT_SECRET || 'tu_clave_secreta_super_segura',
    JWT_EXPIRE: '7d',
    
    // ─── EMAIL (Notificaciones) ──────────────────────
    GMAIL_USER: process.env.GMAIL_USER,
    GMAIL_PASS: process.env.GMAIL_PASS,
    EMAIL_ADMIN: process.env.EMAIL_ADMIN || 'admin@tiendax.com',
    
    // ─── ADMIN ────────────────────────────────────────
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    
    // ─── CORS ─────────────────────────────────────────
    CORS_ORIGIN: [
        'http://localhost:3000',
        'http://localhost:8080',
        'http://localhost:5500',
        'http://127.0.0.1:5500'
    ],
    
    // ─── API ──────────────────────────────────────────
    API_PREFIX: '/api',
    
    // ─── LOGS ─────────────────────────────────────────
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};
