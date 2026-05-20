const { Resena, Usuario } = require('../models');

/**
 * GET /api/resenas/:productoNombre
 * Obtener todas las reseñas de un producto
 */
async function obtenerResenasPorProducto(req, res) {
    try {
        const productoNombre = decodeURIComponent(req.params.productoNombre);
        const resenas = await Resena.find({ productoNombre }).sort({ fecha: -1 });
        res.json(resenas);
    } catch (err) {
        console.error('Error obteniendo reseñas:', err.message);
        res.status(500).json({ error: 'Error al obtener reseñas' });
    }
}

/**
 * POST /api/resenas
 * Crear nueva reseña
 */
async function crearResena(req, res) {
    try {
        console.log('📝 POST /api/resenas - Usuario:', req.userId);
        console.log('📦 Body recibido:', req.body);
        
        const { productoNombre, estrellas, comentario } = req.body;
        
        if (!productoNombre || !estrellas || !comentario) {
            console.log('❌ Campos faltantes');
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }
        
        if (estrellas < 1 || estrellas > 5) {
            console.log('❌ Estrellas inválidas:', estrellas);
            return res.status(400).json({ error: 'Estrellas entre 1 y 5' });
        }
        
        // Verificar duplicados
        const existe = await Resena.findOne({ productoNombre, usuario: req.userId });
        if (existe) {
            console.log('⚠️ Reseña duplicada para:', productoNombre);
            return res.status(400).json({ error: 'Ya escribiste una reseña para este producto' });
        }
        
        const usuario = await Usuario.findById(req.userId).select('nombre');
        console.log('👤 Usuario encontrado:', usuario.nombre);
        
        const resena = new Resena({
            productoNombre,
            usuario: req.userId,
            nombreUsuario: usuario.nombre,
            estrellas,
            comentario
        });
        
        await resena.save();
        console.log('✅ Reseña guardada con ID:', resena._id);
        
        res.json({ mensaje: 'Reseña publicada ✅', resena });
    } catch (err) {
        console.error('❌ Error guardando reseña:', err.message);
        res.status(500).json({ error: 'Error al guardar la reseña' });
    }
}

/**
 * DELETE /api/resenas/:id
 * Eliminar reseña
 */
async function eliminarResena(req, res) {
    try {
        await Resena.findOneAndDelete({ _id: req.params.id, usuario: req.userId });
        res.json({ mensaje: 'Reseña eliminada' });
    } catch (err) {
        console.error('Error eliminando reseña:', err.message);
        res.status(500).json({ error: 'Error al eliminar reseña' });
    }
}

module.exports = {
    obtenerResenasPorProducto,
    crearResena,
    eliminarResena
};
