// =============================================
// carrito-add.js — Carrito sincronizado con MongoDB
// =============================================

const CARRITO_SYNC_API = "http://localhost:3000/api";

// ─── SINCRONIZAR CARRITO CON MONGODB ────────
async function sincronizarCarrito(items) {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        console.log("📤 Sincronizando carrito:", items);
        await fetch(`${CARRITO_SYNC_API}/carrito`, {
            method: "PUT",
            headers: {
                "Content-Type":  "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ items })
        });
        console.log("✅ Carrito sincronizado");
    } catch (err) {
        console.warn("❌ No se pudo sincronizar carrito:", err);
    }
}

// ─── AGREGAR AL CARRITO ──────────────────────
function agregarCarrito(btn) {
    const producto = btn.closest(".producto-card") || btn.closest(".producto");
    if (!producto) return;

    // Solo abrir modal, no agregar al carrito
    const prodId = producto.getAttribute('data-id');
    if (prodId && typeof abrirDetalle === 'function') {
        console.log("🔍 Abriendo modal del producto:", prodId);
        abrirDetalle(prodId);
    }
}

// ─── CARGAR CARRITO DESDE MONGODB (SOLO UNA VEZ AL INICIAR) ────────────────────────
async function cargarCarritoDesdeDB() {
    const token = localStorage.getItem("token");
    if (!token) {
        console.log("⚠️ No hay token, usando carrito local vacío");
        return;
    }

    const carritoLocal = localStorage.getItem("carrito");
    
    // Si ya hay carrito en localStorage, NO cargar de BD
    if (carritoLocal) {
        console.log("📦 Carrito local ya existe, NO cargando de BD");
        return;
    }

    try {
        console.log("🔄 Cargando carrito de BD...");
        const res   = await fetch(`${CARRITO_SYNC_API}/carrito`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const items = await res.json();

        if (!res.ok || !Array.isArray(items) || items.length === 0) {
            console.log("📭 No hay carrito en BD");
            return;
        }

        console.log("📥 Carrito cargado de BD:", items);
        localStorage.setItem("carrito", JSON.stringify(items));

    } catch (err) {
        console.warn("❌ Error cargando carrito de BD:", err);
    }
}

// ─── EVENT LISTENERS ─────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    cargarCarritoDesdeDB();

    document.querySelectorAll(".cart-btn").forEach(btn => {
        if (!btn.onclick) {
            btn.addEventListener("click", function() {
                agregarCarrito(this);
            });
        }
    });
});