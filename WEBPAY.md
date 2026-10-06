# Cobro en línea con Webpay

Está construido y probado, pero **nace apagado**. Mientras `tienda.activo` sea
`false` en `datos.js`, la web se comporta exactamente como antes: se pide por
mensaje y no aparece ni un botón de comprar.

## Cómo funciona

```
navegador              /api/crear                 Webpay                /api/retorno
  carrito  ──id+cantidad──►  calcula el total  ──► el cliente paga ──►  confirma (PUT)
                             crea la transacción   en el sitio de       o consulta el estado (GET)
                             firma el pedido       Transbank            comprueba el monto
                             (cookie HttpOnly)                          avisa por correo
                                                                        muestra el resultado
```

Integración con el **API REST oficial de Webpay Plus, versión 1.2**
(`/rswebpaytransaction/api/webpay/v1.2/transactions`), el mismo que usan los SDK
oficiales de Transbank por dentro. Se habla con él directamente con `fetch`,
sin el SDK de npm: el sitio no tiene dependencias ni paso de build, y el SDK
no agregaría nada que este flujo necesite.

**El navegador nunca dice cuánto se cobra.** Manda qué quiere y cuántos; el
monto lo arma el servidor con los precios de `datos.js`. Si alguien edita el
precio en la consola del navegador, el cargo sigue siendo el correcto.

**La tarjeta nunca pasa por este sitio.** El comprador la escribe en el
formulario de Webpay, en el dominio de Transbank. Aquí no hay ningún campo
para tarjetas.

**No hay base de datos.** El pedido viaja firmado con HMAC-SHA256 en una cookie
`HttpOnly; Secure; SameSite=None`, una por orden, que sólo se manda a
`/api/retorno` y caduca en una hora. A la vuelta se comprueba la firma y que la
orden y la sesión sean las que devuelve Transbank: llega tal como salió, o no
llega. El total se vuelve a calcular desde los mismos precios.

> Antes el pedido viajaba dentro de la `return_url`, que así medía 314
> caracteres. Transbank no acepta más de 256 (255 en sus SDK): **la creación
> de la transacción habría fallado siempre**. Ahora la `return_url` es fija,
> `https://<dominio>/api/retorno`, y una prueba vigila que no pase del límite.

**Confirmar es obligatorio.** Hasta que Transbank recibe el `PUT`, el cargo no
queda cursado. Se da por aprobado sólo con `status: AUTHORIZED` y
`response_code: 0`, y si el monto cobrado es exactamente el calculado.

### Las cuatro maneras de volver

Son las que documenta Transbank; cada una llega con datos distintos.

| Llega | Qué pasó | Qué se hace | Se ve |
|---|---|---|---|
| sólo `token_ws` | flujo normal | se confirma | **Pago aprobado** o **Pago rechazado** |
| `TBK_TOKEN` | anuló en el formulario | nada | **Pago cancelado** |
| sólo `TBK_ORDEN_COMPRA` | se acabó el tiempo | nada | **Pago cancelado** |
| `token_ws` y `TBK_TOKEN` | error en el formulario | nada | **Error al procesar el pago** |
| nada | llegada inesperada | nada | **Error al procesar el pago** |

### Recargar la página de vuelta

No crea otra orden ni cobra otra vez. La segunda confirmación la rechaza
Transbank; entonces se consulta el estado (`GET`). Si esa misma vuelta ya se
había confirmado —queda marcado en la cookie firmada— se muestra el mismo
resultado, **sin repetir el aviso por correo**. Si no hay esa marca, la página
no dice «aprobado»: dice que no vuelva a pagar y que escriba con su número de
orden.

### Cuando algo no cuadra

- **Monto distinto** al calculado: no se da por bueno; se pide no volver a pagar.
- **Sin la cookie** (otro navegador, cookies borradas) pero Transbank lo
  aprobó: se dice que el pago quedó hecho, con el número de orden y el monto, y
  se pide escribir por WhatsApp. No se inventa el detalle del pedido.
- **Transbank no responde**: se dice que no vuelva a pagar.

## Variables de entorno (en Vercel, nunca en el repositorio)

