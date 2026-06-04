export type Language = "pt" | "en" | "es";

export type Translations = {
  nav: { projects: string; budget: string; process: string; contact: string };
  hero: {
    availabilityLabels: { available: string; busy: string; unavailable: string };
    greeting: string;
    role: string;
    lead: string;
    guarantee: string;
    ctaProjects: string;
    ctaBudget: string;
  };
  projects: {
    eyebrow: string;
    title: string;
    stats: { value: number; suffix: string; label: string }[];
    viewDetails: string;
    viewAll: string;
    backHome: string;
    allTitle: string;
    filterAll: string;
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
    packagesTab: string;
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
    addPackage: string;
    packageAdded: string;
    packageSavings: string;
    packageIncludes: string;
    packageDiscount: string;
    hosting: {
      title: string;
      hint: string;
      have: string;
      help: string;
      acquireClient: string;
      acquireVictor: string;
      configLabel: string;
      included: string;
      annualLabel: string;
      perYear: string;
    };
    coupon: {
      label: string;
      placeholder: string;
      apply: string;
      applied: string;
      invalid: string;
      lineLabel: string;
    };
  };
  faq: {
    eyebrow: string;
    title: string;
    items: { q: string; a: string }[];
  };
  testimonials: {
    eyebrow: string;
    title: string;
    lead: string;
    projectTag: string;
    reviewOffer: string;
    workana: { label: string; reviewsSuffix: string; linkLabel: string };
    form: {
      submitBtn: string;
      step1Title: string;
      step1Subtitle: string;
      photoLabel: string;
      photoHint: string;
      nameLabel: string;
      namePlaceholder: string;
      roleLabel: string;
      rolePlaceholder: string;
      companyLabel: string;
      companyPlaceholder: string;
      nextBtn: string;
      step2Title: string;
      step2Subtitle: string;
      ratingLabel: string;
      textLabel: string;
      textPlaceholder: string;
      sendBtn: string;
      sendingBtn: string;
      successTitle: string;
      successText: string;
      closeBtn: string;
      backBtn: string;
      projectLabel: string;
      projectNone: string;
    };
  };
  process: {
    eyebrow: string;
    title: string;
    steps: { number: string; title: string; desc: string }[];
  };
  contact: { eyebrow: string; title: string; lead: string; whatsappGreeting: string; emailSubject: string };
  freeTools: { eyebrow: string; title: string; lead: string; useBtn: string };
  chat: {
    title: string;
    subtitle: string;
    greeting: string;
    placeholder: string;
    send: string;
    fallback: string;
    openLabel: string;
    bubbles: string[];
    leadBtn: string;
    leadTitle: string;
    leadName: string;
    leadContact: string;
    leadMessage: string;
    leadSend: string;
    leadSending: string;
    leadSuccess: string;
    leadCancel: string;
  };
};

