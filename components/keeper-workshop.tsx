'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { PRESET_TRAPS, type AppSettings } from '@/lib/types'
import { chatStream } from '@/lib/dzmm'
import { buildMonsterPrompt, buildWorkshopTrapPrompt } from '@/lib/prompts'
import {
  PRESET_MONSTERS,
  encounterId,
  monsterFromPreset,
  togglePlaced,
  trapFromPreset,
  type KeeperMonster,
  type KeeperSave,
  type KeeperTrap,
} from '@/lib/keeper'
import { CUSTOM_LIMITS, customBlock, customCost } from '@/lib/synergy'

interface KeeperWorkshopProps {
  mode: 'trap' | 'monster'
  keep: KeeperSave
  settings: AppSettings
  onKeep: (keep: KeeperSave) => void
  onBack: () => void
}

function section(text: string, title: string): string {
  const match = text.match(new RegExp(`【${title}】\\s*([\\s\\S]*?)(?=【|$)`))
  return (match?.[1] ?? '').trim()
}

export function KeeperWorkshop({ mode, keep, settings, onKeep, onBack }: KeeperWorkshopProps) {
  const isTrap = mode === 'trap'
  const [hint, setHint] = useState('')
  const [name, setName] = useState('')
  const [primary, setPrimary] = useState('')
  const [secondary, setSecondary] = useState('')
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generate = async () => {
    setLoading(true)
    setError('')
    setDraft('')
    const prompt = isTrap
      ? buildWorkshopTrapPrompt(settings.proseStyle, hint)
      : buildMonsterPrompt(settings.proseStyle, hint)
    try {
      let full = ''
      await chatStream({
        messages: [{ role: 'user', content: prompt }],
        model: settings.chatModel,
        apiKey: settings.chatApiKey,
        grokApiKey: settings.grokApiKey,
      }, (delta) => {
        full += delta
        setDraft(full)
      })
      if (isTrap) {
        setName(section(full, '陷阱名称'))
        setSecondary(section(full, '触发描写'))
        setPrimary(section(full, '机械摘要'))
      } else {
        setName(section(full, '魔物名称'))
        setSecondary(section(full, '外观'))
        setPrimary(section(full, '行为') || section(full, '机械摘要'))
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setLoading(false)
    }
  }

  const saveCustom = () => {
    const trimmedName = name.trim()
    const trimmedPrimary = primary.trim()
    if (!trimmedName || !trimmedPrimary) {
      setError(isTrap ? '要有名称和机械摘要，才能入库。' : '要有名称和行为，才能入库。')
      return
    }
    const blockedBy = customBlock(isTrap ? 'trap' : 'monster', keep)
    if (blockedBy) { setError(blockedBy); return }
    const paid = { ...keep, progress: { ...keep.progress, essence: keep.progress.essence - customCost(isTrap ? 'trap' : 'monster', keep) } }
    const id = encounterId(`custom_${crypto.randomUUID().replace(/-/g, '')}`)
    if (isTrap) {
      const trap: KeeperTrap = { id, name: trimmedName.slice(0, 40), mechanism: trimmedPrimary.slice(0, 400), prose: secondary.trim().slice(0, 800), placed: false, source: 'custom' }
      onKeep({ ...paid, traps: [...paid.traps, trap] })
    } else {
      const monster: KeeperMonster = { id, name: trimmedName.slice(0, 40), appearance: secondary.trim().slice(0, 240), behavior: trimmedPrimary.slice(0, 400), placed: false, source: 'custom' }
      onKeep({ ...paid, monsters: [...paid.monsters, monster] })
    }
    setName('')
    setPrimary('')
    setSecondary('')
    setDraft('')
    setError('')
  }

  const catalogTraps = PRESET_TRAPS.filter((item) => !keep.traps.some((trap) => trap.id === item.id))
  const catalogMonsters = PRESET_MONSTERS.filter((item) => !keep.monsters.some((monster) => monster.id === item.id))
  const placedCount = isTrap ? keep.traps.filter((trap) => trap.placed).length : keep.monsters.filter((monster) => monster.placed).length
  const slotCap = isTrap ? keep.progress.trapSlots : keep.progress.monsterSlots

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-5">
        <button type="button" onClick={onBack} className="text-xs text-muted-foreground">回到城主厅</button>
        <div>
          <h1 className="text-3xl font-bold gold-text">{isTrap ? '陷阱工房' : '魔物工房'}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {isTrap ? '启用的陷阱会留在廊道里。你把人往里赶，她才可能撞上。' : '启用的魔物听你的命令。开场可以放出一只，也可以等她走到那一段。'}
            {` 栏位 ${placedCount}/${slotCap}。布置会先塞进第 1 层，换层到布置地城。`}
          </p>
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-bold">已经入库</h2>
          {isTrap && keep.traps.length === 0 && <p className="text-xs text-muted-foreground">还没有陷阱。</p>}
          {!isTrap && keep.monsters.length === 0 && <p className="text-xs text-muted-foreground">还没有魔物。</p>}
          {isTrap && keep.traps.map((trap) => (
            <OwnedRow
              key={trap.id}
              name={`${trap.name}${keep.floors.some((floor) => floor.trapIds.includes(trap.id)) ? ` · 第${keep.floors.findIndex((floor) => floor.trapIds.includes(trap.id)) + 1}层` : ''}`}
              detail={trap.mechanism}
              placed={trap.placed}
              blocked={!trap.placed && placedCount >= slotCap}
              onToggle={() => onKeep(togglePlaced(keep, 'trap', trap.id))}
              onDelete={() => onKeep({ ...keep, traps: keep.traps.filter((item) => item.id !== trap.id) })}
            />
          ))}
          {!isTrap && keep.monsters.map((monster) => (
            <OwnedRow
              key={monster.id}
              name={`${monster.temporary ? '临时 · ' : ''}${monster.name}${keep.floors.some((floor) => floor.monsterIds.includes(monster.id)) ? ` · 第${keep.floors.findIndex((floor) => floor.monsterIds.includes(monster.id)) + 1}层` : ''}`}
              detail={monster.behavior}
              placed={monster.placed}
              blocked={!monster.placed && placedCount >= slotCap}
              onToggle={() => onKeep(togglePlaced(keep, 'monster', monster.id))}
              onDelete={() => onKeep({ ...keep, monsters: keep.monsters.filter((item) => item.id !== monster.id) })}
            />
          ))}
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold">预设</h2>
          {isTrap && catalogTraps.map((trap) => (
            <button key={trap.id} type="button" onClick={() => onKeep({ ...keep, traps: [...keep.traps, trapFromPreset(trap)] })} className="w-full rounded-lg border border-dashed border-border p-3 text-left text-sm">
              <span className="font-bold">{trap.name}</span>
              <span className="block text-xs text-muted-foreground mt-1">{trap.hint}</span>
            </button>
          ))}
          {!isTrap && catalogMonsters.map((monster) => (
            <button key={monster.id} type="button" onClick={() => onKeep({ ...keep, monsters: [...keep.monsters, monsterFromPreset(monster)] })} className="w-full rounded-lg border border-dashed border-border p-3 text-left text-sm">
              <span className="font-bold">{monster.name}</span>
              <span className="block text-xs text-muted-foreground mt-1">{monster.behavior}</span>
            </button>
          ))}
          {isTrap && catalogTraps.length === 0 && <p className="text-xs text-muted-foreground">预设陷阱都已入库。</p>}
          {!isTrap && catalogMonsters.length === 0 && <p className="text-xs text-muted-foreground">预设魔物都已入库。</p>}
        </section>

        <section className="dungeon-border rounded-xl bg-card p-4 space-y-3">
          <h2 className="text-sm font-bold">自己写，或让模型起稿</h2>
          <textarea value={hint} onChange={(event) => setHint(event.target.value)} placeholder={isTrap ? '例如：只勒住乳和阴蒂的绳，不要插进去' : '例如：一只只舔尿道的小虫，听命令才钻'} className="w-full min-h-16 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <button type="button" onClick={generate} disabled={loading} className="px-3 py-2 rounded-lg border border-primary/40 text-primary text-sm disabled:opacity-40">
            {loading ? <span className="inline-flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" />正在起稿</span> : '让模型起稿'}
          </button>
          {draft && <pre className="whitespace-pre-wrap text-xs text-muted-foreground max-h-48 overflow-auto">{draft}</pre>}
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="名称" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <textarea value={secondary} onChange={(event) => setSecondary(event.target.value)} placeholder={isTrap ? '触发时她身上发生什么' : '外观'} className="w-full min-h-20 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <textarea value={primary} onChange={(event) => setPrimary(event.target.value)} placeholder={isTrap ? '机械摘要：怎么束缚，主要碰哪里' : '行为：听令之后先做什么'} className="w-full min-h-20 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          {error && <p className="text-sm text-yellow-400" role="alert">{error}</p>}
          <button type="button" onClick={saveCustom} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold">入库 · {customCost(isTrap ? 'trap' : 'monster', keep)} 淫髓（自定义上限 {CUSTOM_LIMITS[isTrap ? 'trap' : 'monster']}）</button>
        </section>
      </div>
    </div>
  )
}

function OwnedRow({ name, detail, placed, blocked, onToggle, onDelete }: { name: string; detail: string; placed: boolean; blocked?: boolean; onToggle: () => void; onDelete: () => void }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold">{name}</p>
        <p className="text-xs text-muted-foreground mt-1">{detail}</p>
      </div>
      <button type="button" onClick={onToggle} disabled={blocked} className={`px-2 py-1 rounded text-[11px] border disabled:opacity-40 ${placed ? 'border-primary text-primary' : 'border-border text-muted-foreground'}`}>{placed ? '已布置' : blocked ? '栏位已满' : '布置'}</button>
      <button type="button" onClick={onDelete} className="px-2 py-1 rounded text-[11px] text-muted-foreground">移出</button>
    </div>
  )
}
