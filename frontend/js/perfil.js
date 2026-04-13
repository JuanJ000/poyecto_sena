// =============================================
// perfil.js — Lógica completa de Mi Perfil
// =============================================

const PERFIL_API = "http://localhost:3000/api";
const perfilToken = localStorage.getItem("token");

// Si no hay sesión, redirigir al login
if (!perfilToken) {
    window.location.href = "registrarse.html";
}

// ─── TABS ───────────────────────────────────
document.querySelectorAll(".perfil-tab").forEach(tab => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".perfil-tab").forEach(t => t.classList.remove("activo"));
        document.querySelectorAll(".perfil-seccion").forEach(s => s.classList.remove("activa"));
        tab.classList.add("activo");
        document.getElementById(`sec-${tab.dataset.tab}`).classList.add("activa");
    });
});


// ─── CARGAR PERFIL ──────────────────────────
async function cargarPerfil() {
    try {
        const res  = await fetch(`${PERFIL_API}/perfil`, {
            headers: { "Authorization": `Bearer ${perfilToken}` }
        });
        const data = await res.json();

        if (!res.ok) {
            if (res.status === 401) window.location.href = "registrarse.html";
            return;
        }

        const { nombre, email, creadoEn, pedidos } = data;
        const iniciales = nombre.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

        document.getElementById("avatar-iniciales").textContent = iniciales;
        document.getElementById("perfil-nombre").textContent    = nombre;
        document.getElementById("perfil-email").textContent     = email;
        document.getElementById("input-nombre").value           = nombre;
        document.getElementById("input-email").value            = email;
        document.getElementById("input-fecha").value            = new Date(creadoEn).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
        document.getElementById("input-pedidos").value          = `${pedidos?.length || 0} pedidos`;

        document.getElementById("modal-nombre").value = nombre;
        document.getElementById("modal-email").value  = email;

    } catch (err) {
        console.error("Error cargando perfil:", err);
    }
}


// ─── CARGAR PEDIDOS ─────────────────────────
async function cargarPedidos() {
    const lista = document.getElementById("pedidos-lista");
    try {
        const res  = await fetch(`${PERFIL_API}/pedidos`, {
            headers: { "Authorization": `Bearer ${perfilToken}` }
        });
        const data = await res.json();

        if (!res.ok || data.length === 0) {
            lista.innerHTML = `<div class="vacio">🛍️ <p>Aún no has realizado pedidos.</p></div>`;
            return;
        }

        lista.innerHTML = data.map(p => {
            const fecha  = new Date(p.fecha).toLocaleDateString("es-CO", { year:"numeric", month:"short", day:"numeric" });
            const items  = p.items.map(i => `<span class="pedido-item-chip">${i.nombre} x${i.cantidad}</span>`).join("");
            const total  = p.items.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
            const envio  = p.envio ? `
                <div style="margin-top:0.5rem;font-size:0.83rem;color:#666;line-height:1.6;">
                    📍 ${p.envio.direccion}, ${p.envio.ciudad}, ${p.envio.departamento}<br>
                    👤 ${p.envio.nombre} — 📞 ${p.envio.telefono}<br>
                    💳 ${p.metodoPago || "—"}
                    ${p.notas ? `<br>📝 ${p.notas}` : ""}
                </div>` : "";
            
            // Mostrar botón de reseña solo si el pedido está entregado
            const btnResena = p.estado === "entregado" ? `
                <button class="btn-escribir-resena" onclick="abrirResenasDelPedido('${p._id}')" style="margin-left:8px;background:#22c55e;color:white;">
                    ⭐ Escribir reseña
                </button>` : "";
            
            return `
                <div class="pedido-card">
                    <div class="pedido-header">
                        <span class="pedido-id">Pedido #${p._id.toString().slice(-6).toUpperCase()}</span>
                        <span class="pedido-fecha">${fecha}</span>
                        <span class="pedido-estado ${p.estado}">${p.estado}</span>
                    </div>
                    <div class="pedido-items">${items}</div>
                    ${envio}
                    <p class="pedido-total" style="margin-top:0.75rem;">Total: $${total.toLocaleString("es-CO")}</p>
                    <div style="display:flex;gap:8px;margin-top:0.75rem;">
                        <button class="btn-ver-seguimiento" onclick="abrirSeguimiento('${p._id}')">
                            📦 Ver seguimiento
                        </button>
                        ${btnResena}
                    </div>
                </div>`;
        }).join("");

    } catch (err) {
        lista.innerHTML = `<div class="vacio">❌ <p>Error al cargar pedidos.</p></div>`;
    }
}