| Variable | Para qué | ¿Hace falta para probar? | ¿Para producción? |
|---|---|---|---|
| `FIRMA_SECRETO` | Firma el pedido. Una cadena larga y aleatoria. La generamos nosotros. | **Sí** | **Sí** |
| `TRANSBANK_ENVIRONMENT` | `integration` (o vacía) o `production`. | No | **Sí**: `production` |
| `TRANSBANK_COMMERCE_CODE` | Código de comercio que entrega Transbank al firmar el contrato. | No | **Sí** |
| `TRANSBANK_API_KEY` | Llave secreta que entrega Transbank. | No | **Sí** |
| `RESEND_API_KEY` | Enviar el aviso de pedido por correo. | No | Recomendada |
| `CORREO_DESTINO` | A qué correo llega el aviso. | No | Recomendada |
| `CORREO_DESDE` | Remitente. Por defecto `onboarding@resend.dev`. | No | Con dominio propio |

**Producción no se enciende por accidente.** Hace falta
`TRANSBANK_ENVIRONMENT=production` *y* las dos credenciales. Un valor mal
escrito (`prod`, `produccion `…) no cae en silencio a pruebas: se rechaza y el
pago muestra «no disponible». Y en integración se usan **siempre** las
credenciales públicas de prueba que publica Transbank, aunque haya una real
cargada: una llave real nunca viaja a un servidor de pruebas.

Ninguna credencial se escribe en el código (salvo la pública de pruebas, que
Transbank publica en su documentación), ninguna llega al navegador y ninguna
se imprime en los registros.

**Si falta el correo, ningún pedido se pierde**: queda completo en el registro
de la función (Vercel → Logs) y en el portal de Transbank, y el comprador ve su
número de pedido en pantalla y un botón para escribir por WhatsApp.

## Probar sin contrato

Con `FIRMA_SECRETO` puesta y `TRANSBANK_ENVIRONMENT` vacía, el flujo funciona
de punta a punta contra el ambiente de integración, con las tarjetas de prueba
de Transbank:

| | |
|---|---|
| Aprueba | VISA **4051 8856 0044 6623**, CVV 123, cualquier fecha futura |
| Rechaza | MASTERCARD **5186 0595 5959 0568**, CVV 123 |
| Si pide clave del banco | RUT **11.111.111-1**, clave **123** |

Para eso la tienda tiene que estar encendida (`tienda.activo: true`) y al menos
un producto con precio, aunque sea sólo en un despliegue de prueba.

## Para encender el cobro de verdad

Nada de esto es código:

1. **Precios publicados.** Hoy ningún producto tiene precio. Los scrunchies
   toman el de su familia: bastan cuatro.
2. **Contrato con Transbank.** Requisitos: inicio de actividades en el SII
   (sirve persona natural), cuenta corriente a nombre del RUT del comercio —no
   cuenta vista—, sin morosidades en el boletín, y rubro coherente. Persona
   natural sin inicio de actividades tiene tope de $200.000 por transacción.
3. **Textos legales y datos del comercio visibles en el sitio.** Transbank los
   revisa antes de aprobar: términos y condiciones, política de privacidad, y
   RUT, razón social, dirección, correo y teléfono. **No están escritos.**
4. **Boleta electrónica.** Ninguna pasarela la emite. Hay que emitirla aparte.
5. **Costo de despacho** de cada zona en `datos.js`. Hoy sólo se puede pagar en
   línea el retiro, y el despacho en Santo Domingo desde 3 productos.
6. **Validación de Transbank** del sitio en producción, con el dominio final.

Cuando estén: cargar las variables de producción en Vercel y poner
`tienda.activo: true` en `datos.js`.

## Comprobado

`npm test` — 44 pruebas del servidor, sin dependencias y sin salir a internet
(Transbank se simula): totales, stock, despacho por zona, firma, órdenes
únicas, ambientes, `/api/crear`, los cinco caminos de vuelta, la recarga, el
monto que no cuadra, la cookie manipulada, un error inesperado (nunca un 500 genérico) y que ninguna credencial se filtre.
`npm run test:navegador` — 99 pruebas en Chromium, incluido el carrito con
todos los datos completos. Ver `pruebas/README.md`.

El ambiente de integración de Transbank está detrás de un WAF que bloquea las
IP de centro de datos, así que la llamada real sólo se puede probar desplegada.
