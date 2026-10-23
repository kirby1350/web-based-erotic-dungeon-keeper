'use client'

import { useRef, useState } from 'react'
import type { AppSettings } from '@/lib/types'
import { chatStream } from '@/lib/dzmm'

export interface AftermathPopupState {
  title: string
  text: string
  pending: boolean
  confirmLabel: string
  locked: boolean
}

function plainLine(raw: string): string {
  const cut = raw.search(/\[(OPTIONS|SCENE|STATS|DESC)/i)
  return (cut < 0 ? raw : raw.slice(0, cut)).replace(/\s+/g, ' ').trim().slice(0, 800)
}

/** 处置之后向模型要一小段对白，失败时也留一句，避免按钮卡住。 */
export function useAftermath(settings: AppSettings | null) {
  const [popup, setPopup] = useState<AftermathPopupState | null>(null)
  const confirmRef = useRef<(text: string) => void>(() => {})
  const textRef = useRef('')
  const abortRef = useRef<AbortController | null>(null)

  const dismiss = () => {
    abortRef.current?.abort()
    abortRef.current = null
    setPopup(null)
  }

  const confirm = () => {
    const text = plainLine(textRef.current) || '这一下没有写成句子。处置本身已经定了。'
    const run = confirmRef.current
    dismiss()
    run(text)
  }

  const ask = (input: { title: string; prompt: string; confirmLabel?: string; locked?: boolean; onConfirm: (text: string) => void }) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    confirmRef.current = input.onConfirm
    textRef.current = ''
    setPopup({ title: input.title, text: '', pending: true, confirmLabel: input.confirmLabel ?? '知道了', locked: input.locked === true })
    const finish = (text: string) => {
      if (controller.signal.aborted) return
      textRef.current = text
      setPopup((current) => current ? { ...current, text, pending: false } : current)
    }
    if (!settings) {
      finish('这一下没有写成句子。处置本身已经定了。')
      return
    }
    let raw = ''
    void chatStream({
      model: settings.chatModel,
      grokApiKey: settings.grokApiKey,
      signal: controller.signal,
      conversationId: crypto.randomUUID(),
      messages: [
        { role: 'system', content: '你写地下城城主做出处置之后的短场面。只写第三人称正文。不要选项，不要标记，不要 JSON。' },
        { role: 'user', content: input.prompt },
      ],
    }, (delta) => {
      if (controller.signal.aborted) return
      raw += delta
      const text = plainLine(raw)
      textRef.current = text
      setPopup((current) => current ? { ...current, text } : current)
    }).then(() => finish(plainLine(raw) || '这一下没有写成句子。处置本身已经定了。'), () => {
      finish(plainLine(raw) || '这一下没有写成句子。处置本身已经定了。')
    })
  }

  return { popup, ask, confirm, dismiss }
}
