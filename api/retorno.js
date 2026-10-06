import { DATOS } from "../datos.js";
import {
  verificar, firmar, armarPedido, confirmarTransaccion, estadoTransaccion, avisarPorCorreo,
  aprobado, leerCookies, nombreCookie, cookiePedido
} from "./_tienda.js";

/* ===========================================================================
   Paso 2: Webpay devuelve al comprador aquí.

   Transbank documenta cuatro maneras de llegar, y cada una trae datos
   distintos (por GET, o por POST en el ambiente de integración):

     1. Flujo normal ............ sólo token_ws        → hay que confirmar.
     2. Se acabó el tiempo ...... TBK_ORDEN_COMPRA y TBK_ID_SESION, sin token.
     3. Anuló en el formulario .. TBK_TOKEN, TBK_ORDEN_COMPRA, TBK_ID_SESION.
     4. Error en el formulario .. token_ws y TBK_TOKEN a la vez.

   Sólo el 1 se confirma. Y aun así, no se dice «aprobado» hasta que Transbank
   responde status AUTHORIZED con response_code 0, y el monto cobrado es
   exactamente el que calculamos aquí con los precios de datos.js.

   Recargar esta página no crea nada ni cobra dos veces: la segunda
   confirmación la rechaza Transbank, y entonces se consulta el estado. Si una
   vuelta anterior ya lo había confirmado (queda marcado en la cookie firmada),
   se vuelve a mostrar el mismo resultado, sin repetir el aviso por correo.
   =========================================================================== */

const ESTADO = {
  aprobado: "Pago aprobado",
  rechazado: "Pago rechazado",
  cancelado: "Pago cancelado",
  error: "Error al procesar el pago"
};

const esc = (s) => String(s == null ? "" : s)
  .replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
const pesos = (n) => "$" + Number(n).toLocaleString("es-CL");

const tel = String((DATOS.contacto && DATOS.contacto.whatsapp) || "").replace(/\D/g, "");
const whatsapp = (texto) => tel.length > 7
  ? "https://wa.me/" + tel + "?text=" + encodeURIComponent(texto) : "";

/* Sólo se aceptan textos cortos: lo que no venga de Transbank no se lee. */
function parametros(req) {
  const q = req.query || {}, b = (req.body && typeof req.body === "object") ? req.body : {};
  const uno = (k) => {
    const v = b[k] != null ? b[k] : q[k];
    const s = Array.isArray(v) ? v[0] : v;
    return typeof s === "string" ? s.trim().slice(0, 100) : "";
  };
  return { token: uno("token_ws"), tbkToken: uno("TBK_TOKEN"), orden: uno("TBK_ORDEN_COMPRA"), sesion: uno("TBK_ID_SESION") };
}

