export type Language = "pt" | "en" | "es";

export type Translations = {
  nav: { projects: string; budget: string; process: string; contact: string };
  hero: { availability: string; greeting: string; role: string; lead: string; ctaProjects: string; ctaBudget: string };
  projects: {
    eyebrow: string;
    title: string;
    lead: string;
    viewDetails: string;
    modal: {
      workDone: string;
      technologies: string;
      desktop: string;
      tablet: string;
      mobile: string;
      close: string;
      closeDetails: string;
      videosLabel: string;
      galleryLabel: string;
      emptyGallery: string;
    };
  };
  budget: {
    channel: {
      eyebrow: string;
      title: string;
      lead: string;
      workana: { label: string; desc: string; currency: string };
      upwork: { label: string; desc: string; currency: string };
      direct: { label: string; desc: string; currency: string; detecting: string };
    };
    title: string;
    lead: string;
    change: string;
    allCategory: string;
    add: string;
    addMore: string;
    selected: string;
    summary: string;
    currentQuote: string;
    noService: string;
    onceTotal: string;
    monthly: string;
    generatedMessage: string;
    preparing: string;
    copyAndWhatsApp: string;
    copyMessage: string;
    copiedWhatsApp: string;
    copiedMessage: string;
    couldNotCopy: string;
    decrease: string;
    remove: string;
    perMonth: string;
    units: string;
    oneService: string;
    fromPrefix: string;
    fromInline: string;
    copyClipboard: string;
    couldNotCopyShort: string;
    panelAriaLabel: string;
  };
  process: {
    eyebrow: string;
    title: string;
    steps: { number: string; title: string; desc: string }[];
  };
  contact: { eyebrow: string; title: string };
};

