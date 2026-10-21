// Configuração dos quatro módulos. Nome, rota, textos e o checklist do que
// já existe e do que falta ficam aqui, para a navegação e as telas
// "em construção" nunca divergirem do estado real do projeto.

export type ModuleId = 'santuario' | 'oraculo' | 'alimentar' | 'correio' | 'fazenda'

export type ModuleStatus = 'prototipo' | 'pronto' | 'em-construcao'

export interface ModuleFeature {
  label: string
  done: boolean
}

export interface ModuleInfo {
  id: ModuleId
  number: 1 | 2 | 3 | 4 | 5
  path: string
  name: string
  shortName: string
  jp: string
  tagline: string
  status: ModuleStatus
  /** Fala do pombo na tela de "em construção". */
  wipLine: string
  features: ModuleFeature[]
}

export const MODULES: ModuleInfo[] = [
  {
    id: 'santuario',
    number: 1,
    path: '/',
    name: 'Santuário da Grande Pru',
    shortName: 'Santuário',
    jp: '神社',
    tagline: 'O portão de entrada do mundo da Pru.',
    status: 'prototipo',
    wipLine: '',
    features: [
      { label: 'Jardim japonês com portão torii', done: true },
      { label: 'Pombo guardião com mensagens engraçadas', done: true },
      { label: 'Animação de entrada no santuário', done: true },
      { label: 'Navegação para as outras três experiências', done: true },
    ],
  },
  {
    id: 'oraculo',
    number: 2,
    path: '/oraculo',
    name: 'Oráculo dos Pombos',
    shortName: 'Oráculo',
    jp: 'おみくじ',
    tagline: 'Tire um omikuji e descubra o que os pombos preveem.',
    status: 'pronto',
    wipLine: 'Os pombos videntes ainda estão alongando o pescoço. Volte em breve!',
    features: [
      { label: 'Sorteio de mensagens aleatórias', done: true },
      { label: 'Apresentação no estilo omikuji', done: true },
      { label: 'Animação durante a revelação', done: true },
      { label: 'Mensagens românticas, bobas e imprevisíveis (Coleção 01, 30 previsões)', done: true },
      { label: 'Sem repetir a previsão anterior', done: true },
    ],
  },
  {
    id: 'alimentar',
    number: 3,
    path: '/alimentar',
    name: 'Alimente o Pombo',
    shortName: 'Alimentar',
    jp: 'えさやり',
    tagline: 'Jogue grãos, faça amigos, cause uma invasão.',
    status: 'prototipo',
    wipLine: 'O milho ainda está no correio. Os pombos estão esperando, impacientes.',
    features: [
      { label: 'Distribuição de grãos', done: true },
      { label: 'Animação de alimentação', done: true },
      { label: 'Contador de grãos', done: true },
      { label: 'Pombos novos surgindo aos poucos', done: true },
      { label: 'Evento especial: invasão dos pombos', done: true },
      { label: 'Botão para recomeçar', done: true },
    ],
  },
  {
    id: 'correio',
    number: 4,
    path: '/correio',
    name: 'Correio Pombo do Amor',
    shortName: 'Correio',
    jp: '恋の郵便',
    tagline: 'Cartas fofas entregues por um pombo muito profissional.',
    status: 'pronto',
    wipLine: 'O pombo-carteiro está passando o uniforme. As cartas chegam logo.',
    features: [
      { label: 'Pombo-carteiro animado', done: true },
      { label: 'Cartas com mensagens personalizadas', done: true },
      { label: 'Abertura interativa de envelopes', done: true },
      { label: 'Categorias de mensagens', done: true },
      { label: 'Pequenas surpresas românticas', done: true },
    ],
  },
  {
    id: 'fazenda',
    number: 5,
    path: '/fazenda',
    name: 'Fazendinha da Pru',
    shortName: 'Fazenda',
    jp: '畑',
    tagline: 'Plante, espere e colha comidinhas para os pombos.',
    status: 'prototipo',
    wipLine: '',
    features: [
      { label: 'Quatro canteiros para plantar', done: true },
      { label: 'Crescimento pelo horário real (continua com o site fechado)', done: true },
      { label: 'Colheita e estoque de alimentos e sementes', done: true },
      { label: 'Saquinho grátis de sementes', done: true },
      { label: 'Tutorial da primeira visita', done: true },
      { label: 'Gastar alimentos nos outros módulos', done: false },
    ],
  },
]

export function getModule(id: ModuleId): ModuleInfo {
  const mod = MODULES.find((m) => m.id === id)
  if (!mod) throw new Error(`Módulo desconhecido: ${id}`)
  return mod
}
