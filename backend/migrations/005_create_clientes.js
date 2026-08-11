/**
 * @type {import('knex').Knex.Migration}
 */
exports.up = function (knex) {
    return knex.schema.createTable('clientes', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('nombre_completo', 120).notNullable();
        table.integer('edad').notNullable();
        table.string('direccion', 100).notNullable();
        table.string('codigo_postal', 5).notNullable();
        table.string('telefono', 10).notNullable();
        table.string('email', 150).unique().notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    }).then(() => {
        return knex.raw(`
            ALTER TABLE clientes
            ADD CONSTRAINT clientes_edad_check CHECK (edad BETWEEN 16 AND 99)
        `);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('clientes');
};
