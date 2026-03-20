document.addEventListener("DOMContentLoaded", () => {

    const contenedor = document.getElementById("carrito-items");
    const totalElemento = document.getElementById("total");

    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

    function renderCarrito() {

        contenedor.innerHTML = "";
        let total = 0;

        carrito.forEach((producto, index) => {

            total += producto.precio * producto.cantidad;

            contenedor.innerHTML += `
                <div class="carrito-item">
                    <img src="${producto.img}">
                    <div class="carrito-info">
                        <h3>${producto.nombre}</h3>
                        <p>$${producto.precio}</p>

                        <div class="cantidad">
                            <button onclick="cambiarCantidad(${index}, -1)">-</button>
                            <span>${producto.cantidad}</span>
                            <button onclick="cambiarCantidad(${index}, 1)">+</button>
                        </div>

                        <button onclick="eliminarProducto(${index})">Eliminar</button>
                    </div>
                </div>
            `;
        });

        totalElemento.textContent = "$" + total.toLocaleString();
    }

    window.cambiarCantidad = function(index, cambio) {
        carrito[index].cantidad += cambio;

        if (carrito[index].cantidad <= 0) {
            carrito.splice(index, 1);
        }

        localStorage.setItem("carrito", JSON.stringify(carrito));
        renderCarrito();
    }

    window.eliminarProducto = function(index) {
        carrito.splice(index, 1);
        localStorage.setItem("carrito", JSON.stringify(carrito));
        renderCarrito();
    }

    renderCarrito();

});