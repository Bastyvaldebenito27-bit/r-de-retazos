/* ===========================================================================
   Pruebas en un navegador de verdad (Chromium vía Playwright).

   Playwright NO es dependencia del sitio, a propósito: el sitio no tiene paso
   de build ni dependencias, y así sigue. Para correr esto hace falta tenerlo
   instalado aparte y decir dónde está:

     PLAYWRIGHT_MODULE=/ruta/a/node_modules/playwright/index.mjs \
     CHROMIUM_PATH=/ruta/a/chrome \
     node pruebas/navegador.mjs

   Levanta su propio servidor, prueba el sitio tal como está, una copia con
   todos los datos completos (el día del lanzamiento) y otra con datos
   hostiles. Nada de esto sale a internet.
   =========================================================================== */
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const RAIZ = fileURLToPath(new URL("../", import.meta.url));

let chromium;
try {
  const m = process.env.PLAYWRIGHT_MODULE;
  ({ chromium } = await import(m ? (m.startsWith("file:") ? m : pathToFileURL(m).href) : "playwright"));
} catch (e) {
  console.error("No encuentro Playwright. Indica PLAYWRIGHT_MODULE (ver el comienzo de este archivo).");
  process.exit(2);
}

/* --- Servidor estático mínimo ------------------------------------------ */
const TIPOS = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
function servir(dir) {
  return new Promise((ok) => {
    const s = http.createServer((q, r) => {
      let u = decodeURIComponent(q.url.split("?")[0]); if (u.endsWith("/")) u += "index.html";
      const f = path.join(dir, u);
      if (!f.startsWith(dir)) { r.writeHead(403).end(); return; }
      fs.readFile(f, (e, d) => {
        if (e) { r.writeHead(404).end("no"); return; }
        r.writeHead(200, { "Content-Type": TIPOS[path.extname(f)] || "application/octet-stream" }); r.end(d);
      });
    }).listen(0, "127.0.0.1", () => ok({ url: "http://127.0.0.1:" + s.address().port + "/", cerrar: () => s.close() }));
  });
}

/* --- Copias con otros datos ---------------------------------------------- */
function copia(nombre, cambiar) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "rdr-" + nombre + "-"));
  fs.cpSync(RAIZ, d, { recursive: true, filter: (f) => !/[\\/](\.git|pruebas|node_modules)([\\/]|$)/.test(f) });
  const p = path.join(d, "datos.js");
  const s0 = fs.readFileSync(p, "utf8");
  const s1 = cambiar(s0);
  if (s1 === s0) throw new Error("La copia «" + nombre + "» no cambió nada en datos.js");
  fs.writeFileSync(p, s1);
  return d;
}

const LILA = "fotos/scrunchies/l-lila.webp";
const lleno = (s) => s
  .replace(/retrato: null,/, `retrato: "${LILA}",`).replace(/taller: null,/, `taller: "${LILA}",`)
  .replace(/telas: null,/, `telas: "${LILA}",`).replace(/empaque: null,/, `empaque: "${LILA}",`)
  .replace(/videoHero: null,/, `videoHero: { src:"fotos/marca/demo.mp4", cartel:"${LILA}", alt:"" },`)
  .replace(/sitio: \{ dominio: null \}/, 'sitio: { dominio: "rderetazos.cl" }')
  .replace("activo: false", "activo: true")
  .replace(/costo:null/g, "costo:3500").replace(/plazo:null/g, 'plazo:"2 a 3 días"')
  .replace(/precio:null/g, "precio:4500").replace(/medida:null/g, 'medida:"12 cm"').replace(/descripcion:null/g, 'descripcion:"x"')
  .replace(/fotos:\[\], estado:null/g, `fotos:["${LILA}"], estado:null`)
  .replace(/porConfirmar: \[[\s\S]*?\],\n/, "porConfirmar: [],\n")
  .replace(/r:"", falta:"[^"]*"/g, 'r:"Respuesta de prueba."');

