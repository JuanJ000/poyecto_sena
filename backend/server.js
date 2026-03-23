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
// CONFIGURACIÓN DE EMAIL
// ══════════════════════════════════════════════
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
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
        `<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${i.nombre}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">${i.cantidad}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;">$${(i.precio * i.cantidad).toLocaleString('es-CO')}</td>
        </tr>`
    ).join('');
    const total = pedido.items.reduce((a, i) => a + i.precio * i.cantidad, 0);

    return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:2rem;">
    <div style="max-width:580px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        <div style="background:#111;padding:2rem;text-align:center;">
            <h1 style="color:#fff;margin:0;letter-spacing:2px;">TIENDA X</h1>
            <p style="color:#aaa;margin:6px 0 0;">Confirmación de pedido</p>
        </div>
        <div style="padding:2rem;">
            <h2 style="color:#111;">¡Hola, ${usuario.nombre}!</h2>
            <p style="color:#555;">Tu pedido fue confirmado y está siendo procesado.</p>
            <div style="background:#f9f9f9;border-radius:8px;padding:1rem;margin-bottom:1rem;">
                <p style="margin:0;font-size:0.8rem;color:#999;text-transform:uppercase;">Pedido</p>
                <p style="margin:4px 0 0;font-weight:700;color:#111;">#${pedido._id.toString().slice(-8).toUpperCase()}</p>
            </div>
            <table style="width:100%;border-collapse:collapse;margin-bottom:1.5rem;">
                <thead><tr style="background:#f0f0f0;">
                    <th style="padding:10px 12px;text-align:left;font-size:0.82rem;">Producto</th>
                    <th style="padding:10px 12px;text-align:center;font-size:0.82rem;">Cant.</th>
                    <th style="padding:10px 12px;text-align:right;font-size:0.82rem;">Precio</th>
                </tr></thead>
                <tbody>${items}</tbody>
                <tfoot><tr>
                    <td colspan="2" style="padding:12px;font-weight:700;">Total</td>
                    <td style="padding:12px;font-weight:700;text-align:right;">$${total.toLocaleString('es-CO')}</td>
                </tr></tfoot>
            </table>
            <div style="background:#f9f9f9;border-radius:8px;padding:1rem;">
                <p style="margin:0;color:#333;line-height:1.8;font-size:0.9rem;">
                    📦 <strong>${pedido.envio.nombre}</strong><br>
                    📍 ${pedido.envio.direccion}, ${pedido.envio.ciudad}, ${pedido.envio.departamento}<br>
                    📞 ${pedido.envio.telefono}<br>
                    💳 ${pedido.metodoPago}
                    ${pedido.notas ? `<br>📝 ${pedido.notas}` : ''}
                </p>
            </div>
        </div>
        <div style="background:#f5f5f5;padding:1rem;text-align:center;">
            <p style="margin:0;font-size:0.8rem;color:#aaa;">© 2026 Tienda X</p>
        </div>
    </div></body></html>`;
}

function emailNuevoPedidoAdmin(pedido, usuario) {
    const total = pedido.items.reduce((a, i) => a + i.precio * i.cantidad, 0);
    const items = pedido.items.map(i =>
        `<tr>
            <td style="padding:6px 10px;border-bottom:1px solid #eee;">${i.nombre}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center;">${i.cantidad}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;">$${(i.precio * i.cantidad).toLocaleString('es-CO')}</td>
        </tr>`
    ).join('');

    return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;padding:2rem;background:#f5f5f5;">
    <div style="max-width:500px;margin:0 auto;background:#fff;border-radius:12px;padding:2rem;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        <h2 style="color:#111;margin:0 0 1rem;">🛍️ Nuevo pedido recibido</h2>
        <div style="background:#f9f9f9;border-radius:8px;padding:1rem;margin-bottom:1rem;">
            <p style="margin:0;font-size:0.88rem;color:#555;line-height:1.8;">
                <strong>Cliente:</strong> ${usuario.nombre} (${usuario.email})<br>
                <strong>Pedido #:</strong> ${pedido._id.toString().slice(-8).toUpperCase()}<br>
                <strong>Total:</strong> $${total.toLocaleString('es-CO')}<br>
                <strong>Pago:</strong> ${pedido.metodoPago}
            </p>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:1rem;">
            <thead><tr style="background:#f0f0f0;">
                <th style="padding:8px 10px;text-align:left;font-size:0.8rem;">Producto</th>
                <th style="padding:8px 10px;text-align:center;font-size:0.8rem;">Cant.</th>
                <th style="padding:8px 10px;text-align:right;font-size:0.8rem;">Precio</th>
            </tr></thead>
            <tbody>${items}</tbody>
        </table>
        <div style="background:#f9f9f9;border-radius:8px;padding:1rem;">
            <p style="margin:0;font-size:0.88rem;color:#555;line-height:1.8;">
                <strong>Envío a:</strong> ${pedido.envio.nombre}<br>
                ${pedido.envio.direccion}, ${pedido.envio.ciudad}, ${pedido.envio.departamento}<br>
                📞 ${pedido.envio.telefono}
                ${pedido.notas ? `<br>📝 ${pedido.notas}` : ''}
            </p>
        </div>
    </div></body></html>`;
}

