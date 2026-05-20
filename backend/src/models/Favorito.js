const mongoose = require('mongoose');

const favoritoSchema = new mongoose.Schema({
    usuario:      { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    nombre:       String,
    precio:       Number,
    imagen_front: String,
    categoria:    String,
    creadoEn:     { type: Date, default: Date.now }
});

module.exports = mongoose.model('Favorito', favoritoSchema);
