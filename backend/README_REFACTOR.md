# 📦 Tienda X - Backend Refactorizado

## 🏗️ Estructura de Proyecto

```
backend/
├── src/
│   ├── config/
│   │   └── config.js              # Configuración centralizada
│   ├── middleware/
│   │   ├── verificarToken.js      # Validación JWT
│   │   ├── verificarAdmin.js      # Validación de roles
│   │   └── errorHandler.js        # Manejo centralizado de errores
│   ├── models/
│   │   ├── Usuario.js             # Modelo Usuario
│   │   ├── Pedido.js              # Modelo Pedido
│   │   ├── Producto.js            # Modelo Producto
│   │   ├── Resena.js              # Modelo Reseña
│   │   ├── Carrito.js             # Modelo Carrito
│   │   ├── Favorito.js            # Modelo Favorito
│   │   ├── Direccion.js           # Modelo Dirección
│   │   ├── Cupon.js               # Modelo Cupón
│   │   ├── Informe.js             # Modelo Informe
│   │   └── index.js               # Exportar todos los modelos
│   ├── utils/
│   │   ├── validacion.js          # Validaciones (email, contraseña, sanitización)
│   │   ├── email.js               # Configuración y templates de email
│   │   └── ipBlocking.js          # Control de intentos de login fallidos
│   ├── controllers/
│   │   ├── authController.js      # Lógica de autenticación
│   │   ├── usuariosController.js  # Lógica de usuarios
│   │   ├── pedidosController.js   # Lógica de pedidos
│   │   ├── productosController.js # Lógica de productos
│   │   ├── resenasController.js   # Lógica de reseñas
│   │   ├── carritoController.js   # Lógica de carrito
│   │   ├── direccionesController.js # Lógica de direcciones
│   │   ├── favoritosController.js # Lógica de favoritos
│   │   ├── cuponesController.js   # Lógica de cupones
│   │   └── adminController.js     # Lógica admin (estadísticas, gestión)
│   └── routes/
│       ├── authRoutes.js          # Rutas de autenticación
│       ├── usuariosRoutes.js      # Rutas de usuarios
│       ├── pedidosRoutes.js       # Rutas de pedidos
│       ├── productosRoutes.js     # Rutas de productos
│       ├── resenasRoutes.js       # Rutas de reseñas
│       ├── carritoRoutes.js       # Rutas de carrito
│       ├── direccionesRoutes.js   # Rutas de direcciones
│       ├── favoritosRoutes.js     # Rutas de favoritos
│       ├── cuponesRoutes.js       # Rutas de cupones
│       └── adminRoutes.js         # Rutas admin
├── tests/
│   └── basic.test.js              # Tests unitarios básicos
├── .env.example                   # Plantilla de variables de entorno
├── .env                           # Variables de entorno (NO commitear)
├── package.json                   # Dependencias y scripts
├── server-new.js                  # Servidor principal refactorizado
└── server.js                      # Servidor antiguo (mantener como backup)
```

## 🚀 Instalación y Uso

### 1. Instalar dependencias
```bash
cd backend
npm install
```

### 2. Configurar variables de entorno
```bash
# Copiar plantilla
cp .env.example .env

# Editar .env con tus valores
nano .env
```

**Variables principales en `.env`:**
```
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://localhost:27017/tiendax
JWT_SECRET=tu_secret_muy_seguro
ADMIN_PASSWORD=tu_password_admin
GMAIL_USER=tu_email@gmail.com
GMAIL_PASS=tu_app_password
EMAIL_ADMIN=admin@tutienda.com
```

### 3. Iniciar servidor
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

### 4. Ejecutar tests
```bash
# Tests una sola vez
npm test

# Tests en modo watch
npm run test:watch
```

## 📝 Cambios Implementados

### ✅ Refactorización Fase 1

#### **Modularización**
- ✅ Controllers separados por módulo
- ✅ Routes definidas en archivos específicos
- ✅ Middleware centralizado
- ✅ Utilidades organizadas por funcionalidad
- ✅ Configuración centralizada

#### **Mejoras de Código**
- ✅ Eliminado código duplicado
- ✅ Manejo de errores centralizado
- ✅ Validaciones reutilizables
- ✅ Documentación con JSDoc
- ✅ Índices en modelos para performance

#### **Testing**
- ✅ Tests básicos con Jest
- ✅ Cobertura de autenticación
- ✅ Validación de endpoints públicos
- ✅ Manejo de errores

#### **Documentación**
- ✅ `.env.example` con todas las variables
- ✅ README.md con estructura
- ✅ Comentarios en código
- ✅ Instrucciones de uso

## 🔐 Seguridad

Características de seguridad implementadas:

- ✅ **Rate Limiting**: Previene fuerza bruta
- ✅ **JWT**: Tokens de 7 días para usuarios, 1 día para admin
- ✅ **Bcryptjs**: Hash con 12 rounds
- ✅ **Bloqueo por IP**: Bloquea después de 3/6/10 intentos fallidos
- ✅ **CORS**: Whitelist de orígenes permitidos
- ✅ **Headers de seguridad**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- ✅ **Validación de entrada**: Sanitización y validación de email
- ✅ **Roles**: Middleware de verificación admin

## 🧪 Testing

### Ejecutar tests
```bash
npm test
```

### Cobertura actual
- ✅ Autenticación (registro, login, validaciones)
- ✅ Endpoints públicos (productos)
- ✅ Health check
- ✅ Manejo de errores

### Tests para agregar (Fase 2)
- [ ] Pedidos (CRUD)
- [ ] Carrito (sincronización)
- [ ] Admin (estadísticas)
- [ ] Reseñas (duplicados)
- [ ] Integración end-to-end

## 📚 API Endpoints

### Autenticación
- `POST /api/registrarse` - Registrar usuario
- `POST /api/login` - Login usuario
- `POST /api/admin/login` - Login admin

### Usuarios
- `GET /api/perfil` - Obtener perfil (requiere token)
- `PUT /api/perfil` - Actualizar perfil (requiere token)

### Productos
- `GET /api/productos/:genero` - Obtener productos público

### Carrito
- `GET /api/carrito` - Obtener carrito (requiere token)
- `PUT /api/carrito` - Actualizar carrito (requiere token)
- `DELETE /api/carrito` - Vaciar carrito (requiere token)

### Pedidos
- `GET /api/pedidos` - Obtener pedidos (requiere token)
- `POST /api/pedidos` - Crear pedido (requiere token)
- `PUT /api/pedidos/:id/estado` - Cambiar estado (requiere admin)

### Admin
- `GET /api/admin/estadisticas` - Estadísticas (requiere admin)
- `GET /api/admin/pedidos` - Todos los pedidos (requiere admin)
- `GET /api/admin/usuarios` - Todos los usuarios (requiere admin)

Ver `src/routes/` para lista completa.

## 🛠️ Próximas Mejoras (Fase 2)

- [ ] Logging con Winston
- [ ] Helmet.js para más seguridad
- [ ] Validación con express-validator
- [ ] Redis para caché y sesiones
- [ ] Swagger/OpenAPI documentation
- [ ] CI/CD pipeline
- [ ] Docker containers
- [ ] Más tests de integración

## 📞 Soporte

Para reportar bugs o sugerencias, crear un issue en el repositorio.

---

**Versión**: 1.0.0 (Refactorizado)  
**Última actualización**: 2026-05-20
