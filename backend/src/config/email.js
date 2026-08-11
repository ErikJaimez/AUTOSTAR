module.exports = {
    host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || ''
    },
    from: process.env.EMAIL_FROM || 'AUTOSTAR Escuela de Manejo <noreply@autostar.mx>'
};
