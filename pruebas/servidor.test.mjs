/* ===========================================================================
   Pruebas del servidor: el monto, la firma, los ambientes de Transbank y los
   cuatro caminos de vuelta de Webpay. Sin dependencias: node --test pruebas/

   Transbank se simula reemplazando fetch: ninguna prueba sale a internet ni
   usa una credencial real.
   =========================================================================== */
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

process.env.FIRMA_SECRETO = "secreto-de-prueba-0123456789";
delete process.env.TRANSBANK_ENVIRONMENT;
delete process.env.TRANSBANK_COMMERCE_CODE;
delete process.env.TRANSBANK_API_KEY;

const RAIZ = new URL("../", import.meta.url);
const { DATOS, CATALOGO, precioDe } = await import(new URL("datos.js", RAIZ));
const T = await import(new URL("api/_tienda.js", RAIZ));
const crear = (await import(new URL("api/crear.js", RAIZ))).default;
const retorno = (await import(new URL("api/retorno.js", RAIZ))).default;

const LLAVE_PRUEBA = "579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C";
const ORIGINAL = JSON.parse(JSON.stringify({ tienda: DATOS.tienda, familias: DATOS.familiasScrunchie, p0: DATOS.productos[0] }));

/* Respuesta falsa al estilo de Vercel. */
function resp() {
  return {
    codigo: 0, cuerpo: null, html: "", cabeceras: {},
    status(c) { this.codigo = c; return this; },
    json(j) { this.cuerpo = j; return this; },
    send(h) { this.html = h; return this; },
    setHeader(k, v) { this.cabeceras[k.toLowerCase()] = v; }
  };
}

/* Transbank de mentira: cada prueba dice qué responde a cada llamada. */
let llamadas = [];
function transbank(responder) {
  llamadas = [];
  global.fetch = async (url, o = {}) => {
    const r = { url: String(url), metodo: o.method || "GET", cabeceras: o.headers || {}, cuerpo: o.body ? JSON.parse(o.body) : null };
    llamadas.push(r);
    const [codigo, datos] = await responder(r);
    return { ok: codigo >= 200 && codigo < 300, status: codigo, text: async () => JSON.stringify(datos) };
  };
}

/* Captura console.error para comprobar que no se filtra ninguna credencial. */
let registro = [];
const errorOriginal = console.error;
console.error = (...a) => { registro.push(a.map(String).join(" ")); };

beforeEach(() => {
  DATOS.tienda = JSON.parse(JSON.stringify(ORIGINAL.tienda));
  DATOS.familiasScrunchie.forEach((f, i) => Object.assign(f, ORIGINAL.familias[i]));
  DATOS.productos[0].precio = ORIGINAL.p0.precio;
  CATALOGO.forEach((p) => { delete p.stock; });
  delete process.env.TRANSBANK_ENVIRONMENT;
  delete process.env.TRANSBANK_COMMERCE_CODE;
  delete process.env.TRANSBANK_API_KEY;
  registro = [];
});

/* Una tienda encendida con precios de prueba: sólo existe dentro del test. */
function tiendaDePrueba() {
  DATOS.tienda.activo = true;
  DATOS.productos[0].precio = 8900;                                   // moños
  DATOS.familiasScrunchie.find((f) => f.id === "dobles").precio = 4500;
  DATOS.tienda.entrega.despacho.find((z) => z.id === "san-antonio").costo = 3500;
}

const comprador = { nombre: "Ana Pérez", telefono: "+56912345678", correo: "ana@ejemplo.cl", direccion: "Calle 1, San Antonio" };
const pedidoDe = (extra = {}) => ({
  method: "POST", headers: { host: "r-de-retazos.vercel.app" },
  body: { items: [{ id: "monos", cantidad: 1 }, { id: "doble-limones-rayas", cantidad: 2 }], entrega: "retiro", comprador, ...extra }
});

/* ======================================================================= */
/* La tienda y el monto                                                     */
/* ======================================================================= */

