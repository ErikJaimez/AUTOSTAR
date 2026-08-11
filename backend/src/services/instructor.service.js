const InstructorModel = require('../models/instructor.model');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Servicio de Instructores.
 * Contiene la lógica de negocio para la gestión de instructores.
 */
const InstructorService = {
    /**
     * Lista todos los instructores ordenados alfabéticamente,
     * incluyendo el conteo de clases asignadas.
     * @returns {Promise<Array>} Lista de instructores
     */
    async listar() {
        return InstructorModel.findAll();
    },

    /**
     * Crea un nuevo instructor validando unicidad de email.
     * @param {Object} datos - { nombre_completo, telefono, email, activo }
     * @returns {Promise<Object>} El instructor creado
     * @throws {AppError} Si el email ya está registrado
     */
    async crear(datos) {
        // Verificar unicidad de email
        const existente = await InstructorModel.findByEmail(datos.email);
        if (existente) {
            throw new AppError(
                'CONFLICTO',
                'Ya existe un instructor registrado con ese correo electrónico',
                409,
                [{ campo: 'email', mensaje: 'El correo electrónico ya está registrado' }]
            );
        }

        return InstructorModel.create(datos);
    },

    /**
     * Actualiza un instructor existente.
     * Si se cambia activo a false, verifica que no tenga clases futuras programadas.
     * Si se cambia el email, verifica unicidad.
     * @param {string} id - UUID del instructor
     * @param {Object} datos - Datos a actualizar
     * @returns {Promise<Object>} El instructor actualizado
     * @throws {AppError} Si no se encuentra, si hay conflicto de email, o si tiene clases al desactivar
     */
    async actualizar(id, datos) {
        // Verificar que el instructor existe
        const instructor = await InstructorModel.findById(id);
        if (!instructor) {
            throw new AppError(
                'NO_ENCONTRADO',
                'El instructor solicitado no fue encontrado',
                404
            );
        }

        // Verificar unicidad de email si se cambia
        if (datos.email && datos.email !== instructor.email) {
            const existente = await InstructorModel.findByEmail(datos.email);
            if (existente) {
                throw new AppError(
                    'CONFLICTO',
                    'Ya existe un instructor registrado con ese correo electrónico',
                    409,
                    [{ campo: 'email', mensaje: 'El correo electrónico ya está registrado' }]
                );
            }
        }

        // Verificar clases futuras si se desactiva
        if (datos.activo === false && instructor.activo === true) {
            const clasesFuturas = await InstructorModel.contarClasesFuturas(id);

            if (clasesFuturas > 0) {
                const detalleClases = await InstructorModel.obtenerClasesFuturas(id);

                throw new AppError(
                    'CONFLICTO',
                    `No se puede desactivar al instructor porque tiene ${clasesFuturas} clase(s) programada(s) que deben reasignarse`,
                    409,
                    detalleClases.map((clase) => ({
                        campo: 'activo',
                        mensaje: `Clase ${clase.curso_nombre || ''} - ${clase.fecha} ${clase.hora_inicio}-${clase.hora_fin}`
                    }))
                );
            }
        }

        return InstructorModel.update(id, datos);
    },

    /**
     * Obtiene la agenda semanal de un instructor.
     * Si no se provee fecha, usa la semana actual.
     * Agrupa las clases por día de la semana.
     * @param {string} id - UUID del instructor
     * @param {string} [fecha] - Fecha dentro de la semana deseada (YYYY-MM-DD)
     * @returns {Promise<Object>} { instructor, semana: { inicio, fin }, dias: { [fecha]: clases[] } }
     * @throws {AppError} Si el instructor no existe
     */
    async obtenerAgenda(id, fecha) {
        // Verificar que el instructor existe
        const instructor = await InstructorModel.findById(id);
        if (!instructor) {
            throw new AppError(
                'NO_ENCONTRADO',
                'El instructor solicitado no fue encontrado',
                404
            );
        }

        // Calcular inicio y fin de la semana (lunes a domingo)
        const referencia = fecha ? new Date(fecha) : new Date();
        const diaSemana = referencia.getDay(); // 0=domingo, 1=lunes...
        const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;

        const lunes = new Date(referencia);
        lunes.setDate(referencia.getDate() + diffLunes);
        lunes.setHours(0, 0, 0, 0);

        const domingo = new Date(lunes);
        domingo.setDate(lunes.getDate() + 6);
        domingo.setHours(23, 59, 59, 999);

        const fechaInicio = lunes.toISOString().split('T')[0];
        const fechaFin = domingo.toISOString().split('T')[0];

        const clases = await InstructorModel.obtenerAgendaSemanal(id, fechaInicio, fechaFin);

        // Agrupar por día
        const dias = {};
        for (const clase of clases) {
            const fechaClase = typeof clase.fecha === 'string'
                ? clase.fecha.split('T')[0]
                : new Date(clase.fecha).toISOString().split('T')[0];

            if (!dias[fechaClase]) {
                dias[fechaClase] = [];
            }
            dias[fechaClase].push(clase);
        }

        return {
            instructor: {
                id: instructor.id,
                nombre_completo: instructor.nombre_completo
            },
            semana: {
                inicio: fechaInicio,
                fin: fechaFin
            },
            dias
        };
    }
};

module.exports = InstructorService;
