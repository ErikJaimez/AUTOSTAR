import { validarCodigoPostal, validarEdad, validarEmail, validarFormularioReservacion, validarNombre, validarTelefono } from '@/utils/validators';
import { esZonaServicio, obtenerAlcaldia } from '@/utils/zonaServicio';
import { describe, expect, it } from 'vitest';

describe('zonaServicio', () => {
    describe('esZonaServicio', () => {
        describe('retorna true para CPs en cada rango válido', () => {
            it('Coyoacán (04000-04999)', () => {
                expect(esZonaServicio('04000')).toBe(true);
                expect(esZonaServicio('04500')).toBe(true);
                expect(esZonaServicio('04999')).toBe(true);
            });

            it('Milpa Alta (12000-12999)', () => {
                expect(esZonaServicio('12000')).toBe(true);
                expect(esZonaServicio('12500')).toBe(true);
                expect(esZonaServicio('12999')).toBe(true);
            });

            it('Tláhuac (13000-13999)', () => {
                expect(esZonaServicio('13000')).toBe(true);
                expect(esZonaServicio('13500')).toBe(true);
                expect(esZonaServicio('13999')).toBe(true);
            });

            it('Tlalpan (14000-14999)', () => {
                expect(esZonaServicio('14000')).toBe(true);
                expect(esZonaServicio('14500')).toBe(true);
                expect(esZonaServicio('14999')).toBe(true);
            });

            it('Xochimilco (16000-16999)', () => {
                expect(esZonaServicio('16000')).toBe(true);
                expect(esZonaServicio('16500')).toBe(true);
                expect(esZonaServicio('16999')).toBe(true);
            });
        });

        describe('retorna false para CPs fuera de todos los rangos', () => {
            it('rechaza CPs de otras zonas', () => {
                expect(esZonaServicio('06000')).toBe(false);
                expect(esZonaServicio('10000')).toBe(false);
                expect(esZonaServicio('15000')).toBe(false);
                expect(esZonaServicio('11000')).toBe(false);
                expect(esZonaServicio('20000')).toBe(false);
            });
        });

        describe('retorna false para entradas inválidas', () => {
            it('rechaza null', () => {
                expect(esZonaServicio(null)).toBe(false);
            });

            it('rechaza undefined', () => {
                expect(esZonaServicio(undefined)).toBe(false);
            });

            it('rechaza string vacío', () => {
                expect(esZonaServicio('')).toBe(false);
            });

            it('rechaza valores no numéricos', () => {
                expect(esZonaServicio('abcde')).toBe(false);
                expect(esZonaServicio('14abc')).toBe(false);
            });
        });

        describe('retorna false para CPs en bordes fuera de rango', () => {
            it('rechaza 03999 (justo antes de Coyoacán)', () => {
                expect(esZonaServicio('03999')).toBe(false);
            });

            it('rechaza 05000 (justo después de Coyoacán)', () => {
                expect(esZonaServicio('05000')).toBe(false);
            });

            it('rechaza 11999 (justo antes de Milpa Alta)', () => {
                expect(esZonaServicio('11999')).toBe(false);
            });

            it('rechaza 15000 (entre Tlalpan y Xochimilco)', () => {
                expect(esZonaServicio('15000')).toBe(false);
            });
        });

        it('acepta CPs como número', () => {
            expect(esZonaServicio(14000)).toBe(true);
            expect(esZonaServicio(6000)).toBe(false);
        });
    });

    describe('obtenerAlcaldia', () => {
        it('retorna Coyoacán para CPs 04000-04999', () => {
            expect(obtenerAlcaldia('04500')).toBe('Coyoacán');
        });

        it('retorna Milpa Alta para CPs 12000-12999', () => {
            expect(obtenerAlcaldia('12500')).toBe('Milpa Alta');
        });

        it('retorna Tláhuac para CPs 13000-13999', () => {
            expect(obtenerAlcaldia('13500')).toBe('Tláhuac');
        });

        it('retorna Tlalpan para CPs 14000-14999', () => {
            expect(obtenerAlcaldia('14500')).toBe('Tlalpan');
        });

        it('retorna Xochimilco para CPs 16000-16999', () => {
            expect(obtenerAlcaldia('16500')).toBe('Xochimilco');
        });

        it('retorna null para CPs fuera de zona', () => {
            expect(obtenerAlcaldia('06000')).toBe(null);
            expect(obtenerAlcaldia('20000')).toBe(null);
        });

        it('retorna null para entradas inválidas', () => {
            expect(obtenerAlcaldia(null)).toBe(null);
            expect(obtenerAlcaldia('abc')).toBe(null);
        });
    });
});

