/**
 * Configuración de la aplicación
 */

module.exports = {
    // Base de datos
    MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/tiendax',

    // JWT
    JWT_SECRET: process.env.JWT_SECRET || 'tu_secret_key_muy_segura',
    JWT_EXPIRES: '7d',

    // Email
    GMAIL_USER: process.env.GMAIL_USER,
    GMAIL_PASS: process.env.GMAIL_PASS,
    EMAIL_ADMIN: process.env.EMAIL_ADMIN,

    // Admin
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,

    // Puerto
    PORT: process.env.PORT || 3000,

    // CORS
    CORS_ORIGINS: [
        'http://localhost:3001',
        'http://localhost:3000',
        'http://127.0.0.1:5501',
        'http://127.0.0.1:5500'
    ],

    // Entorno
    NODE_ENV: process.env.NODE_ENV || 'development',

    // Límites
    RATE_LIMIT: {
        LOGIN: { windowMs: 15 * 60 * 1000, max: 10 },
        REGISTRO: { windowMs: 60 * 60 * 1000, max: 5 },
        GENERAL: { windowMs: 60 * 1000, max: 60 }
    }
};
