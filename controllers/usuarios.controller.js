// usuarios.controller.js
const pool = require('../db');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Registrar docente
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

    const tempPassword = crypto.randomBytes(4).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    if (existe.rows.length === 0) {
      await pool.query(`
        INSERT INTO asistenciaqr.usuarios 
        (nombre, correo, password, rol, grado, activo, requiere_cambio)
        VALUES ($1, $2, $3, 'docente', $4, true, true)
      `, [nombre, correo, hashedPassword, grado]);
    } else {
      await pool.query(`
        UPDATE asistenciaqr.usuarios 
        SET password = $1, requiere_cambio = true 
        WHERE correo = $2
      `, [hashedPassword, correo]);
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: correo,
      subject: 'Credenciales para acceso al sistema de asistencia',
      html: `
        <p>Hola <strong>${nombre}</strong>,</p>
        <p>Se ha creado o actualizado tu usuario para el sistema de asistencia.</p>
        <p><strong>Usuario:</strong> ${correo}<br>
        <strong>Contraseña temporal:</strong> ${tempPassword}</p>
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

// Obtener docentes
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

// Cambiar estado usuario
const cambiarEstadoUsuario = async (req, res) => {
  const { id } = req.params;
  const { activo } = req.body;

  try {
    const result = await pool.query(`
      UPDATE asistenciaqr.usuarios
      SET activo = $1
      WHERE id = $2
      RETURNING id, activo
    `, [activo, id]);

    if (result.rowCount === 0) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    res.json({ mensaje: 'Estado actualizado correctamente', usuario: result.rows[0] });
  } catch (error) {
    console.error('Error al cambiar el estado:', error);
    res.status(500).json({ error: 'Error al cambiar el estado del usuario.' });
  }
};

// Cambiar contraseña usando JWT
const cambiarContrasena = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]; // "Bearer token"
  const { password } = req.body;

  if (!token) return res.status(401).json({ error: 'No autorizado' });
  if (!password) return res.status(400).json({ error: 'Falta la nueva contraseña' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(`
      UPDATE asistenciaqr.usuarios
      SET password = $1, requiere_cambio = false
      WHERE id = $2
      RETURNING id, correo
    `, [hashedPassword, decoded.id]);

    if (result.rowCount === 0)
      return res.status(404).json({ error: 'Usuario no encontrado' });

    res.json({ mensaje: 'Contraseña actualizada correctamente', usuario: result.rows[0] });
  } catch (error) {
    console.error('Error al cambiar la contraseña:', error);
    res.status(500).json({ error: 'Error al cambiar la contraseña.' });
  }
};

module.exports = {
  registrarDocente,
  obtenerDocentes,
  cambiarEstadoUsuario,
  cambiarContrasena
};
