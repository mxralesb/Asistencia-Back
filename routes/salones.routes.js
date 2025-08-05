// routes/salones.routes.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/salones
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM asistenciaqr.salones');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener salones:', error);
    res.status(500).json({ error: 'Error al obtener salones' });
  }
});

module.exports = router;
