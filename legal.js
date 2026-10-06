/* Rellena las páginas legales con los datos de DATOS: así el teléfono, las
   entregas y los medios de pago dicen siempre lo mismo que la portada. Lo
   que no está confirmado sigue escrito como [PENDIENTE …] en el HTML. */
import { DATOS } from "./datos.js";
import * as TX from "./textos.js";

const esc = (s) => String(s).replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
const tel = TX.telefono();
const ig = String((DATOS.contacto && DATOS.contacto.instagram) || "").replace(/^@/, "").trim();
const wa = (k) => TX.enlaceWhatsapp(TX.MENSAJES[k] || TX.MENSAJES.legal);

const valores = {
  nombre: () => esc((DATOS.artesana && DATOS.artesana.nombre) || ""),
  ciudad: () => esc((DATOS.contacto && DATOS.contacto.ciudad) || ""),
  whatsapp: () => TX.hayWhatsapp()
    ? '<a href="' + esc(wa("legal")) + '" target="_blank" rel="noopener noreferrer">' + esc(TX.telLegible(tel)) + "</a>" : "",
  instagram: () => ig
    ? '<a href="https://www.instagram.com/' + encodeURIComponent(ig) + '/" target="_blank" rel="noopener noreferrer">@' + esc(ig) + "</a>" : "",
  enLinea: () => TX.enLinea()
    ? "El pago en línea con Webpay está habilitado."
    : "El pago en línea desde la web todavía no está habilitado."
};
document.querySelectorAll("[data-dato]").forEach((n) => {
  const f = valores[n.getAttribute("data-dato")];
  if (f) n.innerHTML = f();
});

const listas = {
  entrega: () => TX.frasesEntrega(),
  pagos: () => TX.mediosPago().concat(TX.enLinea() ? ["Pago en línea con Webpay"] : [])
};
document.querySelectorAll("[data-lista]").forEach((ul) => {
  const f = listas[ul.getAttribute("data-lista")];
  if (f) ul.innerHTML = f().map((t) => "<li>" + esc(t) + "</li>").join("");
});

/* En el pie, la página en la que estás queda marcada. */
document.querySelectorAll(".pie a[href]").forEach((a) => {
  if (location.pathname.endsWith("/" + a.getAttribute("href"))) a.setAttribute("aria-current", "page");
});