// ─── SEGUIMIENTO DE PEDIDO ───────────────────
window.abrirSeguimiento = async function(pedidoId) {
    const overlay = document.getElementById("seguimiento-overlay");
    if (!overlay) return;

    overlay.querySelector(".seguimiento-body").innerHTML =
        `<p style="text-align:center;color:#aaa;padding:2rem;">Cargando...</p>`;
    overlay.classList.add("abierto");

    try {
        const res    = await fetch(`${PERFIL_API}/pedidos/${pedidoId}`, {
            headers: { "Authorization": `Bearer ${perfilToken}` }
        });
        const pedido = await res.json();
        if (!res.ok) throw new Error(pedido.error);

        const fecha  = new Date(pedido.fecha).toLocaleDateString("es-CO", { year:"numeric", month:"long", day:"numeric" });
        const total  = pedido.items.reduce((a, i) => a + i.precio * i.cantidad, 0);

        // Timeline
        const pasos = [
            { key:"pendiente",  icon:"🕐", label:"Pedido recibido",    desc:"Tu pedido fue confirmado" },
            { key:"enviado",    icon:"🚚", label:"En camino",           desc:"Tu pedido está siendo enviado" },
            { key:"entregado",  icon:"✅", label:"Entregado",           desc:"Tu pedido fue entregado" }
        ];
        const estados = ["pendiente","enviado","entregado"];
        const idxActual = estados.indexOf(pedido.estado);

        const timelineHTML = pasos.map((paso, i) => {
            let clase = "pendiente";
            if (i < idxActual)  clase = "completado";
            if (i === idxActual) clase = "actual completado";
            return `
            <div class="timeline-step ${clase}">
                <div class="timeline-icono">${i <= idxActual ? paso.icon : "○"}</div>
                <div class="timeline-info">
                    <h4>${paso.label}</h4>
                    <p>${i <= idxActual ? paso.desc : "Pendiente"}</p>
                </div>
            </div>`;
        }).join("");

        // Productos
        const productosHTML = pedido.items.map(item => `
            <div class="seg-producto-item">
                <img src="${item.img || 'https://picsum.photos/48/48'}" alt="${item.nombre}">
                <div class="seg-producto-info">
                    <h4>${item.nombre}</h4>
                    <p>Cantidad: ${item.cantidad}</p>
                </div>
                <span class="seg-producto-precio">$${(item.precio * item.cantidad).toLocaleString("es-CO")}</span>
            </div>`).join("");

        // Datos de envío
        const envioHTML = pedido.envio ? `
            <div class="seg-envio">
                <p class="seg-envio-titulo">📍 Datos de envío</p>
                <p>
                    <strong>${pedido.envio.nombre}</strong><br>
                    ${pedido.envio.direccion}, ${pedido.envio.ciudad}, ${pedido.envio.departamento}<br>
                    📞 ${pedido.envio.telefono}<br>
                    💳 ${pedido.metodoPago || "—"}
                    ${pedido.notas ? `<br>📝 ${pedido.notas}` : ""}
                </p>
            </div>` : "";

        // Número de guía
        const trackingHTML = `
            <div class="tracking-box">
                <label>Número de guía / Tracking</label>
                ${pedido.tracking
                    ? `<p class="tracking-num">${pedido.tracking}</p>`
                    : `<p class="tracking-vacio">Aún no hay número de guía asignado</p>`}
            </div>`;

        overlay.querySelector(".seguimiento-header h2").textContent =
            `Pedido #${pedido._id.toString().slice(-6).toUpperCase()}`;
        overlay.querySelector(".seguimiento-header p").textContent =
            `${fecha} · Total: $${total.toLocaleString("es-CO")}`;

        overlay.querySelector(".seguimiento-body").innerHTML = `
            <div class="timeline">${timelineHTML}</div>
            ${trackingHTML}
            <p style="font-size:0.78rem;font-weight:700;color:#888;text-transform:uppercase;
                letter-spacing:0.5px;margin:0 0 0.75rem;">Productos</p>
            <div class="seg-productos">${productosHTML}</div>
            ${envioHTML}`;

    } catch (err) {
        overlay.querySelector(".seguimiento-body").innerHTML =
            `<p style="text-align:center;color:#e53e3e;padding:2rem;">Error al cargar el pedido</p>`;
    }
};

function cerrarSeguimiento() {
    document.getElementById("seguimiento-overlay")?.classList.remove("abierto");
}