test("la tienda nace cerrada y sin precios inventados", () => {
  assert.equal(DATOS.tienda.activo, false);
  assert.equal(T.tiendaAbierta(), false);
  /* Los únicos precios confirmados: la lista oficial de scrunchies. */
  assert.deepEqual(DATOS.familiasScrunchie.map((f) => [f.id, f.nombre, f.precio]), [
    ["simples", "Simple", 2900], ["sesgo", "Simple con sesgo", 3900],
    ["ele", "XL con sesgo", 4900], ["dobles", "Doble con sesgo", 5900]]);
  DATOS.familiasScrunchie.forEach((f) => assert.equal(f.medida, null));
  /* Ninguna pieza ni producto tiene precio propio: bolsos, estuches y demás, a consultar. */
  CATALOGO.forEach((p) => assert.equal(p.precio, null, p.id));
  assert.equal(DATOS.productos.filter((p) => precioDe(p) != null).length, 0, "sin precios de otros productos");
  assert.ok(DATOS.scrunchies.every((p) => [2900, 3900, 4900, 5900].includes(precioDe(p))));
  DATOS.tienda.entrega.despacho.forEach((z) => { assert.equal(z.costo, null); assert.equal(z.plazo, null); });
});

test("el precio de un scrunchie sale de su familia, y el propio manda", () => {
  tiendaDePrueba();
  const pieza = CATALOGO.find((p) => p.id === "doble-limones-rayas");
  assert.equal(precioDe(pieza), 4500);
  pieza.precio = 5200;
  assert.equal(precioDe(pieza), 5200);
  pieza.precio = null;
});

test("el total lo calcula el servidor y el precio del navegador se ignora", () => {
  tiendaDePrueba();
  const p = T.armarPedido([{ id: "monos", cantidad: 1, precio: 1, subtotal: 1 }, { id: "doble-limones-rayas", cantidad: 2 }], "retiro");
  assert.equal(p.total, 8900 + 4500 * 2);
  assert.equal(p.costoDespacho, 0);
});

test("líneas repetidas se juntan antes de mirar el stock", () => {
  tiendaDePrueba();
  CATALOGO.find((p) => p.id === "monos").stock = 2;
  assert.throws(() => T.armarPedido([{ id: "monos", cantidad: 2 }, { id: "monos", cantidad: 1 }], "retiro"), /quedan 2/);
  const ok = T.armarPedido([{ id: "monos", cantidad: 1 }, { id: "monos", cantidad: 1 }], "retiro");
  assert.equal(ok.lineas.length, 1); assert.equal(ok.lineas[0].cantidad, 2);
});

test("un producto agotado no se puede pagar", () => {
  tiendaDePrueba();
  CATALOGO.find((p) => p.id === "monos").stock = 0;
  assert.throws(() => T.armarPedido([{ id: "monos", cantidad: 1 }], "retiro"), /agotado/);
});

for (const [nombre, items, texto] of [
  ["cantidad 0", [{ id: "monos", cantidad: 0 }], /Cantidad/],
  ["cantidad negativa", [{ id: "monos", cantidad: -3 }], /Cantidad/],
  ["cantidad decimal", [{ id: "monos", cantidad: 1.5 }], /Cantidad/],
  ["cantidad disparatada", [{ id: "monos", cantidad: 9999 }], /Cantidad/],
  ["producto inexistente", [{ id: "no-existe", cantidad: 1 }], /ya no está disponible/],
  ["producto sin precio", [{ id: "cojines", cantidad: 1 }], /precio publicado/],
  ["carrito vacío", [], /vacío/]
]) {
  test("se rechaza: " + nombre, () => { tiendaDePrueba(); assert.throws(() => T.armarPedido(items, "retiro"), texto); });
}

test("entrega: retiro gratis; despacho por zona; gratis en Santo Domingo desde 3", () => {
  tiendaDePrueba();
  const sa = T.armarPedido([{ id: "monos", cantidad: 1 }], "despacho", "san-antonio");
  assert.equal(sa.costoDespacho, 3500); assert.equal(sa.total, 8900 + 3500); assert.equal(sa.zonaNombre, "San Antonio");
  assert.throws(() => T.armarPedido([{ id: "monos", cantidad: 2 }], "despacho", "santo-domingo"), /costo definido/);
  const sd = T.armarPedido([{ id: "monos", cantidad: 3 }], "despacho", "santo-domingo");
  assert.equal(sd.costoDespacho, 0);
  assert.throws(() => T.armarPedido([{ id: "monos", cantidad: 1 }], "despacho", "marte"), /zona/);
  assert.throws(() => T.armarPedido([{ id: "monos", cantidad: 1 }], "teletransporte"), /cómo quieres recibir/);
});

