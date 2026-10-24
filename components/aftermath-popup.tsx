'use client'

import type { AftermathPopupState } from '@/hooks/use-aftermath'

interface AftermathPopupProps {
  popup: AftermathPopupState
  onConfirm: () => void
  onDismiss: () => void
  kicker?: string
  dismissLabel?: string
}

export function AftermathPopup({ popup, onConfirm, onDismiss, kicker = '处置之后', dismissLabel = '先不处置' }: AftermathPopupProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-4">
      <div role="dialog" aria-modal="true" aria-label={popup.title} className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
        <p className="text-xs tracking-widest text-primary">{kicker}</p>
        <h2 className="text-lg font-bold mt-1">{popup.title}</h2>
        <p className="mt-3 text-sm leading-relaxed min-h-16 whitespace-pre-wrap">
          {popup.text || (popup.pending ? '正在写这一下发生了什么…' : '')}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          {!popup.locked && <button type="button" onClick={onDismiss} className="px-3 py-1.5 text-xs text-muted-foreground">{dismissLabel}</button>}
          <button type="button" onClick={onConfirm} disabled={popup.pending} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold disabled:opacity-40">
            {popup.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
