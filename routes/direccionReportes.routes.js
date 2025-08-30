const express = require('express');
const router = express.Router();
const pool = require('../db');

const toYMD = (val) => {
  try {
    const d = val instanceof Date ? val : new Date(val);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
  } catch { return String(val); }
};

/* ========= RESUMEN ========= */
router.get('/resumen', async (req, res) => {
  try {
    const desde = (req.query.desde || toYMD(new Date()));
    const hasta = (req.query.hasta || toYMD(new Date()));

    const sql = `
      SELECT
        SUM(CASE WHEN asis.estado='presente' THEN 1 ELSE 0 END) AS presente,
        SUM(CASE WHEN asis.estado='tarde'    THEN 1 ELSE 0 END) AS tarde,
        SUM(CASE WHEN asis.estado='ausente'  THEN 1 ELSE 0 END) AS ausente,
        COUNT(*) AS total
      FROM asistenciaqr.asistencia asis
      JOIN asistenciaqr.fechas_asistencia f ON f.id = asis.fecha_id
      WHERE f.fecha BETWEEN $1::date AND $2::date;
    `;
    const { rows } = await pool.query(sql, [desde, hasta]);
    const { presente=0, tarde=0, ausente=0, total=0 } = rows[0] || {};
    res.json({
      total: Number(total||0),
      presente: Number(presente||0),
      tarde: Number(tarde||0),
      ausente: Number(ausente||0)
    });
  } catch (e) {
    console.error('GET /direccion/reportes/resumen', e);
    res.status(500).json({ error: 'Error en resumen' });
  }
});

/* ========= SERIE ========= */
router.get('/serie', async (req, res) => {
  try {
    const desde = (req.query.desde || toYMD(new Date()));
    const hasta = (req.query.hasta || toYMD(new Date()));

    const sql = `
      SELECT
        to_char(f.fecha,'YYYY-MM-DD') AS fecha,
        SUM(CASE WHEN asis.estado='presente' THEN 1 ELSE 0 END) AS presente,
        SUM(CASE WHEN asis.estado='tarde'    THEN 1 ELSE 0 END) AS tarde,
        SUM(CASE WHEN asis.estado='ausente'  THEN 1 ELSE 0 END) AS ausente
      FROM asistenciaqr.asistencia asis
      JOIN asistenciaqr.fechas_asistencia f ON f.id=asis.fecha_id
      WHERE f.fecha BETWEEN $1::date AND $2::date
      GROUP BY f.fecha
      ORDER BY f.fecha;
    `;
    const { rows } = await pool.query(sql, [desde, hasta]);
    res.json(rows);
  } catch (e) {
    console.error('GET /direccion/reportes/serie', e);
    res.status(500).json({ error: 'Error en serie' });
  }
});

/* ========= TOP AUSENTES ========= */
router.get('/top-ausentes', async (req, res) => {
  try {
    const desde = (req.query.desde || toYMD(new Date()));
    const hasta = (req.query.hasta || toYMD(new Date()));
    const limit = Number(req.query.limit || 8);

    const sql = `
      SELECT a.nombre_completo AS alumno, COUNT(*) AS ausencias
      FROM asistenciaqr.asistencia asis
      JOIN asistenciaqr.fechas_asistencia f ON f.id=asis.fecha_id
      JOIN asistenciaqr.alumnos a ON a.id=asis.alumno_id
      WHERE f.fecha BETWEEN $1::date AND $2::date
        AND asis.estado='ausente'
      GROUP BY a.nombre_completo
      ORDER BY ausencias DESC, alumno ASC
      LIMIT $3;
    `;
    const { rows } = await pool.query(sql, [desde, hasta, limit]);
    res.json(rows);
  } catch (e) {
    console.error('GET /direccion/reportes/top-ausentes', e);
    res.status(500).json({ error: 'Error en ranking' });
  }
});

/* ========= RAW CSV ========= */
router.get('/raw-csv', async (req, res) => {
  try {
    const desde = (req.query.desde || toYMD(new Date()));
    const hasta = (req.query.hasta || toYMD(new Date()));

    const sql = `
      SELECT
        to_char(f.fecha,'YYYY-MM-DD') AS fecha,
        a.nombre_completo AS alumno,
        a.carnet,
        a.grado,
        asis.estado,
        asis.observaciones,
        COALESCE(u.nombre,'') AS docente_nombre
      FROM asistenciaqr.asistencia asis
      JOIN asistenciaqr.fechas_asistencia f ON f.id=asis.fecha_id
      JOIN asistenciaqr.alumnos a ON a.id=asis.alumno_id
      LEFT JOIN asistenciaqr.usuarios u ON u.id=asis.registrado_por
      WHERE f.fecha BETWEEN $1::date AND $2::date
      ORDER BY f.fecha, a.nombre_completo;
    `;
    const { rows } = await pool.query(sql, [desde, hasta]);
    res.json(rows);
  } catch (e) {
    console.error('GET /direccion/reportes/raw-csv', e);
    res.status(500).json({ error: 'Error en raw-csv' });
  }
});

/* ========= POR GRADO ========= */
router.get('/por-grado', async (req, res) => {
  try {
    const desde = (req.query.desde || toYMD(new Date()));
    const hasta = (req.query.hasta || toYMD(new Date()));

    const sql = `
      SELECT
        TRIM(a.grado) AS grado,
        SUM(CASE WHEN asis.estado='presente' THEN 1 ELSE 0 END) AS presente,
        SUM(CASE WHEN asis.estado='tarde'    THEN 1 ELSE 0 END) AS tarde,
        SUM(CASE WHEN asis.estado='ausente'  THEN 1 ELSE 0 END) AS ausente,
        COUNT(*) AS total
      FROM asistenciaqr.asistencia asis
      JOIN asistenciaqr.fechas_asistencia f ON f.id = asis.fecha_id
      JOIN asistenciaqr.alumnos a ON a.id = asis.alumno_id
      WHERE f.fecha BETWEEN $1::date AND $2::date
      GROUP BY TRIM(a.grado)
      ORDER BY grado;
    `;
    const { rows } = await pool.query(sql, [desde, hasta]);
    res.json(rows);
  } catch (e) {
    console.error('GET /direccion/reportes/por-grado', e);
    res.status(500).json({ error: 'Error en por-grado' });
  }
});

/* ========= POR DOCENTE ========= */
router.get('/por-docente', async (req, res) => {
  try {
    const desde = (req.query.desde || toYMD(new Date()));
    const hasta = (req.query.hasta || toYMD(new Date()));

    const sql = `
      SELECT
        COALESCE(u.nombre, 'Sin asignar') AS docente,
        SUM(CASE WHEN asis.estado='presente' THEN 1 ELSE 0 END) AS presente,
        SUM(CASE WHEN asis.estado='tarde'    THEN 1 ELSE 0 END) AS tarde,
        SUM(CASE WHEN asis.estado='ausente'  THEN 1 ELSE 0 END) AS ausente,
        COUNT(*) AS total
      FROM asistenciaqr.asistencia asis
      JOIN asistenciaqr.fechas_asistencia f ON f.id = asis.fecha_id
      LEFT JOIN asistenciaqr.usuarios u ON u.id = asis.registrado_por
      WHERE f.fecha BETWEEN $1::date AND $2::date
      GROUP BY COALESCE(u.nombre, 'Sin asignar')
      ORDER BY docente;
    `;
    const { rows } = await pool.query(sql, [desde, hasta]);
    res.json(rows);
  } catch (e) {
    console.error('GET /direccion/reportes/por-docente', e);
    res.status(500).json({ error: 'Error en por-docente' });
  }
});

module.exports = router;
