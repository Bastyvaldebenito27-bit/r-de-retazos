import { verificar, armarPedido, confirmarTransaccion, avisarPorCorreo } from "./_tienda.js";

/* ===========================================================================
   Paso 2: Webpay devuelve al comprador aquí.

   Tres caminos, y los tres terminan en una página que dice la verdad:
     · token_ws        → se pagó algo; hay que confirmarlo con Transbank.
     · TBK_TOKEN solo  → el comprador anuló o se le acabó el tiempo.
     · ninguno         → llegada rara; no se inventa un resultado.

   Confirmar es obligatorio: hasta que Transbank recibe el PUT, el cargo no
   queda cursado. Y después se comprueba que el monto cobrado sea exactamente
   el que calculamos: si no cuadra, no se trata como pagado.
   =========================================================================== */

const esc = (s) => String(s == null ? "" : s)
  .replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
const pesos = (n) => "$" + Number(n).toLocaleString("es-CL");

function pagina(titulo, cuerpo, codigo = 200, res) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.status(codigo).send(`<!doctype html>
<html lang="es-CL"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex"><title>${esc(titulo)} · R de Retazos</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>
:root{color-scheme:light;--marfil:#FAF6F0;--arena:#F2EAE0;--lino:#E7DACB;--carbon:#2E2A26;
  --taupe:#6B6057;--salvia:#5E6E52;--salvia2:#4B5942;--terracota:#9F553E;--mauve:#7F6168}
*{box-sizing:border-box;margin:0}
body{background:var(--marfil);color:var(--taupe);font:16px/1.65 "Karla",system-ui,sans-serif;
  padding:3rem 20px;display:flex;justify-content:center}
.c{width:100%;max-width:38rem}
.r{width:48px;height:48px;border:1px solid var(--carbon);border-radius:50%;display:grid;
  place-items:center;font:1.5rem/1 Georgia,serif;color:var(--carbon);margin-bottom:1.6rem}
h1{font:500 clamp(1.8rem,5vw,2.6rem)/1.1 Georgia,"Times New Roman",serif;color:var(--carbon)}
p{margin-top:1rem;max-width:46ch}
.ok{color:var(--salvia);font-weight:700}
.no{color:var(--terracota);font-weight:700}
table{width:100%;margin-top:1.8rem;border-collapse:collapse;font-size:.95rem}
td{padding:.6rem 0;border-bottom:1px solid var(--lino)}
td.n{text-align:right;font-variant-numeric:tabular-nums}
tr.t td{border-bottom:0;padding-top:1rem;font-weight:700;color:var(--carbon);font-size:1.05rem}
.caja{margin-top:1.8rem;background:#fff;border:1px solid var(--lino);border-radius:20px;padding:1.4rem}
.orden{font-family:ui-monospace,monospace;font-size:1.1rem;color:var(--carbon);letter-spacing:.02em}
a.b{display:inline-flex;margin-top:2rem;padding:.78rem 1.45rem;border-radius:999px;
  background:var(--salvia);color:#fff;text-decoration:none;font-weight:700;font-size:.92rem}
a.b:hover{background:var(--salvia2)}
a.b.l{background:transparent;color:var(--carbon);border:1.5px solid var(--lino);margin-left:.6rem}
a.b:focus-visible{outline:2.5px solid var(--carbon);outline-offset:3px}
</style></head><body><main class="c"><div class="r" aria-hidden="true">R</div>${cuerpo}</main></body></html>`);
}

