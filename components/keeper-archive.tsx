'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { CHARACTER_PRESETS, RACE_INFO, type Race } from '@/lib/types'
import { RAID_PARTY } from '@/lib/campaign'
import { CAGES, FATE_LABEL, characterFromPreset, type CaptiveRecord, type KeeperSave, type RosterEntry } from '@/lib/keeper'
import { CharacterProfile, captiveHistory, sessionHistory } from '@/components/character-profile'
import { StatePortrait, usePortraitManifest } from '@/components/state-portrait'
import { availablePortraitStages } from '@/lib/portraits'
import { characterLactates } from '@/lib/prompts'
import { sourceWork } from '@/lib/terms-dk'

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

const WORK_GROUPS = ['全部', '碧蓝航线', '碧蓝幻想', '偶像大师', '蔚蓝档案', '其他'] as const
type WorkGroup = (typeof WORK_GROUPS)[number]

function matchWorkGroup(work: string, group: WorkGroup): boolean {
  if (group === '全部') return true
  if (group === '偶像大师') return work.startsWith('偶像大师')
  if (group === '其他') return !['碧蓝航线', '碧蓝幻想', '蔚蓝档案'].includes(work) && !work.startsWith('偶像大师')
  return work === group
}

export function KeeperArchive({ keep, onBack, onKeep, cheat }: KeeperArchiveProps) {
  const [open, setOpen] = useState<OpenCard | null>(null)
  const [query, setQuery] = useState('')
  const [workGroup, setWorkGroup] = useState<WorkGroup>('全部')
  const [raceFilter, setRaceFilter] = useState<Race | 'all'>('all')
  const [lactOnly, setLactOnly] = useState(false)

  const manifest = usePortraitManifest()
  const allLibraryPresets = useMemo(() => [...CHARACTER_PRESETS, ...RAID_PARTY], [])
  const seen = new Set([...keep.roster.map((entry) => entry.character.name), ...keep.collection.map((record) => record.name)])
  const waiting = allLibraryPresets.filter((preset) => !seen.has(preset.name))
  const selectedPreset = open?.kind === 'library' ? allLibraryPresets.find((preset) => preset.name === open.name) : null
  const person = open?.kind === 'roster' ? open.entry.character : open?.kind === 'captive' ? open.record.character : selectedPreset

  const matchesFilter = (target: { name: string; race: Race; danbooruTags?: string; source?: string }) => {
    const q = query.trim()
    if (q && !`${target.name} ${sourceWork(target)} ${RACE_INFO[target.race]?.label ?? ''}`.includes(q)) return false
    if (!matchWorkGroup(sourceWork(target), workGroup)) return false
    if (raceFilter !== 'all' && target.race !== raceFilter) return false
    if (lactOnly && !characterLactates(target)) return false
    return true
  }

  const shownRoster = useMemo(() => keep.roster.filter((e) => matchesFilter(e.character)), [keep.roster, query, workGroup, raceFilter, lactOnly])
  const shownCollection = useMemo(() => keep.collection.filter((r) => matchesFilter(r.character)), [keep.collection, query, workGroup, raceFilter, lactOnly])
  const shownWaiting = useMemo(() => waiting.filter((p) => matchesFilter(p)), [waiting, query, workGroup, raceFilter, lactOnly])
  const filtering = Boolean(query.trim() || workGroup !== '全部' || raceFilter !== 'all' || lactOnly)

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="max-w-5xl lg:max-w-6xl mx-auto space-y-6">
        <button type="button" onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground transition-colors">回到城主厅</button>
        <div>
          <h1 className="text-3xl font-bold gold-text">档案册</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">收录所有踏足过此狱的猎物履历、身体开发记录与五阶状态立绘（矜持 / 动摇 / 沦陷 / 崩坏 / 绝顶）；点击任意角色即可翻阅完整档案并自由切换观赏各阶段立绘。</p>
        </div>

        <div className="rounded-xl border border-border bg-card/70 p-3 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 flex-1 min-w-[11rem] rounded-lg border border-border bg-background px-2.5 py-1.5">
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索角色姓名、作品或种族…"
                aria-label="搜索档案"
                className="flex-1 bg-transparent text-xs outline-none"
              />
            </label>
            <select
              aria-label="按种族筛选"
              value={raceFilter}
              onChange={(e) => setRaceFilter(e.target.value as Race | 'all')}
              className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs"
            >
              <option value="all">全部种族</option>
              {(Object.keys(RACE_INFO) as Race[]).map((r) => (
                <option key={r} value={r}>{RACE_INFO[r].label}</option>
              ))}
            </select>
            <button
              type="button"
              aria-pressed={lactOnly}
              onClick={() => setLactOnly((v) => !v)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${lactOnly ? 'border-pink-400/60 bg-pink-500/15 text-pink-200 font-bold' : 'border-border bg-background text-muted-foreground hover:text-foreground'}`}
            >
              泌乳体质
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {WORK_GROUPS.map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={workGroup === g}
                onClick={() => setWorkGroup(g)}
                className={`px-2.5 py-0.5 rounded-full border text-[11px] transition-colors ${workGroup === g ? 'border-primary bg-primary/15 text-primary font-bold' : 'border-border text-muted-foreground hover:text-foreground'}`}
              >
                {g}
              </button>
            ))}
          </div>
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
          {(keep.roster.length > 0 || keep.collection.length > 0) && shownRoster.length === 0 && shownCollection.length === 0 && filtering && (
            <p className="text-xs text-muted-foreground">在狱与收藏室中没有匹配当前筛选条件的角色。</p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {shownRoster.map((entry) => {
              const stageCount = availablePortraitStages(entry.character, manifest).length
              return (
                <button key={entry.id} type="button" onClick={() => setOpen({ kind: 'roster', entry })} className="group dungeon-border rounded-xl bg-card p-2.5 text-left hover:border-primary/60 transition-all">
                  <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden border border-border bg-secondary">
                    <StatePortrait character={entry.character} className="w-full h-full transition-transform duration-300 group-hover:scale-[1.03]" />
                    {stageCount > 0 && <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-pink-200">{stageCount}阶立绘</span>}
                  </div>
                  <p className="font-bold mt-2 truncate">{entry.character.name}</p>
                  <p className="text-[11px] text-amber-200/85 mt-0.5 truncate">{entry.station}</p>
                </button>
              )
            })}
            {shownCollection.map((record) => {
              const stageCount = availablePortraitStages(record.character, manifest).length
              return (
                <button key={record.id} type="button" onClick={() => setOpen({ kind: 'captive', record })} className="group dungeon-border rounded-xl bg-card p-2.5 text-left hover:border-primary/60 transition-all">
                  <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden border border-border bg-secondary">
                    <StatePortrait character={{ ...record.character, pleasure: record.pleasure, desire: record.desire }} className="w-full h-full transition-transform duration-300 group-hover:scale-[1.03]" />
                    {stageCount > 0 && <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-pink-200">{stageCount}阶立绘</span>}
                  </div>
                  <p className="font-bold mt-2 truncate">{record.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{FATE_LABEL[record.fate]}{record.cage ? ` · ${CAGES[record.cage].label}` : ''}</p>
                </button>
              )
            })}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm tracking-widest text-muted-foreground">还没来过的角色库</h2>
          {waiting.length === 0 && <p className="text-sm text-muted-foreground">角色库里的人都已经进过这座狱。</p>}
          {waiting.length > 0 && shownWaiting.length === 0 && filtering && <p className="text-xs text-muted-foreground">未入狱角色库中没有匹配当前筛选条件的角色。</p>}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {shownWaiting.map((preset) => {
              const stageCount = availablePortraitStages(preset, manifest).length
              return (
                <button key={preset.name} type="button" onClick={() => setOpen({ kind: 'library', name: preset.name })} className="group dungeon-border rounded-xl bg-card p-2.5 text-left hover:border-primary/60 transition-all">
                  <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden border border-border bg-secondary">
                    <StatePortrait character={characterFromPreset(preset)} className="w-full h-full transition-transform duration-300 group-hover:scale-[1.03]" />
                    {stageCount > 0 && <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-pink-200">{stageCount}阶立绘</span>}
                  </div>
                  <p className="font-bold mt-2 truncate">{preset.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{sourceWork(preset)} · {RACE_INFO[preset.race]?.label}</p>
                </button>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
