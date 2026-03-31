const express    = require('express');
const mongoose   = require('mongoose');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const cors       = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ══════════════════════════════════════════════
// CONEXIÓN A MONGODB
// ══════════════════════════════════════════════
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Conectado a MongoDB'))
    .catch(err => console.error('❌ Error:', err));


// ══════════════════════════════════════════════
<<<<<<< HEAD
// EMAIL
=======
// CONFIGURACIÓN DE EMAIL
>>>>>>> eb5240d583ab6d3d285e127b57c29d627e2f68ce
// ══════════════════════════════════════════════
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS }
});

async function enviarEmail({ to, subject, html }) {
    try {
        await transporter.sendMail({
            from: `"Tienda X" <${process.env.GMAIL_USER}>`,
            to, subject, html
        });
        console.log('✅ Email enviado a ' + to);
    } catch (err) {
        console.error('❌ Error enviando email:', err.message);
    }
}

function emailConfirmacionUsuario(pedido, usuario) {
    const items = pedido.items.map(i =>
<<<<<<< HEAD
        `<tr><td style="padding:8px;">${i.nombre}</td>
        <td style="padding:8px;text-align:center;">${i.cantidad}</td>
        <td style="padding:8px;text-align:right;">$${(i.precio*i.cantidad).toLocaleString('es-CO')}</td></tr>`
    ).join('');
    const total = pedido.items.reduce((a,i) => a+i.precio*i.cantidad, 0);
    const envioInfo = pedido.envio
        ? `${pedido.envio.nombre} — ${pedido.envio.direccion}, ${pedido.envio.ciudad} — Tel: ${pedido.envio.telefono}`
        : 'N/A';
    return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:2rem;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
        <div style="background:#111;padding:1.5rem;text-align:center;">
            <h1 style="color:#fff;margin:0;">TIENDA X</h1>
            <p style="color:#aaa;margin:4px 0 0;">Confirmación de pedido</p>
        </div>
        <div style="padding:2rem;">
            <h2 style="color:#111;">¡Hola, ${usuario.nombre}!</h2>
            <p>Pedido #${pedido._id.toString().slice(-8).toUpperCase()} confirmado.</p>
            <table style="width:100%;border-collapse:collapse;margin:1rem 0;">
                <thead><tr style="background:#f0f0f0;">
                    <th style="padding:8px;text-align:left;">Producto</th>
                    <th style="padding:8px;">Cant.</th>
                    <th style="padding:8px;text-align:right;">Precio</th>
                </tr></thead>
                <tbody>${items}</tbody>
                <tfoot><tr>
                    <td colspan="2" style="padding:8px;font-weight:700;">Total</td>
                    <td style="padding:8px;font-weight:700;text-align:right;">$${total.toLocaleString('es-CO')}</td>
                </tr></tfoot>
            </table>
            <p><strong>Envío:</strong> ${envioInfo}</p>
            <p><strong>Pago:</strong> ${pedido.metodoPago || 'N/A'}</p>
        </div>
        <div style="background:#f5f5f5;padding:1rem;text-align:center;">
            <p style="margin:0;font-size:0.8rem;color:#aaa;">© 2026 Tienda X</p>
        </div>
=======
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${i.nombre}</td>
        <td style="padding:8px 12px;text-align:center;">${i.cantidad}</td>
        <td style="padding:8px 12px;text-align:right;">$${(i.precio*i.cantidad).toLocaleString('es-CO')}</td></tr>`
    ).join('');
    const total = pedido.items.reduce((a,i) => a+i.precio*i.cantidad, 0);
    return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:2rem;">
    <div style="max-width:580px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
        <div style="background:#111;padding:2rem;text-align:center;"><h1 style="color:#fff;margin:0;">TIENDA X</h1><p style="color:#aaa;margin:4px 0 0;">Confirmación de pedido</p></div>
        <div style="padding:2rem;">
            <h2>¡Hola, ${usuario.nombre}!</h2>
            <p style="color:#555;">Tu pedido fue confirmado. Pedido #${pedido._id.toString().slice(-8).toUpperCase()}</p>
            <table style="width:100%;border-collapse:collapse;margin-bottom:1rem;">
                <thead><tr style="background:#f0f0f0;"><th style="padding:10px;text-align:left;">Producto</th><th style="padding:10px;text-align:center;">Cant.</th><th style="padding:10px;text-align:right;">Precio</th></tr></thead>
                <tbody>${items}</tbody>
                <tfoot><tr><td colspan="2" style="padding:12px;font-weight:700;">Total</td><td style="padding:12px;font-weight:700;text-align:right;">$${total.toLocaleString('es-CO')}</td></tr></tfoot>
            </table>
            <div style="background:#f9f9f9;border-radius:8px;padding:1rem;">
                <p style="margin:0;color:#333;line-height:1.8;">📦 ${pedido.envio.nombre}<br>📍 ${pedido.envio.direccion}, ${pedido.envio.ciudad}, ${pedido.envio.departamento}<br>📞 ${pedido.envio.telefono}<br>💳 ${pedido.metodoPago}${pedido.notas?`<br>📝 ${pedido.notas}`:''}</p>
            </div>
        </div>
        <div style="background:#f5f5f5;padding:1rem;text-align:center;"><p style="margin:0;font-size:0.8rem;color:#aaa;">© 2026 Tienda X</p></div>
>>>>>>> eb5240d583ab6d3d285e127b57c29d627e2f68ce
    </div></body></html>`;
}

