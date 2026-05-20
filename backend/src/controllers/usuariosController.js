const { Usuario, Pedido, Direccion, Favorito } = require('../models');
const bcrypt = require('bcryptjs');

/**
 * GET /api/perfil
 * Obtener datos del perfil del usuario autenticado
 */
async function obtenerPerfil(req, res) {
    try {
        const usuario = await Usuario.findById(req.userId).select('-password');
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
        
        const pedidos = await Pedido.find({ usuario: req.userId });
        res.json({ ...usuario.toObject(), pedidos });
    } catch (err) {
        console.error('Error obteniendo perfil:', err.message);
        res.status(500).json({ error: 'Error al obtener perfil' });
    }
}

/**
 * PUT /api/perfil
 * Actualizar perfil del usuario
 */
async function actualizarPerfil(req, res) {
    try {
        const { nombre, email, passwordActual, passwordNueva } = req.body;
        
        const usuario = await Usuario.findById(req.userId);
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
        
        // Validar contraseña actual si se intenta cambiar contraseña
        if (passwordNueva) {
            if (!passwordActual) {
                return res.status(400).json({ error: 'Contraseña actual requerida' });
            }
            const valido = await bcrypt.compare(passwordActual, usuario.password);
            if (!valido) return res.status(400).json({ error: 'Contraseña actual incorrecta' });
            
            if (passwordNueva.length < 6) {
                return res.status(400).json({ error: 'Nueva contraseña mínimo 6 caracteres' });
            }
            
            usuario.password = await bcrypt.hash(passwordNueva, 12);
        }
        
        if (nombre) usuario.nombre = nombre;
        if (email) usuario.email = email;
        
        await usuario.save();
        res.json({ mensaje: 'Perfil actualizado ✅' });
    } catch (err) {
        console.error('Error actualizando perfil:', err.message);
        res.status(500).json({ error: 'Error al actualizar perfil' });
    }
}

module.exports = {
    obtenerPerfil,
    actualizarPerfil
};
