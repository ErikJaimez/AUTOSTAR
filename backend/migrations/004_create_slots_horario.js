/**
 * @type {import('knex').Knex.Migration}
 */
exports.up = function (knex) {
    return knex.schema.createTable('slots_horario', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('curso_id').notNullable()
            .references('id').inTable('cursos').onDelete('RESTRICT');
        table.uuid('instructor_id').notNullable()
            .references('id').inTable('instructores').onDelete('RESTRICT');
        table.date('fecha').notNullable();
        table.time('hora_inicio').notNullable();
        table.time('hora_fin').notNullable();
        table.integer('capacidad_maxima').notNullable();
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    }).then(() => {
        return knex.raw(`
            ALTER TABLE slots_horario
            ADD CONSTRAINT slots_horario_capacidad_maxima_check CHECK (capacidad_maxima BETWEEN 1 AND 30)
        `);
    }).then(() => {
        return knex.raw(`
            ALTER TABLE slots_horario
            ADD CONSTRAINT hora_fin_mayor CHECK (hora_fin > hora_inicio)
        `);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('slots_horario');
};
