import { CROPS, type CropId } from '../../data/crops'
import type { EconomyError } from '../../economy/store'

/** "45 s", "2 min", "1 min 05 s". */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  if (total < 60) return `${total} s`
  const min = Math.floor(total / 60)
  const sec = total % 60
  return sec === 0 ? `${min} min` : `${min} min ${String(sec).padStart(2, '0')} s`
}

/** Mensagem amigável para cada erro das regras da fazenda. */
export function farmErrorMessage(error: EconomyError, crop: CropId, waitMs = 0): string {
  const name = CROPS[crop].name.toLowerCase()
  switch (error) {
    case 'sem-sementes':
      return `Você não tem sementes de ${name}. Escolha outra, colha uma plantação ou pegue o saquinho grátis.`
    case 'ainda-crescendo':
      return `O ${name} ainda está crescendo. Falta ${formatDuration(waitMs)}.`
    case 'saquinho-indisponivel':
      return `O Pombo-sama está buscando mais sementes. Volta em ${formatDuration(waitMs)}.`
    case 'canteiro-ocupado':
      return 'Esse canteiro já tem uma plantinha.'
    case 'canteiro-vazio':
      return 'Esse canteiro está vazio.'
    case 'canteiro-invalido':
      return 'Esse canteiro não existe.'
    // proteção do save (nada foi alterado em nenhum destes casos)
    case 'save-incompativel':
      return 'Seu progresso foi salvo por uma versão mais nova do site. Para não estragar nada, a fazendinha está só para olhar.'
    case 'sem-protecao':
      return 'Este navegador não consegue proteger a fazendinha entre abas, então nada foi alterado. Tente atualizar o navegador.'
    case 'ocupado':
      return 'A fazendinha está ocupada em outra aba. Tente de novo em instantes.'
    case 'falha-ao-salvar':
      return 'Não deu para salvar agora (o armazenamento pode estar cheio). Nada foi alterado.'
  }
}
