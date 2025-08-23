// routes/asistencia.routes.js
const express = require('express');
const router = express.Router();
const pool = require('../db');


async function ensureFechaId(fecha) {
  const ins = await pool.query(
    `INSERT INTO asistenciaqr.fechas_asistencia (fecha)
     VALUES ($1::date) ON CONFLICT (fecha) DO NOTHING RETURNING id`, [fecha]
  );
  if (ins.rowCount) return ins.rows[0].id;
  const { rows } = await pool.query(
    `SELECT id FROM asistenciaqr.fechas_asistencia WHERE fecha=$1::date`, [fecha]
  );
  return rows[0]?.id;
}
function sameYMD(a,b){return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();}
function decideEstado(fechaStr, estadoReq) {
  if (estadoReq === 'ausente') return 'ausente';
  const now = new Date();
  const fecha = new Date(`${fechaStr}T00:00:00`);
  const cutoff = new Date(`${fechaStr}T14:10:00`);
  if (sameYMD(now, fecha) && now > cutoff) return 'tarde';
  return estadoReq || 'presente';
}
function hhmm(d=new Date()){return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;}
function mergeObs(base, d=new Date()){const marca=`Registrado a las ${hhmm(d)}`;return base?`${base} • ${marca}`:marca;}


router.get('/ping', (_req,res)=>res.json({ok:true, route:'/api/asistencia'}));

/* ============  GET /api/asistencia (consulta para Dirección) ============ */
router.get('/', async (req, res) => {
  try {
    const fecha = (req.query.fecha || '').trim();
    if (!fecha) return res.status(400).json({ error: 'fecha requerida (YYYY-MM-DD)' });

    const fecha_id = await ensureFechaId(fecha);

    const grado = (req.query.grado || '').trim();
    const docente = (req.query.docente || '').trim();
    const q = (req.query.q || '').trim();
    const estado = (req.query.estado || '').trim().toLowerCase(); // '', 'presente','tarde','ausente','sin_registro'

    const where = [];
    const vals = [fecha_id];
    let i = 2;

    if (grado) { where.push(`LOWER(TRIM(a.grado)) = LOWER(TRIM($${i++}))`); vals.push(grado); }
    if (docente) { where.push(`LOWER(TRIM(u.nombre)) = LOWER(TRIM($${i++}))`); vals.push(docente); }
    if (q) {
      where.push(`(a.nombre_completo ILIKE '%' || $${i} || '%' OR a.carnet ILIKE '%' || $${i} || '%')`);
      vals.push(q); i++;
    }
    if (estado) {
      if (estado === 'sin_registro') where.push(`asis.id IS NULL`);
      else { where.push(`COALESCE(asis.estado, 'sin_registro') = $${i++}`); vals.push(estado); }
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const sql = `
      SELECT
        a.id                          AS alumno_id,
        a.nombre_completo,
        a.carnet,
        a.grado,
        COALESCE(u.nombre, '')        AS docente_nombre,
        COALESCE(asis.estado, 'sin_registro') AS estado,
        asis.observaciones
      FROM asistenciaqr.alumnos a
      LEFT JOIN asistenciaqr.usuarios u
             ON u.rol='docente'
            AND u.activo=TRUE
            AND LOWER(TRIM(u.grado)) = LOWER(TRIM(a.grado))
      LEFT JOIN asistenciaqr.asistencia asis
             ON asis.alumno_id = a.id
            AND asis.fecha_id = $1
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

/* ====== POST /api/asistencia/marcar ====== */
router.post('/marcar', async (req, res) => {
  try {
    let { alumno_id, carnet, docente_id, fecha_hora, fecha, estado /*, observaciones*/ } = req.body || {}; 
    // ^^^ ignoramos observaciones entrantes para guardar solo hora

    // A) Resolver alumno_id (permite por carnet)
    if (!alumno_id && carnet) {
      const a = await pool.query(
        `SELECT id FROM asistenciaqr.alumnos WHERE carnet = $1`,
        [String(carnet).trim()]
      );
      if (!a.rowCount) return res.status(404).json({ error: 'Alumno no encontrado por carnet' });
      alumno_id = a.rows[0].id;
    }
    if (!alumno_id) return res.status(400).json({ error: 'alumno_id o carnet requerido' });

    // B) Resolver fecha (YYYY-MM-DD) y asegurar fecha_id
    const fechaISO =
      fecha ||
      (fecha_hora ? new Date(fecha_hora).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
    const fecha_id = await ensureFechaId(fechaISO);
    if (!fecha_id) return res.status(500).json({ error: 'No se pudo asegurar la fecha' });

   // ver que no este duplicado el escaneo
    const dup = await pool.query(
      `SELECT 1 FROM asistenciaqr.asistencia WHERE alumno_id = $1 AND fecha_id = $2 LIMIT 1`,
      [alumno_id, fecha_id]
    );
    if (dup.rowCount) {
      return res.status(409).json({ error: 'ya_registrado_hoy' });
    }

    const estadoFinal = decideEstado(fechaISO, estado);
    const ahora = fecha_hora ? new Date(fecha_hora) : new Date();
    const obsFinal = `Registrado a las ${hhmm(ahora)}`; 

   
    const ins = `
      INSERT INTO asistenciaqr.asistencia (alumno_id, fecha_id, estado, observaciones, registrado_por)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *;
    `;
    const { rows } = await pool.query(ins, [alumno_id, fecha_id, estadoFinal, obsFinal, docente_id ?? null]);
    return res.json({ ok: true, asistencia: rows[0] });
  } catch (e) {
    console.error('POST /api/asistencia/marcar error:', e);
    res.status(500).json({ error: 'Error al marcar asistencia' });
  }
});
module.exports = router;