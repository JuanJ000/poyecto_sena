const { Usuario } = require('../models');

/**
 * Middleware para verificar que el usuario sea admin
 */
async function verificarAdmin(req, res, next) {
    try {
        if (!req.userId) {
            console.error('❌ Error: req.userId no está definido');
            return res.status(403).json({ error: 'No hay usuario identificado' });
        }

        const usuario = await Usuario.findById(req.userId);
        
        if (!usuario) {
            console.error('❌ Error: Usuario no encontrado');
            return res.status(403).json({ error: 'Usuario no encontrado' });
        }

        if (usuario.rol !== 'admin') {
            console.error('❌ Error: Usuario sin permisos admin');
            return res.status(403).json({ error: 'Acceso denegado — se requiere rol admin' });
        }

        req.usuario = usuario;
        next();

    } catch (err) {
        console.error('❌ Error verificando admin:', err.message);
        return res.status(500).json({ error: 'Error verificando permisos' });
    }
}

module.exports = verificarAdmin;
