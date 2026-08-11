import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { agruparPorCategoria, filtrarCursosActivos, validarDatosCurso } from './curso.utils.js';

/**
 * Generador de datos de curso para property-based testing.
 */
const cursoArbitrary = fc.record({
    nombre: fc.string({ minLength: 0, maxLength: 120 }),
    descripcion: fc.string({ minLength: 0, maxLength: 2500 }),
    duracion_horas: fc.integer({ min: -10, max: 300 }),
    precio: fc.double({ min: -100, max: 200000, noNaN: true, noDefaultInfinity: true }),
    categoria_licencia: fc.string({ minLength: 0, maxLength: 60 }),
    activo: fc.boolean()
});

/**
 * Property 1: Filtrado de cursos activos
 * *Para cualquier* lista de cursos con estados mixtos (activos/inactivos),
 * la función de filtrado SHALL retornar únicamente los cursos con estado activo,
 * y la cantidad de resultados siempre será menor o igual a la lista original.
 *
 * **Validates: Requirements 1.1**
 */
describe('Property 1: Filtrado de cursos activos', () => {
    it('retorna únicamente cursos con estado activo', () => {
        fc.assert(
            fc.property(
                fc.array(cursoArbitrary, { minLength: 0, maxLength: 50 }),
                (cursos) => {
                    const resultado = filtrarCursosActivos(cursos);

                    // Todos los cursos retornados deben tener activo === true
                    for (const curso of resultado) {
                        expect(curso.activo).toBe(true);
                    }
                }
            ),
            { numRuns: 200 }
        );
    });

    it('la cantidad de resultados es menor o igual a la lista original', () => {
        fc.assert(
            fc.property(
                fc.array(cursoArbitrary, { minLength: 0, maxLength: 50 }),
                (cursos) => {
                    const resultado = filtrarCursosActivos(cursos);
                    expect(resultado.length).toBeLessThanOrEqual(cursos.length);
                }
            ),
            { numRuns: 200 }
        );
    });

    it('no descarta ningún curso activo de la lista original', () => {
        fc.assert(
            fc.property(
                fc.array(cursoArbitrary, { minLength: 0, maxLength: 50 }),
                (cursos) => {
                    const resultado = filtrarCursosActivos(cursos);
                    const activosEsperados = cursos.filter((c) => c.activo === true);

                    expect(resultado.length).toBe(activosEsperados.length);
                }
            ),
            { numRuns: 200 }
        );
    });
});

/**
 * Property 2: Agrupación por categoría de licencia
 * *Para cualquier* lista de cursos activos, la función de agrupación por categoría
 * SHALL producir grupos donde cada curso pertenece exactamente al grupo de su categoría,
 * y la suma de todos los cursos en todos los grupos es igual al total de cursos de entrada.
 *
 * **Validates: Requirements 1.3**
 */
describe('Property 2: Agrupación por categoría de licencia', () => {
    it('cada curso pertenece al grupo de su categoría', () => {
        fc.assert(
            fc.property(
                fc.array(cursoArbitrary, { minLength: 0, maxLength: 50 }),
                (cursos) => {
                    const grupos = agruparPorCategoria(cursos);

                    // Cada grupo debe contener solo cursos con esa categoría
                    for (const [categoria, cursosGrupo] of Object.entries(grupos)) {
                        for (const curso of cursosGrupo) {
                            const categoriaEsperada = curso.categoria_licencia || '';
                            expect(categoriaEsperada).toBe(categoria);
                        }
                    }
                }
            ),
            { numRuns: 200 }
        );
    });

    it('la suma de cursos en todos los grupos es igual al total de entrada', () => {
        fc.assert(
            fc.property(
                fc.array(cursoArbitrary, { minLength: 0, maxLength: 50 }),
                (cursos) => {
                    const grupos = agruparPorCategoria(cursos);

                    const totalEnGrupos = Object.values(grupos).reduce(
                        (sum, grupo) => sum + grupo.length,
                        0
                    );

                    expect(totalEnGrupos).toBe(cursos.length);
                }
            ),
            { numRuns: 200 }
        );
    });

    it('el número de grupos es igual al número de categorías únicas', () => {
        fc.assert(
            fc.property(
                fc.array(cursoArbitrary, { minLength: 1, maxLength: 50 }),
                (cursos) => {
                    const grupos = agruparPorCategoria(cursos);
                    const categoriasUnicas = new Set(
                        cursos.map((c) => c.categoria_licencia || '')
                    );

                    expect(Object.keys(grupos).length).toBe(categoriasUnicas.size);
                }
            ),
            { numRuns: 200 }
        );
    });
});