function pagina(res, codigo, estado, cuerpo) {
  const titulo = ESTADO[estado];
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Robots-Tag", "noindex");
  return res.status(codigo).send(`<!doctype html>
<html lang="es-CL"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex"><title>${esc(titulo)} · R de Retazos</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>
/* Las mismas fuentes del sitio, servidas desde el propio sitio. */
@font-face{font-family:'Cormorant Garamond';font-style:normal;font-weight:400 500;font-display:swap;src:url(/fuentes/cormorant-garamond-400_500-normal-latin.5d618c46.woff2) format('woff2')}
@font-face{font-family:'Karla';font-style:normal;font-weight:400 700;font-display:swap;src:url(/fuentes/karla-400_700-normal-latin.690fabf2.woff2) format('woff2')}
:root{color-scheme:light;--marfil:#FAF6F0;--arena:#F2EAE0;--lino:#E7DACB;--carbon:#2E2A26;
  --taupe:#6B6057;--salvia:#5E6E52;--salvia2:#4B5942;--terracota:#9F553E;--mauve:#7F6168}
*{box-sizing:border-box;margin:0}
body{background:var(--marfil);color:var(--taupe);font:16px/1.65 "Karla",system-ui,sans-serif;
  padding:3rem 20px;display:flex;justify-content:center}
.c{width:100%;max-width:38rem}
.sello{width:64px;height:64px;margin-bottom:1.6rem}
.estado{font-size:.74rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase}
.estado.ok{color:var(--salvia)} .estado.no{color:var(--terracota)}
h1{font:500 clamp(1.9rem,5.5vw,2.7rem)/1.1 "Cormorant Garamond",Georgia,serif;color:var(--carbon);margin-top:.5rem}
p{margin-top:1rem;max-width:46ch}
table{width:100%;margin-top:1.8rem;border-collapse:collapse;font-size:.95rem}
td{padding:.6rem 0;border-bottom:1px solid var(--lino)}
td.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;padding-left:1rem;vertical-align:top}
tr.t td{border-bottom:0;padding-top:1rem;font-weight:700;color:var(--carbon);font-size:1.05rem}
.caja{margin-top:1.8rem;background:#fff;border:1px solid var(--lino);border-radius:20px;padding:1.4rem}
.rot{font-size:.8rem;letter-spacing:.14em;text-transform:uppercase;color:var(--mauve)}
.rot+.orden{margin-top:.35rem}
.orden{font-family:ui-monospace,monospace;font-size:1.1rem;color:var(--carbon);letter-spacing:.02em}
.acc{display:flex;flex-wrap:wrap;gap:.6rem;margin-top:2rem}
a.b{display:inline-flex;padding:.78rem 1.45rem;border-radius:999px;background:var(--salvia);color:#fff;
  text-decoration:none;font-weight:700;font-size:.92rem}
a.b:hover{background:var(--salvia2)}
a.b.l{background:transparent;color:var(--carbon);border:1.5px solid var(--lino)}
a.b:focus-visible{outline:2.5px solid var(--carbon);outline-offset:3px}
</style></head><body><main class="c">
<img class="sello" src="/fotos/marca/logo.webp" alt="R de Retazos" width="64" height="64">
<p class="estado ${estado === "aprobado" ? "ok" : "no"}">${esc(titulo)}</p>
${cuerpo}</main></body></html>`);
}

function acciones(textoWa) {
  const wa = textoWa ? whatsapp(textoWa) : "";
  return '<div class="acc">' +
    (wa ? `<a class="b" href="${esc(wa)}" target="_blank" rel="noopener noreferrer">Escribir por WhatsApp</a>` : "") +
    `<a class="b${wa ? " l" : ""}" href="/">Volver a la tienda</a></div>`;
}

/* El número de orden, con su rótulo: es lo que hay que dictar por WhatsApp. */
const numero = (orden) => orden
  ? `<p class="rot">Número de orden</p><p class="orden">${esc(orden)}</p>` : "";

const sinCargo = (h1, texto, orden) => `<h1>${h1}</h1><p>${texto}</p>` + numero(orden);

/* Pase lo que pase, el comprador nunca ve una página de error genérica en
   inglés: si algo se rompe aquí, recibe la misma página de la marca, con lo
   único que importa en ese momento: que no vuelva a pagar. */
export default async function handler(req, res) {
  try {
    return await atender(req, res);
  } catch (e) {
    console.error("[retorno] error inesperado:", e && e.message);
    return pagina(res, 500, "error", sinCargo("No pudimos mostrar el resultado del pago.",
      "Algo falló de nuestro lado al leer la respuesta de Webpay. <b>No vuelvas a pagar</b>: escríbenos y lo revisamos.") +
      acciones("Hola, volví de Webpay y no pude ver el resultado de mi pago."));
  }
}

