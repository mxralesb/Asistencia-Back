const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/authenticate');
const docenteController = require('../controllers/docenteController');

// Solo esta ruta queda activa
router.get('/perfil', authenticate, docenteController.getPerfil);

module.exports = router;
