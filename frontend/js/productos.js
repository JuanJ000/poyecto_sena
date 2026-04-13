// =============================================
// productos.js — Catálogo + Modal + Reseñas
// Carga desde MongoDB (admin) o JSON (fallback)
// =============================================

const PROD_API = 'http://localhost:3000/api';

const TALLAS = {
    'jeans':         ['28','30','32','34','36','38'],
    'camisetas':     ['XS','S','M','L','XL','XXL'],
    'blusas':        ['XS','S','M','L','XL'],
    'vestidos':      ['XS','S','M','L','XL'],
    'ropa-interior': ['S','M','L','XL'],
    'default':       ['S','M','L','XL']
};

const DESCRIPCIONES = {
    'jeans':         'Jeans de corte moderno confeccionados con denim de alta calidad. Versátil y perfecto para el día a día.',
    'camisetas':     'Prenda en algodón 100% natural, suave al tacto y con excelente transpirabilidad.',
    'blusas':        'Blusa de diseño elegante con caída perfecta, ideal para ocasiones formales y casuales.',
    'vestidos':      'Vestido de silueta favorecedora con tela de alta calidad y diseño atemporal.',
    'ropa-interior': 'Confeccionada en algodón suave, costuras planas anti-irritación para máxima comodidad.',
    'default':       'Prenda de alta calidad con diseño cuidado al detalle y materiales seleccionados.'
};

let todosLosProductos  = [];
let favoritosActuales  = [];
let productoActual     = null;
let tallaSeleccionada  = null;
let estrellasSeleccionadas = 0;


// ─── CARGAR PRODUCTOS ────────────────────────
// Intenta MongoDB primero, si no hay usa JSON
async function cargarProductos(genero) {
    console.log(`📦 Intentando cargar productos de BD para género: ${genero}`);
    
    try {
        // 1. Intentar cargar desde MongoDB
        const res = await fetch(`${PROD_API}/productos/${genero}`);
        console.log(`  → Respuesta de BD: ${res.status} ${res.statusText}`);
        
        if (res.ok) {
            const data = await res.json();
            console.log(`  ✅ BD respondió con ${data.length} productos`);
            
            if (Array.isArray(data) && data.length > 0) {
                return data.map((p, i) => ({
                    id:           p._id,
                    nombre:       p.nombre,
                    categoria:    p.categoria,
                    genero:       p.genero,
                    precio:       p.precio,
                    rating:       p.rating || 5,
                    imagen_front: p.imagen_front || `https://picsum.photos/400/500?${i+1}`,
                    imagen_back:  p.imagen_back  || `https://picsum.photos/400/500?${i+2}`,
                    descripcion:  p.descripcion  || ''
                }));
            }
        }
    } catch (e) {
        console.warn(`  ⚠️ BD no disponible: ${e.message}`);
    }

    // 2. Fallback: cargar desde JSON local
    console.log(`  📄 Usando JSON local para genero=${genero}`);
    
    if (genero === 'todos') {
        try {
            const generos = ['hombre', 'mujer', 'niño'];
            const resultados = await Promise.all(
                generos.map(async g => {
                    try {
                        const r    = await fetch(`../../datos/${g}.json`);
                        const data = await r.json();
                        return (data.productos || []).map(p => ({ ...p, genero: g }));
                    } catch { return []; }
                })
            );
            const todos = resultados.flat();
            console.log(`  ✅ JSON local: ${todos.length} productos en total`);
            return todos;
        } catch (e) {
            console.error('❌ Error cargando todos los productos:', e);
            return [];
        }
    }

    // Para géneros individuales
    try {
        const res  = await fetch(`../../datos/${genero}.json`);
        if (!res.ok) throw new Error('No encontrado');
        const data = await res.json();
        const productos = data.productos || [];
        console.log(`  ✅ JSON local: ${productos.length} productos de ${genero}`);
        return productos;
    } catch (e) {
        console.error(`❌ Error cargando productos de ${genero}:`, e);
        return [];
    }
}

