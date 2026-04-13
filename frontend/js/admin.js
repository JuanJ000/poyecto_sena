// =============================================
// admin.js — Panel de Administrador
// =============================================

const ADMIN_API = 'http://localhost:3000/api';
let adminToken  = sessionStorage.getItem('adminToken');
let chartVentas = null;

// ─── LOGIN ───────────────────────────────────
async function adminLogin() {
    const pass    = document.getElementById('admin-pass').value;
    const errorEl = document.getElementById('login-error');

    if (!pass) { errorEl.textContent = 'Ingresa la contraseña'; return; }

    try {
        const res  = await fetch(`${ADMIN_API}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pass })
        });
        const data = await res.json();

        if (!res.ok) { errorEl.textContent = data.error || 'Contraseña incorrecta'; return; }

        sessionStorage.setItem('adminToken', data.token);
        adminToken = data.token;

        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('panel').style.display = 'block';

        cargarInformes();
        cargarEstadisticas();
        cargarPedidos();
        cargarUsuarios();
        cargarProductos();
        cargarResenas();

    } catch (err) {
        errorEl.textContent = 'No se pudo conectar con el servidor';
    }
}

// Si ya hay token activo, mostrar panel directamente
if (adminToken) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('panel').style.display = 'block';
    cargarInformes();
    cargarEstadisticas();
    cargarPedidos();
    cargarUsuarios();
    cargarProductos();
    cargarResenas();
}

function salir() {
    sessionStorage.removeItem('adminToken');
    window.location.reload();
}

// ─── NAVEGACIÓN ──────────────────────────────
function mostrarSeccion(id, btn) {
    document.querySelectorAll('.seccion').forEach(s => s.classList.remove('activa'));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('activo'));
    document.getElementById(`sec-${id}`).classList.add('activa');
    btn.classList.add('activo');
}

// ─── FILTRAR TABLA ────────────────────────────
function filtrarTabla(input, tablaId) {
    const texto = input.value.toLowerCase();
    document.querySelectorAll(`#${tablaId} tbody tr`).forEach(tr => {
        tr.style.display = tr.textContent.toLowerCase().includes(texto) ? '' : 'none';
    });
}

// ─── HELPER ──────────────────────────────────
function headers() {
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` };
}

function formatPeso(n) {
    return '$' + Number(n).toLocaleString('es-CO');
}

function formatFecha(f) {
    return new Date(f).toLocaleDateString('es-CO', { year:'numeric', month:'short', day:'numeric' });
}

// ─── CARGAR INFORMES MENSUALES ────────────────
async function cargarInformes() {
    try {
        const res = await fetch(`${ADMIN_API}/admin/informes`, { headers: headers() });
        const informes = await res.json();

        // Llenar selectors de mes y año
        const mesesNombres = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        const selectMes = document.getElementById('select-mes');
        const selectAño = document.getElementById('select-año');
        
        // Agrupar informes por mes y año únicos
        const mesesSet = new Set();
        const añosSet = new Set();
        
        informes.forEach(inf => {
            mesesSet.add(inf.mes);
            añosSet.add(inf.año);
        });

        // Actualizar select de meses
        selectMes.innerHTML = '<option value="">Seleccionar mes...</option>';
        Array.from(mesesSet).sort().forEach(mes => {
            const opt = document.createElement('option');
            opt.value = mes;
            opt.textContent = mesesNombres[mes - 1];
            selectMes.appendChild(opt);
        });

        // Actualizar select de años
        selectAño.innerHTML = '<option value="">Seleccionar año...</option>';
        Array.from(añosSet).sort((a,b) => b - a).forEach(año => {
            const opt = document.createElement('option');
            opt.value = año;
            opt.textContent = año;
            selectAño.appendChild(opt);
        });

        // Event listeners para habilitar botón exportar
        selectMes.addEventListener('change', verificarSeleccionInforme);
        selectAño.addEventListener('change', verificarSeleccionInforme);

        console.log(`📊 ${informes.length} informes cargados`);
    } catch (err) {
        console.error('❌ Error cargando informes:', err);
    }
}

function verificarSeleccionInforme() {
    const mes = document.getElementById('select-mes').value;
    const año = document.getElementById('select-año').value;
    const btnExportar = document.getElementById('btn-exportar-informe');
    
    btnExportar.disabled = !(mes && año);
}

// ─── EXPORTAR INFORME ────────────────────────
async function exportarInforme() {
    const mes = document.getElementById('select-mes').value;
    const año = document.getElementById('select-año').value;

    if (!mes || !año) {
        alert('Selecciona mes y año');
        return;
    }

    try {
        const res = await fetch(`${ADMIN_API}/admin/exportar-ventas/${mes}/${año}`, { 
            headers: headers() 
        });

        if (!res.ok) {
            alert('No hay informe para este período');
            return;
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `informe-${mes}-${año}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        console.log(`✅ Informe ${mes}/${año} descargado`);
    } catch (err) {
        console.error('❌ Error descargando informe:', err);
        alert('Error al descargar el informe');
    }
}

