const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/reportes/alumno/:alumnoId?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
router.get('/alumno/:alumnoId', async (req, res) => {
  try {
    const { alumnoId } = req.params;
    let { desde, hasta } = req.query;

    // 1) Verificar que el alumno exista
    const { rows: alumnoRows } = await pool.query(
      `SELECT id, nombre_completo, carnet, grado
       FROM asistenciaqr.alumnos WHERE id = $1`,
      [alumnoId]
    );
    if (!alumnoRows.length) {
      return res.status(404).json({ error: 'Alumno no encontrado' });
    }
    const alumno = alumnoRows[0];

    // 2) Rango por defecto (últimos 30 días) si no viene filtro
    //    Usamos CURRENT_DATE para evitar problemas de TZ
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

    // 3) Armar filtros de fechas (siempre casteados a DATE)
    const filtros = [];
    const valores = [alumnoId];
    let i = 2;

    if (desde) { filtros.push(`f.fecha >= $${i}::date`); valores.push(desde); i++; }
    if (hasta) { filtros.push(`f.fecha <= $${i}::date`); valores.push(hasta); i++; }
    const whereFecha = filtros.length ? `AND ${filtros.join(' AND ')}` : '';

    // 4) Query principal: todas las fechas del rango + LEFT JOIN asistencia
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
        asis.registrado_por
      FROM fechas f
      CROSS JOIN asistenciaqr.alumnos a
      LEFT JOIN asistenciaqr.asistencia asis
        ON asis.alumno_id = a.id
       AND asis.fecha_id = f.id
      WHERE a.id = $1
      ORDER BY f.fecha DESC;
    `;

    const { rows } = await pool.query(sql, valores);

    // 5) Resumen por estado
    const resumen = rows.reduce((acc, r) => {
      acc[r.estado] = (acc[r.estado] || 0) + 1;
      return acc;
    }, {});
    const total = rows.length;

    return res.json({
      alumno,
      rango: { desde, hasta },
      total,
      resumen, // p.ej. { presente: 10, tarde: 2, ausente: 1, sin_registro: 17 }
      registros: rows
    });
  } catch (e) {
    console.error('GET /api/reportes/alumno/:alumnoId error:', e);
    res.status(500).json({ error: 'Error generando reporte del alumno' });
  }
});

module.exports = router;
