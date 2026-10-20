// sessionStorage pode não existir (aba privada, bloqueio de dados), então
// toda leitura/escrita é tolerante a falha. Nada pessoal é guardado aqui.
const ENTERED_KEY = 'pru:entrou-no-santuario'

export function hasEnteredSanctuary(): boolean {
  try {
    return sessionStorage.getItem(ENTERED_KEY) === '1'
  } catch {
    return false
  }
}

export function setEnteredSanctuary(entered: boolean): void {
  try {
    if (entered) sessionStorage.setItem(ENTERED_KEY, '1')
    else sessionStorage.removeItem(ENTERED_KEY)
  } catch {
    /* sem armazenamento: a intro só aparece de novo, sem problema */
  }
}
