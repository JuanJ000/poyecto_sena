const jwt = require('jsonwebtoken');

/**
 * Middleware para verificar JWT token
 */
async function verificarToken(req, res, next) {
    try {
        const authHeader = req.headers['authorization'];
        
        if (!authHeader) {
            console.error('❌ Error: No se envió header Authorization');
            return res.status(401).json({ error: 'No autorizado: falta token' });
        }

        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            console.error('❌ Error: Formato Authorization inválido');
            return res.status(401).json({ error: 'Formato de Authorization inválido' });
        }

        const token = parts[1];
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

module.exports = verificarToken;
