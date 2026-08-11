/**
 * @type {import('knex').Knex.Migration}
 */
exports.up = function (knex) {
    return knex.schema.createTable('usuarios', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('nombre_usuario', 100).unique().notNullable();
        table.string('email', 150).unique().notNullable();
        table.string('contrasena_hash', 255).notNullable();
        table.integer('intentos_fallidos').defaultTo(0);
        table.timestamp('bloqueado_hasta').nullable();
        table.boolean('activo').defaultTo(true);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('usuarios');
};
