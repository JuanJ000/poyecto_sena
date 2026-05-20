const { Cupon } = require('../models');
const { sanitizar } = require('../utils/validacion');

/**
 * POST /api/cupones/validar
 * Validar código de cupón
 */
async function validarCupon(req, res) {
    try {
        let { codigo, total } = req.body;

        if (!codigo || typeof codigo !== 'string') {
            return res.status(400).json({ error: 'Ingresa un código válido' });
        }

        if (!total || typeof total !== 'number' || total < 0) {
            return res.status(400).json({ error: 'Total no válido' });
        }

        // Sanitizar y validar código
        codigo = sanitizar(codigo).toUpperCase();
        
        if (codigo.length < 2 || codigo.length > 20) {
            return res.status(400).json({ error: 'Código de cupón no válido' });
        }

        const cupon = await Cupon.findOne({ codigo });
        if (!cupon || !cupon.activo) {
            return res.status(404).json({ error: 'Cupón no válido o inactivo' });
        }

        if (cupon.expira && new Date() > cupon.expira) {
            return res.status(400).json({ error: 'Este cupón ya expiró' });
        }

        if (cupon.limite > 0 && cupon.usados >= cupon.limite) {
            return res.status(400).json({ error: 'Este cupón ya alcanzó su límite de usos' });
        }

        const descuento = cupon.tipo === 'porcentaje'
            ? Math.round(total * cupon.descuento / 100)
            : cupon.descuento;

        res.json({
            valido: true,
            descuento,
            tipo: cupon.tipo,
            valor: cupon.descuento,
            codigo: cupon.codigo
        });

    } catch (err) {
        console.error('Error validar cupón:', err.message);
        res.status(500).json({ error: 'Error al validar cupón' });
    }
}

module.exports = {
    validarCupon
};
