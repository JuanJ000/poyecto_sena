// =============================================
// carrito-add.js — Carrito sincronizado con MongoDB
// =============================================

const CARRITO_SYNC_API = "http://localhost:3000/api";

// ─── SINCRONIZAR CARRITO CON MONGODB ────────
async function sincronizarCarrito(items) {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        await fetch(`${CARRITO_SYNC_API}/carrito`, {
            method: "PUT",
            headers: {
                "Content-Type":  "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ items })
        });
    } catch (err) {
        console.warn("No se pudo sincronizar carrito:", err);
    }
}

// ─── AGREGAR AL CARRITO ──────────────────────
function agregarCarrito(btn) {
    const producto = btn.closest(".producto-card") || btn.closest(".producto");
    if (!producto) return;

    const nombre = producto.querySelector("h3").textContent;
    const precio = parseInt(
        producto.querySelector(".precio").textContent.replace(/\D/g, "")
    );
    const imgEl = producto.querySelector(".img-front") || producto.querySelector("img");
    const img   = imgEl ? imgEl.src : "";

    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const existe = carrito.find(p => p.nombre === nombre);

    if (existe) {
        existe.cantidad++;
    } else {
        carrito.push({ nombre, precio, img, cantidad: 1 });
    }

    localStorage.setItem("carrito", JSON.stringify(carrito));
    sincronizarCarrito(carrito);

    // Feedback visual
    const textoOriginal = btn.textContent;
    btn.textContent = "✅";
    btn.disabled    = true;
    setTimeout(() => {
        btn.textContent = textoOriginal;
        btn.disabled    = false;
    }, 800);
}

// ─── CARGAR CARRITO DESDE MONGODB ────────────
async function cargarCarritoDesdeDB() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const res   = await fetch(`${CARRITO_SYNC_API}/carrito`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const items = await res.json();

        if (!res.ok || !Array.isArray(items) || items.length === 0) return;

        const carritoLocal = JSON.parse(localStorage.getItem("carrito")) || [];

        if (carritoLocal.length === 0) {
            localStorage.setItem("carrito", JSON.stringify(items));
        } else {
            items.forEach(itemDB => {
                const existe = carritoLocal.find(p => p.nombre === itemDB.nombre);
                if (!existe) carritoLocal.push(itemDB);
            });
            localStorage.setItem("carrito", JSON.stringify(carritoLocal));
            sincronizarCarrito(carritoLocal);
        }

    } catch (err) {
        console.warn("No se pudo cargar carrito desde DB:", err);
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