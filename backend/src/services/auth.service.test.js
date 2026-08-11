import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createRequire } from 'module';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// ===== MOCKS: Parchear el cache de módulos de Node antes de cargar auth.service.js =====

// Mock de UsuarioModel
const mockFindByUsername = vi.fn();
const mockIncrementarIntentos = vi.fn();
const mockResetearIntentos = vi.fn();
const mockVerificarBloqueoModel = vi.fn();

const UsuarioModelMock = {
    findByUsername: mockFindByUsername,
    incrementarIntentos: mockIncrementarIntentos,
    resetearIntentos: mockResetearIntentos,
    verificarBloqueo: mockVerificarBloqueoModel
};

// Mock de rateLimit
const mockVerificarBloqueoRL = vi.fn();
const mockRegistrarIntentoFallido = vi.fn();
const mockRegistrarExito = vi.fn();

const rateLimitMock = {
    verificarBloqueo: mockVerificarBloqueoRL,
    registrarIntentoFallido: mockRegistrarIntentoFallido,
    registrarExito: mockRegistrarExito,
    rateLimitMiddleware: vi.fn(),
    limpiarStore: vi.fn()
};

// Mock de jwt config
const jwtConfigMock = {
    secret: 'test-secret-key',
    expiresIn: '60m',
    algorithm: 'HS256'
};

// Mock de database (para prevenir conexión real)
const dbMock = vi.fn();
dbMock.fn = { now: vi.fn(() => 'NOW()') };

// Parchear el cache de require ANTES de cargar auth.service
const dbPath = resolve(__dirname, '../config/database.js');
const modelPath = resolve(__dirname, '../models/usuario.model.js');
const rlPath = resolve(__dirname, '../middlewares/rateLimit.js');
const jwtConfigPath = resolve(__dirname, '../config/jwt.js');

// Registrar los mocks en el cache de require
require.cache[require.resolve(dbPath)] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: dbMock
};

require.cache[require.resolve(modelPath)] = {
    id: modelPath,
    filename: modelPath,
    loaded: true,
    exports: UsuarioModelMock
};

require.cache[require.resolve(rlPath)] = {
    id: rlPath,
    filename: rlPath,
    loaded: true,
    exports: rateLimitMock
};

require.cache[require.resolve(jwtConfigPath)] = {
    id: jwtConfigPath,
    filename: jwtConfigPath,
    loaded: true,
    exports: jwtConfigMock
};

// Ahora sí cargar auth.service — usará los mocks del cache
const AuthService = require(resolve(__dirname, './auth.service.js'));

