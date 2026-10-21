// Módulo 4 — Correio Pombo do Amor. Coleção 01.
// LOVE_LETTERS e LETTER_UNLOCK_RULES estão exatamente como entregues pelo
// dono do projeto. O resto (dicas e rodapés) é texto de interface.

export type LetterRarity = 'comum' | 'rara' | 'lendaria'

export interface LoveLetter {
  id: number
  slug: string
  title: string
  rarity: LetterRarity
  icon: string
  sender: string
  body: string
}

export const LOVE_LETTERS: LoveLetter[] = [
  {
    id: 1,
    slug: 'entrega-especial',
    title: 'Entrega especial',
    rarity: 'comum',
    icon: '💌',
    sender: 'Correio dos Pombinhos',
    body: 'Prezada Pru, informamos que um pombo atravessou sete bairros, enfrentou dois gatos e roubou uma batata frita só para entregar esta mensagem: tem um Gustavinho que gosta muito, muito de você. Fim do comunicado. Pru pru!',
  },
  {
    id: 2,
    slug: 'meu-lugar-favorito',
    title: 'Meu lugar favorito',
    rarity: 'comum',
    icon: '🏡',
    sender: 'Correio dos Pombinhos',
    body: 'Se eu pudesse escolher qualquer lugar do mundo para estar agora, escolheria ficar bem pertinho de você. Talvez com um cobertor, alguma coisa gostosa pra comer e absolutamente nenhuma obrigação. Só nós dois.',
  },
  {
    id: 3,
    slug: 'samurai-do-amor',
    title: 'Samurai do amor',
    rarity: 'rara',
    icon: '⚔️',
    sender: 'Correio dos Pombinhos',
    body: 'Dizem que os samurais lutavam por honra. Eu lutaria pelo último pedacinho de comida com você. Mas, se você fizesse aquela carinha, provavelmente entregaria. Minha honra é fraca diante da Pombinha.',
  },
  {
    id: 4,
    slug: 'florzinha',
    title: 'Florzinha',
    rarity: 'comum',
    icon: '🌸',
    sender: 'Correio dos Pombinhos',
    body: 'Eu poderia te dar um jardim inteiro de flores, mas ainda assim nenhuma delas seria tão bonita quanto você quando sorri. Principalmente quando dá aquela risadinha que faz meus problemas parecerem menores.',
  },
  {
    id: 5,
    slug: 'em-qualquer-universo',
    title: 'Em qualquer universo',
    rarity: 'lendaria',
    icon: '🌙',
    sender: 'Correio dos Pombinhos',
    body: 'Se existissem mil universos, eu gostaria de te encontrar em todos eles. Mesmo que em um deles fôssemos dois pombos disputando migalhas na praça. Tenho certeza de que ainda ia acabar apaixonado por você.',
  },
  {
    id: 6,
    slug: 'decreto-real',
    title: 'Decreto real',
    rarity: 'rara',
    icon: '👑',
    sender: 'Reino dos Pombos',
    body: 'Por ordem do Reino dos Pombos, fica decretado que Bruna Sekiya, também conhecida como Pru, Pequena e Pombinha, receberá quantidades absurdas de carinho, beijinhos e atenção. O decreto é vitalício e não aceita recursos.',
  },
  {
    id: 7,
    slug: 'nosso-ninho',
    title: 'Nosso ninho',
    rarity: 'lendaria',
    icon: '🪺',
    sender: 'Correio dos Pombinhos',
    body: 'Um dia quero chegar em casa e saber que você está lá. Quero dividir as pequenas coisas, escolher o que vamos comer, reclamar da louça e dormir sabendo que amanhã vamos acordar juntos. Nosso próprio ninho, com amor e umas plantinhas.',
  },
  {
    id: 8,
    slug: 'confissao-criminosa',
    title: 'Confissão criminosa',
    rarity: 'comum',
    icon: '🍟',
    sender: 'Pombo Tribunal',
    body: 'Tenho uma coisa muito séria para confessar. Se você pedir batata frita, eu provavelmente vou roubar uma. Talvez duas. Mas prometo compensar com beijinhos. O Pombo Tribunal considera essa proposta justa.',
  },
  {
    id: 9,
    slug: 'para-os-dias-dificeis',
    title: 'Para os dias difíceis',
    rarity: 'rara',
    icon: '💕',
    sender: 'Correio dos Pombinhos',
    body: 'Pequena, você não precisa estar feliz ou animada todos os dias. Nos dias complicados, quero ser seu cantinho de descanso. Posso não conseguir resolver tudo, mas posso ficar do seu lado, te ouvir e te abraçar até as coisas melhorarem.',
  },
  {
    id: 10,
    slug: 'a-carta-mais-importante',
    title: 'A carta mais importante',
    rarity: 'lendaria',
    icon: '❤️',
    sender: 'Rei Pombo',
    body: 'Pru, eu fiz esse mundinho porque queria te dar uma coisa que fosse só sua. Um lugar cheio de pombos bobos, pequenas surpresas e pedacinhos do carinho que sinto por você. Talvez não seja um presente perfeito, mas cada detalhe existe porque eu amo ter você na minha vida. Eu te amo, Pombinha. ❤️',
  },
]