// ─── GUARDAR INFORME DEL MES ACTUAL ────────────
async function guardarInformeDelMes(estadisticas) {
    try {
        const hoy = new Date();
        const mes = hoy.getMonth() + 1;
        const año = hoy.getFullYear();

        const res = await fetch(`${ADMIN_API}/admin/guardar-informe`, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify({ mes, año, estadisticas })
        });

        const data = await res.json();
        if (res.ok) {
            console.log(`✅ Informe guardado: ${mes}/${año}`);
            cargarInformes(); // Recargar lista de informes
        } else {
            console.warn('⚠️ No se guardó informe:', data.error);
        }
    } catch (err) {
        console.error('❌ Error guardando informe:', err);
    }
}

// ─── ESTADÍSTICAS ────────────────────────────
async function cargarEstadisticas() {
    try {
        const res  = await fetch(`${ADMIN_API}/admin/estadisticas`, { headers: headers() });
        const data = await res.json();

        // Actualizar badge de pedidos pendientes en sidebar
        const badge = document.getElementById('badge-pendientes');
        if (badge) badge.textContent = data.pedidosPendientes || '0';

        const ticketProm = data.totalPedidos > 0
            ? Math.round(data.ingresoTotal / data.totalPedidos)
            : 0;

        document.getElementById('stats-grid').innerHTML = `
            <div class="stat-card verde">
                <div class="stat-icon">💰</div>
                <p class="stat-label">Ingresos totales</p>
                <p class="stat-valor">${formatPeso(data.ingresoTotal)}</p>
                <p class="stat-sub">${data.totalPedidos} pedidos en total</p>
            </div>
            <div class="stat-card azul">
                <div class="stat-icon">🛍️</div>
                <p class="stat-label">Pedidos</p>
                <p class="stat-valor">${data.totalPedidos}</p>
                <p class="stat-sub">
                    <span class="down">${data.pedidosPendientes} pendientes</span> ·
                    ${data.pedidosEnviados} enviados ·
                    <span class="up">${data.pedidosEntregados} entregados</span>
                </p>
            </div>
            <div class="stat-card amber">
                <div class="stat-icon">🎫</div>
                <p class="stat-label">Ticket promedio</p>
                <p class="stat-valor">${formatPeso(ticketProm)}</p>
                <p class="stat-sub">Por pedido realizado</p>
            </div>
            <div class="stat-card">
                <div class="stat-icon">👥</div>
                <p class="stat-label">Usuarios</p>
                <p class="stat-valor">${data.totalUsuarios}</p>
                <p class="stat-sub">${data.totalResenas} reseñas publicadas</p>
            </div>`;

        // Gráfico mejorado
        const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        const labels  = data.ventasPorMes.map(v => `${meses[v._id.mes - 1]} ${String(v._id.año).slice(-2)}`);
        const totales = data.ventasPorMes.map(v => v.total);
        const pedidosM = data.ventasPorMes.map(v => v.cantidad);

        const ctx = document.getElementById('chart-ventas').getContext('2d');
        if (chartVentas) chartVentas.destroy();
        chartVentas = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Ingresos COP',
                        data: totales,
                        backgroundColor: 'rgba(17,17,16,0.07)',
                        borderColor: '#111110',
                        borderWidth: 1.5,
                        borderRadius: 5,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Pedidos',
                        data: pedidosM,
                        type: 'line',
                        borderColor: '#d97706',
                        backgroundColor: 'rgba(217,119,6,0.08)',
                        borderWidth: 2,
                        pointRadius: 4,
                        pointBackgroundColor: '#d97706',
                        tension: 0.35,
                        yAxisID: 'y2',
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#111110',
                        titleColor: '#f0f0f0',
                        bodyColor: '#a8a8b0',
                        borderColor: '#252528',
                        borderWidth: 1,
                        padding: 10,
                        callbacks: {
                            label: ctx => ctx.dataset.label === 'Ingresos COP'
                                ? ` $${ctx.parsed.y.toLocaleString('es-CO')}`
                                : ` ${ctx.parsed.y} pedidos`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { font: { size: 11 }, color: '#a8a8b0' }
                    },
                    y: {
                        position: 'left',
                        grid: { color: 'rgba(0,0,0,0.05)' },
                        ticks: {
                            callback: v => '$' + (v/1000).toFixed(0) + 'k',
                            font: { size: 11, family: 'DM Mono' },
                            color: '#a8a8b0'
                        }
                    },
                    y2: {
                        position: 'right',
                        grid: { display: false },
                        ticks: {
                            font: { size: 11 },
                            color: '#d97706',
                            stepSize: 1
                        }
                    }
                }
            }
        });

        // Guardar informe del mes automáticamente
        guardarInformeDelMes(data);

    } catch (err) {
        console.error('Error cargando estadísticas:', err);
        document.getElementById('stats-grid').innerHTML =
            '<div class="stat-card"><p class="stat-label">Error al cargar</p></div>';
    }
}

