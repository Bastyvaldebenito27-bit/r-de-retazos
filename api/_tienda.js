import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { DATOS, CATALOGO, precioDe, stockDe } from "../datos.js";

/* ===========================================================================
   El lado servidor de la tienda.

   Una regla manda sobre todas: EL NAVEGADOR NUNCA DICE CUÁNTO SE COBRA. El
   cliente manda qué quiere y cuántos; el monto lo arma aquí el servidor con
   los precios de datos.js, que es el mismo archivo que pinta la página. Si se
   confiara en un total enviado desde el navegador, cualquiera podría pagar mil
   pesos por un bolso cambiando un número en la consola.

   Y no hay base de datos. El pedido viaja firmado en una cookie HttpOnly que
   sólo se manda a /api/retorno: a la vuelta se comprueba la firma, así que
   llega tal como salió o no llega. (Antes viajaba dentro de la return_url,
   pero Transbank no acepta una return_url de más de 256 caracteres.)
   =========================================================================== */

/* Un error de configuración nuestro, no del comprador. Se registra entero y al
   comprador se le dice sólo que el pago no está disponible. */
export class ErrorConfig extends Error {}

/* Ambiente de pruebas de Transbank, con las credenciales PÚBLICAS que publica
   el propio Transbank en su documentación y en sus SDK oficiales. No son un
   secreto y no mueven dinero real. */
const INTEGRACION = {
  url: "https://webpay3gint.transbank.cl",
  codigo: "597055555532",
  llave: "579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C"
};
const URL_PRODUCCION = "https://webpay3g.transbank.cl";

/* Producción sólo se enciende a propósito: TRANSBANK_ENVIRONMENT=production y
   las dos credenciales reales cargadas en Vercel. Cualquier otra cosa es
   integración, y en integración se usan SIEMPRE las credenciales públicas de
   prueba: si alguien dejara una llave real en las variables, nunca viajaría a
   un servidor de pruebas. Un valor desconocido no cae en silencio a pruebas:
   se rechaza, porque cobrar «de mentira» creyendo que es de verdad es peor que
   no poder cobrar. */
export function ambiente() {
  const pedido = String(process.env.TRANSBANK_ENVIRONMENT || "").trim().toLowerCase();

  if (pedido === "production" || pedido === "produccion") {
    const codigo = String(process.env.TRANSBANK_COMMERCE_CODE || "").trim();
    const llave = String(process.env.TRANSBANK_API_KEY || "").trim();
    if (!codigo || !llave) {
      throw new ErrorConfig("TRANSBANK_ENVIRONMENT=production exige TRANSBANK_COMMERCE_CODE y TRANSBANK_API_KEY.");
    }
    if (codigo === INTEGRACION.codigo) {
      throw new ErrorConfig("El código de comercio de pruebas no sirve en producción.");
    }
    return { nombre: "produccion", url: URL_PRODUCCION, codigo, llave };
  }

  if (pedido && pedido !== "integration" && pedido !== "integracion") {
    throw new ErrorConfig("TRANSBANK_ENVIRONMENT tiene un valor desconocido. Usa integration o production.");
  }
  return { nombre: "integracion", url: INTEGRACION.url, codigo: INTEGRACION.codigo, llave: INTEGRACION.llave };
}

/* --- Catálogo y totales --------------------------------------------------- */

export const precioValido = (v) => typeof v === "number" && Number.isInteger(v) && v > 0;

export function tiendaAbierta() {
  const t = DATOS.tienda;
  return !!(t && t.activo && CATALOGO.some((p) => precioValido(precioDe(p))));
}

const ENTREGA = () => (DATOS.tienda && DATOS.tienda.entrega) || {};

/** Cuánto cuesta despachar `unidades` productos a la zona `id`. Devuelve null
    si esa zona no existe o su costo no está definido: entonces no se cobra. */
export function costoDespacho(id, unidades) {
  const z = (ENTREGA().despacho || []).find((x) => x.id === id);
  if (!z) return null;
  if (Number.isInteger(z.gratisDesde) && z.gratisDesde > 0 && unidades >= z.gratisDesde) return 0;
  return precioValido(z.costo) ? z.costo : null;
}

/** Arma el pedido desde lo que pidió el cliente, con los precios de casa.
    `zona` sólo cuenta si `entrega` es "despacho". */