const hostil = (s) => s
  .replace(/nombre:"Estrellas de mar fucsia"/, 'nombre:"<img src=x onerror=alert(1)>Fucsia"')
  .replace(/fotos:\["fotos\/scrunchies\/simple-conchas-celeste\.webp"\]/, 'fotos:["javascript:alert(2)"]')
  .replace(/mini:"fotos\/scrunchies\/simple-conchas-durazno-280\.webp"/, 'mini:"https://127.0.0.1:9/rastreo.png"')
  .replace(/tono:"#F797D8"/, 'tono:"red; } body { display:none } :root{--x:"')
  .replace(/\{ id:"simples", nombre:"Simple",/, '{ id:"simples", nombre:"<b onmouseover=alert(3)>Simple</b>",')
  .replace(/"Efectivo",/, '"<img src=y onerror=alert(4)>Efectivo",')
  .replace(/zona:"San Antonio"/, 'zona:"<svg onload=alert(5)>San Antonio"')
  .replace(/galeria: \[\],/, 'galeria: [{ src:"//127.0.0.1:9/x.webp", alt:"x", tipo:"proceso" }, { src:"https://127.0.0.1:9/y.webp", alt:"y" }],')
  .replace(/"Soy Gabriela Gonzales\./, '"<script>alert(6)<\\/script>Soy Gabriela Gonzales.');

/* --- Pequeño marco de pruebas ---------------------------------------------- */
let ok = 0, mal = 0;
const c = (q, cond, extra) => {
  if (cond) { ok++; console.log("  ok   " + q); }
  else { mal++; console.log("  MAL  " + q + (extra !== undefined ? "  → " + JSON.stringify(extra).slice(0, 300) : "")); }
};

const nav = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const sitio = await servir(RAIZ);

async function abrir(base, opts = {}) {
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  const pg = await ctx.newPage();
  const errs = [], fallos = [], fuera = [];
  pg.on("pageerror", (e) => errs.push(e.message));
  pg.on("console", (m) => { if (m.type() === "error" && !/demo\.mp4|Failed to load resource/.test(m.text())) errs.push(m.text()); });
  pg.on("response", (r) => { if (r.status() >= 400 && !/demo\.mp4/.test(r.url())) fallos.push(r.status() + " " + r.url()); });
  pg.on("request", (r) => { if (!r.url().startsWith(base)) fuera.push(r.url()); });
  await pg.goto(base, { waitUntil: "networkidle" });
  return { pg, ctx, errs, fallos, fuera };
}
const ir = (pg, id) => pg.evaluate((i) => document.getElementById(i).scrollIntoView({ behavior: "instant" }), id);

/* ======================================================================= */
console.log("\n== El sitio tal como está ==");
{
  const { pg, ctx, errs, fallos, fuera } = await abrir(sitio.url);
  await pg.mouse.move(700, 500);
  await pg.mouse.wheel(0, 600); await pg.waitForTimeout(250);
  c("la rueda mueve la página de verdad", (await pg.evaluate(() => scrollY)) >= 500);
  await pg.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" })); await pg.waitForTimeout(300);
  const p0 = await pg.evaluate(() => parseFloat(getComputedStyle(document.querySelector(".morf")).getPropertyValue("--p")));
  await pg.evaluate(() => window.scrollTo({ top: innerHeight * 0.9, behavior: "instant" })); await pg.waitForTimeout(400);
  const p1 = await pg.evaluate(() => parseFloat(getComputedStyle(document.querySelector(".morf")).getPropertyValue("--p")));
  c("portada: --p empieza en 0 y llega a 1 con el scroll", p0 < 0.02 && p1 > 0.98, [p0, p1]);

  /* WhatsApp: el número confirmado, en todos los botones */
  const wa = await pg.evaluate(() => [...document.querySelectorAll("a[href*='wa.me']")].map((a) => a.href));
  c("hay botones de WhatsApp (" + wa.length + ")", wa.length >= 6);
  c("todos van al +56 9 7137 1958", wa.every((h) => h.startsWith("https://wa.me/56971371958?text=")), wa.slice(0, 3));
  c("se abren en otra pestaña, sin referrer", await pg.evaluate(() =>
    [...document.querySelectorAll("a[href*='wa.me']")].every((a) => a.target === "_blank" && /noopener/.test(a.rel))));

  /* Contenido confirmado, y lo que no está confirmado no aparece */
  const texto = await pg.evaluate(() => document.body.innerText);
  c("aparece Gabriela Gonzales", /Gabriela Gonzales/.test(texto));
  c("retiro gratuito en Santo Domingo", /Retiro gratuito en Santo Domingo\./.test(texto));
  c("despachos entre Santo Domingo y San Antonio", /Despachos entre Santo Domingo y San Antonio\./.test(texto));
  c("despacho gratuito en Santo Domingo desde 3 pedidos", /Despacho gratuito en Santo Domingo desde 3 pedidos\./.test(texto));
  c("el pago en línea se dice no habilitado", /todavía no está habilitado/.test(texto));
  const montos = (texto.replace(/\$5\.000/g, "").match(/\$\s?[\d.]+/g) || []);
  c("sólo los cuatro precios oficiales de scrunchies", montos.length > 0 && montos.every((m) => /^\$[2-5]\.900$/.test(m)), [...new Set(montos)]);
  c("la línea Scrunchies dice desde $2.900", /Desde \$2\.900/.test(texto));
  const consultar = await pg.$$eval("#catalogo .t", (ts) => ts.filter((t) => /Precio a consultar/.test(t.textContent))
    .map((t) => t.querySelector(".t__abre").textContent));
  c("bolsos, estuches y demás siguen «a consultar»", ["Tote bags", "Bolsos para computador", "Cosmetiqueros", "Moños y lazos", "Recuerdos para celebraciones"]
    .every((n) => consultar.includes(n)), consultar);
  c("ninguna promesa de personalizar cualquier cosa", !/cualquier (idea|tela)|se puede hacer en otra tela/i.test(texto));

  /* Imágenes */
  await pg.evaluate(() => document.querySelectorAll("img").forEach((i) => (i.loading = "eager")));
  await pg.waitForTimeout(800);
  const imgs = await pg.evaluate(() => [...document.querySelectorAll("img,video,source")].map((n) => n.currentSrc || n.src || "").filter(Boolean));
  c("las " + imgs.length + " imágenes son del propio sitio", imgs.every((u) => u.startsWith(sitio.url)), imgs.filter((u) => !u.startsWith(sitio.url)));
  c("ninguna petición sale del sitio", fuera.length === 0, fuera);
  c("ningún recurso falla", fallos.length === 0, fallos);

  /* El hilo, la galería y las tijeras */
  await ir(pg, "comprar"); await pg.waitForTimeout(400);
  await pg.evaluate(() => window.scrollBy(0, innerHeight)); await pg.waitForTimeout(600);
  const h = await pg.evaluate(() => ({
    largo: document.getElementById("hilo-p").getTotalLength(),
    off: parseFloat(getComputedStyle(document.getElementById("hilo-p")).strokeDashoffset),
    nudos: document.querySelectorAll(".nudo").length, on: document.querySelectorAll(".nudo.on").length,
    corte: document.getElementById("tijeras-corte").classList.contains("corta"),
    fotos: document.querySelectorAll("#galeria .foto").length
  }));
  c("el hilo se dibuja entero al llegar al final", h.largo > 500 && h.off < 2, h);
  c("una puntada por sección del recorrido, todas cosidas", h.nudos === 4 && h.on === 4, h);
  c("las tijeras cortan el hilo al final", h.corte);
  c("la galería tiene 5 fotos reales", h.fotos === 5);

  /* Carrusel */
  await ir(pg, "scrunchies"); await pg.waitForTimeout(500);
  c("el carrusel muestra las 29 piezas", (await pg.$$eval("#flujo .flujo__c", (a) => a.length)) === 29);
  const sl = () => pg.evaluate(() => document.getElementById("flujo").scrollLeft);
  const a0 = await sl(); await pg.click("#scr-sig"); await pg.waitForTimeout(600);
  const a1 = await sl(); await pg.click("#scr-ant"); await pg.waitForTimeout(600);
  c("botones siguiente y anterior", a1 > a0 && (await sl()) < a1);
  await pg.focus("#flujo"); const y0 = await pg.evaluate(() => scrollY);
  await pg.keyboard.press("ArrowRight"); await pg.waitForTimeout(500);
  c("la flecha mueve el carrusel y no la página", (await sl()) > a0 && Math.abs((await pg.evaluate(() => scrollY)) - y0) < 3);
  /* Con el carrusel a medias en pantalla (las cartas cortadas abajo), sus
     botones y flechas mueven sólo el carrusel: la página no salta. */
  await pg.evaluate(() => { const f = document.getElementById("flujo");
    scrollTo({ top: scrollY + f.getBoundingClientRect().top - innerHeight + 120, behavior: "instant" }); });
  await pg.waitForTimeout(300);
  const y1 = await pg.evaluate(() => scrollY), a2 = await sl();
  await pg.evaluate(() => document.getElementById("scr-sig").click()); await pg.waitForTimeout(600);
  await pg.evaluate(() => document.getElementById("flujo").focus({ preventScroll: true }));
  await pg.keyboard.press("ArrowRight"); await pg.waitForTimeout(600);
  const y2 = await pg.evaluate(() => scrollY);
  c("con el carrusel a medias en pantalla, la página no salta", (await sl()) > a2 && Math.abs(y2 - y1) < 3, { y1, y2 });
  await pg.keyboard.press("End");
  await pg.waitForFunction(() => { const f = document.getElementById("flujo"); return f.scrollLeft > f.scrollWidth - f.clientWidth - 4; }, null, { timeout: 5000 });
  await pg.waitForTimeout(400);
  c("Fin llega a la última y lo anuncia", /29 de 29/.test(await pg.textContent("#scr-pie")));
  c("los filtros muestran la lista de precios oficial", (await pg.$$eval("#scr-chips .chip", (x) => x.map((e) => e.textContent))).join("|") ===
    "Todas|Simple · $2.900|Simple con sesgo · $3.900|XL con sesgo · $4.900|Doble con sesgo · $5.900");
  await pg.click("#scr-chips .chip >> text=Doble con sesgo"); await pg.waitForTimeout(400);
  c("filtro «Doble con sesgo»: 4 piezas", (await pg.$$eval("#flujo .flujo__c", (a) => a.length)) === 4);
  await pg.click("#scr-chips .chip >> text=XL con sesgo"); await pg.waitForTimeout(400);
  c("filtro «XL con sesgo»: 5 piezas, otra familia", (await pg.$$eval("#flujo .flujo__c", (a) => a.length)) === 5);
  await pg.click("#scr-chips .chip >> nth=0"); await pg.waitForTimeout(400);
  await pg.click("#scr-sig"); await pg.waitForTimeout(700);
  const nom = (await pg.textContent("#flujo .flujo__c.es .flujo__n2")).trim();
  await pg.click("#flujo .flujo__c.es .flujo__t"); await pg.waitForTimeout(500);
  c("la carta abre su ficha (" + nom + ")", (await pg.textContent("#fp-titulo")).trim() === nom);
  c("la ficha del scrunchie lleva el precio de lista de su familia", /^\$[2-5]\.900$/.test((await pg.textContent(".ficha-p .precio")).trim()));
  await pg.keyboard.press("Escape");

  /* Galería: una pieza abre su ficha */
  await ir(pg, "galeria"); await pg.waitForTimeout(500);
  await pg.click("#galeria .foto__b >> nth=0"); await pg.waitForTimeout(400);
  c("una foto de la galería abre la ficha de su pieza", await pg.evaluate(() => document.querySelector("dialog.ficha-p").open));
  await pg.keyboard.press("Escape");

  /* Formulario de idea: arma el mensaje y lo manda a WhatsApp */
  await ir(pg, "personalizados");
  await pg.fill("#f-nombre", "Ana"); await pg.fill("#f-detalle", "Un bolso para mi notebook");
  await pg.click("#f-enviar"); await pg.waitForTimeout(300);
  const msg = await pg.inputValue("#f-salida");
  c("el formulario arma el mensaje de creación especial", /soy Ana/.test(msg) && /creación especial/.test(msg) && /notebook/.test(msg), msg);
  c("y el botón abre WhatsApp con ese mensaje", /wa\.me\/56971371958\?text=.*Ana/.test(await pg.getAttribute("#form .b--p.b--sm", "href")));

  /* El sello */
  const sello = await pg.evaluate(async () => {
    const i = document.querySelector(".morf__sello img"), b = i.getBoundingClientRect();
    const crudo = await new Promise((r) => { const n = new Image(); n.onload = () => r([n.naturalWidth, n.naturalHeight]); n.src = i.currentSrc; });
    const cab = document.querySelector(".marca__r img").getBoundingClientRect();
    return { crudo, prop: b.width / b.height, cab: cab.width / cab.height };
  });
  c("el sello es el archivo original, cuadrado y sin deformar", sello.crudo[0] === sello.crudo[1] && sello.crudo[0] >= 512 &&
    Math.abs(sello.prop - 1) < 0.02 && Math.abs(sello.cab - 1) < 0.02, sello);
  c("sin errores de JavaScript ni de consola", errs.length === 0, errs);
  await ctx.close();
}

console.log("\n== Fotos reales de la marca ==");
{
  const { pg, ctx, errs, fallos, fuera } = await abrir(sitio.url);
  await pg.evaluate(() => document.querySelectorAll("img").forEach((i) => (i.loading = "eager")));
  await pg.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 25)); } });
  await pg.waitForLoadState("networkidle"); await pg.waitForTimeout(300);
  const r = await pg.evaluate(() => {
    const tarjeta = (n) => [...document.querySelectorAll("#catalogo .t")].find((t) => t.querySelector(".t__abre").textContent === n);
    const foto = (n) => { const t = tarjeta(n), i = t && t.querySelector(".marco img"), m = t && t.querySelector(".marco");
      return i ? { src: i.getAttribute("src"), alt: i.alt, ok: i.complete && i.naturalWidth > 0,
                   prop: Math.round(m.clientWidth / m.clientHeight * 100) / 100 } : null; };
    const enc = document.getElementById("encargo"), ei = document.getElementById("encargo-img");
    const texto = document.body.innerText;
    const etiquetas = [...document.querySelectorAll("#catalogo .marco__et")].map((e) => e.textContent);
    const borrador = [...document.querySelectorAll("#borrador-lista li")].map((l) => l.textContent);
    const g0 = document.querySelector("#galeria .foto img");
    return {
      monos: foto("Moños y lazos"), tote: foto("Tote bags"), porta: foto("Bolsos para computador"),
      cosm: foto("Cosmetiqueros"), recu: foto("Recuerdos para celebraciones"), scr: foto("Scrunchies"),
      sinFoto: [...document.querySelectorAll("#catalogo .t")].filter((t) => !t.querySelector(".marco img")).map((t) => t.querySelector(".t__abre").textContent),
      texto, etiquetas, borrador,
      enc: { visible: !enc.hidden && enc.getBoundingClientRect().height > 0, ok: ei.complete && ei.naturalWidth === 900,
             src: ei.getAttribute("src"),
             alt: ei.alt, pie: document.getElementById("encargo-pie").textContent },
      gal: { src: g0.getAttribute("src"), alt: g0.alt, cap: document.querySelector("#galeria .foto figcaption").textContent },
      rotas: [...document.images].filter((i) => i.getAttribute("src") && i.complete && i.naturalWidth === 0).map((i) => i.getAttribute("src"))
    };
  });
  const esta = (f, archivo) => f && f.ok && f.src === "fotos/productos/" + archivo && f.alt.length > 25 && f.prop === 0.8;
  c("moños: su foto real, cargada, con alt descriptivo y marco 4:5", esta(r.monos, "monos-tres-telas.webp"), r.monos);
  c("tote bags: la tote a rayas", esta(r.tote, "tote-rayas-rosa-rojo.webp"), r.tote);
  c("bolsos para computador: el bolso con su porta cables", esta(r.porta, "bolso-computador-rayas.webp"), r.porta);
  c("cosmetiqueros: el estuche a rayas", esta(r.cosm, "estuche-rayas-rosa-rojo.webp"), r.cosm);
  c("recuerdos: el canasto, sin el nombre de la tarjeta", esta(r.recu, "recuerdos-canasto.webp"), r.recu);
  c("la cuadrícula queda pareja: también la línea Scrunchies va en 4:5", r.scr && r.scr.prop === 0.8, r.scr);
  c("sin foto quedan sólo las líneas sin foto real", r.sinFoto.join(",") === "Cojines,Delantales personalizados,Llaveros,Cajas de regalo", r.sinFoto);
  c("«Regalos y recuerdos» muestra el encargo en su versión sin datos personales, con su frase en el alt",
    r.enc.visible && r.enc.ok && r.enc.src === "fotos/marca/encargo-canasto.webp" && /amor y dedicación/.test(r.enc.alt) &&
    /mamita muy especial/.test(r.enc.pie), r.enc);
  c("la imagen con el nombre de la bebé no se publica", !fs.existsSync(path.join(RAIZ, "fotos/marca/encargo-mamita-especial.webp")) &&
    !/encargo-mamita-especial/.test(fs.readFileSync(path.join(RAIZ, "datos.js"), "utf8") + fs.readFileSync(path.join(RAIZ, "index.html"), "utf8")));
  c("ninguna tarjeta dice «Foto pendiente»: las líneas sin foto llevan su etiqueta de tela",
    !/Foto pendiente/i.test(r.texto) && r.etiquetas.join(",") === "Cojines,Delantales personalizados,Llaveros,Cajas de regalo", r.etiquetas);
  c("la barra de borrador no pide fotos ni video", !r.borrador.some((t) => /foto|video/i.test(t)), r.borrador);
  c("la galería del taller abre con la foto real del proceso", r.gal.src === "fotos/marca/taller-corazones.webp" && /tijeras/.test(r.gal.alt) && r.gal.cap === "En el taller", r.gal);
  c("ninguna imagen rota", r.rotas.length === 0, r.rotas);
  c("ninguna petición fuera del sitio ni respuesta con error", fuera.length === 0 && fallos.length === 0, { fuera, fallos });
  c("sin errores de JavaScript", errs.length === 0, errs);
  await pg.click("#catalogo .t .t__abre >> text=Bolsos para computador"); await pg.waitForTimeout(400);
  const ficha = await pg.evaluate(() => { const m = document.querySelector(".ficha-p .marco"), i = m.querySelector("img");
    return { prop: Math.round(m.clientWidth / m.clientHeight * 100) / 100, src: i && i.getAttribute("src"), precio: document.querySelector(".ficha-p .precio").textContent }; });
  c("su ficha: la misma foto en 4:5 y «Precio a consultar», sin inventar precio", ficha.prop === 0.8 && /bolso-computador/.test(ficha.src) && /consultar/i.test(ficha.precio), ficha);
  await ctx.close();
}

