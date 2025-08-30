// server.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const cron = require('node-cron');
dotenv.config();

const app = express();

/* ===== Middlewares base ===== */
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// CORS manual (opcional junto con cors())
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

/* ===== Rutas importadas ===== */
const authRoutes = require('./routes/authRoutes');                 // /api/auth
const usuariosRoutes = require('./routes/usuarios.routes');        // /api/usuarios
const alumnosRoutes = require('./routes/alumnos.routes');          // /api/alumnos
const asistenciaRoutes = require('./routes/asistencia.routes');    // /api/asistencia
const reportesRoutes = require('./routes/reportes.routes');        // /api/reportes
const docenteRoutes = require('./routes/docente.routes');          // /api/docente
const direccionReportesRoutes = require('./routes/direccionReportes.routes'); // /api/direccion/reportes
const docenteReportesRoute = require('./routes/reporte.docente.routes'); // /api/docente/reportes



const { markAutoAbsences } = require('./routes/asistencia.routes');

/* ===== Health ===== */
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || 'dev', ts: new Date().toISOString() });
});

/* ===== Montaje de rutas ===== */
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/alumnos', alumnosRoutes);
app.use('/api/asistencia', asistenciaRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/docente', docenteRoutes);
app.use('/api/docente/reportes', docenteReportesRoute);

app.use('/api/direccion/reportes', direccionReportesRoutes);
/* ===== 404 ===== */
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.originalUrl,
    method: req.method
  });
});

/* ===== Error handler ===== */
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

/* ===== Start ===== */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});

/* ===== CRON: backfill de ausentes =====
   - Corre cada 15 min entre 14:00 y 23:59 en TZ local.
   - Dentro filtramos para que SOLO actúe a partir de 14:30.
   - Cubre alumnos creados después de la hora de corte.
*/
cron.schedule(
  '*/15 14-23 * * *',
  async () => {
    try {
      const now = new Date();
      // Si son las 14 y aún no llega 14:30, no hacer nada
      if (now.getHours() === 14 && now.getMinutes() < 30) return;

      const hoy = new Date().toISOString().slice(0, 10);
      const marcados = await markAutoAbsences(hoy);
      if (marcados) {
        console.log(`[CRON backfill] ${marcados} ausentes auto marcados para ${hoy}`);
      } else {
        console.log('[CRON backfill] Sin cambios (todo ya estaba marcado)');
      }
    } catch (e) {
      console.error('[CRON backfill] Error:', e);
    }
  },
  { timezone: 'America/Guatemala' } // ajusta si usas otra TZ
);
