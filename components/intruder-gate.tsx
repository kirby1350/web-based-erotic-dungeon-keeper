'use client'

import { useEffect, useState } from 'react'
import { Bug, Crosshair, Footprints, Hand, type LucideIcon } from 'lucide-react'
import { CHARACTER_PRESETS, PRESET_TRAPS, RACE_INFO, type Character, type CharacterPreset } from '@/lib/types'
import { StatePortrait } from '@/components/state-portrait'
import { sourceWork } from '@/lib/terms-dk'
import { statusForTrap } from '@/lib/adventure-context'
import { hitPreview, monsterHitPreview, trapRestraint, trapStatuses, type HitPreview } from '@/lib/trap-craft'
import { floorSynergies } from '@/lib/synergy'
import { rollIntruder } from '@/lib/intruder-roll'
import { formParty, partyChance, rollParty } from '@/lib/party'
import { IntruderDossier } from '@/components/intruder-dossier'
import { CharacterProfile } from '@/components/character-profile'
import {
  PRESET_MONSTERS,
  applyOpening,
  characterFromPreset,
  lureOnFloor,
  monsterFromPreset,
  monsterMutationSummary,
  pickCompanion,
  pickIntruder,
  trapFromPreset,
  trapSummary,
  triggerChance,
  type KeeperBrief,
  type KeeperMonster,
  type KeeperSave,
  type KeeperTrap,
  type OpeningKind,
} from '@/lib/keeper'

export interface BeginIntrusion {
  character: Character
  brief: KeeperBrief
  trap?: KeeperTrap
  monster?: KeeperMonster
}

interface Arrival {
  preset: CharacterPreset
  source: 'roll' | 'library'
}

/** 原作角色是高权重：六成从角色库抽。 */
export const LIBRARY_WEIGHT = 0.6
function firstSource(random: () => number = Math.random): Arrival['source'] {
  return random() < LIBRARY_WEIGHT ? 'library' : 'roll'
}

function draw(source: Arrival['source'], avoid: string[]): Arrival {
  return { source, preset: source === 'library' ? pickIntruder(avoid) : rollIntruder(avoid) }
}

interface IntruderGateProps {
  keep: KeeperSave
  onBegin: (payloads: BeginIntrusion[]) => void
  onBack: () => void
  cheat?: boolean
  /** 讨伐队来袭时，门口只会是下一名讨伐队成员 */
  raidNext?: CharacterPreset
  /** 讨伐队尚有其余成员时，可选择放双人先锋同场攻坚 */
  raidCompanion?: CharacterPreset
}