// ─── ABRIR RESEÑAS DEL PEDIDO ────────────────
window.abrirResenasDelPedido = async function(pedidoId) {
    try {
        const res    = await fetch(`${PERFIL_API}/pedidos/${pedidoId}`, {
            headers: { "Authorization": `Bearer ${perfilToken}` }
        });
        const pedido = await res.json();
        if (!res.ok) throw new Error(pedido.error);

        // Crear overlay para las reseñas
        let overlay = document.getElementById("resenas-pedido-overlay");
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = "resenas-pedido-overlay";
            overlay.style.cssText = `
                position:fixed;top:0;left:0;right:0;bottom:0;
                background:rgba(0,0,0,0.5);z-index:9998;
                display:flex;align-items:center;justify-content:center;
                opacity:0;pointer-events:none;transition:opacity 0.3s;
            `;
            overlay.innerHTML = `
                <div style="background:white;border-radius:12px;max-width:600px;
                    width:90%;max-height:80vh;overflow-y:auto;padding:2rem;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
                    <button onclick="cerrarResenasDelPedido()" style="position:absolute;top:1rem;right:1rem;
                        background:none;border:none;font-size:1.5rem;cursor:pointer;">✕</button>
                    <h2 style="margin:0 0 1rem;">Escribir reseñas</h2>
                    <p style="color:#666;margin:0 0 1.5rem;">Pedido #${pedido._id.toString().slice(-6).toUpperCase()}</p>
                    <div id="resenas-productos-container"></div>
                </div>
            `;
            document.body.appendChild(overlay);
        }

        // Generar HTML para cada producto
        const productosHTML = pedido.items.map((item, idx) => `
            <div style="padding:1rem;border:1px solid #eee;border-radius:8px;margin-bottom:1rem;">
                <h4 style="margin:0 0 0.75rem;">${item.nombre}</h4>
                <div style="display:flex;gap:1rem;align-items:center;margin-bottom:1rem;">
                    <img src="${item.img || 'https://picsum.photos/80/80'}" alt="${item.nombre}" 
                        style="width:60px;height:60px;border-radius:6px;object-fit:cover;">
                    <div style="font-size:0.9rem;color:#666;">
                        Cantidad: ${item.cantidad} × $${item.precio.toLocaleString("es-CO")} = 
                        $${(item.cantidad * item.precio).toLocaleString("es-CO")}
                    </div>
                </div>
                
                <div style="margin-bottom:0.75rem;">
                    <p style="font-size:0.85rem;font-weight:700;margin:0 0 0.5rem;color:#999;">PUNTUACIÓN</p>
                    <div class="estrellas-selector" data-idx="${idx}" style="display:flex;gap:4px;">
                        ${[1,2,3,4,5].map(n => `
                            <button onclick="seleccionarEstrella(${idx}, ${n})" data-val="${n}"
                                style="background:none;border:none;font-size:1.5rem;cursor:pointer;
                                color:#ddd;transition:color 0.2s;padding:0;line-height:1;"
                                class="estrella-btn">★</button>
                        `).join('')}
                    </div>
                </div>
                
                <textarea id="comentario-${idx}" placeholder="Cuéntanos tu experiencia con este producto..."
                    style="width:100%;border:1px solid #e0e0e0;border-radius:8px;padding:0.75rem;
                    font-family:inherit;font-size:0.9rem;outline:none;resize:vertical;min-height:80px;
                    box-sizing:border-box;"></textarea>
            </div>
        `).join('');

        document.getElementById("resenas-productos-container").innerHTML = productosHTML + `
            <button onclick="enviarTtodasLasResenas('${pedidoId}')" style="width:100%;
                background:#111;color:white;border:none;border-radius:8px;padding:0.75rem;
                font-size:1rem;font-weight:700;cursor:pointer;">
                📤 Enviar reseñas
            </button>
        `;

        overlay.style.opacity = "1";
        overlay.style.pointerEvents = "auto";

        // Almacenar datos del pedido para usarlos al enviar
        window.pedidoActualResenas = pedido;

    } catch (err) {
        console.error('❌ Error abriendo reseñas:', err);
        alert('Error al cargar el pedido');
    }
};

function cerrarResenasDelPedido() {
    const overlay = document.getElementById("resenas-pedido-overlay");
    if (overlay) {
        overlay.style.opacity = "0";
        overlay.style.pointerEvents = "none";
    }
}

// Almacenar estrellas seleccionadas globalmente
window.resenasData = {};

window.seleccionarEstrella = function(idx, valor) {
    document.querySelectorAll(`.estrellas-selector[data-idx="${idx}"] .estrella-btn`).forEach((btn, i) => {
        btn.style.color = i < valor ? '#ffb800' : '#ddd';
    });
    window.resenasData[idx] = { estrellas: valor };
    console.log(`⭐ Producto ${idx}: ${valor} estrellas`);
};

