# 📝 Sistema de Productos Dinámicos

## ¿Cómo funciona

Tu tienda ahora carga productos automáticamente desde archivos JSON. **No necesitas editar el HTML para agregar productos**.

## 📂 Archivos de Productos

Los productos se encuentran en la carpeta `/datos/`:
- `hombre.json` - Productos para la categoría Hombre
- `mujer.json` - Productos para la categoría Mujer  
- `niño.json` - Productos para la categoría Niño

## ➕ Cómo Agregar un Nuevo Producto

1. Abre el archivo JSON correspondiente (ej: `datos/hombre.json`)
2. Agrega un nuevo objeto dentro del array `"productos"`:

```json
{
  "id": 5,
  "nombre": "Camisa Formal",
  "categoria": "camisetas",
  "precio": 150000,
  "rating": 5,
  "imagen_front": "https://tu-imagen-1.jpg",
  "imagen_back": "https://tu-imagen-2.jpg"
}
```

### Campos obligatorios:
- **id**: Número único para el producto
- **nombre**: Nombre del producto
- **categoria**: Debe coincidir con los filtros de la página (ej: "jeans", "camisetas", "ropa-interior")
- **precio**: Precio en pesos (sin símbolo)
- **rating**: Puntuación 1-5
- **imagen_front**: URL de la imagen frontal
- **imagen_back**: URL de la imagen trasera

## 🎨 Ejemplo Completo

```json
{
  "productos": [
    {
      "id": 1,
      "nombre": "Camiseta Oversize",
      "categoria": "camisetas",
      "precio": 75000,
      "rating": 4,
      "imagen_front": "https://picsum.photos/400/500?1",
      "imagen_back": "https://picsum.photos/400/500?2"
    },
    {
      "id": 2,
      "nombre": "Jeans Slim Fit",
      "categoria": "jeans",
      "precio": 120000,
      "rating": 5,
      "imagen_front": "https://picsum.photos/400/500?3",
      "imagen_back": "https://picsum.photos/400/500?4"
    }
  ]
}
```

## 🔄 Cómo Modificar un Producto

1. Encuentra el producto en el JSON
2. Edita los campos que desees
3. **Guarda el archivo** - Los cambios se reflejarán automáticamente en la tienda

## ⚠️ Importante

- Asegúrate que el JSON sea válido (sin errores de sintaxis)
- Las categorías deben coincidir con los botones de filtro en la página
- Usa URLs válidas para las imágenes
- Los IDs deben ser únicos dentro de cada archivo

## 📋 Categorías Disponibles

### Hombre
- `jeans` - Pantalones
- `camisetas` - Camisetas y chaquetas
- `ropa-interior` - Ropa interior

### Mujer
- `jeans` - Jeans
- `blusas` - Blusas
- `vestidos` - Vestidos
- `ropa-interior` - Ropa interior

### Niño
- `jeans` - Pantalones
- `camisetas` - Camisetas y sudaderas
- `ropa-interior` - Ropa interior

## 🚀 Scripts Involucrados

- `scripts/productos.js` - Carga y renderiza los productos desde JSON
- `scripts/filtros.js` - Maneja los filtros de categoría
- `scripts/carrito-add.js` - Agrega productos al carrito

¡Listo! Ahora puedes agregar productos sin tocar el código HTML. 🎉
