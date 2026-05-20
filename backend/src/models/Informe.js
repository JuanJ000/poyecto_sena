const mongoose = require('mongoose');

const informeSchema = new mongoose.Schema({
    mes:                { type: Number, required: true, min: 1, max: 12 },
    año:                { type: Number, required: true },
    totalPedidos:       { type: Number, default: 0 },
    totalUsuarios:      { type: Number, default: 0 },
    totalResenas:       { type: Number, default: 0 },
    pedidosPendientes:  { type: Number, default: 0 },
    pedidosEnviados:    { type: Number, default: 0 },
    pedidosEntregados:  { type: Number, default: 0 },
    ingresoTotal:       { type: Number, default: 0 },
    ventasPorMes:       [{ mes: Number, año: Number, total: Number, cantidad: Number }],
    creadoEn:           { type: Date, default: Date.now }
});

// Índice único para mes/año
informeSchema.index({ mes: 1, año: 1 }, { unique: true });

module.exports = mongoose.model('Informe', informeSchema);