describe('validators', () => {
    describe('validarNombre', () => {
        it('acepta nombres válidos', () => {
            expect(validarNombre('Juan Pérez')).toEqual({ valido: true, mensaje: null });
            expect(validarNombre('A')).toEqual({ valido: true, mensaje: null });
            expect(validarNombre('a'.repeat(120))).toEqual({ valido: true, mensaje: null });
        });

        it('rechaza nombre vacío', () => {
            const resultado = validarNombre('');
            expect(resultado.valido).toBe(false);
            expect(resultado.mensaje).toBeTruthy();
        });

        it('rechaza null/undefined', () => {
            expect(validarNombre(null).valido).toBe(false);
            expect(validarNombre(undefined).valido).toBe(false);
        });

        it('rechaza nombre mayor a 120 caracteres', () => {
            const resultado = validarNombre('a'.repeat(121));
            expect(resultado.valido).toBe(false);
            expect(resultado.mensaje).toContain('120');
        });

        it('rechaza nombre con solo espacios', () => {
            expect(validarNombre('   ').valido).toBe(false);
        });
    });

    describe('validarEdad', () => {
        it('acepta edades válidas entre 16 y 99', () => {
            expect(validarEdad(16)).toEqual({ valido: true, mensaje: null });
            expect(validarEdad(50)).toEqual({ valido: true, mensaje: null });
            expect(validarEdad(99)).toEqual({ valido: true, mensaje: null });
        });

        it('acepta edad como string numérico', () => {
            expect(validarEdad('25')).toEqual({ valido: true, mensaje: null });
        });

        it('rechaza edad menor a 16', () => {
            const resultado = validarEdad(15);
            expect(resultado.valido).toBe(false);
            expect(resultado.mensaje).toContain('16');
        });

        it('rechaza edad mayor a 99', () => {
            const resultado = validarEdad(100);
            expect(resultado.valido).toBe(false);
            expect(resultado.mensaje).toContain('99');
        });

        it('rechaza valores no enteros', () => {
            expect(validarEdad(16.5).valido).toBe(false);
            expect(validarEdad('abc').valido).toBe(false);
        });

        it('rechaza null, undefined y vacío', () => {
            expect(validarEdad(null).valido).toBe(false);
            expect(validarEdad(undefined).valido).toBe(false);
            expect(validarEdad('').valido).toBe(false);
        });
    });

    describe('validarCodigoPostal', () => {
        it('acepta código postal de 5 dígitos', () => {
            expect(validarCodigoPostal('14000')).toEqual({ valido: true, mensaje: null });
            expect(validarCodigoPostal('01234')).toEqual({ valido: true, mensaje: null });
        });

        it('rechaza valores no numéricos', () => {
            expect(validarCodigoPostal('abcde').valido).toBe(false);
            expect(validarCodigoPostal('1400a').valido).toBe(false);
        });

        it('rechaza longitud incorrecta', () => {
            expect(validarCodigoPostal('1400').valido).toBe(false);
            expect(validarCodigoPostal('140000').valido).toBe(false);
        });

        it('rechaza vacío y null', () => {
            expect(validarCodigoPostal('').valido).toBe(false);
            expect(validarCodigoPostal(null).valido).toBe(false);
        });
    });

    describe('validarTelefono', () => {
        it('acepta teléfono de 10 dígitos', () => {
            expect(validarTelefono('5512345678')).toEqual({ valido: true, mensaje: null });
        });

        it('rechaza valores no numéricos', () => {
            expect(validarTelefono('55-1234-567').valido).toBe(false);
            expect(validarTelefono('551234abcd').valido).toBe(false);
        });

        it('rechaza longitud incorrecta', () => {
            expect(validarTelefono('551234567').valido).toBe(false);
            expect(validarTelefono('55123456789').valido).toBe(false);
        });

        it('rechaza vacío y null', () => {
            expect(validarTelefono('').valido).toBe(false);
            expect(validarTelefono(null).valido).toBe(false);
        });
    });

    describe('validarEmail', () => {
        it('acepta emails válidos', () => {
            expect(validarEmail('usuario@dominio.com')).toEqual({ valido: true, mensaje: null });
            expect(validarEmail('test@example.org')).toEqual({ valido: true, mensaje: null });
            expect(validarEmail('user.name@sub.domain.com')).toEqual({ valido: true, mensaje: null });
        });

        it('rechaza email sin @', () => {
            expect(validarEmail('usuariodominio.com').valido).toBe(false);
        });

        it('rechaza email sin dominio', () => {
            expect(validarEmail('usuario@').valido).toBe(false);
            expect(validarEmail('usuario@dominio').valido).toBe(false);
        });

        it('rechaza vacío y null', () => {
            expect(validarEmail('').valido).toBe(false);
            expect(validarEmail(null).valido).toBe(false);
        });
    });

    describe('validarFormularioReservacion', () => {
        const datosValidos = {
            nombre_completo: 'Juan Pérez López',
            edad: 25,
            codigo_postal: '14000',
            telefono: '5512345678',
            email: 'juan@ejemplo.com'
        };

        it('retorna válido para datos completos y correctos', () => {
            const resultado = validarFormularioReservacion(datosValidos);
            expect(resultado.valido).toBe(true);
            expect(resultado.errores).toEqual({});
        });

        it('retorna errores para datos completamente inválidos', () => {
            const datosInvalidos = {
                nombre_completo: '',
                edad: 10,
                codigo_postal: 'abc',
                telefono: '123',
                email: 'invalido'
            };

            const resultado = validarFormularioReservacion(datosInvalidos);
            expect(resultado.valido).toBe(false);
            expect(resultado.errores.nombre_completo).toBeTruthy();
            expect(resultado.errores.edad).toBeTruthy();
            expect(resultado.errores.codigo_postal).toBeTruthy();
            expect(resultado.errores.telefono).toBeTruthy();
            expect(resultado.errores.email).toBeTruthy();
        });

        it('retorna error solo para el campo inválido', () => {
            const resultado = validarFormularioReservacion({
                ...datosValidos,
                telefono: '123'
            });
            expect(resultado.valido).toBe(false);
            expect(resultado.errores.telefono).toBeTruthy();
            expect(resultado.errores.nombre_completo).toBeUndefined();
            expect(resultado.errores.edad).toBeUndefined();
        });
    });
});
