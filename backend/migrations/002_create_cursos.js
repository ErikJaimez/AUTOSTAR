/**
 * @type {import('knex').Knex.Migration}
 */
exports.up = function (knex) {
    return knex.schema.createTable('cursos', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.string('nombre', 100).notNullable();
        table.string('descripcion', 2000).notNullable();
        table.string('descripcion_resumida', 150).nullable();
        table.integer('duracion_horas').notNullable();
        table.decimal('precio', 10, 2).notNullable();
        table.string('categoria_licencia', 50).notNullable();
        table.string('requisitos_previos', 500).nullable();
        table.boolean('activo').defaultTo(true);
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    }).then(() => {
        return knex.raw(`
            ALTER TABLE cursos
            ADD CONSTRAINT cursos_duracion_horas_check CHECK (duracion_horas BETWEEN 1 AND 200)
        `);
    }).then(() => {
        return knex.raw(`
            ALTER TABLE cursos
            ADD CONSTRAINT cursos_precio_check CHECK (precio BETWEEN 0.01 AND 99999.99)
        `);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('cursos');
};
