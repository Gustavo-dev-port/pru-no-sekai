// Storage em memória para simular o localStorage de um navegador.
// Duas "abas" de teste recebem a MESMA instância (como no navegador real).
export class MemoryStorage implements Storage {
  private data = new Map<string, string>()
  /** Quantas gravações aconteceram (para provar que algo NÃO foi gravado). */
  writes = 0

  get length() {
    return this.data.size
  }
  clear() {
    this.data.clear()
  }
  getItem(key: string) {
    return this.data.has(key) ? this.data.get(key)! : null
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null
  }
  removeItem(key: string) {
    this.data.delete(key)
  }
  setItem(key: string, value: string) {
    this.writes++
    this.data.set(key, String(value))
  }
  keys() {
    return [...this.data.keys()]
  }
}
