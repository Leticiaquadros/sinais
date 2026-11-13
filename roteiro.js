/*
  ============================================================
  SINAIS — ROTEIRO DO JOGO
  ============================================================
  Todo o texto do jogo está neste arquivo. Para mudar uma fala,
  uma frase de efeito ou um horário, edite aqui e recarregue a
  página (F5). Não precisa mexer em mais nada.

  Cuidados ao editar:
  - Cada texto fica entre aspas "assim". Se precisar de aspas
    dentro do texto, use “aspas curvas” ou 'simples'.
  - Não apague as vírgulas no fim das linhas.
  - **texto entre dois asteriscos** aparece destacado no final.

  Quem fala (campo "de"):
    "vitima"   -> mensagem enviada (lado direito)
    "agressor" -> mensagem recebida de "Amor"
    "mae"      -> mensagem recebida da Mãe

  SINAIS (a mecânica do jogo):
    Uma mensagem com  sinal: "Nome do sinal", violencia: "psicológica"
    pode ser marcada pelo jogador. Tipos (Lei Maria da Penha):
    "física", "psicológica", "sexual", "patrimonial", "moral".
    Para tirar uma mensagem da caça aos sinais, apague "sinal" e "violencia".
    (Os nomes dos sinais são PROVISÓRIOS: revisar.)

  Status do celular (canto da tela):
    som:  "normal" | "silencioso" | "naoPerturbe"
    wifi: 3 = completo, 2 = dois riscos, 1 = um risco, 0 = sem Wi-Fi
    rede: "5G", "4G" ou ""     sinal: 0 a 4 barrinhas
    bateria: 0 a 100           carregando: true/false

  Tema do celular: automático pela hora da cena
    (06:00 até 17:59 = claro / 18:00 até 05:59 = escuro).
  ============================================================
*/

