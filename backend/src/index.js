require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

// Configuración de CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));

// Parseo de JSON body
app.use(express.json({ limit: '10mb' }));

// Parseo de URL-encoded body
app.use(express.urlencoded({ extended: true }));

// Validación global de longitud máxima de campos de texto (10,000 caracteres)
const { inputLengthValidator } = require('./middlewares/inputLength');
app.use(inputLengthValidator);

// Ruta de health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rutas
const authRoutes = require('./routes/auth.routes');
const cursosRoutes = require('./routes/cursos.routes');

app.use('/api/auth', authRoutes);
app.use('/api/cursos', cursosRoutes);
app.use('/api/admin/cursos', cursosRoutes);

const instructoresRoutes = require('./routes/instructores.routes');
app.use('/api/admin/instructores', instructoresRoutes);

const horariosRoutes = require('./routes/horarios.routes');
const HorariosController = require('./controllers/horarios.controller');
app.use('/api/admin/horarios', horariosRoutes);

// Endpoint público: horarios disponibles por curso (próximas 4 semanas)
app.get('/api/cursos/:id/horarios', HorariosController.listarPorCurso);

const reservacionesRoutes = require('./routes/reservaciones.routes');
app.use('/api/reservaciones', reservacionesRoutes);
app.use('/api/admin/reservaciones', reservacionesRoutes);

const clasesRoutes = require('./routes/clases.routes');
const ClasesController = require('./controllers/clases.controller');
const { listarCancelacionesValidation, avanceClienteValidation } = require('./validators/clase.validator');
const authMiddleware = require('./middlewares/auth');
const validate = require('./middlewares/validate');
app.use('/api/admin/clases', clasesRoutes);

// GET /api/admin/cancelaciones — Historial de cancelaciones (montado directamente)
app.get('/api/admin/cancelaciones', authMiddleware, validate(listarCancelacionesValidation), ClasesController.listarCancelaciones);

// GET /api/admin/clientes/:id/avance — Avance de horas de un cliente
app.get('/api/admin/clientes/:id/avance', authMiddleware, validate(avanceClienteValidation), ClasesController.obtenerAvance);

// Manejo centralizado de errores (debe ir después de las rutas)
const { errorHandler } = require('./middlewares/errorHandler');
app.use(errorHandler);

// Puerto configurable via variable de entorno
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`Servidor AUTOSTAR corriendo en puerto ${PORT}`);
});

module.exports = { app, server };
