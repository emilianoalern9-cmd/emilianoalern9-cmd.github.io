# Índice de Seres Místicos

Enciclopedia visual de seres míticos, criptidos y entidades de la tradición oral mundial. Proyecto web estático, sin dependencias externas, desplegable en GitHub Pages.

---

## Estructura de archivos

```
raíz/
├── index.html
├── README.md
│
├── css/
│   ├── base.css        ← variables, reset, header, grid, partículas
│   ├── cards.css       ← tarjetas y modal de detalle
│   └── menus.css       ← dropdowns y modales flotantes
│
├── js/
│   ├── config.js       ← categorías, iconos, constantes
│   ├── state.js        ← estado global y localStorage
│   ├── cache.js        ← índices invertidos y filtros
│   ├── ui.js           ← DOM, tooltip, búsqueda, sonidos, partículas
│   ├── menus.js        ← constructores de menús y CSV
│   ├── creatures.js    ← tarjetas, modal, render con diffing
│   └── app.js          ← init, eventos, carga de datos
│
├── dtsk/
│   ├── Datos1.json     ← primera tanda de criaturas
│   ├── Datos2.json     ← segunda tanda (agregar cuando se necesite)
│   └── ...             ← el programa carga todos los que existan
│
├── img/                ← imágenes de criaturas (.jpeg únicamente)
└── img2/               ← recursos del programa (.gif, .png, .jpeg)
```

---

## Cómo agregar criaturas

El programa carga `dtsk/Datos1.json`, luego `Datos2.json`, etc. automáticamente.
Cuando un archivo no existe, se detiene. No hay límite de archivos.

**Recomendación de tamaño:** ~150-200 criaturas por archivo JSON.

**Formato de cada entrada:**

```json
[
  {
    "id": "identificador-unico-sin-espacios",
    "nombre": "Nombre del Ser",
    "morfologia": "Humanoide",
    "tipo": "Mitológico",
    "elemento": "Aéreo",
    "avistamiento": "Tradición oral",
    "ubicacion": "Europa Central",
    "epoca": "Edad Media",
    "subcategorias": "demonio, alado, nocturno",
    "descripcion": "Descripción larga del ser...",
    "links": ["https://fuente1.com", "https://fuente2.com"],
    "foco": 13
  }
]
```

---

## Valores válidos por campo

### morfologia
| Valor | Ícono |
|---|---|
| Humano | 🧑 |
| Humanoide | 🧝 |
| Mamífero | 🦌 |
| Híbrido | 🦄 |
| Ave | 🕊️ |
| Reptil | 🐍 |
| Pez | 🐟 |
| Insecto | 🦗 |
| Amorfo | 🌀 |
| Etéreo | 🌫️ |
| Artificial | 🤖 |
| Otro | 🔮 |

### tipo
| Valor | Ícono |
|---|---|
| Mitológico | 🏛️ |
| Criptido | 🐾 |
| Difuso | 🌑 |

### elemento
| Valor | Ícono |
|---|---|
| Aéreo | 💨 |
| Acuático | 💧 |
| Terrestre | 🌿 |
| Subterráneo | ⛏️ |
| Anfibio | 🐸 |
| Misceláneo | ⚗️ |

### avistamiento
| Valor | Ícono |
|---|---|
| Grabado / Capturado | 📹 |
| Documentado | 📜 |
| Crónicas | 📖 |
| Avistamiento | 👁️ |
| Ficción | 📚 |
| Tradición oral | 🗣️ |
| Difuso | 🌀 |

### foco (posición de recorte de imagen)
Cuadrícula 5×5 — el número indica de dónde recortar la imagen en la tarjeta:

```
 1  2  3  4  5    ← fila superior
 6  7  8  9 10
11 12 13 14 15    ← 13 = centro (default)
16 17 18 19 20
21 22 23 24 25    ← fila inferior
```

---

## Qué editar para cambiar cada cosa

| Qué cambiar | Archivo |
|---|---|
| Colores, tipografía, espaciados globales | `css/base.css` (sección `:root`) |
| Aspecto de tarjetas, imagen, footer | `css/cards.css` |
| Dropdowns y modales flotantes | `css/menus.css` |
| Categorías, íconos, valores válidos | `js/config.js` |
| Estado global, localStorage | `js/state.js` |
| Lógica de filtros e índices | `js/cache.js` |
| Sonidos, partículas, tooltip, búsqueda | `js/ui.js` |
| Menús de filtro, CSV, ayuda, config | `js/menus.js` |
| Favoritos, revisados, render, modal | `js/creatures.js` |
| Eventos, carga de datos, arranque | `js/app.js` |

---

## Recursos en img2/

| Archivo | Uso |
|---|---|
| `icono4.png` | Favicon del sitio |
| `esquina.gif` | Decorativo del header en escritorio |
| `esquina.png` | Decorativo del header en móvil |
| `anuncio1.gif` | Imagen del panel de contacto |
| `non.jpeg` | Imagen de "sin resultados" |

---

## Atajos de teclado (modal abierto)

| Tecla | Acción |
|---|---|
| `←` / `→` | Navegar entre criaturas |
| `F` | Marcar / desmarcar favorito |
| `R` | Marcar / desmarcar revisado |
| `L` | Abrir primer enlace externo |
| `Esc` | Cerrar modal |

---

## Comportamientos importantes

- **Filtros vacíos**: las opciones sin resultados no aparecen en los menús.
- **Opción única**: si solo hay una opción disponible en un filtro, se bloquea (no tiene sentido filtrar por ella).
- **Revisado automático al abrir enlace**: al hacer clic en un link de una criatura, se marca como revisada siempre, sin importar el modo de revisión configurado.
- **Render sin parpadeo**: el sistema usa diffing ligero — si cambian ≤4 tarjetas, solo se reemplazan esas; si cambian más, se animan con entrada escalonada.
- **Scroll bloqueado** cuando hay un menú o modal abierto.
- **6 columnas** en pantallas ≥ 1200px de ancho.
- **Sonidos sutiles** en interacciones: clic, favorito, revisado, navegación, abrir/cerrar.
- **Partículas ambientales** flotantes en el fondo.

---

## Despliegue en GitHub Pages

1. Subir todos los archivos al repositorio.
2. Copiar las carpetas `img/` e `img2/` con sus contenidos originales.
3. En Settings → Pages → Source: rama `main`, carpeta raíz `/`.
4. El sitio queda en `https://usuario.github.io/repositorio`.
