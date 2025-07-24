const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const docenteRoutes = require('./routes/docenteRoutes');


dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

//  Middleware para CORS con Authorization
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); 
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
});

// 🛣️ Rutas
app.use('/api/auth', authRoutes);
app.use('/api/docente', docenteRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