export function IntruderGate({ keep, onBegin, onBack, cheat = false, raidNext, raidCompanion }: IntruderGateProps) {
  const room = keep.progress.intruderSlots - keep.roster.length
  const [avoided, setAvoided] = useState<string[]>(keep.recentNames)
  const [primary, setPrimary] = useState<Arrival>(() => raidNext ? { source: 'library', preset: raidNext } : draw(firstSource(), keep.recentNames))
  const [second, setSecond] = useState<Arrival | null>(null)
  const [together, setTogether] = useState(false)
  // 结伴：越深越常见。和「后面还跟着一个」不同，结伴的两人同场、共用布置、只占一个名额。
  const [companion, setCompanion] = useState<Arrival | null>(() => !raidNext && rollParty(keep.progress.depth) ? { source: 'library', preset: pickCompanion(primary.preset, [...keep.recentNames, primary.preset.name]) } : null)
  const [showProfile, setShowProfile] = useState(false)
  useEffect(() => {
    if (room < 2 || raidNext) return
    setSecond((current) => current ?? draw('roll', [...keep.recentNames, primary.preset.name]))
  }, [room, raidNext, keep.recentNames, primary.preset.name])
  const [step, setStep] = useState<'choose' | 'trap' | 'monster'>('choose')
  const preset = primary.preset
  const race = RACE_INFO[preset.race]

  const begin = (opening: OpeningKind, trap?: KeeperTrap, monster?: KeeperMonster) => {
    const defense = trap
      ? { id: trap.id, name: trap.name, kind: 'trap' as const, summary: trapSummary(trap) }
      : monster
        ? { id: monster.id, name: monster.name, kind: 'monster' as const, summary: [monster.appearance, monster.behavior, monsterMutationSummary(monster)].filter(Boolean).join(' ') }
        : undefined
    const payload = (card: Arrival): BeginIntrusion => {
      const next = applyOpening(characterFromPreset(card.preset), opening, defense)
      if (next.encounter && opening === 'trap') {
        const effects = trap ? trapStatuses(trap) : []
        const effect = effects.length ? null : statusForTrap(next.encounter)
        next.statusEffects = effects.length ? effects : effect ? [effect] : next.statusEffects
        next.encounter = { ...next.encounter, restraint: trapRestraint(trap) }
      }
      return {
        character: next,
        trap,
        monster,
        brief: { opening, defenseName: defense?.name, defenseSummary: defense?.summary },
      }
    }
    const lead = payload(primary)
    if (companion && companion.preset.name !== primary.preset.name) lead.character = formParty(lead.character, payload(companion).character)
    const payloads = [lead]
    if (together && second && room >= 2) payloads.push(payload(second))
    onBegin(payloads)
  }

  const reroll = (which: 'primary' | 'second') => {
    const current = which === 'primary' ? primary : second
    if (!current) return
    const nextAvoid = [...avoided, current.preset.name].slice(-8)
    setAvoided(nextAvoid)
    const drawn = draw(current.source, nextAvoid)
    if (which === 'primary') setPrimary(drawn)
    else setSecond(drawn)
  }

  const catalogTraps = PRESET_TRAPS.filter((item) => !keep.traps.some((trap) => trap.id === item.id))
  const catalogMonsters = PRESET_MONSTERS.filter((item) => !keep.monsters.some((monster) => monster.id === item.id))
  const targetChar = characterFromPreset(preset)
  const floor1 = keep.floors[0]
  const floor1Traps = (floor1?.trapIds ?? []).map((id) => keep.traps.find((t) => t.id === id)).filter((t): t is KeeperTrap => !!t)
  const floor1Monsters = (floor1?.monsterIds ?? []).map((id) => keep.monsters.find((m) => m.id === id)).filter((m): m is KeeperMonster => !!m)
  const floor1Combos = floorSynergies(keep, 1)
  const floor1Lure = lureOnFloor(keep, 1)
  const requisitionNote = keep.progress.essence >= 2 ? '消耗 2 淫髓紧急调拨入库' : '首件免费紧急调拨入库'

  return (
    <div className="min-h-screen p-4 lg:p-8">
      {showProfile && <CharacterProfile person={preset} status={primary.source === 'library' ? '知名猎物 · 刚踏入城门' : '野生冒险者 · 刚踏入城门'} hideCollapse onClose={() => setShowProfile(false)} />}
      <div className="max-w-3xl lg:max-w-5xl mx-auto space-y-4">
        <button type="button" onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground transition-colors">回到城主厅</button>
        <div>
          <p className="text-xs tracking-widest text-primary">石门开启 · 猎物踏入</p>
          <div className="flex flex-wrap items-baseline gap-2.5 mt-1">
            <h1 className="text-3xl font-bold gold-text">{preset.name}</h1>
            <span className="text-xs rounded-full border border-primary/40 bg-primary/10 px-2.5 py-0.5 text-amber-200">
              {primary.source === 'library' ? `${sourceWork(preset)} · 知名猎物` : '野生冒险者'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{race?.label} · 胸 {preset.measurements.bust} / 腰 {preset.measurements.waist} / 臀 {preset.measurements.hip}</p>
        </div>

        <article className="dungeon-border rounded-xl bg-card p-4 lg:p-6">
          <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[260px_minmax(0,1fr)] items-start">
            <div className="space-y-2.5 mx-auto w-48 sm:w-56 md:w-full">
              <button
                type="button"
                onClick={() => setShowProfile(true)}
                title="点击翻开完整档案与五阶立绘"
                className="group relative block w-full aspect-[2/3] rounded-xl overflow-hidden border border-border bg-secondary hover:border-primary/60 transition-all shadow-lg"
              >
                <StatePortrait character={targetChar} className="w-full h-full transition-transform duration-500 group-hover:scale-[1.02]" />
              </button>
              <button type="button" onClick={() => setShowProfile(true)} className="w-full text-center text-xs text-primary hover:underline" data-testid="open-profile">
                翻开完整档案与五阶立绘 →
              </button>
            </div>
            <div className="space-y-3 min-w-0">
              <p className="text-xs text-muted-foreground leading-relaxed rounded-lg border border-border/70 bg-secondary/30 px-3 py-2">
                {preset.raceTrait || race?.description}
              </p>
              <IntruderDossier person={preset} />
            </div>
          </div>
        </article>

        {step === 'choose' && cheat && (
          <label className="flex items-center gap-2 rounded-xl border border-fuchsia-500/40 bg-fuchsia-950/30 p-3 text-xs text-fuchsia-100" data-testid="cheat-gate">
            <span>作弊：指定闯入者</span>
            <select aria-label="指定闯入者" className="flex-1 rounded bg-secondary px-2 py-1" value=""
              onChange={(event) => { const found = CHARACTER_PRESETS.find((item) => item.name === event.target.value); if (found) setPrimary({ source: 'library', preset: found }) }}>
              <option value="">选一个…</option>
              {CHARACTER_PRESETS.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
            </select>
          </label>
        )}
        {step === 'choose' && cheat && !raidNext && (
          <label className="flex items-center gap-2 rounded-xl border border-fuchsia-500/40 bg-fuchsia-950/30 p-3 text-xs text-fuchsia-100" data-testid="cheat-party">
            <span>作弊：指定同伴</span>
            <select aria-label="指定同伴" className="flex-1 rounded bg-secondary px-2 py-1" value={companion?.preset.name ?? ''}
              onChange={(event) => { const found = CHARACTER_PRESETS.find((item) => item.name === event.target.value); setCompanion(found ? { source: 'library', preset: found } : null) }}>
              <option value="">没有同伴</option>
              {CHARACTER_PRESETS.filter((item) => item.name !== preset.name).map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
            </select>
          </label>
        )}

        {step === 'choose' && companion && companion.preset.name !== preset.name && (
          <section className="rounded-xl border border-primary/50 bg-card p-4 flex gap-3.5" data-testid="party-card">
            <div className="w-16 h-24 lg:w-20 lg:h-28 rounded-lg overflow-hidden border border-border bg-secondary flex-shrink-0">
              <StatePortrait character={characterFromPreset(companion.preset)} className="w-full h-full" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] tracking-widest text-primary">她不是一个人来的</p>
              <p className="font-bold">{companion.preset.name}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{RACE_INFO[companion.preset.race]?.label} · {companion.preset.backstory}</p>
              <p className="text-[11px] text-muted-foreground mt-1">两人结伴同行，共用同层陷阱与魔物，结算双份淫髓（当前深度结伴率 {Math.round(partyChance(keep.progress.depth) * 100)}%）。</p>
              <button type="button" onClick={() => setCompanion(null)} className="text-xs text-muted-foreground hover:text-foreground mt-1 underline underline-offset-2">落闸隔开同伴（只放主目标进门）</button>
            </div>
          </section>
        )}

        {step === 'choose' && raidNext && raidCompanion && !companion && (
          <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-3 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-100" data-testid="raid-duo-banner">
            <span>讨伐队同伴「{raidCompanion.name}」正紧随在侧，可放双人先锋同场迎战（共用防线，结算双份淫髓）。</span>
            <button
              type="button"
              onClick={() => setCompanion({ source: 'library', preset: raidCompanion })}
              className="px-2.5 py-1 rounded-md border border-amber-300/60 bg-amber-500/20 font-bold hover:bg-amber-500/30"
            >
              放双人先锋同场攻坚
            </button>
          </div>
        )}

        {step === 'choose' && (
          <div className="rounded-xl border border-border bg-secondary/30 px-3 py-2 text-xs space-y-1" data-testid="gate-floor1-preview">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] tracking-widest text-primary">第 1 层「{floor1?.name ?? '苔藓前室'}」防线预览</span>
              <span className="text-[11px] text-muted-foreground">廊道触发率 {Math.round(triggerChance(keep, 1) * 100)}%</span>
            </div>
            {(floor1Traps.length > 0 || floor1Monsters.length > 0 || floor1Lure) ? (
              <p className="text-muted-foreground leading-relaxed">
                已布防：{
                  [
                    ...floor1Traps.map((t) => `⚙️${t.name}（命中 ${hitPreview(t, targetChar).score}/3）`),
                    ...floor1Monsters.map((m) => `👾${m.name}（命中 ${monsterHitPreview(m, targetChar).score}/3）`),
                    ...(floor1Lure ? [`⛓肉饵·${floor1Lure.name}（+15% 淫髓）`] : []),
                  ].join(' · ')
                }
                {floor1Combos.length > 0 ? ` · 连携「${floor1Combos.map((c) => c.name).join('、')}」生效中` : ''}
              </p>
            ) : (
              <p className="text-amber-200/80">第 1 层尚未设防（选「推进廊道」暂不会踩中机关；可回城主厅一键布设首层防线）。</p>
            )}
          </div>
        )}

        {step === 'choose' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <Action icon={Hand} tone="text-pink-300" label="亲自上手" detail="在第一层暗处现身截住她，由你亲手开场调教。" onClick={() => begin('personal')} />
            <Action icon={Crosshair} tone="text-amber-300" label="投入陷阱" detail="诱她一脚踩进你指定的机关，在束缚与快感中挣扎。" onClick={() => setStep('trap')} />
            <Action icon={Bug} tone="text-rose-300" label="放出魔物" detail="命眷属迎面扑上缠住她，听候你的旨意层层侵犯。" onClick={() => setStep('monster')} />
            <Action icon={Footprints} tone="text-blue-300" label="推进廊道" detail="隐于幕后静观其变，看她一步步撞上各层已布防的机关。" onClick={() => begin('corridor')} />
{!raidNext && (<>
            <button type="button" onClick={() => reroll('primary')} className="py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">换一个</button>
            <button type="button" onClick={() => setPrimary(draw(primary.source === 'roll' ? 'library' : 'roll', avoided))} className="py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              {primary.source === 'roll' ? '改迎知名角色' : '改迎随机冒险者'}
            </button>
            </>)}
          </div>
        )}

        {step === 'choose' && second && (
          <section className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] tracking-widest text-muted-foreground">尾随在后的第二名闯入者</p>
                <p className="font-bold">{second.preset.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{RACE_INFO[second.preset.race]?.label} · {second.preset.backstory}</p>
              </div>
              <button type="button" onClick={() => reroll('second')} className="text-xs text-muted-foreground hover:text-foreground flex-shrink-0">换后面这个</button>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={together} onChange={(event) => setTogether(event.target.checked)} />
              放两人前后脚入狱：先处置前一个，另一个扣押在同层候审。
            </label>
          </section>
        )}

        {step === 'trap' && (
          <Picker
            title="诱她踩入哪座陷阱"
            catalogLabel={`预设图谱（${requisitionNote}）`}
            owned={keep.traps.map((trap) => ({ id: trap.id, name: trap.name, detail: trap.mechanism, hit: hitPreview(trap, targetChar), onPick: () => begin('trap', trap) }))}
            catalog={catalogTraps.map((presetTrap) => {
              const trap = trapFromPreset(presetTrap)
              return { id: trap.id, name: trap.name, detail: presetTrap.hint, hit: hitPreview(trap, targetChar), onPick: () => begin('trap', trap) }
            })}
            onBack={() => setStep('choose')}
          />
        )}
        {step === 'monster' && (
          <Picker
            title="驱使哪只魔物迎击"
            catalogLabel={`预设图谱（${requisitionNote}）`}
            owned={keep.monsters.map((monster) => ({ id: monster.id, name: monster.name, detail: [monster.behavior, monsterMutationSummary(monster)].filter(Boolean).join(' · '), hit: monsterHitPreview(monster, targetChar), onPick: () => begin('monster', undefined, monster) }))}
            catalog={catalogMonsters.map((presetMonster) => {
              const monster = monsterFromPreset(presetMonster)
              return { id: monster.id, name: monster.name, detail: monster.behavior, hit: monsterHitPreview(monster, targetChar), onPick: () => begin('monster', undefined, monster) }
            })}
            onBack={() => setStep('choose')}
          />
        )}
      </div>
    </div>
  )
}

