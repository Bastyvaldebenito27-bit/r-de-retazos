/* ===========================================================================
   Las frases que se arman con DATOS: teléfono, entregas y pagos.

   Las usan la portada y las páginas legales, para que digan exactamente lo
   mismo y nunca se contradigan. Sólo se dice lo confirmado: lo que está en
   null en DATOS no aparece en ninguna frase.
   =========================================================================== */
import { DATOS, CATALOGO, precioDe, stockDe } from "./datos.js";

export const precioValido = (v) => typeof v === "number" && Number.isInteger(v) && v > 0;
export const pesos = (n) => "$" + Number(n).toLocaleString("es-CL");

/* --- Teléfono y WhatsApp ------------------------------------------------- */
export const telefono = (d = DATOS) => String((d.contacto && d.contacto.whatsapp) || "").replace(/\D/g, "");
export const hayWhatsapp = (d = DATOS) => telefono(d).length > 7;
/* +56 9 7137 1958: así se lee y se dicta un celular chileno. */
export const telLegible = (t) => (/^569\d{8}$/.test(t) ? "+56 9 " + t.slice(3, 7) + " " + t.slice(7) : "+" + t);
export const enlaceWhatsapp = (texto, d = DATOS) =>
  hayWhatsapp(d) ? "https://wa.me/" + telefono(d) + "?text=" + encodeURIComponent(texto) : "";

/* Los mensajes ya escritos, según desde dónde se escribe. */
export const MENSAJES = {
  general: "Hola, me gustaría consultar por los productos de R de Retazos.",
  pedido: "Hola, me gustaría hacer un pedido en R de Retazos.",
  idea: "Hola, quiero consultar por una creación especial.",
  caja: "Hola, me gustaría consultar por una caja de regalo.",
  recuerdos: "Hola, me gustaría consultar por recuerdos para una celebración.",
  negocio: "Hola, me gustaría cotizar artículos para mi negocio.",
  legal: "Hola, tengo una consulta sobre los términos o la privacidad de R de Retazos."
};

/* --- ¿Se puede pagar en línea hoy? -------------------------------------- */
export const enLinea = (d = DATOS) =>
  !!(d.tienda && d.tienda.activo) && CATALOGO.some((p) => precioValido(precioDe(p)) && stockDe(p) !== 0);

/* --- Entregas y pagos ----------------------------------------------------- */
export const enLista = (xs, y) => xs.length < 2 ? (xs[0] || "")
  : xs.slice(0, -1).join(", ") + " " + (y || "y") + " " + xs[xs.length - 1];
const minus = (t) => t ? t.charAt(0).toLowerCase() + t.slice(1) : t;

export function frasesEntrega(d = DATOS) {
  const e = (d.tienda && d.tienda.entrega) || {};
  const retiro = e.retiro && e.retiro.activo ? e.retiro : null;
  const zonas = Array.isArray(e.despacho) ? e.despacho : [];
  const f = [];
  if (retiro) f.push("Retiro gratuito en " + retiro.lugar + ".");
  const nombres = zonas.map((z) => z.zona).filter(Boolean);
  if (nombres.length === 2) f.push("Despachos entre " + nombres[0] + " y " + nombres[1] + ".");
  else if (nombres.length) f.push("Despachos a " + enLista(nombres) + ".");
  zonas.forEach((z) => {
    if (Number.isInteger(z.gratisDesde) && z.gratisDesde > 0)
      f.push("Despacho gratuito en " + z.zona + " desde " + z.gratisDesde + " pedidos.");
    if (precioValido(z.costo)) f.push("Despacho a " + z.zona + ": " + pesos(z.costo) + ".");
    else if (!z.gratisDesde) f.push("El valor del despacho a " + z.zona + " te lo confirmo " + (hayWhatsapp(d) ? "por WhatsApp" : "por mensaje") + ".");
    if (z.plazo) f.push("Plazo de despacho a " + z.zona + ": " + z.plazo + ".");
  });
  return f;
}

export const mediosPago = (d = DATOS) =>
  ((d.pagos && d.pagos.medios) || []).map((t) => String(t).trim()).filter(Boolean);

export function frasePagos(d = DATOS) {
  const m = mediosPago(d);
  if (!m.length) return "";
  return enLista([m[0]].concat(m.slice(1).map(minus))) + "." +
    (enLinea(d) ? " También puedes pagar en línea con Webpay, desde el carrito." : "");
}

export function fraseEnLinea(d = DATOS) {
  if (enLinea(d)) return "Sí. Agrega lo que quieras al carrito y paga con Webpay: la tarjeta la escribes en el sitio de Transbank, no aquí.";
  const m = mediosPago(d);
  return m.length ? "Todavía no. Por ahora puedes pagar con " + enLista(m.map(minus), "o") + "." : "Todavía no.";
}