/**
 * Property 8: Validación de datos de curso
 * *Para cualquier* conjunto de datos de entrada para crear/editar un curso,
 * la función de validación SHALL aceptar solo cuando: nombre tiene 1-100 caracteres,
 * descripción tiene 1-2000 caracteres, duración está entre 1-200 horas,
 * precio está entre $0.01-$99,999.99, categoría de licencia no está vacía,
 * y todos los campos obligatorios están presentes.
 *
 * **Validates: Requirements 4.2, 4.7**
 */
describe('Property 8: Validación de datos de curso', () => {
    /**
     * Generador de datos de curso VÁLIDOS.
     */
    const cursoValidoArbitrary = fc.record({
        nombre: fc.string({ minLength: 1, maxLength: 100 }),
        descripcion: fc.string({ minLength: 1, maxLength: 2000 }),
        duracion_horas: fc.integer({ min: 1, max: 200 }),
        precio: fc.double({ min: 0.01, max: 99999.99, noNaN: true, noDefaultInfinity: true }),
        categoria_licencia: fc.string({ minLength: 1, maxLength: 50 }),
        activo: fc.boolean()
    });

    it('acepta datos que cumplen todas las reglas de validación', () => {
        fc.assert(
            fc.property(cursoValidoArbitrary, (datos) => {
                const resultado = validarDatosCurso(datos);
                expect(resultado.valido).toBe(true);
                expect(resultado.errores).toHaveLength(0);
            }),
            { numRuns: 200 }
        );
    });

    it('rechaza cuando el nombre excede 100 caracteres', () => {
        fc.assert(
            fc.property(
                fc.record({
                    nombre: fc.string({ minLength: 101, maxLength: 120 }),
                    descripcion: fc.string({ minLength: 1, maxLength: 2000 }),
                    duracion_horas: fc.integer({ min: 1, max: 200 }),
                    precio: fc.double({ min: 0.01, max: 99999.99, noNaN: true, noDefaultInfinity: true }),
                    categoria_licencia: fc.string({ minLength: 1, maxLength: 50 }),
                    activo: fc.boolean()
                }),
                (datos) => {
                    const resultado = validarDatosCurso(datos);
                    expect(resultado.valido).toBe(false);
                    expect(resultado.errores.some((e) => e.campo === 'nombre')).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('rechaza cuando la descripción excede 2000 caracteres', () => {
        fc.assert(
            fc.property(
                fc.record({
                    nombre: fc.string({ minLength: 1, maxLength: 100 }),
                    descripcion: fc.string({ minLength: 2001, maxLength: 2500 }),
                    duracion_horas: fc.integer({ min: 1, max: 200 }),
                    precio: fc.double({ min: 0.01, max: 99999.99, noNaN: true, noDefaultInfinity: true }),
                    categoria_licencia: fc.string({ minLength: 1, maxLength: 50 }),
                    activo: fc.boolean()
                }),
                (datos) => {
                    const resultado = validarDatosCurso(datos);
                    expect(resultado.valido).toBe(false);
                    expect(resultado.errores.some((e) => e.campo === 'descripcion')).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('rechaza cuando la duración está fuera del rango 1-200', () => {
        fc.assert(
            fc.property(
                fc.record({
                    nombre: fc.string({ minLength: 1, maxLength: 100 }),
                    descripcion: fc.string({ minLength: 1, maxLength: 2000 }),
                    duracion_horas: fc.oneof(
                        fc.integer({ min: -10, max: 0 }),
                        fc.integer({ min: 201, max: 300 })
                    ),
                    precio: fc.double({ min: 0.01, max: 99999.99, noNaN: true, noDefaultInfinity: true }),
                    categoria_licencia: fc.string({ minLength: 1, maxLength: 50 }),
                    activo: fc.boolean()
                }),
                (datos) => {
                    const resultado = validarDatosCurso(datos);
                    expect(resultado.valido).toBe(false);
                    expect(resultado.errores.some((e) => e.campo === 'duracion_horas')).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('rechaza cuando el precio está fuera del rango $0.01-$99,999.99', () => {
        fc.assert(
            fc.property(
                fc.record({
                    nombre: fc.string({ minLength: 1, maxLength: 100 }),
                    descripcion: fc.string({ minLength: 1, maxLength: 2000 }),
                    duracion_horas: fc.integer({ min: 1, max: 200 }),
                    precio: fc.oneof(
                        fc.double({ min: -100, max: 0, noNaN: true, noDefaultInfinity: true }),
                        fc.double({ min: 100000, max: 200000, noNaN: true, noDefaultInfinity: true })
                    ),
                    categoria_licencia: fc.string({ minLength: 1, maxLength: 50 }),
                    activo: fc.boolean()
                }),
                (datos) => {
                    const resultado = validarDatosCurso(datos);
                    expect(resultado.valido).toBe(false);
                    expect(resultado.errores.some((e) => e.campo === 'precio')).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('rechaza cuando la categoría de licencia está vacía', () => {
        fc.assert(
            fc.property(
                fc.record({
                    nombre: fc.string({ minLength: 1, maxLength: 100 }),
                    descripcion: fc.string({ minLength: 1, maxLength: 2000 }),
                    duracion_horas: fc.integer({ min: 1, max: 200 }),
                    precio: fc.double({ min: 0.01, max: 99999.99, noNaN: true, noDefaultInfinity: true }),
                    categoria_licencia: fc.constant(''),
                    activo: fc.boolean()
                }),
                (datos) => {
                    const resultado = validarDatosCurso(datos);
                    expect(resultado.valido).toBe(false);
                    expect(resultado.errores.some((e) => e.campo === 'categoria_licencia')).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('rechaza cuando faltan campos obligatorios', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('nombre', 'descripcion', 'duracion_horas', 'precio', 'categoria_licencia', 'activo'),
                fc.record({
                    nombre: fc.string({ minLength: 1, maxLength: 100 }),
                    descripcion: fc.string({ minLength: 1, maxLength: 2000 }),
                    duracion_horas: fc.integer({ min: 1, max: 200 }),
                    precio: fc.double({ min: 0.01, max: 99999.99, noNaN: true, noDefaultInfinity: true }),
                    categoria_licencia: fc.string({ minLength: 1, maxLength: 50 }),
                    activo: fc.boolean()
                }),
                (campoFaltante, datos) => {
                    const datosIncompletos = { ...datos };
                    delete datosIncompletos[campoFaltante];

                    const resultado = validarDatosCurso(datosIncompletos);
                    expect(resultado.valido).toBe(false);
                    expect(resultado.errores.some((e) => e.campo === campoFaltante)).toBe(true);
                }
            ),
            { numRuns: 200 }
        );
    });

    it('datos generados aleatoriamente: solo valida cuando todas las reglas se cumplen', () => {
        fc.assert(
            fc.property(cursoArbitrary, (datos) => {
                const resultado = validarDatosCurso(datos);

                const nombreValido =
                    typeof datos.nombre === 'string' &&
                    datos.nombre.length >= 1 &&
                    datos.nombre.length <= 100;
                const descripcionValida =
                    typeof datos.descripcion === 'string' &&
                    datos.descripcion.length >= 1 &&
                    datos.descripcion.length <= 2000;
                const duracionValida =
                    Number.isInteger(datos.duracion_horas) &&
                    datos.duracion_horas >= 1 &&
                    datos.duracion_horas <= 200;
                const precioValido =
                    typeof datos.precio === 'number' &&
                    !isNaN(datos.precio) &&
                    datos.precio >= 0.01 &&
                    datos.precio <= 99999.99;
                const categoriaValida =
                    typeof datos.categoria_licencia === 'string' &&
                    datos.categoria_licencia.length >= 1;
                const activoValido = typeof datos.activo === 'boolean';

                const deberiaSerValido =
                    nombreValido &&
                    descripcionValida &&
                    duracionValida &&
                    precioValido &&
                    categoriaValida &&
                    activoValido;

                expect(resultado.valido).toBe(deberiaSerValido);
            }),
            { numRuns: 500 }
        );
    });
});
