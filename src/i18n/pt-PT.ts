export const ptPT = {
  brand: {
    name: "ScoutKnock",
    scout: "Scout",
    knock: "Knock",
    slogan: "Bate à porta certa.",
    tagline:
      "Encontra empresas que precisam do teu serviço e chega com a proposta pronta.",
  },
  landing: {
    meta: {
      title: "ScoutKnock — Bate à porta certa",
      description:
        "Radar de clientes para freelancers. Encontra empresas locais que precisam do teu serviço e chega com a proposta pronta. Entra na lista de espera.",
    },
    joinButton: "Entrar na lista de espera",
    futureNote: "É assim que vai funcionar quando abrirmos.",
    nav: {
      label: "Navegação principal",
      menu: "Menu",
      openMenu: "Abrir menu",
      howItWorks: "Como funciona",
      faq: "Perguntas",
      signIn: "Entrar",
      goToPanel: "Ir para o painel",
    },
    hero: {
      badge: "Em construção · lista de espera aberta",
      titleLead: "Bate à porta ",
      titleAccent: "certa.",
      subtitle:
        "Encontra empresas locais que precisam do teu serviço, percebe porquê e chega com a proposta pronta.",
      secondary: "Ver como funciona",
      note: "Sem cartão. Só te avisamos quando abrirmos.",
      radarLabel: "Radar de exemplo com quatro empresas encontradas, uma em destaque.",
      filters: ["Criação de sites", "Barbearias", "Porto"],
      exampleNote: "Exemplo ilustrativo · empresas e valores fictícios",
    },
    sectionLabels: {
      audience: "Para quem é",
      howItWorks: "Como funciona",
      score: "A nota",
      demo: "Site demo",
      honesty: "Honestidade",
      faq: "Perguntas",
    },
    niches: [
      "Barbearias",
      "Restaurantes",
      "Clínicas dentárias",
      "Ginásios",
      "Oficinas",
      "Cafés",
      "Cabeleireiros",
      "Fisioterapia",
      "Imobiliárias",
    ],
    audience: {
      title: "Feito para quem vende serviços",
      body: "Se trabalhas por conta própria ou numa pequena agência, o ScoutKnock ajuda-te a deixar de adivinhar a quem escrever.",
      tags: [
        "Sites e landing pages",
        "Social media",
        "Design",
        "Marketing",
        "Fotografia e vídeo",
      ],
    },
    howItWorks: {
      title: "Do \"por onde começo?\" ao primeiro contacto",
      steps: [
        {
          title: "Encontra",
          body: "Escolhes o teu serviço, um nicho (por exemplo, barbearias) e uma localidade. O ScoutKnock mostra empresas reais dessa zona.",
        },
        {
          title: "Percebe",
          body: "Cada empresa recebe uma nota de oportunidade com os motivos: sem site, site lento, sem versão para telemóvel, poucas avaliações. Ficas a saber porque vale a pena contactar.",
        },
        {
          title: "Propõe",
          body: "Recebes uma mensagem de abordagem feita para aquela empresa, que revês e envias tu, e podes mostrar-lhe um site demo com o nome dela. Antes de falares de preço, ela já vê o que podes fazer.",
        },
      ],
    },
    screens: {
      badge: "Exemplo ilustrativo",
      filters: [
        { label: "serviço", value: "Criação de sites" },
        { label: "nicho", value: "Barbearias" },
        { label: "local", value: "Porto" },
      ],
      draftBadge: "rascunho · revê antes de enviar",
      draftText: "Olá! Reparei que a Barbearia Horizonte ainda não tem site…",
    },
    example: {
      title: "Vês os motivos, não só o número",
      intro:
        "70 a 100 é Forte, 40 a 69 é Média, abaixo disso é Fraca. Cada nota diz-te o que foi encontrado, para decidires tu.",
      tryIt: "Escolhe um nicho e vê o radar a procurar. Depois abre cada empresa para veres de onde vem a nota.",
      badge: "Exemplo ilustrativo",
      company: "Barbearia Horizonte",
      scoreLabel: "Nota",
      scoreSuffix: "/100",
      nicheLabel: "Escolher um nicho",
      niches: {
        pastelarias: "Pastelarias",
        barbearias: "Barbearias",
        oficinas: "Oficinas",
      },
      searching: (niche: string) => `A procurar ${niche.toLowerCase()}…`,
      found: (count: number, locality: string) =>
        `${count} empresas de exemplo · ${locality}`,
      note: "Simulação com empresas e valores fictícios, sem nenhuma busca real. A nota é calculada pela mesma função do Radar.",
    },
    show: {
      window: {
        url: "demo.exemplo · prévia não oficial",
        badge: "Exemplo ilustrativo",
        viewLabel: "Ver a prévia em",
        desktop: "Computador",
        mobile: "Telemóvel",
        company: "Barbearia Horizonte",
        nav: "Serviços · Preços · Marcar",
        headline: "O corte certo, à hora marcada.",
        action: "Marcar horário",
        notice: "Proposta não oficial. Feita por [nome do freelancer] para [empresa].",
      },
      title: "Chega com algo para mostrar",
      body: "Em vez de mais uma mensagem genérica, apresenta uma prévia de site feita para aquela empresa. É mais fácil dizer que sim a algo que já parece seu.",
      points: [
        "Demos pensadas para o negócio de cada empresa",
        "Boas no computador e no telemóvel",
        "Se a empresa gostar, publicas como site oficial",
      ],
    },
    honesty: {
      title: "Sem promessas mágicas",
      body: "O ScoutKnock encontra empresas e prepara a abordagem. Fechar o negócio continua a ser trabalho teu. Não prometemos resultados, só uma forma mais direta de chegar às pessoas certas.",
      points: [
        "Dados de empresas obtidos através da API oficial do Google",
        "Mensagens enviadas sempre por ti, uma de cada vez",
        "Nada de envios em massa",
      ],
    },
    faq: {
      title: "Perguntas frequentes",
      // Só com o Brasil ligado em MARKETS_ENABLED, no lugar da pergunta "Funciona em que países?".
      withBrazil: {
        replaces: "Funciona em que países?",
        question: "Funciona em Portugal e no Brasil?",
        answer:
          "Sim, é esse o objetivo. A busca vai funcionar por distrito e concelho em Portugal, e por cidade e bairro no Brasil.",
      },
      items: [
        {
          question: "Quando abre?",
          answer:
            "Estamos a construir o produto. Quem estiver na lista de espera é avisado primeiro, por email, quando houver data.",
        },
        {
          question: "Vai ter teste grátis?",
          answer:
            "Planeamos incluir um teste grátis de 7 dias. Os detalhes e os preços serão anunciados no lançamento.",
        },
        {
          question: "Funciona em que países?",
          answer: "Para já, só em Portugal. A busca funciona por distrito e concelho.",
        },
        {
          question: "De onde vêm os dados das empresas?",
          answer:
            "Da API oficial do Google. Guardamos apenas informação comercial pública das empresas.",
        },
        {
          question: "O ScoutKnock envia as mensagens por mim?",
          answer:
            "Não. Geramos a mensagem e tu revês, ajustas e envias. É mais seguro para a tua conta, e o envio fica sempre nas tuas mãos.",
        },
        {
          question: "Posso contactar qualquer empresa?",
          answer:
            "Podes contactar empresas, mas deves fazê-lo de forma individual, identificares-te e respeitares quem pedir para não ser contactado. Vamos incluir essa informação nos termos de utilização.",
        },
        {
          question: "Preciso de experiência em vendas?",
          answer:
            "Não. A nota e a mensagem sugerida servem de ponto de partida. Quanto mais as adaptares, melhor.",
        },
        {
          question: "Quanto vai custar?",
          answer:
            "Ainda estamos a fechar os preços. Vão ser planos mensais, com limites de buscas e de sites demo, e quem estiver na lista de espera saberá primeiro.",
        },
      ],
    },
    finalCta: {
      titleLead: "Bate à porta ",
      titleAccent: "certa.",
      body: "Menos procura, mais conversas.",
    },
    footer: {
      privacy: "Privacidade",
      terms: "Termos",
      contact: "Contacto",
      copyright: "© 2026 ScoutKnock. Feito em Portugal.",
    },
  },
  waitlist: {
    title: "Sê dos primeiros a entrar",
    intro: "Deixa o teu email e avisamos-te quando abrirmos.",
    emailLabel: "O teu email",
    emailPlaceholder: "nome@exemplo.pt",
    serviceLabel: "O que vendes? (opcional)",
    serviceEmpty: "Escolhe uma opção",
    services: [
      { value: "sites", label: "Sites" },
      { value: "social_media", label: "Social media" },
      { value: "design", label: "Design" },
      { value: "marketing", label: "Marketing" },
      { value: "other", label: "Outro" },
    ],
    submit: "Entrar na lista de espera",
    pending: "Um momento…",
    privacyBefore:
      "Usamos o teu email só para te avisar do lançamento. Podes sair da lista quando quiseres. Lê a ",
    privacyLink: "Política de Privacidade",
    privacyAfter: ".",
    devLinkNotice:
      "Só em desenvolvimento: o envio real está desligado, por isso este email não chega a ninguém.",
    devLink: "Abrir o link de confirmação",
    messages: {
      success:
        "Se este email ainda não estiver na lista, enviámos-te um email para o confirmares.",
      invalidEmail: "Este email não parece válido. Confirma e tenta outra vez.",
      closed:
        "A lista de espera ainda não está aberta. Tenta outra vez mais tarde.",
      generic: "Algo correu mal. Tenta outra vez dentro de instantes.",
    },
    email: {
      subject: "Confirma o teu email na lista de espera do ScoutKnock",
      intro:
        "Pediste para entrar na lista de espera do ScoutKnock. Abre este link para confirmares o teu email:",
      confirmLink: "Confirmar o meu email",
      ignore: "Se não foste tu, ignora este email e não voltamos a contactar-te.",
      unsubscribe: "Sair da lista:",
    },
    confirm: {
      title: "Confirmar o teu email",
      body: "Carrega no botão para confirmares que queres entrar na lista de espera.",
      submit: "Confirmar email",
      success: "Email confirmado. Avisamos-te quando abrirmos.",
      invalid: "Este link não é válido. Volta a inscrever-te na lista de espera.",
    },
    leave: {
      title: "Sair da lista de espera",
      body: "Carrega no botão para apagarmos o teu email da lista.",
      submit: "Sair da lista",
      success: "Apagámos o teu email da lista.",
      invalid: "Este link não é válido.",
    },
    backHome: "Voltar à página inicial",
  },
  legal: {
    navLabel: "Páginas legais",
    reviewNotice:
      "Texto provisório. O conteúdo legal final ainda está em revisão.",
    backHome: "Voltar à página inicial",
    privacy: {
      title: "Política de Privacidade",
      paragraphs: [
        "Se entrares na lista de espera, guardamos o teu email, o serviço que indicares (opcional) e a data do teu consentimento.",
        "Usamos estes dados só para te avisar do lançamento do ScoutKnock. Podes sair da lista quando quiseres, com a ligação incluída em cada email, e apagamos o teu email da lista.",
        "Se não confirmares o teu email, apagamos o registo ao fim de 30 dias.",
        "Os emails são enviados através do Resend, e os dados ficam guardados no Supabase.",
        "Se criares uma conta, guardamos o teu email, o teu nome, as tuas buscas, as notas e os estados dos teus contactos, e registos de utilização e de erros, para prestar o serviço e o manter seguro.",
        "Dados de empresas: quando a busca real estiver ligada, mostramos dados públicos de empresas obtidos pela API oficial do Google Places. Não guardamos esses dados: guardamos só o identificador da empresa e o que tu escreves.",
        "Sites demo: mostram o que o freelancer escreve, têm o aviso de proposta não oficial e são apagados ao fim de 30 dias.",
        "Stripe, quando estiver ligado: trata os pagamentos e recebe o teu email. Não guardamos dados de cartão.",
        "Google, quando estiver ligado: recebe o nicho e a localidade de cada busca e o identificador da empresa que abrires.",
        "Anthropic, quando estiver ligado: recebe o nome da empresa, o nicho, os motivos, o serviço que escolheste e o canal da mensagem, para a escrever.",
        "O responsável pelos dados é Daniel de Aguiar Araujo. Para exerceres os teus direitos, escreve para starkdaniel1113@gmail.com.",
      ],
    },
    terms: {
      title: "Termos",
      paragraphs: [
        "O ScoutKnock ainda está em construção, e por agora esta página serve só para a lista de espera.",
        "Os termos de utilização completos vão ser publicados aqui antes do lançamento, incluindo as regras sobre o contacto com empresas.",
      ],
    },
    contact: {
      title: "Contacto",
      paragraphs: [
        "Responsável: Daniel de Aguiar Araujo.",
        "Email de contacto: starkdaniel1113@gmail.com.",
      ],
    },
  },
  auth: {
    fields: {
      email: "Email",
      password: "Palavra-passe",
      newPassword: "Nova palavra-passe",
      passwordHint: "Pelo menos 8 caracteres.",
      showPassword: "Mostrar palavra-passe",
      hidePassword: "Esconder palavra-passe",
    },
    panelPhrase: "Encontra quem precisa do teu serviço.",
    homeLink: "ScoutKnock, ir para a página inicial",
    signUp: {
      title: "Criar conta",
      submit: "Criar conta",
      hasAccount: "Já tens conta?",
      signInLink: "Entrar",
    },
    signIn: {
      title: "Entrar",
      submit: "Entrar",
      noAccount: "Ainda não tens conta?",
      signUpLink: "Criar conta",
      forgot: "Esqueceste a palavra-passe?",
    },
    reset: {
      title: "Recuperar palavra-passe",
      intro: "Indica o teu email e enviamos-te um link para criares uma nova.",
      submit: "Enviar link",
      backToSignIn: "Voltar a entrar",
    },
    newPassword: {
      title: "Nova palavra-passe",
      submit: "Guardar palavra-passe",
    },
    invalidLink: {
      title: "Link inválido",
      body: "Este link já foi usado ou expirou. Pede um novo para continuar.",
      action: "Pedir novo link",
    },
    pending: "Um momento…",
    success: {
      signUp:
        "Se este email ainda não tiver conta, enviámos-te um link de confirmação. Abre-o para entrares.",
      reset:
        "Se existir uma conta com este email, enviámos-te um link para criares uma nova palavra-passe.",
    },
    errors: {
      invalidEmail: "Escreve um email válido.",
      shortPassword: "A palavra-passe precisa de pelo menos 8 caracteres.",
      invalidCredentials: "Email ou palavra-passe incorretos.",
      emailNotConfirmed: "Confirma o teu email antes de entrar.",
      samePassword: "Escolhe uma palavra-passe diferente da atual.",
      rateLimited: "Fizeste demasiados pedidos seguidos. Espera um pouco e tenta outra vez.",
      generic: "Algo correu mal. Tenta outra vez e, se continuar, contacta o suporte.",
    },
  },
  ui: {
    close: "Fechar",
    live: { live: "ao vivo", searching: "a procurar" },
    scoreUnavailable: "Nota indisponível",
  },
  uiPreview: {
    title: "Componentes",
    intro:
      "Página interna, só em desenvolvimento. Os estados hover, foco e pressionado estão forçados para os veres lado a lado.",
    toggleTheme: "Mudar tema",
    states: {
      normal: "Normal",
      hover: "Hover",
      focus: "Foco",
      pressed: "Pressionado",
      disabled: "Desativado",
      loading: "A carregar",
      error: "Erro",
      selected: "Selecionado",
    },
    sections: {
      tokens: "Tokens",
      type: "Tipografia",
      motion: "Movimento",
      button: "Button",
      field: "Field",
      card: "Card e Panel",
      badge: "Badge e Kbd",
      tabs: "Tabs",
      overlays: "Dialog, DropdownMenu e Tooltip",
      feedback: "Skeleton, Progress e Toast",
      avatar: "Avatar",
      score: "ScoreChip e ScoreBreakdown",
      empty: "EmptyState",
      live: "LiveDot",
      logo: "Logo",
    },
    variants: {
      primary: "Principal",
      secondary: "Secundário",
      ghost: "Discreto",
      danger: "Perigo",
    },
    sizes: { small: "36 px", medium: "44 px", large: "52 px" },
    typeSample: "Bate à porta certa.",
    bodySample:
      "Encontra empresas locais que precisam do teu serviço, percebe porquê e chega com a proposta pronta.",
    sectionLabel: "Etiqueta de secção",
    numberSample: "1234567890",
    replay: "Repetir entrada",
    revealItem: "Entrada",
    buttonLabel: "Procurar empresas",
    buttonLoading: "A procurar…",
    fieldLabel: "Localidade",
    fieldPlaceholder: "Por exemplo, Porto",
    fieldHelp: "Distrito ou concelho.",
    fieldError: "Escreve uma localidade.",
    selectLabel: "Serviço",
    selectOption: "Criação de sites",
    textareaLabel: "Notas",
    textareaPlaceholder: "Escreve aqui as tuas notas.",
    cardTitle: "Barbearias no Porto",
    cardBody: "Exemplo ilustrativo de um cartão.",
    cardInteractive: "Clicável",
    panelTitle: "Painel",
    panelBody: "Um painel agrupa conteúdo maior.",
    badges: {
      neutral: "Neutra",
      accent: "Forte",
      amber: "Média",
      danger: "Erro",
      outline: "Contorno",
    },
    tabs: { one: "Todas", two: "Forte", three: "Média", disabled: "Fraca" },
    tabContent: "Conteúdo do separador",
    openDialog: "Abrir diálogo",
    dialogTitle: "Publicar como oficial",
    dialogBody: "Exemplo de um diálogo de confirmação.",
    dialogConfirm: "Confirmar",
    dialogCancel: "Cancelar",
    openMenu: "Abrir menu",
    menuLabel: "Ações",
    menuItem: "Gerar mensagem",
    menuItemTwo: "Criar site demo",
    menuItemDisabled: "Publicar como oficial",
    menuItemDanger: "Apagar",
    tooltipTrigger: "Passa aqui",
    tooltipContent: "Texto de ajuda",
    toastSuccess: "Mostrar sucesso",
    toastError: "Mostrar erro",
    toastSuccessText: "Copiada",
    toastErrorText: "Algo correu mal. Tenta outra vez dentro de instantes.",
    progressLabel: "Progresso",
    avatarAlt: "Ana Exemplo",
    avatarInitials: "AE",
    nextCompany: "Outra empresa de exemplo",
    emptyTitle: "Escolhe um serviço, um nicho e uma localidade para começar.",
    emptyAction: "Nova busca",
  },
  radar: {
    title: "Radar",
    steps: { reading: "A ler empresas", scoring: "A calcular notas" },
    countOne: "empresa",
    countOther: "empresas",
    sorted: "ordenadas pela nota",
    cancel: "Cancelar",
    newSearch: "Nova busca",
    back: "Voltar à busca",
    retry: "Tentar outra vez",
    filterLabel: "Filtrar por nível",
    filterAll: "Todas",
    filterEmpty: "Nenhuma empresa neste nível.",
    resultsLabel: "Resultados",
    detailLabel: "Empresa selecionada",
    details: {
      title: "Dados públicos",
      address: "Morada",
      website: "Site",
      noWebsite: "Sem site",
      phone: "Telefone",
      reviews: "Avaliações",
      hours: "Horário",
      hoursYes: "Publicado",
      hoursNo: "Sem horário publicado",
    },
    errors: {
      provider: "Algo correu mal. Tenta outra vez e, se continuar, contacta o suporte.",
      limit: "Chegaste ao limite de buscas deste mês. Vê os planos ou espera pelo próximo mês.",
      budget: "A busca está temporariamente indisponível. Tenta mais tarde.",
      offline: "Sem ligação à internet. Verifica a rede e tenta outra vez.",
      unavailable: "A busca ainda não está disponível.",
      locality: "Escolhe um distrito ou um concelho da lista de sugestões. Esta busca não foi contada.",
    },
    sampleOnlyIn:
      "Em modo de exemplo, só há empresas no Porto, em Lisboa, em Braga e em Coimbra.",
    attribution: "Dados do Google Maps",
    sampleNotice:
      "Exemplo ilustrativo: as empresas abaixo são fictícias, porque a busca real ainda não está ligada.",
    sampleBadge: "Exemplo ilustrativo",
    unavailable: "A busca ainda não está disponível.",
    serviceLabel: "Serviço",
    services: { website_creation: "Criação de sites" },
    nicheLabel: "Nicho",
    nichePlaceholder: "Por exemplo, barbearias",
    localityLabel: "Localidade",
    localityPlaceholder: "Por exemplo, Porto",
    submit: "Procurar empresas",
    empty: "Escolhe um serviço, um nicho e uma localidade para começar.",
    noResults:
      "Não encontrámos empresas com estes filtros. Experimenta outra localidade ou outro nicho.",
    scoreLabel: "Nota",
    reasonsLabel: "Motivos",
    noReasons: "Sem motivos identificados.",
    levels: { strong: "Forte", medium: "Média", weak: "Fraca" },
    reasons: {
      noWebsite: "Sem site",
      noOwnWebsite: "Sem site próprio",
      slowSite: "Site lento",
      notMobileFriendly: "Sem versão para telemóvel",
      outdatedSite: "Site antigo",
      fewReviews: "Poucas avaliações (menos de 20)",
      noOpeningHours: "Sem horário publicado",
    },
    observations: {
      responseTime: (seconds: string) =>
        `O site demorou ${seconds} s a responder na nossa verificação.`,
      noViewport: "Não encontrámos indicação de versão para telemóvel.",
      copyright: (year: number) => `A página indica © ${year}.`,
      legacyTech: {
        flash: "A página usa Flash.",
        frameset: "A página usa molduras (frameset).",
        marquee: "A página usa texto em movimento (marquee).",
      },
      noHttps: "O endereço indicado abre sem ligação segura (HTTPS).",
      thirdParty: {
        social: "O endereço indicado é uma página numa rede social.",
        linkPage: "O endereço indicado é uma página de ligações.",
        booking: "O endereço indicado é uma página de reservas de terceiros.",
        parked: "O domínio parece estacionado ou à venda.",
      },
    },
    siteCheck: {
      checking: "A verificar o site…",
      checked: "Site verificado agora.",
      failed: "Não foi possível verificar o site.",
      skipped: "Site não verificado nesta busca.",
      summaryChecking: (count: number) =>
        count === 1 ? "A verificar 1 site…" : `A verificar ${count} sites…`,
      summaryDone: "Verificação dos sites concluída.",
    },
  },
  bot: {
    title: "ScoutKnockBot",
    paragraphs: [
      "O ScoutKnockBot é o verificador automático do ScoutKnock, uma plataforma que ajuda freelancers a encontrar empresas locais que possam precisar dos seus serviços.",
      "Visita a página inicial do site de uma empresa quando ela surge numa busca ou quando um freelancer abre esse contacto. Verifica o tempo de resposta, a indicação de versão para telemóvel, a ligação segura e sinais de antiguidade.",
      "Faz poucos pedidos por site, não envia formulários, não executa o conteúdo da página e não guarda os resultados.",
      "Respeita o robots.txt. Para impedir as visitas, acrescenta ao teu robots.txt: User-agent: ScoutKnockBot e Disallow: /.",
    ],
    contact: (name: string, email: string) =>
      `Para pedires a exclusão do teu domínio, escreve para ${email} e indica o domínio. O responsável é ${name}.`,
  },
  messages: {
    generate: "Gerar mensagem",
    title: (company: string) => `Mensagem para ${company}`,
    writing: "A escrever a mensagem…",
    ready: "Mensagem pronta. Podes editá-la antes de enviar.",
    label: "Mensagem",
    sampleBadge: "Exemplo",
    sampleNotice:
      "Texto de exemplo, escrito por nós a partir de um modelo. Não foi gerado por IA, porque a IA ainda não está ligada.",
    warning:
      "Revê a mensagem antes de enviar. O envio é sempre feito por ti, um contacto de cada vez.",
    checkSiteWarning: "Antes de enviar, abre o site e confirma a observação.",
    channelLabel: "Canal",
    channels: { whatsapp: "WhatsApp", email: "Email" },
    copy: "Copiar",
    copied: "Copiada",
    copyFailed: "Não foi possível copiar. Seleciona o texto e copia à mão.",
    whatsapp: "Abrir no WhatsApp",
    email: "Abrir no email",
    emailSubject: (company: string) => `Uma ideia para ${company}`,
    newVersion: "Gerar outra versão",
    tones: { normal: "Normal", shorter: "Mais curta", formal: "Mais formal" },
    replaceWarning: "Isto substitui o texto que editaste.",
    replaceConfirm: "Substituir",
    replaceCancel: "Manter o meu texto",
    retry: "Tentar outra vez",
    errors: {
      provider: "Algo correu mal. Tenta outra vez dentro de instantes.",
      limit:
        "Chegaste ao limite de 20 mensagens por hoje. Amanhã podes gerar mais.",
      offline: "Sem ligação à internet. Verifica a rede e tenta outra vez.",
      notFound: "Não encontrámos os dados desta empresa.",
      lookupLimit:
        "Chegaste ao limite diário de consultas de empresas. Amanhã podes gerar esta mensagem.",
    },
    sample: {
      noReason: (company: string) =>
        `Encontrei ${company} ao procurar negócios da zona.`,
      reasons: {
        noWebsite: (company: string) =>
          `Ao procurar ${company} online, não encontrei um site.`,
        noOwnWebsite: (company: string) =>
          `Vi que ${company} está online, mas não encontrei um site próprio.`,
        slowSite: (company: string) =>
          `Ao abrir o site de ${company}, reparei que demora um pouco a carregar.`,
        notMobileFriendly: (company: string) =>
          `Ao abrir o site de ${company} no telemóvel, não me pareceu adaptado ao ecrã.`,
        outdatedSite: (company: string) =>
          `O site de ${company} parece ter já alguns anos.`,
        fewReviews: (company: string) =>
          `Vi que ${company} tem ainda poucas avaliações online.`,
        noOpeningHours: (company: string) =>
          `Não encontrei o horário de ${company} publicado online.`,
      },
      followUp: (company: string, sender: string | null) =>
        `Olá de novo! Só para confirmar se receberam a minha mensagem sobre ${company}. Se não for o momento, sem problema: não volto a insistir.${sender ? `\n\n${sender}` : ""}`,
      templates: {
        normal: (_company: string, reason: string, service: string, sender: string | null) =>
          `Olá! ${reason} Faço ${service} para negócios locais e tenho uma ideia simples que talvez vos interesse. Posso enviá-la? Se preferirem não receber mensagens minhas, digam e não volto a escrever.${sender ? `\n\n${sender}` : ""}`,
        shorter: (_company: string, reason: string, service: string, sender: string | null) =>
          `Olá! ${reason} Faço ${service} para negócios locais. Posso mostrar-vos uma ideia rápida? Se não fizer sentido, digam e não volto a escrever.${sender ? `\n\n${sender}` : ""}`,
        formal: (_company: string, reason: string, service: string, sender: string | null) =>
          `Bom dia,\n\nEscrevo-vos porque ${reason.charAt(0).toLowerCase()}${reason.slice(1, -1)}. Trabalho com ${service} para empresas locais e gostaria de vos apresentar uma ideia, sem qualquer compromisso.\n\nTeriam disponibilidade para a receber? Se preferirem não ser contactados, indiquem-no e não voltarei a escrever.\n\nCom os melhores cumprimentos${sender ? `,\n${sender}` : "."}`,
      },
    },
  },
  dashboard: {
    title: "Como está o teu mês",
    loading: "A carregar o painel",
    newSearch: "Nova busca",
    usage: {
      title: "Consumo",
      meter: {
        searches: (used: number, limit: number) => `${used} de ${limit} buscas`,
        demos: (used: number, limit: number) => `${used} de ${limit} sites demo`,
        lookups: (used: number, limit: number) =>
          `${used} de ${limit} aberturas de contacto`,
      },
      lookupsToday: (used: number, limit: number) => `Hoje: ${used} de ${limit}`,
      reached: {
        searches: "Chegaste ao limite de buscas.",
        demos: "Chegaste ao limite de sites demo.",
        lookups: "Chegaste ao limite de aberturas de contacto.",
      },
      seePlans: "Ver os planos",
      seePlansUpgrade: "Ver o pack seguinte",
      renews: (date: string) => `Renova a ${date}.`,
      trialEnds: (date: string) => `O teste grátis acaba a ${date}.`,
      endsOn: (date: string) => `A subscrição acaba a ${date}.`,
    },
    next: {
      title: "Próximo passo",
      subscribe: "Subscreve um pack",
      openContacts: "Abrir os contactos",
      paymentProblem:
        "O último pagamento falhou. Regulariza-o para voltares aos limites do teu pack.",
      limit: (date: string) =>
        `Chegaste ao limite de buscas. Subscreve um pack ou espera pela renovação, a ${date}.`,
      limitUpgrade: (date: string) =>
        `Chegaste ao limite de buscas. Passa para o pack seguinte ou espera pela renovação, a ${date}.`,
      limitWait: (date: string) =>
        `Chegaste ao limite de buscas. Voltas a ter buscas na renovação, a ${date}.`,
      expiringDemo: (name: string, days: number) =>
        days === 0
          ? `A demo de ${name} é apagada hoje.`
          : days === 1
            ? `A demo de ${name} é apagada dentro de 1 dia.`
            : `A demo de ${name} é apagada dentro de ${days} dias.`,
      toContact: (count: number) =>
        count === 1
          ? "Tens 1 contacto por contactar."
          : `Tens ${count} contactos por contactar.`,
      firstSearch: "Faz a tua primeira busca.",
      saveCompany: "Abre uma empresa no Radar e guarda-a nos contactos.",
      newSearch: "Os teus contactos estão em dia. Procura mais empresas.",
    },
    leads: {
      title: "Contactos por estado",
      empty: "Ainda não tens contactos. Guarda uma empresa no Radar para começares.",
    },
    searches: {
      title: "Últimas buscas",
      empty: "Ainda não fizeste nenhuma busca.",
      found: (count: number) => (count === 1 ? "1 empresa" : `${count} empresas`),
      repeat: "Repetir",
      repeatLabel: (niche: string, locality: string) =>
        `Repetir a busca ${niche} em ${locality}`,
      confirmTitle: "Repetir esta busca?",
      confirmBody: (next: number, limit: number) =>
        `Conta como nova busca: ficas com ${next} de ${limit}.`,
      confirm: "Repetir a busca",
      cancel: "Cancelar",
    },
    demos: {
      title: "Sites demo",
      empty: "Ainda não tens sites demo. Abre uma empresa no Radar para criares o primeiro.",
      active: (count: number) => (count === 1 ? "1 ativo" : `${count} ativos`),
      deletedIn: (days: number) =>
        days === 0
          ? "Apagada hoje"
          : days === 1
            ? "Apagada dentro de 1 dia"
            : `Apagada dentro de ${days} dias`,
      noName: "Empresa sem nome",
      open: "Abrir a demo",
      openLabel: (name: string) => `Abrir a demo de ${name}`,
      seeAll: "Ver todos os sites demo",
    },
    subscription: {
      title: "Subscrição",
      none: "Sem pack ativo: tens o limite mais baixo.",
      active: (plan: string) => `Estás no pack ${plan}.`,
      trial: (date: string) => `Estás no teste grátis até ${date}.`,
      ending: (plan: string, date: string) =>
        `Estás no pack ${plan}. A subscrição acaba a ${date}.`,
      paymentProblem: (plan: string) =>
        `O último pagamento do pack ${plan} falhou. Tens o limite mais baixo até ser regularizado.`,
      manage: "Gerir subscrição",
      planLimits: (searches: number, demos: number) =>
        `${searches} buscas e ${demos} sites demo`,
    },
  },
  demos: {
    notice: (author: string, company: string) =>
      `Proposta não oficial. Feita por ${author} para ${company}.`,
    unofficial: "Proposta não oficial",
    expires: (date: string) => `Apagada a ${date}, se não for aceite.`,
    create: "Criar site demo",
    pending: "A criar…",
    empty: "Ainda não tens sites demo. Abre uma empresa no Radar para criares o primeiro.",
    defaultIntro: "Fala connosco. Encontras aqui a nossa morada e o nosso contacto.",
    status: { draft: "Rascunho", sent: "Enviada" },
    official: {
      title: "Site oficial",
      badge: "Oficial",
      publish: "Publicar como oficial",
      unavailable: "A publicação ainda não está disponível, porque os pagamentos não estão ligados.",
      testMode: "Modo de teste",
      dialogBody: (price: number) =>
        `O site passa a estar público, sem o aviso de proposta não oficial e sem data de apagamento, enquanto a subscrição estiver ativa. Custa ${price} € por mês, por site. Podes cancelar quando quiseres.`,
      nameLabel: "Nome no endereço",
      nameHelp: "Letras minúsculas, números e hífens, de 3 a 40 caracteres.",
      confirm: "Confirmo que a empresa aceitou publicar este site e que os dados estão corretos.",
      continue: "Continuar para o pagamento",
      cancelDialog: "Cancelar",
      pending: "Um momento…",
      confirming: "Estamos à espera da confirmação do pagamento. O site só fica oficial depois disso.",
      refresh: "Atualizar",
      paymentProblem: "O último pagamento falhou. O site continua no ar enquanto o Stripe tenta cobrar. Atualiza o pagamento para não sair do ar.",
      updatePayment: "Atualizar pagamento",
      cancel: "Cancelar subscrição do site",
      cancelWarning: (date: string) =>
        `O site continua no ar até ${date}. Depois volta a ser uma demo com o aviso, e é apagado ao fim de 30 dias.`,
      cancelWarningNoDate:
        "O site continua no ar até ao fim do período pago. Depois volta a ser uma demo com o aviso, e é apagado ao fim de 30 dias.",
      cancelConfirm: "Cancelar no fim do período",
      keepShort: "Manter",
      keep: "Manter o site",
      cancelRequested: "Pedido enviado. O estado atualiza quando o Stripe confirmar.",
      endsOn: (date: string) => `A subscrição termina a ${date}. Até lá, o site continua no ar.`,
      ending: "A subscrição termina no fim do período pago.",
      ended: (name: string, date: string) =>
        `O site saiu do ar e voltou a ser uma demo. O nome ${name} fica guardado para ti até ${date}.`,
      removal: "Pedir remoção deste site",
      removalSubject: (company: string) => `Pedido de remoção do site de ${company}`,
      errors: {
        taken: "Este nome já está a ser usado. Escolhe outro.",
        invalid: "Este nome não é válido. Usa letras minúsculas, números e hífens.",
        unavailable: "A publicação ainda não está disponível.",
        error: "Algo correu mal. Tenta outra vez e, se continuar, contacta o suporte.",
      },
    },
    view: {
      call: "Ligar",
      contact: "Contacto",
      address: "Morada",
      phone: "Telefone",
    },
    nameDialog: {
      title: "Como te chamas?",
      body: "O teu nome aparece no aviso da demo, para a empresa saber quem fez a proposta.",
      label: "O teu nome",
    },
    form: {
      title: "Criar site demo",
      body: "A demo mostra o que escreveres aqui. Podes mudar tudo depois.",
      warning:
        "Escreve só dados públicos da empresa que tu próprio confirmaste, por exemplo no site dela ou com um telefonema. Não escrevas dados pessoais.",
      referenceTitle: "Para consulta",
    },
    editor: {
      companyName: "Nome da empresa",
      niche: "Nicho",
      locality: "Localidade",
      address: "Morada",
      phone: "Telefone (opcional)",
      headline: "Título pequeno",
      intro: "Texto de apresentação",
      template: "Modelo",
      templates: { classic: "Clássico", bold: "Forte", soft: "Suave" },
      color: "Cor",
      colors: {
        teal: "Verde-azulado",
        blue: "Azul",
        red: "Vermelho",
        violet: "Violeta",
        terracotta: "Terracota",
      },
      save: "Guardar",
      saving: "A guardar…",
      saved: "Guardado",
      copyLink: "Copiar link",
      linkCopied: "Link copiado",
      linkHint: "O link mostra a última versão guardada.",
      markSent: "Marcar como enviada",
      markDraft: "Voltar a rascunho",
      preview: "Pré-visualização",
    },
    errors: {
      generic: "Algo correu mal. Tenta outra vez e, se continuar, contacta o suporte.",
      limit: "Chegaste ao limite de sites demo deste mês.",
    },
  },
  contacts: {
    empty: "Ainda não tens contactos. Guarda uma empresa no Radar para começares.",
    saveToContacts: "Guardar nos contactos",
    savedToContacts: "Guardado nos contactos",
    saveDialog: {
      title: "Guardar nos contactos",
      body: "Guardamos só o nome que escreveres aqui e as tuas notas. Os dados da empresa são pedidos de novo sempre que abrires o contacto.",
      label: "Nome para este contacto",
      submit: "Guardar",
      cancel: "Cancelar",
    },
    company: {
      title: "Dados públicos",
      loading: "A carregar os dados da empresa…",
      name: "Nome",
      website: "Site",
      noWebsite: "Sem site",
      reviews: "Avaliações",
      hours: "Horário",
      hoursYes: "Publicado",
      hoursNo: "Sem horário publicado",
      limit:
        "Chegaste ao limite diário de consultas de empresas. As tuas notas continuam aqui, e amanhã podes voltar a ver estes dados.",
      unavailable:
        "Não foi possível carregar os dados da empresa. As tuas notas continuam aqui.",
    },
    changeStatus: "Mudar estado",
    save: "Guardar",
    saving: "A guardar…",
    saved: "Guardado",
    remove: "Remover contacto",
    followUp: {
      generate: "Gerar seguimento",
      view: "Ver seguimento",
      pending: "A preparar…",
      availableIn: (days: number) =>
        days === 1
          ? "O seguimento fica disponível daqui a 1 dia."
          : `O seguimento fica disponível daqui a ${days} dias.`,
      title: (name: string) => `Seguimento para ${name}`,
      once: "Só há um seguimento por empresa. Se não responderem, não voltes a insistir.",
      label: "Mensagem de seguimento",
      error: "Não foi possível preparar o seguimento. Tenta outra vez.",
    },
    removeWarning: "Isto apaga o contacto e as tuas notas. Não dá para desfazer.",
    removeConfirm: "Remover",
    removeCancel: "Cancelar",
    views: { board: "Quadro", table: "Tabela" },
    filter: {
      showing: (status: string) => `A mostrar: ${status}`,
      clear: "Ver todos os contactos",
      empty: "Nenhum contacto neste estado.",
    },
    statuses: {
      to_contact: "Por contactar",
      contacted: "Contactado",
      replied: "Respondeu",
      proposal: "Proposta",
      won: "Ganho",
      lost: "Perdido",
    },
    table: {
      search: "Pesquisar contactos",
      noMatches: "Nenhum contacto com esta pesquisa.",
      company: "Contacto",
      status: "Estado",
      nextAction: "Próxima ação",
    },
    details: {
      address: "Morada",
      phone: "Telefone",
      lastContact: "Último contacto",
      noContactYet: "Ainda não houve contacto",
      label: "Nome para este contacto",
      confirmedContact: "Contacto que confirmaste",
      nextAction: "Próxima ação",
      date: "Data",
      notes: "Notas",
    },
    errors: {
      generic: "Algo correu mal. Tenta outra vez e, se continuar, contacta o suporte.",
    },
  },
  plans: {
    title: "Planos",
    names: { starter: "Inicial", pro: "Pro", agency: "Agência" },
    recommended: "Recomendado",
    priceSoon: "Preço a anunciar",
    searches: "buscas por mês",
    demos: "sites demo por mês",
    lookups: (daily: number) =>
      `aberturas de contacto por mês (até ${daily} por dia)`,
    trial: "Teste grátis de 7 dias: em breve.",
    trialTerms:
      "O teste grátis dura 7 dias, com 10 buscas e 2 sites demo, e não pede cartão. Se não adicionares um cartão até ao fim, a subscrição cancela sozinha e não pagas nada. Cada conta tem um só teste.",
    testMode: "Modo de teste: nenhum pagamento é real",
    perMonth: (price: string) => `${price} por mês`,
    startTrial: "Começar teste grátis de 7 dias",
    subscribe: "Subscrever",
    manage: "Gerir subscrição",
    pending: "Um momento…",
    current: "O teu pack",
    usageLabel: "Utilização deste mês",
    onLowest: "Sem pack ativo: tens o limite mais baixo.",
    onPlan: (plan: string) => `Estás no pack ${plan}.`,
    onTrial: (date: string) => `Estás no teste grátis até ${date}.`,
    cancelling: "A subscrição termina no fim do período pago.",
    usage: (searches: number, searchLimit: number, demos: number, demoLimit: number) =>
      `Este mês: ${searches} de ${searchLimit} buscas e ${demos} de ${demoLimit} sites demo.`,
    paymentProblem:
      "O último pagamento falhou. Tens o limite mais baixo até o pagamento ser regularizado em Gerir subscrição.",
    checkoutSuccess: "Obrigado. O teu pack fica ativo dentro de instantes.",
    checkoutError: "Não foi possível abrir o pagamento. Tenta outra vez dentro de instantes.",
  },
  account: {
    theme: "Tema",
    themes: { dark: "Escuro", light: "Claro" },
    name: "O teu nome",
    save: "Guardar",
    saving: "Um momento…",
    saved: "Guardado",
    passwordEmail: "Enviar email para mudar a palavra-passe",
    passwordEmailSent: "Enviámos-te um email com o link.",
    deleteTitle: "Apagar conta",
    deleteWarning:
      "Isto apaga a tua conta, os teus contactos e as tuas demos, e os teus sites oficiais saem do ar. Não dá para desfazer.",
    deleteConfirm: "Escreve APAGAR para confirmar",
    errors: {
      generic: "Algo correu mal. Tenta outra vez e, se continuar, contacta o suporte.",
    },
  },
  system: {
    notFound: "Nada no radar por aqui.",
    home: "Voltar ao início",
    error: "Algo correu mal. Tenta outra vez e, se continuar, contacta o suporte.",
    retry: "Tentar outra vez",
  },
  app: {
    nav: {
      label: "Menu do painel",
      home: "Início",
      homeLogo: "ScoutKnock, ir para o início do painel",
      radar: "Radar",
      demos: "Sites demo",
      contacts: "Contactos",
      collapse: "Recolher menu",
      expand: "Expandir menu",
    },
    account: {
      label: "Conta",
      plans: "Planos",
      viewSite: "Ver o site",
      signOut: "Sair",
    },
    commands: {
      label: "Paleta de comandos",
      trigger: "Comandos",
      placeholder: "Escreve um comando…",
      empty: "Nenhum comando encontrado.",
      newSearch: "Nova busca",
      goHome: "Ir para o início",
      goRadar: "Ir para o Radar",
      goDemos: "Ir para os sites demo",
      goContacts: "Ir para os contactos",
      goPlans: "Ir para os planos",
      goAccount: "Ir para a conta",
      toggleTheme: "Mudar tema",
    },
  },
};