// ─── OBTENER FAVORITOS ───────────────────────
async function obtenerFavoritos() {
    const token = localStorage.getItem('token');
    if (!token) return [];
    try {
        const res  = await fetch(`${PROD_API}/favoritos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        return Array.isArray(data) ? data.map(f => f.nombre) : [];
    } catch { return []; }
}

// ─── CARGAR RESEÑAS ──────────────────────────
async function cargarResenas(productoNombre) {
    try {
        const res  = await fetch(`${PROD_API}/resenas/${encodeURIComponent(productoNombre)}`);
        const data = await res.json();
        return Array.isArray(data) ? data : [];
    } catch { return []; }
}

// ─── PARSEAR JWT ─────────────────────────────
function parseJWT(token) {
    try { return JSON.parse(atob(token.split('.')[1])); }
    catch { return null; }
}

// ─── RENDERIZAR RESEÑAS ──────────────────────
function renderizarResenas(resenas, productoNombre) {
    const token    = localStorage.getItem('token');
    const userId   = token ? parseJWT(token)?.id : null;
    const yaReseñó = resenas.some(r => r.usuario === userId);

    const listaHTML = resenas.length === 0
        ? `<p style="color:#888;font-size:0.88rem;text-align:center;padding:1rem 0;">
            Sé el primero en dejar una reseña ✨</p>`
        : resenas.map(r => {
            const fecha    = new Date(r.fecha).toLocaleDateString('es-CO', { year:'numeric', month:'short', day:'numeric' });
            const esPropia = r.usuario === userId;
            return `
            <div class="mp-resena" style="position:relative;">
                <div style="display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;gap:4px;">
                    <div>
                        <strong style="font-size:0.85rem;">${r.nombreUsuario}</strong>
                        <span class="mp-resena-stars" style="margin-left:6px;">
                            ${'★'.repeat(r.estrellas)}${'☆'.repeat(5 - r.estrellas)}
                        </span>
                    </div>
                    <span style="font-size:0.75rem;color:#bbb;">${fecha}</span>
                </div>
                <p style="margin:5px 0 0;font-size:0.85rem;color:#666;line-height:1.5;">${r.comentario}</p>
                ${esPropia ? `
                <button onclick="eliminarResena('${r._id}','${productoNombre}')"
                    style="position:absolute;top:8px;right:8px;background:none;border:none;
                    font-size:0.75rem;color:#ccc;cursor:pointer;" title="Eliminar mi reseña">✕</button>` : ''}
            </div>`;
        }).join('');

    const promedio = resenas.length
        ? (resenas.reduce((a, r) => a + r.estrellas, 0) / resenas.length).toFixed(1)
        : '—';

    const formulario = !token
        ? `<p style="font-size:0.83rem;color:#888;text-align:center;padding:0.75rem;
            background:#f9f9f9;border-radius:10px;margin-top:0.5rem;">
            <a href="registrarse.html" style="color:#111;font-weight:700;">Inicia sesión</a>
            para dejar una reseña</p>`
        : yaReseñó
        ? `<p style="font-size:0.83rem;color:#888;text-align:center;margin-top:0.5rem;">
            Ya dejaste una reseña ✅</p>`
        : `
        <div style="background:#f9f9f9;border-radius:12px;padding:1rem;margin-top:0.75rem;border:1px solid #eee;">
            <p style="font-size:0.78rem;font-weight:700;color:#999;margin:0 0 0.6rem;
                text-transform:uppercase;letter-spacing:0.5px;">Tu reseña</p>
            <div style="display:flex;gap:4px;margin-bottom:6px;" id="estrellas-selector">
                ${[1,2,3,4,5].map(n => `
                <button onclick="seleccionarEstrellas(${n})" data-val="${n}" class="estrella-btn"
                    style="background:none;border:none;font-size:1.5rem;cursor:pointer;
                    color:#ddd;transition:color 0.15s;line-height:1;padding:0;">★</button>
                `).join('')}
            </div>
            <p id="estrellas-label" style="font-size:0.78rem;color:#aaa;margin:0 0 0.6rem;">
                Selecciona una puntuación</p>
            <textarea id="nueva-resena-texto"
                placeholder="Cuéntanos tu experiencia con este producto..."
                style="width:100%;box-sizing:border-box;border:1px solid #e0e0e0;
                border-radius:8px;padding:0.65rem 0.9rem;font-size:0.88rem;
                font-family:inherit;outline:none;resize:vertical;min-height:75px;
                background:#fff;transition:border-color 0.2s;"
                onfocus="this.style.borderColor='#111'"
                onblur="this.style.borderColor='#e0e0e0'"></textarea>
            <p id="resena-error" style="color:#e53e3e;font-size:0.82rem;min-height:1.1em;margin:4px 0 0;"></p>
            <button onclick="publicarResena('${productoNombre}')"
                style="background:#111;color:#fff;border:none;border-radius:8px;
                padding:0.6rem 1.5rem;font-size:0.88rem;font-weight:700;cursor:pointer;
                width:100%;margin-top:8px;transition:background 0.2s;"
                onmouseover="this.style.background='#333'"
                onmouseout="this.style.background='#111'">
                Publicar reseña
            </button>
        </div>`;

    return { listaHTML, promedio, formulario, total: resenas.length };
}

// ─── SELECCIONAR ESTRELLAS ───────────────────
window.seleccionarEstrellas = function(n) {
    estrellasSeleccionadas = n;
    const etiquetas = ['','Muy malo 😞','Malo 😕','Regular 😐','Bueno 😊','Excelente 😍'];
    document.querySelectorAll('.estrella-btn').forEach(btn => {
        btn.style.color = parseInt(btn.dataset.val) <= n ? '#f59e0b' : '#ddd';
    });
    const label = document.getElementById('estrellas-label');
    if (label) label.textContent = etiquetas[n];
};

// ─── PUBLICAR RESEÑA ─────────────────────────
window.publicarResena = async function(productoNombre) {
    // Validar autenticación
    if (AuthToken.redirectIfNotAuthenticated('Debes iniciar sesión para publicar reseñas')) {
        return;
    }

    // Verificar si token está próximo a expirar
    const timeLeft = AuthToken.getTimeToExpire();
    if (timeLeft < 300) {
        alert(`⚠️ Tu sesión está por expirar ${AuthToken.getExpirationReadable()}. Por favor inicia sesión nuevamente.`);
        AuthToken.remove();
        window.location.href = 'registrarse.html';
        return;
    }

    const comentario = document.getElementById('nueva-resena-texto')?.value.trim();
    const errorEl    = document.getElementById('resena-error');

    if (!estrellasSeleccionadas) { errorEl.textContent = 'Selecciona una puntuación'; return; }
    if (!comentario || comentario.length < 5) { errorEl.textContent = 'El comentario debe tener al menos 5 caracteres'; return; }

    errorEl.textContent = '';
    
    console.log('📝 Guardando reseña:', { productoNombre, estrellas: estrellasSeleccionadas, comentario });
    console.log('🔐 Headers:', AuthToken.getHeaders());
    
    try {
        const res  = await fetch(`${PROD_API}/resenas`, {
            method: 'POST',
            headers: AuthToken.getHeaders(),
            body: JSON.stringify({ productoNombre, estrellas: estrellasSeleccionadas, comentario })
        });
        const data = await res.json();
        
        console.log('✅ Respuesta del servidor:', res.status, data);
        
        if (!res.ok) {
            if (res.status === 401) {
                errorEl.textContent = '❌ Tu sesión expiró. Por favor inicia sesión nuevamente.';
                setTimeout(() => {
                    AuthToken.remove();
                    window.location.href = 'registrarse.html';
                }, 1500);
            } else {
                errorEl.textContent = data.error || 'Error al publicar';
            }
            console.error('❌ Error:', data.error);
            return;
        }
        
        errorEl.textContent = '✅ Reseña publicada correctamente';
        errorEl.style.color = '#16a34a';
        estrellasSeleccionadas = 0;
        
        setTimeout(() => {
            errorEl.textContent = '';
            errorEl.style.color = '';
        }, 3000);
        
        await recargarResenasEnModal(productoNombre);
    } catch (err) { 
        console.error('❌ Error en publicarResena:', err);
        errorEl.textContent = 'No se pudo conectar con el servidor';
    }
};

// ─── ELIMINAR RESEÑA ─────────────────────────
window.eliminarResena = async function(id, productoNombre) {
    if (!confirm('¿Eliminar tu reseña?')) return;
    
    if (AuthToken.redirectIfNotAuthenticated('Debes iniciar sesión para eliminar reseñas')) {
        return;
    }
    
    try {
        const res = await fetch(`${PROD_API}/resenas/${id}`, {
            method: 'DELETE',
            headers: AuthToken.getHeaders()
        });
        
        if (!res.ok && res.status === 401) {
            alert('Tu sesión expiró. Por favor inicia sesión nuevamente.');
            AuthToken.remove();
            window.location.href = 'registrarse.html';
            return;
        }
        
        await recargarResenasEnModal(productoNombre);
    } catch (err) { 
        console.error('Error al eliminar:', err);
        alert('Error al eliminar la reseña');
    }
};

// ─── RECARGAR RESEÑAS ────────────────────────
async function recargarResenasEnModal(productoNombre) {
    const resenas = await cargarResenas(productoNombre);
    const { listaHTML, promedio, formulario, total } = renderizarResenas(resenas, productoNombre);
    estrellasSeleccionadas = 0;
    const seccion = document.getElementById('mp-seccion-resenas');
    if (!seccion) return;
    seccion.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:0.75rem;">
            <p class="mp-selector-label" style="margin:0;">Reseñas</p>
            <span style="font-size:0.85rem;color:#f59e0b;font-weight:700;">
                ★ ${promedio} · ${total} reseña${total !== 1 ? 's' : ''}
            </span>
        </div>
        <div class="mp-resenas">${listaHTML}</div>
        ${formulario}`;
}

// ─── RENDERIZAR CATÁLOGO ─────────────────────
function renderizarProductos(productos, filtro = 'all', favs = []) {
    console.log(`🎨 Renderizando productos:`, { total: productos.length, filtro, favoritos: favs.length });
    
    const contenedor = document.querySelector('.productos-grid');
    console.log('🔍 Contenedor encontrado:', !!contenedor);
    
    if (!contenedor) {
        console.error('❌ No se encontró .productos-grid');
        return;
    }
    
    contenedor.innerHTML = '';

    const filtrados = filtro === 'all'
        ? productos
        : productos.filter(p => p.categoria === filtro);

    console.log(`📊 Después de filtrar:`, filtrados.length);

    if (filtrados.length === 0) {
        contenedor.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#aaa;padding:2rem;">
            No hay productos en esta categoría</p>`;
        console.log('⚠️ Sin productos para mostrar');
        return;
    }

    const token = localStorage.getItem('token');

    filtrados.forEach((producto, idx) => {
        const stars = '★'.repeat(producto.rating) + '☆'.repeat(5 - producto.rating);
        const esFav = favs.includes(producto.nombre);
        const btnFav = token
            ? `<button class="btn-fav ${esFav ? 'activo' : ''}"
                data-nombre="${producto.nombre}"
                data-precio="${producto.precio}"
                data-imagen="${producto.imagen_front}"
                data-categoria="${producto.categoria}"
                title="${esFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}">
                ${esFav ? '❤️' : '🤍'}
               </button>`
            : `<button class="btn-fav" onclick="alert('Inicia sesión para guardar favoritos')">🤍</button>`;

        // Usar id numérico o _id de MongoDB
        const prodId = producto.id || producto._id;

        contenedor.innerHTML += `
            <div class="producto reveal" data-category="${producto.categoria}" data-id="${prodId}">
                <div class="img-box" style="position:relative;">
                    <img src="${producto.imagen_front}" class="img-front" alt="${producto.nombre}">
                    <img src="${producto.imagen_back}"  class="img-back"  alt="${producto.nombre}">
                    ${btnFav}
                </div>
                <h3>${producto.nombre}</h3>
                <div class="rating">${stars}</div>
                <p class="precio">$${producto.precio.toLocaleString('es-CO')}</p>
                <div style="display:flex;gap:8px;margin-top:8px;">
                    <button class="cart-btn" style="flex:1;"
                        onclick="event.stopPropagation();agregarCarrito(this)">🛒 Agregar</button>
                </div>
            </div>`;
    });

    console.log('✅ Renderizado completado:', document.querySelectorAll('.producto').length, 'productos en DOM');

    if (token) activarBotonesFavoritos();
    
    // Mostrar los productos con animación (revelarProductosVisibles es definida en menu.js)
    if (typeof revelarProductosVisibles === 'function') {
        revelarProductosVisibles();
    } else {
        // Fallback: mostrar directamente si la función no está disponible
        document.querySelectorAll('.producto.reveal:not(.active)').forEach(p => {
            p.classList.add('active');
        });
    }
}

// ─── ABRIR MODAL DETALLE ─────────────────────
window.abrirDetalle = async function(id) {
    // Buscar por id numérico o _id string
    const producto = todosLosProductos.find(p => String(p.id) === String(id) || String(p._id) === String(id));
    if (!producto) return;

    productoActual         = producto;
    tallaSeleccionada      = null;
    estrellasSeleccionadas = 0;

    const modal = document.getElementById('modal-producto');
    if (!modal) return;

    const esFav  = favoritosActuales.includes(producto.nombre);
    const tallas = TALLAS[producto.categoria] || TALLAS['default'];
    const desc   = producto.descripcion || DESCRIPCIONES[producto.categoria] || DESCRIPCIONES['default'];

    const resenas = await cargarResenas(producto.nombre);
    const { listaHTML, promedio, formulario, total } = renderizarResenas(resenas, producto.nombre);

    const relacionados = todosLosProductos
        .filter(p => p.categoria === producto.categoria && String(p.id || p._id) !== String(id))
        .slice(0, 4)
        .map(r => {
            const rId = r.id || r._id;
            return `
            <div class="mp-rel-card" onclick="abrirDetalle('${rId}')">
                <img src="${r.imagen_front}" alt="${r.nombre}">
                <p>${r.nombre}</p>
                <span>$${r.precio.toLocaleString('es-CO')}</span>
            </div>`;
        }).join('');

    const promedioEstrellas = promedio !== '—' ? Math.round(parseFloat(promedio)) : 0;

    modal.querySelector('.mp-box').innerHTML = `
        <div class="mp-galeria">
            <img id="mp-img-main" class="mp-img-principal"
                src="${producto.imagen_front}" alt="${producto.nombre}">
            <div class="mp-miniaturas">
                <img class="mp-miniatura activa" src="${producto.imagen_front}"
                    onclick="cambiarImgPrincipal(this,'${producto.imagen_front}')">
                <img class="mp-miniatura" src="${producto.imagen_back}"
                    onclick="cambiarImgPrincipal(this,'${producto.imagen_back}')">
            </div>
        </div>

        <div class="mp-info">
            <button class="mp-cerrar" id="mp-cerrar-btn">✕</button>
            <p class="mp-categoria">${producto.categoria.replace('-',' ')}</p>
            <h2 class="mp-nombre">${producto.nombre}</h2>
            <div class="mp-rating">
                <span class="mp-estrellas">
                    ${'★'.repeat(promedioEstrellas)}${'☆'.repeat(5 - promedioEstrellas)}
                </span>
                <span class="mp-rating-num">★ ${promedio} · ${total} reseña${total !== 1 ? 's' : ''}</span>
            </div>
            <p class="mp-precio">$${producto.precio.toLocaleString('es-CO')}</p>
            <p class="mp-descripcion">${desc}</p>

            <div>
                <p class="mp-selector-label">Talla</p>
                <div class="mp-tallas">
                    ${tallas.map(t => `
                        <button class="mp-talla" onclick="seleccionarTalla(this,'${t}')">${t}</button>
                    `).join('')}
                </div>
            </div>

            <div class="mp-acciones">
                <button class="mp-btn-carrito" onclick="agregarDesdeModal()">
                    🛒 Agregar al carrito
                </button>
                <button class="mp-btn-fav ${esFav ? 'activo' : ''}"
                    id="mp-btn-fav-modal" onclick="toggleFavDesdeModal(this)">
                    ${esFav ? '❤️' : '🤍'}
                </button>
            </div>
            <p id="mp-msg" style="font-size:0.85rem;color:#111;font-weight:700;
                min-height:1.2em;text-align:center;margin:0;"></p>
        </div>

        <div class="mp-relacionados" id="mp-seccion-resenas">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:0.75rem;">
                <p class="mp-selector-label" style="margin:0;">Reseñas</p>
                <span style="font-size:0.85rem;color:#f59e0b;font-weight:700;">
                    ★ ${promedio} · ${total} reseña${total !== 1 ? 's' : ''}
                </span>
            </div>
            <div class="mp-resenas">${listaHTML}</div>
            ${formulario}
        </div>

        ${relacionados ? `
        <div class="mp-relacionados" style="border-top:1px solid #eee;">
            <h4>También te puede gustar</h4>
            <div class="mp-rel-grid">${relacionados}</div>
        </div>` : ''}
    `;

    document.getElementById('mp-cerrar-btn').addEventListener('click', cerrarDetalle);
    modal.classList.add('abierto');
};

window.cerrarDetalle = function() {
    document.getElementById('modal-producto').classList.remove('abierto');
};

window.cambiarImgPrincipal = function(min, src) {
    document.getElementById('mp-img-main').src = src;
    document.querySelectorAll('.mp-miniatura').forEach(m => m.classList.remove('activa'));
    min.classList.add('activa');
};

window.seleccionarTalla = function(btn, talla) {
    document.querySelectorAll('.mp-talla').forEach(b => b.classList.remove('sel'));
    btn.classList.add('sel');
    tallaSeleccionada = talla;
};

window.agregarDesdeModal = function() {
    if (!productoActual) return;
    const msg = document.getElementById('mp-msg');
    if (!tallaSeleccionada) { msg.style.color='#e53e3e'; msg.textContent='Selecciona una talla'; return; }

    const nombre = `${productoActual.nombre} (${tallaSeleccionada})`;
    let carrito  = JSON.parse(localStorage.getItem('carrito')) || [];
    const existe = carrito.find(p => p.nombre === nombre);
    if (existe) { existe.cantidad++; }
    else { carrito.push({ nombre, precio: productoActual.precio, img: productoActual.imagen_front, cantidad: 1 }); }

    localStorage.setItem('carrito', JSON.stringify(carrito));
    const token = localStorage.getItem('token');
    if (token) {
        fetch(`${PROD_API}/carrito`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ items: carrito })
        }).catch(() => {});
    }

    msg.style.color = '#16a34a';
    msg.textContent = '✅ ¡Agregado al carrito!';
    setTimeout(() => { msg.textContent = ''; }, 2500);
};

window.toggleFavDesdeModal = async function(btn) {
    const token = localStorage.getItem('token');
    if (!token) { alert('Inicia sesión para guardar favoritos'); return; }
    if (!productoActual) return;
    const esFav  = btn.classList.contains('activo');
    btn.disabled = true;
    if (esFav) {
        try {
            const res  = await fetch(`${PROD_API}/favoritos`, { headers: { 'Authorization': `Bearer ${token}` } });
            const favs = await res.json();
            const fav  = favs.find(f => f.nombre === productoActual.nombre);
            if (fav) await fetch(`${PROD_API}/favoritos/${fav._id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            btn.classList.remove('activo'); btn.textContent = '🤍';
            favoritosActuales = favoritosActuales.filter(n => n !== productoActual.nombre);
        } catch (e) {}
    } else {
        try {
            await fetch(`${PROD_API}/favoritos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ nombre: productoActual.nombre, precio: productoActual.precio, imagen_front: productoActual.imagen_front, categoria: productoActual.categoria })
            });
            btn.classList.add('activo'); btn.textContent = '❤️';
            favoritosActuales.push(productoActual.nombre);
        } catch (e) {}
    }
    btn.disabled = false;
    const btnCat = document.querySelector(`.btn-fav[data-nombre="${productoActual.nombre}"]`);
    if (btnCat) { btnCat.classList.toggle('activo', !esFav); btnCat.textContent = esFav ? '🤍' : '❤️'; }
};

function activarBotonesFavoritos() {
    document.querySelectorAll('.btn-fav[data-nombre]').forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.stopPropagation();
            const token = localStorage.getItem('token');
            if (!token) return;
            const nombre = this.dataset.nombre;
            const esFav  = this.classList.contains('activo');
            this.disabled = true;
            if (esFav) {
                try {
                    const res  = await fetch(`${PROD_API}/favoritos`, { headers: { 'Authorization': `Bearer ${token}` } });
                    const favs = await res.json();
                    const fav  = favs.find(f => f.nombre === nombre);
                    if (fav) await fetch(`${PROD_API}/favoritos/${fav._id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                    this.classList.remove('activo'); this.textContent = '🤍';
                    favoritosActuales = favoritosActuales.filter(n => n !== nombre);
                } catch (e) {}
            } else {
                try {
                    await fetch(`${PROD_API}/favoritos`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ nombre, precio: parseInt(this.dataset.precio), imagen_front: this.dataset.imagen, categoria: this.dataset.categoria })
                    });
                    this.classList.add('activo'); this.textContent = '❤️';
                    favoritosActuales.push(nombre);
                } catch (e) {}
            }
            this.disabled = false;
        });
    });
}

