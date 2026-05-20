const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
    nombre:       { type: String, required: true },
    categoria:    { type: String, required: true },
    genero:       { type: String, required: true, enum: ['hombre', 'mujer', 'niño'] },
    precio:       { type: Number, required: true, min: 0 },
    rating:       { type: Number, default: 5, min: 1, max: 5 },
    imagen_front: { type: String, default: '' },
    imagen_back:  { type: String, default: '' },
    descripcion:  { type: String, default: '' },
    activo:       { type: Boolean, default: true },
    creadoEn:     { type: Date, default: Date.now }
});

module.exports = mongoose.model('Producto', productoSchema);
