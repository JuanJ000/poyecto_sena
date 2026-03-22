document.addEventListener("DOMContentLoaded", () => {

    const contenedor    = document.getElementById("carrito-items");
    const totalElemento = document.getElementById("total");
    const btnCheckout   = document.querySelector(".btn-checkout");
    const CARRITO_API   = "http://localhost:3000/api";

    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

    // ─── INYECTAR MODAL EN EL DOM ────────────
    const modalHTML = `
    <div id="modal-checkout" style="
        display:none; position:fixed; inset:0;
        background:rgba(0,0,0,0.5); z-index:9999;
        align-items:center; justify-content:center;">

        <div id="modal-checkout-box" style="
            background:#fff; border-radius:16px;
            padding:2rem; width:90%; max-width:540px;
            max-height:90vh; overflow-y:auto;
            box-shadow:0 8px 32px rgba(0,0,0,0.18);">

            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
                <h2 style="margin:0; font-size:1.2rem;">Finalizar pedido</h2>
                <button id="cerrar-checkout" style="
                    background:none; border:none; font-size:1.4rem;
                    cursor:pointer; color:#888; line-height:1;">✕</button>
            </div>

            <!-- Resumen productos -->
            <div id="checkout-resumen" style="
                background:#f9f9f9; border-radius:10px;
                padding:0.75rem 1rem; margin-bottom:1.25rem;
                font-size:0.88rem; color:#555; line-height:1.7;">
            </div>

            <!-- Sección dirección: se llena dinámicamente -->
            <div id="checkout-dir-seccion"></div>

            <!-- Datos comunes -->
            <div style="display:flex; flex-direction:column; gap:0.75rem; margin-top:0.75rem;">

                <div>
                    <label style="font-size:0.78rem; color:#999; display:block; margin-bottom:4px;">MÉTODO DE PAGO</label>
                    <select id="co-pago" style="
                        width:100%; box-sizing:border-box; border:1px solid #e0e0e0;
                        border-radius:8px; padding:0.6rem 0.9rem; font-size:0.92rem;
                        outline:none; background:#fff; cursor:pointer;">
                        <option value="">Selecciona un método</option>
                        <option value="Contra entrega">Contra entrega</option>
                        <option value="Transferencia bancaria">Transferencia bancaria</option>
                        <option value="Nequi">Nequi</option>
                        <option value="Daviplata">Daviplata</option>
                        <option value="Tarjeta crédito / débito">Tarjeta crédito / débito</option>
                    </select>
                </div>

                <div>
                    <label style="font-size:0.78rem; color:#999; display:block; margin-bottom:4px;">NOTAS / INSTRUCCIONES (opcional)</label>
                    <textarea id="co-notas" placeholder="Ej: Dejar en portería, llamar antes de entregar..." style="
                        width:100%; box-sizing:border-box; border:1px solid #e0e0e0;
                        border-radius:8px; padding:0.6rem 0.9rem; font-size:0.92rem;
                        outline:none; resize:vertical; min-height:68px; font-family:inherit;"></textarea>
                </div>

                <p id="co-error" style="color:#dc2626; font-size:0.88rem; margin:0; min-height:1.2em;"></p>

                <button id="btn-confirmar-pedido" style="
                    background:#111; color:#fff; border:none; padding:0.85rem;
                    border-radius:8px; font-size:1rem; cursor:pointer; width:100%;
                    transition:background 0.2s;">
                    Confirmar pedido
                </button>
            </div>

        </div>
    </div>`;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
    const modalCheckout = document.getElementById("modal-checkout");


    // ─── FORMULARIO NUEVA DIRECCIÓN (HTML) ───
    function htmlFormNuevaDireccion(preNombre = "") {
        return `
        <div id="form-nueva-dir" style="display:flex; flex-direction:column; gap:0.75rem;">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
                <div>
                    <label style="font-size:0.78rem;color:#999;display:block;margin-bottom:4px;">NOMBRE COMPLETO</label>
                    <input id="co-nombre" type="text" value="${preNombre}" placeholder="Tu nombre completo" style="
                        width:100%;box-sizing:border-box;border:1px solid #e0e0e0;
                        border-radius:8px;padding:0.6rem 0.9rem;font-size:0.92rem;outline:none;">
                </div>
                <div>
                    <label style="font-size:0.78rem;color:#999;display:block;margin-bottom:4px;">TELÉFONO</label>
                    <input id="co-telefono" type="tel" placeholder="+57 300 000 0000" style="
                        width:100%;box-sizing:border-box;border:1px solid #e0e0e0;
                        border-radius:8px;padding:0.6rem 0.9rem;font-size:0.92rem;outline:none;">
                </div>
            </div>
            <div>
                <label style="font-size:0.78rem;color:#999;display:block;margin-bottom:4px;">DIRECCIÓN</label>
                <input id="co-direccion" type="text" placeholder="Calle, número, barrio" style="
                    width:100%;box-sizing:border-box;border:1px solid #e0e0e0;
                    border-radius:8px;padding:0.6rem 0.9rem;font-size:0.92rem;outline:none;">
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
                <div>
                    <label style="font-size:0.78rem;color:#999;display:block;margin-bottom:4px;">CIUDAD</label>
                    <input id="co-ciudad" type="text" placeholder="Ciudad" style="
                        width:100%;box-sizing:border-box;border:1px solid #e0e0e0;
                        border-radius:8px;padding:0.6rem 0.9rem;font-size:0.92rem;outline:none;">
                </div>
                <div>
                    <label style="font-size:0.78rem;color:#999;display:block;margin-bottom:4px;">DEPARTAMENTO</label>
                    <input id="co-departamento" type="text" placeholder="Departamento" style="
                        width:100%;box-sizing:border-box;border:1px solid #e0e0e0;
                        border-radius:8px;padding:0.6rem 0.9rem;font-size:0.92rem;outline:none;">
                </div>
            </div>
            <label style="display:flex;align-items:center;gap:8px;font-size:0.88rem;color:#555;cursor:pointer;">
                <input type="checkbox" id="co-guardar-dir" checked style="width:16px;height:16px;">
                Guardar esta dirección en mi perfil
            </label>
        </div>`;
    }


    // ─── SECCIÓN DIRECCIÓN CON GUARDADAS ─────
    function renderSeccionDireccion(direcciones, preNombre) {
        const seccion = document.getElementById("checkout-dir-seccion");

        if (direcciones.length === 0) {
            // Sin direcciones guardadas: mostrar formulario directo
            seccion.innerHTML = `
                <p style="font-size:0.88rem;color:#888;margin:0 0 0.75rem;">
                    📦 <strong>Dirección de envío</strong>
                </p>
                ${htmlFormNuevaDireccion(preNombre)}`;
            return;
        }

        // Con direcciones guardadas
        const opcionesHTML = direcciones.map((d, i) => `
            <label id="label-dir-${i}" style="
                display:block; border:2px solid ${i === 0 ? '#111' : '#e0e0e0'};
                border-radius:10px; padding:0.85rem 1rem; cursor:pointer;
                margin-bottom:0.5rem; transition:border 0.15s;">
                <input type="radio" name="dir-guardada" value="${i}"
                    ${i === 0 ? 'checked' : ''} style="margin-right:8px;">
                <strong style="font-size:0.9rem;">${d.nombre}</strong>
                <span style="font-size:0.82rem;color:#777;display:block;margin-top:2px;margin-left:20px;">
                    ${d.destinatario ? d.destinatario + ' — ' : ''}${d.calle}, ${d.ciudad}, ${d.departamento}
                    ${d.telefono ? ' — 📞 ' + d.telefono : ''}
                </span>
            </label>`).join("");

        seccion.innerHTML = `
            <p style="font-size:0.88rem;font-weight:600;color:#111;margin:0 0 0.75rem;">
                📦 Dirección de envío
            </p>
            <div id="opciones-dir">
                ${opcionesHTML}
                <label id="label-dir-nueva" style="
                    display:block; border:2px solid #e0e0e0;
                    border-radius:10px; padding:0.85rem 1rem; cursor:pointer;
                    margin-bottom:0.75rem; transition:border 0.15s;">
                    <input type="radio" name="dir-guardada" value="nueva" style="margin-right:8px;">
                    <strong style="font-size:0.9rem;">+ Usar una dirección diferente</strong>
                </label>
            </div>
            <div id="nueva-dir-container" style="display:none;">
                ${htmlFormNuevaDireccion(preNombre)}
            </div>`;

        // Resaltar selección y mostrar/ocultar formulario
        document.querySelectorAll("input[name='dir-guardada']").forEach((radio, idx) => {
            radio.addEventListener("change", () => {
                // Resetear bordes
                direcciones.forEach((_, i) => {
                    const lbl = document.getElementById(`label-dir-${i}`);
                    if (lbl) lbl.style.border = "2px solid #e0e0e0";
                });
                document.getElementById("label-dir-nueva").style.border = "2px solid #e0e0e0";

                if (radio.value === "nueva") {
                    document.getElementById("label-dir-nueva").style.border = "2px solid #111";
                    document.getElementById("nueva-dir-container").style.display = "block";
                } else {
                    document.getElementById(`label-dir-${radio.value}`).style.border = "2px solid #111";
                    document.getElementById("nueva-dir-container").style.display = "none";
                }
            });
        });
    }


    // ─── RENDERIZAR CARRITO ──────────────────
    function renderCarrito() {
        contenedor.innerHTML = "";
        let total = 0;

        if (carrito.length === 0) {
            contenedor.innerHTML = `
                <div style="text-align:center;padding:3rem;color:#aaa;">
                    <p style="font-size:2rem;">🛒</p>
                    <p>Tu carrito está vacío</p>
                    <a href="productos.html" style="color:#111;font-weight:600;">Ver productos</a>
                </div>`;
            totalElemento.textContent = "$0";
            return;
        }

        carrito.forEach((producto, index) => {
            total += producto.precio * producto.cantidad;
            contenedor.innerHTML += `
                <div class="carrito-item">
                    <img src="${producto.img}" alt="${producto.nombre}">
                    <div class="carrito-info">
                        <h3>${producto.nombre}</h3>
                        <p>$${producto.precio.toLocaleString("es-CO")}</p>
                        <div class="cantidad">
                            <button onclick="cambiarCantidad(${index}, -1)">-</button>
                            <span>${producto.cantidad}</span>
                            <button onclick="cambiarCantidad(${index}, 1)">+</button>
                        </div>
                        <button onclick="eliminarProducto(${index})">Eliminar</button>
                    </div>
                </div>`;
        });

        totalElemento.textContent = "$" + total.toLocaleString("es-CO");
    }

    window.cambiarCantidad = function(index, cambio) {
        carrito[index].cantidad += cambio;
        if (carrito[index].cantidad <= 0) carrito.splice(index, 1);
        localStorage.setItem("carrito", JSON.stringify(carrito));
        renderCarrito();
    };

    window.eliminarProducto = function(index) {
        carrito.splice(index, 1);
        localStorage.setItem("carrito", JSON.stringify(carrito));
        renderCarrito();
    };


    // ─── ABRIR MODAL CHECKOUT ────────────────
    if (btnCheckout) {
        btnCheckout.addEventListener("click", async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                if (confirm("Debes iniciar sesión para finalizar la compra. ¿Ir a iniciar sesión?")) {
                    window.location.href = "registrarse.html";
                }
                return;
            }

            if (carrito.length === 0) {
                alert("Tu carrito está vacío");
                return;
            }

            // Resumen de productos
            const total = carrito.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
            document.getElementById("checkout-resumen").innerHTML = `
                <strong style="color:#111;">Resumen del pedido</strong><br><br>
                ${carrito.map(p => `• ${p.nombre} x${p.cantidad} — $${(p.precio * p.cantidad).toLocaleString("es-CO")}`).join("<br>")}
                <br><br><strong style="color:#111;">Total: $${total.toLocaleString("es-CO")}</strong>`;

            // Limpiar campos comunes
            document.getElementById("co-pago").value  = "";
            document.getElementById("co-notas").value = "";
            document.getElementById("co-error").textContent = "";
            document.getElementById("btn-confirmar-pedido").disabled    = false;
            document.getElementById("btn-confirmar-pedido").textContent = "Confirmar pedido";

            const preNombre = localStorage.getItem("nombre") || "";

            // Cargar direcciones guardadas
            try {
                const res  = await fetch(`${CARRITO_API}/direcciones`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const dirs = res.ok ? await res.json() : [];
                renderSeccionDireccion(dirs, preNombre);
            } catch {
                renderSeccionDireccion([], preNombre);
            }

            modalCheckout.style.display = "flex";
        });
    }


    // ─── CERRAR MODAL ────────────────────────
    document.getElementById("cerrar-checkout").addEventListener("click", () => {
        modalCheckout.style.display = "none";
    });
    modalCheckout.addEventListener("click", function(e) {
        if (e.target === this) this.style.display = "none";
    });


    // ─── CONFIRMAR PEDIDO ────────────────────
    document.getElementById("btn-confirmar-pedido").addEventListener("click", async () => {
        const token      = localStorage.getItem("token");
        const pago       = document.getElementById("co-pago").value;
        const notas      = document.getElementById("co-notas").value.trim();
        const errorEl    = document.getElementById("co-error");
        const btnConfirmar = document.getElementById("btn-confirmar-pedido");

        errorEl.textContent = "";

        if (!pago) {
            errorEl.textContent = "Selecciona un método de pago";
            return;
        }

        // ── Obtener datos de dirección ──
        let envio        = null;
        let guardarDir   = false;
        const radioSel   = document.querySelector("input[name='dir-guardada']:checked");

        if (radioSel && radioSel.value !== "nueva") {
            // Usar dirección guardada
            const res   = await fetch(`${CARRITO_API}/direcciones`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const dirs  = await res.json();
            const d     = dirs[parseInt(radioSel.value)];
            envio = {
                nombre:       d.destinatario || d.nombre,
                telefono:     d.telefono     || "",
                direccion:    d.calle,
                ciudad:       d.ciudad,
                departamento: d.departamento
            };
        } else {
            // Usar formulario nuevo
            const nombre       = document.getElementById("co-nombre")?.value.trim();
            const telefono     = document.getElementById("co-telefono")?.value.trim();
            const direccion    = document.getElementById("co-direccion")?.value.trim();
            const ciudad       = document.getElementById("co-ciudad")?.value.trim();
            const departamento = document.getElementById("co-departamento")?.value.trim();
            guardarDir         = document.getElementById("co-guardar-dir")?.checked;

            if (!nombre || !telefono || !direccion || !ciudad || !departamento) {
                errorEl.textContent = "Completa todos los campos de la dirección";
                return;
            }

            envio = { nombre, telefono, direccion, ciudad, departamento };
        }

        btnConfirmar.disabled    = true;
        btnConfirmar.textContent = "Procesando...";

        try {
            // Guardar dirección nueva en el perfil si el usuario lo pidió
            if (guardarDir && envio) {
                await fetch(`${CARRITO_API}/direcciones`, {
                    method: "POST",
                    headers: {
                        "Content-Type":  "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        nombre:       "Envío",
                        destinatario: envio.nombre,
                        calle:        envio.direccion,
                        ciudad:       envio.ciudad,
                        departamento: envio.departamento,
                        telefono:     envio.telefono
                    })
                });
            }

            // Crear el pedido
            const res  = await fetch(`${CARRITO_API}/pedidos`, {
                method: "POST",
                headers: {
                    "Content-Type":  "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ items: carrito, envio, metodoPago: pago, notas })
            });

            const data = await res.json();

            if (!res.ok) {
                errorEl.textContent      = data.error || "Error al procesar el pedido";
                btnConfirmar.disabled    = false;
                btnConfirmar.textContent = "Confirmar pedido";
                return;
            }

            // Limpiar carrito en localStorage y en MongoDB
            // (pedido creado = compra finalizada, el carrito ya no sirve)
            localStorage.removeItem("carrito");
            try {
                await fetch(`${CARRITO_API}/carrito`, {
                    method: "DELETE",
                    headers: { "Authorization": `Bearer ${token}` }
                });
            } catch (e) {}
            carrito = [];
            renderCarrito();

            // Pantalla de éxito
            document.getElementById("modal-checkout-box").innerHTML = `
                <div style="text-align:center; padding:1rem;">
                    <p style="font-size:3rem; margin:0;">🎉</p>
                    <h2 style="margin:1rem 0 0.5rem;">¡Pedido confirmado!</h2>
                    <p style="color:#555; font-size:0.95rem;">
                        Tu pedido fue registrado correctamente.<br>
                        Puedes ver su estado en <strong>Mi Perfil → Pedidos</strong>.
                    </p>
                    <div style="background:#f0fdf4;border-radius:10px;padding:1rem;margin:1rem 0;font-size:0.88rem;color:#166534;text-align:left;line-height:1.7;">
                        <strong>👤 Envío a:</strong> ${envio.nombre}<br>
                        <strong>📍 Dirección:</strong> ${envio.direccion}, ${envio.ciudad}, ${envio.departamento}<br>
                        <strong>📞 Teléfono:</strong> ${envio.telefono}<br>
                        <strong>💳 Pago:</strong> ${pago}
                        ${notas ? `<br><strong>📝 Notas:</strong> ${notas}` : ""}
                        ${guardarDir ? `<br>✅ Dirección guardada en tu perfil` : ""}
                    </div>
                    <div style="display:flex;gap:0.75rem;justify-content:center;margin-top:1rem;">
                        <button onclick="document.getElementById('modal-checkout').style.display='none'"
                            style="background:none;border:1px solid #ddd;padding:0.6rem 1.2rem;border-radius:8px;cursor:pointer;">
                            Cerrar
                        </button>
                        <button onclick="window.location.href='perfil.html'"
                            style="background:#111;color:#fff;border:none;padding:0.6rem 1.4rem;border-radius:8px;cursor:pointer;">
                            Ver mis pedidos
                        </button>
                    </div>
                </div>`;

        } catch (err) {
            errorEl.textContent      = "No se pudo conectar con el servidor. ¿Está corriendo?";
            btnConfirmar.disabled    = false;
            btnConfirmar.textContent = "Confirmar pedido";
        }
    });


    // ─── INICIALIZAR ─────────────────────────
    renderCarrito();

});