function inyectarModal() {
    if (document.getElementById('modal-producto')) return;
    const div     = document.createElement('div');
    div.id        = 'modal-producto';
    div.innerHTML = `<div class="mp-box"></div>`;
    div.addEventListener('click', function(e) { if (e.target === this) cerrarDetalle(); });
    document.body.appendChild(div);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarDetalle(); });
}

// ─── INICIALIZAR ─────────────────────────────
async function inicializar() {
    inyectarModal();

    const urlActual = window.location.pathname;
    let genero      = 'todos';
    if (urlActual.includes('mujer'))       genero = 'mujer';
    else if (urlActual.includes('ni'))     genero = 'niño';
    else if (urlActual.includes('hombre')) genero = 'hombre';

    console.log('📄 Página:', urlActual, '| Género:', genero);

    const [productos, favs] = await Promise.all([
        cargarProductos(genero),
        obtenerFavoritos()
    ]);

    console.log('✅ Productos cargados:', productos.length);

    todosLosProductos = productos;
    favoritosActuales  = favs;

    const filtroInicial = new URLSearchParams(window.location.search).get('categoria') || 'all';
    console.log('🎯 Filtro inicial:', filtroInicial);
    renderizarProductos(productos, filtroInicial, favs);
    console.log('📊 Productos en DOM:', document.querySelectorAll('.producto').length);

    // En productos.html no agregamos listeners porque se manejan con onclick="filtrarGenero()"
    const enProductosPage = window.location.pathname.includes('productos.html');
    
    if (!enProductosPage) {
        // Botones de filtro por categoría (para hombre.html, mujer.html, niño.html)
        document.querySelectorAll('.filtro').forEach(boton => {
            boton.addEventListener('click', () => {
                document.querySelectorAll('.filtro').forEach(b => b.classList.remove('activo'));
                boton.classList.add('activo');
                const filtroAttr = boton.getAttribute('data-filter') || boton.getAttribute('data-genero') || 'all';
                renderizarProductos(
                    ordenarProductos(todosLosProductos, document.querySelector('.ordenar-select')?.value),
                    filtroAttr,
                    favoritosActuales
                );
            });
        });
    }

    // Select de ordenar (para todas las páginas)
    const selectOrdenar = document.querySelector('.ordenar-select');
    if (selectOrdenar) {
        console.log('✅ Select de ordenar encontrado, agregando listener...');
        selectOrdenar.addEventListener('change', () => {
            const criterio = selectOrdenar.value;
            console.log(`🔄 Ordenando por: ${criterio}`);
            
            // En productos.html, NO usar filtro de género, siempre usar 'all'
            const enProductosPage = window.location.pathname.includes('productos.html');
            const filtroParaUso = enProductosPage ? 'all' : (document.querySelector('.filtro.activo')?.getAttribute('data-filter') || 'all');
            
            console.log(`  Filtro para renderizar: ${filtroParaUso}`);
            
            const productosOrdenados = ordenarProductos(todosLosProductos, criterio);
            renderizarProductos(productosOrdenados, filtroParaUso, favoritosActuales);
            console.log(`  ✅ Productos re-renderizados: ${productosOrdenados.length}`);
        });
    } else {
        console.warn('⚠️ Select de ordenar NO encontrado');
    }
}

// ─── FUNCIÓN DEBUG GLOBAL ────────────────────
window.verificarProductos = function() {
    console.log('📦 Productos cargados:', todosLosProductos.length);
    console.log('🎯 Contenedor encontrado:', !!document.querySelector('.productos-grid'));
    console.log('👁️ Items en grilla:', document.querySelectorAll('.producto').length);
    return { productos: todosLosProductos, items: document.querySelectorAll('.producto').length };
};

// ─── ORDENAR PRODUCTOS ───────────────────────
window.ordenarProductos = function(productos, criterio) {
    if (!criterio) return productos;
    
    const copia = [...productos];
    switch (criterio) {
        case 'precio-asc':
            return copia.sort((a, b) => a.precio - b.precio);
        case 'precio-desc':
            return copia.sort((a, b) => b.precio - a.precio);
        case 'recientes':
            return copia.sort((a, b) => new Date(b.creadoEn || 0) - new Date(a.creadoEn || 0));
        default:
            return copia;
    }
};

document.addEventListener('DOMContentLoaded', inicializar);