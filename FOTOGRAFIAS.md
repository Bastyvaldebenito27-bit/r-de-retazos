# Fotografías que faltan

Casi todas existen ya en el Instagram de la marca; en la mayoría de los casos
es cuestión de recuperar el original, no de volver a fotografiar.

**Formato:** JPG, mínimo 1600 px el lado corto, luz natural, fondo claro.
Sin filtros que cambien el color real de la tela.

## Fotos reales ya incorporadas (ZIP «fotos completas»)

Las entregó la marca. Se pasaron a WebP y se achicaron, sin retoques ni
filtros. Mostrar una pieza **no la pone a la venta ni le da precio**.

| Foto original | Archivo en el sitio | Dónde se ve |
|---|---|---|
| `foto_real_05.jpg` — tres moños | `fotos/productos/monos-tres-telas.webp` | Tarjeta y ficha de «Moños y lazos» |
| `foto_real_06.jpg` — tote a rayas | `fotos/productos/tote-rayas-rosa-rojo.webp` | Tarjeta y ficha de «Tote bags» |
| `foto_real_03.jpg` — bolso para computador con porta cables | `fotos/productos/bolso-computador-rayas.webp` | Tarjeta y ficha de «Bolsos para computador» |
| `foto_real_01.jpg` — estuche a rayas con asa | `fotos/productos/estuche-rayas-rosa-rojo.webp` | Tarjeta y ficha de «Cosmetiqueros» (**por confirmar** que sea uno) |
| `foto_real_04.jpg` — recorte del canasto | `fotos/productos/recuerdos-canasto.webp` | Tarjeta y ficha de «Recuerdos para celebraciones». Sin los textos ni la tarjeta con el nombre |
| `foto_real_02.jpg` — corazones recién cosidos, hilo y tijeras | `fotos/marca/taller-corazones.webp` | Primera foto, la grande, de la galería «Del taller» |
| `foto_real_04.jpg` — entera | `fotos/marca/encargo-mamita-especial.webp` | «Regalos y recuerdos», como ejemplo de encargo. **Por confirmar** el permiso de la familia: la tarjeta lleva el nombre de la bebé |
| `precio_scrunchies.jpg` | — (no se publica) | Fuente de los cuatro precios de scrunchies en `datos.js` |

## Catálogo — 4:5

De 2 a 4 por producto. **La primera es la portada de la tarjeta**; el resto
salen como miniaturas dentro de la ficha. Las tarjetas y las fichas recortan a
4:5 (las piezas sueltas de scrunchies, a 1:1). Las que todavía no tienen foto:
cojines, delantales, llaveros y cajas de regalo.

| Producto | Archivo | Qué debe verse |
|---|---|---|
| Moños y lazos | `fotos/monos-1.jpg` … | El moño XL en la mano, puesto en el pelo, y dos o tres telas distintas |
| Scrunchies | `fotos/scrunchies-1.jpg` … | Varios juntos y uno puesto en la muñeca o el pelo |
| Tote bags | `fotos/tote-1.jpg` … | Colgada, en uso, y el detalle del denim reciclado |
| Bolsos para computador | `fotos/porta-1.jpg` … | El bolso y su porta cables a juego |
| Cosmetiqueros | `fotos/cosmetiqueros-1.jpg` … | Cerrado y abierto con cosas dentro, para que se entienda el tamaño |
| Cojines | `fotos/cojines-1.jpg` … | Sobre un sofá o cama, y el detalle de la terminación con pestaña |
| Delantales | `fotos/delantales-1.jpg` … | Colgados y puesto, con el bolsillo visible |
| Llaveros | `fotos/llaveros-1.jpg` … | En la mano y colgando de un bolso, para dar escala |
| Cajas de regalo | `fotos/cajas-1.jpg` … | La caja abierta con lo que lleva dentro, cinta y tarjeta |
| Recuerdos | `fotos/recuerdos-1.jpg` … | Varios juntos, como se entregan |

## Marca

