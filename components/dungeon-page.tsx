'use client'

// 地城：布置 / 工房 / 图鉴 三个标签合在一页。
// 布置：点库存里的一件，再点一层（桌面可以直接拖）。工房：紧凑卡片 + 详情抽屉 + 自定义弹窗。图鉴：每件撞过谁。
import { useMemo, useState, type DragEvent } from 'react'
import { Loader2, Pencil, Plus, Search, Shield, Star, X } from 'lucide-react'
import { PRESET_TRAPS, TRAP_GROUPS, trapGroup, type AppSettings, type Character } from '@/lib/types'
import { chatStream } from '@/lib/dzmm'
import { buildMonsterPrompt, buildWorkshopTrapPrompt } from '@/lib/prompts'
import {
  PRESET_MONSTERS, TEMP_MONSTER_COST, encounterId, floorBonus, floorThemed, levelUpTrap, monsterFromPreset, pinchMonster, setGuard,
  stuffDefense, trapFromPreset, triggerChance, unstuffDefense, type KeeperMonster, type KeeperSave, type KeeperTrap,
} from '@/lib/keeper'
import { CUSTOM_LIMITS, customBlock, customCost, floorSynergies } from '@/lib/synergy'
import {
  CATEGORY_SHEET, FLOOR_MONSTER_CAP, FLOOR_TRAP_CAP, LEVEL_RULES, TRAP_CATEGORIES, groupIcon, guessCategory, hitPreview, levelUpBlock,
  nextLevelRule, statusById, trapCategory, trapHabit, trapStatusId, type HitPreview,
} from '@/lib/trap-craft'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export type DungeonTab = 'layout' | 'workshop' | 'codex'
type Kind = 'trap' | 'monster'
type Pick = { kind: Kind; id: string }

interface DungeonPageProps {
  keep: KeeperSave
  settings: AppSettings
  onKeep: (keep: KeeperSave) => void
  onBack: () => void
  initialTab?: DungeonTab
  initialKind?: Kind
}

const TABS: { id: DungeonTab; label: string }[] = [{ id: 'layout', label: '布置' }, { id: 'workshop', label: '工房' }, { id: 'codex', label: '图鉴' }]

function section(text: string, title: string): string {
  const match = text.match(new RegExp(`【${title}】\\s*([\\s\\S]*?)(?=【|$)`))
  return (match?.[1] ?? '').trim()
}

function floorOf(keep: KeeperSave, kind: Kind, id: string): number {
  return keep.floors.findIndex((floor) => (kind === 'trap' ? floor.trapIds : floor.monsterIds).includes(id))
}

function Dots({ score }: { score: number }) {
  return <span className="tabular-nums text-fuchsia-300" title={`命中 ${score}/3`}>{'●'.repeat(score)}<span className="text-muted-foreground/40">{'●'.repeat(3 - score)}</span></span>
}