test("San Antonio sin costo definido no se puede pagar en línea", () => {
  tiendaDePrueba();
  DATOS.tienda.entrega.despacho.find((z) => z.id === "san-antonio").costo = null;
  assert.throws(() => T.armarPedido([{ id: "monos", cantidad: 5 }], "despacho", "san-antonio"), /costo definido/);
});

/* ======================================================================= */
/* Firma y orden                                                            */
/* ======================================================================= */

test("la firma: ida y vuelta, y cualquier cambio se rechaza", () => {
  const f = T.firmar({ o: "rdr-1", i: [{ id: "monos", c: 2 }] });
  assert.equal(T.verificar(f).i[0].c, 2);
  assert.equal(T.verificar(f.slice(0, -2) + "xy"), null);
  const mac = f.slice(f.lastIndexOf(".") + 1);
  const otro = Buffer.from(JSON.stringify({ o: "rdr-1", i: [{ id: "monos", c: 99 }] })).toString("base64url");
  assert.equal(T.verificar(otro + "." + mac), null);
  assert.equal(T.verificar("cualquier-cosa"), null);
  assert.equal(T.verificar(undefined), null);
});

test("cada orden es única y cabe en los límites de Transbank", () => {
  const ordenes = new Set(), sesiones = new Set();
  for (let i = 0; i < 2000; i++) { ordenes.add(T.nuevaOrden()); sesiones.add(T.nuevaSesion()); }
  assert.equal(ordenes.size, 2000); assert.equal(sesiones.size, 2000);
  for (const o of ordenes) assert.ok(o.length <= 26 && /^[\w-]+$/.test(o));
  for (const s of sesiones) assert.ok(s.length <= 61);
});

/* ======================================================================= */
/* Ambientes                                                                */
/* ======================================================================= */

test("por defecto: integración, con las credenciales públicas de prueba", () => {
  const a = T.ambiente();
  assert.equal(a.nombre, "integracion");
  assert.equal(a.url, "https://webpay3gint.transbank.cl");
  assert.equal(a.codigo, "597055555532");
});

test("en integración nunca viaja una credencial real aunque esté cargada", () => {
  process.env.TRANSBANK_COMMERCE_CODE = "597099999999";
  process.env.TRANSBANK_API_KEY = "LLAVE-REAL-QUE-NO-DEBE-SALIR";
  const a = T.ambiente();
  assert.equal(a.codigo, "597055555532");
  assert.notEqual(a.llave, "LLAVE-REAL-QUE-NO-DEBE-SALIR");
});

test("producción sólo con TRANSBANK_ENVIRONMENT=production y las dos credenciales", () => {
  process.env.TRANSBANK_ENVIRONMENT = "production";
  assert.throws(() => T.ambiente(), T.ErrorConfig);
  process.env.TRANSBANK_COMMERCE_CODE = "597055555532";
  process.env.TRANSBANK_API_KEY = "x";
  assert.throws(() => T.ambiente(), /pruebas no sirve en producción/);
  process.env.TRANSBANK_COMMERCE_CODE = "597012345678";
  const a = T.ambiente();
  assert.equal(a.nombre, "produccion"); assert.equal(a.url, "https://webpay3g.transbank.cl");
});

test("un ambiente mal escrito no cae en silencio a pruebas", () => {
  process.env.TRANSBANK_ENVIRONMENT = "prod";
  assert.throws(() => T.ambiente(), T.ErrorConfig);
});

/* ======================================================================= */
/* /api/crear                                                               */
/* ======================================================================= */

