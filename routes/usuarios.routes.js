const express = require('express');
const router = express.Router();
const { registrarDocente, obtenerDocentes, cambiarEstadoUsuario } = require('../controllers/usuarios.controller');
const verificarToken = require('../middlewares/authenticate');

router.post('/registro-docente', registrarDocente);
router.get('/docentes', verificarToken, obtenerDocentes);
router.put('/:id/estado', verificarToken, cambiarEstadoUsuario);

module.exports = router;
