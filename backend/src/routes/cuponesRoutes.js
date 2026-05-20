const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const cuponesController = require('../controllers/cuponesController');

const limiterGeneral = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: { error: 'Demasiadas solicitudes. Intenta más tarde.' },
});

router.post('/validar', limiterGeneral, cuponesController.validarCupon);

module.exports = router;
