const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  const { correo, password, rol } = req.body;

  try {
    const resultado = await pool.query(`
      SELECT * FROM asistenciaqr.usuarios WHERE correo = $1 AND rol = $2
    `, [correo, rol]);

    if (resultado.rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const usuario = resultado.rows[0];

    if (usuario.activo === false) {
      return res.status(403).json({ message: 'Tu cuenta ha sido desactivada. Contacta a Dirección.' });
    }

    const contraseñaValida = await bcrypt.compare(password, usuario.password);
    if (!contraseñaValida) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const token = jwt.sign({ id: usuario.id, rol: usuario.rol }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = { login };
