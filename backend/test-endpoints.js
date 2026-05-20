#!/usr/bin/env node

/**
 * Script de prueba manual de endpoints
 * Uso: node test-endpoints.js
 */

const API_URL = 'http://localhost:3000/api';

// Colores para terminal
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

async function test(name, method, url, body = null, token = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);
        const data = await response.json().catch(() => ({}));

        const status = response.status;
        const isOk = status >= 200 && status < 300;
        const icon = isOk ? '✅' : '❌';

        console.log(`\n${colors.bright}${icon} ${name}${colors.reset}`);
        console.log(`  ${colors.cyan}${method} ${url.replace(API_URL, '')}${colors.reset}`);
        console.log(`  Status: ${isOk ? colors.green : colors.red}${status}${colors.reset}`);
        console.log(`  Response:`, JSON.stringify(data, null, 2).split('\n').slice(0, 5).join('\n'));

        return { success: isOk, data, status };
    } catch (err) {
        console.log(`\n${colors.red}❌ ${name}${colors.reset}`);
        console.log(`  Error: ${err.message}`);
        return { success: false, error: err.message };
    }
}

async function runTests() {
    console.log(`\n${colors.bright}╔════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bright}║     🧪 PRUEBAS DE API - TIENDA X REFACTOR     ║${colors.reset}`);
    console.log(`${colors.bright}╚════════════════════════════════════════════════╝${colors.reset}\n`);

    let token = null;

    // Health check
    console.log(`${colors.bright}📊 HEALTH CHECK${colors.reset}`);
    const health = await test('Health', 'GET', `${API_URL}/../health`);

    if (!health.success) {
        console.log(`\n${colors.red}${colors.bright}⚠️  El servidor no está corriendo. Inicia con: npm run dev${colors.reset}`);
        process.exit(1);
    }

    // Tests de autenticación
    console.log(`\n${colors.bright}🔐 AUTENTICACIÓN${colors.reset}`);

    const registerRes = await test(
        'Registrar usuario',
        'POST',
        `${API_URL}/registrarse`,
        {
            nombre: 'Test User',
            email: `test-${Date.now()}@example.com`,
            password: 'password123'
        }
    );

    const loginRes = await test(
        'Login usuario',
        'POST',
        `${API_URL}/login`,
        {
            email: `test-${Date.now() - 1000}@example.com`,
            password: 'password123'
        }
    );

    if (loginRes.success && loginRes.data.token) {
        token = loginRes.data.token;
    }

    // Tests de endpoints públicos
    console.log(`\n${colors.bright}🌐 ENDPOINTS PÚBLICOS${colors.reset}`);

    await test(
        'Obtener productos - Todos',
        'GET',
        `${API_URL}/productos/todos`
    );

    await test(
        'Obtener productos - Mujeres',
        'GET',
        `${API_URL}/productos/mujer`
    );

    // Tests protegidos (si tenemos token)
    if (token) {
        console.log(`\n${colors.bright}🔒 ENDPOINTS PROTEGIDOS${colors.reset}`);

        await test(
            'Obtener perfil',
            'GET',
            `${API_URL}/perfil`,
            null,
            token
        );

        await test(
            'Obtener carrito',
            'GET',
            `${API_URL}/carrito`,
            null,
            token
        );

        await test(
            'Obtener pedidos',
            'GET',
            `${API_URL}/pedidos`,
            null,
            token
        );

        await test(
            'Obtener favoritos',
            'GET',
            `${API_URL}/favoritos`,
            null,
            token
        );
    } else {
        console.log(`\n${colors.yellow}⚠️  No se logró obtener token. Skipping protected endpoints.${colors.reset}`);
    }

    // Errores
    console.log(`\n${colors.bright}🚨 VALIDACIÓN DE ERRORES${colors.reset}`);

    await test(
        'Email inválido al registrar',
        'POST',
        `${API_URL}/registrarse`,
        {
            nombre: 'Test',
            email: 'invalid',
            password: 'password123'
        }
    );

    await test(
        'Género inválido en productos',
        'GET',
        `${API_URL}/productos/invalid`
    );

    await test(
        'Ruta inexistente',
        'GET',
        `${API_URL}/no-existe`
    );

    console.log(`\n${colors.bright}╔════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.bright}║          ✅ PRUEBAS COMPLETADAS ✅            ║${colors.reset}`);
    console.log(`${colors.bright}╚════════════════════════════════════════════════╝${colors.reset}\n`);

    process.exit(0);
}

// Ejecutar
runTests().catch(err => {
    console.error(colors.red + err.message + colors.reset);
    process.exit(1);
});
