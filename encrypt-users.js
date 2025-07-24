const bcrypt = require('bcrypt');
const pool = require('./db');

const run = async () => {
  try {
    const users = await pool.query(`SELECT id, password FROM asistenciaqr.usuarios`);

    for (const user of users.rows) {
  const password = user.password;

  // si ya hay una contraseña hasheada, no la vuelve a hashear
  if (password.startsWith('$2b$')) {
    console.log(`Usuario ID ${user.id} ya tiene contraseña hasheada. Se omite.`);
    continue;
  }

  const hashed = await bcrypt.hash(password, 10);
  await pool.query(
    `UPDATE asistenciaqr.usuarios SET password = $1 WHERE id = $2`,
    [hashed, user.id]
  );
  console.log(`Contraseña encriptada para usuario ID ${user.id}`);
}


    console.log('Todos los usuarios actualizados con contraseñas seguras.');
    process.exit();
  } catch (err) {
    console.error('Error en actualización:', err);
    process.exit(1);
  }
};

run();
