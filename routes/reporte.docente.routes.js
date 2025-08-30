// backend/routes/docenteReportes.routes.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// Utiles
const toYMD = (d) => new Date(d).toISOString().slice(0, 10);

// Obtener docente_id desde JWT o query/body
function getDocenteId(req) {
  if (req.user?.id) return req.user.id;             // si tienes middleware JWT
  if (req.query.docente_id) return Number(req.query.docente_id);
  if (req.body?.docente_id) return Number(req.body.docente_id);
  return null;
}

// Lee el grado del docente
async function getGradoDocente(docente_id) {
  const q = `
    SELECT TRIM(grado) AS grado
    FROM asistenciaqr.usuarios
    WHERE id = $1 AND rol = 'docente' AND activo = TRUE
    LIMIT 1;
  `;
  const { rows } = await pool.query(q, [docente_id]);
  return rows[0]?.grado || null;
}

/* ===================== RESUMEN ===================== */
router.get('/resumen', async (req, res) => {
  try {
    const docente_id = getDocenteId(req);
    if (!docente_id) return res.status(401).json({ error: 'No autenticado' });

    const desde = (req.query.desde || toYMD(new Date()));
    const hasta = (req.query.hasta || toYMD(new Date()));

    const grado = await getGradoDocente(docente_id);
    if (!grado) {
      return res.json({
        total: 0, presente: 0, tarde: 0, ausente: 0, cobertura: 0, puntualidad: 0
      });
    }

    // Totales SOLO de alumnos del grado del docente (independiente de quién registró)
    const sqlEstados = `
      SELECT
        SUM(CASE WHEN asis.estado='presente' THEN 1 ELSE 0 END) AS presente,
        SUM(CASE WHEN asis.estado='tarde'    THEN 1 ELSE 0 END) AS tarde,
        SUM(CASE WHEN asis.estado='ausente'  THEN 1 ELSE 0 END) AS ausente,
        COUNT(*) AS total
      FROM asistenciaqr.asistencia asis
      JOIN asistenciaqr.fechas_asistencia f ON f.id = asis.fecha_id
      JOIN asistenciaqr.alumnos a ON a.id = asis.alumno_id
      WHERE TRIM(a.grado) = TRIM($1)
        AND f.fecha BETWEEN $2::date AND $3::date;
    `;
    const { rows: est } = await pool.query(sqlEstados, [grado, desde, hasta]);
    const { presente = 0, tarde = 0, ausente = 0, total = 0 } = est[0] || {};

    // Cobertura: alumnos del grado con ≥1 registro en el rango / total del grado
    const covSql = `
      WITH alumnos_grado AS (
        SELECT id FROM asistenciaqr.alumnos WHERE TRIM(grado) = TRIM($1)
      ),
      con_registro AS (
        SELECT DISTINCT a.id
        FROM alumnos_grado a
        JOIN asistenciaqr.asistencia asis ON asis.alumno_id = a.id
        JOIN asistenciaqr.fechas_asistencia f ON f.id = asis.fecha_id
        WHERE f.fecha BETWEEN $2::date AND $3::date
      )
      SELECT
        (SELECT COUNT(*) FROM con_registro)::float * 100.0 /
        NULLIF((SELECT COUNT(*) FROM alumnos_grado), 0) AS cobertura;
    `;
    const { rows: covRows } = await pool.query(covSql, [grado, desde, hasta]);
    const cobertura = Number(covRows[0]?.cobertura || 0);

    const puntualidad = total ? (Number(presente) * 100.0 / Number(total)) : 0;

    res.json({
      total: Number(total || 0),
      presente: Number(presente || 0),
      tarde: Number(tarde || 0),
      ausente: Number(ausente || 0),
      cobertura,
      puntualidad: Number(puntualidad || 0),
    });
  } catch (e) {
    console.error('GET /docente/reportes/resumen', e);
    res.status(500).json({ error: 'Error en resumen' });
  }
});

