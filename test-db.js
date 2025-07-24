const pool = require('./db');

(async () => {
  try {
    const result = await pool.query("SELECT * FROM asistenciaqr.usuarios;");
    console.log('Usuarios:', result.rows);
  } catch (error) {
    console.error('Error al leer tabla usuarios:', error.message);
  }
})();

