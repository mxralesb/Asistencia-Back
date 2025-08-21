// routes/asistencia.routes.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// helper: asegura fila en fechas_asistencia y devuelve su id
async function ensureFechaId(client, fechaISO) {
  const fecha = fechaISO.slice(0,10); // YYYY-MM-DD
  const ins = await client.query(
    `INSERT INTO asistenciaqr.fechas_asistencia (fecha)
     VALUES ($1) ON CONFLICT (fecha) DO UPDATE SET fecha=EXCLUDED.fecha
     RETURNING id`, [fecha]
  );
  return ins.rows[0].id;
}

// POST /api/asistencia/marcar
router.post('/marcar', async (req, res) => {
  const { carnet, docente_id, fecha_hora, estado = 'presente', observaciones } = req.body;
  if (!carnet || !docente_id || !fecha_hora) {
    return res.status(400).json({ error: 'carnet, docente_id y fecha_hora son obligatorios' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // alumno
    const a = await client.query(
      `SELECT id, grado FROM asistenciaqr.alumnos WHERE carnet = $1`,
      [String(carnet).trim().toUpperCase()]
    );
    if (!a.rowCount) throw new Error('Alumno no encontrado');
    const alumnoId = a.rows[0].id;
    const gradoAlumno = a.rows[0].grado;

  
    const d = await client.query(
      `SELECT id, grado, activo FROM asistenciaqr.usuarios
       WHERE id=$1 AND rol='docente' AND activo=TRUE`,
      [docente_id]
    );
    if (!d.rowCount) throw new Error('Docente no válido o inactivo');

    const fechaId = await ensureFechaId(client, fecha_hora);

    await client.query(
      `INSERT INTO asistenciaqr.asistencia (alumno_id, fecha_id, estado, registrado_por, observaciones)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (alumno_id, fecha_id)
       DO UPDATE SET estado=EXCLUDED.estado, registrado_por=EXCLUDED.registrado_por, observaciones=EXCLUDED.observaciones`,
      [alumnoId, fechaId, estado, docente_id, observaciones ?? null]
    );

    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('POST /api/asistencia/marcar', e);
    res.status(500).json({ error: e.message || 'Error al marcar asistencia' });
  } finally {
    client.release();
  }
});

module.exports = router;
