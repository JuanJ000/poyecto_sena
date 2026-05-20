const { Favorito } = require('../models');

/**
 * GET /api/favoritos
 * Obtener todos los favoritos del usuario
 */
async function obtenerFavoritos(req, res) {
    try {
        const favoritos = await Favorito.find({ usuario: req.userId });
        res.json(favoritos);
    } catch (err) {
        console.error('Error obteniendo favoritos:', err.message);
        res.status(500).json({ error: 'Error al obtener favoritos' });
    }
}

/**
 * POST /api/favoritos
 * Agregar a favoritos
 */
async function agregarFavorito(req, res) {
    try {
        const { nombre, precio, imagen_front, categoria } = req.body;
        
        const existe = await Favorito.findOne({ usuario: req.userId, nombre });
        if (existe) {
            return res.status(400).json({ error: 'Ya está en favoritos' });
        }
        
        const fav = new Favorito({
            usuario: req.userId,
            nombre,
            precio,
            imagen_front,
            categoria
        });
        
        await fav.save();
        res.json({ mensaje: 'Agregado a favoritos ✅' });
    } catch (err) {
        console.error('Error agregando favorito:', err.message);
        res.status(500).json({ error: 'Error al agregar favorito' });
    }
}

/**
 * DELETE /api/favoritos/:id
 * Eliminar favorito
 */
async function eliminarFavorito(req, res) {
    try {
        await Favorito.findOneAndDelete({ _id: req.params.id, usuario: req.userId });
        res.json({ mensaje: 'Favorito eliminado' });
    } catch (err) {
        console.error('Error eliminando favorito:', err.message);
        res.status(500).json({ error: 'Error al eliminar favorito' });
    }
}

module.exports = {
    obtenerFavoritos,
    agregarFavorito,
    eliminarFavorito
};
