// controllers/alumnos.controller.js
const pool = require('../db');
const QRCode = require('qrcode');

exports.crearAlumno = async (req, res) => {
  try {
    const { nombre_completo, carnet, salon_id, activo } = req.body;

    const nuevoAlumno = await pool.query(
      'INSERT INTO asistenciaqr.alumnos (nombre_completo, carnet, salon_id, activo) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre_completo, carnet, salon_id, activo]
    );

    const alumnoId = nuevoAlumno.rows[0].id;

    // Generar código QR basado en el ID del alumno
    const qrDataUrl = await QRCode.toDataURL(`${alumnoId}`);

    res.status(201).json({ alumno: nuevoAlumno.rows[0], qr: qrDataUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al registrar alumno.' });
  }
};