test("crear: arma la transacción con el monto del servidor y el pedido en una cookie", async () => {
  tiendaDePrueba();
  transbank(() => [200, { token: "tok_123", url: "https://webpay3gint.transbank.cl/webpayserver/initTransaction" }]);
  const r = resp();
  await crear(pedidoDe(), r);
  assert.equal(r.codigo, 200, JSON.stringify(r.cuerpo));
  const c = llamadas[0];
  assert.equal(c.metodo, "POST");
  assert.equal(c.url, "https://webpay3gint.transbank.cl/rswebpaytransaction/api/webpay/v1.2/transactions");
  assert.equal(c.cabeceras["Tbk-Api-Key-Id"], "597055555532");
  assert.equal(c.cuerpo.amount, 8900 + 4500 * 2);
  assert.ok(c.cuerpo.buy_order.length <= 26);
  assert.ok(c.cuerpo.session_id.length <= 61 && c.cuerpo.session_id !== c.cuerpo.buy_order);
  assert.equal(c.cuerpo.return_url, "https://r-de-retazos.vercel.app/api/retorno");
  assert.ok(c.cuerpo.return_url.length <= 255, "Transbank no acepta más de 255/256");
  const galleta = r.cabeceras["set-cookie"];
  assert.match(galleta, /^rdr_p_rdr-[\w-]+=/);
  for (const x of ["HttpOnly", "Secure", "SameSite=None", "Path=/api/retorno", "Max-Age=3600"]) assert.ok(galleta.includes(x), x);
  assert.deepEqual(Object.keys(r.cuerpo).sort(), ["orden", "token", "total", "url"]);
  assert.ok(!JSON.stringify(r.cuerpo).includes(LLAVE_PRUEBA), "la respuesta no lleva la llave");
});

test("crear: con dominio propio, la vuelta va siempre a ese dominio", async () => {
  tiendaDePrueba();
  DATOS.sitio.dominio = "rderetazos.cl";
  transbank(() => [200, { token: "t", url: "https://x" }]);
  await crear(pedidoDe(), resp());
  assert.equal(llamadas[0].cuerpo.return_url, "https://rderetazos.cl/api/retorno");
  DATOS.sitio.dominio = null;
});

test("crear: GET 405, tienda cerrada 409, datos malos 400", async () => {
  let r = resp(); await crear({ method: "GET", headers: {} }, r); assert.equal(r.codigo, 405);
  r = resp(); await crear(pedidoDe(), r); assert.equal(r.codigo, 409);
  tiendaDePrueba();
  r = resp(); await crear(pedidoDe({ comprador: { ...comprador, correo: "no-es-correo" } }), r);
  assert.equal(r.codigo, 400); assert.match(r.cuerpo.error, /correo/i);
  r = resp(); await crear(pedidoDe({ entrega: "despacho", zona: "san-antonio", comprador: { ...comprador, direccion: "" } }), r);
  assert.equal(r.codigo, 400); assert.match(r.cuerpo.error, /direcci/i);
});

test("crear: un host raro no se usa para armar la return_url", async () => {
  tiendaDePrueba();
  transbank(() => [200, { token: "t", url: "https://x" }]);
  const r = resp();
  await crear({ ...pedidoDe(), headers: { host: "evil.com/phish?x=" } }, r);
  assert.equal(r.codigo, 503); assert.equal(llamadas.length, 0);
});

test("crear: un error de configuración no muestra detalles ni credenciales", async () => {
  tiendaDePrueba();
  process.env.TRANSBANK_ENVIRONMENT = "production";
  process.env.TRANSBANK_API_KEY = "SECRETO-QUE-NO-DEBE-SALIR";
  transbank(() => [200, {}]);
  const r = resp();
  await crear(pedidoDe(), r);
  assert.equal(r.codigo, 503);
  assert.equal(llamadas.length, 0, "no se llama a Transbank");
  assert.ok(!JSON.stringify(r.cuerpo).includes("SECRETO"));
  assert.ok(!registro.join(" ").includes("SECRETO-QUE-NO-DEBE-SALIR"), "tampoco en el registro");
});

test("crear: Transbank caído da 502 sin detalles", async () => {
  tiendaDePrueba();
  transbank(() => [500, { error_message: "boom" }]);
  const r = resp(); await crear(pedidoDe(), r);
  assert.equal(r.codigo, 502); assert.match(r.cuerpo.error, /Webpay/);
});

