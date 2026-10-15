'use client'

import { useState } from 'react'
import {
  TEMP_MONSTER_COST,
  pinchMonster,
  stuffDefense,
  unstuffDefense,
  type KeeperSave,
} from '@/lib/keeper'

interface DungeonEditorProps {
  keep: KeeperSave
  onKeep: (keep: KeeperSave) => void
  onBack: () => void
}

export function DungeonEditor({ keep, onKeep, onBack }: DungeonEditorProps) {
  const [name, setName] = useState('')
  const [behavior, setBehavior] = useState('')
  const [appearance, setAppearance] = useState('')
  const [floorIndex, setFloorIndex] = useState(0)
  const [notice, setNotice] = useState('')
  const placedMonsters = keep.monsters.filter((monster) => monster.placed).length
  const monsterRoom = placedMonsters < keep.progress.monsterSlots
  const canPinch = keep.progress.essence >= TEMP_MONSTER_COST && monsterRoom && name.trim().length > 0 && behavior.trim().length > 0

  const pinch = () => {
    const next = pinchMonster(keep, floorIndex, { name, behavior, appearance })
    if (!next) {
      setNotice(keep.progress.essence < TEMP_MONSTER_COST ? `临时捏怪要 ${TEMP_MONSTER_COST} 淫髓。` : '魔物栏位满了，先取出一只。')
      return
    }
    onKeep(next)
    setName('')
    setBehavior('')
    setAppearance('')
    setNotice(`已花 ${TEMP_MONSTER_COST} 淫髓，塞进第 ${floorIndex + 1} 层。取出后这只临时魔物就散掉。`)
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-5">
        <button type="button" onClick={onBack} className="text-xs text-muted-foreground">回到城主厅</button>
        <div>
          <h1 className="text-3xl font-bold gold-text">布置地城</h1>
          <p className="text-sm text-muted-foreground mt-2">先写这座狱的脾气，再把库里的陷阱和魔物塞进某一层。人被赶到那一层，才可能撞上塞在那里的东西。</p>
        </div>

        <label className="block">
          <span className="text-[11px] tracking-widest text-muted-foreground">名字</span>
          <input value={keep.dungeonName} maxLength={24} onChange={(event) => onKeep({ ...keep, dungeonName: event.target.value })} className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="text-[11px] tracking-widest text-muted-foreground">这座狱的脾气</span>
          <textarea value={keep.dungeonDescription} maxLength={400} onChange={(event) => onKeep({ ...keep, dungeonDescription: event.target.value })} placeholder="例如：整座狱又湿又窄，墙缝里都是温热的粘液，灯只在你允许的时候亮。" className="mt-1 w-full min-h-24 rounded-lg border border-border bg-card px-3 py-2 text-sm" />
        </label>

        {keep.floors.map((floor, index) => {
          const trapsHere = floor.trapIds.flatMap((id) => {
            const trap = keep.traps.find((item) => item.id === id)
            return trap ? [trap] : []
          })
          const monstersHere = floor.monsterIds.flatMap((id) => {
            const monster = keep.monsters.find((item) => item.id === id)
            return monster ? [monster] : []
          })
          const looseTraps = keep.traps.filter((trap) => !trap.placed)
          const looseMonsters = keep.monsters.filter((monster) => !monster.placed)
          const trapFull = keep.traps.filter((trap) => trap.placed).length >= keep.progress.trapSlots
          return (
            <section key={index} className="dungeon-border rounded-xl bg-card p-4 space-y-3">
              <p className="text-[11px] tracking-widest text-primary">第 {index + 1} 层</p>
              <input value={floor.name} maxLength={24} onChange={(event) => onKeep(renameFloor(keep, index, { name: event.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold" />
              <textarea value={floor.ambience} maxLength={240} onChange={(event) => onKeep(renameFloor(keep, index, { ambience: event.target.value }))} className="w-full min-h-16 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <div className="space-y-2">
                {trapsHere.length === 0 && monstersHere.length === 0 && <p className="text-xs text-muted-foreground">这一层还是空的。</p>}
                {trapsHere.map((trap) => (
                  <Stuffed key={trap.id} label="陷阱" name={trap.name} onTake={() => onKeep(unstuffDefense(keep, 'trap', trap.id))} />
                ))}
                {monstersHere.map((monster) => (
                  <Stuffed key={monster.id} label={monster.temporary ? '临时魔物' : '魔物'} name={monster.name} onTake={() => onKeep(unstuffDefense(keep, 'monster', monster.id))} />
                ))}
              </div>
              {looseTraps.map((trap) => (
                <button key={trap.id} type="button" disabled={trapFull} onClick={() => onKeep(stuffDefense(keep, index, 'trap', trap.id))} className="w-full rounded-lg border border-dashed border-border p-2 text-left text-sm disabled:opacity-40">
                  把陷阱「{trap.name}」塞进来
                </button>
              ))}
              {looseMonsters.map((monster) => (
                <button key={monster.id} type="button" disabled={!monsterRoom} onClick={() => onKeep(stuffDefense(keep, index, 'monster', monster.id))} className="w-full rounded-lg border border-dashed border-border p-2 text-left text-sm disabled:opacity-40">
                  把魔物「{monster.name}」塞进来
                </button>
              ))}
            </section>
          )
        })}

        <section className="dungeon-border rounded-xl bg-card p-4 space-y-3">
          <h2 className="text-sm font-bold">临时捏一只魔物</h2>
          <p className="text-xs text-muted-foreground">花费 {TEMP_MONSTER_COST} 淫髓。它不入库，取出就散。当前淫髓 {keep.progress.essence}，魔物栏位 {placedMonsters}/{keep.progress.monsterSlots}。</p>
          <select value={floorIndex} onChange={(event) => setFloorIndex(Number(event.target.value))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
            {keep.floors.map((floor, index) => <option key={index} value={index}>塞进第 {index + 1} 层 · {floor.name}</option>)}
          </select>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="名字" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <textarea value={appearance} onChange={(event) => setAppearance(event.target.value)} placeholder="外观，可空" className="w-full min-h-16 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          <textarea value={behavior} onChange={(event) => setBehavior(event.target.value)} placeholder="听令之后先做什么" className="w-full min-h-16 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          {notice && <p className="text-sm text-amber-200">{notice}</p>}
          <button type="button" onClick={pinch} disabled={!canPinch} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40">
            花费 {TEMP_MONSTER_COST} 淫髓塞进去
          </button>
        </section>
      </div>
    </div>
  )
}

function renameFloor(keep: KeeperSave, index: number, patch: { name?: string; ambience?: string }): KeeperSave {
  return {
    ...keep,
    floors: keep.floors.map((floor, floorIndex) => floorIndex === index ? { ...floor, ...patch } : floor),
  }
}

function Stuffed({ label, name, onTake }: { label: string; name: string; onTake: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2">
      <p className="text-sm"><span className="text-[11px] text-muted-foreground mr-2">{label}</span>{name}</p>
      <button type="button" onClick={onTake} className="text-[11px] text-muted-foreground">取出</button>
    </div>
  )
}
