const express    = require('express');
const mongoose   = require('mongoose');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const cors       = require('cors');
const nodemailer = require('nodemailer');
const path       = require('path');
const rateLimit  = require('express-rate-limit');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

// ══════════════════════════════════════════════
// SEGURIDAD: Headers y CORS
// ══════════════════════════════════════════════
app.use(cors({
    origin: ['http://localhost:3001', 'http://localhost:3000', 'http://127.0.0.1:5501', 'http://127.0.0.1:5500'],
    credentials: true
}));

// Headers de seguridad
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

app.use(express.json({ limit: '10mb' }));

// ══════════════════════════════════════════════
// RATE LIMITING
// ══════════════════════════════════════════════
// ── Mapa de IPs bloqueadas temporalmente ──────
const ipsBloqueadas = new Map(); // ip -> { intentos, bloqueadaHasta }

function registrarIntento(ip) {
    const ahora = Date.now();
    const registro = ipsBloqueadas.get(ip) || { intentos: 0, bloqueadaHasta: 0 };

    // Si el bloqueo ya expiró, resetear
    if (registro.bloqueadaHasta && ahora > registro.bloqueadaHasta) {
        ipsBloqueadas.delete(ip);
        return false;
    }

    // Si está bloqueada
    if (registro.bloqueadaHasta && ahora < registro.bloqueadaHasta) {
        return true;
    }

    registro.intentos++;

    // Bloquear progresivamente: 3 intentos → 5 min, 6 → 30 min, 10 → 24h
    if (registro.intentos >= 10) {
        registro.bloqueadaHasta = ahora + 24 * 60 * 60 * 1000;
        console.warn(`🔒 IP ${ip} bloqueada por 24h tras ${registro.intentos} intentos fallidos`);
    } else if (registro.intentos >= 6) {
        registro.bloqueadaHasta = ahora + 30 * 60 * 1000;
        console.warn(`🔒 IP ${ip} bloqueada por 30 min tras ${registro.intentos} intentos`);
    } else if (registro.intentos >= 3) {
        registro.bloqueadaHasta = ahora + 5 * 60 * 1000;
        console.warn(`🔒 IP ${ip} bloqueada por 5 min tras ${registro.intentos} intentos`);
    }

    ipsBloqueadas.set(ip, registro);
    return false;
}

function estasBloqueada(ip) {
    const registro = ipsBloqueadas.get(ip);
    if (!registro) return false;
    if (Date.now() < registro.bloqueadaHasta) return true;
    ipsBloqueadas.delete(ip);
    return false;
}

function limpiarIpEnExito(ip) {
    ipsBloqueadas.delete(ip);
}

// Limpiar mapa cada hora para evitar memory leaks
setInterval(() => {
    const ahora = Date.now();
    for (const [ip, reg] of ipsBloqueadas.entries()) {
        if (ahora > reg.bloqueadaHasta) ipsBloqueadas.delete(ip);
    }
}, 60 * 60 * 1000);

const limiterLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || req.connection.remoteAddress || 'unknown',
    handler: (req, res) => {
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        console.warn(`🚫 Rate limit alcanzado desde IP: ${ip}`);
        res.status(429).json({ error: 'Demasiados intentos. Espera 15 minutos antes de volver a intentarlo.' });
    }
});

const limiterRegistro = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { error: 'Demasiados registros. Intenta más tarde.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const limiterGeneral = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: { error: 'Demasiadas solicitudes. Intenta más tarde.' },
});

// ══════════════════════════════════════════════
// CONEXIÓN A MONGODB
// ══════════════════════════════════════════════
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tiendax';
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Conectado a MongoDB'))
    .catch(err => console.error('❌ Error:', err));


