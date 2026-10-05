import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { DATOS } from "../datos.js";

/* ===========================================================================
   El lado servidor de la tienda.

   Una regla manda sobre todas: EL NAVEGADOR NUNCA DICE CUÁNTO SE COBRA. El
   cliente manda qué quiere y cuántos; el monto lo arma aquí el servidor con
   los precios de datos.js, que es el mismo archivo que pinta la página. Si se
   confiara en un total enviado desde el navegador, cualquiera podría pagar mil
   pesos por un bolso cambiando un número en la consola.

   Y no hay base de datos. El pedido viaja firmado dentro de la return_url: a
   la vuelta se comprueba la firma, así que llega tal como salió o no llega.
   =========================================================================== */

const AMBIENTES = {
  integracion: {
    base: "https://webpay3gint.transbank.cl",
    /* Credenciales públicas de prueba, publicadas por el propio Transbank.
       No son un secreto y no sirven para cobrar dinero real. */
    codigo: "597055555532",
    llave: "579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C"
  },
  produccion: { base: "https://webpay3g.transbank.cl", codigo: null, llave: null }
};

export function ambiente() {
  const nombre = process.env.TBK_AMBIENTE === "produccion" ? "produccion" : "integracion";
  const base = AMBIENTES[nombre];
  const codigo = process.env.TBK_COMMERCE_CODE || base.codigo;
  const llave = process.env.TBK_API_KEY || base.llave;
  if (!codigo || !llave) {
    throw new Error("Faltan TBK_COMMERCE_CODE y TBK_API_KEY para el ambiente de producción.");
  }
  return { nombre, url: base.base, codigo, llave };
}

/* --- Catálogo y totales --------------------------------------------------- */

const precioValido = (v) => typeof v === "number" && Number.isInteger(v) && v > 0;

export function tiendaAbierta() {
  const t = DATOS.tienda;
  return !!(t && t.activo && DATOS.productos.some((p) => precioValido(p.precio)));
}

/** Arma el pedido desde lo que pidió el cliente, con los precios de casa. */
export function armarPedido(items, entrega) {
  if (!Array.isArray(items) || !items.length) throw new Error("El carrito está vacío.");
  if (items.length > 30) throw new Error("Demasiadas líneas en el carrito.");

  const lineas = items.map((it) => {
    const p = DATOS.productos.find((x) => x.id === it.id);
    if (!p) throw new Error("Producto no encontrado: " + String(it.id).slice(0, 40));
    if (!precioValido(p.precio)) throw new Error("«" + p.nombre + "» todavía no tiene precio publicado.");
    const cantidad = Number(it.cantidad);
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 20) {
      throw new Error("Cantidad no válida para «" + p.nombre + "».");
    }
    return { id: p.id, nombre: p.nombre, precio: p.precio, cantidad, subtotal: p.precio * cantidad };
  });

  const desp = (DATOS.tienda && DATOS.tienda.despacho) || {};
  let costoDespacho = 0;
  if (entrega === "despacho") {
    if (!precioValido(desp.costo)) throw new Error("El despacho todavía no tiene costo definido.");
    costoDespacho = desp.costo;
  } else if (entrega !== "retiro" || !desp.retiro) {
    throw new Error("Forma de entrega no válida.");
  }

  const subtotal = lineas.reduce((a, l) => a + l.subtotal, 0);
  const total = subtotal + costoDespacho;
  if (!Number.isInteger(total) || total < 50) throw new Error("Total no válido.");
  return { lineas, subtotal, costoDespacho, total, entrega };
}

/* --- Firma: el pedido viaja con el comprador, pero no lo puede tocar ------- */

const secreto = () => process.env.FIRMA_SECRETO || "";

const b64u = {
  pon: (buf) => Buffer.from(buf).toString("base64url"),
  saca: (s) => Buffer.from(s, "base64url")
};

export function firmar(obj) {
  const s = secreto();
  if (!s) throw new Error("Falta FIRMA_SECRETO.");
  const cuerpo = b64u.pon(JSON.stringify(obj));
  const mac = createHmac("sha256", s).update(cuerpo).digest("base64url");
  return cuerpo + "." + mac;
}