function emailNuevoPedidoAdmin(pedido, usuario) {
    const total = pedido.items.reduce((a,i) => a+i.precio*i.cantidad, 0);
<<<<<<< HEAD
    const items = pedido.items.map(i => `${i.nombre} x${i.cantidad}`).join(', ');
    return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;padding:2rem;">
    <h2>🛍️ Nuevo pedido #${pedido._id.toString().slice(-8).toUpperCase()}</h2>
    <p><b>Cliente:</b> ${usuario.nombre} (${usuario.email})</p>
    <p><b>Total:</b> $${total.toLocaleString('es-CO')} | <b>Pago:</b> ${pedido.metodoPago || 'N/A'}</p>
    <p><b>Productos:</b> ${items}</p>
    ${pedido.envio ? `<p><b>Envío:</b> ${pedido.envio.nombre}, ${pedido.envio.direccion}, ${pedido.envio.ciudad} — Tel: ${pedido.envio.telefono}</p>` : ''}
    </body></html>`;
}

function emailCambioEstado(pedido, usuario, estado) {
    const info = {
        enviado:   { emoji:'🚚', titulo:'¡Tu pedido está en camino!' },
        entregado: { emoji:'✅', titulo:'¡Pedido entregado!' }
    };
    const { emoji, titulo } = info[estado] || { emoji:'📦', titulo:'Actualización de pedido' };
    return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;padding:2rem;">
    <h2>${emoji} ${titulo}</h2>
    <p>Hola <b>${usuario.nombre}</b>, el estado de tu pedido #${pedido._id.toString().slice(-8).toUpperCase()} es ahora: <b>${estado}</b>.</p>
    ${pedido.tracking ? `<p><b>Número de guía:</b> ${pedido.tracking}</p>` : ''}
    </body></html>`;
=======
    const items = pedido.items.map(i => `${i.nombre} x${i.cantidad} - $${(i.precio*i.cantidad).toLocaleString('es-CO')}`).join('<br>');
    return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;padding:2rem;">
    <h2>🛍️ Nuevo pedido #${pedido._id.toString().slice(-8).toUpperCase()}</h2>
    <p><b>Cliente:</b> ${usuario.nombre} (${usuario.email})</p>
    <p><b>Total:</b> $${total.toLocaleString('es-CO')} | <b>Pago:</b> ${pedido.metodoPago}</p>
    <p><b>Productos:</b><br>${items}</p>
    <p><b>Envío:</b> ${pedido.envio.nombre}, ${pedido.envio.direccion}, ${pedido.envio.ciudad} — Tel: ${pedido.envio.telefono}</p>
    </body></html>`;
}

function emailCambioEstado(pedido, usuario, estadoNuevo) {
    const info = {
        enviado:   { emoji:'🚚', titulo:'¡Tu pedido está en camino!', msg:'Tu pedido ha sido enviado.' },
        entregado: { emoji:'✅', titulo:'¡Pedido entregado!', msg:'Tu pedido fue entregado. ¡Que lo disfrutes!' }
    };
    const { emoji, titulo, msg } = info[estadoNuevo] || { emoji:'📦', titulo:'Actualización de pedido', msg:`Estado: ${estadoNuevo}` };
    return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;padding:2rem;background:#f5f5f5;">
    <div style="max-width:500px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
        <div style="background:#111;padding:2rem;text-align:center;"><p style="font-size:3rem;margin:0;">${emoji}</p><h2 style="color:#fff;margin:0.5rem 0 0;">${titulo}</h2></div>
        <div style="padding:2rem;"><p>Hola <b>${usuario.nombre}</b>, ${msg}</p>
        <p style="color:#555;">Pedido #${pedido._id.toString().slice(-8).toUpperCase()} — Estado: <b>${estadoNuevo}</b><br>Dirección: ${pedido.envio.direccion}, ${pedido.envio.ciudad}</p>
        <p>Gracias por comprar en Tienda X 💙</p></div>
    </div></body></html>`;
>>>>>>> eb5240d583ab6d3d285e127b57c29d627e2f68ce
}


