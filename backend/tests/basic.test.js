/**
 * Tests básicos para validar funcionalidad
 * Ejecutar: npm test
 */

const request = require('supertest');
const app = require('../server-new');
const { Usuario } = require('../src/models');
const mongoose = require('mongoose');

describe('API - Tests Básicos', () => {

    // Limpiar BD antes de tests
    beforeAll(async () => {
        // Esperar conexión a MongoDB
        if (mongoose.connection.readyState === 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    // ═══════════════════════════════════════════════════════════════
    // TESTS DE AUTENTICACIÓN
    // ═══════════════════════════════════════════════════════════════

    describe('POST /api/registrarse', () => {
        it('debe registrar usuario válido', async () => {
            const response = await request(app)
                .post('/api/registrarse')
                .send({
                    nombre: 'Test User',
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(201);
            expect(response.body.mensaje).toContain('Cuenta creada');
        });

        it('debe rechazar email duplicado', async () => {
            const response = await request(app)
                .post('/api/registrarse')
                .send({
                    nombre: 'Test User',
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(409);
            expect(response.body.error).toContain('ya está registrado');
        });

        it('debe validar email', async () => {
            const response = await request(app)
                .post('/api/registrarse')
                .send({
                    nombre: 'Test User',
                    email: 'invalid-email',
                    password: 'password123'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Email no válido');
        });

        it('debe validar contraseña mínima', async () => {
            const response = await request(app)
                .post('/api/registrarse')
                .send({
                    nombre: 'Test User',
                    email: 'test2@example.com',
                    password: 'short'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('mínimo 6 caracteres');
        });
    });

    describe('POST /api/login', () => {
        it('debe hacer login con credenciales válidas', async () => {
            const response = await request(app)
                .post('/api/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('nombre');
        });

        it('debe rechazar email incorrecto', async () => {
            const response = await request(app)
                .post('/api/login')
                .send({
                    email: 'wrong@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(401);
            expect(response.body.error).toContain('Email o contraseña');
        });

        it('debe rechazar contraseña incorrecta', async () => {
            const response = await request(app)
                .post('/api/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
            expect(response.body.error).toContain('Email o contraseña');
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // TESTS DE ENDPOINTS PÚBLICOS
    // ═══════════════════════════════════════════════════════════════

    describe('GET /api/productos/:genero', () => {
        it('debe retornar productos válidos', async () => {
            const response = await request(app)
                .get('/api/productos/todos');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        it('debe validar género', async () => {
            const response = await request(app)
                .get('/api/productos/invalid');

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Género no válido');
        });
    });

    describe('GET /health', () => {
        it('debe retornar estado del servidor', async () => {
            const response = await request(app)
                .get('/health');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status', 'ok');
        });
    });

    // ═══════════════════════════════════════════════════════════════
    // TESTS DE VALIDACIÓN GENERAL
    // ═══════════════════════════════════════════════════════════════

    describe('Validaciones', () => {
        it('debe retornar 404 para ruta inválida', async () => {
            const response = await request(app)
                .get('/api/ruta-inexistente');

            expect(response.status).toBe(404);
        });
    });
});
