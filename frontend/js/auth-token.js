/**
 * AUTH TOKEN UTILITIES
 * Manejo centralizado de tokens JWT para evitar errores de autenticación
 */

const AuthToken = {
    /**
     * Obtener token actual desde localStorage
     * @returns {string|null} Token JWT o null si no existe
     */
    get() {
        return localStorage.getItem('token');
    },

    /**
     * Verificar si usuario tiene token válido
     * @returns {boolean} true si tiene token, false si no
     */
    exists() {
        return !!this.get();
    },

    /**
     * Guardar token en localStorage
     * @param {string} token - JWT token
     * @param {string} nombre - Nombre del usuario (opcional)
     */
    save(token, nombre = '') {
        localStorage.setItem('token', token);
        if (nombre) localStorage.setItem('nombre', nombre);
        console.log('✅ Token guardado en localStorage');
    },

    /**
     * Eliminar token (logout)
     */
    remove() {
        localStorage.removeItem('token');
        localStorage.removeItem('nombre');
        console.log('✅ Token eliminado');
    },

    /**
     * Decodificar JWT para ver su contenido (sin validar firma)
     * ADVERTENCIA: No valida la firma, solo la estructura
     * @param {string} token - JWT token
     * @returns {object|null} Payload del token o null si inválido
     */
    decode(token) {
        if (!token) return null;
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            
            // Decodificar payload (segunda parte)
            const payload = parts[1];
            const decoded = JSON.parse(atob(payload));
            return decoded;
        } catch (e) {
            console.error('❌ Error decodificando token:', e.message);
            return null;
        }
    },

    /**
     * Verificar si token está expirado
     * @param {string} token - JWT token (opcional, usa el del localStorage si no se proporciona)
     * @returns {boolean} true si está expirado, false si es válido
     */
    isExpired(token = null) {
        const t = token || this.get();
        if (!t) return true;
        
        const decoded = this.decode(t);
        if (!decoded || !decoded.exp) return true;
        
        const now = Math.floor(Date.now() / 1000);
        const isExpired = decoded.exp < now;
        
        if (isExpired) {
            console.warn('⚠️ Token expirado');
            console.warn(`   Expiró hace: ${Math.floor((now - decoded.exp) / 3600)} horas`);
        }
        
        return isExpired;
    },

    /**
     * Obtener tiempo restante de validez del token en segundos
     * @param {string} token - JWT token (opcional)
     * @returns {number} Segundos restantes (negativo si expirado)
     */
    getTimeToExpire(token = null) {
        const t = token || this.get();
        if (!t) return -1;
        
        const decoded = this.decode(t);
        if (!decoded || !decoded.exp) return -1;
        
        const now = Math.floor(Date.now() / 1000);
        return decoded.exp - now;
    },

    /**
     * Traducir tiempo a expiracion en formato legible
     * @returns {string} "en X horas/días" o "hace X horas" si expirado
     */
    getExpirationReadable() {
        const seconds = this.getTimeToExpire();
        if (seconds < 0) {
            return `(expiró hace ${Math.floor(-seconds / 3600)}h)`;
        }
        if (seconds < 3600) return `en ${Math.floor(seconds / 60)} minutos`;
        if (seconds < 86400) return `en ${Math.floor(seconds / 3600)} horas`;
        return `en ${Math.floor(seconds / 86400)} días`;
    },

    /**
     * Verificar si el usuario está autenticado
     * Comprueba: token existe + no está expirado
     * @returns {boolean}
     */
    isAuthenticated() {
        return this.exists() && !this.isExpired();
    },

    /**
     * Redirigir a login si no autenticado
     * @param {string} message - Mensaje a mostrar
     * @returns {boolean} true si fue redirectido, false si autenticado
     */
    redirectIfNotAuthenticated(message = 'Debes iniciar sesión') {
        if (!this.isAuthenticated()) {
            alert(message);
            window.location.href = 'registrarse.html';
            return true;
        }
        return false;
    },

    /**
     * Crear header con Authorization Bearer
     * @returns {object} Header para fetch({ headers: ... })
     */
    getBearerHeader() {
        const token = this.get();
        return {
            'Authorization': `Bearer ${token || ''}`
        };
    },

    /**
     * Crear headers completos para fetch con Authentication
     * @param {object} additionalHeaders - Headers adicionales
     * @returns {object} Headers para fetch
     */
    getHeaders(additionalHeaders = {}) {
        return {
            'Content-Type': 'application/json',
            ...this.getBearerHeader(),
            ...additionalHeaders
        };
    },

    /**
     * Registrar estado del token en consola (para debugging)
     */
    logStatus() {
        console.log('📊 === TOKEN STATUS ===');
        console.log(`   Existe: ${this.exists() ? '✅' : '❌'}`);
        if (this.exists()) {
            console.log(`   Expirado: ${this.isExpired() ? '⚠️' : '✅'}`);
            console.log(`   Expira: ${this.getExpirationReadable()}`);
            const decoded = this.decode(this.get());
            console.log(`   Usuario ID: ${decoded?.id || 'desconocido'}`);
        }
        console.log('======================');
    }
};

// Exportar para uso en otros scripts
if (typeof window !== 'undefined') {
    window.AuthToken = AuthToken;
}
