# R de Retazos — sitio web

Sitio estático: `index.html` y `datos.js`. No hay build, no hay dependencias,
no hay `npm install`. Las funciones de `api/` sólo corren en Vercel y existen
porque la llave de Transbank no puede vivir en el navegador. Se abre en cualquier navegador y se publica subiéndolo tal cual
a Vercel, Netlify, GitHub Pages o un hosting normal.

## Cómo cambiar el contenido

Todo lo que cambia vive en `datos.js`, en el bloque `DATOS`. No hay que tocar
nada más: ni el maquetado, ni el servidor.

### Contacto, Gabriela y su historia

```js
contacto: { whatsapp: "56971371958", instagram: "rderetazos", ciudad: "Santo Domingo, Chile", correo: null },
artesana: { nombre: "Gabriela Gonzales", historia: ["Primer párrafo…", "Segundo…"] },
```

Todos los botones de contacto abren WhatsApp con el mensaje ya escrito. La
historia sale tal cual, párrafo por párrafo, en «Detrás de R de Retazos».

### Precios, medidas y stock

- **Scrunchies:** el precio se pone una vez por familia, en
  `familiasScrunchie` (`precio`, `medida`, `descripcion`). Una pieza puede
  tener su propio `precio`, que manda sobre el de su familia.
- **Resto de productos:** `precio` en cada uno, entero y sin puntos ni `$`.
  Un precio mal escrito no se publica y aparece señalado en la barra.
- **Stock:** opcional, en cualquier pieza o producto. `stock: 3` limita el
  carrito a 3; `stock: 0` lo marca «Agotado». Si no está, no se muestra nada.

### Entregas y pagos

```js
tienda: { activo: false, entrega: {
  retiro: { activo: true, lugar: "Santo Domingo" },
  despacho: [
    { id:"santo-domingo", zona:"Santo Domingo", costo:null, gratisDesde:3, plazo:null },
    { id:"san-antonio",   zona:"San Antonio",   costo:null, gratisDesde:null, plazo:null }
  ] } },
pagos: { medios: ["Transferencia bancaria", "Efectivo", "Tarjeta, con máquina de pago…"] },
```

«Cómo comprar», las preguntas frecuentes de entrega y pago, y el carrito se
arman con esto: no hay que escribir las mismas frases en varios sitios. Lo que
está en `null` no se dice; se apunta en la barra de borrador.

### Agregar un producto

Copia una línea de `productos` y cámbiala. `cat` tiene que ser uno de los `id`
de `categorias`. La primera foto es la portada de la tarjeta; el resto salen
como miniaturas en la ficha. `fotos: []` deja el hueco marcado.

### Fotos, logo y video

En el bloque `marca`: `retrato` (Gabriela), `taller`, `telas`, `empaque`,
`galeria` (más fotos del taller, con su tipo) y `videoHero`. Mientras no haya
foto de Gabriela, en su marco va el sello. La galería «Del taller» se completa
con piezas del catálogo (`galeriaCatalogo`) hasta tener cinco, así que nunca
queda un marco vacío. `FOTOGRAFIAS.md` dice qué va en cada una.

### Dominio

`sitio: { dominio: null }`. Al ponerlo (`"rderetazos.cl"`, sin `https://`), el
pago vuelve siempre a ese dominio.

### Preguntas frecuentes

En `faq`, `r:""` con `falta:"…"` muestra la pregunta y avisa qué dato falta.
`desde:"entrega" | "pagos" | "enLinea"` arma la respuesta con los datos.

## La barra de borrador

La franja oscura de arriba se calcula sola a partir de lo que falte. **No hay
ni una entrada escrita a mano.** Cuando no quede nada pendiente, desaparece
entera sin tocar código (comprobado en navegador con un `DATOS` completo).

## Lo que falta para publicar

- Precio de las demás líneas, si se quieren mostrar. Los 4 tipos de scrunchie
  ya tienen el suyo, de la lista oficial: Simple $2.900, Simple con sesgo
  $3.900, XL con sesgo $4.900 y Doble con sesgo $5.900.
- Medida o diferencia de tamaño de los 4 tipos.
- Costo y plazo del despacho a San Antonio (y a Santo Domingo con menos de 3).
- Confirmar si «despacho gratuito desde 3 pedidos» es 3 productos en una compra.
- Plazo de elaboración de un pedido.
- El video de la portada. El hueco está hecho y vacío a propósito.
- Foto de Gabriela, y fotos de la máquina, las telas y el empaque (las tiene).
- Fotos de cojines, delantales, llaveros y cajas de regalo. Moños, tote bags,
  bolsos para computador, cosmetiqueros y recuerdos ya tienen foto real
  (ver FOTOGRAFIAS.md).
