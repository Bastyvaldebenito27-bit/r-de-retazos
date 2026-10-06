# Pruebas

Dos juegos, ninguno se publica (`.vercelignore`) ni agrega dependencias al sitio.

## Servidor y Webpay — sin dependencias

```sh
npm test          # o: node --test
```

Prueban el monto (que siempre calcula el servidor), la firma del pedido, los
ambientes de Transbank, `/api/crear` y los cuatro caminos de vuelta de Webpay
en `/api/retorno`, más la recarga de la página de vuelta. Transbank se simula
reemplazando `fetch`: ninguna prueba sale a internet ni usa una credencial real.

## Navegador — necesita Playwright instalado aparte

```sh
PLAYWRIGHT_MODULE=/ruta/a/node_modules/playwright/index.mjs \
CHROMIUM_PATH=/ruta/a/chrome \
npm run test:navegador
```

Levanta su propio servidor y prueba: el sitio tal como está (WhatsApp,
contenido confirmado, imágenes del propio sitio, hilo, galería, carrusel,
formulario, sello), las terminaciones (teléfono visible, mensajes de WhatsApp por
contexto, enlaces internos, foto que no carga), las tres páginas legales, seis
anchos de pantalla de 320 a 1440 px, el recorrido con
el tabulador, «reducir movimiento», una copia con todos los datos completos (el
día del lanzamiento), otra con un producto agotado y otra con datos hostiles en
cada campo.
