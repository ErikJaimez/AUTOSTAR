module.exports = {
    secret: process.env.JWT_SECRET || 'autostar-dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '60m',
    algorithm: 'HS256'
};
