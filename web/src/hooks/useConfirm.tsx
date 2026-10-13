import { useState, useCallback } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'

interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  variant?: 'danger' | 'default'
}

export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const [resolve, setResolve] = useState<((value: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((res) => {
      setOptions(opts)
      setResolve(() => res)
    })
  }, [])

  const handleConfirm = useCallback(() => {
    resolve?.(true)
    setOptions(null)
  }, [resolve])

  const handleCancel = useCallback(() => {
    resolve?.(false)
    setOptions(null)
  }, [resolve])

  const dialog = options ? (
    <ConfirmDialog
      open={true}
      title={options.title}
      message={options.message}
      confirmLabel={options.confirmLabel}
      variant={options.variant}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  ) : null

  return { confirm, dialog }
}
