document.addEventListener("DOMContentLoaded", () => {

    const contenedorFiltros = document.querySelector(".filtros");

    if (!contenedorFiltros) return;

    contenedorFiltros.addEventListener("click", (e) => {

        if (!e.target.matches("button")) return;

        const filtro = e.target.dataset.filter;

        document.querySelectorAll(".filtro").forEach(btn => btn.classList.remove("activo"));
        e.target.classList.add("activo");

        document.querySelectorAll(".producto").forEach(producto => {

            const categoria = producto.dataset.category;

            if (filtro === "all" || categoria === filtro) {
                producto.style.display = "";
            } else {
                producto.style.display = "none";
            }

        });

    });

});



// ===============================
// FILTRO AUTOMÁTICO DESDE LA URL
// ===============================

document.addEventListener("DOMContentLoaded", () => {

    const params = new URLSearchParams(window.location.search);
    const categoriaURL = params.get("categoria");

    if (!categoriaURL) return;

    const productos = document.querySelectorAll(".producto");
    const botones = document.querySelectorAll(".filtro");

    // Activar botón correcto
    botones.forEach(boton => {
        if (boton.dataset.filter === categoriaURL) {
            boton.classList.add("activo");
        } else {
            boton.classList.remove("activo");
        }
    });

    // Filtrar productos
    productos.forEach(producto => {
        if (producto.dataset.category === categoriaURL) {
            producto.classList.remove("oculto");
        } else {
            producto.classList.add("oculto");
        }
    });

});
