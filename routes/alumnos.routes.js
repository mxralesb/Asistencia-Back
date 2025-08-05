const express = require('express');
const router = express.Router();
const pool = require('../db');
const QRCode = require('qrcode'); 
// POST: registrar nuevo alumno y generar su QR
router.post('/', async (req, res) => {
  const { nombre_completo, carnet, salon_id, activo } = req.body;

  try {
    
    const qrData = await QRCode.toDataURL(carnet); 

    const resultado = await pool.query(
      'INSERT INTO asistenciaqr.alumnos (nombre_completo, carnet, salon_id, activo, qr_codigo) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [nombre_completo, carnet, salon_id, activo, qrData]
    );

    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    console.error('Error al registrar alumno:', error.message);
    res.status(500).json({ error: 'Error al registrar alumno' });
  }
});

// GET /api/alumnos/por-grado
router.get('/por-grado', async (req, res) => {
  const { grado, seccion } = req.query;
  try {
    const result = await pool.query(
      `SELECT a.id, a.nombre_completo, a.carnet, s.grado, s.seccion, s.nombre AS salon 
       FROM asistenciaqr.alumnos a
       JOIN asistenciaqr.salones s ON a.salon_id = s.id
       WHERE s.grado = $1 AND s.seccion = $2 AND a.activo = true
       ORDER BY a.nombre_completo`,
      [grado, seccion]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al consultar alumnos por grado:', err);
    res.status(500).json({ error: 'Error al obtener alumnos' });
  }
});


module.exports = router;