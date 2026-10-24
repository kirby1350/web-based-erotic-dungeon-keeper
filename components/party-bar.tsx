'use client'

import { useState } from 'react'
import { Users, Split, ArrowLeftRight } from 'lucide-react'
import type { Character } from '@/lib/types'
import type { KeeperSave } from '@/lib/keeper'
import { StatusPanel } from '@/components/status-panel'
import { cn } from '@/lib/utils'

/** 对话上方的一条：两人同行 / 已拆开，拆开与换人按钮。手机和桌面共用。 */
export function PartyBar({ character, busy, onSplit, onSwap }: { character: Character; busy: boolean; onSplit: () => void; onSwap: () => void }) {
  const partner = character.partner
  if (!partner) return null
  const split = character.party?.split === true
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-primary/5 text-xs" data-testid="party-bar">
      <Users className="w-3.5 h-3.5 text-primary flex-shrink-0" />
      <span className="flex-1 min-w-0 truncate">
        {split
          ? <>已拆开 · 跟着<b className="text-primary">{character.name}</b> · {partner.name}排在第二</>
          : <>两人同行 · <b className="text-primary">{character.name}</b>为主 · {partner.name}在旁边（快感 {partner.pleasure ?? 0}）</>}
      </span>
      {!split && (
        <button type="button" disabled={busy} onClick={onSplit} data-testid="party-split" className="flex items-center gap-1 px-2 py-1 rounded border border-border bg-secondary disabled:opacity-40">
          <Split className="w-3 h-3" />拆开
        </button>
      )}
      <button type="button" disabled={busy} onClick={onSwap} data-testid="party-switch" className="flex items-center gap-1 px-2 py-1 rounded border border-border bg-secondary disabled:opacity-40">
        <ArrowLeftRight className="w-3 h-3" />{split ? `换到${partner.name}` : `以${partner.name}为主`}
      </button>
    </div>
  )
}

/** 右栏 / 手机弹层：两人时上面一排切换，看谁的状态。 */
export function PartyStatus({ character, keep, log, onOpenProfile }: { character: Character; keep: KeeperSave; log: string[]; onOpenProfile: () => void }) {
  const [view, setView] = useState<'focus' | 'partner'>('focus')
  const partner = character.partner
  if (!partner) return <StatusPanel character={character} keep={keep} log={log} onOpenProfile={onOpenProfile} />
  const shown = view === 'partner' ? partner : character
  return (
    <div>
      <div className="flex gap-1 p-2 border-b border-border" role="tablist" data-testid="party-toggle">
        {([['focus', character], ['partner', partner]] as const).map(([key, who]) => (
          <button key={key} type="button" role="tab" aria-selected={view === key} onClick={() => setView(key)}
            className={cn('flex-1 px-2 py-1.5 rounded text-xs', view === key ? 'bg-primary text-primary-foreground font-bold' : 'bg-secondary text-muted-foreground')}>
            {who.name}{key === 'focus' ? ' · 主' : character.party?.split ? ' · 第二' : ' · 同伴'}
          </button>
        ))}
      </div>
      <StatusPanel key={shown.name} character={shown} keep={keep} log={view === 'focus' ? log : []} onOpenProfile={onOpenProfile} />
    </div>
  )
}