export default async function handler(req, res) {
  const q = req.query || {};
  const cuerpo = req.body || {};
  const token = cuerpo.token_ws || q.token_ws;
  const anulado = cuerpo.TBK_TOKEN || q.TBK_TOKEN;

  const volver = '<a class="b" href="/">Volver a la tienda</a>';

  if (!token) {
    const t = anulado
      ? ["Pago anulado", "<p>No se hizo ningún cargo. El pedido sigue disponible: puedes volver a intentarlo cuando quieras.</p>"]
      : ["No pudimos leer la respuesta", "<p>Webpay no devolvió un pago que podamos confirmar. Si te llegó un cargo, escríbenos y lo revisamos: no se procesó ningún pedido.</p>"];
    return pagina(t[0], `<h1>${t[0]}.</h1>${t[1]}${volver}`, 200, res);
  }

  const datos = verificar(q.p);
  if (!datos) {
    console.error("[retorno] firma inválida o ausente");
    return pagina("No pudimos verificar el pedido",
      `<h1>No pudimos verificar el pedido.</h1><p>El pago puede haberse cursado. <b>No cierres esto</b>: escríbenos con la hora y el monto y lo resolvemos.</p>${volver}`,
      400, res);
  }

  let tbkRes;
  try {
    tbkRes = await confirmarTransaccion(token);
  } catch (e) {
    console.error("[retorno] confirmación falló:", e.message);
    return pagina("No pudimos confirmar el pago",
      `<h1>No pudimos confirmar el pago.</h1><p>Puede que ya estuviera confirmado, o que Webpay no respondiera. <b>No vuelvas a pagar.</b> Escríbenos con tu nombre y la hora y lo verificamos.</p><p class="orden">${esc(datos.o)}</p>${volver}`,
      502, res);
  }

  /* El pedido se vuelve a armar desde los precios de casa: lo firmado es qué y
     cuántos, nunca el total. */
  let pedido;
  try {
    pedido = armarPedido(datos.i.map((x) => ({ id: x.id, cantidad: x.c })), datos.e);
  } catch (e) {
    console.error("[retorno] el pedido ya no se puede armar:", e.message);
    return pagina("Pedido pagado, revisión manual",
      `<h1>Pagado, pero hay que revisarlo.</h1><p>El cargo se cursó y el catálogo cambió mientras tanto. Nos ponemos en contacto contigo.</p><p class="orden">${esc(datos.o)}</p>${volver}`,
      200, res);
  }

  const autorizado = tbkRes.status === "AUTHORIZED" && tbkRes.response_code === 0;
  const montoCuadra = Number(tbkRes.amount) === pedido.total;

  if (!autorizado) {
    return pagina("Pago rechazado",
      `<h1>El pago fue rechazado.</h1><p>Tu tarjeta no autorizó el cargo, así que no se te cobró nada. Puedes intentarlo con otra o escribirnos y lo vemos.</p>${volver}`,
      200, res);
  }

  if (!montoCuadra) {
    console.error("[retorno] monto distinto:", tbkRes.amount, "esperado", pedido.total, datos.o);
    return pagina("Pedido pagado, revisión manual",
      `<h1>Pagado, pero hay que revisarlo.</h1><p>El monto cobrado no coincide con el del pedido. No hagas nada más: te contactamos para devolverte la diferencia o completar lo que falte.</p><p class="orden">${esc(datos.o)}</p>${volver}`,
      200, res);
  }

  const comprador = {
    nombre: datos.c.n, telefono: datos.c.t, correo: datos.c.m,
    direccion: datos.c.d, nota: datos.c.x
  };
  const avisado = await avisarPorCorreo(
    { ...pedido, buyOrder: datos.o, comprador }, tbkRes);
  if (!avisado) {
    /* El pedido no se pierde: queda en el registro de la función y en el portal
       de Transbank, y el comprador tiene su número de orden en pantalla. */
    console.error("[retorno] PEDIDO SIN AVISO POR CORREO:",
      JSON.stringify({ orden: datos.o, total: pedido.total, comprador, lineas: pedido.lineas }));
  }

  const filas = pedido.lineas.map((l) =>
    `<tr><td>${esc(l.nombre)} <span style="color:#9b9088">× ${l.cantidad}</span></td><td class="n">${pesos(l.subtotal)}</td></tr>`).join("");
  const entrega = pedido.entrega === "retiro"
    ? "Retiro coordinado en Santo Domingo"
    : `Despacho a ${esc(comprador.direccion)}`;

  return pagina("Pago recibido", `
    <p class="ok">Pago recibido</p>
    <h1>Gracias, ${esc(comprador.nombre.split(" ")[0])}.</h1>
    <p>Tu pedido quedó pagado. Te escribimos a <b>${esc(comprador.correo)}</b> para coordinar la entrega.</p>
    <div class="caja">
      <p style="margin:0;font-size:.8rem;letter-spacing:.14em;text-transform:uppercase;color:var(--mauve)">Número de pedido</p>
      <p class="orden" style="margin-top:.35rem">${esc(datos.o)}</p>
      <table>${filas}
        <tr><td>Despacho</td><td class="n">${pedido.costoDespacho ? pesos(pedido.costoDespacho) : "Sin costo"}</td></tr>
        <tr class="t"><td>Total pagado</td><td class="n">${pesos(tbkRes.amount)}</td></tr>
      </table>
      <p style="font-size:.9rem">${entrega}</p>
      <p style="font-size:.82rem;color:#9b9088">Autorización ${esc(tbkRes.authorization_code)} · tarjeta terminada en ${esc(tbkRes.card_detail && tbkRes.card_detail.card_number)}</p>
    </div>
    <p style="font-size:.9rem">Guarda el número de pedido: es con lo que te identificamos.</p>
    ${volver}
    <!-- Mismo origen que la tienda: lo pagado sale del carrito, para que al
         volver no le aparezca el pedido otra vez como si no hubiera pasado. -->
    <script>try{localStorage.removeItem("rdr-carrito")}catch(e){}</script>`, 200, res);
}
