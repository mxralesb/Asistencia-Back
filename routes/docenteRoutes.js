const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const docenteController = require('../controllers/docenteController');

router.put('/perfil', authenticate, docenteController.actualizarPerfilDocente);
router.get('/perfil', authenticate, docenteController.getPerfil);


module.exports = router;
