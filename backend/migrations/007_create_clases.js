/**
 * @type {import('knex').Knex.Migration}
 */
exports.up = function (knex) {
    return knex.schema.createTable('clases', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('reservacion_id').notNullable()
            .references('id').inTable('reservaciones').onDelete('RESTRICT');
        table.uuid('instructor_id').notNullable()
            .references('id').inTable('instructores').onDelete('RESTRICT');
        table.uuid('slot_horario_id').notNullable()
            .references('id').inTable('slots_horario').onDelete('RESTRICT');
        table.date('fecha').notNullable();
        table.time('hora_inicio').notNullable();
        table.time('hora_fin').notNullable();
        table.string('estado', 20).notNullable().defaultTo('programada');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    }).then(() => {
        return knex.raw(`
            ALTER TABLE clases
            ADD CONSTRAINT clases_estado_check
            CHECK (estado IN ('programada', 'completada', 'cancelada'))
        `);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('clases');
};