function emailCambioEstado(pedido, usuario, estadoNuevo) {
    const info = {
        enviado:   { emoji: '🚚', titulo: '¡Tu pedido está en camino!', msg: 'Tu pedido ha sido enviado y está en camino.' },
        entregado: { emoji: '✅', titulo: '¡Pedido entregado!',         msg: 'Tu pedido ha sido entregado. ¡Esperamos que lo disfrutes!' }
    };
    const { emoji, titulo, msg } = info[estadoNuevo] || { emoji: '📦', titulo: 'Actualización de pedido', msg: `Estado: ${estadoNuevo}` };

    return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;padding:2rem;background:#f5f5f5;">
    <div style="max-width:500px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
        <div style="background:#111;padding:2rem;text-align:center;">
            <p style="font-size:3rem;margin:0;">${emoji}</p>
            <h2 style="color:#fff;margin:0.5rem 0 0;">${titulo}</h2>
        </div>
        <div style="padding:2rem;">
            <p>Hola <strong>${usuario.nombre}</strong>,</p>
            <p style="color:#555;">${msg}</p>
            <div style="background:#f9f9f9;border-radius:8px;padding:1rem;">
                <p style="margin:0;font-size:0.88rem;color:#555;line-height:1.8;">
                    <strong>Pedido #:</strong> ${pedido._id.toString().slice(-8).toUpperCase()}<br>
                    <strong>Estado:</strong> ${estadoNuevo}<br>
                    <strong>Dirección:</strong> ${pedido.envio.direccion}, ${pedido.envio.ciudad}
                </p>
            </div>
            <p style="color:#555;font-size:0.9rem;margin-top:1rem;">Gracias por comprar en Tienda X 💙</p>
        </div>
    </div></body></html>`;
}


// ══════════════════════════════════════════════
// MODELOS
// ══════════════════════════════════════════════

const usuarioSchema = new mongoose.Schema({
    nombre:   { type: String, required: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    creadoEn: { type: Date, default: Date.now }
});

const pedidoSchema = new mongoose.Schema({
    usuario:    { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    items:      [{ nombre: String, precio: Number, cantidad: Number, img: String }],
    envio: {
        nombre:       String,
        telefono:     String,
        direccion:    String,
        ciudad:       String,
        departamento: String
    },
    metodoPago: { type: String, default: '' },
    notas:      { type: String, default: '' },
    estado:     { type: String, default: 'pendiente', enum: ['pendiente', 'enviado', 'entregado'] },
    fecha:      { type: Date, default: Date.now }
});

const direccionSchema = new mongoose.Schema({
    usuario:      { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    nombre:       String,
    destinatario: String,
    calle:        String,
    ciudad:       String,
    departamento: String,
    telefono:     String
});

const favoritoSchema = new mongoose.Schema({
    usuario:      { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    nombre:       String,
    precio:       Number,
    imagen_front: String,
    categoria:    String
});

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

const Usuario   = mongoose.model('Usuario',   usuarioSchema);
const Pedido    = mongoose.model('Pedido',    pedidoSchema);
const Direccion = mongoose.model('Direccion', direccionSchema);
const Favorito  = mongoose.model('Favorito',  favoritoSchema);
const Carrito   = mongoose.model('Carrito',   carritoSchema);
const Resena    = mongoose.model('Resena',    resenaSchema);


// ══════════════════════════════════════════════
// MIDDLEWARE: verificar token JWT
// ══════════════════════════════════════════════
function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No autorizado' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch {
        return res.status(401).json({ error: 'Token inválido' });
    }
}


// ══════════════════════════════════════════════
// RUTAS: AUTH
// ══════════════════════════════════════════════

app.post('/api/registrarse', async (req, res) => {
    const { nombre, email, password } = req.body;
    if (!nombre || !email || !password)
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    const existe = await Usuario.findOne({ email });
    if (existe)
        return res.status(400).json({ error: 'El email ya está registrado' });
    const hash = await bcrypt.hash(password, 10);
    const usuario = new Usuario({ nombre, email, password: hash });
    await usuario.save();
    res.json({ mensaje: 'Cuenta creada correctamente ✅' });
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const usuario = await Usuario.findOne({ email });
    if (!usuario)
        return res.status(400).json({ error: 'Email o contraseña incorrectos' });
    const valido = await bcrypt.compare(password, usuario.password);
    if (!valido)
        return res.status(400).json({ error: 'Email o contraseña incorrectos' });
    const token = jwt.sign({ id: usuario._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, nombre: usuario.nombre });
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

app.post('/api/pedidos', verificarToken, async (req, res) => {
    const { items, envio, metodoPago, notas } = req.body;

    if (!items || items.length === 0)
        return res.status(400).json({ error: 'El pedido está vacío' });
    if (!envio || !envio.nombre || !envio.direccion || !envio.ciudad)
        return res.status(400).json({ error: 'Faltan datos de envío' });
    if (!metodoPago)
        return res.status(400).json({ error: 'Selecciona un método de pago' });

    const pedido = new Pedido({ usuario: req.userId, items, envio, metodoPago, notas: notas || '' });
    await pedido.save();

    // Obtener datos del usuario
    const usuario = await Usuario.findById(req.userId).select('nombre email');

    // Email al usuario
    if (usuario && usuario.email) {
        enviarEmail({
            to:      usuario.email,
            subject: `Tienda X — Pedido #${pedido._id.toString().slice(-8).toUpperCase()} confirmado`,
            html:    emailConfirmacionUsuario(pedido, usuario)
        });
    }

    // Email al admin
    if (process.env.EMAIL_ADMIN && usuario) {
        enviarEmail({
            to:      process.env.EMAIL_ADMIN,
            subject: `Nuevo pedido #${pedido._id.toString().slice(-8).toUpperCase()} — $${items.reduce((a,i)=>a+i.precio*i.cantidad,0).toLocaleString('es-CO')}`,
            html:    emailNuevoPedidoAdmin(pedido, usuario)
        });
    }

    res.json({ mensaje: 'Pedido creado ✅', pedido });
});

