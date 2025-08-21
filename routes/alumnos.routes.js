const express = require('express');
const router = express.Router();
const pool = require('../db');
const QRCode = require('qrcode');

// POST /api/alumnos -> crear alumno (sin usuario_id)
router.post('/', async (req, res) => {
  try {
    const { nombre_completo, carnet, grado, activo } = req.body;
    if (!nombre_completo || !carnet || !grado) {
      return res.status(400).json({ error: 'Faltan datos obligatorios.' });
    }

    const insert = await pool.query(
      `INSERT INTO asistenciaqr.alumnos (nombre_completo, carnet, grado, activo)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [nombre_completo.trim(), carnet.trim().toUpperCase(), grado.trim(), activo ?? true]
    );
    const alumno = insert.rows[0];

    // Generar QR con el carnet
    const dataUrl = await QRCode.toDataURL(String(alumno.carnet));
    await pool.query(
      `UPDATE asistenciaqr.alumnos SET qr_codigo = $1 WHERE carnet = $2`,
      [dataUrl, alumno.carnet]
    );

    const { rows } = await pool.query(
      `SELECT * FROM asistenciaqr.alumnos WHERE carnet = $1`,
      [alumno.carnet]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err?.code === '23505') {
      return res.status(409).json({ error: 'El carnet ya existe.' });
    }
    console.error('POST /api/alumnos error:', err);
    res.status(500).json({ error: 'Error al registrar alumno.' });
  }
});

// GET /api/alumnos -> lista (como antes, con docente por grado/fallback opcional)
router.get('/', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const grado = (req.query.grado || '').trim();
    const activoParam = req.query.activo;

    const clauses = [];
    const values = [];
    let i = 1;

    if (q) { clauses.push(`(a.nombre_completo ILIKE '%' || $${i} || '%' OR a.carnet ILIKE '%' || $${i} || '%')`); values.push(q); i++; }
    if (grado) { clauses.push(`a.grado ILIKE '%' || $${i} || '%'`); values.push(grado); i++; }
    if (typeof activoParam !== 'undefined') { clauses.push(`a.activo = $${i}`); values.push(String(activoParam).toLowerCase() === 'true'); i++; }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const sql = `
      WITH docente_global AS (
        SELECT u.nombre
        FROM asistenciaqr.usuarios u
        WHERE u.rol = 'docente' AND u.activo = TRUE
        ORDER BY u.id DESC
        LIMIT 1
      )
      SELECT
        a.id, a.nombre_completo, a.carnet, a.grado, a.activo, a.qr_codigo,
        COALESCE(u.nombre, dg.nombre) AS docente_nombre
      FROM asistenciaqr.alumnos a
      LEFT JOIN asistenciaqr.usuarios u
        ON lower(trim(u.grado)) = lower(trim(a.grado))
       AND u.rol = 'docente'
       AND u.activo = TRUE
      LEFT JOIN docente_global dg ON TRUE
      ${where}
      ORDER BY a.nombre_completo ASC
    `;
    const { rows } = await pool.query(sql, values);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/alumnos error:', err);
    res.status(500).json({ error: 'Error al consultar alumnos' });
  }
});

// GET /api/alumnos/:id/qr -> descarga PNG
router.get('/:id/qr', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT carnet FROM asistenciaqr.alumnos WHERE id = $1`,
      [id]
    );
    if (!rows.length) return res.status(404).send('Alumno no encontrado');

    const dataUrl = await QRCode.toDataURL(rows[0].carnet);
    const base64 = dataUrl.split(',')[1];
    const img = Buffer.from(base64, 'base64');

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="QR-${rows[0].carnet}.png"`);
    res.send(img);
  } catch (e) {
    console.error('GET /api/alumnos/:id/qr error:', e);
    res.status(500).send('Error generando QR');
  }
});

module.exports = router;
