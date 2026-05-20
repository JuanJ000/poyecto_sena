const mongoose = require('mongoose');

const pedidoSchema = new mongoose.Schema({
    usuario:    { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    items:      [{ nombre: String, precio: Number, cantidad: Number, img: String }],
    envio: {
        nombre: String,
        telefono: String,
        direccion: String,
        ciudad: String,
        departamento: String
    },
    metodoPago: { type: String, default: '' },
    notas:      { type: String, default: '' },
    tracking:   { type: String, default: '' },
    estado:     { type: String, default: 'pendiente', enum: ['pendiente', 'enviado', 'entregado'] },
    fecha:      { type: Date, default: Date.now }
});

module.exports = mongoose.model('Pedido', pedidoSchema);
