const bcrypt = require('bcryptjs');

/**
 * @type {import('knex').Knex.Seed}
 */
exports.seed = async function (knex) {
    const adminEmail = 'admin@autostar.mx';
    const adminUsername = 'admin';

    // Verificar si el usuario admin ya existe (idempotencia)
    const existingUser = await knex('usuarios')
        .where({ email: adminEmail })
        .orWhere({ nombre_usuario: adminUsername })
        .first();

    if (existingUser) {
        console.log('Usuario administrador ya existe, omitiendo inserción.');
        return;
    }

    const contrasenaHash = await bcrypt.hash('Admin123!', 10);

    await knex('usuarios').insert({
        nombre_usuario: adminUsername,
        email: adminEmail,
        contrasena_hash: contrasenaHash,
        intentos_fallidos: 0,
        bloqueado_hasta: null,
        activo: true,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
    });

    console.log('Usuario administrador creado exitosamente.');
};
