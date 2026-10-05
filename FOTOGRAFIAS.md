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

## Logo

El archivo original del monograma, en SVG o PNG con fondo transparente, a
500 px o más. Hoy el sitio usa un monograma tipográfico que **no es el logo
real** y está marcado como pendiente.

## Cómo se incorporan

Se dejan los archivos en una carpeta `fotos/` junto a `index.html` y se
escriben las rutas en el bloque `DATOS`: las de producto en `fotos` de cada
producto, y las de marca en el bloque `marca` (`portada`, `taller`, `telas`,
`empaque`, `retrato`, `instagram`, `logo`). Los huecos ya tienen el tamaño y la
proporción finales, así que no se mueve nada de la maquetación.
