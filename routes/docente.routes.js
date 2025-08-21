const express = require('express');
const router = express.Router();
const pool = require('../db');

// 1) Ping: confirma que /api/docente está montado
router.get('/ping', (_req, res) => {
  console.log('[docente.routes] ping OK');
  res.json({ ok: true, route: '/api/docente/ping' });
});

// 2) Debug: lista docentes que VE el backend (mismo esquema y DB que usa tu API)
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
    console.error('debug/list error:', e);
    res.status(500).json({ error: 'debug/list failed' });
  }
});

// 3) Endpoint real: alumnos del docente por ID
//    Incluye fallback: si el id no existe/activo o no tiene grado, usa el primer docente activo con grado.
router.get('/:usuarioId/alumnos', async (req, res) => {
  try {
    const { usuarioId } = req.params;

    // intentamos con el id solicitado
    let q = `
      SELECT id, nombre, grado
      FROM asistenciaqr.usuarios
      WHERE id = $1 AND rol='docente' AND activo=TRUE AND grado IS NOT NULL AND trim(grado) <> ''
      LIMIT 1
    `;
    let params = [usuarioId];
    let { rows: d1 } = await pool.query(q, params);

    // fallback: primer docente activo con grado
    if (!d1.length) {
      const { rows: d2 } = await pool.query(
        `SELECT id, nombre, grado
         FROM asistenciaqr.usuarios
         WHERE rol='docente' AND activo=TRUE AND grado IS NOT NULL AND trim(grado) <> ''
         ORDER BY id
         LIMIT 1`
      );
      if (!d2.length) {
        return res.status(404).json({
          error: 'No hay docentes activos con grado asignado.',
          diagnosis: { requestedId: Number(usuarioId), foundAnyDocente: false }
        });
      }
      d1 = d2;
    }

    const docente = d1[0];
    const grado = docente.grado.trim();

    const { rows: alumnos } = await pool.query(
      `SELECT id, nombre_completo, carnet, grado, activo, qr_codigo
       FROM asistenciaqr.alumnos
       WHERE lower(trim(grado)) = lower(trim($1))
       ORDER BY nombre_completo`,
      [grado]
    );

    res.json({
      docente: { id: docente.id, nombre: docente.nombre, grado },
      alumnos
    });
  } catch (e) {
    console.error('GET /api/docente/:usuarioId/alumnos error:', e);
    res.status(500).json({ error: 'Error al obtener alumnos del docente' });
  }
});

module.exports = router;
