'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, ChevronsDown, Compass, Layers, Lock } from 'lucide-react'
import { Character, getFloorTheme } from '@/lib/types'
import { getKeep } from '@/lib/storage'
import { keeperPromptContext, sceneChrome } from '@/lib/keeper'
import { cn } from '@/lib/utils'

interface ExploreControlsProps {
  character: Character
  busy?: boolean
  onExplore?: () => void
  onAdvanceFloor?: () => void
  onBack?: () => void
  /** 竖排（桌面左栏）或一行（手机） */
  layout?: 'stack' | 'row'
}

/** 层数、本层驱赶进度、往里赶 / 送下层、回城主厅。原来在状态卡顶上，现在桌面放左栏，手机放状态条下。 */
export function ExploreControls({ character, busy = false, onExplore, onAdvanceFloor, onBack, layout = 'stack' }: ExploreControlsProps) {
  const [depth, setDepth] = useState(3)
  const [roomName, setRoomName] = useState('')
  useEffect(() => {
    const keep = getKeep()
    setDepth(keep.progress.depth)
    setRoomName(keep.floors[(character.floor ?? 1) - 1]?.name ?? '')
  }, [character.floor, character.explorationProgress])
  const progress = Math.min(100, character.explorationProgress ?? 0)
  const chrome = sceneChrome(keeperPromptContext(getKeep()), character.floor ?? 1)
  const training = chrome.mode === 'train'
  const floor = character.floor ?? 1
  const row = layout === 'row'

  const action = training || character.encounter ? null : progress >= 100 ? (
    floor < depth && (
      <button onClick={onAdvanceFloor} disabled={busy} title="这一层已经赶完，把她送去下一层"
        className="flex items-center justify-center gap-1 px-2.5 py-1 rounded-full border border-amber-400/50 bg-amber-500/15 text-amber-200 text-[11px] font-bold hover:bg-amber-500/25 disabled:opacity-40 flex-shrink-0">
        <ChevronsDown className="w-3 h-3" />送下层
      </button>
    )
  ) : (
    <button onClick={onExplore} disabled={busy} title="把她往这一层更里面赶"
      className="flex items-center justify-center gap-1 px-2.5 py-1 rounded-full border border-primary/50 bg-primary/10 text-primary text-[11px] font-bold hover:bg-primary/20 disabled:opacity-40 flex-shrink-0">
      <Compass className="w-3 h-3" />往里赶
    </button>
  )

  return (
    <div className={cn(row ? 'flex items-center gap-2 px-3 py-1.5 border-b border-border' : 'space-y-2')} data-testid="explore-controls">
      {training ? (
        <span title={chrome.placeDetail} className="flex items-center gap-1 text-[11px] text-rose-200 bg-rose-500/15 border border-rose-400/30 px-2 py-0.5 rounded-full w-fit flex-shrink-0">
          <Lock className="w-3 h-3" />{chrome.placeLabel}
        </span>
      ) : (
        <>
          <span title={`她被放在「${roomName || getFloorTheme(character.floorThemes, floor).name}」`}
            className="flex items-center gap-1 text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full w-fit flex-shrink-0">
            <Layers className="w-3 h-3" />第 {floor}/{depth} 层{!row && roomName ? ` · ${roomName}` : ''}
          </span>
          <div className={cn('flex items-center gap-1.5', row ? 'flex-1 min-w-0' : '')} title={`本层驱赶进度 ${progress}%`}>
            <Compass className="w-3 h-3 text-primary/60 flex-shrink-0" />
            <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden min-w-[2rem]">
              <div className="h-full bg-gradient-to-r from-amber-500 to-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-[10px] text-muted-foreground tabular-nums flex-shrink-0">{progress}%</span>
          </div>
        </>
      )}
      {training && (row
        ? <span className="flex-1 min-w-0 truncate text-[10px] text-rose-200/70">{chrome.placeDetail}</span>
        : <p className="text-[11px] text-rose-200/70 leading-relaxed">{chrome.placeDetail}</p>)}
      {action && (row ? action : <div className="[&>button]:w-full">{action}</div>)}
      {onBack && (
        <button onClick={onBack} disabled={busy} title={chrome.backTitle}
          className={cn('flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-40', row ? 'flex-shrink-0' : 'w-full px-2 py-1 rounded-md hover:bg-secondary')}>
          <ArrowLeft className="w-3.5 h-3.5" />{row ? '' : chrome.backTitle}
        </button>
      )}
    </div>
  )
}
