const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => console.error('❌ Error:', err));

const usuarioSchema = new mongoose.Schema({
  nombre:   { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  creadoEn: { type: Date, default: Date.now }
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

app.post('/api/registrarse', async (req, res) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password)
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });

  const existe = await Usuario.findOne({ email });
  if (existe)
    return res.status(400).json({ error: 'El email ya está registrado' });

  const hash = await bcrypt.hash(password, 10);
  const usuario = new Usuario({ nombre, email, password: hash });
  await usuario.save();

  res.json({ mensaje: 'Cuenta creada correctamente ✅' });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  const usuario = await Usuario.findOne({ email });
  if (!usuario)
    return res.status(400).json({ error: 'Email o contraseña incorrectos' });

  const valido = await bcrypt.compare(password, usuario.password);
  if (!valido)
    return res.status(400).json({ error: 'Email o contraseña incorrectos' });

  const token = jwt.sign({ id: usuario._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

  res.json({ token, nombre: usuario.nombre });
});

app.listen(process.env.PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${process.env.PORT}`);
});