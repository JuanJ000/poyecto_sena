/**
 * Utilities de validación
 */

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

module.exports = {
    validarContraseña,
    validarEmail,
    sanitizar
};