/* ======================================================================= */
/* /api/retorno                                                             */
/* ======================================================================= */

/* Hace una ida completa y devuelve la cookie y la orden, como el navegador. */
async function ida(extra) {
  tiendaDePrueba();
  transbank(() => [200, { token: "tok_abc", url: "https://x" }]);
  const r = resp(); await crear(pedidoDe(extra), r);
  const galleta = r.cabeceras["set-cookie"].split(";")[0];
  return { galleta, orden: llamadas[0].cuerpo.buy_order, sesion: llamadas[0].cuerpo.session_id, monto: llamadas[0].cuerpo.amount };
}
const autorizado = (v, extra = {}) => ({ buy_order: v.orden, session_id: v.sesion, amount: v.monto, status: "AUTHORIZED",
  response_code: 0, authorization_code: "1213", card_detail: { card_number: "6623" }, ...extra });
const vuelta = (query, cookie, body) => ({ method: body ? "POST" : "GET", query, body, headers: { cookie: cookie || "" } });

test("retorno aprobado: confirma, comprueba el monto y lo dice", async () => {
  const v = await ida();
  transbank((c) => [200, autorizado(v)]);
  const r = resp();
  await retorno(vuelta({ token_ws: "tok_abc" }, v.galleta), r);
  assert.equal(llamadas[0].metodo, "PUT");
  assert.match(llamadas[0].url, /\/transactions\/tok_abc$/);
  assert.equal(r.codigo, 200);
  assert.match(r.html, /Pago aprobado/);
  assert.match(r.html, /Moños y lazos/);
  assert.match(r.html, new RegExp(v.orden));
  assert.match(r.cabeceras["set-cookie"], /HttpOnly/, "marca la orden como ya confirmada");
  assert.equal(r.cabeceras["cache-control"], "no-store");
});

test("recargar la vuelta no cobra ni avisa dos veces, y muestra lo mismo", async () => {
  const v = await ida();
  transbank(() => [200, autorizado(v)]);
  const r1 = resp(); await retorno(vuelta({ token_ws: "tok_abc" }, v.galleta), r1);
  const marcada = r1.cabeceras["set-cookie"].split(";")[0];
  /* Segunda vez: Transbank rechaza la confirmación repetida; el estado dice AUTHORIZED. */
  transbank((c) => c.metodo === "PUT" ? [422, { error_message: "Invalid status" }] : [200, autorizado(v)]);
  const r2 = resp(); await retorno(vuelta({ token_ws: "tok_abc" }, marcada), r2);
  assert.deepEqual(llamadas.map((c) => c.metodo), ["PUT", "GET"]);
  assert.match(r2.html, /Pago aprobado/);
  assert.equal(r2.cabeceras["set-cookie"], undefined, "no se vuelve a marcar ni a avisar");
});

test("si la confirmación falla sin una confirmación previa, no se dice aprobado", async () => {
  const v = await ida();
  transbank((c) => c.metodo === "PUT" ? [500, {}] : [200, autorizado(v)]);
  const r = resp(); await retorno(vuelta({ token_ws: "tok_abc" }, v.galleta), r);
  assert.equal(r.codigo, 502);
  assert.match(r.html, /Error al procesar el pago/);
  assert.match(r.html, /No vuelvas a pagar/);
});

test("Transbank no responde ni al confirmar ni al consultar", async () => {
  const v = await ida();
  transbank(() => { throw new Error("red caída"); });
  const r = resp(); await retorno(vuelta({ token_ws: "tok_abc" }, v.galleta), r);
  assert.equal(r.codigo, 502);
  assert.match(r.html, /Error al procesar el pago/);
});