export function DungeonPage({ keep, settings, onKeep, onBack, initialTab = 'layout', initialKind = 'trap' }: DungeonPageProps) {
  const [tab, setTab] = useState<DungeonTab>(initialTab)
  const [picked, setPicked] = useState<Pick | null>(null)
  const [previewId, setPreviewId] = useState<string>('')
  const [notice, setNotice] = useState('')
  const [editFloor, setEditFloor] = useState<number | null>(null)
  const [editTemper, setEditTemper] = useState(false)
  const [kind, setKind] = useState<Kind>(initialKind)
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('全部')
  const [sort, setSort] = useState<'default' | 'category' | 'owned' | 'hit'>('default')
  const [detail, setDetail] = useState<Pick | null>(null)
  const [creator, setCreator] = useState(false)
  const [tempOpen, setTempOpen] = useState(false)

  const target: Character | null = useMemo(() => {
    const entry = keep.roster.find((item) => item.id === (previewId || keep.activeId)) ?? keep.roster[0]
    return entry?.character ?? null
  }, [keep.roster, keep.activeId, previewId])
  const hitOf = (trap: KeeperTrap): HitPreview | null => (target ? hitPreview(trap, target) : null)

  const placedTraps = keep.traps.filter((trap) => trap.placed).length
  const placedMonsters = keep.monsters.filter((monster) => monster.placed).length

  const place = (pick: Pick, floorIndex: number) => {
    const next = stuffDefense(keep, floorIndex, pick.kind, pick.id)
    if (next === keep) {
      const list = pick.kind === 'trap' ? keep.traps : keep.monsters
      const item = list.find((row) => row.id === pick.id)
      const cap = pick.kind === 'trap' ? keep.progress.trapSlots : keep.progress.monsterSlots
      setNotice(item && !item.placed && list.filter((row) => row.placed).length >= cap
        ? `${pick.kind === 'trap' ? '陷阱' : '魔物'}栏位满了（${cap}）。先取出一件，或到城主厅加栏位。`
        : `第 ${floorIndex + 1} 层的${pick.kind === 'trap' ? `陷阱位（${FLOOR_TRAP_CAP}）` : `魔物位（${FLOOR_MONSTER_CAP}）`}满了。`)
      return
    }
    setNotice('')
    setPicked(null)
    onKeep(next)
  }

  const onDrop = (event: DragEvent, floorIndex: number) => {
    event.preventDefault()
    const [k, id] = event.dataTransfer.getData('text/plain').split(':')
    if ((k === 'trap' || k === 'monster') && id) place({ kind: k, id }, floorIndex)
  }

  const header = (
    <div className="space-y-3">
      <button type="button" onClick={onBack} className="text-xs text-muted-foreground">回到城主厅</button>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-bold gold-text">地城</h1>
        <div role="tablist" aria-label="地城" className="flex rounded-lg border border-border p-0.5 bg-card">
          {TABS.map((item) => (
            <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)}
              className={cn('px-4 py-1.5 text-sm rounded-md', tab === item.id ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground')}>{item.label}</button>
          ))}
        </div>
      </div>
      <div data-testid="slot-usage" className="flex flex-wrap gap-1.5 text-[11px]">
        <span className="px-2 py-0.5 rounded-full border border-border">陷阱 {placedTraps}/{keep.progress.trapSlots}</span>
        <span className="px-2 py-0.5 rounded-full border border-border">魔物 {placedMonsters}/{keep.progress.monsterSlots}</span>
        <span className="px-2 py-0.5 rounded-full border border-border text-muted-foreground">每层 陷阱≤{FLOOR_TRAP_CAP} · 魔物≤{FLOOR_MONSTER_CAP}</span>
        <span className="px-2 py-0.5 rounded-full border border-amber-500/30 text-amber-200">淫髓 {keep.progress.essence}</span>
        {keep.roster.length > 0 && (
          <label className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-fuchsia-400/30 text-fuchsia-200">
            命中预览
            <select aria-label="命中预览对象" value={previewId || keep.activeId || keep.roster[0]?.id || ''} onChange={(event) => setPreviewId(event.target.value)} className="bg-transparent outline-none">
              {keep.roster.map((entry) => <option key={entry.id} value={entry.id} className="bg-background">{entry.character.name}</option>)}
            </select>
          </label>
        )}
      </div>
      {notice && <p className="text-xs text-amber-200" role="status">{notice}</p>}
    </div>
  )

  const stockChip = (pickKind: Kind, item: KeeperTrap | KeeperMonster) => {
    const floor = floorOf(keep, pickKind, item.id)
    const active = picked?.kind === pickKind && picked.id === item.id
    const trap = pickKind === 'trap' ? item as KeeperTrap : null
    return (
      <button key={`${pickKind}-${item.id}`} type="button" draggable aria-pressed={active}
        onDragStart={(event) => event.dataTransfer.setData('text/plain', `${pickKind}:${item.id}`)}
        onClick={() => setPicked(active ? null : { kind: pickKind, id: item.id })}
        className={cn('flex-shrink-0 lg:w-full flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-left text-xs', active ? 'border-primary bg-primary/15 text-primary' : 'border-border bg-card')}>
        <span aria-hidden>{trap ? groupIcon(trapCategory(trap)) : '👾'}</span>
        <span className="font-bold truncate max-w-[9rem]">{item.name}</span>
        {trap && (trap.level ?? 1) > 1 && <span className="text-[10px] text-amber-300">Lv{trap.level}</span>}
        <span className="text-[10px] text-muted-foreground ml-auto pl-1">{floor >= 0 ? `第${floor + 1}层` : '库中'}</span>
      </button>
    )
  }

  const layout = (
    <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-6 lg:items-start">
      <div className="space-y-3 lg:order-1">
        <div className="rounded-xl border border-border bg-card/60 px-3 py-2 text-sm">
          {editTemper ? (
            <div className="space-y-2">
              <input aria-label="地城名字" value={keep.dungeonName} maxLength={24} onChange={(event) => onKeep({ ...keep, dungeonName: event.target.value })} className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm font-bold" />
              <textarea aria-label="这座狱的脾气" value={keep.dungeonDescription} maxLength={400} onChange={(event) => onKeep({ ...keep, dungeonDescription: event.target.value })} placeholder="例如：整座狱又湿又窄，墙缝里都是温热的粘液。" className="w-full min-h-16 rounded-md border border-border bg-background px-2 py-1 text-xs" />
              <button type="button" onClick={() => setEditTemper(false)} className="text-xs text-primary">完成</button>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1"><p className="font-bold">{keep.dungeonName}</p><p className="text-[11px] text-muted-foreground line-clamp-1">{keep.dungeonDescription || '还没写这座狱的脾气。'}</p></div>
              <button type="button" aria-label="编辑地城名字和脾气" onClick={() => setEditTemper(true)} className="p-1 text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
            </div>
          )}
        </div>
        <ol className="space-y-2" data-testid="floor-map">
          {keep.floors.map((floor, index) => {
            const combos = floorSynergies(keep, index + 1)
            const themed = floorThemed(keep, index + 1)
            const bonus = floorBonus(keep, index + 1)
            const traps = floor.trapIds.map((id) => keep.traps.find((t) => t.id === id)).filter((t): t is KeeperTrap => !!t)
            const monsters = floor.monsterIds.map((id) => keep.monsters.find((m) => m.id === id)).filter((m): m is KeeperMonster => !!m)
            const canDrop = picked && (picked.kind === 'trap' ? traps.length < FLOOR_TRAP_CAP || floor.trapIds.includes(picked.id) : monsters.length < FLOOR_MONSTER_CAP || floor.monsterIds.includes(picked.id))
            return (
              <li key={index} data-testid="floor-card" onDragOver={(event) => event.preventDefault()} onDrop={(event) => onDrop(event, index)}
                className={cn('rounded-xl border bg-card p-3 space-y-2', picked && canDrop ? 'border-primary/60 ring-1 ring-primary/30' : 'border-border')}>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold tabular-nums text-sm w-5 flex-shrink-0">{index + 1}</span>
                  {editFloor === index ? (
                    <div className="flex-1 space-y-1.5">
                      <input aria-label={`第${index + 1}层名字`} value={floor.name} maxLength={24} onChange={(event) => onKeep(renameFloor(keep, index, { name: event.target.value }))} className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm font-bold" />
                      <textarea aria-label={`第${index + 1}层环境`} value={floor.ambience} maxLength={240} onChange={(event) => onKeep(renameFloor(keep, index, { ambience: event.target.value }))} className="w-full min-h-14 rounded-md border border-border bg-background px-2 py-1 text-xs" />
                      <button type="button" onClick={() => setEditFloor(null)} className="text-xs text-primary">完成</button>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold">{floor.name}</p>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">{floor.ambience}</p>
                    </div>
                  )}
                  {editFloor !== index && <button type="button" aria-label={`编辑第${index + 1}层`} onClick={() => setEditFloor(index)} className="p-1 text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>}
                </div>
                {(combos.length > 0 || themed.length > 0) && (
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    {combos.length > 0 && <span data-testid="synergy" className="px-1.5 py-0.5 rounded border border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-100">连携 +{Math.round(bonus.synergy * 100)}% 淫髓：{combos.map((c) => c.name).join('、')}</span>}
                    {themed.length > 0 && <span data-testid="theme-bonus" className="px-1.5 py-0.5 rounded border border-emerald-400/40 bg-emerald-500/10 text-emerald-100">主题契合 · 触发 {Math.round(triggerChance(keep, index + 1) * 100)}% · +{Math.round(bonus.theme * 100)}%</span>}
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: FLOOR_TRAP_CAP }, (_, slot) => {
                    const trap = traps[slot]
                    if (!trap) return <span key={`t${slot}`} className="px-2 py-1 rounded-md border border-dashed border-border text-[11px] text-muted-foreground/60">陷阱位</span>
                    const hit = hitOf(trap)
                    return (
                      <span key={trap.id} className="flex items-center gap-1 px-2 py-1 rounded-md border border-border bg-secondary/40 text-[11px]">
                        <span aria-hidden>{groupIcon(trapCategory(trap))}</span><button type="button" onClick={() => setDetail({ kind: 'trap', id: trap.id })} className="font-bold">{trap.name}</button>
                        {(trap.level ?? 1) > 1 && <span className="text-amber-300">Lv{trap.level}</span>}
                        {hit && <Dots score={hit.score} />}
                        <button type="button" aria-label={`取出${trap.name}`} onClick={() => onKeep(unstuffDefense(keep, 'trap', trap.id))} className="text-muted-foreground"><X className="w-3 h-3" /></button>
                      </span>
                    )
                  })}
                  {Array.from({ length: FLOOR_MONSTER_CAP }, (_, slot) => {
                    const monster = monsters[slot]
                    if (!monster) return <span key={`m${slot}`} className="px-2 py-1 rounded-md border border-dashed border-border text-[11px] text-muted-foreground/60">魔物位</span>
                    const guard = floor.guardId === monster.id
                    return (
                      <span key={monster.id} className="flex items-center gap-1 px-2 py-1 rounded-md border border-border bg-secondary/40 text-[11px]">
                        <span aria-hidden>👾</span><span className="font-bold">{monster.temporary ? '临时·' : ''}{monster.name}</span>
                        <button type="button" aria-pressed={guard} title={guard ? '守在这一层：她在这层时先出场' : '设为守层'} aria-label={`${monster.name}守层`} onClick={() => onKeep(setGuard(keep, index, guard ? null : monster.id))} className={guard ? 'text-amber-300' : 'text-muted-foreground'}>
                          {guard ? <Shield className="w-3 h-3" /> : <Star className="w-3 h-3" />}
                        </button>
                        <button type="button" aria-label={`取出${monster.name}`} onClick={() => onKeep(unstuffDefense(keep, 'monster', monster.id))} className="text-muted-foreground"><X className="w-3 h-3" /></button>
                      </span>
                    )
                  })}
                </div>
                {picked && (
                  <button type="button" disabled={!canDrop} onClick={() => place(picked, index)} className="w-full rounded-md border border-primary/50 bg-primary/10 py-1.5 text-xs text-primary font-bold disabled:opacity-40">
                    {canDrop ? `放到第 ${index + 1} 层` : '这一层满了'}
                  </button>
                )}
              </li>
            )
          })}
        </ol>
        <button type="button" onClick={() => setTempOpen(true)} className="text-xs text-muted-foreground flex items-center gap-1"><Plus className="w-3.5 h-3.5" />临时捏一只魔物（{TEMP_MONSTER_COST} 淫髓，取出就散）</button>
      </div>
      <aside className="lg:order-2 lg:sticky lg:top-4 space-y-2" data-testid="stock-tray">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">库存</h2>
          <span className="text-[10px] text-muted-foreground">{picked ? '再点一层放下' : '先点一件，再点一层；桌面可以拖'}</span>
        </div>
        {keep.traps.length + keep.monsters.length === 0 ? (
          <p className="text-xs text-muted-foreground">库里还空着。<button type="button" onClick={() => setTab('workshop')} className="text-primary">去工房入库</button></p>
        ) : (
          <div className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            {keep.traps.map((trap) => stockChip('trap', trap))}
            {keep.monsters.map((monster) => stockChip('monster', monster))}
          </div>
        )}
      </aside>
    </div>
  )

  // ---------- 工房 ----------
  type Card = { kind: Kind; id: string; name: string; category: string; line: string; owned: boolean; trap?: KeeperTrap; monster?: KeeperMonster; hit: HitPreview | null }
  const cards: Card[] = useMemo(() => {
    if (kind === 'trap') {
      const owned = keep.traps
      const catalog = PRESET_TRAPS.filter((preset) => !owned.some((trap) => trap.id === preset.id)).map(trapFromPreset)
      return [...owned, ...catalog].map((trap) => {
        const category = trapCategory(trap)
        return { kind: 'trap' as const, id: trap.id, name: trap.name, category, line: `${category} · ${statusById(trapStatusId(trap))?.title ?? ''}`, owned: owned.includes(trap), trap, hit: target ? hitPreview(trap, target) : null }
      })
    }
    const owned = keep.monsters
    const catalog = PRESET_MONSTERS.filter((preset) => !owned.some((monster) => monster.id === preset.id)).map(monsterFromPreset)
    return [...owned, ...catalog].map((monster) => ({ kind: 'monster' as const, id: monster.id, name: monster.name, category: '魔物', line: monster.behavior, owned: owned.includes(monster), monster, hit: null }))
  }, [kind, keep.traps, keep.monsters, target])
  const groups = ['全部', ...TRAP_GROUPS.map((g) => g.label)]
  const shown = cards
    .filter((card) => kind !== 'trap' || group === '全部' || trapGroup(card.category) === group)
    .filter((card) => !query.trim() || `${card.name} ${card.line} ${card.trap?.mechanism ?? ''} ${card.monster?.behavior ?? ''}`.includes(query.trim()))
    .sort((a, b) => sort === 'category' ? a.category.localeCompare(b.category, 'zh') : sort === 'owned' ? Number(b.owned) - Number(a.owned) : sort === 'hit' ? (b.hit?.score ?? 0) - (a.hit?.score ?? 0) : 0)

  const workshop = (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-border p-0.5">
          {(['trap', 'monster'] as const).map((k) => (
            <button key={k} type="button" aria-pressed={kind === k} onClick={() => { setKind(k); setGroup('全部') }} className={cn('px-3 py-1 text-xs rounded-md', kind === k ? 'bg-secondary text-foreground font-bold' : 'text-muted-foreground')}>{k === 'trap' ? '陷阱' : '魔物'}</button>
          ))}
        </div>
        <label className="flex items-center gap-1.5 flex-1 min-w-[10rem] rounded-lg border border-border bg-card px-2 py-1">
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索名称或描述" aria-label="搜索" className="flex-1 bg-transparent text-xs outline-none" />
        </label>
        <select aria-label="排序" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className="rounded-lg border border-border bg-card px-2 py-1 text-xs">
          <option value="default">默认</option><option value="category">按类别</option><option value="owned">已入库优先</option>{target && kind === 'trap' && <option value="hit">命中优先</option>}
        </select>
        <button type="button" onClick={() => setCreator(true)} className="flex items-center gap-1 rounded-lg border border-primary/40 px-2.5 py-1 text-xs text-primary"><Plus className="w-3.5 h-3.5" />自定义</button>
      </div>
      {kind === 'trap' && (
        <div className="flex flex-wrap gap-1.5">
          {groups.map((label) => (
            <button key={label} type="button" onClick={() => setGroup(label)} aria-pressed={group === label}
              className={cn('px-2.5 py-0.5 rounded-full border text-[11px]', group === label ? 'border-primary bg-primary/15 text-primary' : 'border-border text-muted-foreground')}>{label}</button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2" data-testid="workshop-grid">
        {shown.map((card) => (
          <button key={`${card.kind}-${card.id}`} type="button" onClick={() => setDetail({ kind: card.kind, id: card.id })}
            className={cn('rounded-lg border p-2.5 text-left', card.owned ? 'border-primary/40 bg-card' : 'border-dashed border-border')}>
            <span className="flex items-center gap-1.5 text-sm">
              <span aria-hidden>{card.kind === 'trap' ? groupIcon(card.category) : '👾'}</span>
              <span className="font-bold truncate">{card.name}</span>
              {card.owned && <span className="ml-auto text-[10px] text-primary flex-shrink-0">{card.trap ? `Lv${card.trap.level ?? 1}` : '入库'}</span>}
            </span>
            <span className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="truncate">{card.line}</span>
              {card.hit && <span className="ml-auto flex-shrink-0"><Dots score={card.hit.score} /></span>}
            </span>
          </button>
        ))}
        {shown.length === 0 && <p className="col-span-full text-xs text-muted-foreground">没有符合的条目。</p>}
      </div>
    </div>
  )

  // ---------- 图鉴 ----------
  const history = keep.history ?? []
  const codex = (
    <div className="space-y-3" data-testid="codex">
      {keep.traps.length + keep.monsters.length === 0 && <p className="text-xs text-muted-foreground">库里还没有东西。</p>}
      <div className="grid gap-2 md:grid-cols-2">
        {[...keep.traps.map((t) => ({ kind: 'trap' as const, item: t })), ...keep.monsters.map((m) => ({ kind: 'monster' as const, item: m }))].map(({ kind: k, item }) => {
          const rows = history.filter((row) => row.id === item.id)
          const trap = k === 'trap' ? item as KeeperTrap : null
          return (
            <div key={`${k}-${item.id}`} className="rounded-lg border border-border bg-card p-3 text-xs space-y-1">
              <div className="flex items-center gap-1.5">
                <span aria-hidden>{trap ? groupIcon(trapCategory(trap)) : '👾'}</span>
                <button type="button" onClick={() => setDetail({ kind: k, id: item.id })} className="font-bold text-sm">{item.name}</button>
                {trap && <span className="ml-auto text-amber-300">Lv{trap.level ?? 1} · 撞上 {trap.hits ?? 0} 次</span>}
              </div>
              {trap && <p className="text-muted-foreground">习性：{trapHabit(trap)}</p>}
              {rows.length ? (
                <ul className="text-muted-foreground space-y-0.5">{rows.slice(0, 4).map((row, i) => <li key={i}>第{row.floor}层 · {row.intruder || '无名'} · {row.at ? new Date(row.at).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</li>)}</ul>
              ) : <p className="text-muted-foreground/70">还没有人撞上过。</p>}
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="max-w-3xl lg:max-w-6xl mx-auto space-y-4">
        {header}
        {tab === 'layout' && layout}
        {tab === 'workshop' && workshop}
        {tab === 'codex' && codex}
      </div>
      <DetailDrawer pick={detail} keep={keep} target={target} onClose={() => setDetail(null)} onKeep={onKeep} onNotice={setNotice} />
      <CreatorDialog open={creator} kind={kind} keep={keep} settings={settings} onClose={() => setCreator(false)} onKeep={onKeep} />
      <TempMonsterDialog open={tempOpen} keep={keep} onClose={() => setTempOpen(false)} onKeep={onKeep} />
    </div>
  )
}

function renameFloor(keep: KeeperSave, index: number, patch: { name?: string; ambience?: string }): KeeperSave {
  return { ...keep, floors: keep.floors.map((floor, floorIndex) => floorIndex === index ? { ...floor, ...patch } : floor) }
}

function DetailDrawer({ pick, keep, target, onClose, onKeep, onNotice }: { pick: Pick | null; keep: KeeperSave; target: Character | null; onClose: () => void; onKeep: (keep: KeeperSave) => void; onNotice: (text: string) => void }) {
  const [floorIndex, setFloorIndex] = useState(0)
  const ownedTrap = pick?.kind === 'trap' ? keep.traps.find((t) => t.id === pick.id) : undefined
  const ownedMonster = pick?.kind === 'monster' ? keep.monsters.find((m) => m.id === pick.id) : undefined
  const presetTrap = pick?.kind === 'trap' && !ownedTrap ? PRESET_TRAPS.find((t) => t.id === pick.id) : undefined
  const presetMonster = pick?.kind === 'monster' && !ownedMonster ? PRESET_MONSTERS.find((m) => m.id === pick.id) : undefined
  const trap = ownedTrap ?? (presetTrap ? trapFromPreset(presetTrap) : undefined)
  const monster = ownedMonster ?? (presetMonster ? monsterFromPreset(presetMonster) : undefined)
  const owned = !!(ownedTrap || ownedMonster)
  const name = trap?.name ?? monster?.name ?? ''
  const sheet = trap ? CATEGORY_SHEET[trapCategory(trap)] : null
  const hit = trap && target ? hitPreview(trap, target) : null
  const floor = pick ? floorOf(keep, pick.kind, pick.id) : -1

  const stock = (andPlace: boolean) => {
    if (!pick) return
    let next = trap ? { ...keep, traps: [...keep.traps, trap] } : monster ? { ...keep, monsters: [...keep.monsters, monster] } : keep
    if (andPlace) {
      const placed = stuffDefense(next, floorIndex, pick.kind, pick.id)
      if (placed === next) onNotice(`没能放进第 ${floorIndex + 1} 层：栏位或这层满了，已先入库。`)
      next = placed
    }
    onKeep(next)
    onClose()
  }

  return (
    <Sheet open={!!pick} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto" data-testid="item-detail">
        <SheetHeader>
          <SheetTitle>{trap ? groupIcon(trapCategory(trap)) : '👾'} {name}</SheetTitle>
          <SheetDescription>{trap ? `${trapCategory(trap)} · 撞上附带「${statusById(trapStatusId(trap))?.title ?? ''}」` : '魔物'}{owned ? ` · 已入库${floor >= 0 ? ` · 第${floor + 1}层` : ''}` : ''}</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6 space-y-3 text-sm">
          {trap && <p className="text-muted-foreground">{trap.mechanism}</p>}
          {trap?.prose && <p className="text-xs text-muted-foreground/80 whitespace-pre-wrap">{trap.prose}</p>}
          {monster && <><p className="text-xs text-muted-foreground">{monster.appearance}</p><p className="text-muted-foreground">{monster.behavior}</p></>}
          {trap && sheet && (
            <dl className="text-xs space-y-1 rounded-lg border border-border p-2.5">
              <div><dt className="inline text-primary">习性　</dt><dd className="inline">{trapHabit(trap)}</dd></div>
              <div><dt className="inline text-primary">感官　</dt><dd className="inline">{sheet.sense}</dd></div>
              <div><dt className="inline text-primary">加码　</dt><dd className="inline">{sheet.escalate.join('／')}</dd></div>
              <div><dt className="inline text-primary">不会　</dt><dd className="inline">{sheet.ban}</dd></div>
            </dl>
          )}
          {hit && target && (
            <div className="rounded-lg border border-fuchsia-400/30 bg-fuchsia-500/5 p-2.5 text-xs space-y-1" data-testid="hit-preview">
              <p className="font-bold text-fuchsia-200">对 {target.name} 的命中 <Dots score={hit.score} /></p>
              <p>{hit.parts.map((p) => `${p.label} Lv${p.level}${p.weak ? '（死穴 ✓）' : ''}`).join(' · ') || '全身'}</p>
              {hit.raceNote && <p className={hit.race === 'weak' ? 'text-emerald-300' : 'text-amber-300'}>{hit.race === 'weak' ? '种族克制：' : '种族抗性：'}{hit.raceNote}</p>}
            </div>
          )}
          {ownedTrap && (
            <div className="rounded-lg border border-amber-500/30 p-2.5 text-xs space-y-1.5" data-testid="level-up">
              <p>Lv{ownedTrap.level ?? 1} · 已撞上 {ownedTrap.hits ?? 0} 次</p>
              {nextLevelRule(ownedTrap) ? (
                <>
                  <p className="text-muted-foreground">下一级：{nextLevelRule(ownedTrap)!.gain}（需撞上 {nextLevelRule(ownedTrap)!.hits} 次，{nextLevelRule(ownedTrap)!.cost} 淫髓）</p>
                  <button type="button" disabled={!!levelUpBlock(ownedTrap, keep.progress.essence)} onClick={() => onKeep(levelUpTrap(keep, ownedTrap.id))} className="px-3 py-1 rounded-md bg-amber-500/80 text-black font-bold disabled:opacity-40">升级</button>
                  {levelUpBlock(ownedTrap, keep.progress.essence) && <span className="ml-2 text-muted-foreground">{levelUpBlock(ownedTrap, keep.progress.essence)}</span>}
                </>
              ) : <p className="text-muted-foreground">已满级：{LEVEL_RULES.map((r) => r.gain).join('；')}</p>}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <select aria-label="放到哪一层" value={floorIndex} onChange={(event) => setFloorIndex(Number(event.target.value))} className="rounded-md border border-border bg-background px-2 py-1 text-xs">
              {keep.floors.map((f, index) => <option key={index} value={index}>第 {index + 1} 层 · {f.name}</option>)}
            </select>
            {!owned && <>
              <button type="button" onClick={() => stock(true)} className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-bold">入库并放下</button>
              <button type="button" onClick={() => stock(false)} className="px-3 py-1.5 rounded-md border border-border text-xs">只入库</button>
            </>}
            {owned && pick && <>
              <button type="button" onClick={() => { const next = stuffDefense(keep, floorIndex, pick.kind, pick.id); if (next === keep) onNotice('栏位或这一层满了。'); else onKeep(next) }} className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-bold">放到这一层</button>
              {floor >= 0 && <button type="button" onClick={() => onKeep(unstuffDefense(keep, pick.kind, pick.id))} className="px-3 py-1.5 rounded-md border border-border text-xs">取出</button>}
              <button type="button" onClick={() => { onKeep(pick.kind === 'trap' ? { ...unstuffDefense(keep, 'trap', pick.id), traps: keep.traps.filter((t) => t.id !== pick.id) } : { ...unstuffDefense(keep, 'monster', pick.id), monsters: keep.monsters.filter((m) => m.id !== pick.id) }); onClose() }} className="px-3 py-1.5 rounded-md text-xs text-muted-foreground">移出库</button>
            </>}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function CreatorDialog({ open, kind, keep, settings, onClose, onKeep }: { open: boolean; kind: Kind; keep: KeeperSave; settings: AppSettings; onClose: () => void; onKeep: (keep: KeeperSave) => void }) {
  const isTrap = kind === 'trap'
  const [hint, setHint] = useState('')
  const [name, setName] = useState('')
  const [primary, setPrimary] = useState('')
  const [secondary, setSecondary] = useState('')
  const [habit, setHabit] = useState('')
  const [category, setCategory] = useState('')
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generate = async () => {
    setLoading(true); setError(''); setDraft('')
    const prompt = isTrap ? buildWorkshopTrapPrompt(settings.proseStyle, hint, [], category) : buildMonsterPrompt(settings.proseStyle, hint)
    try {
      let full = ''
      await chatStream({ messages: [{ role: 'user', content: prompt }], model: settings.chatModel, apiKey: settings.chatApiKey, grokApiKey: settings.grokApiKey }, (delta) => { full += delta; setDraft(full) })
      if (isTrap) {
        setName(section(full, '陷阱名称')); setSecondary(section(full, '触发描写')); setPrimary(section(full, '机械摘要')); setHabit(section(full, '习性'))
      } else {
        setName(section(full, '魔物名称')); setSecondary(section(full, '外观')); setPrimary(section(full, '行为') || section(full, '机械摘要'))
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally { setLoading(false) }
  }

  const save = () => {
    const trimmedName = name.trim(); const trimmedPrimary = primary.trim()
    if (!trimmedName || !trimmedPrimary) { setError(isTrap ? '要有名称和机械摘要，才能入库。' : '要有名称和行为，才能入库。'); return }
    const blockedBy = customBlock(kind, keep)
    if (blockedBy) { setError(blockedBy); return }
    const paid = { ...keep, progress: { ...keep.progress, essence: keep.progress.essence - customCost(kind, keep) } }
    const id = encounterId(`custom_${crypto.randomUUID().replace(/-/g, '')}`)
    if (isTrap) {
      const cat = category || guessCategory(`${trimmedName} ${trimmedPrimary}`)
      const trap: KeeperTrap = { id, name: trimmedName.slice(0, 40), mechanism: trimmedPrimary.slice(0, 400), prose: secondary.trim().slice(0, 800), placed: false, source: 'custom', category: cat, status: CATEGORY_SHEET[cat].status, habit: habit.trim().slice(0, 80) || CATEGORY_SHEET[cat].habit, level: 1, hits: 0 }
      onKeep({ ...paid, traps: [...paid.traps, trap] })
    } else {
      const monster: KeeperMonster = { id, name: trimmedName.slice(0, 40), appearance: secondary.trim().slice(0, 240), behavior: trimmedPrimary.slice(0, 400), placed: false, source: 'custom' }
      onKeep({ ...paid, monsters: [...paid.monsters, monster] })
    }
    setName(''); setPrimary(''); setSecondary(''); setHabit(''); setDraft(''); setError(''); setHint('')
    onClose()
  }

  const field = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm'
  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) onClose() }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto" data-testid="creator">
        <DialogHeader>
          <DialogTitle>自定义{isTrap ? '陷阱' : '魔物'}</DialogTitle>
          <DialogDescription>入库 {customCost(kind, keep)} 淫髓，自定义上限 {CUSTOM_LIMITS[kind]} 件。自己写，或让模型起稿。</DialogDescription>
        </DialogHeader>
        <div className="space-y-2.5">
          <textarea value={hint} onChange={(event) => setHint(event.target.value)} placeholder={isTrap ? '例如：只勒住乳和阴蒂的绳，不要插进去' : '例如：一只只舔尿道的小虫，听命令才钻'} className={cn(field, 'min-h-14')} />
          {isTrap && (
            <select aria-label="类别" value={category} onChange={(event) => setCategory(event.target.value)} className={field}>
              <option value="">类别：按描述自动判断</option>
              {TRAP_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat} · 附带{statusById(CATEGORY_SHEET[cat].status)?.title}</option>)}
            </select>
          )}
          <button type="button" onClick={generate} disabled={loading} className="px-3 py-1.5 rounded-lg border border-primary/40 text-primary text-sm disabled:opacity-40">
            {loading ? <span className="inline-flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" />正在起稿</span> : '让模型起稿'}
          </button>
          {draft && <pre className="whitespace-pre-wrap text-xs text-muted-foreground max-h-32 overflow-auto">{draft}</pre>}
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="名称" className={field} />
          <textarea value={secondary} onChange={(event) => setSecondary(event.target.value)} placeholder={isTrap ? '触发时她身上发生什么' : '外观'} className={cn(field, 'min-h-16')} />
          <textarea value={primary} onChange={(event) => setPrimary(event.target.value)} placeholder={isTrap ? '机械摘要：怎么束缚，主要碰哪里' : '行为：听令之后先做什么'} className={cn(field, 'min-h-16')} />
          {isTrap && <input value={habit} onChange={(event) => setHabit(event.target.value)} placeholder="习性：比如耐心、贪婪、戏弄（可空，按类别默认）" className={field} />}
          {error && <p className="text-sm text-yellow-400" role="alert">{error}</p>}
          <button type="button" onClick={save} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold">入库 · {customCost(kind, keep)} 淫髓</button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function TempMonsterDialog({ open, keep, onClose, onKeep }: { open: boolean; keep: KeeperSave; onClose: () => void; onKeep: (keep: KeeperSave) => void }) {
  const [name, setName] = useState('')
  const [behavior, setBehavior] = useState('')
  const [appearance, setAppearance] = useState('')
  const [floorIndex, setFloorIndex] = useState(0)
  const [notice, setNotice] = useState('')
  const placed = keep.monsters.filter((m) => m.placed).length
  const can = keep.progress.essence >= TEMP_MONSTER_COST && placed < keep.progress.monsterSlots && keep.floors[floorIndex]?.monsterIds.length < FLOOR_MONSTER_CAP && name.trim() && behavior.trim()
  const pinch = () => {
    const next = pinchMonster(keep, floorIndex, { name, behavior, appearance })
    if (!next) { setNotice(keep.progress.essence < TEMP_MONSTER_COST ? `临时捏怪要 ${TEMP_MONSTER_COST} 淫髓。` : '魔物栏位满了，先取出一只。'); return }
    onKeep(next); setName(''); setBehavior(''); setAppearance(''); setNotice(''); onClose()
  }
  const field = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm'
  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>临时捏一只魔物</DialogTitle>
          <DialogDescription>花费 {TEMP_MONSTER_COST} 淫髓。它不入库，取出就散。淫髓 {keep.progress.essence}，魔物栏位 {placed}/{keep.progress.monsterSlots}。</DialogDescription>
        </DialogHeader>
        <div className="space-y-2.5">
          <select value={floorIndex} onChange={(event) => setFloorIndex(Number(event.target.value))} className={field}>
            {keep.floors.map((floor, index) => <option key={index} value={index}>塞进第 {index + 1} 层 · {floor.name}</option>)}
          </select>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="名字" className={field} />
          <textarea value={appearance} onChange={(event) => setAppearance(event.target.value)} placeholder="外观，可空" className={cn(field, 'min-h-14')} />
          <textarea value={behavior} onChange={(event) => setBehavior(event.target.value)} placeholder="听令之后先做什么" className={cn(field, 'min-h-14')} />
          {notice && <p className="text-sm text-amber-200">{notice}</p>}
          <button type="button" onClick={pinch} disabled={!can} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40">花费 {TEMP_MONSTER_COST} 淫髓塞进去</button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