export const translations: Record<Language, Translations> = {
  pt: {
    nav: { projects: "Projetos", budget: "Orçamento", process: "Processo", contact: "Contato" },
    hero: {
      availabilityLabels: {
        available: "Disponível para novos projetos",
        busy: "Trabalhando em projetos",
        unavailable: "Indisponível para projetos",
      },
      greeting: "Olá, eu sou",
      role: "Desenvolvedor Freelancer",
      lead: "Crio sites, landing pages e lojas que carregam rápido e transformam visitantes em clientes — entregues no prazo combinado e com acompanhamento depois do ar.",
      guarantee: "7 dias de ajustes grátis · Comunicação direta · Entrega no prazo",
      ctaProjects: "Ver projetos",
      ctaBudget: "Montar orçamento",
    },
    projects: {
      eyebrow: "Portfólio em vídeo",
      title: "Projetos prontos para apresentar, vender e validar ideias.",
      stats: [
        { value: 10, suffix: "+", label: "Projetos entregues" },
        { value: 5, suffix: "+", label: "Segmentos atendidos" },
        { value: 100, suffix: "%", label: "Entregas no prazo" },
      ],
      viewDetails: "Ver detalhes",
      viewAll: "Ver todos os projetos",
      backHome: "Voltar ao início",
      allTitle: "Todos os projetos",
      filterAll: "Todos",
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
      packagesTab: "Pacotes",
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
      addPackage: "Usar este pacote",
      packageAdded: "Adicionado ao orçamento!",
      packageSavings: "Economize",
      packageIncludes: "O que inclui",
      packageDiscount: "Desconto de pacote",
      hosting: {
        title: "Domínio e hospedagem",
        hint: "Onde seu site fica no ar. A mão de obra é grátis junto com um site, loja ou pacote.",
        have: "Já tenho domínio e hospedagem",
        help: "Tenho, mas preciso de ajuda para configurar",
        acquireClient: "Preciso adquirir — eu compro, você configura",
        acquireVictor: "Preciso adquirir — você compra e repassa o custo",
        configLabel: "Configuração de domínio e hospedagem",
        included: "incluso",
        annualLabel: "Domínio + hospedagem (pago ao provedor)",
        perYear: "/ano",
      },
      coupon: {
        label: "Cupom de desconto",
        placeholder: "Ex: OBRIGADO-7K2P",
        apply: "Aplicar",
        applied: "Cupom aplicado!",
        invalid: "Cupom inválido",
        lineLabel: "Desconto do cupom",
      },
    },
    faq: {
      eyebrow: "Dúvidas frequentes",
      title: "Tudo que você precisa saber antes de contratar",
      items: [
        { q: "Quanto tempo leva para entregar um site?", a: "Depende do projeto. Uma página de conversão sai em 3 a 5 dias úteis. Um site institucional completo leva de 7 a 14 dias. Projetos com funcionalidades especiais podem levar mais — sempre alinhamos o prazo antes de começar." },
        { q: "Preciso ter domínio e hospedagem?", a: "Não precisa ter nada pronto. Posso cuidar de tudo ou trabalhar com o que você já tem. Recomendo as melhores opções para cada orçamento e objetivo." },
        { q: "Tem garantia após a entrega?", a: "Sim. Todo projeto inclui 7 dias de ajustes gratuitos após a entrega. Para mais tranquilidade, o Suporte pós-entrega de 30 dias está disponível nos pacotes." },
        { q: "Como funciona o pagamento?", a: "Normalmente 50% para iniciar e 50% na entrega. Para projetos via Workana ou Upwork, sigo os termos da plataforma." },
        { q: "Posso pedir alterações durante o projeto?", a: "Sim, dentro do escopo combinado. Ajustes de layout e conteúdo são bem-vindos. Mudanças que ampliam o escopo são orçadas separadamente antes de serem feitas." },
        { q: "Você trabalha com qualquer tipo de negócio?", a: "Sim. Já trabalhei com clínicas, atletas, e-commerce e prestadores de serviços. Se você tem um negócio, posso criar a presença digital ideal para ele." }
      ],
    },
    testimonials: {
      eyebrow: "Depoimentos",
      title: "O que clientes dizem",
      lead: "Resultados reais de quem confiou no trabalho.",
      projectTag: "Projeto",
      reviewOffer: "Foi meu cliente? Deixe um depoimento e ganhe 10% de desconto no próximo projeto.",
      workana: { label: "Avaliação máxima na Workana", reviewsSuffix: "clientes avaliaram com 5 estrelas", linkLabel: "Ver perfil na Workana" },
      form: {
        submitBtn: "Deixar um depoimento",
        step1Title: "Quem é você?",
        step1Subtitle: "Sua identificação aparecerá junto ao depoimento.",
        photoLabel: "Adicionar foto",
        photoHint: "Foto opcional",
        nameLabel: "Nome completo",
        namePlaceholder: "Seu nome completo",
        roleLabel: "Cargo",
        rolePlaceholder: "Ex: Empreendedor, Designer...",
        companyLabel: "Empresa",
        companyPlaceholder: "Ex: Minha Empresa (opcional)",
        nextBtn: "Próximo →",
        step2Title: "Seu depoimento",
        step2Subtitle: "Conte como foi a experiência de trabalhar comigo.",
        ratingLabel: "Avaliação",
        textLabel: "Depoimento",
        textPlaceholder: "Descreva sua experiência...",
        sendBtn: "Enviar depoimento",
        sendingBtn: "Enviando...",
        successTitle: "Depoimento enviado!",
        successText: "Obrigado! Vou revisar e publicar em breve.",
        closeBtn: "Fechar",
        backBtn: "← Voltar",
        projectLabel: "Qual projeto fizemos pra você? (opcional)",
        projectNone: "Nenhum / depoimento geral",
      },
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
    contact: { eyebrow: "Contato", title: "Seu projeto pode ser a próxima história de sucesso.", lead: "Respondo rápido, normalmente em poucas horas. Me chama no WhatsApp ou e-mail e a gente alinha seu projeto sem compromisso.", whatsappGreeting: "Olá Victor! Vim pelo seu portfólio e gostaria de conversar sobre um projeto.", emailSubject: "Contato pelo portfólio" },
    freeTools: { eyebrow: "Ferramentas gratuitas", title: "Sistemas que criei, com acesso livre para você", lead: "Ferramentas web que desenvolvi e disponibilizo sem custo. Use à vontade — e se curtir, imagina o que posso criar pro seu negócio.", useBtn: "Usar grátis" },
    chat: {
      title: "Assistente do Victor",
      subtitle: "Tira dúvidas e monta orçamento",
      greeting: "Oi! Sou o assistente do Victor. Posso te ajudar a escolher um serviço, montar um orçamento ou recomendar um pacote pro seu projeto. Como posso ajudar?",
      placeholder: "Escreva sua mensagem...",
      send: "Enviar",
      fallback: "Tive um probleminha agora. Tente de novo em instantes ou deixe seu pedido no botão abaixo.",
      openLabel: "Abrir chat com o assistente",
      bubbles: [
        "Precisa de ajuda com seu projeto?",
        "Posso recomendar o pacote ideal pro seu negócio",
        "Tem um escopo pronto? Eu monto seu orçamento na hora",
        "Quer um site que aparece no Google? Me pergunta",
        "Dúvida sobre preços ou prazos? É só falar",
      ],
      leadBtn: "Deixar um pedido",
      leadTitle: "Deixe seu pedido que o Victor avalia",
      leadName: "Seu nome",
      leadContact: "E-mail ou WhatsApp",
      leadMessage: "O que você precisa?",
      leadSend: "Enviar pedido",
      leadSending: "Enviando...",
      leadSuccess: "Pedido enviado! O Victor vai te retornar em breve.",
      leadCancel: "Cancelar",
    },
  },
  en: {
    nav: { projects: "Projects", budget: "Quote", process: "Process", contact: "Contact" },
    hero: {
      availabilityLabels: {
        available: "Available for new projects",
        busy: "Working on a project",
        unavailable: "Not available for projects",
      },
      greeting: "Hi, I'm",
      role: "Freelance Developer",
      lead: "I build websites, landing pages and online stores that load fast and turn visitors into customers — delivered on the agreed deadline, with support after launch.",
      guarantee: "7 days of free tweaks · Direct communication · Delivered on time",
      ctaProjects: "View projects",
      ctaBudget: "Build a quote",
    },
    projects: {
      eyebrow: "Video portfolio",
      title: "Projects ready to present, sell and validate ideas.",
      stats: [
        { value: 10, suffix: "+", label: "Projects delivered" },
        { value: 5, suffix: "+", label: "Segments served" },
        { value: 100, suffix: "%", label: "On-time delivery" },
      ],
      viewDetails: "View details",
      viewAll: "View all projects",
      backHome: "Back to home",
      allTitle: "All projects",
      filterAll: "All",
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
      packagesTab: "Packages",
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
      addPackage: "Use this package",
      packageAdded: "Added to quote!",
      packageSavings: "Save",
      packageIncludes: "What's included",
      packageDiscount: "Package discount",
      hosting: {
        title: "Domain & hosting",
        hint: "Where your site lives online. Setup labor is free with a site, store or package.",
        have: "I already have domain & hosting",
        help: "I have it, but need help setting it up",
        acquireClient: "I need to get it — I buy, you configure",
        acquireVictor: "I need to get it — you buy and pass the cost",
        configLabel: "Domain & hosting setup",
        included: "included",
        annualLabel: "Domain + hosting (paid to provider)",
        perYear: "/yr",
      },
      coupon: {
        label: "Discount coupon",
        placeholder: "e.g. OBRIGADO-7K2P",
        apply: "Apply",
        applied: "Coupon applied!",
        invalid: "Invalid coupon",
        lineLabel: "Coupon discount",
      },
    },
    faq: {
      eyebrow: "FAQ",
      title: "Everything you need to know before hiring",
      items: [
        { q: "How long does it take to deliver a website?", a: "It depends on the project. A conversion page takes 3 to 5 business days. A full institutional site takes 7 to 14 days. Projects with special features may take longer — we always agree on the timeline upfront." },
        { q: "Do I need a domain and hosting?", a: "No, you don't need anything set up. I can handle everything for you, or work with what you already have. I recommend the best options for your budget and goals." },
        { q: "Is there a guarantee after delivery?", a: "Yes. Every project includes 7 days of free revisions after delivery. For extra peace of mind, the 30-day post-delivery support is available in the packages." },
        { q: "How does payment work?", a: "Typically 50% upfront and 50% on delivery. For Upwork or Workana projects, I follow the platform's payment terms." },
        { q: "Can I request changes during the project?", a: "Yes, within the agreed scope. Layout and content changes are welcome. Changes that expand the scope are quoted separately before any work begins." },
        { q: "Do you work with any type of business?", a: "Yes. I've worked with clinics, athletes, e-commerce stores, and service providers. If you have a business, I can create the perfect digital presence for it." }
      ],
    },
    testimonials: {
      eyebrow: "Testimonials",
      title: "What clients say",
      lead: "Real results from those who trusted the work.",
      projectTag: "Project",
      reviewOffer: "Were you my client? Leave a testimonial and get 10% off your next project.",
      workana: { label: "Top rating on Workana", reviewsSuffix: "clients rated 5 stars", linkLabel: "View Workana profile" },
      form: {
        submitBtn: "Leave a testimonial",
        step1Title: "Who are you?",
        step1Subtitle: "Your identification will appear alongside the testimonial.",
        photoLabel: "Add photo",
        photoHint: "Optional photo",
        nameLabel: "Full name",
        namePlaceholder: "Your full name",
        roleLabel: "Role",
        rolePlaceholder: "e.g. Entrepreneur, Designer...",
        companyLabel: "Company",
        companyPlaceholder: "e.g. My Company (optional)",
        nextBtn: "Next →",
        step2Title: "Your testimonial",
        step2Subtitle: "Tell me about your experience working with me.",
        ratingLabel: "Rating",
        textLabel: "Testimonial",
        textPlaceholder: "Describe your experience...",
        sendBtn: "Send testimonial",
        sendingBtn: "Sending...",
        successTitle: "Testimonial sent!",
        successText: "Thank you! I'll review and publish it soon.",
        closeBtn: "Close",
        backBtn: "← Back",
        projectLabel: "Which project did we do for you? (optional)",
        projectNone: "None / general feedback",
      },
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
    contact: { eyebrow: "Contact", title: "Your project could be the next success story.", lead: "I reply fast, usually within a few hours. Message me on WhatsApp or email and we'll scope your project — no commitment.", whatsappGreeting: "Hi Victor! I came from your portfolio and would like to talk about a project.", emailSubject: "Contact from your portfolio" },
    freeTools: { eyebrow: "Free tools", title: "Systems I built, with free access for you", lead: "Web tools I developed and share at no cost. Use them freely — and if you like them, imagine what I can build for your business.", useBtn: "Use for free" },
    chat: {
      title: "Victor's assistant",
      subtitle: "Answers questions & builds quotes",
      greeting: "Hi! I'm Victor's assistant. I can help you choose a service, build a quote, or recommend a package for your project. How can I help?",
      placeholder: "Type your message...",
      send: "Send",
      fallback: "I hit a little snag. Try again in a moment, or leave your request using the button below.",
      openLabel: "Open chat with the assistant",
      bubbles: [
        "Need help with your project?",
        "I can recommend the perfect package for your business",
        "Got a scope ready? I'll build your quote on the spot",
        "Want a site that shows up on Google? Just ask",
        "Questions about pricing or timelines? Go ahead",
      ],
      leadBtn: "Leave a request",
      leadTitle: "Leave your request and Victor will review it",
      leadName: "Your name",
      leadContact: "Email or WhatsApp",
      leadMessage: "What do you need?",
      leadSend: "Send request",
      leadSending: "Sending...",
      leadSuccess: "Request sent! Victor will get back to you soon.",
      leadCancel: "Cancel",
    },
  },
  es: {
    nav: { projects: "Proyectos", budget: "Presupuesto", process: "Proceso", contact: "Contacto" },
    hero: {
      availabilityLabels: {
        available: "Disponible para nuevos proyectos",
        busy: "Trabajando en proyectos",
        unavailable: "No disponible para proyectos",
      },
      greeting: "Hola, soy",
      role: "Desarrollador Freelance",
      lead: "Creo sitios web, landing pages y tiendas que cargan rápido y convierten visitantes en clientes — entregados en el plazo acordado y con soporte después del lanzamiento.",
      guarantee: "7 días de ajustes gratis · Comunicación directa · Entrega a tiempo",
      ctaProjects: "Ver proyectos",
      ctaBudget: "Armar presupuesto",
    },
    projects: {
      eyebrow: "Portafolio en video",
      title: "Proyectos listos para presentar, vender y validar ideas.",
      stats: [
        { value: 10, suffix: "+", label: "Proyectos entregados" },
        { value: 5, suffix: "+", label: "Segmentos atendidos" },
        { value: 100, suffix: "%", label: "Entregas a tiempo" },
      ],
      viewDetails: "Ver detalles",
      viewAll: "Ver todos los proyectos",
      backHome: "Volver al inicio",
      allTitle: "Todos los proyectos",
      filterAll: "Todos",
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
      packagesTab: "Paquetes",
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
      addPackage: "Usar este paquete",
      packageAdded: "¡Agregado al presupuesto!",
      packageSavings: "Ahorra",
      packageIncludes: "Qué incluye",
      packageDiscount: "Descuento de paquete",
      hosting: {
        title: "Dominio y hosting",
        hint: "Donde vive tu sitio. La mano de obra es gratis junto con un sitio, tienda o paquete.",
        have: "Ya tengo dominio y hosting",
        help: "Lo tengo, pero necesito ayuda para configurar",
        acquireClient: "Necesito adquirirlo — yo compro, tú configuras",
        acquireVictor: "Necesito adquirirlo — tú compras y repasas el costo",
        configLabel: "Configuración de dominio y hosting",
        included: "incluido",
        annualLabel: "Dominio + hosting (pagado al proveedor)",
        perYear: "/año",
      },
      coupon: {
        label: "Cupón de descuento",
        placeholder: "Ej: OBRIGADO-7K2P",
        apply: "Aplicar",
        applied: "¡Cupón aplicado!",
        invalid: "Cupón inválido",
        lineLabel: "Descuento del cupón",
      },
    },
    faq: {
      eyebrow: "Preguntas frecuentes",
      title: "Todo lo que necesitas saber antes de contratar",
      items: [
        { q: "¿Cuánto tarda en entregar un sitio web?", a: "Depende del proyecto. Una página de conversión se entrega en 3 a 5 días hábiles. Un sitio institucional completo tarda de 7 a 14 días. Proyectos con funcionalidades especiales pueden tardar más — siempre acordamos el plazo antes de empezar." },
        { q: "¿Necesito tener dominio y hosting?", a: "No necesitas tener nada listo. Puedo encargarlo todo por ti o trabajar con lo que ya tienes. Recomiendo las mejores opciones para tu presupuesto y objetivos." },
        { q: "¿Hay garantía después de la entrega?", a: "Sí. Todo proyecto incluye 7 días de ajustes gratuitos después de la entrega. Para mayor tranquilidad, el Soporte post-entrega de 30 días está disponible en los paquetes." },
        { q: "¿Cómo funciona el pago?", a: "Normalmente 50% para empezar y 50% en la entrega. Para proyectos en Workana o Upwork, sigo los términos de la plataforma." },
        { q: "¿Puedo pedir cambios durante el proyecto?", a: "Sí, dentro del alcance acordado. Los ajustes de diseño y contenido son bienvenidos. Los cambios que amplían el alcance se presupuestan por separado antes de hacerse." },
        { q: "¿Trabajas con cualquier tipo de negocio?", a: "Sí. He trabajado con clínicas, atletas, e-commerce y proveedores de servicios. Si tienes un negocio, puedo crear la presencia digital ideal para él." }
      ],
    },
    testimonials: {
      eyebrow: "Testimonios",
      title: "Lo que dicen los clientes",
      lead: "Resultados reales de quienes confiaron en el trabajo.",
      projectTag: "Proyecto",
      reviewOffer: "¿Fuiste mi cliente? Deja un testimonio y obtén 10% de descuento en tu próximo proyecto.",
      workana: { label: "Calificación máxima en Workana", reviewsSuffix: "clientes calificaron con 5 estrellas", linkLabel: "Ver perfil en Workana" },
      form: {
        submitBtn: "Dejar un testimonio",
        step1Title: "¿Quién eres?",
        step1Subtitle: "Tu identificación aparecerá junto al testimonio.",
        photoLabel: "Añadir foto",
        photoHint: "Foto opcional",
        nameLabel: "Nombre completo",
        namePlaceholder: "Tu nombre completo",
        roleLabel: "Cargo",
        rolePlaceholder: "Ej: Emprendedor, Diseñador...",
        companyLabel: "Empresa",
        companyPlaceholder: "Ej: Mi Empresa (opcional)",
        nextBtn: "Siguiente →",
        step2Title: "Tu testimonio",
        step2Subtitle: "Cuéntame cómo fue trabajar conmigo.",
        ratingLabel: "Puntuación",
        textLabel: "Testimonio",
        textPlaceholder: "Describe tu experiencia...",
        sendBtn: "Enviar testimonio",
        sendingBtn: "Enviando...",
        successTitle: "¡Testimonio enviado!",
        successText: "¡Gracias! Lo revisaré y publicaré pronto.",
        closeBtn: "Cerrar",
        backBtn: "← Volver",
        projectLabel: "¿Qué proyecto hicimos para ti? (opcional)",
        projectNone: "Ninguno / opinión general",
      },
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
    contact: { eyebrow: "Contacto", title: "Tu proyecto puede ser la próxima historia de éxito.", lead: "Respondo rápido, normalmente en pocas horas. Escríbeme por WhatsApp o correo y planificamos tu proyecto, sin compromiso.", whatsappGreeting: "¡Hola Victor! Vine desde tu portafolio y me gustaría hablar sobre un proyecto.", emailSubject: "Contacto desde tu portafolio" },
    freeTools: { eyebrow: "Herramientas gratuitas", title: "Sistemas que creé, con acceso libre para ti", lead: "Herramientas web que desarrollé y comparto sin costo. Úsalas libremente — y si te gustan, imagina lo que puedo crear para tu negocio.", useBtn: "Usar gratis" },
    chat: {
      title: "Asistente de Victor",
      subtitle: "Resuelve dudas y arma presupuestos",
      greeting: "¡Hola! Soy el asistente de Victor. Puedo ayudarte a elegir un servicio, armar un presupuesto o recomendar un paquete para tu proyecto. ¿Cómo puedo ayudarte?",
      placeholder: "Escribe tu mensaje...",
      send: "Enviar",
      fallback: "Tuve un pequeño problema. Inténtalo de nuevo en un momento o deja tu solicitud en el botón de abajo.",
      openLabel: "Abrir chat con el asistente",
      bubbles: [
        "¿Necesitas ayuda con tu proyecto?",
        "Puedo recomendarte el paquete ideal para tu negocio",
        "¿Tienes un alcance listo? Armo tu presupuesto al instante",
        "¿Quieres un sitio que aparezca en Google? Pregúntame",
        "¿Dudas sobre precios o plazos? Solo dime",
      ],
      leadBtn: "Dejar una solicitud",
      leadTitle: "Deja tu solicitud y Victor la evalúa",
      leadName: "Tu nombre",
      leadContact: "Email o WhatsApp",
      leadMessage: "¿Qué necesitas?",
      leadSend: "Enviar solicitud",
      leadSending: "Enviando...",
      leadSuccess: "¡Solicitud enviada! Victor te responderá pronto.",
      leadCancel: "Cancelar",
    },
  },
};