export interface UnlockRule {
  letterId: number
  condition: string
}

export const LETTER_UNLOCK_RULES: UnlockRule[] = [
  { letterId: 1, condition: 'disponivel-no-primeiro-acesso' },
  { letterId: 2, condition: 'abrir-1-carta' },
  { letterId: 4, condition: 'abrir-2-cartas' },
  { letterId: 8, condition: 'clicar-em-pombo-3-vezes' },

  { letterId: 3, condition: 'abrir-3-cartas-comuns' },
  { letterId: 6, condition: 'visitar-modulo-oraculo' },
  { letterId: 9, condition: 'abrir-5-cartas' },

  { letterId: 5, condition: 'abrir-2-cartas-raras' },
  { letterId: 7, condition: 'abrir-7-cartas' },
  { letterId: 10, condition: 'desbloquear-9-cartas' },
]

/** A carta final, entregue pelo Rei Pombo. */
export const FINAL_LETTER_ID = 10

/** Dica mostrada na carta bloqueada, por condição. */
export const UNLOCK_HINTS: Record<string, string> = {
  'disponivel-no-primeiro-acesso': 'Chega na primeira visita ao correio.',
  'abrir-1-carta': 'Abra 1 carta.',
  'abrir-2-cartas': 'Abra 2 cartas.',
  'clicar-em-pombo-3-vezes': 'Cutuque um pombo 3 vezes (qualquer pombo do site).',
  'abrir-3-cartas-comuns': 'Abra 3 cartas comuns.',
  'visitar-modulo-oraculo': 'Visite o Oráculo dos Pombos.',
  'abrir-5-cartas': 'Abra 5 cartas.',
  'abrir-2-cartas-raras': 'Abra 2 cartas raras.',
  'abrir-7-cartas': 'Abra 7 cartas.',
  'desbloquear-9-cartas': 'Encontre todas as outras cartas. O Rei Pombo está observando.',
}

export const RARITY_LABEL: Record<LetterRarity, string> = {
  comum: 'Comum',
  rara: 'Rara',
  lendaria: 'Lendária',
}

/** Carimbo no rodapé de cada carta (escolhido pelo id, sempre o mesmo). */
export const LETTER_FOOTERS = [
  'Carta entregue com 3 bicadas de urgência.',
  'Confidencial. Não mostrar para gatos.',
  'Correio certificado do Reino dos Pombos.',
  'Selada com uma migalha oficial.',
  'Transportada em voo direto, sem escalas no milho.',
] as const

export const FINAL_LETTER_FOOTER = 'Entregue em mãos (e asas) pelo próprio Rei Pombo.'

/** Falas do pombo-carteiro ao ser cutucado. */
export const CARRIER_LINES = [
  'Pru-pru! Correio do amor, às suas ordens.',
  'Não cutuque o carteiro! ...Tá bom, pode cutucar.',
  'Minha bolsa está pesada. É de tanto carinho.',
  'Já entreguei cartas para 3 telhados e 1 varal.',
  'Se uma carta sumir, foi o gato. Sempre é o gato.',
  'Assino recibo com uma pegadinha de pombo.',
] as const