// ─── EXPORTAR VENTAS ─────────────────────────
async function exportarVentas() {
    const res = await fetch(`${ADMIN_API}/admin/exportar-ventas`, { headers: headers() });
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'ventas-tiendax.csv';
    a.click();
    URL.revokeObjectURL(url);
}

// ─── PEDIDOS ─────────────────────────────────
async function cargarPedidos() {
    try {
        const res     = await fetch(`${ADMIN_API}/admin/pedidos`, { headers: headers() });
        const pedidos = await res.json();
        const tbody   = document.getElementById('tbody-pedidos');
        const count   = document.getElementById('count-pedidos');

        if (count) count.textContent = `${pedidos.length} registros`;

        if (!pedidos.length) {
            tbody.innerHTML = '<tr><td colspan="8"><div class="vacio"><div class="vacio-icon">🛍️</div>No hay pedidos aún</div></td></tr>';
            return;
        }

        tbody.innerHTML = pedidos.map(p => {
            const total = p.items.reduce((a,i) => a + i.precio * i.cantidad, 0);
            const prods = p.items.map(i => `${i.nombre} ×${i.cantidad}`).join(', ');
            const ciudadEnvio = p.envio?.ciudad ? `<span class="td-muted">📍 ${p.envio.ciudad}</span>` : '';
            return `
            <tr>
                <td>
                    <code style="font-family:'DM Mono',monospace;font-size:0.72rem;background:#f5f4f1;padding:2px 6px;border-radius:4px;">#${p._id.toString().slice(-6).toUpperCase()}</code>
                </td>
                <td>
                    <strong style="font-size:0.83rem;">${p.usuario?.nombre || 'N/A'}</strong>
                    <span class="td-muted">${p.usuario?.email || ''}</span>
                </td>
                <td style="max-width:160px;">
                    <span style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:0.78rem;color:#6b6b72;" title="${prods}">${prods}</span>
                    ${ciudadEnvio}
                </td>
                <td>
                    <strong style="font-family:'DM Mono',monospace;">${formatPeso(total)}</strong>
                </td>
                <td style="font-size:0.78rem;color:#6b6b72;">${p.metodoPago || '—'}</td>
                <td><span class="badge ${p.estado}">${p.estado}</span></td>
                <td style="font-size:0.78rem;color:#6b6b72;white-space:nowrap;">${formatFecha(p.fecha)}</td>
                <td>
                    <div style="display:flex;flex-direction:column;gap:5px;min-width:170px;">
                        <select class="estado-select" onchange="cambiarEstado('${p._id}', this.value)">
                            <option value="pendiente"  ${p.estado==='pendiente' ?'selected':''}>⏳ Pendiente</option>
                            <option value="enviado"    ${p.estado==='enviado'   ?'selected':''}>🚚 Enviado</option>
                            <option value="entregado"  ${p.estado==='entregado' ?'selected':''}>✅ Entregado</option>
                        </select>
                        <div class="tracking-input-wrap">
                            <input type="text" class="tracking-input"
                                placeholder="Nº guía..."
                                value="${p.tracking || ''}"
                                id="tracking-${p._id}">
                            <button class="btn btn-sm btn-secondary" onclick="guardarTracking('${p._id}')">✓</button>
                        </div>
                    </div>
                </td>
            </tr>`;
        }).join('');

    } catch (err) {
        console.error('Error cargando pedidos:', err);
    }
}

