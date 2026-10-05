# Cobro en línea con Webpay

Está construido y probado, pero **nace apagado**. Mientras `tienda.activo` sea
`false` en `datos.js`, la web se comporta exactamente como antes: se pide por
mensaje y no aparece ni un botón de comprar.

## Cómo funciona

```
navegador              /api/crear                 Webpay                /api/retorno
  carrito  ──id+cantidad──►  calcula el total  ──► el cliente paga ──►  confirma (PUT)
                             crea la transacción                        comprueba el monto
                             firma el pedido                            avisa por correo
                                                                        muestra el resultado
```

**El navegador nunca dice cuánto se cobra.** Manda qué quiere y cuántos; el
monto lo arma el servidor con los precios de `datos.js`. Si alguien edita el
precio en la consola del navegador, el cargo sigue siendo el correcto.

**No hay base de datos.** El pedido viaja firmado con HMAC-SHA256 dentro de la
`return_url`. A la vuelta se comprueba la firma: llega tal como salió, o no
llega. Y el total se vuelve a calcular desde los mismos precios, así que no hay
dos fuentes que puedan discrepar.

**Confirmar es obligatorio.** Hasta que Transbank recibe el `PUT`, el cargo no
queda cursado. Después se compara el monto cobrado con el calculado: si no
cuadra, el pedido **no** se trata como pagado y la página lo dice.

## Variables de entorno (en Vercel, nunca en el repositorio)

| Variable | Para qué | Obligatoria |
|---|---|---|
| `FIRMA_SECRETO` | Firma el pedido en la `return_url`. Una cadena larga y aleatoria. | **Sí** |
| `TBK_AMBIENTE` | `integracion` (por defecto) o `produccion`. | Para cobrar de verdad |
| `TBK_COMMERCE_CODE` | Código de comercio de Transbank. | Para `produccion` |
| `TBK_API_KEY` | Llave secreta de Transbank. | Para `produccion` |
| `RESEND_API_KEY` | Enviar el aviso de pedido por correo. | Para recibir pedidos |
| `CORREO_DESTINO` | A dónde llega el aviso. | Para recibir pedidos |
| `CORREO_DESDE` | Remitente. Por defecto `onboarding@resend.dev`. | No |

En integración, el código y la llave son los públicos de prueba de Transbank:
no son secretos y no mueven dinero real.

**Si falta el correo, ningún pedido se pierde**: queda completo en el registro
de la función (Vercel → Logs) y en el portal de Transbank, y el comprador ve su
número de pedido en pantalla.

## Probar sin contrato

Con `TBK_AMBIENTE=integracion` y `FIRMA_SECRETO` puesta, el flujo funciona de
punta a punta con las tarjetas de prueba de Transbank:

| | |
|---|---|
| Aprueba | VISA **4051 8856 0044 6623**, CVV 123, cualquier fecha futura |
| Rechaza | MASTERCARD **5186 0595 5959 0568**, CVV 123 |
| Si pide clave del banco | RUT **11.111.111-1**, clave **123** |

## Para encender el cobro de verdad

Nada de esto es código:

1. **Precios publicados.** Hoy ninguno de los diez productos tiene precio, y sin
   precio no hay nada que cobrar.
2. **Contrato con Transbank.** Requisitos: inicio de actividades en el SII
   (sirve persona natural), cuenta corriente a nombre del RUT del comercio —no
   cuenta vista—, sin morosidades en el boletín, y rubro coherente. Persona
   natural sin inicio de actividades tiene tope de $200.000 por transacción.
3. **Textos legales y datos del comercio visibles en el sitio.** Transbank los
   revisa antes de aprobar: términos y condiciones, política de privacidad, y
   RUT, razón social, dirección, correo y teléfono. **No están escritos**, y no
   los puede redactar quien hace la web.
4. **Boleta electrónica.** Ninguna pasarela la emite. Hay que emitirla aparte.
5. **Costo del despacho** definido en `datos.js`, o dejar sólo retiro.

Cuando estén los cinco: cargar las variables de producción en Vercel y poner
`tienda.activo: true` en `datos.js`.

## Comprobado

81 pruebas automatizadas, todas pasando:

- **Totales (28):** el precio que manda el navegador se ignora; cantidades 0,
  negativas, decimales y disparatadas se rechazan; producto inexistente o sin
  precio se rechaza; despacho sin costo definido se rechaza; retiro no suma.
- **Firma (4):** ida y vuelta, firma manipulada, cuerpo cambiado con firma
  vieja, y basura: los tres últimos se rechazan.
- **Retorno (19):** pago autorizado con monto que cuadra; monto que **no**
  cuadra (revisión manual, no se da por bueno); tarjeta rechazada; comprador
  que anula; llegada sin token; firma manipulada; y Transbank sin responder
  —en ese caso la página dice explícitamente *no vuelvas a pagar*—.
- **Carrito en navegador (34):** a 390 y 1440 px, con la tienda abierta y
  cerrada. Sólo los productos con precio ofrecen «Agregar»; las cantidades y
  los totales cuadran; el despacho suma y pide dirección; la validación frena
  nombre, correo y dirección; y al pagar sale hacia Webpay por POST mandando
  **sólo id y cantidad**.

El ambiente de integración de Transbank está tras un WAF que bloquea las IP de
centro de datos, así que la llamada real sólo se puede probar desplegada.