// ══════════════════════════════════════════════
// MODELOS
// ══════════════════════════════════════════════
const usuarioSchema = new mongoose.Schema({
    nombre:   { type: String, required: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    rol:      { type: String, default: 'usuario', enum: ['usuario', 'admin'] },
    creadoEn: { type: Date, default: Date.now }
});

const pedidoSchema = new mongoose.Schema({
    usuario:    { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    items:      [{ nombre: String, precio: Number, cantidad: Number, img: String }],
<<<<<<< HEAD
    envio: {
        nombre: String, telefono: String,
        direccion: String, ciudad: String, departamento: String
    },
    metodoPago: { type: String, default: '' },
    notas:      { type: String, default: '' },
    tracking:   { type: String, default: '' },
=======
    envio:      { nombre: String, telefono: String, direccion: String, ciudad: String, departamento: String },
    metodoPago: { type: String, default: '' },
    notas:      { type: String, default: '' },
>>>>>>> eb5240d583ab6d3d285e127b57c29d627e2f68ce
    estado:     { type: String, default: 'pendiente', enum: ['pendiente', 'enviado', 'entregado'] },
    fecha:      { type: Date, default: Date.now }
});

<<<<<<< HEAD
const direccionSchema = new mongoose.Schema({
    usuario:      { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    nombre: String, destinatario: String, calle: String,
    ciudad: String, departamento: String, telefono: String
});

const favoritoSchema = new mongoose.Schema({
    usuario:      { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    nombre: String, precio: Number, imagen_front: String, categoria: String
});

=======
const productoSchema = new mongoose.Schema({
    nombre:       { type: String, required: true },
    categoria:    { type: String, required: true },
    genero:       { type: String, required: true, enum: ['hombre', 'mujer', 'niño'] },
    precio:       { type: Number, required: true },
    rating:       { type: Number, default: 5, min: 1, max: 5 },
    imagen_front: { type: String, default: '' },
    imagen_back:  { type: String, default: '' },
    descripcion:  { type: String, default: '' },
    activo:       { type: Boolean, default: true },
    creadoEn:     { type: Date, default: Date.now }
});

const direccionSchema = new mongoose.Schema({
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    nombre: String, destinatario: String, calle: String,
    ciudad: String, departamento: String, telefono: String
});

const favoritoSchema = new mongoose.Schema({
    usuario:      { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    nombre: String, precio: Number, imagen_front: String, categoria: String
});

>>>>>>> eb5240d583ab6d3d285e127b57c29d627e2f68ce
const carritoSchema = new mongoose.Schema({
    usuario:       { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true, unique: true },
    items:         [{ nombre: String, precio: Number, cantidad: Number, img: String }],
    actualizadoEn: { type: Date, default: Date.now }
});

const resenaSchema = new mongoose.Schema({
    productoNombre: { type: String, required: true },
    usuario:        { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    nombreUsuario:  { type: String, required: true },
    estrellas:      { type: Number, required: true, min: 1, max: 5 },
    comentario:     { type: String, required: true },
    fecha:          { type: Date, default: Date.now }
});

<<<<<<< HEAD
const productoSchema = new mongoose.Schema({
    nombre:       { type: String, required: true },
    categoria:    { type: String, required: true },
    genero:       { type: String, required: true, enum: ['hombre', 'mujer', 'niño'] },
    precio:       { type: Number, required: true },
    rating:       { type: Number, default: 5, min: 1, max: 5 },
    imagen_front: { type: String, default: '' },
    imagen_back:  { type: String, default: '' },
    descripcion:  { type: String, default: '' },
    activo:       { type: Boolean, default: true },
    creadoEn:     { type: Date, default: Date.now }
});

const cuponSchema = new mongoose.Schema({
    codigo:     { type: String, required: true, unique: true, uppercase: true },
    descuento:  { type: Number, required: true },
    tipo:       { type: String, default: 'porcentaje', enum: ['porcentaje', 'fijo'] },
    limite:     { type: Number, default: 0 },
    usados:     { type: Number, default: 0 },
    activo:     { type: Boolean, default: true },
    expira:     { type: Date, default: null },
    creadoEn:   { type: Date, default: Date.now }
});

const Usuario   = mongoose.model('Usuario',   usuarioSchema);
const Pedido    = mongoose.model('Pedido',    pedidoSchema);
=======
const Usuario   = mongoose.model('Usuario',   usuarioSchema);
const Pedido    = mongoose.model('Pedido',    pedidoSchema);
const Producto  = mongoose.model('Producto',  productoSchema);
>>>>>>> eb5240d583ab6d3d285e127b57c29d627e2f68ce
const Direccion = mongoose.model('Direccion', direccionSchema);
const Favorito  = mongoose.model('Favorito',  favoritoSchema);
const Carrito   = mongoose.model('Carrito',   carritoSchema);
const Resena    = mongoose.model('Resena',    resenaSchema);
<<<<<<< HEAD
const Producto  = mongoose.model('Producto',  productoSchema);
const Cupon     = mongoose.model('Cupon',     cuponSchema);
=======
>>>>>>> eb5240d583ab6d3d285e127b57c29d627e2f68ce


// ══════════════════════════════════════════════
// MIDDLEWARES
// ══════════════════════════════════════════════
function verificarToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No autorizado' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch {
        return res.status(401).json({ error: 'Token inválido' });
<<<<<<< HEAD
    }
}

async function verificarAdmin(req, res, next) {
    try {
        const usuario = await Usuario.findById(req.userId);
        if (!usuario || usuario.rol !== 'admin')
            return res.status(403).json({ error: 'Acceso denegado — se requiere rol admin' });
        req.usuario = usuario;
        next();
    } catch {
        return res.status(500).json({ error: 'Error verificando permisos' });
=======
>>>>>>> eb5240d583ab6d3d285e127b57c29d627e2f68ce
    }
}

async function verificarAdmin(req, res, next) {
    const usuario = await Usuario.findById(req.userId);
    if (!usuario || usuario.rol !== 'admin')
        return res.status(403).json({ error: 'Acceso denegado — se requiere rol admin' });
    req.usuario = usuario;
    next();
}

<<<<<<< HEAD
=======

>>>>>>> eb5240d583ab6d3d285e127b57c29d627e2f68ce
// ══════════════════════════════════════════════
// RUTAS: AUTH
// ══════════════════════════════════════════════
app.post('/api/registrarse', async (req, res) => {
    const { nombre, email, password } = req.body;
    if (!nombre || !email || !password)
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    const existe = await Usuario.findOne({ email });
    if (existe) return res.status(400).json({ error: 'El email ya está registrado' });
    const hash    = await bcrypt.hash(password, 10);
    const usuario = new Usuario({ nombre, email, password: hash });
    await usuario.save();
    res.json({ mensaje: 'Cuenta creada correctamente ✅' });
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const usuario = await Usuario.findOne({ email });
    if (!usuario) return res.status(400).json({ error: 'Email o contraseña incorrectos' });
    const valido = await bcrypt.compare(password, usuario.password);
    if (!valido) return res.status(400).json({ error: 'Email o contraseña incorrectos' });
    const token = jwt.sign({ id: usuario._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, nombre: usuario.nombre, rol: usuario.rol });
});

<<<<<<< HEAD
app.post('/api/admin/login', async (req, res) => {
    const { password } = req.body;
    if (password !== process.env.ADMIN_PASSWORD)
        return res.status(401).json({ error: 'Contraseña incorrecta' });
    let admin = await Usuario.findOne({ rol: 'admin' });
    if (!admin) {
        try {
            const hash = await bcrypt.hash(password, 10);
            admin = new Usuario({ nombre: 'Administrador', email: 'admin@tiendax.internal', password: hash, rol: 'admin' });
            await admin.save();
        } catch {
            admin = await Usuario.findOne({ email: 'admin@tiendax.internal' });
            if (!admin) return res.status(500).json({ error: 'Error creando admin' });
        }
    }
=======
// Login especial para admin
app.post('/api/admin/login', async (req, res) => {
    const { password } = req.body;

    // Verificar contraseña
    if (password !== process.env.ADMIN_PASSWORD)
        return res.status(401).json({ error: 'Contraseña incorrecta' });

    // Buscar admin existente
    let admin = await Usuario.findOne({ rol: 'admin' });

    // Si no existe, crearlo con email único de admin
    if (!admin) {
        try {
            const hash = await bcrypt.hash(password, 10);
            admin = new Usuario({
                nombre:   'Administrador',
                email:    'admin@tiendax.internal',
                password: hash,
                rol:      'admin'
            });
            await admin.save();
        } catch (err) {
            // Si falla por email duplicado, buscar por email interno
            admin = await Usuario.findOne({ email: 'admin@tiendax.internal' });
            if (!admin) return res.status(500).json({ error: 'Error al crear cuenta admin' });
        }
    }

>>>>>>> eb5240d583ab6d3d285e127b57c29d627e2f68ce
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, nombre: admin.nombre });
});


// ══════════════════════════════════════════════
// RUTAS: PERFIL
// ══════════════════════════════════════════════
app.get('/api/perfil', verificarToken, async (req, res) => {
    const usuario = await Usuario.findById(req.userId).select('-password');
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    const pedidos = await Pedido.find({ usuario: req.userId });
    res.json({ ...usuario.toObject(), pedidos });
});

app.put('/api/perfil', verificarToken, async (req, res) => {
    const { nombre, email, passwordActual, passwordNueva } = req.body;
    const usuario = await Usuario.findById(req.userId);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    const valido = await bcrypt.compare(passwordActual, usuario.password);
    if (!valido) return res.status(400).json({ error: 'Contraseña actual incorrecta' });
    usuario.nombre = nombre || usuario.nombre;
    usuario.email  = email  || usuario.email;
    if (passwordNueva && passwordNueva.length >= 6)
        usuario.password = await bcrypt.hash(passwordNueva, 10);
    await usuario.save();
    res.json({ mensaje: 'Perfil actualizado ✅' });
});


// ══════════════════════════════════════════════
// RUTAS: PEDIDOS
// ══════════════════════════════════════════════
app.get('/api/pedidos', verificarToken, async (req, res) => {
    const pedidos = await Pedido.find({ usuario: req.userId }).sort({ fecha: -1 });
    res.json(pedidos);
});

<<<<<<< HEAD
app.get('/api/pedidos/:id', verificarToken, async (req, res) => {
    const pedido = await Pedido.findOne({ _id: req.params.id, usuario: req.userId });
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json(pedido);
});

app.post('/api/pedidos', verificarToken, async (req, res) => {
    const { items, envio, metodoPago, notas } = req.body;
    if (!items || items.length === 0)
        return res.status(400).json({ error: 'El pedido está vacío' });
    if (!envio || !envio.nombre || !envio.direccion || !envio.ciudad)
        return res.status(400).json({ error: 'Faltan datos de envío' });
    if (!metodoPago)
        return res.status(400).json({ error: 'Selecciona un método de pago' });

    const pedido  = new Pedido({ usuario: req.userId, items, envio, metodoPago, notas: notas || '' });
    await pedido.save();

    const usuario = await Usuario.findById(req.userId).select('nombre email');
    if (usuario?.email) enviarEmail({
        to: usuario.email,
        subject: `Tienda X — Pedido #${pedido._id.toString().slice(-8).toUpperCase()} confirmado`,
        html: emailConfirmacionUsuario(pedido, usuario)
    });
    if (process.env.EMAIL_ADMIN && usuario) enviarEmail({
        to: process.env.EMAIL_ADMIN,
        subject: `Nuevo pedido #${pedido._id.toString().slice(-8).toUpperCase()}`,
        html: emailNuevoPedidoAdmin(pedido, usuario)
    });
=======
app.post('/api/pedidos', verificarToken, async (req, res) => {
    const { items, envio, metodoPago, notas } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ error: 'El pedido está vacío' });
    if (!envio || !envio.nombre || !envio.direccion || !envio.ciudad) return res.status(400).json({ error: 'Faltan datos de envío' });
    if (!metodoPago) return res.status(400).json({ error: 'Selecciona un método de pago' });

    const pedido  = new Pedido({ usuario: req.userId, items, envio, metodoPago, notas: notas || '' });
    await pedido.save();
    const usuario = await Usuario.findById(req.userId).select('nombre email');

    if (usuario?.email) enviarEmail({ to: usuario.email, subject: `Tienda X — Pedido #${pedido._id.toString().slice(-8).toUpperCase()} confirmado`, html: emailConfirmacionUsuario(pedido, usuario) });
    if (process.env.EMAIL_ADMIN && usuario) enviarEmail({ to: process.env.EMAIL_ADMIN, subject: `Nuevo pedido #${pedido._id.toString().slice(-8).toUpperCase()}`, html: emailNuevoPedidoAdmin(pedido, usuario) });
>>>>>>> eb5240d583ab6d3d285e127b57c29d627e2f68ce

    res.json({ mensaje: 'Pedido creado ✅', pedido });
});

app.put('/api/pedidos/:id/estado', verificarToken, async (req, res) => {
    const { estado } = req.body;
    if (!['pendiente','enviado','entregado'].includes(estado))
        return res.status(400).json({ error: 'Estado no válido' });
    const pedido = await Pedido.findById(req.params.id);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    pedido.estado = estado;
    await pedido.save();
    if (estado === 'enviado' || estado === 'entregado') {
        const usuario = await Usuario.findById(pedido.usuario).select('nombre email');
        if (usuario?.email) enviarEmail({
            to: usuario.email,
            subject: estado === 'enviado' ? `Tu pedido está en camino 🚚` : `Tu pedido fue entregado ✅`,
            html: emailCambioEstado(pedido, usuario, estado)
        });
    }
    res.json({ mensaje: `Estado actualizado a "${estado}" ✅`, pedido });
<<<<<<< HEAD
});

app.put('/api/pedidos/:id/tracking', verificarToken, verificarAdmin, async (req, res) => {
    const { tracking } = req.body;
    const pedido = await Pedido.findByIdAndUpdate(req.params.id, { tracking }, { new: true });
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json({ mensaje: 'Número de guía actualizado ✅', pedido });
=======
>>>>>>> eb5240d583ab6d3d285e127b57c29d627e2f68ce
});


// ══════════════════════════════════════════════
<<<<<<< HEAD
// RUTAS: DIRECCIONES
// ══════════════════════════════════════════════
app.get('/api/direcciones', verificarToken, async (req, res) => {
    res.json(await Direccion.find({ usuario: req.userId }));
});

app.post('/api/direcciones', verificarToken, async (req, res) => {
    const { nombre, destinatario, calle, ciudad, departamento, telefono } = req.body;
    if (!nombre || !calle || !ciudad)
        return res.status(400).json({ error: 'Nombre, calle y ciudad son obligatorios' });
=======
// RUTAS: ADMIN
// ══════════════════════════════════════════════

// Estadísticas generales
app.get('/api/admin/estadisticas', verificarToken, verificarAdmin, async (req, res) => {
    const [totalPedidos, totalUsuarios, totalResenas, pedidos] = await Promise.all([
        Pedido.countDocuments(),
        Usuario.countDocuments({ rol: 'usuario' }),
        Resena.countDocuments(),
        Pedido.find()
    ]);
    const ingresoTotal    = pedidos.reduce((a, p) => a + p.items.reduce((b, i) => b + i.precio * i.cantidad, 0), 0);
    const pedidosPendientes = pedidos.filter(p => p.estado === 'pendiente').length;
    const pedidosEnviados   = pedidos.filter(p => p.estado === 'enviado').length;
    const pedidosEntregados = pedidos.filter(p => p.estado === 'entregado').length;

    // Ventas por mes (últimos 6 meses)
    const hace6Meses = new Date();
    hace6Meses.setMonth(hace6Meses.getMonth() - 5);
    const ventasPorMes = await Pedido.aggregate([
        { $match: { fecha: { $gte: hace6Meses } } },
        { $group: {
            _id: { mes: { $month: '$fecha' }, año: { $year: '$fecha' } },
            total: { $sum: { $reduce: { input: '$items', initialValue: 0, in: { $add: ['$$value', { $multiply: ['$$this.precio', '$$this.cantidad'] }] } } } },
            cantidad: { $sum: 1 }
        }},
        { $sort: { '_id.año': 1, '_id.mes': 1 } }
    ]);

    res.json({ totalPedidos, totalUsuarios, totalResenas, ingresoTotal, pedidosPendientes, pedidosEnviados, pedidosEntregados, ventasPorMes });
});

// Todos los pedidos
app.get('/api/admin/pedidos', verificarToken, verificarAdmin, async (req, res) => {
    const pedidos = await Pedido.find().populate('usuario', 'nombre email').sort({ fecha: -1 });
    res.json(pedidos);
});

// Todos los usuarios
app.get('/api/admin/usuarios', verificarToken, verificarAdmin, async (req, res) => {
    const usuarios = await Usuario.find({ rol: 'usuario' }).select('-password').sort({ creadoEn: -1 });
    res.json(usuarios);
});

// Eliminar usuario
app.delete('/api/admin/usuarios/:id', verificarToken, verificarAdmin, async (req, res) => {
    await Usuario.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Usuario eliminado' });
});

// Todas las reseñas
app.get('/api/admin/resenas', verificarToken, verificarAdmin, async (req, res) => {
    const resenas = await Resena.find().sort({ fecha: -1 });
    res.json(resenas);
});

// Eliminar reseña (admin)
app.delete('/api/admin/resenas/:id', verificarToken, verificarAdmin, async (req, res) => {
    await Resena.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Reseña eliminada' });
});

// Obtener productos (admin)
app.get('/api/admin/productos', verificarToken, verificarAdmin, async (req, res) => {
    const productos = await Producto.find().sort({ creadoEn: -1 });
    res.json(productos);
});

// Crear producto
app.post('/api/admin/productos', verificarToken, verificarAdmin, async (req, res) => {
    const { nombre, categoria, genero, precio, rating, imagen_front, imagen_back, descripcion } = req.body;
    if (!nombre || !categoria || !genero || !precio)
        return res.status(400).json({ error: 'Nombre, categoría, género y precio son obligatorios' });
    const producto = new Producto({ nombre, categoria, genero, precio, rating: rating || 5, imagen_front, imagen_back, descripcion });
    await producto.save();
    res.json({ mensaje: 'Producto creado ✅', producto });
});

// Editar producto
app.put('/api/admin/productos/:id', verificarToken, verificarAdmin, async (req, res) => {
    const producto = await Producto.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ mensaje: 'Producto actualizado ✅', producto });
});

// Eliminar producto
app.delete('/api/admin/productos/:id', verificarToken, verificarAdmin, async (req, res) => {
    await Producto.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Producto eliminado' });
});

// ─── RUTA PÚBLICA: productos por género ────────
app.get('/api/productos/:genero', async (req, res) => {
    const { genero } = req.params;
    const generosValidos = ['hombre', 'mujer', 'niño', 'todos'];

    if (!generosValidos.includes(genero))
        return res.status(400).json({ error: 'Género no válido' });

    const filtro = genero === 'todos' ? { activo: true } : { genero, activo: true };
    const productos = await Producto.find(filtro).sort({ creadoEn: -1 });
    res.json(productos);
});

// Exportar ventas a Excel (CSV)
app.get('/api/admin/exportar-ventas', verificarToken, verificarAdmin, async (req, res) => {
    const pedidos = await Pedido.find().populate('usuario', 'nombre email').sort({ fecha: -1 });

    let csv = 'Pedido,Fecha,Cliente,Email,Productos,Total,Metodo Pago,Estado,Ciudad\n';
    pedidos.forEach(p => {
        const id     = p._id.toString().slice(-8).toUpperCase();
        const fecha  = new Date(p.fecha).toLocaleDateString('es-CO');
        const nombre = p.usuario?.nombre || 'N/A';
        const email  = p.usuario?.email  || 'N/A';
        const prods  = p.items.map(i => `${i.nombre} x${i.cantidad}`).join(' | ');
        const total  = p.items.reduce((a, i) => a + i.precio * i.cantidad, 0);
        const pago   = p.metodoPago || 'N/A';
        const estado = p.estado;
        const ciudad = p.envio?.ciudad || 'N/A';
        csv += `"${id}","${fecha}","${nombre}","${email}","${prods}","$${total.toLocaleString('es-CO')}","${pago}","${estado}","${ciudad}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="ventas-tiendax.csv"');
    res.send('\uFEFF' + csv); // BOM para que Excel lo abra correctamente
});


// ══════════════════════════════════════════════
// RUTAS: DIRECCIONES
// ══════════════════════════════════════════════
app.get('/api/direcciones', verificarToken, async (req, res) => {
    const dirs = await Direccion.find({ usuario: req.userId });
    res.json(dirs);
});
app.post('/api/direcciones', verificarToken, async (req, res) => {
    const { nombre, destinatario, calle, ciudad, departamento, telefono } = req.body;
    if (!nombre || !calle || !ciudad) return res.status(400).json({ error: 'Nombre, calle y ciudad son obligatorios' });
>>>>>>> eb5240d583ab6d3d285e127b57c29d627e2f68ce
    const dir = new Direccion({ usuario: req.userId, nombre, destinatario, calle, ciudad, departamento, telefono });
    await dir.save();
    res.json({ mensaje: 'Dirección guardada ✅', dir });
});
<<<<<<< HEAD

=======
>>>>>>> eb5240d583ab6d3d285e127b57c29d627e2f68ce
app.delete('/api/direcciones/:id', verificarToken, async (req, res) => {
    await Direccion.findOneAndDelete({ _id: req.params.id, usuario: req.userId });
    res.json({ mensaje: 'Dirección eliminada' });
});


// ══════════════════════════════════════════════
// RUTAS: FAVORITOS
// ══════════════════════════════════════════════
app.get('/api/favoritos', verificarToken, async (req, res) => {
    res.json(await Favorito.find({ usuario: req.userId }));
});
<<<<<<< HEAD

=======
>>>>>>> eb5240d583ab6d3d285e127b57c29d627e2f68ce
app.post('/api/favoritos', verificarToken, async (req, res) => {
    const { nombre, precio, imagen_front, categoria } = req.body;
    const existe = await Favorito.findOne({ usuario: req.userId, nombre });
    if (existe) return res.status(400).json({ error: 'Ya está en favoritos' });
    const fav = new Favorito({ usuario: req.userId, nombre, precio, imagen_front, categoria });
    await fav.save();
    res.json({ mensaje: 'Agregado a favoritos ✅' });
});
<<<<<<< HEAD

=======
>>>>>>> eb5240d583ab6d3d285e127b57c29d627e2f68ce
app.delete('/api/favoritos/:id', verificarToken, async (req, res) => {
    await Favorito.findOneAndDelete({ _id: req.params.id, usuario: req.userId });
    res.json({ mensaje: 'Favorito eliminado' });
});


// ══════════════════════════════════════════════
// RUTAS: CARRITO
// ══════════════════════════════════════════════
app.get('/api/carrito', verificarToken, async (req, res) => {
    const c = await Carrito.findOne({ usuario: req.userId });
    res.json(c ? c.items : []);
});
<<<<<<< HEAD

app.put('/api/carrito', verificarToken, async (req, res) => {
    await Carrito.findOneAndUpdate(
        { usuario: req.userId },
        { items: req.body.items, actualizadoEn: new Date() },
        { upsert: true }
    );
    res.json({ mensaje: 'Carrito guardado' });
});

=======
app.put('/api/carrito', verificarToken, async (req, res) => {
    await Carrito.findOneAndUpdate({ usuario: req.userId }, { items: req.body.items, actualizadoEn: new Date() }, { upsert: true });
    res.json({ mensaje: 'Carrito guardado' });
});
>>>>>>> eb5240d583ab6d3d285e127b57c29d627e2f68ce
app.delete('/api/carrito', verificarToken, async (req, res) => {
    await Carrito.findOneAndDelete({ usuario: req.userId });
    res.json({ mensaje: 'Carrito vaciado' });
});


// ══════════════════════════════════════════════
// RUTAS: RESEÑAS
// ══════════════════════════════════════════════
app.get('/api/resenas/:productoNombre', async (req, res) => {
    const resenas = await Resena.find({ productoNombre: decodeURIComponent(req.params.productoNombre) }).sort({ fecha: -1 });
    res.json(resenas);
});
<<<<<<< HEAD

app.post('/api/resenas', verificarToken, async (req, res) => {
    const { productoNombre, estrellas, comentario } = req.body;
    if (!productoNombre || !estrellas || !comentario)
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    if (estrellas < 1 || estrellas > 5)
        return res.status(400).json({ error: 'Estrellas entre 1 y 5' });
=======
app.post('/api/resenas', verificarToken, async (req, res) => {
    const { productoNombre, estrellas, comentario } = req.body;
    if (!productoNombre || !estrellas || !comentario) return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    if (estrellas < 1 || estrellas > 5) return res.status(400).json({ error: 'Estrellas entre 1 y 5' });
>>>>>>> eb5240d583ab6d3d285e127b57c29d627e2f68ce
    const existe = await Resena.findOne({ productoNombre, usuario: req.userId });
    if (existe) return res.status(400).json({ error: 'Ya escribiste una reseña para este producto' });
    const usuario = await Usuario.findById(req.userId).select('nombre');
    const resena  = new Resena({ productoNombre, usuario: req.userId, nombreUsuario: usuario.nombre, estrellas, comentario });
    await resena.save();
    res.json({ mensaje: 'Reseña publicada ✅', resena });
});
<<<<<<< HEAD

=======
>>>>>>> eb5240d583ab6d3d285e127b57c29d627e2f68ce
app.delete('/api/resenas/:id', verificarToken, async (req, res) => {
    await Resena.findOneAndDelete({ _id: req.params.id, usuario: req.userId });
    res.json({ mensaje: 'Reseña eliminada' });
});


// ══════════════════════════════════════════════
<<<<<<< HEAD
// RUTAS: PRODUCTOS (pública)
// ══════════════════════════════════════════════
app.get('/api/productos/:genero', async (req, res) => {
    const { genero } = req.params;
    if (!['hombre','mujer','niño','todos'].includes(genero))
        return res.status(400).json({ error: 'Género no válido' });
    const filtro   = genero === 'todos' ? { activo: true } : { genero, activo: true };
    const productos = await Producto.find(filtro).sort({ creadoEn: -1 });
    res.json(productos);
});


// ══════════════════════════════════════════════
// RUTAS: CUPONES
// ══════════════════════════════════════════════
app.post('/api/cupones/validar', async (req, res) => {
    const { codigo, total } = req.body;
    if (!codigo) return res.status(400).json({ error: 'Ingresa un código' });

    const cupon = await Cupon.findOne({ codigo: codigo.toUpperCase() });
    if (!cupon || !cupon.activo)
        return res.status(404).json({ error: 'Cupón no válido o inactivo' });
    if (cupon.expira && new Date() > cupon.expira)
        return res.status(400).json({ error: 'Este cupón ya expiró' });
    if (cupon.limite > 0 && cupon.usados >= cupon.limite)
        return res.status(400).json({ error: 'Este cupón ya alcanzó su límite de usos' });

    const descuento = cupon.tipo === 'porcentaje'
        ? Math.round(total * cupon.descuento / 100)
        : cupon.descuento;

    res.json({ valido: true, descuento, tipo: cupon.tipo, valor: cupon.descuento, codigo: cupon.codigo });
});


// ══════════════════════════════════════════════
// RUTAS: ADMIN
// ══════════════════════════════════════════════
app.get('/api/admin/estadisticas', verificarToken, verificarAdmin, async (req, res) => {
    const [totalPedidos, totalUsuarios, totalResenas, pedidos] = await Promise.all([
        Pedido.countDocuments(),
        Usuario.countDocuments({ rol: 'usuario' }),
        Resena.countDocuments(),
        Pedido.find()
    ]);
    const ingresoTotal      = pedidos.reduce((a,p) => a + p.items.reduce((b,i) => b+i.precio*i.cantidad, 0), 0);
    const pedidosPendientes = pedidos.filter(p => p.estado === 'pendiente').length;
    const pedidosEnviados   = pedidos.filter(p => p.estado === 'enviado').length;
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

    res.json({ totalPedidos, totalUsuarios, totalResenas, ingresoTotal,
        pedidosPendientes, pedidosEnviados, pedidosEntregados, ventasPorMes });
});

app.get('/api/admin/pedidos', verificarToken, verificarAdmin, async (req, res) => {
    const pedidos = await Pedido.find().populate('usuario','nombre email').sort({ fecha: -1 });
    res.json(pedidos);
});

app.get('/api/admin/usuarios', verificarToken, verificarAdmin, async (req, res) => {
    const usuarios = await Usuario.find({ rol: 'usuario' }).select('-password').sort({ creadoEn: -1 });
    res.json(usuarios);
});

app.delete('/api/admin/usuarios/:id', verificarToken, verificarAdmin, async (req, res) => {
    await Usuario.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Usuario eliminado' });
});

app.get('/api/admin/resenas', verificarToken, verificarAdmin, async (req, res) => {
    res.json(await Resena.find().sort({ fecha: -1 }));
});

app.delete('/api/admin/resenas/:id', verificarToken, verificarAdmin, async (req, res) => {
    await Resena.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Reseña eliminada' });
});

app.get('/api/admin/productos', verificarToken, verificarAdmin, async (req, res) => {
    res.json(await Producto.find().sort({ creadoEn: -1 }));
});

app.post('/api/admin/productos', verificarToken, verificarAdmin, async (req, res) => {
    const { nombre, categoria, genero, precio, rating, imagen_front, imagen_back, descripcion } = req.body;
    if (!nombre || !categoria || !genero || !precio)
        return res.status(400).json({ error: 'Nombre, categoría, género y precio son obligatorios' });
    const producto = new Producto({ nombre, categoria, genero, precio, rating: rating || 5, imagen_front, imagen_back, descripcion });
    await producto.save();
    res.json({ mensaje: 'Producto creado ✅', producto });
});

app.put('/api/admin/productos/:id', verificarToken, verificarAdmin, async (req, res) => {
    const producto = await Producto.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ mensaje: 'Producto actualizado ✅', producto });
});

app.delete('/api/admin/productos/:id', verificarToken, verificarAdmin, async (req, res) => {
    await Producto.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Producto eliminado' });
});

// Cupones admin
app.get('/api/admin/cupones', verificarToken, verificarAdmin, async (req, res) => {
    res.json(await Cupon.find().sort({ creadoEn: -1 }));
});

app.post('/api/admin/cupones', verificarToken, verificarAdmin, async (req, res) => {
    const { codigo, descuento, tipo, limite, expira } = req.body;
    if (!codigo || !descuento)
        return res.status(400).json({ error: 'Código y descuento son obligatorios' });
    const existe = await Cupon.findOne({ codigo: codigo.toUpperCase() });
    if (existe) return res.status(400).json({ error: 'Ya existe un cupón con ese código' });
    const cupon = new Cupon({ codigo: codigo.toUpperCase(), descuento, tipo: tipo || 'porcentaje', limite: limite || 0, expira: expira || null });
    await cupon.save();
    res.json({ mensaje: 'Cupón creado ✅', cupon });
});

app.put('/api/admin/cupones/:id', verificarToken, verificarAdmin, async (req, res) => {
    const cupon = await Cupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cupon) return res.status(404).json({ error: 'Cupón no encontrado' });
    res.json({ mensaje: 'Cupón actualizado ✅', cupon });
});

app.delete('/api/admin/cupones/:id', verificarToken, verificarAdmin, async (req, res) => {
    await Cupon.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Cupón eliminado' });
});

app.get('/api/admin/exportar-ventas', verificarToken, verificarAdmin, async (req, res) => {
    const pedidos = await Pedido.find().populate('usuario','nombre email').sort({ fecha: -1 });
    let csv = 'Pedido,Fecha,Cliente,Email,Productos,Total,Pago,Estado,Ciudad\n';
    pedidos.forEach(p => {
        const id    = p._id.toString().slice(-8).toUpperCase();
        const fecha = new Date(p.fecha).toLocaleDateString('es-CO');
        const prods = p.items.map(i => `${i.nombre} x${i.cantidad}`).join(' | ');
        const total = p.items.reduce((a,i) => a+i.precio*i.cantidad, 0);
        csv += `"${id}","${fecha}","${p.usuario?.nombre||'N/A'}","${p.usuario?.email||'N/A'}","${prods}","$${total.toLocaleString('es-CO')}","${p.metodoPago||'N/A'}","${p.estado}","${p.envio?.ciudad||'N/A'}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="ventas-tiendax.csv"');
    res.send('\uFEFF' + csv);
});


// ══════════════════════════════════════════════
=======
>>>>>>> eb5240d583ab6d3d285e127b57c29d627e2f68ce
// INICIAR SERVIDOR
// ══════════════════════════════════════════════
app.listen(process.env.PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${process.env.PORT}`);
});