async function cambiarEstado(pedidoId, estado) {
    try {
        const res = await fetch(`${ADMIN_API}/pedidos/${pedidoId}/estado`, {
            method: 'PUT',
            headers: headers(),
            body: JSON.stringify({ estado })
        });
        if (res.ok) {
            cargarPedidos();
            cargarEstadisticas();
        }
    } catch (err) {
        alert('Error al cambiar estado');
    }
}

async function guardarTracking(pedidoId) {
    const tracking = document.getElementById(`tracking-${pedidoId}`)?.value.trim();
    try {
        const res = await fetch(`${ADMIN_API}/pedidos/${pedidoId}/tracking`, {
            method: 'PUT',
            headers: headers(),
            body: JSON.stringify({ tracking })
        });
        if (res.ok) {
            const input = document.getElementById(`tracking-${pedidoId}`);
            if (input) {
                input.style.borderColor = '#16a34a';
                setTimeout(() => { input.style.borderColor = '#e0e0e0'; }, 1500);
            }
        }
    } catch (err) {
        alert('Error al guardar número de guía');
    }
}

// ─── USUARIOS ────────────────────────────────
async function cargarUsuarios() {
    try {
        const res      = await fetch(`${ADMIN_API}/admin/usuarios`, { headers: headers() });
        const usuarios = await res.json();
        const tbody    = document.getElementById('tbody-usuarios');
        const count    = document.getElementById('count-usuarios');

        if (count) count.textContent = `${usuarios.length} registros`;

        if (!usuarios.length) {
            tbody.innerHTML = '<tr><td colspan="5"><div class="vacio"><div class="vacio-icon">👥</div>No hay usuarios registrados</div></td></tr>';
            return;
        }

        tbody.innerHTML = usuarios.map(u => {
            const inicial = (u.nombre || '?').charAt(0).toUpperCase();
            return `
            <tr>
                <td>
                    <div style="display:flex;align-items:center;gap:10px;">
                        <div style="width:32px;height:32px;border-radius:50%;background:#f5f4f1;border:1px solid #e8e7e3;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:#6b6b72;flex-shrink:0;">${inicial}</div>
                        <strong style="font-size:0.83rem;">${u.nombre}</strong>
                    </div>
                </td>
                <td style="font-size:0.82rem;color:#6b6b72;">${u.email}</td>
                <td><span class="badge ${u.rol}">${u.rol}</span></td>
                <td style="font-size:0.78rem;color:#a8a8b0;">${formatFecha(u.creadoEn)}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="eliminarUsuario('${u._id}','${u.nombre}')">
                        Eliminar
                    </button>
                </td>
            </tr>`;
        }).join('');

    } catch (err) {
        console.error('Error cargando usuarios:', err);
    }
}