window.enviarTtodasLasResenas = async function(pedidoId) {
    const pedido = window.pedidoActualResenas;
    const API = 'http://localhost:3000/api';
    const token = localStorage.getItem('token');

    if (!token) {
        alert('Debes estar autenticado');
        return;
    }

    let resenasEnviadas = 0;
    let errores = [];

    for (let idx = 0; idx < pedido.items.length; idx++) {
        const estrellas = window.resenasData[idx]?.estrellas || 0;
        const comentario = document.getElementById(`comentario-${idx}`)?.value.trim() || '';

        console.log(`📝 Producto ${idx}: ${estrellas} estrellas, comentario: "${comentario.substring(0, 30)}..."`);

        if (!estrellas || !comentario) {
            alert(`❌ Completa la reseña del producto ${idx + 1}`);
            return;
        }

        try {
            const payload = {
                productoNombre: pedido.items[idx].nombre,
                estrellas,
                comentario
            };
            
            console.log(`📤 Enviando reseña:`, payload);
            
            const res = await fetch(`${API}/resenas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const respuesta = await res.json();
            console.log(`Respuesta del servidor:`, respuesta);

            if (res.ok) {
                resenasEnviadas++;
                console.log(`✅ Reseña ${idx + 1} enviada`);
            } else {
                errores.push(`Producto ${idx + 1}: ${respuesta.error}`);
                console.error(`❌ Error en reseña ${idx + 1}:`, respuesta.error);
            }
        } catch (err) {
            errores.push(`Producto ${idx + 1}: Error de conexión`);
            console.error(`❌ Error enviando reseña ${idx + 1}:`, err);
        }
    }

    if (errores.length > 0) {
        alert(`⚠️ ${resenasEnviadas}/${pedido.items.length} reseñas guardadas\n\nErrores:\n${errores.join('\n')}`);
    } else {
        alert(`✅ ${resenasEnviadas}/${pedido.items.length} reseñas guardadas correctamente`);
    }
    
    cerrarResenasDelPedido();
    cargarPedidos();
};


// ─── CARGAR DIRECCIONES ─────────────────────
async function cargarDirecciones() {
    const grid = document.getElementById("direcciones-grid");
    try {
        const res  = await fetch(`${PERFIL_API}/direcciones`, {
            headers: { "Authorization": `Bearer ${perfilToken}` }
        });
        const data = await res.json();

        if (!res.ok || data.length === 0) {
            grid.innerHTML = `<div class="vacio">📍 <p>No tienes direcciones guardadas.</p></div>`;
            return;
        }

        grid.innerHTML = data.map((d, i) => `
            <div class="direccion-card ${i === 0 ? 'principal' : ''}">
                ${i === 0 ? '<span class="badge-principal">Principal</span>' : ""}
                <h4>${d.nombre}</h4>
                <p>${d.destinatario}<br>${d.calle}<br>${d.ciudad}, ${d.departamento}<br>📞 ${d.telefono}</p>
                <div class="direccion-acciones">
                    <button class="btn-dir eliminar" onclick="eliminarDireccion('${d._id}')">Eliminar</button>
                </div>
            </div>
        `).join("");

    } catch (err) {
        grid.innerHTML = `<div class="vacio">❌ <p>Error al cargar direcciones.</p></div>`;
    }
}


// ─── AGREGAR DIRECCIÓN ──────────────────────
document.getElementById("btn-agregar-dir").addEventListener("click", async () => {
    const msg    = document.getElementById("dir-msg");
    const nueva  = {
        nombre:       document.getElementById("dir-nombre").value.trim(),
        destinatario: document.getElementById("dir-destinatario").value.trim(),
        calle:        document.getElementById("dir-calle").value.trim(),
        ciudad:       document.getElementById("dir-ciudad").value.trim(),
        departamento: document.getElementById("dir-departamento").value.trim(),
        telefono:     document.getElementById("dir-telefono").value.trim(),
    };

    if (!nueva.nombre || !nueva.calle || !nueva.ciudad) {
        msg.style.color = "red";
        msg.textContent = "Nombre, dirección y ciudad son obligatorios";
        return;
    }

    try {
        const res  = await fetch(`${PERFIL_API}/direcciones`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${perfilToken}` },
            body: JSON.stringify(nueva)
        });
        const data = await res.json();

        if (!res.ok) {
            msg.style.color = "red";
            msg.textContent = data.error || "Error al guardar";
            return;
        }

        msg.style.color = "green";
        msg.textContent = "¡Dirección guardada! ✅";
        ["dir-nombre","dir-destinatario","dir-calle","dir-ciudad","dir-departamento","dir-telefono"]
            .forEach(id => document.getElementById(id).value = "");
        cargarDirecciones();

    } catch (err) {
        msg.style.color = "red";
        msg.textContent = "No se pudo conectar con el servidor";
    }
});


