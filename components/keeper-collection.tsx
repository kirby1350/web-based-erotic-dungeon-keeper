'use client'

import { useState } from 'react'
import { RACE_INFO, type AppSettings } from '@/lib/types'
import { FATE_LABEL, appendRecall, collectionActions, collectionNeedsSlot, pickDiscardScene, planReturn, stampBrand, type CaptiveRecord, type CollectionAction, type KeeperSave, type KeeperTrap } from '@/lib/keeper'
import { buildAftermathPrompt } from '@/lib/prompts'
import { useAftermath } from '@/hooks/use-aftermath'
import { AftermathPopup } from '@/components/aftermath-popup'

interface KeeperCollectionProps {
  keep: KeeperSave
  settings: AppSettings
  blocked: boolean
  onBringBack: (record: CaptiveRecord, line: string, planned: NonNullable<ReturnType<typeof planReturn>>) => void
  onUpdate: (record: CaptiveRecord, patch: Pick<CaptiveRecord, 'fate' | 'character' | 'recall'>) => void
  onBack: () => void
}

export function KeeperCollection({ keep, settings, blocked, onBringBack, onUpdate, onBack }: KeeperCollectionProps) {
  const aftermath = useAftermath(settings)
  const [aimId, setAimId] = useState<string | null>(null)
  const placedTraps = keep.traps.filter((trap) => trap.placed)
  const launch = (record: CaptiveRecord, action: CollectionAction, trap?: KeeperTrap) => {
    setAimId(null)
    const scene = action.effect === 'discard' ? pickDiscardScene() : null
    const brief = scene
      ? `${scene.brief}这一段会作为烙印记在她身上，状态改成放走。`
      : trap
        ? `城主把她直接传送，扔进「${trap.name}」。${trap.mechanism}她没有自己走路进来。`
        : action.brief
    aftermath.ask({
      title: scene ? `${action.label} · ${scene.label} · ${record.name}` : `${action.label} · ${record.name}`,
      prompt: buildAftermathPrompt({
        name: record.name,
        action: scene ? `${action.label}：${scene.label}` : action.label,
        brief,
        pleasure: record.pleasure,
        desire: record.desire,
        recall: record.recall,
        longer: Boolean(scene),
      }),
      onConfirm: (text) => {
        if (action.effect === 'release') {
          onUpdate(record, { fate: 'defeated', character: record.character, recall: appendRecall(record.recall, text) })
          return
        }
        if (action.effect === 'discard') {
          if (!scene) return
          const character = stampBrand(record.character, scene.label, text)
          onUpdate(record, { fate: 'defeated', character, recall: appendRecall(record.recall, `${scene.label}。${text}`) })
          return
        }
        const planned = planReturn(keep, record, action.effect, trap?.id)
        if (!planned) return
        onBringBack(record, text, planned)
      },
    })
  }
  const choose = (record: CaptiveRecord, action: CollectionAction) => {
    if (action.effect === 'recall' && placedTraps.length > 0) {
      setAimId(record.id)
      return
    }
    launch(record, action)
  }
  return (
    <div className="min-h-screen p-4 md:p-8">
      {aftermath.popup && <AftermathPopup popup={aftermath.popup} onConfirm={aftermath.confirm} onDismiss={aftermath.dismiss} />}
      <div className="max-w-3xl mx-auto space-y-4">
        <button type="button" onClick={onBack} className="text-xs text-muted-foreground">回到城主厅</button>
        <div>
          <h1 className="text-3xl font-bold gold-text">收藏室</h1>
          <p className="text-sm text-muted-foreground mt-2">留下的人可以调教、真放走，或假装放走。玩坏的人可以调教，或扔掉。扔掉会先写她被传送回城市的一段，烙印记在身上，状态改成放走。放走的人可以召回迷宫，有布置好的陷阱就能直接扔进去，也可以让她自己回来再探索。带回迷宫、调教室或路上会占一个在狱格子。选完会先写一小段。</p>
          {blocked && <p className="text-sm text-amber-200 mt-2">在狱的格子满了。先把一个人留下、玩坏或放走，再把这里的人带回迷宫或调教室。</p>}
        </div>
        {keep.collection.length === 0 && <p className="text-sm text-muted-foreground">收藏室还是空的。</p>}
        <div className="space-y-3">
          {keep.collection.map((record) => (
            <article key={record.id} className="dungeon-border rounded-xl bg-card p-4 flex gap-3">
              <div className="w-14 h-14 rounded-lg overflow-hidden border border-border bg-secondary flex-shrink-0">
                {record.avatarUrl ? <img src={record.avatarUrl} alt={record.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-primary">{record.name[0]}</div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold truncate">{record.name}</h2>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-border text-muted-foreground">{FATE_LABEL[record.fate]}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{RACE_INFO[record.race]?.label ?? record.race} · 快感 {record.pleasure} · 欲望 {record.desire}</p>
                {record.character.brands?.length ? <p className="text-xs text-pink-200/80 mt-1">烙印 {record.character.brands.map((brand) => brand.split('：')[0]).join('、')}</p> : null}
                {record.recall && <p className="text-xs mt-2 leading-relaxed line-clamp-3">{record.recall}</p>}
                <div className="mt-2 flex flex-wrap gap-2">
                  {collectionActions(record.fate).map((action) => {
                    const needsSlot = collectionNeedsSlot(action.effect)
                    return (
                      <button
                        key={action.id}
                        type="button"
                        disabled={needsSlot && blocked}
                        title={needsSlot && blocked ? '在狱的格子满了' : action.brief}
                        onClick={() => choose(record, action)}
                        className="text-sm text-primary disabled:opacity-40"
                      >
                        {action.label}
                      </button>
                    )
                  })}
                </div>
                {aimId === record.id && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button type="button" onClick={() => launch(record, collectionActions('defeated')[0])} className="text-sm text-primary">送进迷宫</button>
                    {placedTraps.map((trap) => (
                      <button key={trap.id} type="button" onClick={() => launch(record, collectionActions('defeated')[0], trap)} className="text-sm text-primary">扔进「{trap.name}」</button>
                    ))}
                    <button type="button" onClick={() => setAimId(null)} className="text-sm text-muted-foreground">先不召回</button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