function Action({ icon: Icon, tone, label, detail, onClick }: { icon: LucideIcon; tone: string; label: string; detail: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="group rounded-xl border border-border bg-card p-3.5 text-left hover:border-primary/65 hover:bg-primary/5 transition-all">
      <p className="font-bold text-sm flex items-center gap-1.5">
        <Icon className={`w-4 h-4 ${tone} group-hover:scale-110 transition-transform`} />
        {label}
      </p>
      <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{detail}</p>
    </button>
  )
}

interface PickRow {
  id: string
  name: string
  detail: string
  hit?: HitPreview
  onPick: () => void
}

function GateDots({ hit }: { hit: HitPreview }) {
  const weak = hit.parts.filter((p) => p.weak).map((p) => p.label)
  return (
    <span className="ml-auto flex items-center gap-1.5 text-[11px] flex-shrink-0">
      {weak.length > 0 && <span className="text-pink-300">死穴·{weak.join('/')}</span>}
      {hit.tagNote && <span className="text-fuchsia-300 hidden sm:inline">克制</span>}
      <span className="tabular-nums text-fuchsia-300" title={`命中 ${hit.score}/3`}>
        {'●'.repeat(hit.score)}<span className="text-muted-foreground/40">{'●'.repeat(3 - hit.score)}</span>
      </span>
    </span>
  )
}

function Picker({ title, catalogLabel = '预设图谱', owned, catalog, onBack }: {
  title: string
  catalogLabel?: string
  owned: PickRow[]
  catalog: PickRow[]
  onBack: () => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">{title}</h2>
        <button type="button" onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground">返回</button>
      </div>
      <PickList label="工房库存（免费调用）" rows={owned} empty="库存暂空，可直接紧急调拨下方预设并自动收录。" />
      <PickList label={catalogLabel} rows={catalog} empty="所有预设均已收入库存。" />
    </div>
  )
}

function PickList({ label, rows, empty }: { label: string; rows: PickRow[]; empty: string }) {
  return (
    <section className="space-y-2">
      <p className="text-[11px] tracking-widest text-muted-foreground">{label}</p>
      {rows.length === 0 && <p className="text-xs text-muted-foreground">{empty}</p>}
      {rows.map((row) => (
        <button key={row.id} type="button" onClick={row.onPick} className="w-full rounded-lg border border-border bg-secondary/40 p-3 text-left hover:border-primary/50 transition-colors">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold truncate">{row.name}</p>
            {row.hit && <GateDots hit={row.hit} />}
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{row.detail}</p>
        </button>
      ))}
    </section>
  )
}
