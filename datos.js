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

  contacto: {
    /* Con código de país, sin + ni espacios. Ej: "56912345678" */
    whatsapp: "",
    /* Confirmado: la cuenta real de la marca. */
    instagram: "rderetazos",
    ciudad: "Santo Domingo, Chile"
  },

  artesana: { nombre: "" },

  /* Fotos de marca. Mientras estén en null o vacías, la página deja el hueco
     con su tamaño y proporción finales. En cuanto pongas la ruta, aparece la
     foto: no hay que tocar el maquetado. FOTOGRAFIAS.md dice qué va en cada una. */
  marca: {
    /* Confirmado: el sello original que mandó la marca, recortado del archivo
       que llegó. No está redibujado ni reescrito: es la misma imagen, con el
       fondo blanco quitado para que apoye sobre el marfil de la página. */
    logo: "fotos/marca/logo.webp",
    logoGrande: "fotos/marca/logo-1024.webp",
    portada: null,    /* 4:5 vertical, la primera imagen del sitio        */
    taller: null,     /* 4:3, las manos en la máquina                     */
    telas: null,      /* 1:1, retazos y telas                             */
    empaque: null,    /* 1:1, la caja con la cinta                        */
    retrato: null,    /* 3:4, ella en el taller                           */
    instagram: [],    /* hasta 6 rutas, cuadradas                         */

    /* Video de la portada. Hueco preparado: en cuanto exista el archivo real
       de la marca, se escribe aquí y aparece detrás del sello, en silencio y
       en bucle. Mientras sea null la portada se arma sólo con las fotos del
       catálogo: no se pone un video de archivo ni una modelo inventada.
       Formato esperado: MP4 (H.264) vertical o cuadrado, sin audio, ≤ 8 s.
       `cartel` es el primer fotograma en imagen, para que no haya un hueco
       negro mientras carga. */
    videoHero: null,  /* { src:"fotos/marca/portada.mp4", cartel:"fotos/marca/portada.webp", alt:"" } */
  },

  /* Cobro en línea con Webpay.

     Mientras `activo` sea false la web se comporta exactamente como hoy: se
     pide por mensaje y no aparece ningún carrito. Se enciende sólo cuando haya
     precios de verdad, contrato con Transbank, y los textos legales que el
     propio Transbank exige ver publicados antes de aprobar la cuenta.

     El costo del despacho se cobra tal cual está escrito aquí: es el servidor
     quien lo suma, no el navegador. */
  tienda: {
    activo: false,
    despacho: {
      retiro: true,      /* retiro coordinado en Santo Domingo, sin costo */
      costo: null,       /* entero en pesos; null = todavía no se ofrece despacho */
      zona: "a todo Chile"
    }
  },

  /* Lo que falta por confirmar. Vacía la lista cuando esté resuelto. */
  porConfirmar: [
    "Si la cajita de 3 scrunchies sigue a $5.000",
    "Si las prendas intervenidas (camisas) se venden",
    "Los nombres y códigos oficiales de los 29 scrunchies: el catálogo sólo trae fotos, " +
      "así que hoy cada uno se llama por su color y su estampado",
    "Qué distingue a un scrunchie simple, uno doble y uno L (medidas o largo de tela)",
    "Las fotos originales de los scrunchies en alta: las del catálogo salen a 374–580 px " +
      "de lado, suficiente para la rejilla pero justo para pantallas retina"
  ],

  categorias: [
    { id:"accesorios", nombre:"Accesorios" },
    { id:"bolsos",     nombre:"Bolsos" },
    { id:"hogar",      nombre:"Hogar" },
    { id:"regalos",    nombre:"Regalos" }
  ],

  /* Las cuatro familias del catálogo de scrunchies, con el nombre tal cual
     aparece impreso en el PDF que mandó la marca. */
  familiasScrunchie: [
    { id:"simples", nombre:"Simples" },
    { id:"sesgo",   nombre:"Simples con sesgo" },
    { id:"dobles",  nombre:"Dobles con sesgo" },
    { id:"ele",     nombre:"L con sesgo" }
  ],

  /* Las 29 piezas del catálogo real, en el orden del PDF.

     Las fotos son las del propio catálogo, recortadas una a una: no hay ni una
     imagen de archivo. El catálogo no trae texto —ni nombres, ni códigos, ni
     precios—, así que el nombre de cada pieza describe lo que se ve en su foto
     y está marcado como pendiente de confirmar. `tono` se muestrea de la misma
     foto y sólo tiñe el reflejo del carrusel: no describe el producto.

     Tienen la misma forma que `productos`, así que la ficha, el precio y el
     carrito funcionan igual para unos y para otras. */
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
      desc:"Scrunchie L, con el sesgo en contraste, del catálogo." },
    { id:"l-leopardo-beige", nombre:"Leopardo beige · sesgo negro",
      fam:"ele", cat:"accesorios", precio:null, tono:"#764C5A",
      fotos:["fotos/scrunchies/l-leopardo-beige.webp"], mini:"fotos/scrunchies/l-leopardo-beige-280.webp",
      desc:"Scrunchie L, con el sesgo en contraste, del catálogo." },
    { id:"l-leopardo-mostaza", nombre:"Leopardo mostaza · sesgo mostaza",
      fam:"ele", cat:"accesorios", precio:null, tono:"#F0C644",
      fotos:["fotos/scrunchies/l-leopardo-mostaza.webp"], mini:"fotos/scrunchies/l-leopardo-mostaza-280.webp",
      desc:"Scrunchie L, con el sesgo en contraste, del catálogo." },
    { id:"l-lila", nombre:"Lila liso · sesgo rosa",
      fam:"ele", cat:"accesorios", precio:null, tono:"#C5ADE1",
      fotos:["fotos/scrunchies/l-lila.webp"], mini:"fotos/scrunchies/l-lila-280.webp",
      desc:"Scrunchie L, con el sesgo en contraste, del catálogo." },
    { id:"l-leopardo-mostaza-2", nombre:"Leopardo mostaza · sesgo mostaza (II)",
      fam:"ele", cat:"accesorios", precio:null, tono:"#F0B540",
      fotos:["fotos/scrunchies/l-leopardo-mostaza-2.webp"], mini:"fotos/scrunchies/l-leopardo-mostaza-2-280.webp",
      desc:"Scrunchie L, con el sesgo en contraste, del catálogo." }
  ],

  /* El orden es el orden en la página: primero lo que más se pide. */
  productos: [
    { id:"monos", nombre:"Moños y lazos", cat:"accesorios", precio:null, fotos:[], estado:null,
      desc:"El moño XL, en tela suave y ligera. Liso, estampado o de cuero sintético." },
    { id:"scrunchies", nombre:"Scrunchies", cat:"accesorios", precio:null, estado:null,
      /* Las fotos salen del catálogo real, más abajo en este mismo archivo. */
      fotos:["fotos/scrunchies/sesgo-estrellas-rosa.webp",
             "fotos/scrunchies/doble-limones-rayas.webp",
             "fotos/scrunchies/l-cuadrille-verde.webp",
             "fotos/scrunchies/simple-citricos-coral.webp"],
      desc:"Simples, con sesgo, dobles y talla L. 29 en el catálogo de hoy, y se hacen en casi cualquier tela." },
    { id:"tote", nombre:"Tote bags", cat:"bolsos", precio:null, fotos:[], estado:null,
      desc:"En denim reciclado y otras telas. Amplias, cómodas y cada una distinta." },
    { id:"porta", nombre:"Bolsos para computador", cat:"bolsos", precio:null, fotos:[], estado:null,
      desc:"Hechos por pedido. Pueden llevar su porta cables a juego, en la misma tela." },
    { id:"cosmetiqueros", nombre:"Cosmetiqueros", cat:"accesorios", precio:null, fotos:[], estado:null,
      desc:"Para llevar lo justo ordenado, en la combinación de telas que elijas." },
    { id:"cojines", nombre:"Cojines", cat:"hogar", precio:null, fotos:[], estado:null,
      desc:"39 × 49 cm, relleno sintético, con terminación de pestaña o simple." },
    { id:"delantales", nombre:"Delantales personalizados", cat:"hogar", precio:null, fotos:[], estado:null,
      desc:"Con bolsillo. Para la casa o para tu negocio, con el nombre que quieras." },
    { id:"llaveros", nombre:"Llaveros", cat:"accesorios", precio:null, fotos:[], estado:null,
      desc:"Un detalle chico de tela, para regalar o para sumar a un pedido." },
    { id:"cajas", nombre:"Cajas de regalo", cat:"regalos", precio:null, fotos:[], estado:null,
      desc:"El set armado: lo que elijas dentro, su caja, la cinta y la tarjeta." },
    { id:"recuerdos", nombre:"Recuerdos para celebraciones", cat:"regalos", precio:null, fotos:[], estado:null,
      desc:"Baby showers, primavera, fin de curso. En la cantidad que necesites." }
  ],

  /* r:"" = todavía no la tengo. La página muestra la pregunta y dice qué falta,
     en vez de inventarse un plazo, una forma de pago o una política. */
  faq: [
    { p:"¿Cómo hago un pedido?",
      r:"Me escribes contándome qué te interesa. Ahí confirmamos disponibilidad, precio y entrega antes de que pagues nada." },
    { p:"¿Las telas son recicladas?",
      r:"Buena parte sí. Las tote bags se hacen en denim reciclado, y gran parte del trabajo es darle una nueva vida a telas que ya existían. Por eso casi nunca hay dos piezas iguales." },
    { p:"¿Puedo elegir la tela, el color o el estampado?",
      r:"Sí. Trabajo con telas y estampados distintos, y la combinación la vemos juntas antes de empezar." },
    { p:"¿Cuánto demora un pedido personalizado?", r:"", falta:"los plazos de elaboración" },
    { p:"¿Cómo recibo mi pedido?", r:"", falta:"las modalidades de entrega: retiro, despacho y zonas" },
    { p:"¿Qué formas de pago aceptas?", r:"", falta:"las formas de pago" },
    { p:"¿Haces pedidos para negocios?",
      r:"Sí. Delantales y artículos textiles personalizados con el nombre de tu marca. Escríbeme con lo que necesitas y la cantidad, y te cotizo." },
    { p:"¿Tienes tienda online con pago?",
      r:"Por ahora no: los pedidos se conversan antes de hacerse. Es algo que puede venir más adelante." }
  ]
};

/* Todo lo que una persona puede pedir, en una sola lista: las líneas de trabajo
   y las piezas del catálogo de scrunchies. La leen la página (para el carrito y
   la ficha) y el servidor (para calcular el monto). Un solo sitio, un solo
   precio: el navegador nunca decide cuánto se cobra. */
export const CATALOGO = DATOS.productos.concat(DATOS.scrunchies);
