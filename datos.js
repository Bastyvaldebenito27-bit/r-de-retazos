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
    logo: null,       /* SVG o PNG; sustituye al monograma de la cabecera */
    portada: null,    /* 4:5 vertical, la primera imagen del sitio        */
    taller: null,     /* 4:3, las manos en la máquina                     */
    telas: null,      /* 1:1, retazos y telas                             */
    empaque: null,    /* 1:1, la caja con la cinta                        */
    retrato: null,    /* 3:4, ella en el taller                           */
    instagram: []     /* hasta 6 rutas, cuadradas                         */
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
    "Si las prendas intervenidas (camisas) se venden"
  ],

  categorias: [
    { id:"accesorios", nombre:"Accesorios" },
    { id:"bolsos",     nombre:"Bolsos" },
    { id:"hogar",      nombre:"Hogar" },
    { id:"regalos",    nombre:"Regalos" }
  ],

  /* El orden es el orden en la página: primero lo que más se pide. */
  productos: [
    { id:"monos", nombre:"Moños y lazos", cat:"accesorios", precio:null, fotos:[], estado:null,
      desc:"El moño XL, en tela suave y ligera. Liso, estampado o de cuero sintético." },
    { id:"scrunchies", nombre:"Scrunchies", cat:"accesorios", precio:null, fotos:[], estado:null,
      desc:"En terciopelo, estampados florales o lisos. Se hacen en casi cualquier tela." },
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
