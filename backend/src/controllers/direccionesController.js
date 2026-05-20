const { Direccion } = require('../models');

/**
 * GET /api/direcciones
 * Obtener todas las direcciones del usuario
 */
async function obtenerDirecciones(req, res) {
    try {
        const direcciones = await Direccion.find({ usuario: req.userId });
        res.json(direcciones);
    } catch (err) {
        console.error('Error obteniendo direcciones:', err.message);
        res.status(500).json({ error: 'Error al obtener direcciones' });
    }
}

/**
 * POST /api/direcciones
 * Crear nueva dirección
 */
async function crearDireccion(req, res) {
    try {
        const { nombre, destinatario, calle, ciudad, departamento, telefono } = req.body;
        
        if (!nombre || !calle || !ciudad) {
            return res.status(400).json({ error: 'Nombre, calle y ciudad son obligatorios' });
        }
        
        const dir = new Direccion({
            usuario: req.userId,
            nombre,
            destinatario,
            calle,
            ciudad,
            departamento,
            telefono
        });
        
        await dir.save();
        res.json({ mensaje: 'Dirección guardada ✅', dir });
    } catch (err) {
        console.error('Error creando dirección:', err.message);
        res.status(500).json({ error: 'Error al crear dirección' });
    }
}

/**
 * DELETE /api/direcciones/:id
 * Eliminar dirección
 */
async function eliminarDireccion(req, res) {
    try {
        await Direccion.findOneAndDelete({ _id: req.params.id, usuario: req.userId });
        res.json({ mensaje: 'Dirección eliminada' });
    } catch (err) {
        console.error('Error eliminando dirección:', err.message);
        res.status(500).json({ error: 'Error al eliminar dirección' });
    }
}

module.exports = {
    obtenerDirecciones,
    crearDireccion,
    eliminarDireccion
};
