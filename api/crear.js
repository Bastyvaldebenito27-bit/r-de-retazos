import {
  tiendaAbierta, armarPedido, firmar, nuevaOrden, crearTransaccion
} from "./_tienda.js";

/* ===========================================================================
   Paso 1 del pago: el navegador dice QUÉ quiere; aquí se decide CUÁNTO cuesta.

   El pedido se devuelve firmado dentro de la return_url. No hay base de datos:
   a la vuelta se comprueba la firma y se vuelven a sumar los precios desde
   datos.js, así que ni el comprador ni nadie en el camino puede cambiar el
   monto, los productos ni la dirección.
   =========================================================================== */

/* Los topes no son decoración: la return_url viaja a Transbank y tiene que
   caber. Cortar aquí es preferible a que falle el pago por un campo largo. */
const TOPES = { nombre: 50, telefono: 16, correo: 60, direccion: 120, nota: 120 };

const limpiar = (v, max) => String(v == null ? "" : v).replace(/\s+/g, " ").trim().slice(0, max);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Usa POST." });
  }
  if (!tiendaAbierta()) {
    return res.status(409).json({ error: "El cobro en línea todavía no está habilitado." });
  }

  try {
    const cuerpo = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const entrega = cuerpo.entrega === "despacho" ? "despacho" : "retiro";
    const pedido = armarPedido(cuerpo.items, entrega);

    const c = cuerpo.comprador || {};
    const comprador = {
      n: limpiar(c.nombre, TOPES.nombre),
      t: limpiar(c.telefono, TOPES.telefono),
      m: limpiar(c.correo, TOPES.correo),
      d: limpiar(c.direccion, TOPES.direccion),
      x: limpiar(c.nota, TOPES.nota)
    };
    if (!comprador.n) return res.status(400).json({ error: "Falta tu nombre." });
    if (!comprador.t) return res.status(400).json({ error: "Falta tu teléfono." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(comprador.m)) {
      return res.status(400).json({ error: "Revisa el correo." });
    }
    if (entrega === "despacho" && !comprador.d) {
      return res.status(400).json({ error: "Falta la dirección de despacho." });
    }

    const buyOrder = nuevaOrden();
    /* Se firma lo mínimo: qué y cuánto, no el total. El total se recalcula a la
       vuelta desde los mismos precios, así que no hay dos fuentes que puedan
       discrepar. */
    const firma = firmar({ o: buyOrder, i: pedido.lineas.map((l) => ({ id: l.id, c: l.cantidad })),
                           e: entrega, c: comprador });

    const origen = "https://" + (req.headers["x-forwarded-host"] || req.headers.host);
    const t = await crearTransaccion({
      buyOrder,
      sessionId: buyOrder,
      amount: pedido.total,
      returnUrl: origen + "/api/retorno?p=" + encodeURIComponent(firma)
    });

    /* La página hace un POST de formulario a t.url con token_ws. */
    return res.status(200).json({ url: t.url, token: t.token, total: pedido.total, orden: buyOrder });
  } catch (e) {
    const msg = e && e.message ? e.message : "No se pudo iniciar el pago.";
    const propio = !/Transbank respondió/.test(msg);
    if (!propio) console.error("[crear]", msg);
    return res.status(propio ? 400 : 502).json({
      error: propio ? msg : "No se pudo contactar con Webpay. Inténtalo de nuevo."
    });
  }
}
