const express = require('express');
const router = express.Router();
const { registrarDocente, obtenerDocentes } = require('../controllers/usuarios.controller');
const verificarToken = require('../middlewares/authenticate');

router.post('/registro-docente', registrarDocente);
router.get('/docentes', verificarToken, obtenerDocentes); // protegida por JWT

module.exports = router;
