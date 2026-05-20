const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');
const { sanitizar, validarEmail } = require('../utils/validacion');
const { registrarIntento, estasBloqueada, limpiarIpEnExito } = require('../utils/ipBlocking');

/**
 * POST /api/registrarse
 * Registrar nuevo usuario
 */
async function registrarse(req, res) {
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

        // Verificar si existe
        const existe = await Usuario.findOne({ email });
        if (existe) {
            return res.status(409).json({ error: 'Este email ya está registrado' });
        }

        // Hashear contraseña
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
}

/**
 * POST /api/login
 * Login de usuario regular
 */
async function login(req, res) {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    
    try {
        let { email, password } = req.body;

        // Verificar si la IP está bloqueada
        if (estasBloqueada(ip)) {
            const min = Math.ceil(5); // Aproximado
            return res.status(429).json({
                error: `Demasiados intentos fallidos. Intenta de nuevo más tarde.`
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
}

/**
 * POST /api/admin/login
 * Login de administrador
 */
async function loginAdmin(req, res) {
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
}

module.exports = {
    registrarse,
    login,
    loginAdmin
};
