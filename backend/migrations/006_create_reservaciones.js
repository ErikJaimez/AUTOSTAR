/**
 * @type {import('knex').Knex.Migration}
 */
exports.up = function (knex) {
    return knex.schema.createTable('reservaciones', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('folio', 20).unique().notNullable();
        table.uuid('cliente_id').notNullable()
            .references('id').inTable('clientes').onDelete('RESTRICT');
        table.uuid('slot_horario_id').notNullable()
            .references('id').inTable('slots_horario').onDelete('RESTRICT');
        table.uuid('curso_id').notNullable()
            .references('id').inTable('cursos').onDelete('RESTRICT');
        table.string('estado', 20).notNullable().defaultTo('pendiente');
        table.timestamp('fecha_cambio_estado').nullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    }).then(() => {
        return knex.raw(`
            ALTER TABLE reservaciones
            ADD CONSTRAINT reservaciones_estado_check
            CHECK (estado IN ('pendiente', 'confirmada', 'completada', 'cancelada'))
        `);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('reservaciones');
};
