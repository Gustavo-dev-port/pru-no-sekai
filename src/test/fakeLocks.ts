// LockManager de mentira para os testes (jsdom não tem Web Locks).
// Fila FIFO por nome de lock, exclusiva de verdade: um callback só começa
// depois que o anterior terminou. Suporta AbortSignal na espera, como o real.
// Várias "abas" de teste compartilham a MESMA instância, como num navegador.

export interface FakeLockManager extends LockManager {
  /** Quantas vezes cada lock foi pedido. */
  requests: Map<string, number>
  /** Segura o lock até a promessa devolvida ser resolvida (simula outra aba ocupada). */
  hold(name: string): () => void
}

export function createFakeLockManager(): FakeLockManager {
  const tails = new Map<string, Promise<unknown>>()
  const requests = new Map<string, number>()

  function request<T>(
    name: string,
    optionsOrCallback: LockOptions | ((lock: Lock | null) => T | Promise<T>),
    maybeCallback?: (lock: Lock | null) => T | Promise<T>,
  ): Promise<T> {
    const callback = (typeof optionsOrCallback === 'function' ? optionsOrCallback : maybeCallback)!
    const options: LockOptions = typeof optionsOrCallback === 'function' ? {} : optionsOrCallback
    requests.set(name, (requests.get(name) ?? 0) + 1)

    const previous = tails.get(name) ?? Promise.resolve()
    let aborted = false
    const run = new Promise<T>((resolve, reject) => {
      options.signal?.addEventListener('abort', () => {
        aborted = true
        reject(new DOMException('A espera pelo lock foi cancelada', 'AbortError'))
      })
      previous.then(async () => {
        if (aborted) return
        try {
          resolve(await callback({ name, mode: options.mode ?? 'exclusive' } as Lock))
        } catch (e) {
          reject(e)
        }
      })
    })
    // a próxima espera a anterior terminar (com sucesso ou não)
    tails.set(
      name,
      run.then(
        () => undefined,
        () => undefined,
      ),
    )
    return run
  }

  return {
    request: request as LockManager['request'],
    query: async () => ({ held: [], pending: [] }),
    requests,
    hold(name: string) {
      let release!: () => void
      const held = new Promise<void>((r) => (release = r))
      void request(name, () => held)
      return release
    },
  }
}
