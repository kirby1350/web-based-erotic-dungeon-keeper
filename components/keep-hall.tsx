'use client'

import { Bug, Settings, Swords } from 'lucide-react'
import { RACE_INFO } from '@/lib/types'
import { buyUpgrade, lureOnFloor, quickStarterSetup, upgradeCost, type IntruderFate, type KeeperSave, type UpgradeKey } from '@/lib/keeper'
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
  { key: 'trapSlots', label: '陷阱栏位', max: 6, hint: '同时启用的机关上限' },
  { key: 'monsterSlots', label: '魔物栏位', max: 4, hint: '同时驻守的眷属上限' },
  { key: 'depth', label: '地下城深度', max: 10, hint: '向下开拓的迷宫层数' },
  { key: 'monsterRank', label: '魔物强度', max: 5, hint: '眷属拘束与侵犯烈度' },
  { key: 'intruderSlots', label: '在狱格子', max: 3, hint: '可同时扣押的猎物数' },
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
              高傲的剑士、圣女与舰娘将踏入你的领地。以陷阱、魔物与亲手调教榨取淫髓，扩建深渊楼层与专属囚笼。
            </p>
          </div>
          <button type="button" onClick={onOpenSettings} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary text-xs text-muted-foreground hover:text-foreground transition-colors">
            <Settings className="w-3.5 h-3.5" />设置
          </button>
        </header>

        <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6 lg:items-start">
        <div className="space-y-6 min-w-0">
        <div className="flex flex-wrap items-end gap-4">
          <label className="block max-w-xs flex-1">
            <span className="text-[11px] tracking-widest text-muted-foreground">深渊名号</span>
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
                <p className="text-[11px] mt-2 text-primary">{cost == null ? '已满级' : affordable ? `消耗 ${cost} 淫髓` : `需 ${cost} 淫髓`}</p>
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
          className="w-full h-full dungeon-border rounded-xl bg-card p-6 text-left disabled:opacity-50 hover:border-primary/50 transition-colors"
        >
          <p className="text-xs tracking-widest text-primary">城门异动</p>
          <p className="text-2xl font-bold mt-1">迎接入侵者</p>
          <p className="text-sm text-muted-foreground mt-2">
            {full
              ? `在狱栏位已满（${keep.roster.length}/${keep.progress.intruderSlots}）。请先将狱中猎物收押、玩坏或放逐，或扩建在狱格子。`
              : `当前在狱 ${keep.roster.length}/${keep.progress.intruderSlots}。推开沉重石门，看看今天是哪位不知死活的猎物踏入了你的领地。`}
          </p>
        </button>
        </div>

        <div className="dungeon-border rounded-xl bg-card p-4" data-testid="dungeon-card">
          <button type="button" onClick={onOpenDungeon} className="w-full text-left">
            <p className="text-xs tracking-widest text-primary">迷宫防线</p>
            <p className="text-lg font-bold mt-1">布置 · 工房 · 图鉴</p>
            <p className="text-sm text-muted-foreground mt-1">已布防陷阱 {placedTraps}/{keep.progress.trapSlots} · 驻守魔物 {placedMonsters}/{keep.progress.monsterSlots} · 库存共 {keep.traps.length + keep.monsters.length} 件 · 眷属阶位 Lv{keep.progress.monsterRank}/5</p>
          </button>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <button type="button" onClick={onOpenDungeon} className="px-3 py-1 rounded-md border border-border hover:border-primary/40 transition-colors">布置地城</button>
            <button type="button" onClick={onOpenTraps} className="px-3 py-1 rounded-md border border-border hover:border-primary/40 transition-colors">陷阱工房</button>
            <button type="button" onClick={onOpenMonsters} className="px-3 py-1 rounded-md border border-border hover:border-primary/40 transition-colors">魔物工房</button>
            {placedTraps + placedMonsters === 0 && (
              <button
                type="button"
                data-testid="quick-starter-setup"
                onClick={() => onKeep(quickStarterSetup(keep))}
                className="px-3 py-1 rounded-md border border-primary/50 bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-colors"
              >
                一键布设首层连携防线（催情花园 + 触手看守）
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <button type="button" onClick={onOpenCollection} className="dungeon-border rounded-xl bg-card p-4 text-left hover:border-primary/50 transition-colors">
            <p className="text-xs text-muted-foreground">收藏室</p>
            <p className="text-lg font-bold mt-1">{keep.collection.length} 人</p>
            <p className="text-xs text-muted-foreground mt-2">安置已收押与玩坏的战利品。可更换专属囚笼隔栏观赏，或推门进去调教。</p>
          </button>
          <button type="button" onClick={onOpenArchive} className="dungeon-border rounded-xl bg-card p-4 text-left hover:border-primary/50 transition-colors">
            <p className="text-xs text-muted-foreground">档案册</p>
            <p className="text-lg font-bold mt-1">猎物名录</p>
            <p className="text-xs text-muted-foreground mt-2">查阅已落网猎物的调教履历、敏感死穴，以及尚未踏足此地的潜在目标。</p>
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
        <p className="text-[11px] tracking-widest text-muted-foreground">楼层布防图</p>
        <ol className="space-y-1">
          {floors.map((floor, i) => {
            const here = keep.roster.filter((r) => (r.character.floor ?? 1) === i + 1)
            const traps = floor.trapIds.map((id) => keep.traps.find((t) => t.id === id)?.name).filter(Boolean)
            const monsters = floor.monsterIds.map((id) => keep.monsters.find((m) => m.id === id)?.name).filter(Boolean)
            const lure = lureOnFloor(keep, i + 1)
            return (
              <li key={i} className="rounded-md border border-border px-2 py-1.5">
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-primary tabular-nums">{i + 1}</span>
                  <span className="font-bold truncate">{floor.name}</span>
                  <span className="ml-auto flex -space-x-1">
                    {here.map((r) => <StatePortrait key={r.id} character={r.character} variant="avatar" className="w-5 h-5 rounded-full border border-background" />)}
                  </span>
                </div>
                {(traps.length > 0 || monsters.length > 0 || lure) ? (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {traps.map((n) => <span key={`t-${n}`} className="inline-flex items-center gap-0.5 text-[10px] text-amber-200/90"><Swords className="w-2.5 h-2.5" />{n}</span>)}
                    {monsters.map((n) => <span key={`m-${n}`} className="inline-flex items-center gap-0.5 text-[10px] text-rose-200/90"><Bug className="w-2.5 h-2.5" />{n}</span>)}
                    {lure && <span className="inline-flex items-center gap-0.5 text-[10px] text-fuchsia-300">⛓ 肉饵·{lure.name}</span>}
                  </div>
                ) : <p className="mt-0.5 text-[10px] text-muted-foreground/60">尚未设防</p>}
              </li>
            )
          })}
        </ol>
      </div>
      {keep.recentFeed && keep.recentFeed.length > 0 && (
        <div className="space-y-1 border-t border-border pt-3">
          <p className="text-[11px] tracking-widest text-muted-foreground">收藏室近况</p>
          <ul className="space-y-1 text-[11px] text-amber-100/80">
            {keep.recentFeed.slice(0, 4).map((line, idx) => <li key={idx} className="leading-snug">· {line}</li>)}
          </ul>
        </div>
      )}
    </aside>
  )
}
