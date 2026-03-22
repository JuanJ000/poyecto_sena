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
            const fecha = new Date(p.fecha).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" });
            const items = p.items.map(i => `<span class="pedido-item-chip">${i.nombre} x${i.cantidad}</span>`).join("");
            const total = p.items.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
            const envio = p.envio ? `
                <div style="margin-top:0.5rem; font-size:0.83rem; color:#666; line-height:1.6;">
                    📍 ${p.envio.direccion}, ${p.envio.ciudad}, ${p.envio.departamento}<br>
                    👤 ${p.envio.nombre} — 📞 ${p.envio.telefono}<br>
                    💳 ${p.metodoPago || "—"}
                    ${p.notas ? `<br>📝 ${p.notas}` : ""}
                </div>` : "";
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
                </div>
            `;
        }).join("");

    } catch (err) {
        lista.innerHTML = `<div class="vacio">❌ <p>Error al cargar pedidos.</p></div>`;
    }
}


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