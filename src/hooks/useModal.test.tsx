import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useModal } from './useModal'

function Dialog({ onClose }: { onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  useModal(containerRef, titleRef, onClose)
  return (
    <div ref={containerRef} role="dialog" aria-modal="true" aria-label="Janela">
      <button type="button">Um</button>
      <h2 ref={titleRef} tabIndex={-1}>
        Título
      </h2>
      <button type="button">Dois</button>
      <button type="button">Três</button>
    </div>
  )
}

function Page({ onClose = () => {} }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Abrir
      </button>
      <a href="#fora">Link de fora</a>
      {open && (
        <Dialog
          onClose={() => {
            onClose()
            setOpen(false)
          }}
        />
      )}
      <button type="button">Depois da janela</button>
    </>
  )
}

const button = (name: string) => screen.getByRole('button', { name })

async function openDialog() {
  const user = userEvent.setup()
  const utils = render(<Page />)
  button('Abrir').focus()
  await user.keyboard('{Enter}')
  return { user, ...utils }
}

describe('useModal — navegação só com teclado', () => {
  it('abre com o foco no título e trava a rolagem da página', async () => {
    await openDialog()
    expect(screen.getByRole('heading', { name: 'Título' })).toHaveFocus()
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('Tab percorre só os controles da janela e dá a volta', async () => {
    const { user } = await openDialog()
    button('Dois').focus()
    await user.tab()
    expect(button('Três')).toHaveFocus()
    await user.tab()
    expect(button('Um')).toHaveFocus()
    await user.tab()
    expect(button('Dois')).toHaveFocus()
  })

  it('Shift+Tab percorre ao contrário e dá a volta', async () => {
    const { user } = await openDialog()
    button('Um').focus()
    await user.tab({ shift: true })
    expect(button('Três')).toHaveFocus()
    await user.tab({ shift: true })
    expect(button('Dois')).toHaveFocus()
  })

  it('a partir do título (que não é parada de Tab): Tab vai ao próximo controle, Shift+Tab ao anterior', async () => {
    const { user } = await openDialog()
    const title = screen.getByRole('heading', { name: 'Título' })
    expect(title).toHaveFocus()
    await user.tab()
    expect(button('Dois')).toHaveFocus()

    title.focus()
    await user.tab({ shift: true })
    expect(button('Um')).toHaveFocus()
  })

  it('20 Tabs e 20 Shift+Tabs seguidos: o foco nunca sai da janela', async () => {
    const { user } = await openDialog()
    const dialog = screen.getByRole('dialog')
    for (let i = 0; i < 20; i++) {
      await user.tab()
      expect(dialog).toContainElement(document.activeElement as HTMLElement)
    }
    for (let i = 0; i < 20; i++) {
      await user.tab({ shift: true })
      expect(dialog).toContainElement(document.activeElement as HTMLElement)
    }
  })

  it('se o foco estiver fora da janela, Tab e Shift+Tab trazem de volta', async () => {
    const { user } = await openDialog()
    button('Depois da janela').focus()
    await user.tab()
    expect(button('Um')).toHaveFocus()

    screen.getByRole('link', { name: 'Link de fora' }).focus()
    await user.tab({ shift: true })
    expect(button('Três')).toHaveFocus()
  })

  it('Esc fecha, devolve o foco a quem abriu e libera a rolagem', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<Page onClose={onClose} />)
    button('Abrir').focus()
    await user.keyboard('{Enter}')
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(button('Abrir')).toHaveFocus()
    expect(document.body.style.overflow).toBe('')
  })
})