// ══════════════════════════════════════════════
// EMAIL
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
    </div></body></html>`;
}

function emailNuevoPedidoAdmin(pedido, usuario) {
    const total = pedido.items.reduce((a,i) => a+i.precio*i.cantidad, 0);
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
    envio: {
        nombre: String, telefono: String,
        direccion: String, ciudad: String, departamento: String
    },
    metodoPago: { type: String, default: '' },
    notas:      { type: String, default: '' },
    tracking:   { type: String, default: '' },
    estado:     { type: String, default: 'pendiente', enum: ['pendiente', 'enviado', 'entregado'] },
    fecha:      { type: Date, default: Date.now }
});

const direccionSchema = new mongoose.Schema({
    usuario:      { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    nombre: String, destinatario: String, calle: String,
    ciudad: String, departamento: String, telefono: String
});

const favoritoSchema = new mongoose.Schema({
    usuario:      { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    nombre: String, precio: Number, imagen_front: String, categoria: String
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

// ─── SCHEMA: INFORME MENSUAL ─────────────────────
const informeSchema = new mongoose.Schema({
    mes:                { type: Number, required: true },  // 1-12
    año:                { type: Number, required: true },
    totalPedidos:       { type: Number, default: 0 },
    totalUsuarios:      { type: Number, default: 0 },
    totalResenas:       { type: Number, default: 0 },
    pedidosPendientes:  { type: Number, default: 0 },
    pedidosEnviados:    { type: Number, default: 0 },
    pedidosEntregados:  { type: Number, default: 0 },
    ingresoTotal:       { type: Number, default: 0 },
    ventasPorMes:       [{ mes: Number, año: Number, total: Number, cantidad: Number }],
    creadoEn:           { type: Date, default: Date.now }
});

const Usuario   = mongoose.model('Usuario',   usuarioSchema);
const Pedido    = mongoose.model('Pedido',    pedidoSchema);
const Direccion = mongoose.model('Direccion', direccionSchema);
const Favorito  = mongoose.model('Favorito',  favoritoSchema);
const Carrito   = mongoose.model('Carrito',   carritoSchema);
const Resena    = mongoose.model('Resena',    resenaSchema);
const Producto  = mongoose.model('Producto',  productoSchema);
const Cupon     = mongoose.model('Cupon',     cuponSchema);
const Informe   = mongoose.model('Informe',   informeSchema);


// ══════════════════════════════════════════════
// MIDDLEWARES
// ══════════════════════════════════════════════
function verificarToken(req, res, next) {
    try {
        // Obtener token del header Authorization
        const authHeader = req.headers['authorization'];
        
        if (!authHeader) {
            console.error('❌ Error: No se envió header Authorization');
            return res.status(401).json({ error: 'No autorizado: falta token' });
        }

        // Esperar formato "Bearer <token>"
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            console.error('❌ Error: Formato Authorization inválido:', authHeader);
            return res.status(401).json({ error: 'Formato de Authorization inválido' });
        }

        const token = parts[1];

        if (!token) {
            console.error('❌ Error: Token vacío');
            return res.status(401).json({ error: 'No autorizado: token vacío' });
        }

        // Verificar JWT
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('❌ Error: JWT_SECRET no está definido');
            return res.status(500).json({ error: 'Error de servidor: JWT_SECRET no configurado' });
        }

        const decoded = jwt.verify(token, jwtSecret);
        req.userId = decoded.id;
        next();

    } catch (err) {
        console.error('❌ Error verificando token:', err.message);
        
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expirado' });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Token inválido' });
        }
        
        return res.status(401).json({ error: 'No autorizado: ' + err.message });
    }
}

async function verificarAdmin(req, res, next) {
    try {
        if (!req.userId) {
            console.error('❌ Error: req.userId no está definido');
            return res.status(403).json({ error: 'No hay usuario identificado' });
        }

        const usuario = await Usuario.findById(req.userId);
        
        if (!usuario) {
            console.error('❌ Error: Usuario no encontrado:', req.userId);
            return res.status(403).json({ error: 'Usuario no encontrado' });
        }

        if (usuario.rol !== 'admin') {
            console.error('❌ Error: Usuario sin permisos admin:', usuario.email);
            return res.status(403).json({ error: 'Acceso denegado — se requiere rol admin' });
        }

        req.usuario = usuario;
        next();

    } catch (err) {
        console.error('❌ Error verificando admin:', err.message);
        return res.status(500).json({ error: 'Error verificando permisos', details: err.message });
    }
}


// ══════════════════════════════════════════════
// RUTAS: AUTH
// ══════════════════════════════════════════════
// ══════════════════════════════════════════════
// UTILIDADES DE SEGURIDAD
// ══════════════════════════════════════════════

/**
 * Validar fortaleza de contraseña
 * - Mínimo 8 caracteres
 * - Al menos 1 mayúscula
 * - Al menos 1 número
 * - Al menos 1 carácter especial
 */
function validarContraseña(password) {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
}

/**
 * Validar email
 */
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Sanitizar input - remover caracteres peligrosos
 */
function sanitizar(input) {
    if (typeof input !== 'string') return '';
    return input
        .trim()
        .replace(/[<>\"'`]/g, '') // Remover caracteres HTML
        .slice(0, 100); // Limitar longitud
}


