const { Pedido, Usuario } = require('../models');
const { enviarEmail, emailConfirmacionUsuario, emailNuevoPedidoAdmin, emailCambioEstado } = require('../utils/email');

/**
 * GET /api/pedidos
 * Obtener todos los pedidos del usuario
 */
async function obtenerPedidos(req, res) {
    try {
        const pedidos = await Pedido.find({ usuario: req.userId }).sort({ fecha: -1 });
        res.json(pedidos);
    } catch (err) {
        console.error('Error obteniendo pedidos:', err.message);
        res.status(500).json({ error: 'Error al obtener pedidos' });
    }
}

/**
 * GET /api/pedidos/:id
 * Obtener pedido por ID
 */
async function obtenerPedidoPorId(req, res) {
    try {
        const pedido = await Pedido.findOne({ _id: req.params.id, usuario: req.userId });
        if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
        res.json(pedido);
    } catch (err) {
        console.error('Error obteniendo pedido:', err.message);
        res.status(500).json({ error: 'Error al obtener pedido' });
    }
}

/**
 * POST /api/pedidos
 * Crear nuevo pedido
 */
async function crearPedido(req, res) {
    try {
        const { items, envio, metodoPago, notas } = req.body;
        
        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'El pedido está vacío' });
        }
        
        if (!envio || !envio.nombre || !envio.direccion || !envio.ciudad) {
            return res.status(400).json({ error: 'Faltan datos de envío' });
        }
        
        if (!metodoPago) {
            return res.status(400).json({ error: 'Selecciona un método de pago' });
        }

        const pedido = new Pedido({ 
            usuario: req.userId, 
            items, 
            envio, 
            metodoPago, 
            notas: notas || '' 
        });
        
        await pedido.save();

        // Enviar confirmación al usuario
        const usuario = await Usuario.findById(req.userId).select('nombre email');
        if (usuario?.email) {
            enviarEmail({
                to: usuario.email,
                subject: `Tienda X — Pedido #${pedido._id.toString().slice(-8).toUpperCase()} confirmado`,
                html: emailConfirmacionUsuario(pedido, usuario)
            });
        }

        // Notificar al admin
        if (process.env.EMAIL_ADMIN && usuario) {
            enviarEmail({
                to: process.env.EMAIL_ADMIN,
                subject: `Nuevo pedido #${pedido._id.toString().slice(-8).toUpperCase()}`,
                html: emailNuevoPedidoAdmin(pedido, usuario)
            });
        }

        res.json({ mensaje: 'Pedido creado ✅', pedido });
    } catch (err) {
        console.error('Error creando pedido:', err.message);
        res.status(500).json({ error: 'Error al crear pedido' });
    }
}

/**
 * PUT /api/pedidos/:id/estado
 * Actualizar estado del pedido (admin)
 */
async function actualizarEstadoPedido(req, res) {
    try {
        const { estado } = req.body;
        
        if (!['pendiente','enviado','entregado'].includes(estado)) {
            return res.status(400).json({ error: 'Estado no válido' });
        }
        
        const pedido = await Pedido.findById(req.params.id);
        if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
        
        pedido.estado = estado;
        await pedido.save();
        
        // Notificar cambio de estado
        if (estado === 'enviado' || estado === 'entregado') {
            const usuario = await Usuario.findById(pedido.usuario).select('nombre email');
            if (usuario?.email) {
                enviarEmail({
                    to: usuario.email,
                    subject: estado === 'enviado' ? `Tu pedido está en camino 🚚` : `Tu pedido fue entregado ✅`,
                    html: emailCambioEstado(pedido, usuario, estado)
                });
            }
        }
        
        res.json({ mensaje: `Estado actualizado a "${estado}" ✅`, pedido });
    } catch (err) {
        console.error('Error actualizando estado:', err.message);
        res.status(500).json({ error: 'Error al actualizar estado' });
    }
}

/**
 * PUT /api/pedidos/:id/tracking
 * Actualizar número de tracking (admin)
 */
async function actualizarTracking(req, res) {
    try {
        const { tracking } = req.body;
        const pedido = await Pedido.findByIdAndUpdate(req.params.id, { tracking }, { new: true });
        
        if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
        
        res.json({ mensaje: 'Número de guía actualizado ✅', pedido });
    } catch (err) {
        console.error('Error actualizando tracking:', err.message);
        res.status(500).json({ error: 'Error al actualizar tracking' });
    }
}

module.exports = {
    obtenerPedidos,
    obtenerPedidoPorId,
    crearPedido,
    actualizarEstadoPedido,
    actualizarTracking
};
