const nodemailer = require('nodemailer');

/**
 * Configurar transporter de nodemailer
 */
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { 
        user: process.env.GMAIL_USER, 
        pass: process.env.GMAIL_PASS 
    }
});

/**
 * Enviar email genérico
 */
async function enviarEmail({ to, subject, html }) {
    try {
        await transporter.sendMail({
            from: `"Tienda X" <${process.env.GMAIL_USER}>`,
            to, 
            subject, 
            html
        });
        console.log('✅ Email enviado a ' + to);
        return true;
    } catch (err) {
        console.error('❌ Error enviando email:', err.message);
        return false;
    }
}

/**
 * Email de confirmación para usuario
 */
function emailConfirmacionUsuario(pedido, usuario) {
    const items = pedido.items.map(i =>
        `<tr><td style="padding:8px;">${i.nombre}</td>
        <td style="padding:8px;text-align:center;">${i.cantidad}</td>
        <td style="padding:8px;text-align:right;">$${(i.precio*i.cantidad).toLocaleString('es-CO')}</td></tr>`
    ).join('');
    
    const total = pedido.items.reduce((a,i) => a+i.precio*i.cantidad, 0);
    const envioInfo = pedido.envio
        ? `${pedido.envio.nombre} — ${pedido.envio.direccion}, ${pedido.envio.ciudad} — Tel: ${pedido.envio.telefono}`
        : 'N/A';
    
    return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:2rem;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;">
        <div style="background:#111;padding:1.5rem;text-align:center;">
            <h1 style="color:#fff;margin:0;">TIENDA X</h1>
            <p style="color:#aaa;margin:4px 0 0;">Confirmación de pedido</p>
        </div>
        <div style="padding:2rem;">
            <h2 style="color:#111;">¡Hola, ${usuario.nombre}!</h2>
            <p>Pedido #${pedido._id.toString().slice(-8).toUpperCase()} confirmado.</p>
            <table style="width:100%;border-collapse:collapse;margin:1rem 0;">
                <thead><tr style="background:#f0f0f0;">
                    <th style="padding:8px;text-align:left;">Producto</th>
                    <th style="padding:8px;">Cant.</th>
                    <th style="padding:8px;text-align:right;">Precio</th>
                </tr></thead>
                <tbody>${items}</tbody>
                <tfoot><tr>
                    <td colspan="2" style="padding:8px;font-weight:700;">Total</td>
                    <td style="padding:8px;font-weight:700;text-align:right;">$${total.toLocaleString('es-CO')}</td>
                </tr></tfoot>
            </table>
            <p><strong>Envío:</strong> ${envioInfo}</p>
            <p><strong>Pago:</strong> ${pedido.metodoPago || 'N/A'}</p>
        </div>
        <div style="background:#f5f5f5;padding:1rem;text-align:center;">
            <p style="margin:0;font-size:0.8rem;color:#aaa;">© 2026 Tienda X</p>
        </div>
    </div></body></html>`;
}

/**
 * Email de nuevo pedido para admin
 */
function emailNuevoPedidoAdmin(pedido, usuario) {
    const total = pedido.items.reduce((a,i) => a+i.precio*i.cantidad, 0);
    const items = pedido.items.map(i => `${i.nombre} x${i.cantidad}`).join(', ');
    
    return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;padding:2rem;">
    <h2>🛍️ Nuevo pedido #${pedido._id.toString().slice(-8).toUpperCase()}</h2>
    <p><b>Cliente:</b> ${usuario.nombre} (${usuario.email})</p>
    <p><b>Total:</b> $${total.toLocaleString('es-CO')} | <b>Pago:</b> ${pedido.metodoPago || 'N/A'}</p>
    <p><b>Productos:</b> ${items}</p>
    ${pedido.envio ? `<p><b>Envío:</b> ${pedido.envio.nombre}, ${pedido.envio.direccion}, ${pedido.envio.ciudad} — Tel: ${pedido.envio.telefono}</p>` : ''}
    </body></html>`;
}

/**
 * Email de cambio de estado
 */
function emailCambioEstado(pedido, usuario, estado) {
    const info = {
        enviado:   { emoji:'🚚', titulo:'¡Tu pedido está en camino!' },
        entregado: { emoji:'✅', titulo:'¡Pedido entregado!' }
    };
    
    const { emoji, titulo } = info[estado] || { emoji:'📦', titulo:'Actualización de pedido' };
    
    return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;padding:2rem;">
    <h2>${emoji} ${titulo}</h2>
    <p>Hola <b>${usuario.nombre}</b>, el estado de tu pedido #${pedido._id.toString().slice(-8).toUpperCase()} es ahora: <b>${estado}</b>.</p>
    ${pedido.tracking ? `<p><b>Número de guía:</b> ${pedido.tracking}</p>` : ''}
    </body></html>`;
}

module.exports = {
    enviarEmail,
    emailConfirmacionUsuario,
    emailNuevoPedidoAdmin,
    emailCambioEstado
};
