'use client'

import { useState } from 'react'
import { CHARACTER_PRESETS, RACE_INFO } from '@/lib/types'
import { CAGES, FATE_LABEL, type CaptiveRecord, type KeeperSave, type RosterEntry } from '@/lib/keeper'
import { CharacterProfile, captiveHistory, sessionHistory } from '@/components/character-profile'

interface KeeperArchiveProps {
  keep: KeeperSave
  onBack: () => void
  onKeep?: (next: KeeperSave) => void
  cheat?: boolean
}

type OpenCard =
  | { kind: 'roster'; entry: RosterEntry }
  | { kind: 'captive'; record: CaptiveRecord }
  | { kind: 'library'; name: string }

function Portrait({ name, url, className }: { name: string; url?: string | null; className: string }) {
  return (
    <div className={`overflow-hidden border border-border bg-secondary ${className}`}>
      {url
        ? <img src={url} alt={name} className="w-full h-full object-cover" />
        : <div className="w-full h-full flex items-center justify-center font-bold text-primary">{name[0]}</div>}
    </div>
  )
}

export function KeeperArchive({ keep, onBack, onKeep, cheat }: KeeperArchiveProps) {
  const [open, setOpen] = useState<OpenCard | null>(null)
  const seen = new Set([...keep.roster.map((entry) => entry.character.name), ...keep.collection.map((record) => record.name)])
  const waiting = CHARACTER_PRESETS.filter((preset) => !seen.has(preset.name))
  const selectedPreset = open?.kind === 'library' ? CHARACTER_PRESETS.find((preset) => preset.name === open.name) : null
  const person = open?.kind === 'roster' ? open.entry.character : open?.kind === 'captive' ? open.record.character : selectedPreset

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="max-w-5xl lg:max-w-6xl mx-auto space-y-6">
        <button type="button" onClick={onBack} className="text-xs text-muted-foreground">回到城主厅</button>
        <div>
          <h1 className="text-3xl font-bold gold-text">档案册</h1>
          <p className="text-sm text-muted-foreground mt-2">已经进过这座狱的人可以翻开整张卡。角色库里还没来的人也能看，崩溃台词先折着。这里只供翻看，不从这里把人叫进来。</p>
        </div>

        {open && person && (
          <CharacterProfile
            person={person}
            hideCollapse={open.kind === 'library'}
            cheat={cheat}
            status={open.kind === 'roster' ? `在狱 · ${open.entry.station} · 快感 ${open.entry.character.pleasure} · 欲望 ${open.entry.character.desire}`
              : open.kind === 'captive' ? `${FATE_LABEL[open.record.fate]}${open.record.cage ? ` · ${CAGES[open.record.cage].label}` : ''} · 快感 ${open.record.pleasure} · 欲望 ${open.record.desire}`
              : '还没进过这座狱'}
            history={open.kind === 'roster' ? sessionHistory(open.entry.session) : open.kind === 'captive' ? captiveHistory(open.record) : []}
            onChange={open.kind === 'library' || !onKeep ? undefined : (next) => {
              if (open.kind === 'roster') {
                const entry = { ...open.entry, character: next }
                onKeep({ ...keep, roster: keep.roster.map((e) => e.id === entry.id ? entry : e) })
                setOpen({ kind: 'roster', entry })
              } else if (open.kind === 'captive') {
                const record = { ...open.record, character: next }
                onKeep({ ...keep, collection: keep.collection.map((r) => r.id === record.id ? record : r) })
                setOpen({ kind: 'captive', record })
              }
            }}
            onClose={() => setOpen(null)}
          />
        )}

        <section className="space-y-3">
          <h2 className="text-sm tracking-widest text-muted-foreground">这座狱里的人</h2>
          {keep.roster.length === 0 && keep.collection.length === 0 && <p className="text-sm text-muted-foreground">还没有人进来过。</p>}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {keep.roster.map((entry) => (
              <button key={entry.id} type="button" onClick={() => setOpen({ kind: 'roster', entry })} className="dungeon-border rounded-xl bg-card p-3 text-left">
                <Portrait name={entry.character.name} url={entry.character.avatarUrl} className="w-full aspect-[3/4] rounded-lg" />
                <p className="font-bold mt-2 truncate">{entry.character.name}</p>
                <p className="text-[11px] text-muted-foreground mt-1 truncate">{entry.station}</p>
              </button>
            ))}
            {keep.collection.map((record) => (
              <button key={record.id} type="button" onClick={() => setOpen({ kind: 'captive', record })} className="dungeon-border rounded-xl bg-card p-3 text-left">
                <Portrait name={record.name} url={record.avatarUrl} className="w-full aspect-[3/4] rounded-lg" />
                <p className="font-bold mt-2 truncate">{record.name}</p>
                <p className="text-[11px] text-muted-foreground mt-1 truncate">{FATE_LABEL[record.fate]}{record.cage ? ` · ${CAGES[record.cage].label}` : ''}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm tracking-widest text-muted-foreground">还没来过的角色库</h2>
          {waiting.length === 0 && <p className="text-sm text-muted-foreground">角色库里的人都已经进过这座狱。</p>}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {waiting.map((preset) => (
              <button key={preset.name} type="button" onClick={() => setOpen({ kind: 'library', name: preset.name })} className="dungeon-border rounded-xl bg-card p-3 text-left">
                <Portrait name={preset.name} url={preset.avatarUrl} className="w-full aspect-[3/4] rounded-lg" />
                <p className="font-bold mt-2 truncate">{preset.name}</p>
                <p className="text-[11px] text-muted-foreground mt-1 truncate">{RACE_INFO[preset.race]?.label} · 崩溃台词折着</p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
