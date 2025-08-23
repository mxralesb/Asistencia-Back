// routes/reportes.routes.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/reportes/alumno/:alumnoId?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
router.get('/alumno/:alumnoId', async (req, res) => {
  try {
    const { alumnoId } = req.params;
    let { desde, hasta } = req.query;

    // 1) Alumno existe
    const a = await pool.query(
      `SELECT id, nombre_completo, carnet, grado
       FROM asistenciaqr.alumnos
       WHERE id = $1`,
      [alumnoId]
    );
    if (!a.rowCount) return res.status(404).json({ error: 'Alumno no encontrado' });
    const alumno = a.rows[0];

    // 2) Rango por defecto (últimos 30 días) en formato texto YYYY-MM-DD
    if (!desde || !hasta) {
      const def = await pool.query(`
        SELECT
          to_char(CURRENT_DATE - INTERVAL '29 days', 'YYYY-MM-DD') AS desde,
          to_char(CURRENT_DATE, 'YYYY-MM-DD') AS hasta
      `);
      if (!desde) desde = def.rows[0].desde;
      if (!hasta) hasta = def.rows[0].hasta;
    }

    // 3) Filtros fecha
    const filtros = [];
    const vals = [alumnoId];
    let i = 2;
    if (desde) { filtros.push(`f.fecha >= $${i}::date`); vals.push(desde); i++; }
    if (hasta) { filtros.push(`f.fecha <= $${i}::date`); vals.push(hasta); i++; }
    const whereFecha = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';

    // 4) Detalle por fecha (incluye sin registro)
    const detalleSQL = `
      WITH fechas AS (
        SELECT id, fecha
        FROM asistenciaqr.fechas_asistencia f
        ${whereFecha}
        ORDER BY fecha DESC
      )
      SELECT
        to_char(f.fecha, 'YYYY-MM-DD') AS fecha,
        COALESCE(asis.estado, 'sin_registro') AS estado,
        asis.observaciones
      FROM fechas f
      LEFT JOIN asistenciaqr.asistencia asis
        ON asis.fecha_id = f.id
       AND asis.alumno_id = $1
      ORDER BY f.fecha DESC
    `;
    const { rows: detalle } = await pool.query(detalleSQL, vals);

    // 5) Resumen
    const resumen = detalle.reduce((acc, r) => {
      acc[r.estado] = (acc[r.estado] || 0) + 1;
      acc.total = (acc.total || 0) + 1;
      return acc;
    }, { total: 0 });

    // 6) Respuesta (compat: registros = detalle)
    res.json({
      alumno,
      rango: { desde, hasta },
      total: resumen.total,
      resumen,              // { presente, tarde, ausente, sin_registro, total }
      detalle,              // array con { fecha, estado, observaciones }
      registros: detalle    // alias para compatibilidad con el front
    });
  } catch (e) {
    console.error('GET /api/reportes/alumno/:alumnoId error:', e);
    res.status(500).json({ error: 'Error generando reporte del alumno' });
  }
});

module.exports = router;
