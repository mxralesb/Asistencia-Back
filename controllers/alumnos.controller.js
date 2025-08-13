const pool = require('../db');
const QRCode = require('qrcode');

exports.crearAlumno = async (req, res) => {
  try {
    const { nombre_completo, carnet, grado, activo } = req.body;

    if (!nombre_completo || !carnet || !grado) {
      return res.status(400).json({ mensaje: 'Faltan datos obligatorios.' });
    }

    // Insertar alumno
    const nuevoAlumno = await pool.query(
      `INSERT INTO asistenciaqr.alumnos (nombre_completo, carnet, grado, activo)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [nombre_completo, carnet, grado, activo ?? true]
    );

    const alumno = nuevoAlumno.rows[0];

    // Generar QR basado en el CARNET
    const qrDataUrl = await QRCode.toDataURL(`${alumno.carnet}`);

    // Guardar QR en la tabla
    await pool.query(
      `UPDATE asistenciaqr.alumnos SET qr_codigo = $1 WHERE id = $2`,
      [qrDataUrl, alumno.id]
    );

    // Devolver el alumno actualizado con qr_codigo
    const alumnoConQr = await pool.query(
      `SELECT * FROM asistenciaqr.alumnos WHERE id = $1`,
      [alumno.id]
    );

    res.status(201).json({ 
      alumno: alumnoConQr.rows[0], 
      qr_codigo: qrDataUrl 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al registrar alumno.' });
  }
};
