'use client'

import { useEffect, useState } from 'react'
import { CHARACTER_PRESETS, PRESET_TRAPS, RACE_INFO, type Character, type CharacterPreset } from '@/lib/types'
import { statusForTrap } from '@/lib/adventure-context'
import { rollIntruder } from '@/lib/intruder-roll'
import { IntruderDossier } from '@/components/intruder-dossier'
import {
  PRESET_MONSTERS,
  applyOpening,
  characterFromPreset,
  monsterFromPreset,
  pickIntruder,
  trapFromPreset,
  trapSummary,
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

function draw(source: Arrival['source'], avoid: string[]): Arrival {
  return { source, preset: source === 'library' ? pickIntruder(avoid) : rollIntruder(avoid) }
}

interface IntruderGateProps {
  keep: KeeperSave
  onBegin: (payloads: BeginIntrusion[]) => void
  onBack: () => void
  cheat?: boolean
}

export function IntruderGate({ keep, onBegin, onBack, cheat = false }: IntruderGateProps) {
  const room = keep.progress.intruderSlots - keep.roster.length
  const [avoided, setAvoided] = useState<string[]>(keep.recentNames)
  const [primary, setPrimary] = useState<Arrival>(() => draw('roll', keep.recentNames))
  const [second, setSecond] = useState<Arrival | null>(null)
  const [together, setTogether] = useState(false)
  useEffect(() => {
    if (room < 2) return
    setSecond((current) => current ?? draw('roll', [...keep.recentNames, primary.preset.name]))
  }, [room, keep.recentNames, primary.preset.name])
  const [step, setStep] = useState<'choose' | 'trap' | 'monster'>('choose')
  const preset = primary.preset
  const race = RACE_INFO[preset.race]

  const begin = (opening: OpeningKind, trap?: KeeperTrap, monster?: KeeperMonster) => {
    const defense = trap
      ? { id: trap.id, name: trap.name, kind: 'trap' as const, summary: trapSummary(trap) }
      : monster
        ? { id: monster.id, name: monster.name, kind: 'monster' as const, summary: [monster.appearance, monster.behavior].filter(Boolean).join(' ') }
        : undefined
    const payload = (card: Arrival): BeginIntrusion => {
      const next = applyOpening(characterFromPreset(card.preset), opening, defense)
      if (next.encounter && opening === 'trap') {
        const effect = statusForTrap(next.encounter)
        if (effect) next.statusEffects = [effect]
      }
      return {
        character: next,
        trap,
        monster,
        brief: { opening, defenseName: defense?.name, defenseSummary: defense?.summary },
      }
    }
    const payloads = [payload(primary)]
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

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-4">
        <button type="button" onClick={onBack} className="text-xs text-muted-foreground">回到城主厅</button>
        <div>
          <p className="text-xs tracking-widest text-primary">有人闯进来了</p>
          <h1 className="text-3xl font-bold gold-text mt-1">{preset.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{race?.label} · {primary.source === 'library' ? '角色库' : '随机生成'} · 胸 {preset.measurements.bust} / 腰 {preset.measurements.waist} / 臀 {preset.measurements.hip}</p>
        </div>

        <article className="dungeon-border rounded-xl bg-card p-4 md:p-6 space-y-4">
          <div className="flex gap-4">
            <div className="w-24 h-32 md:w-32 md:h-40 rounded-lg overflow-hidden border border-border bg-secondary flex-shrink-0">
              {preset.avatarUrl
                ? <img src={preset.avatarUrl} alt={preset.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-primary">{preset.name[0]}</div>}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{race?.description}</p>
          </div>
          <IntruderDossier person={preset} />
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

        {step === 'choose' && (
          <div className="grid grid-cols-2 gap-2">
            <Action label="亲自上手" detail="她自己走进来，然后遇上你。" onClick={() => begin('personal')} />
            <Action label="投入陷阱" detail="她自己走进来，很快踩进你挑的那一件。" onClick={() => setStep('trap')} />
            <Action label="放出魔物" detail="她自己走进来，迎面撞上你放出的那一只。" onClick={() => setStep('monster')} />
            <Action label="推进廊道" detail="她自己走进来。你在后面看，已布置的东西才可能绊住她。" onClick={() => begin('corridor')} />
            <button type="button" onClick={() => reroll('primary')} className="py-2 text-sm text-muted-foreground">换一个</button>
            <button type="button" onClick={() => setPrimary(draw(primary.source === 'roll' ? 'library' : 'roll', avoided))} className="py-2 text-sm text-muted-foreground">
              {primary.source === 'roll' ? '从角色库抽一个' : '改成随机生成'}
            </button>
          </div>
        )}

        {step === 'choose' && second && (
          <section className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] tracking-widest text-muted-foreground">后面还跟着一个</p>
                <p className="font-bold">{second.preset.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{RACE_INFO[second.preset.race]?.label} · {second.preset.backstory}</p>
              </div>
              <button type="button" onClick={() => reroll('second')} className="text-xs text-muted-foreground flex-shrink-0">换后面这个</button>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={together} onChange={(event) => setTogether(event.target.checked)} />
              两个人一起进来。先调教前面这个，后面那个在同一处等着。
            </label>
          </section>
        )}

        {step === 'trap' && (
          <Picker
            title="把她投入哪一件"
            owned={keep.traps.map((trap) => ({ id: trap.id, name: trap.name, detail: trap.mechanism, onPick: () => begin('trap', trap) }))}
            catalog={catalogTraps.map((trap) => ({ id: trap.id, name: trap.name, detail: trap.hint, onPick: () => begin('trap', trapFromPreset(trap)) }))}
            onBack={() => setStep('choose')}
          />
        )}
        {step === 'monster' && (
          <Picker
            title="放出哪一只"
            owned={keep.monsters.map((monster) => ({ id: monster.id, name: monster.name, detail: monster.behavior, onPick: () => begin('monster', undefined, monster) }))}
            catalog={catalogMonsters.map((monster) => ({ id: monster.id, name: monster.name, detail: monster.behavior, onPick: () => begin('monster', undefined, monsterFromPreset(monster)) }))}
            onBack={() => setStep('choose')}
          />
        )}
      </div>
    </div>
  )
}

function Action({ label, detail, onClick }: { label: string; detail: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-xl border border-border bg-card p-3 text-left hover:border-primary/60">
      <p className="font-bold text-sm">{label}</p>
      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{detail}</p>
    </button>
  )
}

function Picker({ title, owned, catalog, onBack }: {
  title: string
  owned: { id: string; name: string; detail: string; onPick: () => void }[]
  catalog: { id: string; name: string; detail: string; onPick: () => void }[]
  onBack: () => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">{title}</h2>
        <button type="button" onClick={onBack} className="text-xs text-muted-foreground">返回</button>
      </div>
      <PickList label="已经入库" rows={owned} empty="工房里还没有。可以先用下面的预设。" />
      <PickList label="预设" rows={catalog} empty="预设都已经入库了。" />
    </div>
  )
}

function PickList({ label, rows, empty }: { label: string; rows: { id: string; name: string; detail: string; onPick: () => void }[]; empty: string }) {
  return (
    <section className="space-y-2">
      <p className="text-[11px] tracking-widest text-muted-foreground">{label}</p>
      {rows.length === 0 && <p className="text-xs text-muted-foreground">{empty}</p>}
      {rows.map((row) => (
        <button key={row.id} type="button" onClick={row.onPick} className="w-full rounded-lg border border-border bg-secondary/40 p-3 text-left">
          <p className="text-sm font-bold">{row.name}</p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{row.detail}</p>
        </button>
      ))}
    </section>
  )
}
