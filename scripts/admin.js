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

// ─── ESTADÍSTICAS ────────────────────────────
async function cargarEstadisticas() {
    try {
        const res  = await fetch(`${ADMIN_API}/admin/estadisticas`, { headers: headers() });
        const data = await res.json();

        document.getElementById('stats-grid').innerHTML = `
            <div class="stat-card">
                <p class="stat-label">Ingresos totales</p>
                <p class="stat-valor">${formatPeso(data.ingresoTotal)}</p>
                <p class="stat-sub">Todos los pedidos</p>
            </div>
            <div class="stat-card">
                <p class="stat-label">Total pedidos</p>
                <p class="stat-valor">${data.totalPedidos}</p>
                <p class="stat-sub">${data.pedidosPendientes} pendientes · ${data.pedidosEnviados} enviados · ${data.pedidosEntregados} entregados</p>
            </div>
            <div class="stat-card">
                <p class="stat-label">Usuarios</p>
                <p class="stat-valor">${data.totalUsuarios}</p>
                <p class="stat-sub">Registrados</p>
            </div>
            <div class="stat-card">
                <p class="stat-label">Reseñas</p>
                <p class="stat-valor">${data.totalResenas}</p>
                <p class="stat-sub">En todos los productos</p>
            </div>`;

        // Gráfico de ventas
        const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        const labels = data.ventasPorMes.map(v => `${meses[v._id.mes - 1]} ${v._id.año}`);
        const totales = data.ventasPorMes.map(v => v.total);

        const ctx = document.getElementById('chart-ventas').getContext('2d');
        if (chartVentas) chartVentas.destroy();
        chartVentas = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Ingresos (COP)',
                    data: totales,
                    backgroundColor: 'rgba(17,17,17,0.08)',
                    borderColor: '#111',
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { callback: v => '$' + (v/1000).toFixed(0) + 'k' }
                    }
                }
            }
        });

    } catch (err) {
        console.error('Error cargando estadísticas:', err);
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

        if (!pedidos.length) {
            tbody.innerHTML = '<tr><td colspan="8" class="vacio">No hay pedidos aún</td></tr>';
            return;
        }

        tbody.innerHTML = pedidos.map(p => {
            const total = p.items.reduce((a,i) => a + i.precio * i.cantidad, 0);
            const prods = p.items.map(i => `${i.nombre} x${i.cantidad}`).join(', ');
            return `
            <tr>
                <td><code style="font-size:0.78rem;">#${p._id.toString().slice(-6).toUpperCase()}</code></td>
                <td>
                    <strong>${p.usuario?.nombre || 'N/A'}</strong>
                    <br><span style="font-size:0.75rem;color:#888;">${p.usuario?.email || ''}</span>
                </td>
                <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${prods}">${prods}</td>
                <td><strong>${formatPeso(total)}</strong></td>
                <td>${p.metodoPago || '—'}</td>
                <td><span class="badge ${p.estado}">${p.estado}</span></td>
                <td>${formatFecha(p.fecha)}</td>
                <td>
                    <select class="estado-select" onchange="cambiarEstado('${p._id}', this.value)">
                        <option value="pendiente"  ${p.estado==='pendiente' ?'selected':''}>Pendiente</option>
                        <option value="enviado"    ${p.estado==='enviado'   ?'selected':''}>Enviado</option>
                        <option value="entregado"  ${p.estado==='entregado' ?'selected':''}>Entregado</option>
                    </select>
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

// ─── USUARIOS ────────────────────────────────
async function cargarUsuarios() {
    try {
        const res      = await fetch(`${ADMIN_API}/admin/usuarios`, { headers: headers() });
        const usuarios = await res.json();
        const tbody    = document.getElementById('tbody-usuarios');

        if (!usuarios.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="vacio">No hay usuarios registrados</td></tr>';
            return;
        }

        tbody.innerHTML = usuarios.map(u => `
            <tr>
                <td><strong>${u.nombre}</strong></td>
                <td>${u.email}</td>
                <td><span class="badge ${u.rol}">${u.rol}</span></td>
                <td>${formatFecha(u.creadoEn)}</td>
                <td>
                    <button class="btn btn-danger" onclick="eliminarUsuario('${u._id}','${u.nombre}')">
                        Eliminar
                    </button>
                </td>
            </tr>`).join('');

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

        if (!productos.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="vacio">No hay productos en la base de datos</td></tr>';
            return;
        }

        tbody.innerHTML = productos.map(p => `
            <tr>
                <td>
                    <div style="display:flex;align-items:center;gap:10px;">
                        ${p.imagen_front ? `<img src="${p.imagen_front}" style="width:40px;height:40px;object-fit:cover;border-radius:6px;border:1px solid #eee;">` : '<div style="width:40px;height:40px;background:#f0f0f0;border-radius:6px;"></div>'}
                        <strong>${p.nombre}</strong>
                    </div>
                </td>
                <td>${p.genero}</td>
                <td>${p.categoria}</td>
                <td>${formatPeso(p.precio)}</td>
                <td>${'★'.repeat(p.rating)}${'☆'.repeat(5-p.rating)}</td>
                <td style="display:flex;gap:6px;">
                    <button class="btn btn-secondary" onclick="editarProducto('${p._id}')">Editar</button>
                    <button class="btn btn-danger"    onclick="eliminarProducto('${p._id}','${p.nombre}')">Eliminar</button>
                </td>
            </tr>`).join('');

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
        const res    = await fetch(`${ADMIN_API}/admin/resenas`, { headers: headers() });
        const resenas = await res.json();
        const tbody  = document.getElementById('tbody-resenas');

        if (!resenas.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="vacio">No hay reseñas aún</td></tr>';
            return;
        }

        tbody.innerHTML = resenas.map(r => `
            <tr>
                <td><strong>${r.productoNombre}</strong></td>
                <td>${r.nombreUsuario}</td>
                <td style="color:#f59e0b;">${'★'.repeat(r.estrellas)}${'☆'.repeat(5-r.estrellas)}</td>
                <td style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${r.comentario}">${r.comentario}</td>
                <td>${formatFecha(r.fecha)}</td>
                <td>
                    <button class="btn btn-danger" onclick="eliminarResena('${r._id}')">Eliminar</button>
                </td>
            </tr>`).join('');

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
<<<<<<< HEAD
});
=======
});
>>>>>>> eb5240d583ab6d3d285e127b57c29d627e2f68ce