console.log("\n== Terminaciones ==");
{
  const { pg, ctx, errs } = await abrir(sitio.url);
  const visibles = await pg.evaluate(() => [...document.querySelectorAll("body *")]
    .filter((n) => [...n.childNodes].some((t) => t.nodeType === 3 && t.textContent.includes("+56 9 7137 1958")))
    .map((n) => n.closest("section,footer,nav,header")?.id || n.closest("footer,nav")?.className || "?"));
  c("el número +56 9 7137 1958 se ve escrito en contacto, cómo comprar, menú y pie",
    ["contacto", "comprar"].every((x) => visibles.includes(x)) && visibles.some((x) => /panel/.test(x)) && visibles.some((x) => /pie/.test(x)), visibles);
  c("y no está repetido de más (≤ 6 veces)", visibles.length <= 6, visibles.length);

  const msj = await pg.evaluate(() => {
    const t = (sel) => { const a = document.querySelector(sel); return a ? decodeURIComponent(a.href.split("text=")[1] || "") : ""; };
    return { idea: t("#cta-idea"), pedido: t('[data-wa="pedido"]'), caja: t('[data-wa="caja"]'), general: t("#cta-flotante"),
             producto: t("#rejilla .t:nth-child(2) .t__p a") };
  });
  c("mensaje de creaciones especiales", msj.idea === "Hola, quiero consultar por una creación especial.", msj.idea);
  c("mensaje general", msj.general === "Hola, me gustaría consultar por los productos de R de Retazos.", msj.general);
  c("mensaje de pedido y de caja de regalo, cada uno el suyo", /hacer un pedido/.test(msj.pedido) && /caja de regalo/.test(msj.caja), msj);
  c("el de un producto dice cuál", /«Scrunchies»/.test(msj.producto), msj.producto);

  const anclas = await pg.evaluate(() => [...document.querySelectorAll('a[href^="#"]')]
    .map((a) => a.getAttribute("href")).filter((h) => h.length > 1 && !document.getElementById(h.slice(1))));
  c("ningún enlace interno lleva a una sección que no existe", anclas.length === 0, anclas);
  c("ningún enlace vacío (href=\"#\")", (await pg.$$eval('a[href="#"]', (a) => a.length)) === 0);

  const legales = await pg.$$eval(".pie a", (a) => a.map((x) => x.getAttribute("href")));
  c("el pie enlaza a términos, privacidad y cambios", ["terminos.html", "privacidad.html", "cambios.html"].every((x) => legales.includes(x)), legales);
  c("y a inicio, productos, sobre, cómo comprar y preguntas",
    ["#inicio", "#catalogo", "#sobre", "#comprar", "#preguntas"].every((x) => legales.includes(x)));

  const pasos = await pg.$$eval("#comprar-pasos li h3", (h) => h.map((x) => x.textContent));
  c("«Cómo comprar» en 5 pasos, sin decir que se paga en la web", pasos.length === 5 && pasos[1] === "Escríbeme por WhatsApp", pasos);

  /* Menú del teléfono: abre, muestra el número y Esc lo cierra. */
  await pg.setViewportSize({ width: 390, height: 844 });
  await pg.click("#menu-b");
  c("el menú del teléfono muestra el WhatsApp", /\+56 9 7137 1958/.test(await pg.textContent("#panel")));
  await pg.keyboard.press("Escape");
  c("Esc cierra el menú y devuelve el foco", (await pg.evaluate(() => document.getElementById("panel").hidden && document.activeElement.id)) === "menu-b");
  c("sin errores", errs.length === 0, errs);
  await ctx.close();
}

