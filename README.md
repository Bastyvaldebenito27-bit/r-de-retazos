# R de Retazos — sitio web

Sitio estático: `index.html` y `datos.js`. No hay build, no hay dependencias,
no hay `npm install`. Las funciones de `api/` sólo corren en Vercel y existen
porque la llave de Transbank no puede vivir en el navegador. Se abre en cualquier navegador y se publica subiéndolo tal cual
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

- Fotografías reales: 9 de las 10 líneas de producto (los scrunchies ya tienen
  las suyas), la principal, taller, telas, empaque, retrato, y 6 para la tira
  de Instagram.
- Las fotos originales de los scrunchies en alta: las que hay salen recortadas
  del PDF del catálogo, a 374–580 px de lado. Ver `FOTOGRAFIAS.md`.
- El video de la portada. El hueco está hecho y vacío a propósito.
- Precios: 39 en total, 10 líneas de producto y 29 scrunchies.
- Los nombres oficiales de los 29 scrunchies: el catálogo sólo trae fotos, así
  que hoy cada uno se llama por su color y su estampado.
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
| `favicon.svg` | **Provisional**: monograma tipográfico. El sello real ya está en `fotos/marca/` |
| `fuentes/` | Cormorant Garamond y Karla, servidas desde el propio sitio |
| `vercel.json` | Cabeceras de caché |
| `datos.js` | **El único archivo que hay que editar.** Lo leen la página y el servidor |
| `fotos/marca/` | El sello original de la marca, en dos tamaños |
| `fotos/scrunchies/` | Las 29 piezas del catálogo real, recortadas una a una |
| `api/` | Las funciones del cobro con Webpay — ver `WEBPAY.md` |

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
- **La portada se transforma con el scroll de verdad.** Un oyente pasivo mira
  dónde va la sección y escribe un número de 0 a 1 en una variable CSS; el
  dibujo lo hace el CSS a partir de ahí, sólo con `transform` y `opacity`. No se
  captura la rueda, no se llama a `preventDefault`, no hay un contador propio de
  píxeles: el scroll del navegador se comporta exactamente como siempre. Sin
  JavaScript, o con «reducir movimiento», la variable se queda en 1 y la portada
  se ve directamente en su estado final, completa y quieta.
- **El carrusel de scrunchies es scroll horizontal nativo** con `scroll-snap`:
  funciona con el dedo, con la rueda, con las flechas y tabulando. El relieve en
  3D de cada carta se calcula a partir de `scrollLeft` —una sola lectura por
  fotograma, ninguna medida del maquetado—. La carta que se engancha al scroll
  no es la que se gira: si se girase, el navegador tomaría la caja ya
  transformada como punto de anclaje y el carrusel no podría llegar al final.
- **Ninguna imagen puede venir de fuera.** La página sólo pinta rutas
  relativas: si una ruta lleva `http://`, `https://` o empieza por `//`, se
  descarta y queda el hueco marcado. Así no se cuela una foto de un banco de
  imágenes ni un rastreador de un tercero, ni por error.
- **Tema claro único**, a propósito: la marca vive en fondos claros.
- **Catálogo a dos columnas ya en el teléfono.** A una sola medía diez pantallas
  él solo.
- Datos estructurados `Store` de schema.org, generados sólo con los campos
  confirmados.

## Comprobado

Navegador real a 320, 390, 768 y 1440 px: sin scroll horizontal, un solo `h1`,
cero enlaces sin texto, los revelados se completan, y los enlaces de los anclas
no quedan tapados por la cabecera. Los 99 elementos que se alcanzan con el
tabulador tienen anillo de foco visible.

Además, en navegador real:

- la rueda mueve la página de verdad; la variable de la portada va de 0 a 1 y
  vuelve a quedarse quieta;
- con «reducir movimiento», la portada y el carrusel se quedan sin animación;
- las 40 imágenes que carga la página son del propio dominio, y ningún fondo
  apunta a un servidor externo;
- el carrusel: 29 piezas, botones, flechas, Inicio y Fin, filtro por familia y
  la ficha correcta al pulsar una carta;
- con un `DATOS` completo de prueba: la barra de borrador desaparece, no queda
  ni un hueco marcado, el video aparece, el carrito se enciende y un scrunchie
  del catálogo se puede comprar — con el precio puesto por el servidor, no por
  el navegador;
- con un `DATOS` hostil (etiquetas, `javascript:`, CSS roto en cada campo
  nuevo): ni un `alert`, ni un script inyectado, ni una petición fuera del
  sitio.

Primera pintura 124 ms, 316 kB al cargar y un solo origen. Las 29 fotos del
carrusel sólo se piden a medida que se miran.