export function verificar(firmado) {
  const s = secreto();
  if (!s || typeof firmado !== "string") return null;
  const corte = firmado.lastIndexOf(".");
  if (corte < 1) return null;
  const cuerpo = firmado.slice(0, corte);
  const mac = firmado.slice(corte + 1);
  const esperado = createHmac("sha256", s).update(cuerpo).digest("base64url");
  const a = Buffer.from(mac), b = Buffer.from(esperado);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try { return JSON.parse(b64u.saca(cuerpo).toString("utf8")); } catch { return null; }
}

/* --- Transbank ------------------------------------------------------------ */

const RUTA = "/rswebpaytransaction/api/webpay/v1.2/transactions";

async function tbk(metodo, camino, cuerpo) {
  const a = ambiente();
  const r = await fetch(a.url + camino, {
    method: metodo,
    headers: {
      "Tbk-Api-Key-Id": a.codigo,
      "Tbk-Api-Key-Secret": a.llave,
      "Content-Type": "application/json"
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined
  });
  const texto = await r.text();
  let datos = null;
  try { datos = JSON.parse(texto); } catch { /* Transbank puede responder HTML si algo va mal */ }
  if (!r.ok) {
    const detalle = (datos && (datos.error_message || datos.message)) || texto.slice(0, 180);
    throw new Error("Transbank respondió " + r.status + ": " + detalle);
  }
  return datos;
}

/** buy_order admite 26 caracteres; esto deja 20 y no se repite. */
export const nuevaOrden = () =>
  "rdr-" + Date.now().toString(36) + "-" + randomBytes(3).toString("hex");

export const crearTransaccion = (p) =>
  tbk("POST", RUTA, {
    buy_order: p.buyOrder,
    session_id: p.sessionId,
    amount: p.amount,
    return_url: p.returnUrl
  });

export const confirmarTransaccion = (token) =>
  tbk("PUT", RUTA + "/" + encodeURIComponent(token));

/* --- Aviso por correo ----------------------------------------------------- */

const esc = (s) => String(s == null ? "" : s)
  .replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));

const pesos = (n) => "$" + Number(n).toLocaleString("es-CL");

/** Devuelve true sólo si el correo salió. Nunca tira: un pedido pagado no se
    pierde porque el correo falle; quien llama lo registra y la página de
    gracias enseña el pedido completo igual. */
export async function avisarPorCorreo(pedido, tbkRes) {
  const clave = process.env.RESEND_API_KEY;
  const para = process.env.CORREO_DESTINO;
  if (!clave || !para) return false;

  const filas = pedido.lineas
    .map((l) => "<tr><td>" + esc(l.nombre) + "</td><td align=\"center\">" + l.cantidad +
                "</td><td align=\"right\">" + pesos(l.subtotal) + "</td></tr>")
    .join("");
  const c = pedido.comprador || {};
  const html =
    "<h2>Pedido " + esc(pedido.buyOrder) + "</h2>" +
    "<table cellpadding=\"6\" border=\"0\">" + filas +
    "<tr><td colspan=\"2\">Despacho</td><td align=\"right\">" + pesos(pedido.costoDespacho) + "</td></tr>" +
    "<tr><td colspan=\"2\"><b>Total pagado</b></td><td align=\"right\"><b>" + pesos(tbkRes.amount) + "</b></td></tr>" +
    "</table>" +
    "<p><b>" + esc(c.nombre) + "</b><br>" + esc(c.telefono) + "<br>" + esc(c.correo) + "</p>" +
    "<p><b>" + (pedido.entrega === "retiro" ? "Retira en persona" : "Despacho a:") + "</b><br>" +
    esc(c.direccion || "") + "</p>" +
    (c.nota ? "<p>Nota: " + esc(c.nota) + "</p>" : "") +
    "<p style=\"color:#666;font-size:13px\">Autorización " + esc(tbkRes.authorization_code) +
    " · " + esc(tbkRes.card_detail && tbkRes.card_detail.card_number) + "</p>";

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + clave, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.CORREO_DESDE || "onboarding@resend.dev",
        to: [para],
        subject: "Pedido " + pedido.buyOrder + " · " + pesos(tbkRes.amount),
        html
      })
    });
    return r.ok;
  } catch {
    return false;
  }
}