describe('AuthService', () => {
    const PASSWORD = 'password123';
    let PASSWORD_HASH;

    const crearUsuarioMock = (overrides = {}) => ({
        id: '550e8400-e29b-41d4-a716-446655440000',
        nombre_usuario: 'admin',
        email: 'admin@autostar.com',
        contrasena_hash: PASSWORD_HASH,
        intentos_fallidos: 0,
        bloqueado_hasta: null,
        activo: true,
        ...overrides
    });

    beforeEach(async () => {
        vi.clearAllMocks();
        mockVerificarBloqueoRL.mockReturnValue({ bloqueado: false, tiempoRestante: 0 });

        if (!PASSWORD_HASH) {
            PASSWORD_HASH = await bcrypt.hash(PASSWORD, 10);
        }
    });

    describe('login exitoso', () => {
        it('retorna token y datos del usuario con credenciales válidas', async () => {
            const usuario = crearUsuarioMock();
            mockFindByUsername.mockResolvedValue(usuario);
            mockVerificarBloqueoModel.mockResolvedValue({ bloqueado: false, tiempoRestante: 0 });
            mockResetearIntentos.mockResolvedValue();

            const resultado = await AuthService.login('admin', PASSWORD);

            expect(resultado).toHaveProperty('token');
            expect(resultado).toHaveProperty('usuario');
            expect(resultado.usuario).toEqual({
                id: usuario.id,
                nombre_usuario: 'admin',
                email: 'admin@autostar.com'
            });
        });

        it('resetea el contador de intentos fallidos tras login exitoso', async () => {
            const usuario = crearUsuarioMock({ intentos_fallidos: 3 });
            mockFindByUsername.mockResolvedValue(usuario);
            mockVerificarBloqueoModel.mockResolvedValue({ bloqueado: false, tiempoRestante: 0 });
            mockResetearIntentos.mockResolvedValue();

            await AuthService.login('admin', PASSWORD);

            expect(mockResetearIntentos).toHaveBeenCalledWith(usuario.id);
            expect(mockRegistrarExito).toHaveBeenCalledWith('admin');
        });
    });

    describe('login fallido - contraseña inválida', () => {
        it('lanza error AUTENTICACION e incrementa intentos con contraseña incorrecta', async () => {
            const usuario = crearUsuarioMock();
            mockFindByUsername.mockResolvedValue(usuario);
            mockVerificarBloqueoModel.mockResolvedValue({ bloqueado: false, tiempoRestante: 0 });
            mockIncrementarIntentos.mockResolvedValue();

            await expect(AuthService.login('admin', 'contrasenaIncorrecta'))
                .rejects
                .toMatchObject({
                    tipo: 'AUTENTICACION',
                    statusCode: 401
                });

            expect(mockIncrementarIntentos).toHaveBeenCalledWith(usuario.id);
            expect(mockRegistrarIntentoFallido).toHaveBeenCalledWith('admin');
        });
    });

    describe('login fallido - usuario no encontrado', () => {
        it('lanza error AUTENTICACION cuando el usuario no existe', async () => {
            mockFindByUsername.mockResolvedValue(null);

            await expect(AuthService.login('noexiste', PASSWORD))
                .rejects
                .toMatchObject({
                    tipo: 'AUTENTICACION',
                    statusCode: 401
                });

            expect(mockRegistrarIntentoFallido).toHaveBeenCalledWith('noexiste');
        });
    });

    describe('login fallido - usuario inactivo', () => {
        it('lanza error AUTENTICACION cuando el usuario está inactivo', async () => {
            const usuario = crearUsuarioMock({ activo: false });
            mockFindByUsername.mockResolvedValue(usuario);
            mockVerificarBloqueoModel.mockResolvedValue({ bloqueado: false, tiempoRestante: 0 });

            await expect(AuthService.login('admin', PASSWORD))
                .rejects
                .toMatchObject({
                    tipo: 'AUTENTICACION',
                    statusCode: 401
                });
        });
    });

    describe('login bloqueado - 5+ intentos fallidos', () => {
        it('lanza error BLOQUEO_TEMPORAL con tiempoRestante cuando el rate limiter detecta bloqueo', async () => {
            mockVerificarBloqueoRL.mockReturnValue({ bloqueado: true, tiempoRestante: 250 });

            try {
                await AuthService.login('admin', PASSWORD);
                expect.fail('Debería haber lanzado un error de bloqueo');
            } catch (error) {
                expect(error.tipo).toBe('BLOQUEO_TEMPORAL');
                expect(error.statusCode).toBe(429);
                expect(error.tiempoRestante).toBe(250);
            }
        });

        it('lanza error BLOQUEO_TEMPORAL cuando la BD indica bloqueo persistente', async () => {
            const usuario = crearUsuarioMock();
            mockFindByUsername.mockResolvedValue(usuario);
            mockVerificarBloqueoModel.mockResolvedValue({ bloqueado: true, tiempoRestante: 180 });

            try {
                await AuthService.login('admin', PASSWORD);
                expect.fail('Debería haber lanzado un error de bloqueo');
            } catch (error) {
                expect(error.tipo).toBe('BLOQUEO_TEMPORAL');
                expect(error.statusCode).toBe(429);
                expect(error.tiempoRestante).toBe(180);
            }
        });
    });

    describe('generación de JWT', () => {
        it('genera un token con el payload correcto (id, nombre, email)', async () => {
            const usuario = crearUsuarioMock();
            mockFindByUsername.mockResolvedValue(usuario);
            mockVerificarBloqueoModel.mockResolvedValue({ bloqueado: false, tiempoRestante: 0 });
            mockResetearIntentos.mockResolvedValue();

            const resultado = await AuthService.login('admin', PASSWORD);

            const decoded = jwt.verify(resultado.token, 'test-secret-key');
            expect(decoded.id).toBe(usuario.id);
            expect(decoded.nombre).toBe(usuario.nombre_usuario);
            expect(decoded.email).toBe(usuario.email);
        });

        it('genera un token con expiración de 60 minutos', async () => {
            const usuario = crearUsuarioMock();
            mockFindByUsername.mockResolvedValue(usuario);
            mockVerificarBloqueoModel.mockResolvedValue({ bloqueado: false, tiempoRestante: 0 });
            mockResetearIntentos.mockResolvedValue();

            const resultado = await AuthService.login('admin', PASSWORD);

            const decoded = jwt.verify(resultado.token, 'test-secret-key');
            const duracion = decoded.exp - decoded.iat;
            expect(duracion).toBe(3600); // 60 minutos en segundos
        });
    });
});