export function armarPedido(items, entrega, zona) {
  if (!Array.isArray(items) || !items.length) throw new Error("El carrito está vacío.");
  if (items.length > 30) throw new Error("Demasiadas líneas en el carrito.");

  /* Se juntan las líneas repetidas antes de mirar el stock: si no, partir un
     pedido en dos líneas iguales serviría para saltarse el límite. */
  const juntas = new Map();
  for (const it of items) {
    const id = String(it && it.id);
    const cantidad = Number(it && it.cantidad);
    const p = CATALOGO.find((x) => x.id === id);
    if (!p) throw new Error("Uno de los productos de tu pedido ya no está disponible. Revisa el carrito.");
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 20) {
      throw new Error("Cantidad no válida para «" + p.nombre + "».");
    }
    juntas.set(id, (juntas.get(id) || 0) + cantidad);
  }

  const lineas = [...juntas].map(([id, cantidad]) => {
    const p = CATALOGO.find((x) => x.id === id);
    const precio = precioDe(p);
    if (!precioValido(precio)) throw new Error("«" + p.nombre + "» todavía no tiene precio publicado.");
    if (cantidad > 20) throw new Error("Cantidad no válida para «" + p.nombre + "».");
    const stock = stockDe(p);
    if (stock === 0) throw new Error("«" + p.nombre + "» está agotado.");
    if (stock !== null && cantidad > stock) {
      throw new Error("De «" + p.nombre + "» quedan " + stock + ".");
    }
    return { id: p.id, nombre: p.nombre, precio, cantidad, subtotal: precio * cantidad };
  });

  const unidades = lineas.reduce((a, l) => a + l.cantidad, 0);
  const e = ENTREGA();
  let costo = 0, zonaNombre = "";
  if (entrega === "despacho") {
    const z = (e.despacho || []).find((x) => x.id === zona);
    if (!z) throw new Error("Elige una zona de despacho.");
    const c = costoDespacho(z.id, unidades);
    if (c === null) throw new Error("El despacho a " + z.zona + " todavía no tiene costo definido.");
    costo = c; zonaNombre = z.zona;
  } else if (entrega !== "retiro" || !(e.retiro && e.retiro.activo)) {
    throw new Error("Elige cómo quieres recibir tu pedido.");
  }

  const subtotal = lineas.reduce((a, l) => a + l.subtotal, 0);
  const total = subtotal + costo;
  if (!Number.isInteger(total) || total < 50) throw new Error("No pudimos calcular el total del pedido.");
  return { lineas, subtotal, costoDespacho: costo, total, entrega,
           zona: entrega === "despacho" ? zona : null, zonaNombre, unidades };
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

/* Límites publicados por Transbank (referencia del API REST v1.2 y SDK oficial
   de Node): buy_order 26, session_id 61, return_url 255/256, token 64. */
export const LIMITES = { orden: 26, sesion: 61, retorno: 255, token: 64 };

/** buy_order admite 26 caracteres; esto deja 20 y no se repite. */
export const nuevaOrden = () =>
  "rdr-" + Date.now().toString(36) + "-" + randomBytes(3).toString("hex");

/** session_id propio, distinto del buy_order, para atar la vuelta a la ida. */
export const nuevaSesion = () => "s-" + randomBytes(12).toString("hex");

export function crearTransaccion(p) {
  if (!p.buyOrder || p.buyOrder.length > LIMITES.orden) throw new Error("buy_order fuera de límite.");
  if (!p.sessionId || p.sessionId.length > LIMITES.sesion) throw new Error("session_id fuera de límite.");
  if (!p.returnUrl || p.returnUrl.length > LIMITES.retorno) throw new Error("return_url fuera de límite.");
  if (!Number.isInteger(p.amount) || p.amount < 50) throw new Error("Monto no válido.");
  return tbk("POST", RUTA, {
    buy_order: p.buyOrder,
    session_id: p.sessionId,
    amount: p.amount,
    return_url: p.returnUrl
  });
}

const tokenValido = (t) => typeof t === "string" && t.length > 0 && t.length <= LIMITES.token && /^[\w-]+$/.test(t);

/** Confirma (commit) el pago. Sin esto el cargo no queda cursado. */
export function confirmarTransaccion(token) {
  if (!tokenValido(token)) return Promise.reject(new Error("Token no válido."));
  return tbk("PUT", RUTA + "/" + encodeURIComponent(token));
}

/** Estado de una transacción, hasta 7 días después de creada. Sirve para
    saber qué pasó cuando la confirmación no se puede repetir (por ejemplo,
    porque el comprador recargó la página de vuelta). */
export function estadoTransaccion(token) {
  if (!tokenValido(token)) return Promise.reject(new Error("Token no válido."));
  return tbk("GET", RUTA + "/" + encodeURIComponent(token));
}

/** Aprobado según Transbank: status exactamente AUTHORIZED y response_code
    exactamente 0. Cualquier otra combinación no lo es. */
export const aprobado = (r) => !!r && r.status === "AUTHORIZED" && r.response_code === 0;

/* --- El pedido viaja en una cookie --------------------------------------- */

/* Una cookie por orden: si alguien paga en dos pestañas a la vez, cada vuelta
   encuentra la suya. Sólo se manda a /api/retorno, no la puede leer ningún
   script de la página (HttpOnly) y caduca en una hora. SameSite=None porque
   la vuelta llega desde el dominio de Transbank; por eso también Secure. */
export const nombreCookie = (orden) => "rdr_p_" + String(orden).replace(/[^\w-]/g, "");

export function cookiePedido(orden, firmado, segundos = 3600) {
  return nombreCookie(orden) + "=" + firmado +
    "; Path=/api/retorno; Max-Age=" + segundos + "; HttpOnly; Secure; SameSite=None";
}

export function leerCookies(cabecera) {
  const out = {};
  String(cabecera || "").split(";").forEach((par) => {
    const i = par.indexOf("=");
    if (i > 0) out[par.slice(0, i).trim()] = par.slice(i + 1).trim();
  });
  return out;
}

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
    "<p><b>" + (pedido.entrega === "retiro" ? "Retira en persona" : "Despacho a " + esc(pedido.zonaNombre) + ":") + "</b><br>" +
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