export const translations: Record<Language, Translations> = {
  pt: {
    nav: { projects: "Projetos", budget: "Orçamento", process: "Processo", contact: "Contato" },
    hero: {
      availability: "Disponível para novos projetos",
      greeting: "Olá, eu sou",
      role: "Desenvolvedor Freelancer",
      lead: "Transformo ideias em soluções digitais modernas, intuitivas e de alta performance. Sites, aplicações e experiências que geram resultados reais para o seu negócio.",
      ctaProjects: "Ver projetos",
      ctaBudget: "Montar orçamento",
    },
    projects: {
      eyebrow: "Portfólio em vídeo",
      title: "Projetos prontos para apresentar, vender e validar ideias.",
      lead: "Demos visuais para clientes entenderem a experiência antes mesmo de abrir o código.",
      viewDetails: "Ver detalhes",
      modal: {
        workDone: "O que foi feito",
        technologies: "Tecnologias usadas",
        desktop: "Desktop",
        tablet: "Tablet",
        mobile: "Mobile",
        close: "Fechar",
        closeDetails: "Fechar detalhes do projeto",
        videosLabel: "Vídeos demonstrativos do projeto",
        galleryLabel: "Galeria do projeto",
        emptyGallery: "Sem imagens para esta visualização.",
      },
    },
    budget: {
      channel: {
        eyebrow: "Antes de começar",
        title: "De onde você veio?",
        lead: "Isso define a moeda dos preços e a mensagem gerada automaticamente.",
        workana: {
          label: "Workana",
          desc: "Plataforma brasileira de freelancers. Mensagem gerada em português.",
          currency: "Reais (BRL)",
        },
        upwork: {
          label: "Upwork",
          desc: "Plataforma global de trabalho freelancer. Mensagem gerada em inglês.",
          currency: "Dólar (USD)",
        },
        direct: {
          label: "Indicação direta",
          desc: "Veio por indicação, redes sociais ou contato direto. Moeda detectada pelo seu IP.",
          currency: "Detectado pelo IP",
          detecting: "Detectando localização...",
        },
      },
      title: "Monte um orçamento WordPress em tempo real.",
      lead: "Serviços de sites, SEO, performance e suporte com explicação direta para clientes.",
      change: "Mudar",
      allCategory: "Todos",
      add: "Adicionar",
      addMore: "Adicionar mais",
      selected: "Selecionado",
      summary: "Resumo",
      currentQuote: "Orçamento atual",
      noService: "Nenhum serviço selecionado.",
      onceTotal: "Total único estimado",
      monthly: "Mensal",
      generatedMessage: "Mensagem gerada",
      preparing: "Preparando...",
      copyAndWhatsApp: "Copiar e abrir WhatsApp",
      copyMessage: "Copiar mensagem",
      copiedWhatsApp: "Mensagem copiada e WhatsApp aberto.",
      copiedMessage: "Mensagem copiada para o chat.",
      couldNotCopy: "Não consegui copiar automaticamente. Selecione o texto e copie manualmente.",
      decrease: "Diminuir",
      remove: "Remover",
      perMonth: "/mês",
      units: "unidades",
      oneService: "1 serviço",
      fromPrefix: "A partir de ",
      fromInline: "a partir de ",
      copyClipboard: "Mensagem copiada para colar no chat.",
      couldNotCopyShort: "Não consegui copiar automaticamente. Selecione o texto e copie manualmente.",
      panelAriaLabel: "Resumo do orçamento",
    },
    process: {
      eyebrow: "Como eu construo",
      title: "Estratégia, interface e entrega em uma experiência só.",
      steps: [
        { number: "01", title: "Diagnóstico", desc: "Entendo o objetivo e separo o que é essencial do que pode ser opcional." },
        { number: "02", title: "Construção", desc: "Transformo a solução em interface responsiva, clara e com boa performance." },
        { number: "03", title: "Apresentação", desc: "Organizo o resultado para o cliente entender o valor e aprovar com segurança." },
      ],
    },
    contact: { eyebrow: "Contato", title: "Seu projeto pode ser a próxima história de sucesso." },
  },
  en: {
    nav: { projects: "Projects", budget: "Quote", process: "Process", contact: "Contact" },
    hero: {
      availability: "Available for new projects",
      greeting: "Hi, I'm",
      role: "Freelance Developer",
      lead: "I turn ideas into modern, intuitive, high-performance digital solutions. Websites, apps and experiences that drive real results for your business.",
      ctaProjects: "View projects",
      ctaBudget: "Build a quote",
    },
    projects: {
      eyebrow: "Video portfolio",
      title: "Projects ready to present, sell and validate ideas.",
      lead: "Visual demos for clients to understand the experience before even opening the code.",
      viewDetails: "View details",
      modal: {
        workDone: "What was done",
        technologies: "Technologies used",
        desktop: "Desktop",
        tablet: "Tablet",
        mobile: "Mobile",
        close: "Close",
        closeDetails: "Close project details",
        videosLabel: "Project demo videos",
        galleryLabel: "Project gallery",
        emptyGallery: "No images for this view.",
      },
    },
    budget: {
      channel: {
        eyebrow: "Before we start",
        title: "Where did you come from?",
        lead: "This defines the currency for prices and the auto-generated message.",
        workana: {
          label: "Workana",
          desc: "Brazilian freelance platform. Message generated in Portuguese.",
          currency: "Brazilian Real (BRL)",
        },
        upwork: {
          label: "Upwork",
          desc: "Global freelance platform. Message generated in English.",
          currency: "US Dollar (USD)",
        },
        direct: {
          label: "Direct referral",
          desc: "Came via referral, social media or direct contact. Currency detected by your IP.",
          currency: "Detected by IP",
          detecting: "Detecting location...",
        },
      },
      title: "Build your WordPress quote in real time.",
      lead: "Website, SEO, performance and support services — with clear explanations.",
      change: "Change",
      allCategory: "All",
      add: "Add",
      addMore: "Add more",
      selected: "Selected",
      summary: "Summary",
      currentQuote: "Current quote",
      noService: "No service selected.",
      onceTotal: "One-time total",
      monthly: "Monthly",
      generatedMessage: "Generated message",
      preparing: "Preparing...",
      copyAndWhatsApp: "Copy & open WhatsApp",
      copyMessage: "Copy message",
      copiedWhatsApp: "Message copied and WhatsApp opened.",
      copiedMessage: "Message copied to clipboard.",
      couldNotCopy: "Could not copy automatically. Select the text and copy manually.",
      decrease: "Decrease",
      remove: "Remove",
      perMonth: "/mo",
      units: "units",
      oneService: "1 service",
      fromPrefix: "From ",
      fromInline: "from ",
      copyClipboard: "Message copied to clipboard.",
      couldNotCopyShort: "Could not copy automatically. Select the text and copy manually.",
      panelAriaLabel: "Budget summary",
    },
    process: {
      eyebrow: "How I build",
      title: "Strategy, interface and delivery in one seamless experience.",
      steps: [
        { number: "01", title: "Diagnosis", desc: "I understand the goal and separate what's essential from what's optional." },
        { number: "02", title: "Build", desc: "I turn the solution into a responsive, clear and high-performance interface." },
        { number: "03", title: "Presentation", desc: "I organize the result so the client understands the value and approves with confidence." },
      ],
    },
    contact: { eyebrow: "Contact", title: "Your project could be the next success story." },
  },
  es: {
    nav: { projects: "Proyectos", budget: "Presupuesto", process: "Proceso", contact: "Contacto" },
    hero: {
      availability: "Disponible para nuevos proyectos",
      greeting: "Hola, soy",
      role: "Desarrollador Freelance",
      lead: "Convierto ideas en soluciones digitales modernas, intuitivas y de alto rendimiento. Sitios web, aplicaciones y experiencias que generan resultados reales para tu negocio.",
      ctaProjects: "Ver proyectos",
      ctaBudget: "Armar presupuesto",
    },
    projects: {
      eyebrow: "Portafolio en video",
      title: "Proyectos listos para presentar, vender y validar ideas.",
      lead: "Demos visuales para que los clientes entiendan la experiencia antes de abrir el código.",
      viewDetails: "Ver detalles",
      modal: {
        workDone: "Lo que se hizo",
        technologies: "Tecnologías utilizadas",
        desktop: "Desktop",
        tablet: "Tablet",
        mobile: "Mobile",
        close: "Cerrar",
        closeDetails: "Cerrar detalles del proyecto",
        videosLabel: "Videos demostrativos del proyecto",
        galleryLabel: "Galería del proyecto",
        emptyGallery: "Sin imágenes para esta vista.",
      },
    },
    budget: {
      channel: {
        eyebrow: "Antes de empezar",
        title: "¿Cómo me encontraste?",
        lead: "Esto define la moneda de los precios y el mensaje generado automáticamente.",
        workana: {
          label: "Workana",
          desc: "Plataforma brasileña de freelancers. Mensaje generado en portugués.",
          currency: "Real brasileño (BRL)",
        },
        upwork: {
          label: "Upwork",
          desc: "Plataforma global de freelancers. Mensaje generado en inglés.",
          currency: "Dólar (USD)",
        },
        direct: {
          label: "Referencia directa",
          desc: "Llegaste por referencia, redes sociales o contacto directo. Moneda detectada por tu IP.",
          currency: "Detectado por IP",
          detecting: "Detectando ubicación...",
        },
      },
      title: "Arma tu presupuesto WordPress en tiempo real.",
      lead: "Servicios de sitios web, SEO, rendimiento y soporte — con explicaciones claras.",
      change: "Cambiar",
      allCategory: "Todos",
      add: "Agregar",
      addMore: "Agregar más",
      selected: "Seleccionado",
      summary: "Resumen",
      currentQuote: "Presupuesto actual",
      noService: "Ningún servicio seleccionado.",
      onceTotal: "Total único estimado",
      monthly: "Mensual",
      generatedMessage: "Mensaje generado",
      preparing: "Preparando...",
      copyAndWhatsApp: "Copiar y abrir WhatsApp",
      copyMessage: "Copiar mensaje",
      copiedWhatsApp: "Mensaje copiado y WhatsApp abierto.",
      copiedMessage: "Mensaje copiado al portapapeles.",
      couldNotCopy: "No pude copiar automáticamente. Selecciona el texto y cópialo manualmente.",
      decrease: "Disminuir",
      remove: "Quitar",
      perMonth: "/mes",
      units: "unidades",
      oneService: "1 servicio",
      fromPrefix: "Desde ",
      fromInline: "desde ",
      copyClipboard: "Mensaje copiado al portapapeles.",
      couldNotCopyShort: "No pude copiar automáticamente. Selecciona el texto y cópialo manualmente.",
      panelAriaLabel: "Resumen del presupuesto",
    },
    process: {
      eyebrow: "Cómo construyo",
      title: "Estrategia, interfaz y entrega en una sola experiencia.",
      steps: [
        { number: "01", title: "Diagnóstico", desc: "Entiendo el objetivo y separo lo esencial de lo opcional." },
        { number: "02", title: "Construcción", desc: "Convierto la solución en una interfaz responsiva, clara y de alto rendimiento." },
        { number: "03", title: "Presentación", desc: "Organizo el resultado para que el cliente entienda el valor y apruebe con confianza." },
      ],
    },
    contact: { eyebrow: "Contacto", title: "Tu proyecto puede ser la próxima historia de éxito." },
  },
};