// ══════════════════════════════════════════════
// RUTAS: AUTH CON SEGURIDAD MEJORADA
// ══════════════════════════════════════════════

app.post('/api/registrarse', limiterRegistro, async (req, res) => {
    try {
        let { nombre, email, password } = req.body;

        // Sanitizar inputs
        nombre = sanitizar(nombre);
        email = sanitizar(email.toLowerCase());

        // Validaciones
        if (!nombre || nombre.length < 2) {
            return res.status(400).json({ error: 'Nombre debe tener al menos 2 caracteres' });
        }

        if (!validarEmail(email)) {
            return res.status(400).json({ error: 'Email no válido' });
        }

        if (!password || password.length < 6) {
            return res.status(400).json({ error: 'Contraseña mínimo 6 caracteres' });
        }

        // Validar fortaleza (opcional - comentar si es muy estricto)
        // if (!validarContraseña(password)) {
        //     return res.status(400).json({ 
        //         error: 'Contraseña débil. Necesita: mayúscula, número, carácter especial (@$!%*?&)' 
        //     });
        // }

        // Verificar si existe
        const existe = await Usuario.findOne({ email });
        if (existe) {
            return res.status(409).json({ error: 'Este email ya está registrado' });
        }

        // Hashear contraseña (rounds: 12 para mayor seguridad)
        const hash = await bcrypt.hash(password, 12);
        
        const usuario = new Usuario({
            nombre,
            email,
            password: hash
        });

        await usuario.save();

        console.log(`✅ Nuevo usuario registrado: ${email}`);
        res.status(201).json({ mensaje: 'Cuenta creada correctamente ✅' });

    } catch (err) {
        console.error('Error registrarse:', err.message);
        res.status(500).json({ error: 'Error al crear cuenta' });
    }
});

