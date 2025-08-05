const pool = require('../db');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config();

const registrarDocente = async (req, res) => {
  const { nombre, correo, grado } = req.body;

  if (!nombre || !correo || !grado) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }

  try {
    const existe = await pool.query(
      'SELECT * FROM asistenciaqr.usuarios WHERE correo = $1',
      [correo]
    );

    let tempPassword = crypto.randomBytes(4).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    if (existe.rows.length === 0) {
      await pool.query(`
        INSERT INTO asistenciaqr.usuarios (nombre, correo, password, rol, grado)
        VALUES ($1, $2, $3, 'docente', $4)
      `, [nombre, correo, hashedPassword, grado]);
    } else {
      await pool.query(`
        UPDATE asistenciaqr.usuarios SET password = $1 WHERE correo = $2
      `, [hashedPassword, correo]);
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: correo,
      subject: 'Credenciales para acceso al sistema de asistencia',
      html: `
        <p>Hola <strong>${nombre}</strong>,</p>
        <p>Se ha creado o actualizado tu usuario para el sistema de asistencia.</p>
        <p><strong>Usuario:</strong> ${correo}<br>
        <strong>Contraseña de ingreso:</strong> ${tempPassword}</p>
        <p>Por favor inicia sesión y cambia tu contraseña lo antes posible.</p>
        <p>Atentamente,<br>Dirección Académica</p>
      `
    });

    res.json({ mensaje: 'Docente registrado y correo enviado con éxito.' });

  } catch (error) {
    console.error('Error al registrar docente:', error);
    res.status(500).json({ error: 'Error al registrar docente.' });
  }
};

const obtenerDocentes = async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT id, nombre, correo, grado, activo
      FROM asistenciaqr.usuarios
      WHERE rol = 'docente'
      ORDER BY nombre
    `);
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener docentes:', error);
    res.status(500).json({ error: 'Error al obtener docentes.' });
  }
};



const cambiarEstadoUsuario = async (req, res) => {
  const { id } = req.params;
  const { activo } = req.body;

  try {
    await pool.query(`
      UPDATE asistenciaqr.usuarios
      SET activo = $1
      WHERE id = $2
    `, [activo, id]);

    res.json({ mensaje: 'Estado actualizado correctamente' });
  } catch (error) {
    console.error('Error al cambiar el estado:', error);
    res.status(500).json({ error: 'Error al cambiar el estado del usuario.' });
  }
};


module.exports = { registrarDocente, obtenerDocentes, cambiarEstadoUsuario };
