'use client'

import { Settings } from 'lucide-react'
import { RACE_INFO } from '@/lib/types'
import { buyUpgrade, upgradeCost, type IntruderFate, type KeeperSave, type UpgradeKey } from '@/lib/keeper'
import { FateActions } from '@/components/fate-actions'

interface KeepHallProps {
  keep: KeeperSave
  onKeep: (keep: KeeperSave) => void
  onEnter: () => void
  onResume: (id: string) => void
  onSettle: (id: string, fate: IntruderFate) => void
  onOpenTraps: () => void
  onOpenMonsters: () => void
  onOpenCollection: () => void
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

export function KeepHall({ keep, onKeep, onEnter, onResume, onSettle, onOpenTraps, onOpenMonsters, onOpenCollection, onOpenDungeon, onOpenSettings }: KeepHallProps) {
  const placedTraps = keep.traps.filter((trap) => trap.placed).length
  const placedMonsters = keep.monsters.filter((monster) => monster.placed).length
  const full = keep.roster.length >= keep.progress.intruderSlots
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold gold-text tracking-widest">地下城城主</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl leading-relaxed">
              闯入者自己走进来。调教她们会留下淫髓，用来把狱挖深、把栏位和格子加开。
            </p>
          </div>
          <button type="button" onClick={onOpenSettings} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary text-xs text-muted-foreground">
            <Settings className="w-3.5 h-3.5" />设置
          </button>
        </header>

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

        <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
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

        {keep.roster.map((entry) => (
          <section key={entry.id} className="dungeon-border rounded-xl bg-card p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-border bg-secondary flex-shrink-0">
                {entry.character.avatarUrl
                  ? <img src={entry.character.avatarUrl} alt={entry.character.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center font-bold text-primary">{entry.character.name[0]}</div>}
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
          className="w-full dungeon-border rounded-xl bg-card p-6 text-left disabled:opacity-50"
        >
          <p className="text-xs tracking-widest text-primary">开门</p>
          <p className="text-2xl font-bold mt-1">迎接入侵者</p>
          <p className="text-sm text-muted-foreground mt-2">
            {full
              ? `在狱 ${keep.roster.length}/${keep.progress.intruderSlots}。先把一个人留下、玩坏或放走，或把格子加开。`
              : `在狱 ${keep.roster.length}/${keep.progress.intruderSlots}。进来的人由词表随机生成，你不挑选自己去扮演的那一个。`}
          </p>
        </button>

        <button type="button" onClick={onOpenDungeon} className="w-full dungeon-border rounded-xl bg-card p-4 text-left">
          <p className="text-xs tracking-widest text-primary">地城</p>
          <p className="text-lg font-bold mt-1">布置地城</p>
          <p className="text-sm text-muted-foreground mt-2">
            {keep.dungeonDescription ? keep.dungeonDescription : '给这座狱写脾气，再把陷阱和魔物塞进某一层。临时捏一只魔物要花淫髓。'}
          </p>
        </button>

        <div className="grid gap-3 md:grid-cols-3">
          <button type="button" onClick={onOpenTraps} className="dungeon-border rounded-xl bg-card p-4 text-left">
            <p className="text-xs text-muted-foreground">陷阱工房</p>
            <p className="text-lg font-bold mt-1">已布置 {placedTraps}/{keep.progress.trapSlots}</p>
            <p className="text-xs text-muted-foreground mt-2">库里 {keep.traps.length} 件。超过栏位的只能先存着。</p>
          </button>
          <button type="button" onClick={onOpenMonsters} className="dungeon-border rounded-xl bg-card p-4 text-left">
            <p className="text-xs text-muted-foreground">魔物工房</p>
            <p className="text-lg font-bold mt-1">已放出 {placedMonsters}/{keep.progress.monsterSlots}</p>
            <p className="text-xs text-muted-foreground mt-2">强度 {keep.progress.monsterRank}/5。它们听你的命令。</p>
          </button>
          <button type="button" onClick={onOpenCollection} className="dungeon-border rounded-xl bg-card p-4 text-left">
            <p className="text-xs text-muted-foreground">收藏室</p>
            <p className="text-lg font-bold mt-1">{keep.collection.length} 人</p>
            <p className="text-xs text-muted-foreground mt-2">带回迷宫或调教室会占一个在狱格子，并新开一场。</p>
          </button>
        </div>
      </div>
    </div>
  )
}
