const { Carrito } = require('../models');

/**
 * GET /api/carrito
 * Obtener carrito del usuario
 */
async function obtenerCarrito(req, res) {
    try {
        const c = await Carrito.findOne({ usuario: req.userId });
        res.json(c ? c.items : []);
    } catch (err) {
        console.error('Error obteniendo carrito:', err.message);
        res.status(500).json({ error: 'Error al obtener carrito' });
    }
}

/**
 * PUT /api/carrito
 * Actualizar carrito del usuario
 */
async function actualizarCarrito(req, res) {
    try {
        await Carrito.findOneAndUpdate(
            { usuario: req.userId },
            { items: req.body.items, actualizadoEn: new Date() },
            { upsert: true }
        );
        res.json({ mensaje: 'Carrito guardado' });
    } catch (err) {
        console.error('Error actualizando carrito:', err.message);
        res.status(500).json({ error: 'Error al actualizar carrito' });
    }
}

/**
 * DELETE /api/carrito
 * Vaciar carrito del usuario
 */
async function vaciarCarrito(req, res) {
    try {
        await Carrito.findOneAndDelete({ usuario: req.userId });
        res.json({ mensaje: 'Carrito vaciado' });
    } catch (err) {
        console.error('Error vaciando carrito:', err.message);
        res.status(500).json({ error: 'Error al vaciar carrito' });
    }
}

module.exports = {
    obtenerCarrito,
    actualizarCarrito,
    vaciarCarrito
};