console.log("\n== Una foto que no carga ==");
{
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
  const pg = await ctx.newPage();
  await pg.route("**/fotos/scrunchies/sesgo-estrellas-rosa.webp", (r) => r.fulfill({ status: 404, body: "no" }));
  await pg.goto(sitio.url, { waitUntil: "networkidle" });
  await ir(pg, "catalogo"); await pg.waitForTimeout(600);
  const r = await pg.evaluate(() => ({ rotas: [...document.querySelectorAll("img")].filter((i) => i.complete && !i.naturalWidth && i.style.visibility !== "hidden" && !i.dataset.rota).length,
    aviso: /Foto no disponible/.test(document.getElementById("rejilla").textContent) }));
  c("en vez del icono roto queda «Foto no disponible»", r.aviso && r.rotas === 0, r);
  await ctx.close();
}

console.log("\n== Páginas legales ==");
for (const f of ["terminos", "privacidad", "cambios"]) {
  const { pg, ctx, errs, fallos } = await abrir(sitio.url + f + ".html");
  const r = await pg.evaluate(() => ({
    h1: document.querySelectorAll("h1").length, noindex: !!document.querySelector('meta[name="robots"][content*="noindex"]'),
    tel: document.body.innerText.includes("+56 9 7137 1958"),
    pend: document.querySelectorAll(".pend").length,
    vacios: [...document.querySelectorAll("[data-dato],[data-lista]")].filter((n) => !n.textContent.trim()).length,
    rut: /\b\d{1,2}\.\d{3}\.\d{3}-[\dkK]\b/.test(document.body.innerText),
    volver: !!document.querySelector('a[href="/"]'),
    borrador: !!document.querySelector(".borrador")
  }));
  c(f + ": un h1, noindex mientras sea borrador, aviso de borrador y vuelta a la tienda", r.h1 === 1 && r.noindex && r.borrador && r.volver, r);
  c(f + ": muestra el WhatsApp y llena todos los datos desde DATOS", r.tel && r.vacios === 0, r);
  c(f + ": lo no definido queda como pendiente, y no hay ningún RUT inventado", r.pend >= 5 && !r.rut, r);
  c(f + ": sin errores ni recursos rotos", errs.length === 0 && fallos.length === 0, { errs, fallos });
  await ctx.close();
}
{
  const { pg, ctx } = await abrir(sitio.url + "terminos.html");
  const t = await pg.evaluate(() => document.body.innerText);
  c("términos: entrega y pago salen de los mismos datos que la portada",
    /Retiro gratuito en Santo Domingo\./.test(t) && /Transferencia bancaria/.test(t) && /todavía no está habilitado/.test(t));
  await ctx.close();
  const p2 = await abrir(sitio.url + "privacidad.html");
  const t2 = await p2.pg.evaluate(() => document.body.innerText);
  c("privacidad: no inventa analítica ni cookies de seguimiento", /no usa cookies de publicidad ni de analítica/.test(t2) && !/Google Analytics|Meta Pixel|Hotjar/.test(t2));
  await p2.ctx.close();
}

