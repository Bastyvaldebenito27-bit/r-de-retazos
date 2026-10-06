# Fotografías que faltan

Casi todas existen ya en el Instagram de la marca; en la mayoría de los casos
es cuestión de recuperar el original, no de volver a fotografiar.

**Formato:** JPG, mínimo 1600 px el lado corto, luz natural, fondo claro.
Sin filtros que cambien el color real de la tela.

## Catálogo — cuadradas (1:1)

De 2 a 4 por producto. **La primera es la portada de la tarjeta**; el resto
salen como miniaturas dentro de la ficha.

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
| Portada | `fotos/principal.jpg` | 4:5 vertical | Un moño o una tote en la mano, luz natural. Es la primera imagen del sitio |
| El taller | `fotos/taller.jpg` | 4:3 | Las manos cosiendo en la máquina |
| El taller | `fotos/telas.jpg` | 1:1 | Retazos y telas apilados |
| El taller | `fotos/empaque.jpg` | 1:1 | El empaque terminado: caja, cinta y tarjeta |
| Sobre mí | `fotos/retrato.jpg` | 3:4 vertical | Ella en el taller. Es la que más confianza genera de todas |
| Instagram | `fotos/ig-1.jpg` … `ig-6.jpg` | 1:1 | Seis publicaciones que quiera destacar |
| Compartir | `og.png` | 1200 × 630 | La que sale al pegar el enlace en WhatsApp o Instagram. **Ya hay una provisional** con el nombre en tipografía; sustitúyela por una foto real |

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
producto, y las de marca en el bloque `marca` (`portada`, `taller`, `telas`,
`empaque`, `retrato`, `instagram`, `logo`, `logoGrande`, `videoHero`). Los
huecos ya tienen el tamaño y la proporción finales, así que no se mueve nada de
la maquetación.

Una regla que conviene saber: **la ruta tiene que ser relativa**, del propio
sitio. Si lleva `http://`, `https://` o empieza por `//`, la página no la pinta
y deja el hueco marcado. Es a propósito: así no se cuela una foto de un banco
de imágenes ni un rastreador de un tercero, ni siquiera por error.
