// =============================================
// productos.js — Carga, renderiza y favoritos
// =============================================

const PROD_API = "http://localhost:3000/api";

// ─── CARGAR PRODUCTOS DESDE JSON ────────────
async function cargarProductos(categoria) {
    try {
        const response = await fetch(`datos/${categoria}.json`);
        if (!response.ok) throw new Error("No se encontró el archivo");
        const data = await response.json();
        return data.productos;
    } catch (error) {
        console.error(`Error al cargar productos de ${categoria}:`, error);
        return [];
    }
}

// ─── OBTENER FAVORITOS ACTUALES ──────────────
async function obtenerFavoritos() {
    const token = localStorage.getItem("token");
    if (!token) return [];

    try {
        const res  = await fetch(`${PROD_API}/favoritos`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        return Array.isArray(data) ? data.map(f => f.nombre) : [];
    } catch {
        return [];
    }
}

// ─── RENDERIZAR PRODUCTOS ────────────────────
function renderizarProductos(productos, filtro = "all", favoritosActuales = []) {
    const contenedor = document.querySelector(".productos-grid");
    if (!contenedor) return;

    contenedor.innerHTML = "";

    const productosFiltrados = filtro === "all"
        ? productos
        : productos.filter(p => p.categoria === filtro);

    if (productosFiltrados.length === 0) {
        contenedor.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#aaa;padding:2rem;">
            No hay productos en esta categoría</p>`;
        return;
    }

    const token = localStorage.getItem("token");

    productosFiltrados.forEach(producto => {
        const stars    = "★".repeat(producto.rating) + "☆".repeat(5 - producto.rating);
        const esFav    = favoritosActuales.includes(producto.nombre);
        const btnFavHTML = token
            ? `<button class="btn-fav ${esFav ? 'activo' : ''}"
                data-nombre="${producto.nombre}"
                data-precio="${producto.precio}"
                data-imagen="${producto.imagen_front}"
                data-categoria="${producto.categoria}"
                title="${esFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}">
                ${esFav ? "❤️" : "🤍"}
               </button>`
            : `<button class="btn-fav" onclick="alert('Inicia sesión para guardar favoritos')" title="Inicia sesión para guardar favoritos">🤍</button>`;

        const html = `
            <div class="producto" data-category="${producto.categoria}">
                <div class="img-box" style="position:relative;">
                    <img src="${producto.imagen_front}" class="img-front" alt="${producto.nombre}">
                    <img src="${producto.imagen_back}" class="img-back" alt="${producto.nombre}">
                    ${btnFavHTML}
                </div>
                <h3>${producto.nombre}</h3>
                <div class="rating">${stars}</div>
                <p class="precio">$${producto.precio.toLocaleString("es-CO")}</p>
                <button class="cart-btn" onclick="agregarCarrito(this)">🛒 Agregar</button>
            </div>`;

        contenedor.innerHTML += html;
    });

    // Activar eventos de favoritos
    if (token) activarBotonesFavoritos();
}

// ─── ACTIVAR BOTONES FAVORITOS ───────────────
function activarBotonesFavoritos() {
    document.querySelectorAll(".btn-fav").forEach(btn => {
        btn.addEventListener("click", async function() {
            const token    = localStorage.getItem("token");
            if (!token) return;

            const nombre    = this.dataset.nombre;
            const precio    = parseInt(this.dataset.precio);
            const imagenFront = this.dataset.imagen;
            const categoria = this.dataset.categoria;
            const esFav     = this.classList.contains("activo");

            this.disabled = true;

            if (esFav) {
                // Quitar de favoritos — buscar el id del favorito
                try {
                    const res  = await fetch(`${PROD_API}/favoritos`, {
                        headers: { "Authorization": `Bearer ${token}` }
                    });
                    const favs = await res.json();
                    const fav  = favs.find(f => f.nombre === nombre);

                    if (fav) {
                        await fetch(`${PROD_API}/favoritos/${fav._id}`, {
                            method: "DELETE",
                            headers: { "Authorization": `Bearer ${token}` }
                        });
                    }

                    this.classList.remove("activo");
                    this.textContent = "🤍";
                    this.title       = "Agregar a favoritos";
                } catch (err) {
                    console.error("Error al quitar favorito:", err);
                }

            } else {
                // Agregar a favoritos
                try {
                    const res  = await fetch(`${PROD_API}/favoritos`, {
                        method: "POST",
                        headers: {
                            "Content-Type":  "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({ nombre, precio, imagen_front: imagenFront, categoria })
                    });
                    const data = await res.json();

                    if (res.ok) {
                        this.classList.add("activo");
                        this.textContent = "❤️";
                        this.title       = "Quitar de favoritos";
                    } else {
                        // Ya estaba en favoritos
                        this.classList.add("activo");
                        this.textContent = "❤️";
                    }
                } catch (err) {
                    console.error("Error al agregar favorito:", err);
                }
            }

            this.disabled = false;
        });
    });
}

// ─── OBTENER CATEGORÍA DEL URL ───────────────
function obtenerCategoriaDelURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get("categoria") || "all";
}

// ─── INICIALIZAR PÁGINA ──────────────────────
async function inicializar() {
    const urlActual = window.location.pathname;
    let categoria   = "productos";

    if (urlActual.includes("mujer"))  categoria = "mujer";
    else if (urlActual.includes("ni")) categoria = "niño";
    else if (urlActual.includes("hombre")) categoria = "hombre";

    // Cargar productos y favoritos en paralelo
    const [productos, favoritos] = await Promise.all([
        cargarProductos(categoria),
        obtenerFavoritos()
    ]);

    const filtroInicial = obtenerCategoriaDelURL();
    renderizarProductos(productos, filtroInicial, favoritos);

    // Botones de filtro
    const botonesFiltro = document.querySelectorAll(".filtro");
    botonesFiltro.forEach(boton => {
        boton.addEventListener("click", () => {
            botonesFiltro.forEach(b => b.classList.remove("activo"));
            boton.classList.add("activo");
            renderizarProductos(productos, boton.getAttribute("data-filter"), favoritos);
        });
    });
}

document.addEventListener("DOMContentLoaded", inicializar);