console.log("\n== Teléfonos y pantallas ==");
for (const [w, h] of [[320, 640], [375, 812], [390, 844], [430, 932], [768, 1024], [1440, 900]]) {
  const { pg, ctx, errs } = await abrir(sitio.url, { viewport: { width: w, height: h }, hasTouch: w < 768, isMobile: w < 768 });
  for (const id of ["scrunchies", "sobre", "taller", "comprar", "contacto"]) { await ir(pg, id); await pg.waitForTimeout(150); }
  const r = await pg.evaluate(() => ({
    sobra: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    h1: document.querySelectorAll("h1").length,
    vacios: [...document.querySelectorAll("a,button")].filter((a) => !a.textContent.trim() && !a.getAttribute("aria-label") && !a.querySelector("img[alt]:not([alt=''])")).length,
    chicos: [...document.querySelectorAll("a.b,button.b,.flujo__n,.chip,.menu-b")].filter((a) => { const b = a.getBoundingClientRect(); return b.width > 0 && b.height < 32; }).length,
    letra: Math.min(...[...document.querySelectorAll("p,li,a,button,label")].filter((n) => n.offsetParent && n.textContent.trim()).map((n) => parseFloat(getComputedStyle(n).fontSize)))
  }));
  if (w <= 430) {
    for (const f of ["terminos", "privacidad", "cambios"]) {
      const l = await ctx.newPage();
      await l.goto(sitio.url + f + ".html", { waitUntil: "networkidle" });
      const so = await l.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (so !== 0) r.legal = (r.legal || []).concat(f + ":" + so);
      await l.close();
    }
  }
  c(w + " px: sin scroll horizontal (portada y legales), un h1, botones con nombre, tocables y letra ≥ 11 px",
    r.sobra === 0 && !r.legal && r.h1 === 1 && r.vacios === 0 && r.chicos === 0 && r.letra >= 11 && errs.length === 0, { ...r, errs });
  await ctx.close();
}

