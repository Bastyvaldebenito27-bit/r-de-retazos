# R de Retazos — sitio web

Un solo archivo: `index.html`. No hay build, no hay dependencias, no hay
`npm install`. Se abre en cualquier navegador y se publica subiéndolo tal cual
a Vercel, Netlify, GitHub Pages o un hosting normal.

## Cómo cambiar el contenido

Todo lo que se ve sale de un único bloque llamado `DATOS`, al principio del
`<script>`. No hay que tocar nada más.

### Poner el WhatsApp

```js
whatsapp: "56912345678",   // con código de país, sin + ni espacios
```

Mientras esté vacío, **todos los botones llevan al DM de Instagram**, que es
por donde hoy entran los pedidos. Al poner el número, cambian solos: pasan a
abrir WhatsApp con el mensaje ya escrito, y el formulario de cotización
también. No hay que tocar el maquetado.

### Agregar un producto

Copia una línea de `productos` y cámbiala:

```js
{ id:"bolso-playa", nombre:"Bolso de playa", cat:"bolsos", precio:12000,
  fotos:["fotos/bolso-playa-1.jpg","fotos/bolso-playa-2.jpg"],
  estado:"Disponible",
  desc:"En lona reciclada, con forro interior." },
```

- `cat` tiene que ser uno de los `id` de `categorias`: `accesorios`, `bolsos`,
  `hogar` o `regalos`.
- `precio: null` muestra «Precio a consultar». Con número (sin puntos) muestra
  el precio formateado.
- `fotos: []` deja el hueco marcado con el tamaño exacto de la imagen final.
  **La primera foto es la portada de la tarjeta**; el resto aparecen como
  miniaturas dentro de la ficha. Con una sola no salen miniaturas.
- `estado: null` no muestra sello. Con texto («Disponible», «Por encargo»)
  muestra la etiqueta.
- El orden de la lista es el orden en la página: lo primero es lo que más se
  pide.

### Responder una pregunta frecuente

En `faq`, cambia `r:""` por la respuesta. Mientras esté vacía, la página
muestra la pregunta y avisa de qué dato falta, en vez de inventarse un plazo o
una forma de pago.

### Las fotos de marca y el logo

No sólo el catálogo: **las seis fotos de marca y el logo también salen de
`DATOS`**, en el bloque `marca`. No hay que tocar el maquetado para ninguna.

```js
marca: {
  logo: "logo.svg",            // sustituye al monograma de la cabecera
  portada: "fotos/principal.jpg",
  taller: "fotos/taller.jpg",
  telas: "fotos/telas.jpg",
  empaque: "fotos/empaque.jpg",
  retrato: "fotos/retrato.jpg",
  instagram: ["fotos/ig-1.jpg", "…"]   // hasta 6
},
```

Cada hueco ya tiene el tamaño y la proporción finales, así que poner la ruta no
mueve nada de la maquetación. `FOTOGRAFIAS.md` dice qué foto va en cada una.

### Lo que falta por confirmar

```js
porConfirmar: ["Si la cajita de 3 scrunchies sigue a $5.000"],
```

Vacía la lista cuando esté resuelto y esas líneas salen de la barra.

### Tu nombre y el Instagram

```js
artesana: { nombre: "María" },
instagram: "rderetazos",
```

### La ficha de producto

La foto y el nombre de cada tarjeta abren una ficha con todas sus fotos, el
precio y el botón de consultar. El botón «Consultar» de la tarjeta sigue siendo
el salto directo: quien ya sabe lo que quiere no da un paso de más.

Es un `<dialog>` nativo, así que el foco queda dentro, `Esc` cierra y el fondo
se desactiva sin una línea de código para ello.

## La barra de borrador

La franja oscura de arriba se calcula sola a partir de lo que falte: fotos de
producto y de marca, logo, precios, respuestas, el número y la lista de
`porConfirmar`. **No hay ni una entrada escrita a mano.** Cuando no quede nada
pendiente, desaparece entera sin tocar código.

Está comprobado en navegador, no supuesto: con el bloque `DATOS` relleno del
todo, la barra desaparece, el logo pasa a ser imagen, las cinco fotos de marca
y las seis de Instagram aparecen, y no queda ni un hueco marcado.

## Lo que falta para publicar

- Logo original en alta (hoy va un monograma tipográfico, no el logo real).
- Fotografías reales: las 10 de producto, la principal, taller, telas, empaque,
  retrato, y 6 para la tira de Instagram.
- Precios.
- Número de WhatsApp.
- Plazos de elaboración, modalidades de entrega y formas de pago.
- Confirmar si la cajita de 3 scrunchies sigue a $5.000.
- Confirmar si las prendas intervenidas (camisas) se venden.

## Archivos

| | |
|---|---|
| `index.html` | El sitio entero |
| `404.html` | Página de "no existe", con la misma identidad |
| `og.png` | La tarjeta que se ve al pegar el enlace. **Provisional**: es tipográfica, hay que cambiarla por una foto |
| `favicon.svg` | **Provisional**: monograma tipográfico, no el logo real |
| `fuentes/` | Cormorant Garamond y Karla, servidas desde el propio sitio |
| `vercel.json` | Cabeceras de caché |

## Decisiones técnicas

- **Una sola página con anclas.** El tráfico llega desde el enlace de la bio de
  Instagram; con diez productos y una persona manteniéndolo, partirlo en seis
  páginas añade saltos sin añadir nada.
- **Fuentes propias.** Cormorant Garamond y Karla viven en `fuentes/`, no se
  piden a Google. Son las versiones variables: tres archivos cubren los seis
  pesos que usa la página. Ni una petición del visitante sale del sitio, y se
  ahorran dos handshakes antes de poder pintar texto. Medido en frío: el primer
  pintado baja de 404 a 248 ms y la carga de 527 a 215.

  Ambas son SIL Open Font License 1.1, que permite redistribuirlas; el texto de
  la licencia está en `fuentes/OFL-*.txt`. El nombre de cada archivo lleva un
  hash de su contenido, que es lo que permite cachearlas un año en `vercel.json`
  sin arriesgarse a servir una versión vieja.

- **Sin librerías.** El revelado al bajar usa `IntersectionObserver` y sólo se
  animan `opacity` y `transform`. Con `prefers-reduced-motion` se apaga entero,
  y hay una red de seguridad a los 2,5 s para que ningún texto quede invisible.
- **Tema claro único**, a propósito: la marca vive en fondos claros.
- **Catálogo a dos columnas ya en el teléfono.** A una sola medía diez pantallas
  él solo.
- Datos estructurados `Store` de schema.org, generados sólo con los campos
  confirmados.

## Comprobado

Navegador real a 390, 768 y 1440 px: sin scroll horizontal, un solo `h1`, cero
enlaces sin texto, los 24 revelados se completan, y los enlaces de los anclas
no quedan tapados por la cabecera.
