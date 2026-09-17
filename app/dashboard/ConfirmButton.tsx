'use client'

import { useTransition } from 'react'

interface ConfirmButtonProps {
  id: number
  action: (id: number) => Promise<void>
  confirmMessage: string
  className: string
  children: React.ReactNode
  title?: string
}

export default function ConfirmButton({
  id,
  action,
  confirmMessage,
  className,
  children,
  title,
}: ConfirmButtonProps) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={isPending}
      title={title}
      onClick={() => {
        if (confirm(confirmMessage)) {
          startTransition(async () => {
            await action(id)
          })
        }
      }}
      className={className}
    >
      {isPending ? '처리 중...' : children}
    </button>
  )
}