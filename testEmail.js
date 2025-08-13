// testEmail.js
const transporter = require('./utils/mailer');

const mailOptions = {
  from: process.env.EMAIL_USER,
  to: 'jvariosusos@gmail.com', // reemplaza con un correo real tuyo
  subject: '📧 Prueba de envío de correo',
  text: 'Este es un mensaje de prueba desde Nodemailer y tu backend.'
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('❌ Error al enviar el correo:', error);
  } else {
    console.log('✅ Correo enviado exitosamente:', info.response);
  }
});
