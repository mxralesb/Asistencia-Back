// controllers/alumnos.controller.js
const pool = require('../db');
const QRCode = require('qrcode');

exports.crearAlumno = async (req, res) => {
  try {
    let { nombre_completo, carnet, grado, activo } = req.body;

    // Normaliza/valida
    nombre_completo = (nombre_completo || '').trim();
    carnet = (carnet || '').trim().toUpperCase();
    grado = (grado || '').trim();
    const estado = typeof activo === 'boolean' ? activo : true;

    if (!nombre_completo || !carnet || !grado) {
      return res.status(400).json({ mensaje: 'Faltan datos obligatorios.' });
    }

    // Inserta alumno
    const { rows } = await pool.query(
      `INSERT INTO asistenciaqr.alumnos (nombre_completo, carnet, grado, activo)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [nombre_completo, carnet, grado, estado]
    );
    const alumno = rows[0];

    // Genera QR basado en el CARNET (o usa `${alumno.id}|${alumno.carnet}`)
    const qrDataUrl = await QRCode.toDataURL(alumno.carnet);

    // Guarda QR
    await pool.query(
      `UPDATE asistenciaqr.alumnos SET qr_codigo = $1 WHERE id = $2`,
      [qrDataUrl, alumno.id]
    );

    // Devuelve actualizado
    const resAlumno = await pool.query(
      `SELECT id, nombre_completo, carnet, grado, activo, qr_codigo
       FROM asistenciaqr.alumnos WHERE id = $1`,
      [alumno.id]
    );

    return res.status(201).json({ alumno: resAlumno.rows[0] });
  } catch (error) {
    // Clave única violada (carnet UNIQUE)
    if (error?.code === '23505') {
      return res.status(409).json({ mensaje: 'El carnet ya existe.' });
    }
    console.error('crearAlumno error:', error);
    return res.status(500).json({ mensaje: 'Error al registrar alumno.' });
  }
};
