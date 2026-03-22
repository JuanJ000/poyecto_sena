// ================= MENÚ NAVEGACIÓN =================

document.addEventListener("DOMContentLoaded", () => {

    const btnMenu = document.querySelector(".jam-menu");
    const menu = document.querySelector("nav.menu:not(.redes-sociales)");
    const categorias = document.querySelectorAll(".categorias > li");

    if (btnMenu && menu) {
        btnMenu.addEventListener("click", () => {
            menu.classList.toggle("active");
        });
    }

    categorias.forEach(item => {
        const link = item.querySelector("a");
        const subMenu = item.querySelector(".sub-menu");

        if (!subMenu) return;

        link.addEventListener("click", e => {
            if (window.innerWidth <= 992) {
                e.preventDefault();
                subMenu.classList.toggle("open");
                link.classList.toggle("active");
            }
        });
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 992) {
            if (menu) menu.classList.remove("active");
            document.querySelectorAll(".sub-menu").forEach(sm => sm.classList.remove("open"));
            document.querySelectorAll(".categorias a").forEach(a => a.classList.remove("active"));
        }
    });

    // ── Mostrar sesión activa en el menú ──
    actualizarMenuSesion();

});


// ================= SESIÓN EN EL MENÚ =================

function actualizarMenuSesion() {
    const token  = localStorage.getItem("token");
    const nombre = localStorage.getItem("nombre");

    // Buscar el <li> que contiene el enlace a registrarse.html
    const liRegistrarse = [...document.querySelectorAll(".categorias > li")].find(li => {
        const a = li.querySelector("a");
        return a && a.getAttribute("href") === "registrarse.html";
    });

    if (!liRegistrarse) return;

    if (token && nombre) {
        // Hay sesión: mostrar nombre + Mi perfil + Cerrar sesión
        liRegistrarse.innerHTML = `
            <a href="perfil.html" class="menu-usuario">
                <span class="menu-avatar">${nombre.charAt(0).toUpperCase()}</span>
                ${nombre.split(" ")[0]}
            </a>
            <ul class="sub-menu sub-menu-usuario">
                <li><a href="perfil.html">👤 Mi perfil</a></li>
                <li><a href="#" id="btn-cerrar-sesion">🚪 Cerrar sesión</a></li>
            </ul>
        `;

        // Evento cerrar sesión
        document.getElementById("btn-cerrar-sesion").addEventListener("click", e => {
            e.preventDefault();
            cerrarSesion();
        });

    } else {
        // No hay sesión: mostrar enlace normal
        liRegistrarse.innerHTML = `<a href="registrarse.html">Registrarse</a>`;
    }
}


function cerrarSesion() {
    // Solo limpiar localStorage — el carrito se queda en MongoDB
    // para que al volver a iniciar sesión el usuario lo recupere
    localStorage.removeItem("token");
    localStorage.removeItem("nombre");
    localStorage.removeItem("carrito");

    window.location.href = "index.html";
}


// ================= ANIMACIÓN SCROLL =================

const productosReveal = document.querySelectorAll(".reveal");

window.addEventListener("scroll", () => {
    const trigger = window.innerHeight * 0.85;

    productosReveal.forEach(p => {
        const top = p.getBoundingClientRect().top;
        if (top < trigger) {
            p.classList.add("active");
        }
    });
});


// ================= TABS REGISTRO/LOGIN =================

const tabs  = document.querySelectorAll(".tab");
const forms = document.querySelectorAll(".auth-form");

tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("active"));
        forms.forEach(f => f.classList.remove("active"));
        tab.classList.add("active");
        document.getElementById(tab.dataset.form).classList.add("active");
    });
});


// ================= AUTH CON MONGODB =================

const API = "http://localhost:3000/api";

const loginForm    = document.getElementById("login");
const registerForm = document.getElementById("register");

// ===== REGISTRO =====
if (registerForm) {
    registerForm.addEventListener("submit", async e => {
        e.preventDefault();

        const nombre  = registerForm.querySelector("input[type=text]").value.trim();
        const email   = registerForm.querySelector("input[type=email]").value.trim();
        const pass    = registerForm.querySelectorAll("input[type=password]")[0].value;
        const confirm = registerForm.querySelectorAll("input[type=password]")[1].value;
        const error   = registerForm.querySelector(".auth-error");

        if (!nombre || !email || !pass || !confirm) {
            error.style.color = "";
            error.textContent = "Todos los campos son obligatorios";
            return;
        }
        if (!email.includes("@")) {
            error.style.color = "";
            error.textContent = "Email no válido";
            return;
        }
        if (pass.length < 6) {
            error.style.color = "";
            error.textContent = "La contraseña debe tener mínimo 6 caracteres";
            return;
        }
        if (pass !== confirm) {
            error.style.color = "";
            error.textContent = "Las contraseñas no coinciden";
            return;
        }

        try {
            const res  = await fetch(`${API}/registrarse`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nombre, email, password: pass })
            });
            const data = await res.json();

            if (!res.ok) {
                error.style.color = "";
                error.textContent = data.error || "Error al registrarse";
                return;
            }

            error.style.color = "green";
            error.textContent = "¡Cuenta creada correctamente! ✅";
            registerForm.reset();

        } catch (err) {
            error.style.color = "";
            error.textContent = "No se pudo conectar con el servidor. ¿Está corriendo?";
        }
    });
}

// ===== LOGIN =====
if (loginForm) {
    loginForm.addEventListener("submit", async e => {
        e.preventDefault();

        const email = loginForm.querySelector("input[type=email]").value.trim();
        const pass  = loginForm.querySelector("input[type=password]").value;
        const error = loginForm.querySelector(".auth-error");

        if (!email || !pass) {
            error.textContent = "Completa todos los campos";
            return;
        }

        try {
            const res  = await fetch(`${API}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password: pass })
            });
            const data = await res.json();

            if (!res.ok) {
                error.textContent = data.error || "Email o contraseña incorrectos";
                return;
            }

            // Guardar sesión
            localStorage.setItem("token",  data.token);
            localStorage.setItem("nombre", data.nombre);

            // Cargar carrito guardado desde MongoDB
            try {
                const resCarrito = await fetch("http://localhost:3000/api/carrito", {
                    headers: { "Authorization": `Bearer ${data.token}` }
                });
                const itemsDB = await resCarrito.json();
                if (Array.isArray(itemsDB) && itemsDB.length > 0) {
                    localStorage.setItem("carrito", JSON.stringify(itemsDB));
                }
            } catch (e) {}

            window.location.href = "index.html";

        } catch (err) {
            error.textContent = "No se pudo conectar con el servidor. ¿Está corriendo?";
        }
    });
}