/**
 * @type {import('knex').Knex.Migration}
 */
exports.up = function (knex) {
    return knex.schema.createTable('instructores', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('nombre_completo', 120).notNullable();
        table.string('telefono', 10).notNullable();
        table.string('email', 150).unique().notNullable();
        table.boolean('activo').defaultTo(true);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('instructores');
};
