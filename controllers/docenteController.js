const db = require('../db');

exports.getPerfil = async (req, res) => {
  try {
    const id = req.user.id;

    const query = `
      SELECT nombre, telefono, direccion
      FROM asistenciaqr.usuarios
      WHERE id = $1
    `;
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener el perfil' });
  }
};