/* ===================== SERIE ===================== */
router.get('/serie', async (req, res) => {
  try {
    const docente_id = getDocenteId(req);
    if (!docente_id) return res.status(401).json({ error: 'No autenticado' });

    const desde = (req.query.desde || toYMD(new Date()));
    const hasta = (req.query.hasta || toYMD(new Date()));

    const grado = await getGradoDocente(docente_id);
    if (!grado) return res.json([]);

    const sql = `
      SELECT
        to_char(f.fecha, 'YYYY-MM-DD') AS fecha,
        SUM(CASE WHEN asis.estado='presente' THEN 1 ELSE 0 END) AS presente,
        SUM(CASE WHEN asis.estado='tarde'    THEN 1 ELSE 0 END) AS tarde,
        SUM(CASE WHEN asis.estado='ausente'  THEN 1 ELSE 0 END) AS ausente
      FROM asistenciaqr.asistencia asis
      JOIN asistenciaqr.fechas_asistencia f ON f.id = asis.fecha_id
      JOIN asistenciaqr.alumnos a ON a.id = asis.alumno_id
      WHERE TRIM(a.grado) = TRIM($1)
        AND f.fecha BETWEEN $2::date AND $3::date
      GROUP BY f.fecha
      ORDER BY f.fecha;
    `;
    const { rows } = await pool.query(sql, [grado, desde, hasta]);
    res.json(rows);
  } catch (e) {
    console.error('GET /docente/reportes/serie', e);
    res.status(500).json({ error: 'Error en serie' });
  }
});

/* ===================== TOP AUSENTES ===================== */
router.get('/top-ausentes', async (req, res) => {
  try {
    const docente_id = getDocenteId(req);
    if (!docente_id) return res.status(401).json({ error: 'No autenticado' });

    const desde = (req.query.desde || toYMD(new Date()));
    const hasta = (req.query.hasta || toYMD(new Date()));
    const limit = Number(req.query.limit || 8);

    const grado = await getGradoDocente(docente_id);
    if (!grado) return res.json([]);

    const sql = `
      SELECT a.nombre_completo AS alumno, COUNT(*) AS ausencias
      FROM asistenciaqr.asistencia asis
      JOIN asistenciaqr.fechas_asistencia f ON f.id = asis.fecha_id
      JOIN asistenciaqr.alumnos a ON a.id = asis.alumno_id
      WHERE TRIM(a.grado) = TRIM($1)
        AND f.fecha BETWEEN $2::date AND $3::date
        AND asis.estado = 'ausente'
      GROUP BY a.nombre_completo
      ORDER BY ausencias DESC, alumno ASC
      LIMIT $4;
    `;
    const { rows } = await pool.query(sql, [grado, desde, hasta, limit]);
    res.json(rows);
  } catch (e) {
    console.error('GET /docente/reportes/top-ausentes', e);
    res.status(500).json({ error: 'Error en ranking' });
  }
});

/* ===================== RAW CSV ===================== */
router.get('/raw-csv', async (req, res) => {
  try {
    const docente_id = getDocenteId(req);
    if (!docente_id) return res.status(401).json({ error: 'No autenticado' });

    const desde = (req.query.desde || toYMD(new Date()));
    const hasta = (req.query.hasta || toYMD(new Date()));

    const grado = await getGradoDocente(docente_id);
    if (!grado) return res.json([]);

    const sql = `
      SELECT
        to_char(f.fecha,'YYYY-MM-DD') AS fecha,
        a.nombre_completo AS alumno,
        a.carnet,
        a.grado,
        asis.estado,
        asis.observaciones,
        u.nombre AS docente_nombre
      FROM asistenciaqr.asistencia asis
      JOIN asistenciaqr.fechas_asistencia f ON f.id = asis.fecha_id
      JOIN asistenciaqr.alumnos a ON a.id = asis.alumno_id
      LEFT JOIN asistenciaqr.usuarios u ON u.id = asis.registrado_por
      WHERE TRIM(a.grado) = TRIM($1)
        AND f.fecha BETWEEN $2::date AND $3::date
      ORDER BY f.fecha, a.nombre_completo;
    `;
    const { rows } = await pool.query(sql, [grado, desde, hasta]);

    // agrega 'hora' parseada desde observaciones (si viene "Registrado a las HH:MM")
    const withHour = rows.map(r => {
      const m = String(r.observaciones || '').match(/([0-2][0-9]:[0-5][0-9])/);
      return { ...r, hora: m ? m[1] : '' };
    });

    res.json(withHour);
  } catch (e) {
    console.error('GET /docente/reportes/raw-csv', e);
    res.status(500).json({ error: 'Error en raw-csv' });
  }
});

module.exports = router;