console.log("\n== Teclado ==");
{
  const { pg, ctx } = await abrir(sitio.url);
  await pg.evaluate(() => document.body.focus());
  const sinAnillo = []; let n = 0, anterior = "", rep = 0;
  for (let i = 0; i < 320; i++) {
    await pg.keyboard.press("Tab");
    const r = await pg.evaluate(() => {
      const a = document.activeElement; if (!a || a === document.body) return null;
      const cs = getComputedStyle(a), t = a.closest(".t");
      /* La posición en el documento distingue botones iguales (las fotos de
         la galería no tienen texto, sólo aria-label). */
      const pos = Array.prototype.indexOf.call(document.querySelectorAll("*"), a);
      return { et: (a.tagName + "." + (a.className || a.id || "")).slice(0, 40), txt: (a.textContent || a.getAttribute("aria-label") || "").trim().slice(0, 20) + "@" + pos,
        anillo: (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) || (t && getComputedStyle(t).outlineStyle !== "none") };
    });
    if (!r) break;
    const k = r.et + "|" + r.txt; if (k === anterior) { if (++rep > 2) break; } else rep = 0; anterior = k;
    n++; if (!r.anillo) sinAnillo.push(r);
  }
  c("los " + n + " elementos alcanzables con Tab muestran anillo de foco", n > 90 && sinAnillo.length === 0, sinAnillo);
  await ctx.close();
}

console.log("\n== Con «reducir movimiento» ==");
{
  const { pg, ctx } = await abrir(sitio.url, { reducedMotion: "reduce" });
  await pg.waitForTimeout(300);
  c("la portada se ve en su estado final", parseFloat(await pg.evaluate(() => getComputedStyle(document.querySelector(".morf")).getPropertyValue("--p"))) === 1);
  await ir(pg, "scrunchies"); await pg.waitForTimeout(300);
  c("el carrusel no gira", (await pg.$eval("#flujo .flujo__t", (n) => getComputedStyle(n).transform)) === "none");
  await ir(pg, "sobre"); await pg.waitForTimeout(300);
  const r = await pg.evaluate(() => ({ off: getComputedStyle(document.getElementById("hilo-p")).strokeDashoffset,
    aguja: getComputedStyle(document.getElementById("aguja")).display,
    orden: getComputedStyle(document.getElementById("galeria")).getPropertyValue("--orden").trim(),
    invisibles: [...document.querySelectorAll(".rev")].filter((n) => getComputedStyle(n).opacity !== "1").length }));
  c("el hilo está entero, sin aguja; la galería ya ordenada; nada invisible",
    parseFloat(r.off) === 0 && r.aguja === "none" && r.orden === "1" && r.invisibles === 0, r);
  await ctx.close();
}

