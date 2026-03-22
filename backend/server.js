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

// ─── MIDDLEWARE: verificar token ────────────
function verificarToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.status(401).json({ error: "No autorizado" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch {
        return res.status(401).json({ error: "Token inválido" });
    }
}


// ─── MODELOS ────────────────────────────────

const pedidoSchema = new mongoose.Schema({
    usuario:  { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    items:    [{
        nombre:   String,
        precio:   Number,
        cantidad: Number,
        img:      String
    }],
    estado:   { type: String, default: "pendiente", enum: ["pendiente", "enviado", "entregado"] },
    fecha:    { type: Date, default: Date.now }
});

const direccionSchema = new mongoose.Schema({
    usuario:      { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    nombre:       String,
    destinatario: String,
    calle:        String,
    ciudad:       String,
    departamento: String,
    telefono:     String
});

const favoritoSchema = new mongoose.Schema({
    usuario:      { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    nombre:       String,
    precio:       Number,
    imagen_front: String,
    categoria:    String
});

const Pedido    = mongoose.model("Pedido",    pedidoSchema);
const Direccion = mongoose.model("Direccion", direccionSchema);
const Favorito  = mongoose.model("Favorito",  favoritoSchema);


// ─── RUTA: GET perfil ───────────────────────
app.get("/api/perfil", verificarToken, async (req, res) => {
    const usuario = await Usuario.findById(req.userId).select("-password");
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

    const pedidos = await Pedido.find({ usuario: req.userId });
    res.json({ ...usuario.toObject(), pedidos });
});


// ─── RUTA: PUT perfil (editar) ──────────────
app.put("/api/perfil", verificarToken, async (req, res) => {
    const { nombre, email, passwordActual, passwordNueva } = req.body;

    const usuario = await Usuario.findById(req.userId);
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

    const valido = await bcrypt.compare(passwordActual, usuario.password);
    if (!valido) return res.status(400).json({ error: "Contraseña actual incorrecta" });

    usuario.nombre = nombre || usuario.nombre;
    usuario.email  = email  || usuario.email;

    if (passwordNueva && passwordNueva.length >= 6) {
        usuario.password = await bcrypt.hash(passwordNueva, 10);
    }

    await usuario.save();
    res.json({ mensaje: "Perfil actualizado ✅" });
});


// ─── RUTA: GET pedidos ──────────────────────
app.get("/api/pedidos", verificarToken, async (req, res) => {
    const pedidos = await Pedido.find({ usuario: req.userId }).sort({ fecha: -1 });
    res.json(pedidos);
});


// ─── RUTA: POST pedido (al finalizar compra) ─
app.post("/api/pedidos", verificarToken, async (req, res) => {
    const { items } = req.body;
    if (!items || items.length === 0)
        return res.status(400).json({ error: "El pedido está vacío" });

    const pedido = new Pedido({ usuario: req.userId, items });
    await pedido.save();
    res.json({ mensaje: "Pedido creado ✅", pedido });
});


// ─── RUTA: GET direcciones ──────────────────
app.get("/api/direcciones", verificarToken, async (req, res) => {
    const dirs = await Direccion.find({ usuario: req.userId });
    res.json(dirs);
});


// ─── RUTA: POST dirección ───────────────────
app.post("/api/direcciones", verificarToken, async (req, res) => {
    const { nombre, destinatario, calle, ciudad, departamento, telefono } = req.body;

    if (!nombre || !calle || !ciudad)
        return res.status(400).json({ error: "Nombre, calle y ciudad son obligatorios" });

    const dir = new Direccion({ usuario: req.userId, nombre, destinatario, calle, ciudad, departamento, telefono });
    await dir.save();
    res.json({ mensaje: "Dirección guardada ✅", dir });
});


// ─── RUTA: DELETE dirección ─────────────────
app.delete("/api/direcciones/:id", verificarToken, async (req, res) => {
    await Direccion.findOneAndDelete({ _id: req.params.id, usuario: req.userId });
    res.json({ mensaje: "Dirección eliminada" });
});


// ─── RUTA: GET favoritos ────────────────────
app.get("/api/favoritos", verificarToken, async (req, res) => {
    const favs = await Favorito.find({ usuario: req.userId });
    res.json(favs);
});


// ─── RUTA: POST favorito ────────────────────
app.post("/api/favoritos", verificarToken, async (req, res) => {
    const { nombre, precio, imagen_front, categoria } = req.body;

    const existe = await Favorito.findOne({ usuario: req.userId, nombre });
    if (existe) return res.status(400).json({ error: "Ya está en favoritos" });

    const fav = new Favorito({ usuario: req.userId, nombre, precio, imagen_front, categoria });
    await fav.save();
    res.json({ mensaje: "Agregado a favoritos ✅" });
});


// ─── RUTA: DELETE favorito ──────────────────
app.delete("/api/favoritos/:id", verificarToken, async (req, res) => {
    await Favorito.findOneAndDelete({ _id: req.params.id, usuario: req.userId });
    res.json({ mensaje: "Favorito eliminado" });
});


// ══════════════════════════════════════════════
// INICIAR SERVIDOR
// ══════════════════════════════════════════════
app.listen(process.env.PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${process.env.PORT}`);
});