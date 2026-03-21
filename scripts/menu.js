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

if (registerForm) {
  registerForm.addEventListener("submit", async e => {
    e.preventDefault();
    const error = registerForm.querySelector(".auth-error");

    const nombre  = registerForm.querySelector("input[type=text]").value.trim();
    const email   = registerForm.querySelector("input[type=email]").value.trim();
    const pass    = registerForm.querySelectorAll("input[type=password]")[0].value;
    const confirm = registerForm.querySelectorAll("input[type=password]")[1].value;

    if (pass !== confirm) return (error.textContent = "Las contraseñas no coinciden");

    const res  = await fetch("http://localhost:3000/api/registrarse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, email, password: pass })
    });
    const data = await res.json();

    if (!res.ok) return (error.textContent = data.error);

    error.style.color = "green";
    error.textContent = data.mensaje;
    registerForm.reset();
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async e => {
    e.preventDefault();
    const error = loginForm.querySelector(".auth-error");

    const email = loginForm.querySelector("input[type=email]").value.trim();
    const pass  = loginForm.querySelector("input[type=password]").value;

    const res  = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass })
    });
    const data = await res.json();

    if (!res.ok) return (error.textContent = data.error);

    localStorage.setItem("token", data.token);
    localStorage.setItem("nombre", data.nombre);
    window.location.href = "index.html";
  });
}
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