console.log("\n== El día que lleguen todos los datos ==");
{
  const dir = copia("lleno", lleno);
  const s = await servir(dir);
  const { pg, ctx, errs } = await abrir(s.url);
  await pg.waitForTimeout(400);
  const r = await pg.evaluate(() => ({
    barra: !document.getElementById("borrador").hidden,
    lista: [...document.querySelectorAll("#borrador-lista li")].map((l) => l.textContent),
    huecos: document.querySelectorAll(".marco__n,.pend").length,
    video: !!document.querySelector(".morf__disco video"),
    retrato: document.getElementById("retrato").classList.contains("retrato--foto"),
    carro: !document.getElementById("abrir-carro").hidden,
    consultar: document.querySelectorAll(".precio--c").length
  }));
  c("la barra de borrador desaparece", !r.barra, r.lista);
  c("no queda ni un hueco ni un pendiente", r.huecos === 0, r.huecos);
  c("el video entra en el disco de la portada", r.video);
  c("la foto de Gabriela reemplaza al sello", r.retrato);
  c("el carrito se enciende y los precios aparecen", r.carro && r.consultar === 0, r);
  c("la página dice que se puede pagar en línea", /pagar en línea con Webpay/.test(await pg.evaluate(() => document.body.innerText)));
  c("«Cómo comprar» cambia a los pasos con carrito", (await pg.$$eval("#comprar-pasos li h3", (h) => h.map((x) => x.textContent)))[1] === "Revisa tu pedido");
  await pg.click("#abrir-carro"); await pg.waitForTimeout(300);
  c("carrito vacío: lo dice y ofrece volver al catálogo", /Tu pedido está vacío/.test(await pg.textContent("#carro-cuerpo")) && await pg.isVisible("#carro-ir"));
  await pg.click("#carro-ir"); await pg.waitForTimeout(300);
  c("y ese botón cierra el carrito", !(await pg.evaluate(() => document.getElementById("carro").open)));

  await ir(pg, "scrunchies"); await pg.waitForTimeout(400);
  await pg.click("#scr-sig"); await pg.waitForTimeout(600);
  const nom = (await pg.textContent("#flujo .flujo__c.es .flujo__n2")).trim();
  await pg.click("#flujo .flujo__c.es .flujo__t"); await pg.waitForTimeout(400);
  c("la ficha del scrunchie muestra el precio de su familia", /\$4\.500/.test(await pg.textContent(".ficha-p .precio")));
  await pg.click(".ficha-p .fp__acc .b--p"); await pg.waitForTimeout(500);
  const carro = await pg.evaluate(() => ({
    n: document.getElementById("carro-n").textContent,
    lineas: document.getElementById("carro-lineas").textContent,
    entrega: [...document.querySelectorAll('#carro-entrega input')].map((i) => i.value + (i.disabled ? ":no" : "")),
    guardado: localStorage.getItem("rdr-carrito")
  }));
  c("entra al carrito la pieza elegida", carro.n === "1" && carro.lineas.includes(nom), carro);
  c("retiro y las dos zonas de despacho se ofrecen", carro.entrega.join(",") === "retiro,despacho:santo-domingo,despacho:san-antonio", carro.entrega);
  await pg.check('#carro-entrega input[value="despacho:san-antonio"]'); await pg.waitForTimeout(200);
  c("despacho a San Antonio suma su costo", /Despacho a San Antonio\s*\$3\.500/.test(await pg.textContent("#carro-sumas")));
  c("y pide la dirección", await pg.isVisible("#c-dir"));
  const legal = await pg.$$eval(".carro__legal a", (a) => a.map((x) => x.getAttribute("href")));
  c("antes de pagar: aviso con enlaces a términos, privacidad y cambios", legal.join(",") === "terminos.html,privacidad.html,cambios.html", legal);
  c("y el precio unitario de cada línea", /\$4\.500 c\/u/.test(await pg.textContent("#carro-lineas")));
  c("el aviso legal se lee antes del botón de pagar", await pg.evaluate(() =>
    !!(document.querySelector(".carro__legal").compareDocumentPosition(document.getElementById("carro-pagar")) & Node.DOCUMENT_POSITION_FOLLOWING)));
  c("los campos topan donde topa el servidor", await pg.evaluate(() =>
    ["c-nombre:50", "c-tel:16", "c-mail:60", "c-dir:120", "c-nota:120"].every((x) => { const [id, n] = x.split(":"); return document.getElementById(id).maxLength === +n; })));
  await pg.click("#carro-pagar"); await pg.waitForTimeout(200);
  const vacio = await pg.evaluate(() => ({ err: document.getElementById("carro-err").textContent,
    foco: document.activeElement.id, inv: document.getElementById("c-nombre").getAttribute("aria-invalid") }));
  c("sin nombre: lo dice, marca el campo y le pone el foco", vacio.err === "Escribe tu nombre." && vacio.foco === "c-nombre" && vacio.inv === "true", vacio);
  await pg.fill("#c-nombre", "Ana");
  c("y al escribir se quita la marca", await pg.getAttribute("#c-nombre", "aria-invalid") === null);
  /* Se corta la red justo al pagar: el mensaje es humano y en castellano. */
  await pg.route("**/api/crear", (r) => r.abort("internetdisconnected"));
  await pg.fill("#c-nombre", "Ana"); await pg.fill("#c-tel", "+56912345678"); await pg.fill("#c-mail", "ana@ejemplo.cl");
  await pg.fill("#c-dir", "Calle 1"); await pg.click("#carro-pagar"); await pg.waitForTimeout(500);
  const err = await pg.textContent("#carro-err");
  c("si se corta la conexión, lo dice en castellano y sin tecnicismos", /Se cortó la conexión/.test(err) && !/fetch|Failed|Error/i.test(err), err);
  c("y el botón vuelve a estar disponible", await pg.isEnabled("#carro-pagar"));
  c("sin errores de JavaScript", errs.length === 0, errs);
  await ctx.close(); s.cerrar();

  /* El servidor de esa misma copia cobra con sus propios precios. */
  process.env.FIRMA_SECRETO = "x";
  const T = await import(pathToFileURL(path.join(dir, "api/_tienda.js")).href);
  const p = T.armarPedido([{ id: "doble-limones-rayas", cantidad: 2, precio: 1 }], "retiro");
  c("el servidor cobra 2 × $4.500 e ignora el precio del navegador", p.total === 9000);
  const g = T.armarPedido([{ id: "doble-limones-rayas", cantidad: 3 }], "despacho", "santo-domingo");
  c("con 3 productos, el despacho en Santo Domingo es gratis", g.costoDespacho === 0);
  /* El carrito en un teléfono: con la tienda encendida, la cabecera suma un
     botón y nada puede empujar la página ni cortar el carrito. */
  for (const w of [320, 390]) {
    const s2 = await servir(dir);
    const m = await abrir(s2.url, { viewport: { width: w, height: 800 }, isMobile: true, hasTouch: true });
    await m.pg.evaluate(() => localStorage.setItem("rdr-carrito", JSON.stringify([{ id: "doble-limones-rayas", cantidad: 1 }])));
    await m.pg.reload({ waitUntil: "networkidle" });
    await m.pg.click("#abrir-carro"); await m.pg.waitForTimeout(400);
    const r2 = await m.pg.evaluate(() => {
      const d = document.getElementById("carro").getBoundingClientRect();
      return { sobra: document.documentElement.scrollWidth - document.documentElement.clientWidth,
               izq: Math.round(d.left), der: Math.round(innerWidth - d.right) };
    });
    c(w + " px: con el carrito abierto, nada se desborda y el carrito entra entero", r2.sobra === 0 && r2.izq >= 0 && r2.der >= 0, r2);
    await m.ctx.close(); s2.cerrar();
  }
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log("\n== Producto agotado (stock: 0) ==");
{
  const dir = copia("agotado", (t) => lleno(t.replace('{ id:"cojines", nombre:"Cojines", cat:"hogar", precio:null,',
    '{ id:"cojines", nombre:"Cojines", cat:"hogar", stock:0, precio:null,')));
  const s = await servir(dir);
  const { pg, ctx, errs } = await abrir(s.url);
  await pg.waitForTimeout(400);
  const tarjeta = pg.locator(".t", { has: pg.locator(".t__abre", { hasText: /^Cojines$/ }) });
  const sello = tarjeta.locator(".sello");
  c("la tarjeta lo marca como agotado, con letra legible",
    (await sello.count()) === 1 && (await sello.textContent()) === "Agotado" &&
    parseFloat(await sello.evaluate((e) => getComputedStyle(e).fontSize)) >= 11.5);
  await tarjeta.locator(".t__abre").click(); await pg.waitForTimeout(400);
  const ficha = await pg.evaluate(() => {
    const acc = document.querySelector(".ficha-p .fp__acc");
    return { agregar: !!acc.querySelector("button.b--p"), wa: decodeURIComponent(acc.querySelector("a").href),
             sello: (document.querySelector(".ficha-p .sello") || {}).textContent };
  });
  c("la ficha no deja agregarlo al carrito", !ficha.agregar && ficha.sello === "Agotado", ficha);
  c("y el WhatsApp pregunta si se puede volver a hacer, sin prometerlo", /Cojines» de R de Retazos está agotado\. ¿Se podrá volver a hacer\?/.test(ficha.wa), ficha.wa);
  await pg.keyboard.press("Escape"); await pg.waitForTimeout(300);
  await pg.locator(".t", { has: pg.locator(".t__abre", { hasText: /^Llaveros$/ }) }).locator(".t__abre").click();
  await pg.waitForTimeout(400);
  c("un producto con stock sí se puede agregar", await pg.locator(".ficha-p .fp__acc button.b--p").count() === 1);
  c("sin errores de JavaScript", errs.length === 0, errs);
  await ctx.close(); s.cerrar();
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log("\n== Con datos hostiles en cada campo nuevo ==");
{
  const dir = copia("hostil", hostil);
  const s = await servir(dir);
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
  const pg = await ctx.newPage();
  const dialogos = [], errs = [], fuera = [];
  pg.on("dialog", (d) => { dialogos.push(d.message()); d.dismiss(); });
  pg.on("pageerror", (e) => errs.push(e.message));
  pg.on("request", (r) => { if (!r.url().startsWith(s.url)) fuera.push(r.url()); });
  await pg.goto(s.url, { waitUntil: "networkidle" });
  for (const id of ["scrunchies", "sobre", "taller", "comprar", "preguntas", "contacto"]) { await ir(pg, id); await pg.waitForTimeout(250); }
  await pg.click("#borrador-b").catch(() => {});
  const r = await pg.evaluate(() => ({
    inyectado: document.querySelectorAll("main script, main svg[onload], img[onerror], b[onmouseover], img[src^='javascript']").length,
    cuerpo: getComputedStyle(document.body).display,
    nombre: [...document.querySelectorAll(".flujo__n2")].some((n) => n.textContent.includes("<img src=x"))
  }));
  c("ningún alert se ejecuta", dialogos.length === 0, dialogos);
  c("nada inyectado en el documento", r.inyectado === 0, r);
  c("el texto hostil se muestra como texto", r.nombre);
  c("el CSS hostil no rompe la página", r.cuerpo !== "none");
  c("ninguna petición sale del sitio (ni // ni https:// ni javascript:)", fuera.length === 0, fuera);
  c("sin errores de JavaScript", errs.length === 0, errs);
  await ctx.close(); s.cerrar();
  fs.rmSync(dir, { recursive: true, force: true });
}

sitio.cerrar();
await nav.close();
console.log("\n" + ok + " bien, " + mal + " mal");
process.exit(mal ? 1 : 0);
