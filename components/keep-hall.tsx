'use client'

import { Bug, Settings, Swords } from 'lucide-react'
import { RACE_INFO } from '@/lib/types'
import { buyUpgrade, upgradeCost, type IntruderFate, type KeeperSave, type UpgradeKey } from '@/lib/keeper'
import { FateActions } from '@/components/fate-actions'
import { StatePortrait } from '@/components/state-portrait'

interface KeepHallProps {
  keep: KeeperSave
  onKeep: (keep: KeeperSave) => void
  onEnter: () => void
  onResume: (id: string) => void
  onSettle: (id: string, fate: IntruderFate) => void
  onOpenTraps: () => void
  onOpenMonsters: () => void
  onOpenCollection: () => void
  onOpenArchive: () => void
  onOpenDungeon: () => void
  onOpenSettings: () => void
}

const UPGRADES: { key: UpgradeKey; label: string; max: number; hint: string }[] = [
  { key: 'trapSlots', label: '陷阱栏位', max: 6, hint: '同时布置的件数' },
  { key: 'monsterSlots', label: '魔物栏位', max: 4, hint: '同时放出的只数' },
  { key: 'depth', label: '地下城深度', max: 10, hint: '能把人送到的层' },
  { key: 'monsterRank', label: '魔物强度', max: 5, hint: '同一只更难挣开' },
  { key: 'intruderSlots', label: '在狱格子', max: 3, hint: '同时留下的闯入者' },
]

export function KeepHall({ keep, onKeep, onEnter, onResume, onSettle, onOpenTraps, onOpenMonsters, onOpenCollection, onOpenArchive, onOpenDungeon, onOpenSettings }: KeepHallProps) {
  const placedTraps = keep.traps.filter((trap) => trap.placed).length
  const placedMonsters = keep.monsters.filter((monster) => monster.placed).length
  const full = keep.roster.length >= keep.progress.intruderSlots
  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="max-w-5xl lg:max-w-6xl mx-auto space-y-6">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold gold-text tracking-widest">地下城城主</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl leading-relaxed">
              闯入者自己走进来。调教她们会留下淫髓，用来把狱挖深、把栏位和格子加开。
            </p>
          </div>
          <button type="button" onClick={onOpenSettings} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary text-xs text-muted-foreground">
            <Settings className="w-3.5 h-3.5" />设置
          </button>
        </header>

        <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6 lg:items-start">
        <div className="space-y-6 min-w-0">
        <div className="flex flex-wrap items-end gap-4">
          <label className="block max-w-xs flex-1">
            <span className="text-[11px] tracking-widest text-muted-foreground">地下城的名字</span>
            <input
              value={keep.dungeonName}
              maxLength={24}
              onChange={(event) => onKeep({ ...keep, dungeonName: event.target.value })}
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
            />
          </label>
          <div className="rounded-lg border border-primary/40 bg-card px-4 py-2">
            <p className="text-[11px] tracking-widest text-primary">淫髓</p>
            <p className="text-2xl font-bold tabular-nums">{keep.progress.essence}</p>
          </div>
        </div>

        <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {UPGRADES.map((item) => {
            const value = keep.progress[item.key]
            const cost = upgradeCost(keep.progress, item.key)
            const affordable = cost != null && keep.progress.essence >= cost
            return (
              <button
                key={item.key}
                type="button"
                disabled={!affordable}
                onClick={() => onKeep(buyUpgrade(keep, item.key))}
                className="rounded-xl border border-border bg-card p-3 text-left disabled:opacity-60"
              >
                <p className="text-[11px] text-muted-foreground">{item.label}</p>
                <p className="text-lg font-bold mt-1 tabular-nums">{value}/{item.max}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{item.hint}</p>
                <p className="text-[11px] mt-2 text-primary">{cost == null ? '已满' : affordable ? `花费 ${cost}` : `需要 ${cost}`}</p>
              </button>
            )
          })}
        </section>

        <div className="grid gap-3 lg:grid-cols-2">
        {keep.roster.map((entry) => (
          <section key={entry.id} className="dungeon-border rounded-xl bg-card p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-border bg-secondary flex-shrink-0">
                <StatePortrait character={entry.character} variant="avatar" className="w-full h-full" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{entry.station} · {RACE_INFO[entry.character.race]?.label ?? entry.character.race}</p>
                <p className="font-bold gold-text truncate">{entry.character.name}</p>
                <p className="text-[11px] text-muted-foreground">快感 {entry.character.pleasure} · 第 {entry.character.floor ?? 1} 层</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => onResume(entry.id)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold">继续调教</button>
              <FateActions character={entry.character} onSettle={(fate) => onSettle(entry.id, fate)} />
            </div>
          </section>
        ))}

        <button
          type="button"
          onClick={onEnter}
          disabled={full}
          className="w-full h-full dungeon-border rounded-xl bg-card p-6 text-left disabled:opacity-50"
        >
          <p className="text-xs tracking-widest text-primary">开门</p>
          <p className="text-2xl font-bold mt-1">迎接入侵者</p>
          <p className="text-sm text-muted-foreground mt-2">
            {full
              ? `在狱 ${keep.roster.length}/${keep.progress.intruderSlots}。先把一个人留下、玩坏或放走，或把格子加开。`
              : `在狱 ${keep.roster.length}/${keep.progress.intruderSlots}。进来的人由词表随机生成，你不挑选自己去扮演的那一个。`}
          </p>
        </button>
        </div>

        <div className="dungeon-border rounded-xl bg-card p-4" data-testid="dungeon-card">
          <button type="button" onClick={onOpenDungeon} className="w-full text-left">
            <p className="text-xs tracking-widest text-primary">地城</p>
            <p className="text-lg font-bold mt-1">布置 · 工房 · 图鉴</p>
            <p className="text-sm text-muted-foreground mt-1">陷阱 {placedTraps}/{keep.progress.trapSlots} · 魔物 {placedMonsters}/{keep.progress.monsterSlots} · 库里 {keep.traps.length + keep.monsters.length} 件 · 强度 {keep.progress.monsterRank}/5</p>
          </button>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <button type="button" onClick={onOpenDungeon} className="px-3 py-1 rounded-md border border-border">布置地城</button>
            <button type="button" onClick={onOpenTraps} className="px-3 py-1 rounded-md border border-border">陷阱工房</button>
            <button type="button" onClick={onOpenMonsters} className="px-3 py-1 rounded-md border border-border">魔物工房</button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <button type="button" onClick={onOpenCollection} className="dungeon-border rounded-xl bg-card p-4 text-left">
            <p className="text-xs text-muted-foreground">收藏室</p>
            <p className="text-lg font-bold mt-1">{keep.collection.length} 人</p>
            <p className="text-xs text-muted-foreground mt-2">牢笼里可以进去调教，或只在外面观赏。</p>
          </button>
          <button type="button" onClick={onOpenArchive} className="dungeon-border rounded-xl bg-card p-4 text-left">
            <p className="text-xs text-muted-foreground">档案册</p>
            <p className="text-lg font-bold mt-1">翻看资料</p>
            <p className="text-xs text-muted-foreground mt-2">进过这座狱的人，和还没来的角色库。这里不召人。</p>
          </button>
        </div>
        </div>
        <DungeonOverview keep={keep} />
        </div>
      </div>
    </div>
  )
}

