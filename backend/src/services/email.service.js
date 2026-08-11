const emailConfig = require('../config/email');

/**
 * Servicio de Email.
 * En desarrollo, solo logea los emails a consola.
 * En producción, usaría nodemailer con SMTP real.
 */
const EmailService = {
    /**
     * Envía un email de confirmación de reservación.
     * @param {Object} datos - Datos para el email
     * @param {string} datos.destinatario - Email del cliente
     * @param {string} datos.folio - Folio de la reservación
     * @param {string} datos.cursoNombre - Nombre del curso
     * @param {string} datos.fecha - Fecha del slot (YYYY-MM-DD)
     * @param {string} datos.horaInicio - Hora de inicio (HH:MM)
     * @param {string} datos.horaFin - Hora de fin (HH:MM)
     * @param {string} datos.clienteNombre - Nombre del cliente
     * @returns {Promise<boolean>} true si se envió exitosamente
     */
    async enviarConfirmacionReservacion(datos) {
        const { destinatario, folio, cursoNombre, fecha, horaInicio, horaFin, clienteNombre } = datos;

        const asunto = `Confirmación de reservación - Folio ${folio}`;
        const cuerpo = `
Estimado/a ${clienteNombre},

Su reservación ha sido registrada exitosamente.

Detalles de la reservación:
- Folio: ${folio}
- Curso: ${cursoNombre}
- Fecha: ${fecha}
- Horario: ${horaInicio} - ${horaFin}

Por favor conserve su número de folio para cualquier consulta.

Atentamente,
AUTOSTAR Escuela de Manejo
        `.trim();

        return this._enviar({
            to: destinatario,
            subject: asunto,
            text: cuerpo
        });
    },

    /**
     * Envía un email de notificación de cancelación.
     * @param {Object} datos - Datos para el email
     * @param {string} datos.destinatario - Email del cliente
     * @param {string} datos.folio - Folio de la reservación
     * @param {string} datos.cursoNombre - Nombre del curso
     * @param {string} datos.fecha - Fecha del slot
     * @param {string} datos.clienteNombre - Nombre del cliente
     * @returns {Promise<boolean>} true si se envió exitosamente
     */
    async enviarNotificacionCancelacion(datos) {
        const { destinatario, folio, cursoNombre, fecha, clienteNombre } = datos;

        const asunto = `Cancelación de reservación - Folio ${folio}`;
        const cuerpo = `
Estimado/a ${clienteNombre},

Le informamos que su reservación ha sido cancelada.

Detalles:
- Folio: ${folio}
- Curso: ${cursoNombre}
- Fecha: ${fecha}

Si tiene alguna duda, no dude en contactarnos.

Atentamente,
AUTOSTAR Escuela de Manejo
        `.trim();

        return this._enviar({
            to: destinatario,
            subject: asunto,
            text: cuerpo
        });
    },

    /**
     * Método interno para enviar emails.
     * En desarrollo, logea a consola. En producción, usa nodemailer.
     * @param {Object} mailOptions - Opciones del email (to, subject, text)
     * @returns {Promise<boolean>} true si se procesó correctamente
     */
    async _enviar(mailOptions) {
        const emailData = {
            from: emailConfig.from,
            ...mailOptions
        };

        // En desarrollo: solo logear a consola
        if (process.env.NODE_ENV !== 'production') {
            console.log('═══════════════════════════════════════');
            console.log('📧 EMAIL (desarrollo - no enviado)');
            console.log('═══════════════════════════════════════');
            console.log(`De: ${emailData.from}`);
            console.log(`Para: ${emailData.to}`);
            console.log(`Asunto: ${emailData.subject}`);
            console.log('───────────────────────────────────────');
            console.log(emailData.text);
            console.log('═══════════════════════════════════════');
            return true;
        }

        // En producción: usar nodemailer
        try {
            const nodemailer = require('nodemailer');
            const transporter = nodemailer.createTransport({
                host: emailConfig.host,
                port: emailConfig.port,
                secure: emailConfig.secure,
                auth: emailConfig.auth
            });

            await transporter.sendMail(emailData);
            return true;
        } catch (error) {
            console.error('Error al enviar email:', error.message);
            // No lanzar error para no interrumpir el flujo de la reservación
            return false;
        }
    }
};

module.exports = EmailService;
