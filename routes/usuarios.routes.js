const express = require('express');
const router = express.Router();

const {
  registrarDocente,
  obtenerDocentes,
  cambiarEstadoUsuario,
  cambiarContrasena 
} = require('../controllers/usuarios.controller');

// Registrar docente
router.post('/registro-docente', registrarDocente);

// Obtener todos los docentes
router.get('/docentes', obtenerDocentes);

// Cambiar estado de usuario (docente)
router.put('/:id/estado', cambiarEstadoUsuario);

// **Cambiar contraseña**
router.put('/cambiar-contrasena', cambiarContrasena);

module.exports = router;
