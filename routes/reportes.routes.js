// routes/reportes.routes.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/reportes/alumno/:alumnoId?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
router.get('/alumno/:alumnoId', async (req, res) => {
  try {
    const { alumnoId } = req.params;
    let { desde, hasta } = req.query;

    // A) Verificar alumno
    const { rows: alumnoRows } = await pool.query(
      `SELECT id, nombre_completo, carnet, grado
       FROM asistenciaqr.alumnos
       WHERE id = $1`,
      [alumnoId]
    );
    if (!alumnoRows.length) return res.status(404).json({ error: 'Alumno no encontrado' });
    const alumno = alumnoRows[0];

    
    if (!desde || !hasta) {
      const { rows: todayRows } = await pool.query(`SELECT CURRENT_DATE::date AS hoy`);
      const hoy = todayRows[0].hoy;
      const { rows: defRows } = await pool.query(
        `SELECT ($1::date - INTERVAL '29 days')::date AS desde, $1::date AS hasta`,
        [hoy]
      );
      desde = desde || defRows[0].desde.toISOString().slice(0,10);
      hasta = hasta || defRows[0].hasta.toISOString().slice(0,10);
    }

   
    const filtros = [];
    const valores = [alumnoId];
    let i = 2;
    if (desde) { filtros.push(`f.fecha >= $${i}::date`); valores.push(desde); i++; }
    if (hasta) { filtros.push(`f.fecha <= $${i}::date`); valores.push(hasta); i++; }
    const whereFecha = filtros.length ? `AND ${filtros.join(' AND ')}` : '';

  
    const sql = `
      WITH fechas AS (
        SELECT id, fecha
        FROM asistenciaqr.fechas_asistencia f
        WHERE 1=1 ${whereFecha}
        ORDER BY fecha DESC
      )
      SELECT 
        $1::int AS alumno_id,
        a.nombre_completo,
        a.carnet,
        a.grado,
        f.fecha::date AS fecha,
        COALESCE(asis.estado, 'sin_registro') AS estado,
        asis.observaciones,
        u.nombre AS docente_nombre,
        (
          SELECT (regexp_match(COALESCE(asis.observaciones,''), '([0-2][0-9]:[0-5][0-9])'))[1]
        ) AS hora
      FROM fechas f
      CROSS JOIN asistenciaqr.alumnos a
      LEFT JOIN asistenciaqr.asistencia asis
        ON asis.alumno_id = a.id
       AND asis.fecha_id = f.id
      LEFT JOIN asistenciaqr.usuarios u
        ON u.id = asis.registrado_por
      WHERE a.id = $1
      ORDER BY f.fecha DESC;
    `;

    const { rows } = await pool.query(sql, valores);

    // Resumen
    const resumen = rows.reduce((acc, r) => {
      const key = r.estado || 'sin_registro';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const total = rows.length;

    res.json({
      alumno,
      rango: { desde, hasta },
      total,
      resumen,
      registros: rows
    });
  } catch (e) {
    console.error('GET /api/reportes/alumno/:alumnoId error:', e);
    res.status(500).json({ error: 'Error generando reporte del alumno' });
  }
});

module.exports = router;
