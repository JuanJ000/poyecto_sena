const { Producto } = require('../models');

/**
 * GET /api/productos/:genero
 * Obtener productos filtrados por género
 */
async function obtenerProductosPorGenero(req, res) {
    try {
        const { genero } = req.params;
        
        if (!['hombre','mujer','niño','todos'].includes(genero)) {
            return res.status(400).json({ error: 'Género no válido' });
        }
        
        const filtro = genero === 'todos' ? { activo: true } : { genero, activo: true };
        const productos = await Producto.find(filtro).sort({ creadoEn: -1 });
        
        res.json(productos);
    } catch (err) {
        console.error('Error obteniendo productos:', err.message);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
}

module.exports = {
    obtenerProductosPorGenero
};
