// routes/asistencia.routes.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

/* ===================== Helpers ===================== */
async function ensureFechaId(fecha) {
  const ins = await pool.query(
    `INSERT INTO asistenciaqr.fechas_asistencia (fecha)
     VALUES ($1::date)
     ON CONFLICT (fecha) DO NOTHING
     RETURNING id`,
    [fecha]
  );
  if (ins.rowCount) return ins.rows[0].id;
  const { rows } = await pool.query(
    `SELECT id FROM asistenciaqr.fechas_asistencia WHERE fecha = $1::date`,
    [fecha]
  );
  return rows[0]?.id;
}

function sameYMD(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * decideEstadoScan(fechaStr)
 * - Para escaneo del docente: NUNCA devuelve 'ausente'.
 *   <=14:10  -> 'presente'
 *   >14:10   -> 'tarde'
 */
function decideEstadoScan(fechaStr) {
  const now = new Date();
  const fecha = new Date(`${fechaStr}T00:00:00`);
  const cutoffTarde = new Date(`${fechaStr}T14:10:00`);
  if (sameYMD(now, fecha) && now > cutoffTarde) return 'tarde';
  return 'presente';
}

/**
 * decideEstadoAutoClose()
 * - Para cierre automático de las 14:30, siempre 'ausente'
 */
function decideEstadoAutoClose() {
  return 'ausente';
}

function hhmm(d = new Date()) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function mergeObs(extra, d = new Date()) {
  const marca = `Registrado a las ${hhmm(d)}`;
  return extra && String(extra).trim()
    ? `${marca} • ${String(extra).trim()}`
    : marca;
}

/* ============ FUNCIÓN: marcar ausentes automáticos ============ */
async function markAutoAbsences(fechaISO) {
  const fecha_id = await ensureFechaId(fechaISO);
  if (!fecha_id) throw new Error('No se pudo asegurar fecha_id');

  const obs = `Ausente automático a las ${hhmm(new Date())}`;
  const sql = `
    INSERT INTO asistenciaqr.asistencia (alumno_id, fecha_id, estado, observaciones, registrado_por)
    SELECT a.id, $1, 'ausente', $2, NULL
    FROM asistenciaqr.alumnos a
    LEFT JOIN asistenciaqr.asistencia asis
      ON asis.alumno_id = a.id AND asis.fecha_id = $1
    WHERE asis.id IS NULL
  `;
  const { rowCount } = await pool.query(sql, [fecha_id, obs]);
  return rowCount || 0;
}

/* ===================== Ping ===================== */
router.get('/ping', (_req, res) => res.json({ ok: true, route: '/api/asistencia' }));

/* ============ GET /api/asistencia (Dirección) ============ */
router.get('/', async (req, res) => {
  try {
    const fecha = (req.query.fecha || '').trim();
    if (!fecha) return res.status(400).json({ error: 'fecha requerida (YYYY-MM-DD)' });

    const fecha_id = await ensureFechaId(fecha);

    const grado   = (req.query.grado   || '').trim();
    const docente = (req.query.docente || '').trim();
    const q       = (req.query.q       || '').trim();
    const estado  = (req.query.estado  || '').trim().toLowerCase(); // '', 'presente','tarde','ausente','sin_registro'

    const where = [];
    const vals = [fecha_id];
    let i = 2;

    if (grado)   { where.push(`LOWER(TRIM(a.grado)) = LOWER(TRIM($${i++}))`); vals.push(grado); }
    if (docente) { where.push(`LOWER(TRIM(u.nombre)) = LOWER(TRIM($${i++}))`); vals.push(docente); }
    if (q) {
      where.push(`(a.nombre_completo ILIKE '%' || $${i} || '%' OR a.carnet ILIKE '%' || $${i} || '%')`);
      vals.push(q); i++;
    }
    if (estado) {
      if (estado === 'sin_registro') where.push(`asis.id IS NULL`);
      else { where.push(`COALESCE(asis.estado,'sin_registro') = $${i++}`); vals.push(estado); }
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const sql = `
      SELECT
        a.id AS alumno_id,
        a.nombre_completo,
        a.carnet,
        a.grado,
        COALESCE(u.nombre, '') AS docente_nombre,
        COALESCE(asis.estado, 'sin_registro') AS estado,
        asis.observaciones
      FROM asistenciaqr.alumnos a
      LEFT JOIN asistenciaqr.usuarios u
        ON u.rol='docente' AND u.activo=TRUE
       AND LOWER(TRIM(u.grado)) = LOWER(TRIM(a.grado))
      LEFT JOIN asistenciaqr.asistencia asis
        ON asis.alumno_id = a.id AND asis.fecha_id = $1
      ${whereSql}
      ORDER BY a.grado, a.nombre_completo;
    `;
    const { rows } = await pool.query(sql, vals);
    res.json(rows);
  } catch (e) {
    console.error('GET /api/asistencia error:', e);
    res.status(500).json({ error: 'Error al consultar asistencia' });
  }
});

/* ============ POST /api/asistencia/auto-cerrar-dia ============ */
/* Dispara manualmente el cierre automático (marca AUSENTE a los que no registraron) */
router.post('/auto-cerrar-dia', async (req, res) => {
  try {
    const fecha = (req.body?.fecha || new Date().toISOString().slice(0, 10)).trim();
    const count = await markAutoAbsences(fecha);
    res.json({ ok: true, fecha, marcados: count });
  } catch (e) {
    console.error('POST /api/asistencia/auto-cerrar-dia error:', e);
    res.status(500).json({ error: 'No se pudo cerrar el día' });
  }
});

/* ===================== POST /api/asistencia/marcar ===================== */
/* Escaneo del docente:
   - Resuelve alumno por carnet si hace falta.
   - Si ya existe registro del día (incluso 'ausente' automático) => ACTUALIZA a presente/tarde + nuevas observaciones.
   - Si no existe => inserta.
   - NUNCA deja 'ausente' por un escaneo (aunque sea >14:30). */
router.post('/marcar', async (req, res) => {
  try {
    let { alumno_id, carnet, docente_id, fecha_hora, fecha, observaciones } = req.body || {};

    // A) Resolver alumno por carnet
    if (!alumno_id && carnet) {
      const a = await pool.query(
        `SELECT id FROM asistenciaqr.alumnos WHERE carnet = $1`,
        [String(carnet).trim()]
      );
      if (!a.rowCount) return res.status(404).json({ error: 'Alumno no encontrado por carnet' });
      alumno_id = a.rows[0].id;
    }
    if (!alumno_id) return res.status(400).json({ error: 'alumno_id o carnet requerido' });

    // B) Fecha/fecha_id
    const fechaISO =
      fecha ||
      (fecha_hora ? new Date(fecha_hora).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
    const fecha_id = await ensureFechaId(fechaISO);
    if (!fecha_id) return res.status(500).json({ error: 'No se pudo asegurar la fecha' });

    // C) Estado (solo presente/tarde) y Observaciones
    const estadoFinal = decideEstadoScan(fechaISO); // <- clave: nunca 'ausente' en escaneo
    const ahora = fecha_hora ? new Date(fecha_hora) : new Date();
    const obsFinal = mergeObs(observaciones, ahora);

    // D) Si ya existe, ACTUALIZAR (corrige ausente auto)
    const sel = await pool.query(
      `SELECT id, observaciones FROM asistenciaqr.asistencia WHERE alumno_id = $1 AND fecha_id = $2 LIMIT 1`,
      [alumno_id, fecha_id]
    );

    if (sel.rowCount) {
      // Si quieres concatenar observaciones anteriores + nuevas, descomenta:
      // const prevObs = sel.rows[0].observaciones || '';
      // const newObs = prevObs ? `${prevObs} • ${obsFinal}` : obsFinal;

      const upd = await pool.query(
        `UPDATE asistenciaqr.asistencia
           SET estado = $1,
               observaciones = $2,
               registrado_por = $3
         WHERE alumno_id = $4 AND fecha_id = $5
         RETURNING *`,
        [estadoFinal, obsFinal, docente_id ?? null, alumno_id, fecha_id]
      );
      return res.json({ ok: true, asistencia: upd.rows[0], updated: true });
    }

    // E) Si no existe, INSERT
    const ins = await pool.query(
      `INSERT INTO asistenciaqr.asistencia (alumno_id, fecha_id, estado, observaciones, registrado_por)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [alumno_id, fecha_id, estadoFinal, obsFinal, docente_id ?? null]
    );
    return res.json({ ok: true, asistencia: ins.rows[0], created: true });
  } catch (e) {
    console.error('POST /api/asistencia/marcar error:', e);
    res.status(500).json({ error: 'Error al marcar asistencia' });
  }
});

module.exports = router;
module.exports.markAutoAbsences = markAutoAbsences;
