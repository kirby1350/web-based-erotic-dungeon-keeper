import type { Character, ChatMessage, GameSession } from '@/lib/types'
import { resolveTurnCharacter, type ProgramTurnResult } from '@/lib/adventure-context'
import { inspectReply, serializeReply } from '@/lib/chat-protocol'
import { settleBodyDevelopment, splitNarrative } from '@/lib/body-development'
import { partnerMarker, settlePartner, together } from '@/lib/party'

function lean(c: Character): Character {
  return { ...c, avatarUrl: null, ...(c.partner ? { partner: { ...c.partner, avatarUrl: null } } : {}) }
}

export const PROMPT_VERSION = 'keeper-v4'
export interface PendingTurn {
  id: string
  input: string
  startedAt: number
  before: Character
  result: ProgramTurnResult | null
  requestMessages: { role: string; content: string }[]
  model: string
  phase: 'generating' | 'repair' | 'ready'
  draft: string
  originalReply?: string
  repaired?: boolean
  promptVersion: string
  /** 代码侧字数/台词/否定句检查。guarded 为真表示已检查（含至多一次重生成），恢复时不再重跑。 */
  guard?: { dense: boolean; stepIndex: number | null; guarded?: boolean; retried?: boolean; first?: string[]; failures?: string[]; firstClear?: string[]; clear?: string[]; extraMs?: number }
}
export interface TurnRecord {
  id: string
  promptVersion: string
  model: string
  result: ProgramTurnResult | null
  before: Character
  after: Character
  input: string
  reply: string
  originalReply: string
  committedAt: number
  repaired: boolean
  contradictions: string[]
}

/** Pure transaction preparation. Persist the result once, then publish it to the UI. */
export function completeTurn(session: GameSession, pending: PendingTurn, content: string, repaired: boolean): { character: Character; session: GameSession; warnings: string[] } {
  const duplicate = session.turns?.find((turn) => turn.id === pending.id)
  if (duplicate) {
    if (session.turns?.at(-1)?.id !== pending.id) throw new Error('该回合已完成，不能覆盖后续回合')
    const after = duplicate.after
    return { character: { ...after, avatarUrl: pending.before.avatarUrl, ...(after.partner && pending.before.partner ? { partner: { ...after.partner, avatarUrl: pending.before.partner.avatarUrl } } : {}) }, session, warnings: [] }
  }
  if (session.pendingTurn?.id !== pending.id) throw new Error('待完成回合已改变，请重新载入存档')
  const current = resolveTurnCharacter(pending.before, pending.result)
  const reply = inspectReply(content, current, pending.result)
  if (reply.errors.length || reply.metadataErrors.length || !reply.updates) throw new Error('回合输出尚未通过校验')
  let character: Character = { ...current, ...reply.updates }
  const warnings = [...reply.warnings]
  let canonical = serializeReply(reply, character)
  if (together(current) && current.partner) {
    const settled = settlePartner(character, current.partner, content)
    const partnerText = splitNarrative(reply.narrative, current.name, current.partner.name).partner
    const partnerDev = settleBodyDevelopment(current.partner.bodyDevelopment ?? { breast: 0, clitoris: 0, urethra: 0, vagina: 0, anus: 0 }, partnerText, current.partner.pleasure ?? 0, settled.partner.pleasure ?? 0)
    character = { ...character, partner: { ...settled.partner, bodyDevelopment: partnerDev } }
    if (settled.warning) warnings.push(settled.warning)
    canonical += `\n${partnerMarker(settled.partner)}`
  }
  const timestamp = Date.now()
  const messages: ChatMessage[] = [...session.messages,
    { role: 'user', content: pending.input, timestamp: pending.startedAt, turnId: pending.id },
    { role: 'assistant', content: canonical, timestamp, turnId: pending.id,
      ...(pending.guard?.guarded ? { guard: { retried: !!pending.guard.retried, first: pending.guard.first ?? [], failures: pending.guard.failures ?? [], firstClear: pending.guard.firstClear ?? [], clear: pending.guard.clear ?? [], extraMs: pending.guard.extraMs ?? 0 } } : {}) },
  ]
  const record: TurnRecord = { id: pending.id, promptVersion: pending.promptVersion, model: pending.model,
    result: pending.result, before: lean(pending.before), after: lean(character), input: pending.input, reply: canonical,
    originalReply: session.pendingTurn?.originalReply || session.pendingTurn?.draft || content,
    committedAt: timestamp, repaired, contradictions: reply.contradictions }
  return { character, session: { ...session, messages, pendingTurn: null, turns: [...(session.turns ?? []), record].slice(-20) }, warnings }
}

export function pendingMessages(session: GameSession): ChatMessage[] {
  const pending = session.pendingTurn
  return pending ? [...session.messages,
    { role: 'user', content: pending.input, timestamp: pending.startedAt, turnId: pending.id },
    { role: 'assistant', content: pending.draft, timestamp: pending.startedAt, turnId: pending.id },
  ] : session.messages
}