| Dónde | Archivo | Proporción | Qué debe verse |
|---|---|---|---|
| Detrás de R de Retazos | `retrato` | 3:4 vertical | Gabriela en su taller, o sus manos trabajando. Mientras no esté, va el sello |
| Galería «Del taller» | `taller` | cualquiera (se recorta cuadrada) | Las manos cosiendo en la máquina |
| Galería «Del taller» | `telas` | cualquiera | Retazos y telas |
| Galería «Del taller» | `empaque` | cualquiera | El empaque terminado: caja, cinta y tarjeta |
| Galería «Del taller» | `galeria: [...]` | cualquiera | Más fotos: productos puestos, proceso, materiales. Cada una con su `tipo` |
| Portada | `portada` | cualquiera (disco redondo) | Sólo si no hay video. Con el video no hace falta |
| Compartir | `og.png` | 1200 × 630 | La que sale al pegar el enlace en WhatsApp o Instagram. Hoy lleva el sello original con el nombre; cuando haya una foto real buena, puede reemplazarla |

## Logo — resuelto

Ya está. El sello original que mandó la marca vive en `fotos/marca/logo.webp`
(512 px) y `fotos/marca/logo-1024.webp` (1024 px). Es la misma imagen que
llegó: no está redibujada ni reescrita, sólo se le quitó el fondo blanco para
que apoye sobre el marfil de la página. Se usa en la cabecera y en el centro
de la portada.

Si algún día aparece el original en vector (SVG o AI), vale la pena cambiarlo:
pesaría menos y se vería perfecto a cualquier tamaño.

## Catálogo de scrunchies — recortado, pero justo de resolución

Las 29 piezas de `fotos/scrunchies/` salen del PDF
*Catalogo_Scrunchies_R_de_Retazos*, recortadas una a una de cada página.
**No hay ni una imagen de archivo ni de banco de imágenes.**

El problema: el PDF guarda cada página como una sola imagen a 128 ppi, así que
cada scrunchie ocupa entre **374 y 580 px** de lado. Alcanza para la rejilla y
para el carrusel en una pantalla normal, pero se queda corto en pantallas
retina, donde la foto se ve ligeramente blanda.

**Lo que hace falta:** los archivos originales de esas mismas fotos, tal como
salieron de la cámara o del teléfono, a 1200 px o más por lado. Son las mismas
fotos, no hay que repetir la sesión. Se dejan en `fotos/scrunchies/` con el
mismo nombre y no hay que tocar nada más.

El catálogo tampoco trae texto: ni nombres, ni códigos, ni precios. Hoy cada
pieza se llama por su color y su estampado («Estrellas de mar fucsia»,
«Leopardo durazno · sesgo negro»). En cuanto haya nombres oficiales, se
cambian en `DATOS.scrunchies`.

## Video de la portada

Hueco preparado, vacío a propósito. En el centro del sello de la portada hay un
disco que espera el video real de la marca. Mientras `DATOS.marca.videoHero`
sea `null` no se pone nada en su lugar: ni un video de archivo, ni una modelo
generada.

Cuando el archivo exista:

```js
videoHero: { src:"fotos/marca/portada.mp4", cartel:"fotos/marca/portada.webp", alt:"" }
```

MP4 (H.264), vertical o cuadrado, **sin audio**, de 8 segundos o menos, que
funcione en bucle. `cartel` es el primer fotograma en imagen, para que no haya
un hueco oscuro mientras carga.

## Cómo se incorporan

Se dejan los archivos en una carpeta `fotos/` junto a `index.html` y se
escriben las rutas en el bloque `DATOS`: las de producto en `fotos` de cada
producto, y las de marca en el bloque `marca` (`retrato`, `taller`, `telas`,
`empaque`, `galeria`, `portada`, `logo`, `logoGrande`, `videoHero`). Los
huecos ya tienen el tamaño y la proporción finales, así que no se mueve nada de
la maquetación. La galería se completa con piezas del catálogo hasta tener
cinco fotos: nunca queda un marco vacío.

No hace falta mandar fotos «para el teléfono»: cada foto se recorta sola al
hueco que le toca. Basta con que lo importante quede al centro.

Una regla que conviene saber: **la ruta tiene que ser relativa**, del propio
sitio. Si lleva `http://`, `https://` o empieza por `//`, la página no la pinta
y deja el hueco marcado. Es a propósito: así no se cuela una foto de un banco
de imágenes ni un rastreador de un tercero, ni siquiera por error.
