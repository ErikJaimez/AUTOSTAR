const db = require('../config/database');

/**
 * Modelo de Cliente.
 * Métodos de acceso a datos para la tabla `clientes`.
 */
const ClienteModel = {
    /**
     * Busca un cliente por su correo electrónico.
     * @param {string} email - Correo electrónico del cliente
     * @returns {Promise<Object|null>} El cliente encontrado o null
     */
    async findByEmail(email) {
        const cliente = await db('clientes')
            .where({ email: email.toLowerCase() })
            .first();
        return cliente || null;
    },

    /**
     * Busca un cliente por su ID.
     * @param {string} id - UUID del cliente
     * @returns {Promise<Object|null>} El cliente encontrado o null
     */
    async findById(id) {
        const cliente = await db('clientes').where({ id }).first();
        return cliente || null;
    },

    /**
     * Crea un nuevo cliente.
     * @param {Object} datos - Datos del cliente
     * @returns {Promise<Object>} El cliente creado
     */
    async create(datos) {
        const [cliente] = await db('clientes')
            .insert({
                nombre_completo: datos.nombre_completo,
                edad: datos.edad,
                direccion: datos.direccion,
                codigo_postal: datos.codigo_postal,
                telefono: datos.telefono,
                email: datos.email.toLowerCase()
            })
            .returning('*');

        return cliente;
    },

    /**
     * Actualiza un cliente existente.
     * @param {string} id - UUID del cliente
     * @param {Object} datos - Datos a actualizar
     * @returns {Promise<Object|null>} El cliente actualizado o null
     */
    async update(id, datos) {
        const updateData = { updated_at: db.fn.now() };

        if (datos.nombre_completo !== undefined) updateData.nombre_completo = datos.nombre_completo;
        if (datos.edad !== undefined) updateData.edad = datos.edad;
        if (datos.direccion !== undefined) updateData.direccion = datos.direccion;
        if (datos.codigo_postal !== undefined) updateData.codigo_postal = datos.codigo_postal;
        if (datos.telefono !== undefined) updateData.telefono = datos.telefono;
        if (datos.email !== undefined) updateData.email = datos.email.toLowerCase();

        const [cliente] = await db('clientes')
            .where({ id })
            .update(updateData)
            .returning('*');

        return cliente || null;
    },

    /**
     * Busca un cliente o lo crea si no existe (por email).
     * Si existe, actualiza sus datos.
     * @param {Object} datos - Datos del cliente
     * @returns {Promise<Object>} El cliente encontrado/creado
     */
    async findOrCreate(datos) {
        const existente = await this.findByEmail(datos.email);

        if (existente) {
            // Actualizar datos del cliente existente
            return this.update(existente.id, datos);
        }

        return this.create(datos);
    }
};

module.exports = ClienteModel;