// ─── ELIMINAR DIRECCIÓN ─────────────────────
window.eliminarDireccion = async function(id) {
    if (!confirm("¿Eliminar esta dirección?")) return;
    try {
        await fetch(`${PERFIL_API}/direcciones/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${perfilToken}` }
        });
        cargarDirecciones();
    } catch (err) {
        alert("Error al eliminar");
    }
};


// ─── CARGAR FAVORITOS ───────────────────────
async function cargarFavoritos() {
    const grid = document.getElementById("favoritos-grid");
    try {
        const res  = await fetch(`${PERFIL_API}/favoritos`, {
            headers: { "Authorization": `Bearer ${perfilToken}` }
        });
        const data = await res.json();

        if (!res.ok || data.length === 0) {
            grid.innerHTML = `<div class="vacio">❤️ <p>Aún no tienes productos favoritos.</p></div>`;
            return;
        }

        grid.innerHTML = data.map(p => `
            <div class="favorito-card">
                <img src="${p.imagen_front}" alt="${p.nombre}">
                <button class="btn-quitar-fav" onclick="quitarFavorito('${p._id}')">✕</button>
                <div class="favorito-info">
                    <h4>${p.nombre}</h4>
                    <p class="precio">$${p.precio.toLocaleString("es-CO")}</p>
                    <button class="btn-carrito-fav" onclick="agregarAlCarrito('${p.nombre}', ${p.precio}, '${p.imagen_front}')">🛒 Agregar</button>
                </div>
            </div>
        `).join("");

    } catch (err) {
        grid.innerHTML = `<div class="vacio">❌ <p>Error al cargar favoritos.</p></div>`;
    }
}


// ─── QUITAR FAVORITO ────────────────────────
window.quitarFavorito = async function(id) {
    try {
        await fetch(`${PERFIL_API}/favoritos/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${perfilToken}` }
        });
        cargarFavoritos();
    } catch (err) {
        alert("Error al quitar favorito");
    }
};


// ─── AGREGAR AL CARRITO DESDE FAVORITOS ─────
window.agregarAlCarrito = function(nombre, precio, img) {
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const existe = carrito.find(p => p.nombre === nombre);
    if (existe) {
        existe.cantidad++;
    } else {
        carrito.push({ nombre, precio, img, cantidad: 1 });
    }
    localStorage.setItem("carrito", JSON.stringify(carrito));
    alert(`"${nombre}" agregado al carrito ✅`);
};


// ─── MODAL EDITAR PERFIL ────────────────────
document.getElementById("btn-abrir-modal").addEventListener("click", () => {
    document.getElementById("modal-editar").classList.add("abierto");
    document.getElementById("modal-error").textContent    = "";
    document.getElementById("modal-pass-actual").value    = "";
    document.getElementById("modal-pass-nueva").value     = "";
});

document.getElementById("btn-cerrar-modal").addEventListener("click", () => {
    document.getElementById("modal-editar").classList.remove("abierto");
});

document.getElementById("btn-guardar-modal").addEventListener("click", async () => {
    const nombre     = document.getElementById("modal-nombre").value.trim();
    const email      = document.getElementById("modal-email").value.trim();
    const passActual = document.getElementById("modal-pass-actual").value;
    const passNueva  = document.getElementById("modal-pass-nueva").value;
    const errorEl    = document.getElementById("modal-error");

    if (!nombre || !email || !passActual) {
        errorEl.textContent = "Nombre, email y contraseña actual son obligatorios";
        return;
    }

    try {
        const res  = await fetch(`${PERFIL_API}/perfil`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${perfilToken}` },
            body: JSON.stringify({ nombre, email, passwordActual: passActual, passwordNueva: passNueva || null })
        });
        const data = await res.json();

        if (!res.ok) {
            errorEl.textContent = data.error || "Error al actualizar";
            return;
        }

        localStorage.setItem("nombre", nombre);
        document.getElementById("modal-editar").classList.remove("abierto");
        cargarPerfil();
        document.getElementById("datos-msg").textContent = "¡Perfil actualizado correctamente! ✅";

    } catch (err) {
        errorEl.textContent = "No se pudo conectar con el servidor";
    }
});

document.getElementById("modal-editar").addEventListener("click", function(e) {
    if (e.target === this) this.classList.remove("abierto");
});


// ─── INICIALIZAR ────────────────────────────
cargarPerfil();
cargarPedidos();
cargarDirecciones();
cargarFavoritos();