app.put('/api/pedidos/:id/estado', verificarToken, async (req, res) => {
    const { estado } = req.body;
    const estadosValidos = ['pendiente', 'enviado', 'entregado'];
    if (!estadosValidos.includes(estado))
        return res.status(400).json({ error: 'Estado no válido' });

    const pedido = await Pedido.findById(req.params.id);
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });

    pedido.estado = estado;
    await pedido.save();

    if (estado === 'enviado' || estado === 'entregado') {
        const usuario = await Usuario.findById(pedido.usuario).select('nombre email');
        if (usuario && usuario.email) {
            enviarEmail({
                to:      usuario.email,
                subject: estado === 'enviado'
                    ? `Tienda X — Tu pedido está en camino 🚚`
                    : `Tienda X — Tu pedido fue entregado ✅`,
                html: emailCambioEstado(pedido, usuario, estado)
            });
        }
    }

    res.json({ mensaje: `Estado actualizado a "${estado}" ✅`, pedido });
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
    if (!nombre || !calle || !ciudad)
        return res.status(400).json({ error: 'Nombre, calle y ciudad son obligatorios' });
    const dir = new Direccion({ usuario: req.userId, nombre, destinatario, calle, ciudad, departamento, telefono });
    await dir.save();
    res.json({ mensaje: 'Dirección guardada ✅', dir });
});

