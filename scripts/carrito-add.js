function agregarCarrito(btn) {
    // Busca en .producto-card o .producto
    const producto = btn.closest(".producto-card") || btn.closest(".producto");

    const nombre = producto.querySelector("h3").textContent;
    const precio = parseInt(
        producto.querySelector(".precio").textContent.replace(/\D/g, "")
    );
    const img = producto.querySelector("img").src;

    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

    const existe = carrito.find(p => p.nombre === nombre);

    if (existe) {
        existe.cantidad++;
    } else {
        carrito.push({
            nombre,
            precio,
            img,
            cantidad: 1
        });
    }

    localStorage.setItem("carrito", JSON.stringify(carrito));

    // alert("Producto agregado al carrito 🛒");
}

// Event listeners para botones sin onclick
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".cart-btn").forEach(btn => {
        if (!btn.onclick) {
            btn.addEventListener("click", function() {
                agregarCarrito(this);
            });
        }
    });
});