/** 桌面右栏：地下城总览——各层布置、栏位、在狱的人 */
function DungeonOverview({ keep }: { keep: KeeperSave }) {
  const floors = keep.floors.slice(0, keep.progress.depth)
  return (
    <aside className="dungeon-border rounded-xl bg-card p-4 space-y-4 lg:sticky lg:top-4" data-testid="dungeon-overview">
      <div>
        <p className="text-[11px] tracking-widest text-primary">地下城总览</p>
        <p className="text-lg font-bold gold-text mt-0.5 truncate">{keep.dungeonName || '无名淫狱'}</p>
        <p className="text-[11px] text-muted-foreground mt-1">淫髓 {keep.progress.essence} · 深度 {keep.progress.depth} · 魔物强度 {keep.progress.monsterRank}/5</p>
      </div>
      <div className="grid grid-cols-3 gap-1.5 text-center">
        {[
          ['陷阱', keep.traps.filter((t) => t.placed).length, keep.progress.trapSlots],
          ['魔物', keep.monsters.filter((m) => m.placed).length, keep.progress.monsterSlots],
          ['在狱', keep.roster.length, keep.progress.intruderSlots],
        ].map(([label, used, cap]) => (
          <div key={label} className="rounded-lg bg-secondary/60 py-1.5">
            <p className="text-sm font-bold tabular-nums">{used}/{cap}</p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        <p className="text-[11px] tracking-widest text-muted-foreground">各层</p>
        <ol className="space-y-1">
          {floors.map((floor, i) => {
            const here = keep.roster.filter((r) => (r.character.floor ?? 1) === i + 1)
            const traps = floor.trapIds.map((id) => keep.traps.find((t) => t.id === id)?.name).filter(Boolean)
            const monsters = floor.monsterIds.map((id) => keep.monsters.find((m) => m.id === id)?.name).filter(Boolean)
            return (
              <li key={i} className="rounded-md border border-border px-2 py-1.5">
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-primary tabular-nums">{i + 1}</span>
                  <span className="font-bold truncate">{floor.name}</span>
                  <span className="ml-auto flex -space-x-1">
                    {here.map((r) => <StatePortrait key={r.id} character={r.character} variant="avatar" className="w-5 h-5 rounded-full border border-background" />)}
                  </span>
                </div>
                {(traps.length > 0 || monsters.length > 0) ? (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {traps.map((n) => <span key={`t-${n}`} className="inline-flex items-center gap-0.5 text-[10px] text-amber-200/90"><Swords className="w-2.5 h-2.5" />{n}</span>)}
                    {monsters.map((n) => <span key={`m-${n}`} className="inline-flex items-center gap-0.5 text-[10px] text-rose-200/90"><Bug className="w-2.5 h-2.5" />{n}</span>)}
                  </div>
                ) : <p className="mt-0.5 text-[10px] text-muted-foreground/60">空着</p>}
              </li>
            )
          })}
        </ol>
      </div>
    </aside>
  )
}
