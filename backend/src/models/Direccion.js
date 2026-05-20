const mongoose = require('mongoose');

const direccionSchema = new mongoose.Schema({
    usuario:      { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    nombre:       String,
    destinatario: String,
    calle:        String,
    ciudad:       String,
    departamento: String,
    telefono:     String,
    creadoEn:     { type: Date, default: Date.now }
});

module.exports = mongoose.model('Direccion', direccionSchema);
