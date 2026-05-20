const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');

// Rate limiters
const limiterLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
});

const limiterRegistro = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { error: 'Demasiados registros. Intenta más tarde.' },
});

router.post('/registrarse', limiterRegistro, authController.registrarse);
router.post('/login', limiterLogin, authController.login);
router.post('/admin/login', limiterLogin, authController.loginAdmin);

module.exports = router;