test("retorno rechazado", async () => {
  const v = await ida();
  transbank(() => [200, autorizado(v, { status: "FAILED", response_code: -1 })]);
  const r = resp(); await retorno(vuelta({ token_ws: "tok_abc" }, v.galleta), r);
  assert.match(r.html, /Pago rechazado/);
  assert.doesNotMatch(r.html, /Pago aprobado/);
  /* Dice «escribirnos»: el botón de WhatsApp tiene que estar, con la orden. */
  assert.match(r.html, /Escribir por WhatsApp/);
  const wa = decodeURIComponent((r.html.match(/href="(https:\/\/wa\.me\/[^"]+)"/) || [])[1] || "");
  assert.ok(wa.includes("rechazado (orden " + v.orden + ")"), wa);
  assert.match(r.html, /Número de orden<\/p><p class="orden">/);
});

test("las páginas de vuelta usan las fuentes del sitio y ningún gris ilegible", async () => {
  const v = await ida();
  transbank(() => [200, autorizado(v)]);
  const r = resp(); await retorno(vuelta({ token_ws: "tok_abc" }, v.galleta), r);
  assert.match(r.html, /Gracias/);
  assert.match(r.html, /@font-face\{font-family:'Karla'/);
  assert.match(r.html, /@font-face\{font-family:'Cormorant Garamond'/);
  assert.match(r.html, /src:url\(\/fuentes\//);
  assert.doesNotMatch(r.html, /9b9088/i);
  assert.doesNotMatch(r.html, /https?:\/\/(?!wa\.me)/);
});

test("AUTHORIZED con response_code distinto de 0 no es aprobado", async () => {
  const v = await ida();
  transbank(() => [200, autorizado(v, { response_code: -3 })]);
  const r = resp(); await retorno(vuelta({ token_ws: "tok_abc" }, v.galleta), r);
  assert.match(r.html, /Pago rechazado/);
});

test("anulado en el formulario (TBK_TOKEN): cancelado y sin confirmar", async () => {
  transbank(() => [200, {}]);
  const r = resp(); await retorno(vuelta({}, "", { TBK_TOKEN: "tok_x", TBK_ORDEN_COMPRA: "rdr-1", TBK_ID_SESION: "s-1" }), r);
  assert.equal(llamadas.length, 0);
  assert.match(r.html, /Pago cancelado/);
});

test("se acabó el tiempo (sólo TBK_ORDEN_COMPRA): cancelado y sin confirmar", async () => {
  transbank(() => [200, {}]);
  const r = resp(); await retorno(vuelta({ TBK_ORDEN_COMPRA: "rdr-1", TBK_ID_SESION: "s-1" }), r);
  assert.equal(llamadas.length, 0);
  assert.match(r.html, /Pago cancelado/);
});

test("error en el formulario (token_ws y TBK_TOKEN): error y sin confirmar", async () => {
  transbank(() => [200, {}]);
  const r = resp(); await retorno(vuelta({ token_ws: "a", TBK_TOKEN: "a", TBK_ORDEN_COMPRA: "rdr-1" }), r);
  assert.equal(llamadas.length, 0);
  assert.match(r.html, /Error al procesar el pago/);
});

test("llegada sin nada de Transbank: error, sin inventar resultado", async () => {
  transbank(() => [200, {}]);
  const r = resp(); await retorno(vuelta({}), r);
  assert.equal(r.codigo, 400); assert.equal(llamadas.length, 0);
  assert.match(r.html, /Error al procesar el pago/);
});

test("monto que no cuadra: no se da por bueno", async () => {
  const v = await ida();
  transbank(() => [200, autorizado(v, { amount: v.monto - 1 })]);
  const r = resp(); await retorno(vuelta({ token_ws: "tok_abc" }, v.galleta), r);
  assert.match(r.html, /Error al procesar el pago/);
  assert.match(r.html, /No vuelvas a pagar/);
});

test("cookie manipulada o ausente: el pago aprobado se dice, sin detalle inventado", async () => {
  const v = await ida();
  transbank(() => [200, autorizado(v)]);
  const malo = v.galleta.slice(0, -3) + "abc";
  for (const g of [malo, ""]) {
    const r = resp(); await retorno(vuelta({ token_ws: "tok_abc" }, g), r);
    assert.match(r.html, /Pago aprobado/);
    assert.match(r.html, /no encontramos el detalle/);
    assert.doesNotMatch(r.html, /Moños y lazos/);
  }
});

test("una cookie de otra sesión no sirve para esta vuelta", async () => {
  const v = await ida();
  transbank(() => [200, autorizado(v, { session_id: "s-otra" })]);
  const r = resp(); await retorno(vuelta({ token_ws: "tok_abc" }, v.galleta), r);
  assert.match(r.html, /no encontramos el detalle/);
});

test("un token con forma rara no llega a Transbank", async () => {
  transbank(() => [200, {}]);
  const r = resp(); await retorno(vuelta({ token_ws: "../../etc/passwd" }), r);
  assert.equal(llamadas.length, 0);
  assert.match(r.html, /Error al procesar el pago/);
});

test("un error inesperado en la vuelta da la página de la marca, no un 500 genérico", async () => {
  transbank(() => [200, {}]);
  const q = {}; Object.defineProperty(q, "token_ws", { get() { throw new Error("roto"); }, enumerable: true });
  const r = resp(); await retorno({ method: "GET", query: q, headers: {} }, r);
  assert.equal(r.codigo, 500);
  assert.match(r.html, /Error al procesar el pago/);
  assert.match(r.html, /No vuelvas a pagar/);
  assert.doesNotMatch(r.html, /roto|stack|undefined/i);
});

test("ningún mensaje al comprador es técnico ni está en inglés", async () => {
  tiendaDePrueba();
  const textos = [];
  for (const items of [[{ id: "no-existe", cantidad: 1 }], [], [{ id: "monos", cantidad: 0 }]]) {
    const r = resp(); await crear({ ...pedidoDe(), body: { ...pedidoDe().body, items } }, r);
    textos.push(r.cuerpo.error);
  }
  for (const t of textos) assert.doesNotMatch(t, /undefined|null|error \d|something|failed|TypeError/i, t);
});

/* ======================================================================= */
/* Credenciales                                                             */
/* ======================================================================= */

test("ninguna credencial ni nombre de variable secreta en lo que ve el navegador", () => {
  for (const f of ["index.html", "datos.js", "404.html"]) {
    const t = readFileSync(new URL(f, RAIZ), "utf8");
    assert.ok(!t.includes(LLAVE_PRUEBA), f + " no lleva la llave de pruebas");
    assert.ok(!/TRANSBANK_API_KEY|FIRMA_SECRETO|RESEND_API_KEY/.test(t), f + " no nombra secretos");
    assert.ok(!/Tbk-Api-Key/.test(t), f + " no habla con Transbank");
  }
});

test("las credenciales viven sólo en el servidor y salen de variables de entorno", () => {
  const t = readFileSync(new URL("api/_tienda.js", RAIZ), "utf8");
  assert.ok(/process\.env\.TRANSBANK_API_KEY/.test(t));
  assert.ok(!/console\.(log|error)\([^)]*(llave|codigo|TRANSBANK_API_KEY)/.test(t), "no se imprimen");
  /* La única llave escrita es la pública de integración. */
  const llaves = t.match(/[0-9A-F]{64}/g) || [];
  assert.deepEqual([...new Set(llaves)], [LLAVE_PRUEBA]);
});

test.after(() => { console.error = errorOriginal; });

/* vercel.json: JSON estricto, nada que cambie qué se publica ni a dónde va
   cada ruta (eso fue lo que dejó la portada en 404 al principio), y las
   cabeceras de seguridad puestas. */
test("vercel.json: sin rutas ni carpeta de salida, con cabeceras de seguridad", () => {
  const v = JSON.parse(readFileSync(new URL("vercel.json", RAIZ), "utf8"));
  for (const k of ["rewrites", "redirects", "routes", "outputDirectory", "framework", "buildCommand", "cleanUrls", "trailingSlash"])
    assert.equal(v[k], undefined, k);
  const todas = v.headers.find((h) => h.source === "/(.*)");
  assert.ok(todas, "falta el bloque para todas las rutas");
  const h = Object.fromEntries(todas.headers.map((x) => [x.key, x.value]));
  assert.equal(h["X-Content-Type-Options"], "nosniff");
  assert.equal(h["X-Frame-Options"], "DENY");
  assert.match(h["Content-Security-Policy"], /frame-ancestors 'none'/);
  /* Nada que pueda cortar el viaje a Webpay ni la página de vuelta. */
  assert.doesNotMatch(h["Content-Security-Policy"], /form-action|script-src|default-src/);
  assert.equal(h["Referrer-Policy"], undefined);
});