- Que el estuche a rayas se muestre como cosmetiquero, y el permiso de la
  familia para mostrar el encargo «mamita muy especial».
- Los originales de las fotos del catálogo, si los tiene.
- El dominio.
- Que Gabriela lea y apruebe los textos.
- Los datos legales y las condiciones de cambios y devoluciones (ver `LEGAL.md`).
- Para la tienda en línea: lo que dice `WEBPAY.md`.

## Archivos

| | |
|---|---|
| `index.html` | El sitio entero |
| `404.html` | Página de "no existe", con la misma identidad |
| `og.png` | La tarjeta que se ve al pegar el enlace. Lleva el sello original de la marca; cuando haya una foto buena, se puede cambiar por ella |
| `favicon.svg` | **Provisional**: monograma tipográfico. El sello real ya está en `fotos/marca/` |
| `fuentes/` | Cormorant Garamond y Karla, servidas desde el propio sitio |
| `vercel.json` | Cabeceras de caché y de seguridad (sin rutas ni carpeta de salida: se publica la raíz tal cual) |
| `datos.js` | **El único archivo que hay que editar.** Lo leen la página y el servidor |
| `textos.js` | Las frases que se arman con `DATOS` (teléfono, entregas, pagos, mensajes de WhatsApp). Las usan la portada y las páginas legales, para que digan lo mismo |
| `terminos.html`, `privacidad.html`, `cambios.html` | Páginas legales. **Borrador**: lo no definido está marcado como pendiente, llevan `noindex` y un aviso. Ver `LEGAL.md` |
| `legal.css`, `legal.js` | Estilo de las páginas legales y el script que les pone los datos de `DATOS` |
| `LEGAL.md` | Lista interna de datos legales y condiciones que faltan |
| `fotos/marca/` | El sello original de la marca, en dos tamaños |
| `fotos/scrunchies/` | Las 29 piezas del catálogo real, recortadas una a una |
| `api/` | Las funciones del cobro con Webpay — ver `WEBPAY.md` |
| `pruebas/` | Las pruebas del servidor y del navegador — ver `pruebas/README.md`. No se publican |
| `.vercelignore` | Deja `pruebas/` y la documentación interna (`*.md`) fuera del despliegue |
| `.gitignore` | Que ningún `.env` con credenciales llegue al repositorio |

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
- **Los movimientos son de taller, no de demo.** Las tarjetas entran como
  retazos que se posan en la mesa (apenas giradas, se enderezan). Un hilo
  baja por el margen de «Detrás de R de Retazos» a «Cómo comprar», con una
  puntada por sección y una aguja en la punta; al final, unas tijeras lo
  cortan. Las tijeras son las del sello y aparecen dos veces en toda la
  página. Los botones principales llevan una puntada por dentro. La galería
  son copias en papel que se acomodan al bajar. Todo es `transform`,
  `opacity` y `stroke-dashoffset`, con `IntersectionObserver` para no
  trabajar fuera de pantalla y `requestAnimationFrame` para no medir dos
  veces por fotograma. Con «reducir movimiento» no se mueve nada: el hilo
  aparece entero y la galería ya ordenada.
- **Tema claro único**, a propósito: la marca vive en fondos claros.
- **Catálogo a dos columnas ya en el teléfono.** A una sola medía diez pantallas
  él solo.
- Datos estructurados `Store` de schema.org, generados sólo con los campos
  confirmados.

## Comprobado

`npm test` (44 pruebas del servidor y de Webpay) y `npm run test:navegador`
(99 en Chromium). Ver `pruebas/README.md`.

Navegador real a 320, 375, 390, 430, 768 y 1440 px: sin scroll horizontal, un
solo `h1`, cero botones sin nombre, todos de 32 px o más de alto y ninguna
letra bajo 11 px. Los 106 elementos que se alcanzan con el tabulador tienen
anillo de foco visible.

Además, en navegador real:

- la rueda mueve la página de verdad; la variable de la portada va de 0 a 1 y
  vuelve a quedarse quieta;
- con «reducir movimiento», la portada y el carrusel se quedan sin animación;
- todas las imágenes que carga la página son del propio dominio y ninguna
  petición sale del sitio;
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

### Caché de las fotos

`vercel.json` da a `/fotos/` un día de frescura y treinta de
`stale-while-revalidate`. Los nombres de las fotos no llevan hash: si la
artesana cambia una foto por otra mejor conservando el nombre, un año de caché
la dejaría escondida. Así se sirve al instante desde la caché y se comprueba
por detrás. (Las fuentes sí llevan hash, y por eso se cachean un año.)
