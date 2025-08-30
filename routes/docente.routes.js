const express = require('express');
const router = express.Router();
const pool = require('../db');

const authOptional = require('../middlewares/authenticate'); 

router.get('/ping', (_req, res) => res.json({ ok: true }));


router.get('/debug/list', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, rol, grado, activo
         FROM asistenciaqr.usuarios
        WHERE rol='docente'
        ORDER BY id`
    );
    res.json(rows);
  } catch (e) {
    console.error('debug/list', e);
    res.status(500).json({ error: 'debug/list failed' });
  }
});

// GET /api/docente/alumnos  
router.get('/alumnos', authOptional, async (req, res) => {
  try {
    const docenteId = req.user?.id || Number(req.query.docente_id);
    if (!docenteId) return res.status(400).json({ error: 'docente_id requerido (o envía JWT)' });

    const { rows: d } = await pool.query(
      `SELECT id, nombre, trim(grado) AS grado
         FROM asistenciaqr.usuarios
        WHERE id=$1 AND rol='docente' AND activo=TRUE
          AND grado IS NOT NULL AND trim(grado) <> ''
        LIMIT 1`,
      [docenteId]
    );
    if (!d.length) return res.status(404).json({ error: 'Docente no encontrado o sin grado asignado.' });

    const docente = d[0];
    const { rows: alumnos } = await pool.query(
      `SELECT id, nombre_completo, carnet, grado, activo, qr_codigo
         FROM asistenciaqr.alumnos
        WHERE lower(trim(grado)) = lower(trim($1))
        ORDER BY nombre_completo`,
      [docente.grado]
    );

    res.json({ docente, alumnos });
  } catch (e) {
    console.error('GET /api/docente/alumnos', e);
    res.status(500).json({ error: 'Error al obtener alumnos del docente' });
  }
});

// GET /api/docente/mis-alumnos  
const authRequired = require('../middlewares/authenticate'); 
router.get('/mis-alumnos', authRequired, async (req, res) => {
  try {
    const docenteId = req.user.id;

    const { rows: d } = await pool.query(
      `SELECT id, nombre, trim(grado) AS grado
         FROM asistenciaqr.usuarios
        WHERE id=$1 AND rol='docente' AND activo=TRUE
          AND grado IS NOT NULL AND trim(grado) <> ''
        LIMIT 1`,
      [docenteId]
    );
    if (!d.length) return res.status(404).json({ error: 'Docente no encontrado o sin grado asignado.' });

    const docente = d[0];
    const { rows: alumnos } = await pool.query(
      `SELECT id, nombre_completo, carnet, grado, activo, qr_codigo
         FROM asistenciaqr.alumnos
        WHERE lower(trim(grado)) = lower(trim($1))
        ORDER BY nombre_completo`,
      [docente.grado]
    );

    res.json({ docente, alumnos });
  } catch (e) {
    console.error('GET /api/docente/mis-alumnos', e);
    res.status(500).json({ error: 'Error al obtener alumnos del docente' });
  }
});


// GET /api/docente/:usuarioId/alumnos
router.get('/:usuarioId/alumnos', async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { rows: d } = await pool.query(
      `SELECT id, nombre, trim(grado) AS grado
         FROM asistenciaqr.usuarios
        WHERE id=$1 AND rol='docente' AND activo=TRUE
          AND grado IS NOT NULL AND trim(grado) <> ''
        LIMIT 1`,
      [usuarioId]
    );
    if (!d.length) return res.status(404).json({ error: 'Docente no encontrado o sin grado asignado.' });

    const docente = d[0];
    const { rows: alumnos } = await pool.query(
      `SELECT id, nombre_completo, carnet, grado, activo, qr_codigo
         FROM asistenciaqr.alumnos
        WHERE lower(trim(grado)) = lower(trim($1))
        ORDER BY nombre_completo`,
      [docente.grado]
    );

    res.json({ docente, alumnos });
  } catch (e) {
    console.error('GET /:usuarioId/alumnos', e);
    res.status(500).json({ error: 'Error al obtener alumnos del docente' });
  }
});

module.exports = router;
