import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'

interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  variant?: 'danger' | 'default'
}

interface ConfirmContextType {
  confirm: (opts: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType>({
  confirm: () => Promise.resolve(false),
})

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmOptions | null>(null)
  const [resolve, setResolve] = useState<((v: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((res) => {
      setState(opts)
      setResolve(() => res)
    })
  }, [])

  const handleConfirm = () => {
    resolve?.(true)
    setState(null)
  }

  const handleCancel = () => {
    resolve?.(false)
    setState(null)
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <ConfirmDialog
          open
          title={state.title}
          message={state.message}
          confirmLabel={state.confirmLabel}
          variant={state.variant}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmContext.Provider>
  )
}

export const useConfirm = () => useContext(ConfirmContext)
