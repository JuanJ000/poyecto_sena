/**
 * Middleware para manejo centralizado de errores
 */
function errorHandler(err, req, res, next) {
    console.error('❌ Error:', err);
    
    // Validación de Mongoose
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({ error: 'Validación fallida', details: messages });
    }

    // Duplicados en Mongoose
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(409).json({ error: `El ${field} ya existe` });
    }

    // Error de JWT
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Token inválido' });
    }

    // Token expirado
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expirado' });
    }

    // Error genérico
    const status = err.status || 500;
    const message = process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor';
    
    res.status(status).json({ 
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
}

module.exports = errorHandler;
