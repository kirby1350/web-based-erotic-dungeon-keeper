'use client'

import { useState } from 'react'
import type { Character } from '@/lib/types'
import { FATE_LABEL, type IntruderFate, type KeeperSave } from '@/lib/keeper'
import { cheatEssence, cheatMaxUpgrades, cheatStats } from '@/lib/cheat'

const box = 'rounded-xl border border-fuchsia-500/40 bg-fuchsia-950/30 p-3 space-y-2'
const btn = 'px-2.5 py-1 rounded-lg border border-fuchsia-400/40 bg-fuchsia-500/10 text-[11px] font-bold text-fuchsia-100'

export function HallCheat({ keep, onKeep }: { keep: KeeperSave; onKeep: (next: KeeperSave) => void }) {
  return (
    <section className={box} data-testid="cheat-hall">
      <p className="text-[11px] tracking-widest text-fuchsia-200">作弊模式</p>
      <div className="flex flex-wrap gap-1.5">
        <button type="button" className={btn} onClick={() => onKeep(cheatEssence(keep, 100))}>淫髓 +100</button>
        <button type="button" className={btn} onClick={() => onKeep(cheatEssence(keep, 1000))}>淫髓 +1000</button>
        <button type="button" className={btn} onClick={() => onKeep(cheatMaxUpgrades(keep))}>升级全满</button>
      </div>
    </section>
  )
}

const FATES: IntruderFate[] = ['kept', 'broken', 'defeated']

export function SceneCheat({ character, onUpdate, onForceFate }: {
  character: Character
  onUpdate: (updates: Partial<Character>) => void
  onForceFate: (fate: IntruderFate) => void
}) {
  const [open, setOpen] = useState(false)
  const field = (key: 'hp' | 'pleasure' | 'desire', label: string, max: number) => (
    <label className="flex items-center gap-2 text-[11px] text-fuchsia-100">
      <span className="w-8">{label}</span>
      <input type="range" min={0} max={max} value={character[key] ?? 0} aria-label={`作弊${label}`}
        onChange={(event) => onUpdate(cheatStats(character, { [key]: Number(event.target.value) }))} className="flex-1 accent-fuchsia-400" />
      <span className="w-8 text-right tabular-nums">{character[key] ?? 0}</span>
    </label>
  )
  return (
    <section className="border-b border-fuchsia-500/30 bg-fuchsia-950/30 px-3 py-1.5" data-testid="cheat-scene">
      <button type="button" className="text-[11px] text-fuchsia-200" onClick={() => setOpen(!open)}>{open ? '收起作弊' : '作弊'}</button>
      {open && (
        <div className="space-y-1.5 pt-1.5">
          {field('hp', 'HP', character.maxHp ?? 100)}
          {field('pleasure', '快感', 100)}
          {field('desire', '欲望', 100)}
          <div className="flex flex-wrap gap-1.5">
            {FATES.map((fate) => <button key={fate} type="button" className={btn} onClick={() => onForceFate(fate)}>直接{FATE_LABEL[fate]}</button>)}
          </div>
        </div>
      )}
    </section>
  )
}