window.ROTEIRO = {

  config: {
    titulo: "SINAIS",
    subtitulo: "PROJETO VI",
    // 1 = normal. 1.3 = mais rápido. 0.8 = mais devagar.
    velocidade: 1,
    // Segundos que o alerta vermelho fica na tela (roteiro: 10).
    tempoAlertaVermelho: 10,
    // Créditos opcionais na tela final (ex.: "Fulana, Ciclana e Beltrana").
    creditos: ""
  },

  // ----------------------------------------------------------
  // ABERTURA DO JOGO
  // ----------------------------------------------------------
  abertura: {
    titulo: "ALERTA DE CONTEÚDO SENSÍVEL!",
    texto: "Se você passa por situações semelhantes, fale com alguém e ligue para os canais de ajuda.",
    botao: "Entendi, continuar"
  },

  canais: [
    {
      titulo: "LIGUE 180",
      texto: "Central de Atendimento à Mulher: atendimento especializado, sigilo garantido e disponível 24 horas."
    },
    {
      titulo: "LIGUE 190",
      texto: "Polícia Militar: em situação de perigo imediato, ligue agora. Não espere outros episódios."
    },
    {
      titulo: "CASA ENEDINA MARQUES",
      texto: "Acolhimento às mulheres em situação de violência, defesa popular, oficinas culturais e debates. Disponível 24h.",
      endereco: "Endereço: Rua Padre Antônio, 33, bairro Alto da Glória, Curitiba/PR"
    },
    {
      titulo: "CASA DA MULHER BRASILEIRA DE CURITIBA",
      texto: "Centro de atendimento aberto 24h que oferece serviços de acolhimento, proteção, segurança e assistência jurídica para mulheres em situação de violência.",
      endereco: "Endereço: Av. Paraná, nº 870 – Bairro Cabral, Curitiba",
      telefones: "Telefones: (41) 3221-2701 / (41) 3221-2710"
    }
  ],

  // Explicação mostrada antes da primeira cena
  tutorial: {
    titulo: "COMO JOGAR",
    linhas: [
      "Você vai acompanhar, pelo celular, as conversas de uma mulher com o namorado.",
      "Toque nas mensagens que mostram SINAIS de violência.",
      "Alguns são claros. Outros parecem cuidado, ciúme ou amor.",
      "No fim de cada conversa, você vê os sinais que reconheceu e os que deixou passar."
    ],
    botao: "Começar"
  },

  // Partes do jogo (cor e quantas barrinhas de sinal aparecem)
  partes: [
    { numero: "PARTE 1", nome: "Sinal amarelo",  cor: "#f5b700", barras: 2 },
    { numero: "PARTE 2", nome: "Sinal laranja",  cor: "#ff7a1a", barras: 3 },
    { numero: "PARTE 3", nome: "Sinal vermelho", cor: "#ff2a36", barras: 4 }
  ],

  // Tipos de violência — Lei Maria da Penha (Lei nº 11.340/2006), art. 7º
  tiposViolencia: {
    "psicológica": "Controlar ações, comportamentos e decisões; ameaçar, humilhar, manipular, isolar, vigiar, perseguir, chantagear ou limitar o direito de ir e vir.",
    "física": "Qualquer conduta que ofenda a integridade ou a saúde do corpo: empurrar, bater, apertar, enforcar.",
    "sexual": "Forçar ou constranger a presenciar, manter ou participar de relação sexual não desejada, por intimidação, ameaça, coação ou força.",
    "moral": "Calúnia, difamação ou injúria: xingar, ofender, atacar a honra.",
    "patrimonial": "Reter, tirar ou destruir objetos, documentos, bens ou valores."
  },
  fonteTipos: "Tipos de violência segundo a Lei Maria da Penha (Lei nº 11.340/2006), art. 7º.",

  // ----------------------------------------------------------
  // CENAS
  // "frase" = frase de efeito mostrada DEPOIS da cena.
  // "fraseAntes" = frase mostrada ANTES da cena.
  // (As frases de efeito abaixo são PROVISÓRIAS: troque à vontade.)
  // ----------------------------------------------------------
  cenas: [

    // ================= CENA 1 =================
    {
      id: 1, parte: 1,
      titulo: "Roupa", subtitulo: "“Vai assim?”",
      contato: "Amor",
      status: { hora: "15:30", som: "normal", wifi: 3, rede: "", sinal: 4, bateria: 78, carregando: false },
      passos: [
        { de: "vitima",   hora: "15:30", texto: "Oi, amor." },
        // Mini-interação: tirar a foto da roupa e mandar como visualização única
        { de: "vitima",   hora: "15:30", tipo: "fotoUnica", camera: "roupa" },
        { de: "agressor", hora: "15:30", texto: "Onde você pensa que vai vestida assim?",
          sinal: "Controle da roupa", violencia: "psicológica" },
        { de: "vitima",   hora: "15:30", texto: "Estou indo ao mercado." },
        { de: "agressor", hora: "15:30", texto: "Não acha melhor trocar de roupa?",
          sinal: "Pressão disfarçada de conselho", violencia: "psicológica" },
        { escolha: [
          { texto: "Vou me trocar, então." },
          { texto: "Não vejo problema em ir assim. Só estou indo ao mercado." }
        ]}
      ],
      frase: "Começa com um comentário sobre a roupa. Parece pouco. Não é."
    },

    // ================= CENA 2 =================
    {
      id: 2, parte: 1,
      titulo: "Instagram", subtitulo: "“Quem te seguiu?”",
      contato: "Amor",
      status: { hora: "20:30", som: "naoPerturbe", wifi: 3, rede: "", sinal: 4, bateria: 32, carregando: true },
      passos: [
        { de: "agressor", hora: "20:30", texto: "Entrei no seu perfil no Insta.",
          sinal: "Vigiar as redes sociais", violencia: "psicológica" },
        { de: "agressor", hora: "20:30", texto: "Quem é esse?",
          sinal: "Ciúme possessivo", violencia: "psicológica" },
        // Mini-interação: abrir a foto de visualização única
        { de: "agressor", hora: "20:30", tipo: "fotoUnica", abrir: true },
        { de: "vitima",   hora: "20:30", texto: "Oi, vida." },
        { de: "vitima",   hora: "20:30", texto: "Não tenho ideia." },
        { de: "agressor", hora: "20:30", texto: "Como assim não tem ideia?" },
        { de: "agressor", hora: "20:30", texto: "Está querendo esconder de mim por quê?",
          sinal: "Acusação sem motivo", violencia: "psicológica" },
        { escolha: [
          { texto: "Não estou escondendo nada. Não sei mesmo quem é." },
          { texto: "Posso removê-lo dos seguidores, mas não sei quem é." }
        ]}
      ],
      frase: "Ciúme não é prova de amor. É sinal de controle."
    },

    // ================= CENA 3 =================
    {
      id: 3, parte: 1,
      titulo: "Horário", subtitulo: "“Por que você ainda não chegou?”",
      contato: "Amor",
      status: { hora: "18:15", som: "normal", wifi: 0, rede: "5G", sinal: 4, bateria: 20, carregando: false },
      passos: [
        { de: "agressor", hora: "18:15", texto: "Onde você está?" },
        { de: "agressor", hora: "18:15", texto: "Por que ainda não chegou em casa?",
          sinal: "Controle do horário", violencia: "psicológica" },
        { hora: "18:30", aviso: "18:30" },
        { de: "agressor", hora: "18:30", texto: "???????" },
        { de: "agressor", hora: "18:30", texto: "PORRA!",
          sinal: "Explosão de raiva", violencia: "psicológica" },
        { de: "agressor", hora: "18:30", texto: "CADÊ VOCÊ?????" },
        { de: "vitima",   hora: "18:30", texto: "O ônibus está atrasado, vida." },
        { de: "vitima",   hora: "18:30", texto: "Desculpa pela demora." },
        { de: "agressor", hora: "18:30", texto: "Se você não chegar em 20 minutos, a gente vai ter um problema.",
          sinal: "Ameaça velada", violencia: "psicológica" },
        // Mini-interação: o relógio dos 20 minutos corre enquanto ela decide
        { cronometro: 20 },
        { escolha: [
          {
            texto: "Por quê, meu bem? Eu não fiz nada.",
            pensamento: "Ele está preocupado. Ele é muito cuidadoso. Acho que ele me ama mesmo. Tomara que eu chegue logo."
          },
          {
            texto: "Eu não tenho culpa pelo atraso, mas acho que chego a tempo.",
            pensamento: "Será que ele não está exagerando? Isso é normal em um relacionamento? Acho que ele está sendo protetor demais… Não estou me sentindo confortável."
          }
        ]}
      ],
      frase: "Preocupação não vem acompanhada de ameaça."
    },

    // ================= CENA 4 =================
    // (O roteiro não define o status do celular desta cena: valores sugeridos.)
    {
      id: 4, parte: 2,
      titulo: "Almoço com a mãe",
      contato: "Amor",
      status: { hora: "11:00", som: "normal", wifi: 3, rede: "", sinal: 4, bateria: 65, carregando: false },
      passos: [
        { de: "vitima",   hora: "11:00", texto: "Amor, minha mãe chamou a gente para almoçar com a minha família. Vamos?" },
        { de: "agressor", hora: "11:01", texto: "Não gosto da sua família. Melhor ficarmos em casa. Senão, vou deixar outro soco na parede.",
          sinal: "Isolar da família e intimidar", violencia: "psicológica" },
        { escolha: [
          {
            texto: "Vou de qualquer forma. Estou com saudades deles.",
            resposta: { texto: "Mais tarde a gente conversa, porque você não pode ir a nenhum lugar sem mim.",
                        sinal: "Limitar a liberdade", violencia: "psicológica" }
          },
          {
            texto: "Ok, amor. Vou te respeitar.",
            resposta: { texto: "Melhor mesmo! Vai para a cozinha fazer algo, então.",
                        sinal: "Humilhação", violencia: "psicológica" }
          }
        ]}
      ],
      frase: "Afastar você de quem te ama é isolamento, não amor."
    },

    // ================= CENA 5 =================
    // (O roteiro não define o status do celular desta cena: valores sugeridos.)
    {
      id: 5, parte: 2,
      titulo: "Academia",
      contato: "Amor",
      status: { hora: "08:00", som: "normal", wifi: 3, rede: "", sinal: 4, bateria: 87, carregando: false },
      passos: [
        // Mini-interação: procurar a chave pela casa antes de escrever
        { procurarChave: true },
        { de: "vitima",   hora: "08:00", texto: "Amor, onde está a chave de casa? Estou trancada e preciso ir para a academia." },
        { de: "agressor", hora: "08:01", texto: "Está comigo. Você não vai sair hoje.",
          sinal: "Trancar em casa", violencia: "psicológica" },
        { escolha: [
          {
            texto: "Você já me machucou ontem. Meu braço está roxo. Quero sair de casa.",
            sinal: "Agressão física", violencia: "física",
            resposta: { texto: "Fiz e faria de novo. Não vou me arrepender.",
                        sinal: "Agressão sem arrependimento", violencia: "física" }
          },
          {
            texto: "Você já me machucou ontem. Meu braço está roxo. Vou ficar em casa mesmo, então.",
            sinal: "Agressão física", violencia: "física",
            resposta: { texto: "Acho melhor você não ir contra o que estou falando, senão vai ter consequências.",
                        sinal: "Ameaça", violencia: "psicológica" }
          }
        ]}
      ],
      frase: "Ninguém tranca quem ama. Trancar é violência."
    },

    // ================= CENA 6 =================
    // (O roteiro não define o status do celular desta cena: valores sugeridos.)
    {
      id: 6, parte: 2,
      titulo: "Tentar levá-la embora",
      contato: "Amor",
      status: { hora: "22:30", som: "normal", wifi: 0, rede: "5G", sinal: 3, bateria: 15, carregando: false },
      passos: [
        { de: "vitima",   hora: "22:30", texto: "Não acredito que você me deixou sozinha aqui. Você me puxou pelo braço, me empurrou e eu bati a cabeça no chão.",
          sinal: "Agressão física", violencia: "física" },
        { de: "agressor", hora: "22:32", texto: "Você não merece menos que isso. Você olhou para o homem ao lado.",
          sinal: "Culpar a vítima", violencia: "psicológica" },
        { aviso: "Passaram-se alguns minutos." },
        { de: "agressor", hora: "23:00", texto: "Estou voltando para te buscar agora." },
        { de: "agressor", hora: "23:00", tipo: "fotoFlores",
          sinal: "Flores depois da agressão (ciclo da violência)", violencia: "psicológica" },
        { escolha: [
          {
            acao: "Aceitar as flores",
            texto: "Lindas! Vamos para casa.",
            resposta: { texto: "Te amo. Só faço isso para te proteger.",
                        sinal: "Justificar a violência como cuidado", violencia: "psicológica" },
            pensamento: "Ele faz tudo para me proteger. Ele me ama e é carinhoso. Acho que ele só estava nervoso."
          },
          {
            acao: "Não aceitar as flores",
            texto: "Eu vou para o hospital sozinha. Não quero suas flores.",
            pensamento: "Estou cansada. Acho que ele passou dos limites. Acho que preciso conversar sobre isso com alguém."
          }
        ]}
      ],
      frase: "Flores depois da agressão não apagam a agressão."
    },

    // ================= CENA 7 =================
    {
      id: 7, parte: 3,
      titulo: "Noite das meninas", subtitulo: "Perseguição",
      contato: "Amor",
      status: { hora: "20:54", som: "normal", wifi: 2, rede: "5G", sinal: 4, bateria: 51, carregando: false },
      passos: [
        { de: "agressor", hora: "20:54", texto: "Onde você está?" },
        { de: "agressor", hora: "20:54", texto: "Já são quase 9 da noite e você está na rua. Virou puta?",
          sinal: "Xingamento", violencia: "moral" },
        { de: "vitima",   hora: "20:56", texto: "Estou na casa da Nat. A gente ainda está jantando." },
        { de: "agressor", hora: "20:56", texto: "Deixei você ir porque pensei que tinha noção de horário.",
          sinal: "Exigir permissão para sair", violencia: "psicológica" },
        { de: "vitima",   hora: "21:00", texto: "Ah, amor, ainda está cedo. As meninas chegaram agora há pouco." },
        { de: "agressor", hora: "21:01", texto: "Demorou para responder por quê, porra?",
          sinal: "Cobrança e agressividade", violencia: "psicológica" },
        { de: "agressor", hora: "21:01", texto: "Estou indo te buscar." },
        { de: "vitima",   hora: "21:01", texto: "Não, a gente está só conversando. Só estão as meninas. Não precisa disso." },
        { de: "agressor", hora: "21:03", texto: "Como vou saber se você está falando a verdade?" },
        { de: "agressor", hora: "21:03", texto: "Estou com a sua localização. Estou indo te buscar.",
          sinal: "Monitorar a localização", violencia: "psicológica" },
        // Mini-interação: a localização dele se aproximando (0 = longe, 1 = chegou)
        { aoVivo: 0.1 },
        { de: "agressor", hora: "21:05", texto: "Entendeu?" },
        { aoVivo: 0.4 },
        { de: "vitima",   hora: "21:08", texto: "Por que você está falando assim?" },
        { aoVivo: 0.75 },
        { de: "agressor", hora: "21:10", texto: "Estou chegando. Já desce." },
        { aoVivo: 0.97 },
        { de: "agressor", hora: "21:10", texto: "Em casa a gente conversa.",
          sinal: "Ameaça velada", violencia: "psicológica" },
        { escolha: [
          { texto: "Tá, estou descendo." },
          {
            texto: "Vou ficar mais um pouco. Deixa, por favor.",
            resposta: { texto: "O caralho! Desce logo, estou mandando.",
                        sinal: "Ordem e intimidação", violencia: "psicológica" }
          }
        ]}
      ],
      frase: "Monitorar sua localização não é proteção. É vigilância."
    },

    // ================= CENA 8 =================
    {
      id: 8, parte: 3,
      titulo: "Enforcamento",
      contato: "Amor",
      status: { hora: "09:12", som: "silencioso", wifi: 3, rede: "5G", sinal: 4, bateria: 98, carregando: false },
      passos: [
        { de: "vitima",   hora: "09:12", texto: "Não gostei do que você fez ontem, amor." },
        { de: "agressor", hora: "09:12", texto: "O quê, meu bem?" },
        { de: "vitima",   hora: "09:12", texto: "O fato de você ter me enforcado, mesmo depois de eu ter pedido várias vezes para você parar.",
          sinal: "Violência durante o sexo", violencia: "sexual" },
        { de: "agressor", hora: "09:12", texto: "Caralho, como você é fresca! Você serve para me dar prazer.",
          sinal: "Tratar como objeto", violencia: "sexual" },
        { de: "agressor", hora: "09:12", texto: "E, se para mim está bom, para você também está.",
          sinal: "Ignorar o consentimento", violencia: "sexual" },
        { de: "agressor", hora: "09:12", texto: "Ficou claro ou você quer que eu desenhe?",
          sinal: "Humilhação", violencia: "psicológica" },
        { escolha: [
          {
            texto: "Só estou pedindo para você não fazer mais isso. Você me machucou de verdade.",
            resposta: { texto: "Se não parar de encher a porra do saco, vou te machucar mais.",
                        sinal: "Ameaça de agressão", violencia: "psicológica" }
          },
          {
            texto: "Então tá bom.",
            resposta: { texto: "Que bom que você obedece.",
                        sinal: "Exigir obediência", violencia: "psicológica" }
          }
        ]}
      ],
      frase: "Sem consentimento é violência. Também dentro de um relacionamento."
    },

    // ================= CENA 9 — Parte 1: convite para o restaurante =================
    {
      id: 9, parte: 3,
      titulo: "Restaurante", subtitulo: "Banheiro · Mãe · Denúncia",
      contato: "Amor",
      status: { hora: "10:37", som: "silencioso", wifi: 3, rede: "5G", sinal: 4, bateria: 90, carregando: false },
      passos: [
        { de: "agressor", hora: "10:37", texto: "Gatinha, vamos jantar esta noite em um restaurante legal." },
        { de: "agressor", hora: "10:37", texto: "Coloca uma roupa decente hoje.",
          sinal: "Controle da roupa", violencia: "psicológica" },
        { de: "vitima",   hora: "10:37", texto: "Sério? Onde vamos?" },
        { de: "vitima",   hora: "10:37", texto: "Não estava muito a fim de sair hoje." },
        { de: "agressor", hora: "10:37", texto: "Pô, só queria fazer uma coisa legal com você, e você fica me tratando igual a uma merda.",
          sinal: "Chantagem emocional", violencia: "psicológica" },
        { de: "agressor", hora: "10:37", texto: "A gente vai porque eu quero.",
          sinal: "Impor a própria vontade", violencia: "psicológica" },
        { de: "vitima",   hora: "10:37", texto: "Tá bom, amor. Vamos, sim. Vai ser legal." }
      ]
    },

    // ================= CENA 9 — Parte 2: pedido de ajuda =================
    {
      id: 9.2, parte: 3,
      mostrarCartao: false,
      fraseAntes: "Naquela noite, no restaurante…",
      contato: "Mãe",
      // Abre primeiro a lista de conversas: o jogador toca em "Mãe".
      abertura: "lista",
      status: { hora: "20:39", som: "silencioso", wifi: 0, rede: "5G", sinal: 4, bateria: 24, carregando: false },
      passos: [
        { de: "vitima", hora: "20:39", texto: "Mãe, preciso de ajuda.", aguardarEnvio: true },
        { de: "vitima", hora: "20:39", texto: "Não aguento mais essas agressões." },
        { de: "vitima", hora: "20:40", texto: "Ele cismou que estou dando em cima do garçom.",
          sinal: "Ciúme possessivo", violencia: "psicológica" },
        { de: "vitima", hora: "20:40", texto: "Começou a gritar comigo e me deu um tapa no meio do restaurante.",
          sinal: "Agressão física em público", violencia: "física" },
        { de: "mae",    hora: "20:40", texto: "Filha, onde você está?" },
        { de: "mae",    hora: "20:40", texto: "Está segura?" },
        { de: "vitima", hora: "20:41", texto: "Vim para o banheiro." },
        { de: "vitima", hora: "20:41", texto: "Estou com muita vergonha." },
        { de: "mae",    hora: "20:42", texto: "Você não tem culpa de nada, minha filha." },
        { de: "mae",    hora: "20:42", texto: "O problema é ele. Você não fez nada de errado." },
        { de: "vitima", hora: "20:43", texto: "Ele ameaçou me matar. Acho que desta vez é sério.",
          sinal: "Ameaça de morte", violencia: "psicológica" },
        { de: "mae",    hora: "20:43", texto: "Como assim???" },
        { de: "mae",    hora: "20:43", texto: "Me manda sua localização, que vou te buscar. Liga para a polícia!" },
        { de: "mae",    hora: "20:44", texto: "Fica no banheiro. Não volta lá." },
        // Roteiro: "Vítima (20:45): Manda localização." -> o jogador envia pelo "+"
        { de: "vitima", hora: "20:45", tipo: "localizacao", anexo: true },
        { de: "vitima", hora: "20:45", texto: "Estou com muito medo de ele vir aqui." },
        { de: "mae",    hora: "20:46", texto: "Já estou indo. Ligou para a polícia?" },
        // Parte 3 — Ligação de emergência: o jogador disca 1-9-0
        { ligar190: true }
      ]
    }
  ],

  // Lista de conversas que aparece na cena 9 (parte 2)
  listaConversas: [
    { nome: "Mãe",  previa: "Beijo, filha. Te amo.", hora: "ontem", destaque: true },
    { nome: "Amor", previa: "Você: Tá bom, amor. Vamos, sim. Vai ser legal.", hora: "10:37" },
    { nome: "Nat",  previa: "Amiga, você chegou bem?", hora: "sábado" }
  ],
  dicaLista: "Toque na conversa com a Mãe",

  // Textos das mini-interações
  interacoes: {
    roupa: { titulo: "CÂMERA", dica: "Tire uma foto da roupa para mandar", enviada: "Visualização única ativada" },
    fotoDele: {
      dica: "Toque para abrir",
      usuario: "lucas.m",
      texto: "começou a seguir você",
      tempo: "2 h"
    },
    chave: {
      titulo: "CÂMERA",
      dica: "Procure a chave de casa",
      lugares: {
        gancho: "O gancho da chave está vazio.",
        mesa: "Na fruteira, só moedas.",
        gaveta: "Nas gavetas, nada.",
        porta: "Trancada. Não abre."
      },
      fim: "A chave não está em casa."
    },
    cronometro: "para chegar em casa",
    aoVivo: { texto: "Amor está compartilhando a localização em tempo real", distanciaKm: 2.6 },
    anexo: { opcao: "Localização atual", dica: "Toque no + para enviar sua localização" },
    ligar: { botao: "Ligar para a polícia", dica: "Disque 190" }
  },

  // ----------------------------------------------------------
  // LIGAÇÃO DE EMERGÊNCIA E ALERTA EM VERMELHO
  // ----------------------------------------------------------
  ligacao: {
    numero: "190",
    nome: "Polícia Militar",
    status: "Ligando…"
  },

  alertaVermelho: {
    numero: "848",
    texto: "Os dados do Sistema Nacional de Informações de Segurança Pública (Sinesp), consolidados pela Secretaria Nacional de Segurança Pública (Senasp), apontam que, entre janeiro e julho de 2026, 848 mulheres foram vítimas de feminicídio no Brasil."
  },

  // ----------------------------------------------------------
  // MENSAGEM FINAL (um parágrafo por tela)
  // ----------------------------------------------------------
  final: {
    paragrafos: [
      "O feminicídio não começa no momento em que uma mulher é assassinada. Antes dele, muitas vezes, existem sinais que foram tratados como ciúme, cuidado ou amor: a roupa questionada, as amizades proibidas, a localização monitorada, o medo de contrariar, as ameaças e a violência que se repete acompanhada de pedidos de perdão.",
      "Nenhuma mulher deveria precisar diminuir a própria voz, abandonar quem ama ou abrir mão da liberdade para permanecer viva em um relacionamento. **O controle não é cuidado. A ameaça não é amor. A violência nunca é culpa da vítima.**",
      "Conscientizar sobre o feminicídio é aprender a reconhecer esses sinais, romper o silêncio e entender que a prevenção precisa começar antes da morte. É acolher sem julgar, ouvir sem duvidar e agir diante da violência. É responsabilizar quem agride, fortalecer as redes de apoio e garantir que nenhuma mulher precise enfrentar o medo sozinha.",
      "Não podemos esperar que uma mulher se torne mais uma estatística para reconhecer que sua vida estava em risco. **Cada ameaça merece atenção. Cada agressão exige uma resposta. Cada mulher tem o direito de existir sem medo.**"
    ],
    ultimaFrase: "Mulheres não precisam de mais motivos para sobreviver. Precisam ter o direito de viver.",
    relatorio: "VOCÊ RECONHECEU",
    fim: "FIM DO JOGO"
  }
};
