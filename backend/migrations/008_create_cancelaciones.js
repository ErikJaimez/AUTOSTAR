/**
 * @type {import('knex').Knex.Migration}
 */
exports.up = function (knex) {
    return knex.schema.createTable('cancelaciones', (table) => {
        table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
        table.uuid('clase_id').notNullable()
            .references('id').inTable('clases').onDelete('RESTRICT');
        table.uuid('admin_id').notNullable()
            .references('id').inTable('usuarios').onDelete('RESTRICT');
        table.string('motivo', 500).notNullable();
        table.uuid('clase_reprogramada_id').nullable()
            .references('id').inTable('clases');
        table.timestamp('fecha_cancelacion').notNullable().defaultTo(knex.fn.now());
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    }).then(() => {
        return knex.raw(`
            ALTER TABLE cancelaciones
            ADD CONSTRAINT cancelaciones_motivo_length_check CHECK (LENGTH(motivo) >= 10)
        `);
    }).then(() => {
        // Performance indices
        return knex.raw(`
            CREATE INDEX idx_reservaciones_estado ON reservaciones(estado);
            CREATE INDEX idx_reservaciones_fecha ON reservaciones(created_at);
            CREATE INDEX idx_reservaciones_cliente ON reservaciones(cliente_id);
            CREATE INDEX idx_slots_horario_instructor ON slots_horario(instructor_id, fecha);
            CREATE INDEX idx_slots_horario_curso ON slots_horario(curso_id);
            CREATE INDEX idx_clases_reservacion ON clases(reservacion_id);
            CREATE INDEX idx_clases_instructor ON clases(instructor_id, fecha);
            CREATE INDEX idx_cancelaciones_clase ON cancelaciones(clase_id);
        `);
    });
};

exports.down = function (knex) {
    return knex.raw(`
        DROP INDEX IF EXISTS idx_cancelaciones_clase;
        DROP INDEX IF EXISTS idx_clases_instructor;
        DROP INDEX IF EXISTS idx_clases_reservacion;
        DROP INDEX IF EXISTS idx_slots_horario_curso;
        DROP INDEX IF EXISTS idx_slots_horario_instructor;
        DROP INDEX IF EXISTS idx_reservaciones_cliente;
        DROP INDEX IF EXISTS idx_reservaciones_fecha;
        DROP INDEX IF EXISTS idx_reservaciones_estado;
    `).then(() => {
        return knex.schema.dropTableIfExists('cancelaciones');
    });
};