app.delete('/api/direcciones/:id', verificarToken, async (req, res) => {
    await Direccion.findOneAndDelete({ _id: req.params.id, usuario: req.userId });
    res.json({ mensaje: 'Dirección eliminada' });
});


// ══════════════════════════════════════════════
// RUTAS: FAVORITOS
// ══════════════════════════════════════════════

app.get('/api/favoritos', verificarToken, async (req, res) => {
    const favs = await Favorito.find({ usuario: req.userId });
    res.json(favs);
});

app.post('/api/favoritos', verificarToken, async (req, res) => {
    const { nombre, precio, imagen_front, categoria } = req.body;
    const existe = await Favorito.findOne({ usuario: req.userId, nombre });
    if (existe) return res.status(400).json({ error: 'Ya está en favoritos' });
    const fav = new Favorito({ usuario: req.userId, nombre, precio, imagen_front, categoria });
    await fav.save();
    res.json({ mensaje: 'Agregado a favoritos ✅' });
});

app.delete('/api/favoritos/:id', verificarToken, async (req, res) => {
    await Favorito.findOneAndDelete({ _id: req.params.id, usuario: req.userId });
    res.json({ mensaje: 'Favorito eliminado' });
});


// ══════════════════════════════════════════════
// RUTAS: CARRITO
// ══════════════════════════════════════════════

app.get('/api/carrito', verificarToken, async (req, res) => {
    const carrito = await Carrito.findOne({ usuario: req.userId });
    res.json(carrito ? carrito.items : []);
});

app.put('/api/carrito', verificarToken, async (req, res) => {
    const { items } = req.body;
    await Carrito.findOneAndUpdate(
        { usuario: req.userId },
        { items, actualizadoEn: new Date() },
        { upsert: true, new: true }
    );
    res.json({ mensaje: 'Carrito guardado' });
});

app.delete('/api/carrito', verificarToken, async (req, res) => {
    await Carrito.findOneAndDelete({ usuario: req.userId });
    res.json({ mensaje: 'Carrito vaciado' });
});


// ══════════════════════════════════════════════
// RUTAS: RESEÑAS
// ══════════════════════════════════════════════

app.get('/api/resenas/:productoNombre', async (req, res) => {
    const nombre  = decodeURIComponent(req.params.productoNombre);
    const resenas = await Resena.find({ productoNombre: nombre }).sort({ fecha: -1 });
    res.json(resenas);
});

app.post('/api/resenas', verificarToken, async (req, res) => {
    const { productoNombre, estrellas, comentario } = req.body;
    if (!productoNombre || !estrellas || !comentario)
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    if (estrellas < 1 || estrellas > 5)
        return res.status(400).json({ error: 'Las estrellas deben ser entre 1 y 5' });
    const existe = await Resena.findOne({ productoNombre, usuario: req.userId });
    if (existe)
        return res.status(400).json({ error: 'Ya escribiste una reseña para este producto' });
    const usuario = await Usuario.findById(req.userId).select('nombre');
    const resena  = new Resena({ productoNombre, usuario: req.userId, nombreUsuario: usuario.nombre, estrellas, comentario });
    await resena.save();
    res.json({ mensaje: 'Reseña publicada ✅', resena });
});

app.delete('/api/resenas/:id', verificarToken, async (req, res) => {
    await Resena.findOneAndDelete({ _id: req.params.id, usuario: req.userId });
    res.json({ mensaje: 'Reseña eliminada' });
});


// ══════════════════════════════════════════════
// INICIAR SERVIDOR
// ══════════════════════════════════════════════
app.listen(process.env.PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${process.env.PORT}`);
});