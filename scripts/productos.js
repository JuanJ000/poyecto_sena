// Función para cargar productos desde JSON
async function cargarProductos(categoria) {
    try {
        const response = await fetch(`../datos/${categoria}.json`);
        if (!response.ok) throw new Error('No se encontró el archivo');
        const data = await response.json();
        return data.productos;
    } catch (error) {
        console.error(`Error al cargar productos de ${categoria}:`, error);
        return [];
    }
}

// Función para renderizar productos en el HTML
function renderizarProductos(productos, filtro = 'all') {
    const contenedor = document.querySelector('.productos-grid');
    if (!contenedor) return;

    contenedor.innerHTML = ''; // Limpiar productos anteriores

    const productosFiltrados = filtro === 'all' 
        ? productos 
        : productos.filter(p => p.categoria === filtro);

    if (productosFiltrados.length === 0) {
        contenedor.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No hay productos disponibles</p>';
        return;
    }

    productosFiltrados.forEach(producto => {
        const stars = '★'.repeat(producto.rating) + '☆'.repeat(5 - producto.rating);
        const html = `
            <div class="producto" data-category="${producto.categoria}">
                <div class="img-box">
                    <img src="${producto.imagen_front}" class="img-front" alt="${producto.nombre}">
                    <img src="${producto.imagen_back}" class="img-back" alt="${producto.nombre}">
                </div>
                <h3>${producto.nombre}</h3>
                <div class="rating">${stars}</div>
                <p class="precio">$${producto.precio.toLocaleString('es-CO')}</p>
                <button class="cart-btn" onclick="agregarCarrito(this)">🛒</button>
            </div>
        `;
        contenedor.innerHTML += html;
    });
}

// Función para obtener la categoría desde el URL
function obtenerCategoriaDelURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('categoria') || 'all';
}

// Inicializar página
async function inicializar() {
    // Determinar qué archivo cargar según la página
    let categoria = 'productos'; // Por defecto
    const urlActual = window.location.pathname;
    
    if (urlActual.includes('mujer')) categoria = 'mujer';
    else if (urlActual.includes('niño')) categoria = 'niño';
    else if (urlActual.includes('hombre')) categoria = 'hombre';
    // 'productos' para la página de todos los productos

    // Cargar productos
    const productos = await cargarProductos(categoria);
    
    // Renderizar con filtro inicial
    const filtroInicial = obtenerCategoriaDelURL();
    renderizarProductos(productos, filtroInicial);

    // Configurar botones de filtro
    const botonesFiltro = document.querySelectorAll('.filtro');
    botonesFiltro.forEach(boton => {
        boton.addEventListener('click', () => {
            botonesFiltro.forEach(b => b.classList.remove('activo'));
            boton.classList.add('activo');
            const filtro = boton.getAttribute('data-filter');
            renderizarProductos(productos, filtro);
        });
    });
}

// Ejecutar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializar);
