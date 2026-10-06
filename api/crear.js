import { DATOS } from "../datos.js";
import {
  tiendaAbierta, armarPedido, firmar, nuevaOrden, nuevaSesion, crearTransaccion,
  cookiePedido, ErrorConfig, LIMITES
} from "./_tienda.js";

/* ===========================================================================
   Paso 1 del pago: el navegador dice QUÉ quiere; aquí se decide CUÁNTO cuesta.

   El pedido se firma y viaja en una cookie HttpOnly que sólo se manda a
   /api/retorno. No hay base de datos: a la vuelta se comprueba la firma y se
   vuelven a sumar los precios desde datos.js, así que ni el comprador ni nadie
   en el camino puede cambiar el monto, los productos ni la dirección.

   La tarjeta nunca pasa por aquí: el comprador paga en el formulario de
   Webpay, en el sitio de Transbank.
   =========================================================================== */

/* Los topes no son decoración: el pedido viaja en una cookie, y una cookie no
   puede pasar de unos 4 KB. Cortar aquí es preferible a que falle el pago. */
const TOPES = { nombre: 50, telefono: 16, correo: 60, direccion: 120, nota: 120 };

const limpiar = (v, max) => String(v == null ? "" : v).replace(/\s+/g, " ").trim().slice(0, max);

/* A dónde vuelve el comprador. Con dominio propio en DATOS, siempre a ese; si
   no, al mismo host que atendió la petición, comprobando que sea un nombre de
   host y nada más. */
function origen(req) {
  const dom = DATOS.sitio && DATOS.sitio.dominio;
  if (dom) return "https://" + String(dom).replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const h = String((req.headers && (req.headers["x-forwarded-host"] || req.headers.host)) || "")
    .split(",")[0].trim();
  if (!/^[a-z0-9.-]+(:\d{1,5})?$/i.test(h)) throw new ErrorConfig("Host no válido para la return_url.");
  return "https://" + h;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
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
    const pedido = armarPedido(cuerpo.items, entrega, cuerpo.zona);

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

    /* Cada intento de pago es una orden nueva y única; Transbank rechaza un
       buy_order repetido. Volver a la página de retorno no crea ninguna. */
    const buyOrder = nuevaOrden();
    const sessionId = nuevaSesion();

    /* Se firma lo mínimo: qué y cuánto, no el total. El total se recalcula a la
       vuelta desde los mismos precios, así que no hay dos fuentes que puedan
       discrepar. `s` ata la vuelta a esta misma sesión de pago. */
    const firma = firmar({
      o: buyOrder, s: sessionId,
      i: pedido.lineas.map((l) => ({ id: l.id, c: l.cantidad })),
      e: entrega, z: pedido.zona, c: comprador
    });
    const cookie = cookiePedido(buyOrder, firma);
    if (cookie.length > 3800) return res.status(400).json({ error: "El pedido es demasiado largo." });

    const returnUrl = origen(req) + "/api/retorno";
    if (returnUrl.length > LIMITES.retorno) throw new ErrorConfig("La return_url supera el largo que admite Transbank.");

    const t = await crearTransaccion({ buyOrder, sessionId, amount: pedido.total, returnUrl });
    if (!t || !t.token || !t.url) throw new Error("Transbank respondió sin token.");

    res.setHeader("Set-Cookie", cookie);
    /* La página hace un POST de formulario a t.url con token_ws. */
    return res.status(200).json({ url: t.url, token: t.token, total: pedido.total, orden: buyOrder });
  } catch (e) {
    const msg = e && e.message ? e.message : "No se pudo iniciar el pago.";
    if (e instanceof ErrorConfig) {
      /* Problema de configuración nuestro: se registra el motivo (nunca una
         credencial) y al comprador se le dice lo justo. */
      console.error("[crear] configuración:", msg);
      return res.status(503).json({ error: "El pago en línea no está disponible en este momento." });
    }
    if (/Transbank respondió/.test(msg)) {
      console.error("[crear]", msg);
      return res.status(502).json({ error: "No se pudo contactar con Webpay. Inténtalo de nuevo." });
    }
    return res.status(400).json({ error: msg });
  }
}
