const mongoose = require('mongoose');

const resenaSchema = new mongoose.Schema({
    productoNombre: { type: String, required: true },
    usuario:        { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    nombreUsuario:  { type: String, required: true },
    estrellas:      { type: Number, required: true, min: 1, max: 5 },
    comentario:     { type: String, required: true },
    fecha:          { type: Date, default: Date.now }
});

// Índice para búsquedas por producto
resenaSchema.index({ productoNombre: 1 });

module.exports = mongoose.model('Resena', resenaSchema);