async function atender(req, res) {
  const { token, tbkToken, orden } = parametros(req);

  /* 4. Error dentro del formulario de Webpay: no se confirma. */
  if (token && tbkToken) {
    return pagina(res, 200, "error", sinCargo("No se pudo completar el pago.",
      "Hubo un error en el formulario de Webpay y el pago no se completó, así que no se hizo ningún cargo. Puedes volver a intentarlo.", orden) +
      acciones("Hola, tuve un problema al pagar en la web" + (orden ? " (orden " + orden + ")" : "") + "."));
  }
  /* 3. Anuló en el formulario. */
  if (!token && tbkToken) {
    return pagina(res, 200, "cancelado", sinCargo("Cancelaste el pago.",
      "No se hizo ningún cargo. Tu carrito sigue guardado: puedes volver a intentarlo cuando quieras.") + acciones());
  }
  /* 2. Se acabó el tiempo en el formulario. */
  if (!token && orden) {
    return pagina(res, 200, "cancelado", sinCargo("Se acabó el tiempo para pagar.",
      "Webpay cerró el formulario por inactividad y no se hizo ningún cargo. Tu carrito sigue guardado: puedes volver a intentarlo.") + acciones());
  }
  /* Llegada sin nada de Transbank: no se inventa un resultado. */
  if (!token) {
    return pagina(res, 400, "error", sinCargo("No recibimos la respuesta de Webpay.",
      "No llegó ningún pago que podamos confirmar. Si ves un cargo en tu cuenta, escríbenos y lo revisamos.") +
      acciones("Hola, volví de Webpay sin ver el resultado de mi pago."));
  }

  /* 1. Flujo normal: confirmar. Si la confirmación falla (por ejemplo porque
     ya se hizo y el comprador recargó), se pregunta el estado. */
  let r = null, confirmadoAhora = false;
  try {
    r = await confirmarTransaccion(token);
    confirmadoAhora = true;
  } catch (e1) {
    try {
      r = await estadoTransaccion(token);
    } catch (e2) {
      console.error("[retorno] no se pudo confirmar ni consultar:", e1.message, "|", e2.message);
      return pagina(res, 502, "error", sinCargo("No pudimos confirmar el pago.",
        "Webpay no respondió a tiempo. <b>No vuelvas a pagar</b>: escríbenos con tu nombre y la hora, y lo verificamos.") +
        acciones("Hola, pagué en la web pero no vi la confirmación."));
    }
  }

  /* El pedido es el que firmamos al ir: se busca por la orden que devuelve
     Transbank y se comprueba que la sesión sea la misma. */
  const cookies = leerCookies(req.headers && req.headers.cookie);
  const datos = r && r.buy_order ? verificar(cookies[nombreCookie(r.buy_order)]) : null;
  const coincide = !!(datos && datos.o === r.buy_order && datos.s === r.session_id);
  const ordenTbk = r && r.buy_order ? String(r.buy_order) : "";

  if (!confirmadoAhora) {
    if (aprobado(r) && coincide && datos.ok) {
      /* Recarga de una vuelta que ya se confirmó: mismo resultado, sin aviso. */
    } else if (r && r.status === "FAILED") {
      return pagina(res, 200, "rechazado", sinCargo("El pago fue rechazado.",
        "Tu tarjeta no autorizó el cargo, así que no se te cobró nada. Puedes intentarlo con otra o escribirnos.", ordenTbk) +
        acciones("Hola, mi pago en la web fue rechazado" + (ordenTbk ? " (orden " + ordenTbk + ")" : "") + "."));
    } else {
      console.error("[retorno] confirmación no repetible y sin marca previa:", ordenTbk, r && r.status);
      return pagina(res, 502, "error", sinCargo("No pudimos confirmar el pago.",
        "No sabemos todavía si el cargo quedó hecho. <b>No vuelvas a pagar</b>: escríbenos con este número de orden y lo verificamos.", ordenTbk) +
        acciones("Hola, no pude ver la confirmación de mi pago" + (ordenTbk ? " (orden " + ordenTbk + ")" : "") + "."));
    }
  }

  if (!aprobado(r)) {
    return pagina(res, 200, "rechazado", sinCargo("El pago fue rechazado.",
      "Tu tarjeta no autorizó el cargo, así que no se te cobró nada. Puedes intentarlo con otra o escribirnos.", ordenTbk) +
        acciones("Hola, mi pago en la web fue rechazado" + (ordenTbk ? " (orden " + ordenTbk + ")" : "") + "."));
  }

  /* Aprobado por Transbank, pero sin el detalle firmado (otro navegador, cookie
     borrada): el pago es real y se dice; el detalle se coordina a mano. */
  if (!coincide) {
    console.error("[retorno] PAGO APROBADO SIN DETALLE:", JSON.stringify({ orden: ordenTbk, monto: r.amount }));
    return pagina(res, 200, "aprobado", `<h1>Tu pago quedó hecho.</h1>
      <p>Transbank aprobó un pago de <b>${esc(pesos(r.amount))}</b>, pero en este navegador no encontramos el detalle del pedido. Escríbenos por WhatsApp con el número de orden y lo coordinamos.</p>
      ${numero(ordenTbk)}` + acciones("Hola, pagué en la web y mi número de orden es " + ordenTbk + "."));
  }

  /* El pedido se vuelve a armar desde los precios de casa: lo firmado es qué y
     cuántos, nunca el total. */
  let pedido = null;
  try {
    pedido = armarPedido(datos.i.map((x) => ({ id: x.id, cantidad: x.c })), datos.e, datos.z);
  } catch (e) {
    console.error("[retorno] el pedido ya no se puede armar:", ordenTbk, e.message);
  }
  if (!pedido || Number(r.amount) !== pedido.total) {
    if (pedido) console.error("[retorno] monto distinto:", r.amount, "esperado", pedido.total, ordenTbk);
    return pagina(res, 200, "error", `<h1>Hay que revisar tu pedido.</h1>
      <p>Transbank autorizó el cargo, pero no coincide con el pedido tal como está hoy en la tienda. <b>No vuelvas a pagar</b>: escríbenos con este número y lo resolvemos, ya sea completando el pedido o devolviendo la diferencia.</p>
      ${numero(ordenTbk)}` + acciones("Hola, mi pago quedó en revisión. Orden " + ordenTbk + "."));
  }

  const comprador = { nombre: datos.c.n, telefono: datos.c.t, correo: datos.c.m, direccion: datos.c.d, nota: datos.c.x };

  if (confirmadoAhora && !datos.ok) {
    const avisado = await avisarPorCorreo({ ...pedido, buyOrder: ordenTbk, comprador }, r);
    if (!avisado) {
      /* El pedido no se pierde: queda en el registro de la función y en el
         portal de Transbank, y el comprador tiene su número en pantalla. */
      console.error("[retorno] PEDIDO SIN AVISO POR CORREO:",
        JSON.stringify({ orden: ordenTbk, total: pedido.total, comprador, lineas: pedido.lineas, entrega: pedido.entrega, zona: pedido.zonaNombre }));
    }
    /* Se marca la cookie: una recarga mostrará esto mismo sin volver a avisar. */
    res.setHeader("Set-Cookie", cookiePedido(ordenTbk, firmar({ ...datos, ok: 1 })));
  }

  const lugar = (DATOS.tienda && DATOS.tienda.entrega && DATOS.tienda.entrega.retiro && DATOS.tienda.entrega.retiro.lugar) || "";
  const entrega = pedido.entrega === "retiro"
    ? "Retiro en " + esc(lugar) + ", sin costo"
    : "Despacho a " + esc(pedido.zonaNombre) + ": " + esc(comprador.direccion);
  const filas = pedido.lineas.map((l) =>
    `<tr><td>${esc(l.nombre)} <span style="color:var(--taupe)">× ${l.cantidad}</span></td><td class="n">${pesos(l.subtotal)}</td></tr>`).join("");
  const tarjeta = r.card_detail && r.card_detail.card_number;

  return pagina(res, 200, "aprobado", `
    <h1>Gracias, ${esc(String(comprador.nombre).split(" ")[0])}.</h1>
    <p>Tu pago quedó aprobado. Escríbenos por WhatsApp con tu número de pedido para coordinar la entrega.</p>
    <div class="caja">
      <p class="rot" style="margin:0">Número de pedido</p>
      <p class="orden">${esc(ordenTbk)}</p>
      <table>${filas}
        <tr><td>${pedido.entrega === "retiro" ? "Retiro" : "Despacho"}</td><td class="n">${pedido.costoDespacho ? pesos(pedido.costoDespacho) : "Sin costo"}</td></tr>
        <tr class="t"><td>Total pagado</td><td class="n">${pesos(r.amount)}</td></tr>
      </table>
      <p style="font-size:.9rem">${entrega}</p>
      <p style="font-size:.82rem;color:var(--taupe)">Autorización ${esc(r.authorization_code)}${tarjeta ? " · tarjeta terminada en " + esc(tarjeta) : ""}</p>
    </div>
    ${acciones("Hola, acabo de pagar en la web. Mi número de pedido es " + ordenTbk + ".")}
    <!-- Mismo origen que la tienda: lo pagado sale del carrito, para que al
         volver no le aparezca el pedido otra vez como si no hubiera pasado. -->
    <script>try{localStorage.removeItem("rdr-carrito")}catch(e){}</script>`);
}
