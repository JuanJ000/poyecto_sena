const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
    nombre:   { type: String, required: true },
    email:    { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    rol:      { type: String, default: 'usuario', enum: ['usuario', 'admin'] },
    creadoEn: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Usuario', usuarioSchema);