async function eliminarUsuario(id, nombre) {
    if (!confirm(`¿Eliminar al usuario "${nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
        await fetch(`${ADMIN_API}/admin/usuarios/${id}`, { method: 'DELETE', headers: headers() });
        cargarUsuarios();
        cargarEstadisticas();
    } catch (err) {
        alert('Error al eliminar usuario');
    }
}

// ─── PRODUCTOS ───────────────────────────────
async function cargarProductos() {
    try {
        const res       = await fetch(`${ADMIN_API}/admin/productos`, { headers: headers() });
        const productos = await res.json();
        const tbody     = document.getElementById('tbody-productos');
        const count     = document.getElementById('count-productos');

        if (count) count.textContent = `${productos.length} productos`;

        if (!productos.length) {
            tbody.innerHTML = '<tr><td colspan="6"><div class="vacio"><div class="vacio-icon">👕</div>No hay productos en la base de datos</div></td></tr>';
            return;
        }

        tbody.innerHTML = productos.map(p => {
            const stars = `<span class="stars">${'★'.repeat(p.rating)}</span><span class="stars-empty">${'☆'.repeat(5-p.rating)}</span>`;
            const thumb = p.imagen_front
                ? `<img class="prod-thumb" src="${p.imagen_front}" alt="${p.nombre}" onerror="this.style.display='none'">`
                : `<div class="prod-thumb-placeholder">👕</div>`;
            const generoBadge = { hombre:'🧔', mujer:'👩', niño:'👦' };
            return `
            <tr>
                <td>
                    <div class="prod-name-cell">
                        ${thumb}
                        <div>
                            <strong style="font-size:0.83rem;">${p.nombre}</strong>
                            <span class="td-muted">${p.descripcion ? p.descripcion.slice(0,40)+'…' : '—'}</span>
                        </div>
                    </div>
                </td>
                <td style="font-size:0.82rem;">${generoBadge[p.genero] || ''} ${p.genero}</td>
                <td>
                    <span style="background:#f5f4f1;border:1px solid #e8e7e3;border-radius:4px;padding:2px 7px;font-size:0.72rem;color:#6b6b72;">
                        ${p.categoria}
                    </span>
                </td>
                <td style="font-family:'DM Mono',monospace;font-size:0.82rem;font-weight:500;">${formatPeso(p.precio)}</td>
                <td style="font-size:0.82rem;">${stars}</td>
                <td>
                    <div style="display:flex;gap:5px;">
                        <button class="btn btn-sm btn-secondary" onclick="editarProducto('${p._id}')">Editar</button>
                        <button class="btn btn-sm btn-danger" onclick="eliminarProducto('${p._id}','${p.nombre}')">Eliminar</button>
                    </div>
                </td>
            </tr>`;
        }).join('');

    } catch (err) {
        console.error('Error cargando productos:', err);
    }
}

function abrirModalProducto() {
    document.getElementById('modal-titulo').textContent = 'Agregar producto';
    document.getElementById('prod-id').value       = '';
    document.getElementById('prod-nombre').value   = '';
    document.getElementById('prod-genero').value   = 'hombre';
    document.getElementById('prod-categoria').value= 'jeans';
    document.getElementById('prod-precio').value   = '';
    document.getElementById('prod-rating').value   = '5';
    document.getElementById('prod-img-front').value= '';
    document.getElementById('prod-img-back').value = '';
    document.getElementById('prod-desc').value     = '';
    document.getElementById('prod-error').textContent = '';
    document.getElementById('modal-producto').classList.add('abierto');
}

async function editarProducto(id) {
    try {
        const res  = await fetch(`${ADMIN_API}/admin/productos`, { headers: headers() });
        const data = await res.json();
        const p    = data.find(x => x._id === id);
        if (!p) return;

        document.getElementById('modal-titulo').textContent = 'Editar producto';
        document.getElementById('prod-id').value        = p._id;
        document.getElementById('prod-nombre').value    = p.nombre;
        document.getElementById('prod-genero').value    = p.genero;
        document.getElementById('prod-categoria').value = p.categoria;
        document.getElementById('prod-precio').value    = p.precio;
        document.getElementById('prod-rating').value    = p.rating;
        document.getElementById('prod-img-front').value = p.imagen_front || '';
        document.getElementById('prod-img-back').value  = p.imagen_back  || '';
        document.getElementById('prod-desc').value      = p.descripcion  || '';
        document.getElementById('prod-error').textContent = '';
        document.getElementById('modal-producto').classList.add('abierto');
    } catch (err) {
        alert('Error al cargar producto');
    }
}

function cerrarModalProducto() {
    document.getElementById('modal-producto').classList.remove('abierto');
}

async function guardarProducto() {
    const id       = document.getElementById('prod-id').value;
    const errorEl  = document.getElementById('prod-error');
    const body = {
        nombre:       document.getElementById('prod-nombre').value.trim(),
        genero:       document.getElementById('prod-genero').value,
        categoria:    document.getElementById('prod-categoria').value,
        precio:       parseInt(document.getElementById('prod-precio').value),
        rating:       parseInt(document.getElementById('prod-rating').value),
        imagen_front: document.getElementById('prod-img-front').value.trim(),
        imagen_back:  document.getElementById('prod-img-back').value.trim(),
        descripcion:  document.getElementById('prod-desc').value.trim()
    };

    if (!body.nombre || !body.precio) {
        errorEl.textContent = 'Nombre y precio son obligatorios';
        return;
    }

    try {
        const url    = id ? `${ADMIN_API}/admin/productos/${id}` : `${ADMIN_API}/admin/productos`;
        const method = id ? 'PUT' : 'POST';
        const res    = await fetch(url, { method, headers: headers(), body: JSON.stringify(body) });
        const data   = await res.json();

        if (!res.ok) { errorEl.textContent = data.error || 'Error al guardar'; return; }

        cerrarModalProducto();
        cargarProductos();

    } catch (err) {
        errorEl.textContent = 'No se pudo conectar con el servidor';
    }
}

async function eliminarProducto(id, nombre) {
    if (!confirm(`¿Eliminar el producto "${nombre}"?`)) return;
    try {
        await fetch(`${ADMIN_API}/admin/productos/${id}`, { method: 'DELETE', headers: headers() });
        cargarProductos();
    } catch (err) {
        alert('Error al eliminar producto');
    }
}

// ─── RESEÑAS ─────────────────────────────────
async function cargarResenas() {
    try {
        const res     = await fetch(`${ADMIN_API}/admin/resenas`, { headers: headers() });
        const resenas = await res.json();
        const tbody   = document.getElementById('tbody-resenas');
        const count   = document.getElementById('count-resenas');

        if (count) count.textContent = `${resenas.length} reseñas`;

        if (!resenas.length) {
            tbody.innerHTML = '<tr><td colspan="6"><div class="vacio"><div class="vacio-icon">⭐</div>No hay reseñas aún</div></td></tr>';
            return;
        }

        tbody.innerHTML = resenas.map(r => {
            const stars = `<span class="stars">${'★'.repeat(r.estrellas)}</span><span class="stars-empty">${'☆'.repeat(5-r.estrellas)}</span>`;
            return `
            <tr>
                <td style="font-size:0.83rem;font-weight:500;">${r.productoNombre}</td>
                <td style="font-size:0.82rem;color:#6b6b72;">${r.nombreUsuario}</td>
                <td style="font-size:0.85rem;">${stars}</td>
                <td style="max-width:220px;">
                    <span style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:0.8rem;color:#6b6b72;" title="${r.comentario}">${r.comentario}</span>
                </td>
                <td style="font-size:0.78rem;color:#a8a8b0;white-space:nowrap;">${formatFecha(r.fecha)}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="eliminarResena('${r._id}')">Eliminar</button>
                </td>
            </tr>`;
        }).join('');

    } catch (err) {
        console.error('Error cargando reseñas:', err);
    }
}

async function eliminarResena(id) {
    if (!confirm('¿Eliminar esta reseña?')) return;
    try {
        await fetch(`${ADMIN_API}/admin/resenas/${id}`, { method: 'DELETE', headers: headers() });
        cargarResenas();
        cargarEstadisticas();
    } catch (err) {
        alert('Error al eliminar reseña');
    }
}

// Cerrar modal al hacer click fuera
document.getElementById('modal-producto').addEventListener('click', function(e) {
    if (e.target === this) cerrarModalProducto();
});