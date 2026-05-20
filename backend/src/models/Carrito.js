const mongoose = require('mongoose');

const carritoSchema = new mongoose.Schema({
    usuario:       { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true, unique: true },
    items:         [{ nombre: String, precio: Number, cantidad: Number, img: String }],
    actualizadoEn: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Carrito', carritoSchema);
