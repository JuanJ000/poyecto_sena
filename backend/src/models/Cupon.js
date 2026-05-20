const mongoose = require('mongoose');

const cuponSchema = new mongoose.Schema({
    codigo:     { type: String, required: true, unique: true, uppercase: true },
    descuento:  { type: Number, required: true, min: 0 },
    tipo:       { type: String, default: 'porcentaje', enum: ['porcentaje', 'fijo'] },
    limite:     { type: Number, default: 0 },
    usados:     { type: Number, default: 0 },
    activo:     { type: Boolean, default: true },
    expira:     { type: Date, default: null },
    creadoEn:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('Cupon', cuponSchema);