app.post('/api/login', limiterLogin, async (req, res) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    try {
        let { email, password } = req.body;

        // Verificar si la IP está bloqueada
        if (estasBloqueada(ip)) {
            const reg = ipsBloqueadas.get(ip);
            const min = Math.ceil((reg.bloqueadaHasta - Date.now()) / 60000);
            return res.status(429).json({
                error: `Demasiados intentos fallidos. Intenta de nuevo en ${min} minuto${min !== 1 ? 's' : ''}.`
            });
        }

        // Sanitizar
        email = sanitizar((email || '').toLowerCase());

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña requeridos' });
        }

        const usuario = await Usuario.findOne({ email });

        if (!usuario) {
            registrarIntento(ip);
            return res.status(401).json({ error: 'Email o contraseña incorrectos' });
        }

        const esValida = await bcrypt.compare(password, usuario.password);

        if (!esValida) {
            registrarIntento(ip);
            return res.status(401).json({ error: 'Email o contraseña incorrectos' });
        }

        // Login exitoso — limpiar bloqueo
        limpiarIpEnExito(ip);
        console.log(`✅ Login exitoso: ${email}`);

        const token = jwt.sign(
            { id: usuario._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d', issuer: 'tiendax' }
        );

        res.json({ token, nombre: usuario.nombre, rol: usuario.rol });

    } catch (err) {
        console.error('Error login:', err.message);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

app.post('/api/admin/login', limiterLogin, async (req, res) => {
    try {
        let { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: 'Contraseña requerida' });
        }

        // Validar contraseña admin
        if (password !== process.env.ADMIN_PASSWORD) {
            console.warn('⚠️ Intento fallido de login admin');
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        let admin = await Usuario.findOne({ rol: 'admin' });
        if (!admin) {
            try {
                const hash = await bcrypt.hash(password, 12);
                admin = new Usuario({
                    nombre: 'Administrador',
                    email: 'admin@tiendax.internal',
                    password: hash,
                    rol: 'admin'
                });
                await admin.save();
            } catch {
                admin = await Usuario.findOne({ email: 'admin@tiendax.internal' });
                if (!admin) return res.status(500).json({ error: 'Error creando admin' });
            }
        }

        const token = jwt.sign(
            { id: admin._id },
            process.env.JWT_SECRET,
            { expiresIn: '1d', issuer: 'tiendax' }
        );

        console.log('✅ Login admin exitoso');
        res.json({ token, nombre: admin.nombre });

    } catch (err) {
        console.error('Error admin login:', err.message);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
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
});

app.put('/api/pedidos/:id/tracking', verificarToken, verificarAdmin, async (req, res) => {
    const { tracking } = req.body;
    const pedido = await Pedido.findByIdAndUpdate(req.params.id, { tracking }, { new: true });
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json({ mensaje: 'Número de guía actualizado ✅', pedido });
});


// ══════════════════════════════════════════════
// RUTAS: DIRECCIONES
// ══════════════════════════════════════════════
app.get('/api/direcciones', verificarToken, async (req, res) => {
    res.json(await Direccion.find({ usuario: req.userId }));
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
    res.json(await Favorito.find({ usuario: req.userId }));
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
    const c = await Carrito.findOne({ usuario: req.userId });
    res.json(c ? c.items : []);
});

app.put('/api/carrito', verificarToken, async (req, res) => {
    await Carrito.findOneAndUpdate(
        { usuario: req.userId },
        { items: req.body.items, actualizadoEn: new Date() },
        { upsert: true }
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
    const resenas = await Resena.find({ productoNombre: decodeURIComponent(req.params.productoNombre) }).sort({ fecha: -1 });
    res.json(resenas);
});

app.post('/api/resenas', verificarToken, async (req, res) => {
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
    
    const existe = await Resena.findOne({ productoNombre, usuario: req.userId });
    if (existe) {
        console.log('⚠️ Reseña duplicada para:', productoNombre);
        return res.status(400).json({ error: 'Ya escribiste una reseña para este producto' });
    }
    
    try {
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
});

app.delete('/api/resenas/:id', verificarToken, async (req, res) => {
    await Resena.findOneAndDelete({ _id: req.params.id, usuario: req.userId });
    res.json({ mensaje: 'Reseña eliminada' });
});


// ══════════════════════════════════════════════
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
app.post('/api/cupones/validar', limiterGeneral, async (req, res) => {
    try {
        let { codigo, total } = req.body;

        if (!codigo || typeof codigo !== 'string') {
            return res.status(400).json({ error: 'Ingresa un código válido' });
        }

        if (!total || typeof total !== 'number' || total < 0) {
            return res.status(400).json({ error: 'Total no válido' });
        }

        // Sanitizar y validar código
        codigo = sanitizar(codigo).toUpperCase();
        
        if (codigo.length < 2 || codigo.length > 20) {
            return res.status(400).json({ error: 'Código de cupón no válido' });
        }

        const cupon = await Cupon.findOne({ codigo });
        if (!cupon || !cupon.activo) {
            return res.status(404).json({ error: 'Cupón no válido o inactivo' });
        }

        if (cupon.expira && new Date() > cupon.expira) {
            return res.status(400).json({ error: 'Este cupón ya expiró' });
        }

        if (cupon.limite > 0 && cupon.usados >= cupon.limite) {
            return res.status(400).json({ error: 'Este cupón ya alcanzó su límite de usos' });
        }

        const descuento = cupon.tipo === 'porcentaje'
            ? Math.round(total * cupon.descuento / 100)
            : cupon.descuento;

        res.json({
            valido: true,
            descuento,
            tipo: cupon.tipo,
            valor: cupon.descuento,
            codigo: cupon.codigo
        });

    } catch (err) {
        console.error('Error validar cupón:', err.message);
        res.status(500).json({ error: 'Error al validar cupón' });
    }
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
// RUTAS: INFORMES MENSUALES
// ══════════════════════════════════════════════
app.get('/api/admin/informes', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const informes = await Informe.find().sort({ año: -1, mes: -1 });
        res.json(informes);
    } catch (err) {
        console.error('Error obteniendo informes:', err);
        res.status(500).json({ error: 'Error al obtener informes' });
    }
});

app.post('/api/admin/guardar-informe', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const { mes, año, estadisticas } = req.body;
        
        if (!mes || !año) {
            return res.status(400).json({ error: 'Mes y año son requeridos' });
        }

        // Buscar si ya existe un informe para ese mes/año
        let informe = await Informe.findOne({ mes: parseInt(mes), año: parseInt(año) });

        if (informe) {
            // Actualizar informe existente
            Object.assign(informe, estadisticas, { mes: parseInt(mes), año: parseInt(año) });
        } else {
            // Crear nuevo informe
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
        console.error('Error guardando informe:', err);
        res.status(500).json({ error: 'Error al guardar informe' });
    }
});

app.get('/api/admin/exportar-ventas/:mes/:año', verificarToken, verificarAdmin, async (req, res) => {
    try {
        const { mes, año } = req.params;
        
        // Obtener informe guardado
        const informe = await Informe.findOne({ mes: parseInt(mes), año: parseInt(año) });
        
        if (!informe) {
            return res.status(404).json({ error: 'No hay informe para este período' });
        }

        // Generar CSV desde los datos del informe
        let csv = 'Informe Mensual de Ventas - Tienda X\n';
        csv += `Mes: ${mes}/${año}\n\n`;
        
        csv += 'RESUMEN\n';
        csv += `Total Ingresos,$${informe.ingresoTotal.toLocaleString('es-CO')}\n`;
        csv += `Total Pedidos,${informe.totalPedidos}\n`;
        csv += `Pedidos Pendientes,${informe.pedidosPendientes}\n`;
        csv += `Pedidos Enviados,${informe.pedidosEnviados}\n`;
        csv += `Pedidos Entregados,${informe.pedidosEntregados}\n`;
        csv += `Total Usuarios,${informe.totalUsuarios}\n`;
        csv += `Total Reseñas,${informe.totalResenas}\n\n`;
        
        csv += 'VENTAS POR MES (histórico mostrado)\n';
        csv += 'Mes,Año,Total,Cantidad Pedidos\n';
        informe.ventasPorMes.forEach(v => {
            csv += `${v.mes},${v.año},$${v.total.toLocaleString('es-CO')},${v.cantidad}\n`;
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="informe-${mes}-${año}.csv"`);
        res.send('\uFEFF' + csv);
    } catch (err) {
        console.error('Error exportando informe:', err);
        res.status(500).json({ error: 'Error al exportar' });
    }
});


// ══════════════════════════════════════════════
// INICIAR SERVIDOR
// ══════════════════════════════════════════════
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});