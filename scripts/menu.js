document.addEventListener("DOMContentLoaded", () => {

    const btnMenu = document.querySelector(".jam-menu");
    const menu = document.querySelector("nav.menu:not(.redes-sociales)");
    const categorias = document.querySelectorAll(".categorias > li");

    btnMenu.addEventListener("click", () => {
        menu.classList.toggle("active");
    });

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
            menu.classList.remove("active");
            document.querySelectorAll(".sub-menu").forEach(sm => sm.classList.remove("open"));
            document.querySelectorAll(".categorias a").forEach(a => a.classList.remove("active"));
        }
    });

});


const productos = document.querySelectorAll(".reveal");

window.addEventListener("scroll", () => {
    const trigger = window.innerHeight * 0.85;

    productos.forEach(p => {
        const top = p.getBoundingClientRect().top;
        if (top < trigger) {
            p.classList.add("active");
        }
    });
});



// registro
const tabs = document.querySelectorAll(".tab");
const forms = document.querySelectorAll(".auth-form");

tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("active"));
        forms.forEach(f => f.classList.remove("active"));

        tab.classList.add("active");
        document.getElementById(tab.dataset.form).classList.add("active");
    });
});


// ================= AUTH =================

const loginForm = document.getElementById("login");
const registerForm = document.getElementById("register");

// ===== REGISTRO =====
registerForm.addEventListener("submit", e => {
    e.preventDefault();

    const name = registerForm.querySelector("input[type=text]").value.trim();
    const email = registerForm.querySelector("input[type=email]").value.trim();
    const pass = registerForm.querySelectorAll("input[type=password]")[0].value;
    const confirm = registerForm.querySelectorAll("input[type=password]")[1].value;
    const error = registerForm.querySelector(".auth-error");

    if (!name || !email || !pass || !confirm) {
        error.textContent = "Todos los campos son obligatorios";
        return;
    }

    if (!email.includes("@")) {
        error.textContent = "Email no válido";
        return;
    }

    if (pass.length < 6) {
        error.textContent = "La contraseña debe tener mínimo 6 caracteres";
        return;
    }

    if (pass !== confirm) {
        error.textContent = "Las contraseñas no coinciden";
        return;
    }

    const user = { name, email, pass };
    localStorage.setItem("user", JSON.stringify(user));

    error.style.color = "green";
    error.textContent = "Cuenta creada correctamente";

    registerForm.reset();
});

// ===== LOGIN =====
loginForm.addEventListener("submit", e => {
    e.preventDefault();

    const email = loginForm.querySelector("input[type=email]").value.trim();
    const pass = loginForm.querySelector("input[type=password]").value;
    const error = loginForm.querySelector(".auth-error");

    const savedUser = JSON.parse(localStorage.getItem("user"));

    if (!savedUser) {
        error.textContent = "No existe una cuenta registrada";
        return;
    }

    if (email !== savedUser.email || pass !== savedUser.pass) {
        error.textContent = "Email o contraseña incorrectos";
        return;
    }

    localStorage.setItem("session", "true");
    window.location.href = "index.html";
});

