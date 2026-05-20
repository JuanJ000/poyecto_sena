const { Usuario, Pedido, Resena, Producto, Cupon, Informe } = require('../models');

/**
 * GET /api/admin/estadisticas
 * Obtener estadísticas del admin
 */
async function obtenerEstadisticas(req, res) {
    try {
        const [totalPedidos, totalUsuarios, totalResenas, pedidos] = await Promise.all([
            Pedido.countDocuments(),
            Usuario.countDocuments({ rol: 'usuario' }),
            Resena.countDocuments(),
            Pedido.find()
        ]);
        
        const ingresoTotal = pedidos.reduce((a,p) => a + p.items.reduce((b,i) => b+i.precio*i.cantidad, 0), 0);
        const pedidosPendientes = pedidos.filter(p => p.estado === 'pendiente').length;
        const pedidosEnviados = pedidos.filter(p => p.estado === 'enviado').length;
        const pedidosEntregados = pedidos.filter(p => p.estado === 'entregado').length;

        const hace6Meses = new Date();
        hace6Meses.setMonth(hace6Meses.getMonth() - 5);
        
        const ventasPorMes = await Pedido.aggregate([
            { $match: { fecha: { $gte: hace6Meses } } },
            { $group: {
                _id: { mes: { $month: '$fecha' }, año: { $year: '$fecha' } },
                total: { $sum: { $reduce: { input: '$items', initialValue: 0,
                    in: { $add: ['$$value', { $multiply: ['$$this.precio','$$this.cantidad'] }] } } } },
                cantidad: { $sum: 1 }
            }},
            { $sort: { '_id.año': 1, '_id.mes': 1 } }
        ]);

        res.json({
            totalPedidos,
            totalUsuarios,
            totalResenas,
            ingresoTotal,
            pedidosPendientes,
            pedidosEnviados,
            pedidosEntregados,
            ventasPorMes
        });
    } catch (err) {
        console.error('Error obteniendo estadísticas:', err.message);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
}

/**
 * GET /api/admin/pedidos
 * Obtener todos los pedidos (admin)
 */
async function obtenerTodosPedidos(req, res) {
    try {
        const pedidos = await Pedido.find().populate('usuario','nombre email').sort({ fecha: -1 });
        res.json(pedidos);
    } catch (err) {
        console.error('Error obteniendo pedidos:', err.message);
        res.status(500).json({ error: 'Error al obtener pedidos' });
    }
}

/**
 * GET /api/admin/usuarios
 * Obtener todos los usuarios (admin)
 */
async function obtenerTodosUsuarios(req, res) {
    try {
        const usuarios = await Usuario.find({ rol: 'usuario' }).select('-password').sort({ creadoEn: -1 });
        res.json(usuarios);
    } catch (err) {
        console.error('Error obteniendo usuarios:', err.message);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
}

/**
 * DELETE /api/admin/usuarios/:id
 * Eliminar usuario (admin)
 */
async function eliminarUsuario(req, res) {
    try {
        await Usuario.findByIdAndDelete(req.params.id);
        res.json({ mensaje: 'Usuario eliminado' });
    } catch (err) {
        console.error('Error eliminando usuario:', err.message);
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
}

/**
 * GET /api/admin/resenas
 * Obtener todas las reseñas (admin)
 */
async function obtenerTodasResenas(req, res) {
    try {
        const resenas = await Resena.find().sort({ fecha: -1 });
        res.json(resenas);
    } catch (err) {
        console.error('Error obteniendo reseñas:', err.message);
        res.status(500).json({ error: 'Error al obtener reseñas' });
    }
}

/**
 * DELETE /api/admin/resenas/:id
 * Eliminar reseña (admin)
 */
async function eliminarResenaPorAdmin(req, res) {
    try {
        await Resena.findByIdAndDelete(req.params.id);
        res.json({ mensaje: 'Reseña eliminada' });
    } catch (err) {
        console.error('Error eliminando reseña:', err.message);
        res.status(500).json({ error: 'Error al eliminar reseña' });
    }
}

/**
 * GET /api/admin/productos
 * Obtener todos los productos (admin)
 */
async function obtenerTodosProductos(req, res) {
    try {
        const productos = await Producto.find().sort({ creadoEn: -1 });
        res.json(productos);
    } catch (err) {
        console.error('Error obteniendo productos:', err.message);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
}

/**
 * POST /api/admin/productos
 * Crear producto (admin)
 */
async function crearProducto(req, res) {
    try {
        const { nombre, categoria, genero, precio, rating, imagen_front, imagen_back, descripcion } = req.body;
        
        if (!nombre || !categoria || !genero || !precio) {
            return res.status(400).json({ error: 'Nombre, categoría, género y precio son obligatorios' });
        }
        
        const producto = new Producto({
            nombre,
            categoria,
            genero,
            precio,
            rating: rating || 5,
            imagen_front,
            imagen_back,
            descripcion
        });
        
        await producto.save();
        res.json({ mensaje: 'Producto creado ✅', producto });
    } catch (err) {
        console.error('Error creando producto:', err.message);
        res.status(500).json({ error: 'Error al crear producto' });
    }
}

/**
 * PUT /api/admin/productos/:id
 * Actualizar producto (admin)
 */
async function actualizarProducto(req, res) {
    try {
        const producto = await Producto.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
        res.json({ mensaje: 'Producto actualizado ✅', producto });
    } catch (err) {
        console.error('Error actualizando producto:', err.message);
        res.status(500).json({ error: 'Error al actualizar producto' });
    }
}

/**
 * DELETE /api/admin/productos/:id
 * Eliminar producto (admin)
 */
async function eliminarProducto(req, res) {
    try {
        await Producto.findByIdAndDelete(req.params.id);
        res.json({ mensaje: 'Producto eliminado' });
    } catch (err) {
        console.error('Error eliminando producto:', err.message);
        res.status(500).json({ error: 'Error al eliminar producto' });
    }
}

/**
 * GET /api/admin/cupones
 * Obtener todos los cupones (admin)
 */
async function obtenerTodosCupones(req, res) {
    try {
        const cupones = await Cupon.find().sort({ creadoEn: -1 });
        res.json(cupones);
    } catch (err) {
        console.error('Error obteniendo cupones:', err.message);
        res.status(500).json({ error: 'Error al obtener cupones' });
    }
}

/**
 * POST /api/admin/cupones
 * Crear cupón (admin)
 */
async function crearCupon(req, res) {
    try {
        const { codigo, descuento, tipo, limite, expira } = req.body;
        
        if (!codigo || !descuento) {
            return res.status(400).json({ error: 'Código y descuento son obligatorios' });
        }
        
        const existe = await Cupon.findOne({ codigo: codigo.toUpperCase() });
        if (existe) return res.status(400).json({ error: 'Ya existe un cupón con ese código' });
        
        const cupon = new Cupon({
            codigo: codigo.toUpperCase(),
            descuento,
            tipo: tipo || 'porcentaje',
            limite: limite || 0,
            expira: expira || null
        });
        
        await cupon.save();
        res.json({ mensaje: 'Cupón creado ✅', cupon });
    } catch (err) {
        console.error('Error creando cupón:', err.message);
        res.status(500).json({ error: 'Error al crear cupón' });
    }
}

/**
 * PUT /api/admin/cupones/:id
 * Actualizar cupón (admin)
 */
async function actualizarCupon(req, res) {
    try {
        const cupon = await Cupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!cupon) return res.status(404).json({ error: 'Cupón no encontrado' });
        res.json({ mensaje: 'Cupón actualizado ✅', cupon });
    } catch (err) {
        console.error('Error actualizando cupón:', err.message);
        res.status(500).json({ error: 'Error al actualizar cupón' });
    }
}

/**
 * DELETE /api/admin/cupones/:id
 * Eliminar cupón (admin)
 */
async function eliminarCupon(req, res) {
    try {
        await Cupon.findByIdAndDelete(req.params.id);
        res.json({ mensaje: 'Cupón eliminado' });
    } catch (err) {
        console.error('Error eliminando cupón:', err.message);
        res.status(500).json({ error: 'Error al eliminar cupón' });
    }
}

/**
 * GET /api/admin/informes
 * Obtener todos los informes (admin)
 */
async function obtenerInformes(req, res) {
    try {
        const informes = await Informe.find().sort({ año: -1, mes: -1 });
        res.json(informes);
    } catch (err) {
        console.error('Error obteniendo informes:', err.message);
        res.status(500).json({ error: 'Error al obtener informes' });
    }
}

/**
 * POST /api/admin/guardar-informe
 * Guardar informe mensual (admin)
 */
async function guardarInforme(req, res) {
    try {
        const { mes, año, estadisticas } = req.body;
        
        if (!mes || !año) {
            return res.status(400).json({ error: 'Mes y año son requeridos' });
        }

        let informe = await Informe.findOne({ mes: parseInt(mes), año: parseInt(año) });

        if (informe) {
            Object.assign(informe, estadisticas, { mes: parseInt(mes), año: parseInt(año) });
        } else {
            informe = new Informe({
                mes: parseInt(mes),
                año: parseInt(año),
                ...estadisticas
            });
        }

        await informe.save();
        console.log(`✅ Informe guardado: ${mes}/${año}`);
        res.json({ mensaje: 'Informe guardado correctamente', informe });
    } catch (err) {
        console.error('Error guardando informe:', err.message);
        res.status(500).json({ error: 'Error al guardar informe' });
    }
}

module.exports = {
    obtenerEstadisticas,
    obtenerTodosPedidos,
    obtenerTodosUsuarios,
    eliminarUsuario,
    obtenerTodasResenas,
    eliminarResenaPorAdmin,
    obtenerTodosProductos,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    obtenerTodosCupones,
    crearCupon,
    actualizarCupon,
    eliminarCupon,
    obtenerInformes,
    guardarInforme
};
