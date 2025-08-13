const express = require('express');
const router = express.Router();
const pool = require('../db');
const QRCode = require('qrcode');

// POST: registrar nuevo alumno y generar su QR (usando grado, no salon_id)
router.post('/', async (req, res) => {
  const { nombre_completo, carnet, grado, activo } = req.body;

  try {
    if (!nombre_completo || !carnet || !grado) {
      return res.status(400).json({ error: 'Faltan datos obligatorios.' });
    }

    // Insertar alumno sin qr_codigo
    const resultado = await pool.query(
      'INSERT INTO asistenciaqr.alumnos (nombre_completo, carnet, grado, activo) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre_completo, carnet, grado, activo ?? true]
    );

    const alumnoId = resultado.rows[0].id;

    // Generar QR con el ID del alumno
    const qrData = await QRCode.toDataURL(`${alumnoId}`);

    // Actualizar registro con el QR generado
    await pool.query(
      'UPDATE asistenciaqr.alumnos SET qr_codigo = $1 WHERE id = $2',
      [qrData, alumnoId]
    );

    // Consultar el alumno actualizado
    const alumnoConQr = await pool.query(
      'SELECT * FROM asistenciaqr.alumnos WHERE id = $1',
      [alumnoId]
    );

    res.status(201).json(alumnoConQr.rows[0]);
  } catch (error) {
    console.error('Error al registrar alumno:', error.message);
    res.status(500).json({ error: 'Error al registrar alumno' });
  }
});

// GET /api/alumnos/por-grado?grado=Primero (sin JOIN, solo filtro simple)
router.get('/por-grado', async (req, res) => {
  const { grado } = req.query;

  if (!grado) {
    return res.status(400).json({ error: 'El parámetro grado es obligatorio.' });
  }

  try {
    const result = await pool.query(
      `SELECT id, nombre_completo, carnet, grado, activo, qr_codigo
       FROM asistenciaqr.alumnos
       WHERE grado = $1`,
      [grado]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error al consultar alumnos por grado:', error);
    res.status(500).json({ error: 'Error al consultar alumnos' });
  }
});

module.exports = router;
