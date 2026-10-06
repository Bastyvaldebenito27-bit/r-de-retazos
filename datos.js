/* ===========================================================================
   DATOS — EL ÚNICO ARCHIVO QUE HAY QUE EDITAR.

   Lo leen dos cosas: la página que ve el cliente y, cuando el cobro en línea
   está encendido, las funciones del servidor que calculan cuánto cobrar. Por
   eso el precio vive aquí y en ningún otro sitio: el navegador nunca decide
   el monto.

   Lo que está en "" o en null todavía no existe: la página lo marca arriba
   como pendiente en vez de inventárselo.
   =========================================================================== */
export const DATOS = {

  /* La dirección definitiva del sitio, sin https:// ni barra final. Ej:
     "rderetazos.cl". Mientras sea null, la web funciona igual en la dirección
     de Vercel; al ponerla, el pago vuelve siempre a este dominio. */
  sitio: { dominio: null },

  contacto: {
    /* Confirmado. Con código de país, sin + ni espacios. */
    whatsapp: "56971371958",
    /* Confirmado: la cuenta real de la marca. */
    instagram: "rderetazos",
    ciudad: "Santo Domingo, Chile",
    /* No hay correo confirmado: no se publica ninguno. */
    correo: null
  },

  /* Confirmado por la marca. Cada línea es un párrafo de «Detrás de R de
     Retazos»; la página no agrega nada que no esté aquí. */
  artesana: {
    nombre: "Gabriela Gonzales",
    historia: [
      "Soy Gabriela Gonzales. Soy mamá de dos niños y trabajo desde mi casa, en Santo Domingo.",
      "R de Retazos nació de la creatividad y del gusto por crear con telas. Cada pieza la corto, la armo y la coso yo, y cuando se puede, aprovecho telas que ya existían para darles una segunda vida.",
      "Me gusta conversar cada pedido con calma, para entender bien lo que buscas."
    ]
  },

  /* Fotos de marca. Mientras estén en null o vacías, la página deja el hueco
     con su tamaño y proporción finales. En cuanto pongas la ruta, aparece la
     foto: no hay que tocar el maquetado. FOTOGRAFIAS.md dice qué va en cada una. */
  marca: {
    /* Confirmado: el sello original que mandó la marca, recortado del archivo
       que llegó. No está redibujado ni reescrito: es la misma imagen, con el
       fondo blanco quitado para que apoye sobre el marfil de la página. */
    logo: "fotos/marca/logo.webp",
    logoGrande: "fotos/marca/logo-1024.webp",
    portada: null,    /* disco central de la portada, si no hay video     */
    retrato: null,    /* 3:4, Gabriela. Va en «Detrás de R de Retazos»    */
    taller: null,     /* las manos en la máquina   ─┐                     */
    telas: null,      /* retazos y telas            ├ abren la galería    */
    empaque: null,    /* la caja con la cinta      ─┘ «Del taller»        */

    /* Más fotos reales para la galería «Del taller», en el orden en que se
       quieren ver. tipo: "gabriela" | "proceso" | "materiales" | "lifestyle"
       | "empaque". La galería se completa con fotos del catálogo hasta tener
       seis, así que nunca queda un hueco vacío.
       Ej: { src:"fotos/marca/taller-2.webp", alt:"Gabriela cortando tela", tipo:"proceso" } */
    galeria: [
      /* foto_real_02: los recuerdos recién cosidos, con el hilo y las tijeras. */
      { src:"fotos/marca/taller-corazones.webp", tipo:"proceso",
        alt:"Corazones de tela rosados y a cuadrillé recién cosidos sobre una mesa de madera, junto al hilo y las tijeras" }
    ],
    /* Piezas del catálogo que completan la galería mientras no haya fotos del
       taller. Son fotos reales; se pueden cambiar por cualquier id. */
    galeriaCatalogo: ["doble-limones-rayas", "l-cuadrille-verde", "sesgo-leopardo-naranja",
                      "simple-conchas-celeste", "simple-citricos-coral"],

    /* Video de la portada. Hueco preparado: en cuanto exista el archivo real
       de la marca, se escribe aquí y aparece detrás del sello, en silencio y
       en bucle. Mientras sea null la portada se arma sólo con las fotos del
       catálogo: no se pone un video de archivo ni una modelo inventada.
       Formato esperado: MP4 (H.264) vertical o cuadrado, sin audio, ≤ 8 s.
       `cartel` es el primer fotograma en imagen, para que no haya un hueco
       negro mientras carga. */
    videoHero: null,

    /* Un encargo real, para «Regalos y recuerdos»: la mitad de abajo de la
       pieza «mamita muy especial» que hizo la marca, con el canasto y su frase.
       La mitad de arriba no se publica: muestra la tarjeta con el nombre de la
       bebé, y no hay permiso confirmado para eso.
       `alt` repite el texto de la imagen para quien no la ve. null = no se muestra. */
    encargo: {
      src: "fotos/marca/encargo-canasto.webp",
      alt: "Recuerdos de baby shower: corazones de tela a cuadrillé rosado en un canasto con cinta. " +
           "Texto de la imagen: «Cada puntada, llena de amor y dedicación».",
      pie: "Recuerdos de baby shower, hechos a mano para una mamita muy especial."
    },  /* { src:"fotos/marca/portada.mp4", cartel:"fotos/marca/portada.webp", alt:"" } */
  },

  /* Cobro en línea con Webpay.

     Mientras `activo` sea false la web se comporta exactamente como hoy: se
     pide por mensaje y no aparece ningún carrito. Se enciende sólo cuando haya
     precios de verdad, contrato con Transbank, y los textos legales que el
     propio Transbank exige ver publicados antes de aprobar la cuenta.

     Los costos de entrega se cobran tal cual están escritos aquí: es el
     servidor quien los suma, no el navegador. */
  tienda: {
    activo: false,
    entrega: {
      /* Confirmado: retiro gratuito en Santo Domingo. */
      retiro: { activo: true, lugar: "Santo Domingo" },
      /* Confirmado: despachos entre Santo Domingo y San Antonio, y despacho
         gratuito en Santo Domingo desde 3 pedidos.

         costo  — entero en pesos. null = no está definido: esa zona no se
                  puede pagar en línea (salvo que aplique el despacho gratis).
         gratisDesde — cuántos productos de una misma compra hacen que el
                  despacho a esa zona sea gratis. POR CONFIRMAR que «3 pedidos»
                  signifique 3 productos en una misma compra.
         plazo  — texto corto, ej. "2 a 3 días hábiles". null = sin confirmar. */
      despacho: [
        { id:"santo-domingo", zona:"Santo Domingo", costo:null, gratisDesde:3, plazo:null },
        { id:"san-antonio",   zona:"San Antonio",   costo:null, gratisDesde:null, plazo:null }
      ]
    }
  },

  /* Confirmado: cómo paga hoy la gente. El pago en línea con Webpay se suma
     solo cuando `tienda.activo` sea true; no se anuncia antes. */
  pagos: {
    medios: [
      "Transferencia bancaria",
      "Efectivo",
      "Tarjeta, con máquina de pago al momento de la entrega o el retiro"
    ]
  },

  /* Lo que falta por confirmar. Vacía la lista cuando esté resuelto. */
  porConfirmar: [
    "Que Gabriela lea y apruebe los textos de la web",
    "Datos legales y condiciones de términos, privacidad y cambios (ver LEGAL.md)",
    "Si «despacho gratuito desde 3 pedidos» significa 3 productos en una misma compra",
    "Que el estuche a rayas con asa de muñeca se muestre como cosmetiquero",
  ],

  categorias: [
    { id:"accesorios", nombre:"Accesorios" },
    { id:"bolsos",     nombre:"Bolsos" },
    { id:"hogar",      nombre:"Hogar" },
    { id:"regalos",    nombre:"Regalos" }
  ],

  /* Las cuatro familias de scrunchies, con el nombre y el precio de la
     «Lista de precios · Scrunchies» oficial de la marca (precio_scrunchies.jpg).

     «XL con sesgo» es la familia que el catálogo PDF llamaba «L con sesgo»:
     la pieza de ejemplo de la lista de precios es la misma «Lila liso · sesgo
     rosa» (l-lila) del catálogo. Es otra familia que «Doble con sesgo»: no
     se mezclan. El id "ele" se mantiene sólo por dentro.

     precio  — entero en pesos, el mismo para todas las piezas de la familia.
                Una pieza puede tener su propio `precio`, que manda sobre este.
     medida  — texto corto con el tamaño. null = sin confirmar.
     descripcion — qué distingue a esta familia. null = sin confirmar.
     Precios: confirmados. Medidas y descripciones: pendientes, no se inventan. */
  familiasScrunchie: [
    { id:"simples", nombre:"Simple",           precio:2900, medida:null, descripcion:null },
    { id:"sesgo",   nombre:"Simple con sesgo", precio:3900, medida:null, descripcion:null },
    { id:"ele",     nombre:"XL con sesgo",     precio:4900, medida:null, descripcion:null },
    { id:"dobles",  nombre:"Doble con sesgo",  precio:5900, medida:null, descripcion:null }
  ],

  /* Las 29 piezas del catálogo real, en el orden del PDF.

     Las fotos son las del propio catálogo, recortadas una a una: no hay ni una
     imagen de archivo. El catálogo no trae texto —ni nombres, ni códigos, ni
     precios—, así que el nombre de cada pieza describe lo que se ve en su foto
     y está marcado como pendiente de confirmar. `tono` se muestrea de la misma
     foto y sólo tiñe el reflejo del carrusel: no describe el producto.

     Tienen la misma forma que `productos`, así que la ficha, el precio y el
     carrito funcionan igual para unos y para otras.

     stock — opcional en cualquier pieza o producto. Número de unidades
     disponibles; 0 = agotado. Si no está, no hay dato y no se muestra nada. */
  scrunchies: [
    { id:"simple-estrellas-fucsia", nombre:"Estrellas de mar fucsia",
      fam:"simples", cat:"accesorios", precio:null, tono:"#EF9FD0",
      fotos:["fotos/scrunchies/simple-estrellas-fucsia.webp"], mini:"fotos/scrunchies/simple-estrellas-fucsia-280.webp",
      desc:"Scrunchie simple, del catálogo. Cosido a mano, uno a uno." },
    { id:"simple-conchas-celeste", nombre:"Conchas celeste",
      fam:"simples", cat:"accesorios", precio:null, tono:"#9BD9F3",
      fotos:["fotos/scrunchies/simple-conchas-celeste.webp"], mini:"fotos/scrunchies/simple-conchas-celeste-280.webp",
      desc:"Scrunchie simple, del catálogo. Cosido a mano, uno a uno." },
    { id:"simple-conchas-durazno", nombre:"Conchas durazno",
      fam:"simples", cat:"accesorios", precio:null, tono:"#F5BF99",
      fotos:["fotos/scrunchies/simple-conchas-durazno.webp"], mini:"fotos/scrunchies/simple-conchas-durazno-280.webp",
      desc:"Scrunchie simple, del catálogo. Cosido a mano, uno a uno." },
    { id:"simple-tortugas-fucsia", nombre:"Tortugas fucsia",
      fam:"simples", cat:"accesorios", precio:null, tono:"#F797D8",
      fotos:["fotos/scrunchies/simple-tortugas-fucsia.webp"], mini:"fotos/scrunchies/simple-tortugas-fucsia-280.webp",
      desc:"Scrunchie simple, del catálogo. Cosido a mano, uno a uno." },
    { id:"simple-rosa-texturado", nombre:"Rosa viejo texturado",
      fam:"simples", cat:"accesorios", precio:null, tono:"#EDA2A1",
      fotos:["fotos/scrunchies/simple-rosa-texturado.webp"], mini:"fotos/scrunchies/simple-rosa-texturado-280.webp",
      desc:"Scrunchie simple, del catálogo. Cosido a mano, uno a uno." },
    { id:"simple-puntos-noche", nombre:"Puntos multicolor sobre azul noche",
      fam:"simples", cat:"accesorios", precio:null, tono:"#7D4556",
      fotos:["fotos/scrunchies/simple-puntos-noche.webp"], mini:"fotos/scrunchies/simple-puntos-noche-280.webp",
      desc:"Scrunchie simple, del catálogo. Cosido a mano, uno a uno." },
    { id:"simple-citricos-coral", nombre:"Cítricos sobre coral",
      fam:"simples", cat:"accesorios", precio:null, tono:"#F2C958",
      fotos:["fotos/scrunchies/simple-citricos-coral.webp"], mini:"fotos/scrunchies/simple-citricos-coral-280.webp",
      desc:"Scrunchie simple, del catálogo. Cosido a mano, uno a uno." },
    { id:"simple-lila", nombre:"Lila liso",
      fam:"simples", cat:"accesorios", precio:null, tono:"#D0A0ED",
      fotos:["fotos/scrunchies/simple-lila.webp"], mini:"fotos/scrunchies/simple-lila-280.webp",
      desc:"Scrunchie simple, del catálogo. Cosido a mano, uno a uno." },
    { id:"simple-flores-noche", nombre:"Flores en negro y lila",
      fam:"simples", cat:"accesorios", precio:null, tono:"#614C76",
      fotos:["fotos/scrunchies/simple-flores-noche.webp"], mini:"fotos/scrunchies/simple-flores-noche-280.webp",
      desc:"Scrunchie simple, del catálogo. Cosido a mano, uno a uno." },
    { id:"simple-mostaza-texturado", nombre:"Mostaza texturado",
      fam:"simples", cat:"accesorios", precio:null, tono:"#AD5B14",
      fotos:["fotos/scrunchies/simple-mostaza-texturado.webp"], mini:"fotos/scrunchies/simple-mostaza-texturado-280.webp",
      desc:"Scrunchie simple, del catálogo. Cosido a mano, uno a uno." },
    { id:"sesgo-tortugas-fucsia", nombre:"Tortugas fucsia · sesgo burdeo",
      fam:"sesgo", cat:"accesorios", precio:null, tono:"#B33F6B",
      fotos:["fotos/scrunchies/sesgo-tortugas-fucsia.webp"], mini:"fotos/scrunchies/sesgo-tortugas-fucsia-280.webp",
      desc:"Scrunchie simple con el sesgo en contraste, del catálogo." },
    { id:"sesgo-estrellas-rosa", nombre:"Estrellas de mar rosa · sesgo burdeo",
      fam:"sesgo", cat:"accesorios", precio:null, tono:"#EEA0CB",
      fotos:["fotos/scrunchies/sesgo-estrellas-rosa.webp"], mini:"fotos/scrunchies/sesgo-estrellas-rosa-280.webp",
      desc:"Scrunchie simple con el sesgo en contraste, del catálogo." },
    { id:"sesgo-citricos-coral", nombre:"Cítricos sobre coral · sesgo fucsia",
      fam:"sesgo", cat:"accesorios", precio:null, tono:"#E39B38",
      fotos:["fotos/scrunchies/sesgo-citricos-coral.webp"], mini:"fotos/scrunchies/sesgo-citricos-coral-280.webp",
      desc:"Scrunchie simple con el sesgo en contraste, del catálogo." },
    { id:"sesgo-leopardo-durazno", nombre:"Leopardo durazno · sesgo negro",
      fam:"sesgo", cat:"accesorios", precio:null, tono:"#804D42",
      fotos:["fotos/scrunchies/sesgo-leopardo-durazno.webp"], mini:"fotos/scrunchies/sesgo-leopardo-durazno-280.webp",
      desc:"Scrunchie simple con el sesgo en contraste, del catálogo." },
    { id:"sesgo-leopardo-mostaza", nombre:"Leopardo blanco y negro · sesgo mostaza",
      fam:"sesgo", cat:"accesorios", precio:null, tono:"#EFAE35",
      fotos:["fotos/scrunchies/sesgo-leopardo-mostaza.webp"], mini:"fotos/scrunchies/sesgo-leopardo-mostaza-280.webp",
      desc:"Scrunchie simple con el sesgo en contraste, del catálogo." },
    { id:"sesgo-tortugas-rosa", nombre:"Tortugas rosa · sesgo burdeo",
      fam:"sesgo", cat:"accesorios", precio:null, tono:"#CA577F",
      fotos:["fotos/scrunchies/sesgo-tortugas-rosa.webp"], mini:"fotos/scrunchies/sesgo-tortugas-rosa-280.webp",
      desc:"Scrunchie simple con el sesgo en contraste, del catálogo." },
    { id:"sesgo-estrellas-rosa-2", nombre:"Estrellas de mar rosa · sesgo burdeo (II)",
      fam:"sesgo", cat:"accesorios", precio:null, tono:"#AD1435",
      fotos:["fotos/scrunchies/sesgo-estrellas-rosa-2.webp"], mini:"fotos/scrunchies/sesgo-estrellas-rosa-2-280.webp",
      desc:"Scrunchie simple con el sesgo en contraste, del catálogo." },
    { id:"sesgo-manchas-crema", nombre:"Manchas rosa y mantequilla · sesgo burdeo",
      fam:"sesgo", cat:"accesorios", precio:null, tono:"#AC1625",
      fotos:["fotos/scrunchies/sesgo-manchas-crema.webp"], mini:"fotos/scrunchies/sesgo-manchas-crema-280.webp",
      desc:"Scrunchie simple con el sesgo en contraste, del catálogo." },
    { id:"sesgo-leopardo-rosa", nombre:"Leopardo fucsia sobre rosa · sesgo rosa",
      fam:"sesgo", cat:"accesorios", precio:null, tono:"#F29CCD",
      fotos:["fotos/scrunchies/sesgo-leopardo-rosa.webp"], mini:"fotos/scrunchies/sesgo-leopardo-rosa-280.webp",
      desc:"Scrunchie simple con el sesgo en contraste, del catálogo." },
    { id:"sesgo-leopardo-naranja", nombre:"Leopardo rosa y café · sesgo naranja",
      fam:"sesgo", cat:"accesorios", precio:null, tono:"#A41E1E",
      fotos:["fotos/scrunchies/sesgo-leopardo-naranja.webp"], mini:"fotos/scrunchies/sesgo-leopardo-naranja-280.webp",
      desc:"Scrunchie simple con el sesgo en contraste, del catálogo." },
    { id:"doble-limones-rayas", nombre:"Limones sobre rayas azules · sesgo amarillo",
      fam:"dobles", cat:"accesorios", precio:null, tono:"#F0D946",
      fotos:["fotos/scrunchies/doble-limones-rayas.webp"], mini:"fotos/scrunchies/doble-limones-rayas-280.webp",
      desc:"Scrunchie doble con el sesgo en contraste, del catálogo." },
    { id:"doble-puntos-lima", nombre:"Puntos multicolor · sesgo verde lima",
      fam:"dobles", cat:"accesorios", precio:null, tono:"#D9F259",
      fotos:["fotos/scrunchies/doble-puntos-lima.webp"], mini:"fotos/scrunchies/doble-puntos-lima-280.webp",
      desc:"Scrunchie doble con el sesgo en contraste, del catálogo." },
    { id:"doble-conchas-rosa", nombre:"Conchas rosa · sesgo fucsia",
      fam:"dobles", cat:"accesorios", precio:null, tono:"#F598D5",
      fotos:["fotos/scrunchies/doble-conchas-rosa.webp"], mini:"fotos/scrunchies/doble-conchas-rosa-280.webp",
      desc:"Scrunchie doble con el sesgo en contraste, del catálogo." },
    { id:"doble-estrellas-naranja", nombre:"Estrellas de mar naranja · sesgo durazno",
      fam:"dobles", cat:"accesorios", precio:null, tono:"#F4CB9A",
      fotos:["fotos/scrunchies/doble-estrellas-naranja.webp"], mini:"fotos/scrunchies/doble-estrellas-naranja-280.webp",
      desc:"Scrunchie doble con el sesgo en contraste, del catálogo." },
    { id:"l-cuadrille-verde", nombre:"Cuadrillé verde · sesgo negro",
      fam:"ele", cat:"accesorios", precio:null, tono:"#76654C",
      fotos:["fotos/scrunchies/l-cuadrille-verde.webp"], mini:"fotos/scrunchies/l-cuadrille-verde-280.webp",
      desc:"Scrunchie XL, con el sesgo en contraste, del catálogo." },
    { id:"l-leopardo-beige", nombre:"Leopardo beige · sesgo negro",
      fam:"ele", cat:"accesorios", precio:null, tono:"#764C5A",
      fotos:["fotos/scrunchies/l-leopardo-beige.webp"], mini:"fotos/scrunchies/l-leopardo-beige-280.webp",
      desc:"Scrunchie XL, con el sesgo en contraste, del catálogo." },
    { id:"l-leopardo-mostaza", nombre:"Leopardo mostaza · sesgo mostaza",
      fam:"ele", cat:"accesorios", precio:null, tono:"#F0C644",
      fotos:["fotos/scrunchies/l-leopardo-mostaza.webp"], mini:"fotos/scrunchies/l-leopardo-mostaza-280.webp",
      desc:"Scrunchie XL, con el sesgo en contraste, del catálogo." },
    { id:"l-lila", nombre:"Lila liso · sesgo rosa",
      fam:"ele", cat:"accesorios", precio:null, tono:"#C5ADE1",
      fotos:["fotos/scrunchies/l-lila.webp"], mini:"fotos/scrunchies/l-lila-280.webp",
      desc:"Scrunchie XL, con el sesgo en contraste, del catálogo." },
    { id:"l-leopardo-mostaza-2", nombre:"Leopardo mostaza · sesgo mostaza (II)",
      fam:"ele", cat:"accesorios", precio:null, tono:"#F0B540",
      fotos:["fotos/scrunchies/l-leopardo-mostaza-2.webp"], mini:"fotos/scrunchies/l-leopardo-mostaza-2-280.webp",
      desc:"Scrunchie XL, con el sesgo en contraste, del catálogo." }
  ],

  /* El orden es el orden en la página: primero lo que más se pide. */
  productos: [
    /* fotos — fotos reales de la marca (ZIP «fotos completas»), sólo de
       referencia: mostrar una pieza no la pone a la venta ni le da precio.
       alt   — lo que se ve en la primera foto, descrito sin agregar nada. */
    { id:"monos", nombre:"Moños y lazos", cat:"accesorios", precio:null, estado:null,
      fotos:["fotos/productos/monos-tres-telas.webp"],
      alt:"Tres moños de tela: uno lila liso, uno con manchas negras y mostaza, y uno floral en rosa y lila",
      desc:"El moño XL, en tela suave y ligera. Liso, estampado o de cuero sintético." },
    /* desdeFamilias: la tarjeta dice «Desde $…» con el menor precio de lista. */
    { id:"scrunchies", nombre:"Scrunchies", cat:"accesorios", precio:null, estado:null, desdeFamilias:true,
      /* Las fotos salen del catálogo real, más abajo en este mismo archivo. */
      fotos:["fotos/scrunchies/sesgo-estrellas-rosa.webp",
             "fotos/scrunchies/doble-limones-rayas.webp",
             "fotos/scrunchies/l-cuadrille-verde.webp",
             "fotos/scrunchies/simple-citricos-coral.webp"],
      desc:"Simple, simple con sesgo, XL con sesgo y doble con sesgo. El catálogo completo, pieza por pieza, está más abajo." },
    { id:"tote", nombre:"Tote bags", cat:"bolsos", precio:null, estado:null,
      fotos:["fotos/productos/tote-rayas-rosa-rojo.webp"],
      alt:"Tote bag a rayas rosadas y rojas, con asas fucsia, colgada de un perchero",
      desc:"En denim reciclado y otras telas. Amplias, cómodas y cada una distinta." },
    { id:"porta", nombre:"Bolsos para computador", cat:"bolsos", precio:null, estado:null,
      fotos:["fotos/productos/bolso-computador-rayas.webp"],
      alt:"Bolso para computador a rayas celeste y rosado, con asas café y el cargador amarrado con una tira de la misma tela",
      desc:"Hechos por pedido. Pueden llevar su porta cables a juego, en la misma tela." },
    /* La foto es un estuche con cierre y asa de muñeca: POR CONFIRMAR que
       Gabriela lo cuente como cosmetiquero. */
    { id:"cosmetiqueros", nombre:"Cosmetiqueros", cat:"accesorios", precio:null, estado:null,
      fotos:["fotos/productos/estuche-rayas-rosa-rojo.webp"],
      alt:"Estuche con cierre a rayas rosadas y rojas, con asa fucsia para la muñeca",
      desc:"Para llevar lo justo ordenado, en distintas combinaciones de telas." },
    { id:"cojines", nombre:"Cojines", cat:"hogar", precio:null, fotos:[], estado:null,
      desc:"39 × 49 cm, relleno sintético, con terminación de pestaña o simple." },
    { id:"delantales", nombre:"Delantales personalizados", cat:"hogar", precio:null, fotos:[], estado:null,
      desc:"Con bolsillo. Para la casa o para tu negocio, con el nombre que quieras." },
    { id:"llaveros", nombre:"Llaveros", cat:"accesorios", precio:null, fotos:[], estado:null,
      desc:"Un detalle chico de tela, para regalar o para sumar a un pedido." },
    { id:"cajas", nombre:"Cajas de regalo", cat:"regalos", precio:null, fotos:[], estado:null,
      desc:"El set armado: lo que elijas dentro, su caja, la cinta y la tarjeta." },
    /* Recorte del canasto de la foto del encargo «mamita muy especial»: sin
       los textos de la imagen ni la tarjeta con el nombre. */
    { id:"recuerdos", nombre:"Recuerdos para celebraciones", cat:"regalos", precio:null, estado:null,
      fotos:["fotos/productos/recuerdos-canasto.webp"],
      alt:"Recuerdos de baby shower: corazones de tela rosados y a cuadrillé en un canasto con cinta",
      desc:"Para baby showers, la llegada de la primavera y otras celebraciones." }
  ],

  /* r:"" = todavía no la tengo. La página muestra la pregunta y dice qué falta,
     en vez de inventarse un plazo, una forma de pago o una política.

     desde:"entrega" | "pagos" | "enLinea" = la respuesta la arma la página con
     los datos de `tienda` y `pagos`, para no escribir lo mismo dos veces. */
  faq: [
    { p:"¿Cómo hago un pedido?",
      r:"Me escribes por WhatsApp contándome qué te interesa. Ahí confirmamos disponibilidad, precio y entrega antes de que pagues." },
    { p:"¿Las telas son recicladas?",
      r:"Buena parte sí. Las tote bags se hacen en denim reciclado y en otras telas, y gran parte del trabajo es darle una nueva vida a telas que ya existían. Por eso casi nunca hay dos piezas iguales." },
    { p:"¿Puedo elegir la tela, el color o el estampado?",
      r:"Depende de las telas que tenga disponibles en ese momento. Cuéntame lo que buscas y te muestro las opciones que hay." },
    { p:"¿Cuánto demora un pedido?", r:"", falta:"los plazos de elaboración" },
    { p:"¿Cómo recibo mi pedido?", desde:"entrega" },
    { p:"¿Qué formas de pago aceptas?", desde:"pagos" },
    { p:"¿Haces pedidos para negocios?",
      r:"Sí. Delantales y artículos textiles personalizados con el nombre de tu marca. Escríbeme con lo que necesitas y la cantidad, y te cotizo." },
    { p:"¿Se puede pagar en línea?", desde:"enLinea" }
  ]
};

/* Todo lo que una persona puede pedir, en una sola lista: las líneas de trabajo
   y las piezas del catálogo de scrunchies. La leen la página (para el carrito y
   la ficha) y el servidor (para calcular el monto). Un solo sitio, un solo
   precio: el navegador nunca decide cuánto se cobra. */
export const CATALOGO = DATOS.productos.concat(DATOS.scrunchies);

/* El precio de verdad de cualquier cosa del catálogo: el suyo propio, o si no
   tiene, el de su familia de scrunchies. Es una función y no una copia para
   que cambiar un precio en DATOS se note al instante en página y servidor. */
export function precioDe(p) {
  if (!p) return null;
  if (p.precio != null) return p.precio;
  const f = p.fam && (DATOS.familiasScrunchie || []).find((x) => x.id === p.fam);
  return f && f.precio != null ? f.precio : null;
}

/* Unidades disponibles. null = no hay dato (no se muestra ni se limita). */
export const stockDe = (p) =>
  p && typeof p.stock === "number" && Number.isInteger(p.stock) && p.stock >= 0 ? p.stock : null;
