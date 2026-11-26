import { normalizeParty } from '@/lib/party'
import {
  CHARACTER_PRESETS,
  PRESET_TRAPS,
  getFloorTheme,
  rollFloorThemes,
  type Character,
  type CharacterPreset,
  type GameSession,
  type PresetTrap,
  type Race,
  type BodyPart,
  type Encounter,
  type StatusEffect,
} from '@/lib/types'
import { emptyMemory, readMemory, type AdventureMemory } from '@/lib/adventure-memory'
import { unlockedDevTraits } from '@/lib/body-development'
import { cleanContent } from '@/lib/chat-protocol'
import { floorSynergies, synergyBonus } from '@/lib/synergy'
import { BASE_TRIGGER, FLOOR_MONSTER_CAP, FLOOR_TRAP_CAP, MONSTER_MUTATIONS, PHASES, THEME_BONUS, THEME_TRIGGER, TRAP_CATEGORIES, antiRepeatLine, monsterLevelUpBlock, monsterNextLevelRule, monsterParts, nextLevelRule, levelUpBlock, relayLine, themeMatch, trapCategory, trapHabit, trapParts, trapPromptLine, trapRestraint, trapSheet, trapStatusId, trapStatuses } from '@/lib/trap-craft'
import { emptyCampaign, isRaidMember, RAID_PARTY, readCampaign, threatPromptLine, type Campaign } from '@/lib/campaign'
import { backfillCorruptionFromTurns } from '@/lib/terms-dk'

export type OpeningKind = 'personal' | 'trap' | 'monster' | 'corridor'
export type IntruderFate = 'kept' | 'broken' | 'defeated'
export type CollectionReturn = 'train' | 'recall' | 'reexplore' | 'pretend'
export type CageKind = 'cell' | 'machine' | 'ranch' | 'tentacle' | 'breeding'

export const CAGES: Record<CageKind, { label: string; holds: string; watch: string; enter: string }> = {
  cell: {
    label: '普通地牢',
    holds: '石墙、铁栏和一铺干草，没有额外的机关。',
    watch: '城主站在栏外看。栏里只有她和铁链，没有人动手，关着本身就在耗她。城主不伸手。',
    enter: '城主推门进去，这一轮由自己动手。',
  },
  machine: {
    label: '机械牢笼',
    holds: '金属架、活塞、夹具和会自己收紧的束带。',
    watch: '城主站在栅栏外看机器按固定节奏运转。夹具、活塞和束带自己折磨她。城主不伸手。',
    enter: '城主走进机械牢笼，亲手改这一轮的节奏。',
  },
  ranch: {
    label: '人类牧场',
    holds: '栏位、挤奶架、食槽和挂在颈上的牌子。她被当成栏里的家畜。',
    watch: '城主站在牧场栏外看。她被固定在挤奶架或食槽上，场里的规矩自己运转。城主不伸手。',
    enter: '城主走进栏位，这一轮亲手调教。',
  },
  tentacle: {
    label: '触手牢笼',
    holds: '活着的触手从墙和地板里伸出来，把人缠在笼心。',
    watch: '城主站在笼外看触手自己缠她、钻她、喂她。城主不伸手。',
    enter: '城主走进触手牢笼，命令这一轮怎么缠。',
  },
  breeding: {
    label: '兽人配种场',
    holds: '配种架、发情的兽人和把她固定住的轭。',
    watch: '城主站在场外看兽人按配种场的规矩使用她。城主不伸手。',
    enter: '城主走进配种场，这一轮由自己下令。',
  },
}

const CAGE_KINDS = new Set<CageKind>(['cell', 'machine', 'ranch', 'tentacle', 'breeding'])

export function cageKind(value: unknown, fate?: IntruderFate): CageKind | undefined {
  if (fate === 'defeated') return undefined
  return typeof value === 'string' && CAGE_KINDS.has(value as CageKind) ? value as CageKind : 'cell'
}

export interface KeeperBrief {
  opening: OpeningKind
  defenseName?: string
  defenseSummary?: string
  return?: CollectionReturn
  cage?: CageKind
}

export interface KeeperTrap {
  id: string
  name: string
  mechanism: string
  prose: string
  placed: boolean
  source: 'preset' | 'custom'
  /** 17 类之一，决定感官表和撞上时的状态 */
  category?: string
  status?: string
  habit?: string
  level?: number
  hits?: number
}

export interface KeeperMonster {
  id: string
  name: string
  appearance: string
  behavior: string
  habit?: string
  level?: number
  hits?: number
  mutations?: string[]
  placed: boolean
  source: 'preset' | 'custom'
  temporary?: boolean
}

export interface CaptiveRecord {
  id: string
  name: string
  race: Race
  fate: IntruderFate
  avatarUrl: string | null
  pleasure: number
  desire: number
  character: Character
  savedAt: number
  recall: string
  memory: AdventureMemory
  cage?: CageKind
  ledger?: string
  /** 若派驻到迷宫某一层（1..depth）充当活体肉饵/展示架 */
  lureFloor?: number
}

export interface DungeonFloor {
  name: string
  ambience: string
  trapIds: string[]
  monsterIds: string[]
  /** 守在这一层的魔物：她在这层时它先出场 */
  guardId?: string
}

export interface EncounterRecord { id: string; name: string; kind: 'trap' | 'monster'; intruder: string; floor: number; at: number }
export interface PhaseState { id: string; phase: number }

export const TEMP_MONSTER_COST = 6

export interface DungeonProgress {
  essence: number
  trapSlots: number
  monsterSlots: number
  depth: number
  monsterRank: number
  intruderSlots: number
}

export type UpgradeKey = 'trapSlots' | 'monsterSlots' | 'depth' | 'monsterRank' | 'intruderSlots'

export interface RosterEntry {
  id: string
  station: string
  character: Character
  session: GameSession | null
  conversationId: string
  brief: KeeperBrief
}

export interface KeeperSave {
  dungeonName: string
  dungeonDescription: string
  floors: DungeonFloor[]
  traps: KeeperTrap[]
  monsters: KeeperMonster[]
  collection: CaptiveRecord[]
  recentNames: string[]
  brief: KeeperBrief | null
  progress: DungeonProgress
  roster: RosterEntry[]
  activeId: string | null
  campaign?: Campaign
  /** 图鉴：谁在哪一层撞上了什么 */
  history?: EncounterRecord[]
  /** 每个在狱的人当前遭遇进行到哪个阶段 */
  phases?: Record<string, PhaseState>
  /** 收藏室后台囚笼产髓与动态日志（最近几条） */
  recentFeed?: string[]
}

export interface KeeperFloorView {
  name: string
  ambience: string
  defenses: { id?: string; name: string; kind: 'trap' | 'monster'; summary: string; parts?: BodyPart[] }[]
}

export interface KeeperPromptContext {
  opening: OpeningKind | null
  defenseName?: string
  defenseSummary?: string
  return?: CollectionReturn
  defenses: { name: string; kind: 'trap' | 'monster'; summary: string }[]
  depth: number
  monsterRank: number
  dungeonName: string
  dungeonDescription: string
  floors: KeeperFloorView[]
  threat?: string
  bondNote?: string
  lureNote?: string
  combos?: string
  phases?: Record<string, PhaseState>
  activeId?: string | null
  antiRepeat?: string
  trapInfo?: Record<string, { name: string; habit: string; escalate: string[]; mechanism: string; prose?: string; category: string; level: number }>
}

const RACES = new Set<Race>(['human', 'elf', 'tauren', 'fox', 'cat', 'machine', 'dragon', 'succubus'])

export function emptyProgress(): DungeonProgress {
  return { essence: 0, trapSlots: 2, monsterSlots: 1, depth: 3, monsterRank: 1, intruderSlots: 1 }
}

export const FATE_ESSENCE: Record<IntruderFate, number> = {
  kept: 8,
  broken: 16,
  defeated: 3,
}

export const PRESET_MONSTERS: Omit<KeeperMonster, 'placed' | 'source'>[] = [
  {
    id: 'tentacle_warden',
    name: '廊道触手看守',
    appearance: '壁龛里一丛湿亮的触手，末端是吸盘，平时缩在石缝中，只在城主允许时伸出来。',
    behavior: '缠住闯入者的手腕、大腿和衣物开口。城主可以命令它收紧、松开，或只钻一个孔。它不离开被指定的那段廊道。',
    habit: '听令守规矩，没下令只缠不插，一下令就死死箍住不放',
  },
  {
    id: 'slime_pet',
    name: '暖巢史莱姆',
    appearance: '半透明的暖色史莱姆，能摊开包住一个人，体内有缓慢的震动核。',
    behavior: '按命令包裹闯入者，溶解她身上松动的布料，用震动核磨她被点名的部位。城主不下令时，它只把人托住，不继续深入。',
    habit: '温吞黏人，喜欢慢慢溶掉衣服再用震动核贴着敏感处磨',
  },
  {
    id: 'milking_construct',
    name: '挤奶构装',
    appearance: '一具矮小的金属构装，手臂换成温热的吸杯和托槽，关节里有奶渍。',
    behavior: '把闯入者固定成方便挤压的姿势，吸杯罩住乳房。只有她已经在泌乳，或城主命令它把奶挤出来时，才持续抽吸。',
    habit: '执拗刻板，罩上乳房就按固定节拍抽吸，不理会讨饶',
  },
  {
    id: 'foxfire_wisp',
    name: '狐火小妖',
    appearance: '一簇会说话的淡紫狐火，没有固定身体，能贴在皮肤上发烫。',
    behavior: '贴着耳、尾根、小腹或城主点名的皮肤游走，用热度把人逼到腿软。它不独自插入，插入要等城主改命令。',
    habit: '爱挑逗，专挑耳尖和尾根吹热气，看她腿软还要嘴硬',
  },
]

function defaultFloor(index: number): DungeonFloor {
  const theme = getFloorTheme(undefined, index + 1)
  return { name: theme.name, ambience: theme.ambience.slice(0, 240), trapIds: [], monsterIds: [] }
}

export function defaultFloors(depth: number): DungeonFloor[] {
  return Array.from({ length: depth }, (_, index) => defaultFloor(index))
}

export function emptyKeep(): KeeperSave {
  return {
    dungeonName: '无名淫狱', dungeonDescription: '', floors: defaultFloors(3),
    traps: [], monsters: [], collection: [], recentNames: [], brief: null,
    progress: emptyProgress(), roster: [], activeId: null, campaign: emptyCampaign(), history: [], phases: {},
  }
}

export function encounterId(value: string): string {
  const cleaned = value.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 48)
  return cleaned || 'custom'
}

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function uniqueById<T extends { id: string }>(rows: T[]): T[] {
  const seen = new Set<string>()
  const unique: T[] = []
  for (const row of rows) {
    if (seen.has(row.id)) continue
    seen.add(row.id)
    unique.push(row)
  }
  return unique
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const number = typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : fallback
  return Math.min(max, Math.max(min, number))
}

function readProgress(value: unknown): DungeonProgress {
  const base = emptyProgress()
  if (!value || typeof value !== 'object') return base
  const raw = value as Partial<DungeonProgress>
  return {
    essence: clampInt(raw.essence, 0, 9999, 0),
    trapSlots: clampInt(raw.trapSlots, 2, 6, base.trapSlots),
    monsterSlots: clampInt(raw.monsterSlots, 1, 4, base.monsterSlots),
    depth: clampInt(raw.depth, 3, 10, base.depth),
    monsterRank: clampInt(raw.monsterRank, 1, 5, base.monsterRank),
    intruderSlots: clampInt(raw.intruderSlots, 1, 3, base.intruderSlots),
  }
}

function capPlaced<T extends { placed: boolean }>(rows: T[], slots: number): T[] {
  let left = slots
  return rows.map((row) => {
    if (!row.placed) return row
    if (left > 0) {
      left -= 1
      return row
    }
    return { ...row, placed: false }
  })
}

function readBrief(value: unknown): KeeperBrief | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Partial<KeeperBrief>
  const openings = new Set<OpeningKind>(['personal', 'trap', 'monster', 'corridor'])
  const returns = new Set<CollectionReturn>(['train', 'recall', 'reexplore', 'pretend'])
  if (!raw.opening || !openings.has(raw.opening)) return null
  return {
    opening: raw.opening,
    defenseName: text(raw.defenseName, 40) || undefined,
    defenseSummary: text(raw.defenseSummary, 300) || undefined,
    return: raw.return && returns.has(raw.return) ? raw.return : undefined,
    cage: raw.cage && CAGE_KINDS.has(raw.cage) ? raw.cage : undefined,
  }
}

function readFloors(value: unknown, depth: number, traps: KeeperTrap[], monsters: KeeperMonster[]): DungeonFloor[] {
  const saved = Array.isArray(value) ? value : []
  const floors = Array.from({ length: depth }, (_, index) => {
    const row = saved[index] && typeof saved[index] === 'object' ? saved[index] as Partial<DungeonFloor> : {}
    const base = defaultFloor(index)
    const ids = (list: unknown) => Array.isArray(list) ? list.filter((id): id is string => typeof id === 'string' && id.length > 0) : []
    return {
      name: text(row.name, 24) || base.name,
      ambience: text(row.ambience, 240) || base.ambience,
      trapIds: [...new Set(ids(row.trapIds))],
      monsterIds: [...new Set(ids(row.monsterIds))],
      guardId: typeof row.guardId === 'string' ? row.guardId : undefined,
    }
  })
  const trapById = new Map(traps.map((trap) => [trap.id, trap]))
  const monsterById = new Map(monsters.map((monster) => [monster.id, monster]))
  const seenTraps = new Set<string>()
  const seenMonsters = new Set<string>()
  const overflowTraps: string[] = []
  const overflowMonsters: string[] = []
  for (const floor of floors) {
    const t = floor.trapIds.filter((id) => trapById.get(id)?.placed && !seenTraps.has(id))
    const m = floor.monsterIds.filter((id) => monsterById.get(id)?.placed && !seenMonsters.has(id))
    t.forEach((id) => seenTraps.add(id)); m.forEach((id) => seenMonsters.add(id))
    // 旧档一层可能塞了很多件：超过每层上限的挪到下面有空位的层
    floor.trapIds = t.slice(0, FLOOR_TRAP_CAP); overflowTraps.push(...t.slice(FLOOR_TRAP_CAP))
    floor.monsterIds = m.slice(0, FLOOR_MONSTER_CAP); overflowMonsters.push(...m.slice(FLOOR_MONSTER_CAP))
  }
  for (const trap of traps) if (trap.placed && !seenTraps.has(trap.id)) overflowTraps.push(trap.id)
  for (const monster of monsters) if (monster.placed && !seenMonsters.has(monster.id)) overflowMonsters.push(monster.id)
  for (const id of overflowTraps) {
    const room = floors.find((floor) => floor.trapIds.length < FLOOR_TRAP_CAP)
    if (room) room.trapIds.push(id); else { const trap = trapById.get(id); if (trap) trap.placed = false }
  }
  for (const id of overflowMonsters) {
    const room = floors.find((floor) => floor.monsterIds.length < FLOOR_MONSTER_CAP)
    if (room) room.monsterIds.push(id); else { const monster = monsterById.get(id); if (monster) monster.placed = false }
  }
  for (const floor of floors) if (floor.guardId && !floor.monsterIds.includes(floor.guardId)) floor.guardId = undefined
  return floors
}

function readSession(value: unknown): GameSession | null {
  if (!value || typeof value !== 'object' || !('messages' in value) || !Array.isArray(value.messages)) return null
  const session = value as GameSession
  return {
    ...session,
    messages: session.messages.filter((message) => message && (message.role === 'user' || message.role === 'assistant') && typeof message.content === 'string').slice(-200),
    summary: typeof session.summary === 'string' ? session.summary.slice(0, 8000) : '',
  }
}

export function normalizeKeep(value: unknown): KeeperSave {
  const base = emptyKeep()
  if (!value || typeof value !== 'object') return base
  const raw = value as Partial<KeeperSave>
  const progress = readProgress(raw.progress)
  const traps = uniqueById(Array.isArray(raw.traps) ? raw.traps.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const row = item as Partial<KeeperTrap>
    const name = text(row.name, 40)
    const mechanism = text(row.mechanism, 400)
    if (!name || !mechanism) return []
    return [{
      id: encounterId(text(row.id, 60) || name),
      name,
      mechanism,
      prose: text(row.prose, 800),
      placed: row.placed === true,
      source: row.source === 'preset' ? 'preset' as const : 'custom' as const,
      ...migrateTrapFields(row, encounterId(text(row.id, 60) || name), name, mechanism),
    }]
  }) : []).slice(0, 40)
  const monsters = uniqueById(Array.isArray(raw.monsters) ? raw.monsters.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const row = item as Partial<KeeperMonster>
    const name = text(row.name, 40)
    const behavior = text(row.behavior, 400)
    if (!name || !behavior) return []
    const validMutIds = new Set(MONSTER_MUTATIONS.map((m) => m.id))
    const mutations = Array.isArray(row.mutations)
      ? [...new Set(row.mutations.filter((m): m is string => typeof m === 'string' && validMutIds.has(m)))].slice(0, 2)
      : []
    return [{
      id: encounterId(text(row.id, 60) || name),
      name,
      appearance: text(row.appearance, 240),
      behavior,
      ...(text(row.habit, 80) ? { habit: text(row.habit, 80) } : {}),
      level: clampInt(row.level, 1, 3, 1),
      hits: clampInt(row.hits, 0, 999, 0),
      ...(mutations.length ? { mutations } : {}),
      placed: row.placed === true,
      source: row.source === 'preset' ? 'preset' as const : 'custom' as const,
      temporary: row.temporary === true,
    }]
  }) : []).slice(0, 40)
  const fates = new Set<IntruderFate>(['kept', 'broken', 'defeated'])
  const collection = (Array.isArray(raw.collection) ? raw.collection.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const row = item as Partial<CaptiveRecord>
    const character = row.character
    if (!character || typeof character !== 'object' || typeof character.name !== 'string' || !character.name.trim()) return []
    if (!row.fate || !fates.has(row.fate)) return []
    const lureFloor = row.fate !== 'defeated' && typeof row.lureFloor === 'number' && row.lureFloor >= 1 && row.lureFloor <= progress.depth
      ? Math.floor(row.lureFloor)
      : undefined
    return [{
      id: text(row.id, 80) || encounterId(character.name),
      name: character.name,
      race: character.race,
      fate: row.fate,
      avatarUrl: typeof row.avatarUrl === 'string' ? row.avatarUrl : character.avatarUrl ?? null,
      pleasure: typeof row.pleasure === 'number' ? row.pleasure : character.pleasure ?? 0,
      desire: typeof row.desire === 'number' ? row.desire : character.desire ?? 0,
      character,
      savedAt: typeof row.savedAt === 'number' ? row.savedAt : 0,
      recall: text(row.recall, 1200),
      memory: readMemory(row.memory),
      cage: cageKind(row.cage, row.fate),
      ledger: text(row.ledger, 800),
      ...(lureFloor ? { lureFloor } : {}),
    }]
  }) : []).slice(0, 40)
  const roster = (Array.isArray(raw.roster) ? raw.roster.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const row = item as Partial<RosterEntry>
    const character = row.character
    if (!character || typeof character !== 'object' || typeof character.name !== 'string' || !character.name.trim()) return []
    if (!RACES.has(character.race)) return []
    const brief = readBrief(row.brief) ?? { opening: 'personal' as const }
    const session = readSession(row.session)
    const hydrated = backfillCorruptionFromTurns(hydrateCharacterPreset(normalizeParty(character)), session?.turns)
    return [{
      id: text(row.id, 80) || encounterId(character.name),
      station: text(row.station, 40) || '在狱里',
      character: hydrated,
      session,
      conversationId: text(row.conversationId, 80) || encounterId(character.name),
      brief,
    }]
  }) : []).slice(0, 3)
  const activeId = typeof raw.activeId === 'string' && roster.some((entry) => entry.id === raw.activeId) ? raw.activeId : null
  const placedTraps = capPlaced(traps, progress.trapSlots).map((trap) => ({ ...trap }))
  const placedMonsters = capPlaced(monsters, progress.monsterSlots).map((monster) => ({ ...monster }))
  const floors = readFloors(raw.floors, progress.depth, placedTraps, placedMonsters)
  return {
    dungeonName: text(raw.dungeonName, 24) || base.dungeonName,
    dungeonDescription: text(raw.dungeonDescription, 400),
    floors,
    traps: placedTraps,
    monsters: placedMonsters,
    collection,
    recentNames: Array.isArray(raw.recentNames) ? raw.recentNames.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).slice(-8) : [],
    brief: readBrief(raw.brief),
    progress,
    roster,
    activeId,
    campaign: readCampaign(raw.campaign),
    history: readHistory(raw.history),
    phases: readPhases(raw.phases, roster.map((entry) => entry.id)),
    recentFeed: Array.isArray(raw.recentFeed) ? raw.recentFeed.filter((s): s is string => typeof s === 'string' && s.trim().length > 0).slice(0, 8) : [],
  }
}

function migrateTrapFields(row: Partial<KeeperTrap>, id: string, name: string, mechanism: string): Pick<KeeperTrap, 'category' | 'status' | 'habit' | 'level' | 'hits'> {
  const category = typeof row.category === 'string' && TRAP_CATEGORIES.includes(row.category) ? row.category : trapCategory({ id, name, mechanism })
  const draft = { id, name, mechanism, category, status: typeof row.status === 'string' ? row.status : undefined }
  return {
    category,
    status: trapStatusId(draft),
    habit: text(row.habit, 80) || trapHabit({ ...draft, habit: '' }),
    level: clampInt(row.level, 1, 3, 1),
    hits: clampInt(row.hits, 0, 999, 0),
  }
}

function readHistory(value: unknown): EncounterRecord[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const row = item as Partial<EncounterRecord>
    const id = text(row.id, 60); const name = text(row.name, 40)
    if (!id || !name) return []
    return [{ id, name, kind: row.kind === 'monster' ? 'monster' as const : 'trap' as const, intruder: text(row.intruder, 40), floor: clampInt(row.floor, 1, 10, 1), at: typeof row.at === 'number' ? row.at : 0 }]
  }).slice(0, 60)
}

function readPhases(value: unknown, rosterIds: string[]): Record<string, PhaseState> {
  if (!value || typeof value !== 'object') return {}
  const out: Record<string, PhaseState> = {}
  for (const [key, row] of Object.entries(value as Record<string, Partial<PhaseState>>)) {
    if (!rosterIds.includes(key) || !row || typeof row.id !== 'string') continue
    out[key] = { id: row.id, phase: clampInt(row.phase, 0, PHASES.length - 1, 0) }
  }
  return out
}

export function trapFromPreset(preset: PresetTrap): KeeperTrap {
  const base = { id: preset.id, name: preset.name, mechanism: preset.hint, category: preset.category }
  return { ...base, prose: '', placed: false, source: 'preset', status: trapStatusId(base), habit: trapHabit(base), level: 1, hits: 0 }
}

export function monsterFromPreset(preset: Omit<KeeperMonster, 'placed' | 'source'>): KeeperMonster {
  return { ...preset, level: 1, hits: 0, placed: false, source: 'preset' }
}

export function trapSummary(trap: Pick<KeeperTrap, 'mechanism' | 'prose'>): string {
  return [trap.mechanism, trap.prose].filter(Boolean).join(' ').slice(0, 500)
}

export function monsterMutationSummary(monster: Pick<KeeperMonster, 'level' | 'mutations'>): string {
  const muts = (monster.mutations ?? [])
    .map((id) => MONSTER_MUTATIONS.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => !!m)
  if (!muts.length) return ''
  return `变异进化（Lv${monster.level ?? 1}）：${muts.map((m) => `「${m.label}」${m.effect}`).join('；')}。`
}

export function placedDefenses(save: KeeperSave): { id: string; name: string; kind: 'trap' | 'monster'; summary: string }[] {
  return [
    ...save.traps.filter((trap) => trap.placed).map((trap) => ({ id: trap.id, name: trap.name, kind: 'trap' as const, summary: trapSummary(trap) })),
    ...save.monsters.filter((monster) => monster.placed).map((monster) => ({
      id: monster.id,
      name: monster.name,
      kind: 'monster' as const,
      summary: [monster.appearance, monster.behavior, monster.habit ? `习性：${monster.habit}。` : '', monsterMutationSummary(monster)].filter(Boolean).join(' '),
    })),
  ]
}

export function defensesOnFloor(save: KeeperSave, floor: number): { id: string; name: string; kind: 'trap' | 'monster'; summary: string }[] {
  const layer = save.floors?.[floor - 1]
  if (!layer) return []
  const all = placedDefenses(save)
  const ids = new Set([...layer.trapIds, ...layer.monsterIds])
  return all.filter((item) => ids.has(item.id))
}

function floorViews(save: KeeperSave): KeeperFloorView[] {
  const all = placedDefenses(save)
  return (save.floors ?? []).map((floor) => {
    const ids = new Set([...floor.trapIds, ...floor.monsterIds])
    return {
      name: floor.name,
      ambience: floor.ambience,
      defenses: all.filter((item) => ids.has(item.id)).map(({ id, name, kind, summary }) => {
        const trap = kind === 'trap' ? save.traps.find((t) => t.id === id) : undefined
        const guard = kind === 'monster' && floor.guardId === id ? '它守在这一层，她在这层时它先出场。' : ''
        return { id, name, kind, summary: trap ? `${summary.slice(0, 200)} ${trapPromptLine(trap)}` : `${summary}${guard ? ` ${guard}` : ''}`, parts: trap ? trapParts(trap) : [] }
      }),
    }
  })
}

export function floorRelay(save: KeeperSave, floor: number): string {
  const layer = save.floors?.[floor - 1]
  if (!layer) return ''
  const traps = layer.trapIds.map((id) => save.traps.find((t) => t.id === id)).filter((t): t is KeeperTrap => !!t)
  const monsters = [...layer.monsterIds].sort((a, b) => (a === layer.guardId ? -1 : b === layer.guardId ? 1 : 0))
    .map((id) => save.monsters.find((m) => m.id === id)).filter((m): m is KeeperMonster => !!m)
  const order = [...traps.map((t) => ({ name: t.name, kind: 'trap' as const, parts: trapParts(t) })), ...monsters.map((m) => ({ name: m.name, kind: 'monster' as const }))]
  const combos = floorSynergies(save, floor)
  const active = save.roster?.find((entry) => entry.id === save.activeId)
  const base = relayLine(order, combos.map((c) => c.name), active?.character.encounter?.name)
  return base && combos.length ? `${base}${combos.map((c) => `「${c.name}」${c.note}`).join('')}` : base
}

export function lureOnFloor(save: KeeperSave, floor: number): CaptiveRecord | undefined {
  return (save.collection ?? []).find((rec) => rec.fate !== 'defeated' && rec.lureFloor === floor)
}

export const LURE_BONUS = 0.15

/** 这一层的总加成：连携（上限 60%）+ 主题契合 10% + 活体肉饵驻层 15% */
export function floorBonus(save: KeeperSave, floor: number): { synergy: number; theme: number; lure: number; total: number } {
  const synergy = synergyBonus(floorSynergies(save, floor))
  const theme = floorThemed(save, floor).length ? THEME_BONUS : 0
  const lure = lureOnFloor(save, floor) ? LURE_BONUS : 0
  return { synergy, theme, lure, total: synergy + theme + lure }
}

export function floorThemed(save: KeeperSave, floor: number): string[] {
  const layer = save.floors?.[floor - 1]
  if (!layer) return []
  const texts = [
    ...layer.trapIds.map((id) => save.traps.find((t) => t.id === id)).filter(Boolean).map((t) => `${t!.name} ${t!.mechanism}`),
    ...layer.monsterIds.map((id) => save.monsters.find((m) => m.id === id)).filter(Boolean).map((m) => `${m!.name} ${m!.behavior}`),
  ]
  return themeMatch(`${layer.name} ${layer.ambience}`, texts)
}

export function triggerChance(save: KeeperSave, floor: number): number {
  return floorThemed(save, floor).length ? THEME_TRIGGER : BASE_TRIGGER
}

/** 往里赶时撞上哪一件：守层魔物权重 3 */
export function rollPlacedDefense(save: KeeperSave, floor: number, random: () => number = Math.random): { encounter: Encounter; statuses: StatusEffect[] } | null {
  const placed = defensesOnFloor(save, floor)
  if (!placed.length || random() >= triggerChance(save, floor)) return null
  const guard = save.floors?.[floor - 1]?.guardId
  const weights = placed.map((item) => (item.id === guard ? 3 : 1))
  let roll = random() * weights.reduce((a, b) => a + b, 0)
  let pick = placed[placed.length - 1]
  for (let i = 0; i < placed.length; i++) { roll -= weights[i]; if (roll < 0) { pick = placed[i]; break } }
  const trap = pick.kind === 'trap' ? save.traps.find((t) => t.id === pick.id) : undefined
  const monster = pick.kind === 'monster' ? save.monsters.find((m) => m.id === pick.id) : undefined
  const restraint = trap ? trapRestraint(trap) : (monster && ((monster.level ?? 1) >= 3 || monster.mutations?.includes('bind_tendril')) ? 3 : 2)
  return {
    encounter: { id: encounterId(pick.id), name: pick.name, kind: pick.kind, summary: pick.summary.slice(0, 180), restraint },
    statuses: trap ? trapStatuses(trap) : [],
  }
}

/** 撞上一次：陷阱或魔物 hits+1，记进图鉴，阶段从「触发」开始 */
export function recordSprung(save: KeeperSave, encounter: { id: string; name: string; kind: 'trap' | 'monster' }, intruder: string, floor: number, rosterId?: string | null, at = Date.now()): KeeperSave {
  const record: EncounterRecord = { id: encounter.id, name: encounter.name, kind: encounter.kind, intruder, floor, at }
  const phases = { ...(save.phases ?? {}) }
  if (rosterId) delete phases[rosterId]
  return {
    ...save,
    traps: save.traps.map((trap) => trap.id === encounter.id ? { ...trap, hits: Math.min(999, (trap.hits ?? 0) + 1) } : trap),
    monsters: save.monsters.map((m) => m.id === encounter.id ? { ...m, hits: Math.min(999, (m.hits ?? 0) + 1) } : m),
    history: [record, ...(save.history ?? [])].slice(0, 60),
    phases,
  }
}

/** 一回合结算后推进阶段：同一件遭遇持续就往下一阶段，换了就从「锁定」起（触发那一回合已经写过），没有遭遇就清掉 */
export function advancePhase(save: KeeperSave, rosterId: string | null | undefined, encounter: { id: string } | null | undefined): KeeperSave {
  if (!rosterId) return save
  const phases = { ...(save.phases ?? {}) }
  const now = phases[rosterId]
  if (!encounter) delete phases[rosterId]
  else phases[rosterId] = { id: encounter.id, phase: now && now.id === encounter.id ? Math.min(PHASES.length - 1, now.phase + 1) : 1 }
  return { ...save, phases }
}

export function currentPhase(save: KeeperSave, rosterId: string | null | undefined, encounterIdNow: string | undefined): number {
  if (!rosterId || !encounterIdNow) return 0
  const now = save.phases?.[rosterId]
  return now && now.id === encounterIdNow ? now.phase : 0
}

export function levelUpTrap(save: KeeperSave, id: string): KeeperSave {
  const trap = save.traps.find((t) => t.id === id)
  if (!trap || levelUpBlock(trap, save.progress.essence)) return save
  const rule = nextLevelRule(trap)!
  return {
    ...save,
    progress: { ...save.progress, essence: save.progress.essence - rule.cost },
    traps: save.traps.map((t) => t.id === id ? { ...t, level: rule.level } : t),
  }
}

export function levelUpMonster(save: KeeperSave, id: string, mutationId: string): KeeperSave {
  const monster = save.monsters.find((m) => m.id === id)
  if (!monster || monsterLevelUpBlock(monster, save.progress.essence)) return save
  if (!MONSTER_MUTATIONS.some((m) => m.id === mutationId) || (monster.mutations ?? []).includes(mutationId)) return save
  const rule = monsterNextLevelRule(monster)!
  return {
    ...save,
    progress: { ...save.progress, essence: save.progress.essence - rule.cost },
    monsters: save.monsters.map((m) => m.id === id ? { ...m, level: rule.level, mutations: [...(m.mutations ?? []), mutationId] } : m),
  }
}

/** 将收藏室里的俘虏挂到某一层当活体展示肉饵（每层最多 1 人；传 undefined 收回收藏室）。 */
export function setCaptiveLureFloor(save: KeeperSave, recordId: string, floor?: number): KeeperSave {
  if (floor != null && (floor < 1 || floor > save.progress.depth)) return save
  return {
    ...save,
    collection: save.collection.map((rec) => {
      if (rec.id === recordId && rec.fate !== 'defeated') {
        const next = { ...rec }
        if (floor) next.lureFloor = floor
        else delete next.lureFloor
        return next
      }
      if (floor && rec.lureFloor === floor) {
        const { lureFloor: _drop, ...rest } = rec
        return rest
      }
      return rec
    }),
  }
}

export function lurePromptLine(save: KeeperSave, floor: number, activeName?: string): string {
  const lure = lureOnFloor(save, floor)
  if (!lure || lure.name === activeName) return ''
  const state = lure.fate === 'broken' ? '已被彻底玩坏、眼神失焦地淌着体液' : '已被驯服收押、羞耻地敞着身体'
  return `【本层活体肉饵·${lure.name}】这一层显眼处公开悬挂展示着早先陷落的「${lure.name}」（${state}），诱引魔物与机关气味。写出闯入者路过或受困时亲眼目睹${lure.name}惨状的心理震动、兔死狐悲或羞耻动摇（不写${lure.name}喧宾夺主抢走本回合主戏份）。`
}

/** 迷宫每推进 1 回合，收藏室特殊囚笼中的俘虏在后台自动产出被动淫髓并记下动态。 */
export function tickCollectionPassive(save: KeeperSave): { save: KeeperSave; gained: number; notes: string[] } {
  let gained = 0
  const notes: string[] = []
  for (const rec of save.collection ?? []) {
    if (rec.fate !== 'kept' && rec.fate !== 'broken') continue
    if (rec.lureFloor) {
      gained += 1
      notes.push(`第${rec.lureFloor}层肉饵「${rec.name}」散发催情气息（淫髓 +1）`)
      continue
    }
    const cage = rec.cage ?? 'cell'
    if (cage === 'cell') continue
    const breastLv = rec.character.bodyDevelopment?.breast ?? 0
    const isCow = rec.race === 'tauren' || breastLv >= 2
    const yieldAmt = cage === 'breeding' ? 2 : cage === 'ranch' ? (isCow ? 2 : 1) : 1
    gained += yieldAmt
    const line = cage === 'ranch'
      ? `牧场里的「${rec.name}」又被榨乳架抽出一罐温奶（淫髓 +${yieldAmt}）`
      : cage === 'machine'
        ? `机械牢笼的活塞仍在匀速折磨「${rec.name}」（淫髓 +${yieldAmt}）`
        : cage === 'tentacle'
          ? `触手牢笼缠着「${rec.name}」在笼心吞吐灌喂（淫髓 +${yieldAmt}）`
          : `兽人配种场里「${rec.name}」还在承欢受孕（淫髓 +${yieldAmt}）`
    notes.push(line)
  }
  if (gained <= 0) return { save, gained: 0, notes: [] }
  const feed = [...notes.slice(0, 3), ...(save.recentFeed ?? [])].slice(0, 8)
  return { save: { ...grantEssence(save, gained), recentFeed: feed }, gained, notes }
}

/** 空城一键布防：将「催情花园」与「廊道触手看守」免费配入第 1 层并激活「催情触手」同层连携。 */
export function quickStarterSetup(save: KeeperSave): KeeperSave {
  let next = save
  const pollenPreset = PRESET_TRAPS.find((t) => t.id === 'pollen_garden') ?? PRESET_TRAPS[0]
  const wardenPreset = PRESET_MONSTERS.find((m) => m.id === 'tentacle_warden') ?? PRESET_MONSTERS[0]
  if (pollenPreset && !next.traps.some((t) => t.id === pollenPreset.id)) {
    next = { ...next, traps: [...next.traps, trapFromPreset(pollenPreset)] }
  }
  if (wardenPreset && !next.monsters.some((m) => m.id === wardenPreset.id)) {
    next = { ...next, monsters: [...next.monsters, monsterFromPreset(wardenPreset)] }
  }
  if (pollenPreset) next = stuffDefense(next, 0, 'trap', pollenPreset.id)
  if (wardenPreset) {
    next = stuffDefense(next, 0, 'monster', wardenPreset.id)
    next = setGuard(next, 0, wardenPreset.id)
  }
  return next
}

export function setGuard(save: KeeperSave, floorIndex: number, monsterId: string | null): KeeperSave {
  return { ...save, floors: save.floors.map((floor, index) => index !== floorIndex ? floor : { ...floor, guardId: monsterId && floor.monsterIds.includes(monsterId) ? monsterId : undefined }) }
}

export function bondPromptLine(save: KeeperSave, character: Character | undefined): string {
  if (!character?.bonds?.length) return ''
  const bonds = character.bonds
  const lines: string[] = []
  for (const bond of bonds) {
    if (character.partner?.name === bond.name && !character.party?.split) {
      lines.push(`【羁绊同场·${bond.name}（${bond.relation}）】${bond.togetherLine}`)
      continue
    }
    const inCollection = (save.collection ?? []).find((rec) => rec.name === bond.name && (rec.fate === 'kept' || rec.fate === 'broken'))
    const inRoster = (save.roster ?? []).some((entry) => entry.id !== save.activeId && (entry.character.name === bond.name || entry.character.partner?.name === bond.name))
    const splitPartner = character.partner?.name === bond.name && character.party?.split
    if (inCollection || inRoster || splitPartner) {
      const state = inCollection?.fate === 'broken'
        ? '已被玩坏收进收藏室'
        : inCollection
          ? '已被留在收藏室'
          : '此刻也困在这座地下城里'
      lines.push(`【羁绊在狱·${bond.name}（${bond.relation}，${state}）】${bond.captiveLine}`)
    }
  }
  return lines.join('\n')
}

export function keeperPromptContext(save: KeeperSave, recentAssistant: string[] = []): KeeperPromptContext {
  const active = save.roster?.find((entry) => entry.id === save.activeId)
  const floor = active?.character.floor ?? 1
  const encounter = active?.character.encounter
  const trap = encounter ? save.traps.find((t) => t.id === encounter.id) : undefined
  return {
    opening: save.brief?.opening ?? null,
    defenseName: save.brief?.defenseName,
    defenseSummary: save.brief?.defenseSummary,
    return: save.brief?.return,
    defenses: placedDefenses(save).map(({ name, kind, summary }) => ({ name, kind, summary })),
    depth: save.progress?.depth ?? 3,
    monsterRank: save.progress?.monsterRank ?? 1,
    dungeonName: save.dungeonName || '无名淫狱',
    dungeonDescription: save.dungeonDescription || '',
    floors: floorViews(save),
    combos: floorRelay(save, floor),
    phases: save.phases ?? {},
    activeId: save.activeId,
    antiRepeat: antiRepeatLine(recentAssistant, trap ? trapSheet(trap).escalate : undefined),
    trapInfo: Object.fromEntries(save.traps.map((t) => [t.id, { name: t.name, habit: trapHabit(t), escalate: trapSheet(t).escalate, mechanism: t.mechanism, prose: t.prose, category: trapCategory(t), level: t.level ?? 1 }])),
    threat: threatPromptLine(save.campaign ?? emptyCampaign(), isRaidMember(active?.character.name ?? '')),
    bondNote: bondPromptLine(save, active?.character),
    lureNote: lurePromptLine(save, floor, active?.character.name),
  }
}

export type SceneMode = 'train' | 'explore'

/** Shared labels for the scene screen. Training stays in the cage. Everything else is exploration. */
export function sceneChrome(
  brief: Pick<KeeperPromptContext, 'return' | 'defenseName'> | null | undefined,
  floor = 1,
): {
  mode: SceneMode
  tab: string
  start: string
  placeholder: string
  backTitle: string
  optionLabels: [string, string, string, string]
  placeLabel: string
  placeDetail: string
  toolLabel: string
} {
  if (brief?.return === 'train') {
    const cage = brief.defenseName || CAGES.cell.label
    return {
      mode: 'train',
      tab: '调教',
      start: '开始这一轮',
      placeholder: '写下这一轮的拷问...',
      backTitle: '回到城主厅，这一轮会留着',
      optionLabels: ['加码', '换部位', '停手看', '换一种'],
      placeLabel: cage,
      placeDetail: '这一轮 · 她出不去',
      toolLabel: '随机拷问',
    }
  }
  return {
    mode: 'explore',
    tab: '探索',
    start: brief?.return === 'recall' ? '看她出现' : '看她进来',
    placeholder: '看她，或把她往前赶...',
    backTitle: '回到城主厅，这场探索会留着',
    optionLabels: ['驱赶', '观察', '布置', '收手'],
    placeLabel: `第 ${floor} 层`,
    placeDetail: '往里赶才会撞上布置',
    toolLabel: '随机拷问',
  }
}

export function stationFor(brief: KeeperBrief): string {
  if (brief.return === 'train') return `在${brief.defenseName || CAGES[brief.cage ?? 'cell'].label}`
  if (brief.return === 'pretend') return '在往外的路上'
  if (brief.return === 'reexplore') return '在再次探索'
  if (brief.return === 'recall' && brief.opening !== 'trap') return '在迷宫里'
  if (brief.opening === 'personal') return '在你手上'
  if (brief.opening === 'corridor') return '在廊道里'
  if (brief.opening === 'trap') return `在「${brief.defenseName ?? '陷阱'}」里`
  return `在「${brief.defenseName ?? '魔物'}」身边`
}

export function essenceFromPleasure(before: number, after: number): number {
  const rose = after - before
  if (rose <= 0) return 0
  return rose >= 20 ? 2 : 1
}

/** 一回合的淫髓：快感涨幅折算，再乘这一层的连携/主题/肉饵加成与猎物已觉醒的敏感体质倍率 */
export function turnEssence(save: KeeperSave, before: number, after: number, floor: number, character?: Pick<Character, 'bodyDevelopment'>): number {
  const traitMult = character ? Math.min(0.4, unlockedDevTraits(character.bodyDevelopment).length * 0.08) : 0
  return Math.round(essenceFromPleasure(before, after) * (1 + floorBonus(save, floor).total + traitMult))
}

/** 结算留下/玩坏/放走的淫髓：她最后所在那一层的加成同样算进去 */
export function fateEssence(save: KeeperSave, fate: IntruderFate, floor: number): number {
  return Math.round(FATE_ESSENCE[fate] * (1 + floorBonus(save, floor).total))
}

export function grantEssence(save: KeeperSave, amount: number): KeeperSave {
  if (amount <= 0) return save
  return { ...save, progress: { ...save.progress, essence: Math.min(9999, save.progress.essence + amount) } }
}

export function upgradeCost(progress: DungeonProgress, key: UpgradeKey): number | null {
  if (key === 'trapSlots') return progress.trapSlots >= 6 ? null : 6 + (progress.trapSlots - 2) * 4
  if (key === 'monsterSlots') return progress.monsterSlots >= 4 ? null : 8 + (progress.monsterSlots - 1) * 4
  if (key === 'depth') return progress.depth >= 10 ? null : 8 + (progress.depth - 3) * 2
  if (key === 'monsterRank') return progress.monsterRank >= 5 ? null : 6 + (progress.monsterRank - 1) * 4
  return progress.intruderSlots >= 3 ? null : progress.intruderSlots === 1 ? 12 : 20
}

export function buyUpgrade(save: KeeperSave, key: UpgradeKey): KeeperSave {
  const cost = upgradeCost(save.progress, key)
  if (cost == null || save.progress.essence < cost) return save
  return { ...save, progress: { ...save.progress, essence: save.progress.essence - cost, [key]: save.progress[key] + 1 } }
}

export function stuffDefense(save: KeeperSave, floorIndex: number, kind: 'trap' | 'monster', id: string): KeeperSave {
  if (!save.floors || floorIndex < 0 || floorIndex >= save.floors.length) return save
  const key = kind === 'trap' ? 'trapIds' as const : 'monsterIds' as const
  const list = kind === 'trap' ? save.traps : save.monsters
  const target = list.find((item) => item.id === id)
  if (!target) return save
  const cap = kind === 'trap' ? save.progress.trapSlots : save.progress.monsterSlots
  if (!target.placed && list.filter((item) => item.placed).length >= cap) return save
  const floorCap = kind === 'trap' ? FLOOR_TRAP_CAP : FLOOR_MONSTER_CAP
  const there = save.floors[floorIndex][key]
  if (!there.includes(id) && there.length >= floorCap) return save
  const floors = save.floors.map((floor, index) => ({ ...floor, [key]: floor[key].filter((item) => item !== id), guardId: floor.guardId === id && index !== floorIndex ? undefined : floor.guardId }))
  floors[floorIndex] = { ...floors[floorIndex], [key]: [...floors[floorIndex][key], id] }
  if (kind === 'trap') return { ...save, floors, traps: save.traps.map((trap) => trap.id === id ? { ...trap, placed: true } : trap) }
  return { ...save, floors, monsters: save.monsters.map((monster) => monster.id === id ? { ...monster, placed: true } : monster) }
}

export function unstuffDefense(save: KeeperSave, kind: 'trap' | 'monster', id: string): KeeperSave {
  const key = kind === 'trap' ? 'trapIds' as const : 'monsterIds' as const
  const floors = (save.floors ?? []).map((floor) => ({ ...floor, [key]: floor[key].filter((item) => item !== id), guardId: floor.guardId === id ? undefined : floor.guardId }))
  if (kind === 'monster' && save.monsters.some((monster) => monster.id === id && monster.temporary)) {
    return { ...save, floors, monsters: save.monsters.filter((monster) => monster.id !== id) }
  }
  if (kind === 'trap') return { ...save, floors, traps: save.traps.map((trap) => trap.id === id ? { ...trap, placed: false } : trap) }
  return { ...save, floors, monsters: save.monsters.map((monster) => monster.id === id ? { ...monster, placed: false } : monster) }
}

export function togglePlaced(save: KeeperSave, kind: 'trap' | 'monster', id: string): KeeperSave {
  const list = kind === 'trap' ? save.traps : save.monsters
  const target = list.find((item) => item.id === id)
  if (!target) return save
  if (target.placed) return unstuffDefense(save, kind, id)
  return stuffDefense(save, 0, kind, id)
}

export function pinchMonster(save: KeeperSave, floorIndex: number, draft: { name: string; appearance?: string; behavior: string }): KeeperSave | null {
  const name = draft.name.trim().slice(0, 40)
  const behavior = draft.behavior.trim().slice(0, 400)
  if (!name || !behavior) return null
  if (save.progress.essence < TEMP_MONSTER_COST) return null
  if (save.monsters.filter((monster) => monster.placed).length >= save.progress.monsterSlots) return null
  const id = encounterId(`temp_${crypto.randomUUID().replace(/-/g, '')}`)
  const next: KeeperSave = {
    ...save,
    progress: { ...save.progress, essence: save.progress.essence - TEMP_MONSTER_COST },
    monsters: [...save.monsters, {
      id, name, behavior, appearance: (draft.appearance ?? '').trim().slice(0, 240),
      placed: false, source: 'custom', temporary: true,
    }],
  }
  const stuffed = stuffDefense(next, floorIndex, 'monster', id)
  return stuffed.monsters.some((monster) => monster.id === id && monster.placed) ? stuffed : null
}

function activeSituation(memory: AdventureMemory): string {
  return memory.entries
    .filter((entry) => entry.category === 'situation' && entry.status === 'active')
    .map((entry) => entry.text.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('；')
}

export function buildCaptiveRecall(session: GameSession | null, fate: IntruderFate): { recall: string; memory: AdventureMemory } {
  const memory = readMemory(session?.memory)
  const summary = session?.summary?.trim() ?? ''
  const snippets = (session?.messages ?? [])
    .filter((message) => message.role === 'assistant' && typeof message.content === 'string')
    .slice(-2)
    .map((message) => cleanContent(message.content).replace(/\s+/g, ' ').trim().slice(0, 360))
    .filter((text) => text.length >= 8)
  if (fate === 'broken') {
    const body = snippets.at(-1) || '她的身体还留着被进入和被束缚之后的反应'
    return { recall: `她已经玩坏，记不清计划和说过的话。身体还记得：${body}`.slice(0, 400), memory: emptyMemory() }
  }
  let recall = ''
  for (const part of [activeSituation(memory), summary, ...snippets]) {
    if (!part || (recall && recall.includes(part.slice(0, 24)))) continue
    recall = recall ? `${recall}\n${part}` : part
  }
  if (!recall) {
    recall = fate === 'kept'
      ? '她被留在这座地下城里，记得城主的手和自己当时的身体。'
      : '她被放走过，记得往外的路，也记得自己是在哪一层栽的。'
  }
  return { recall: recall.slice(0, 1200), memory }
}

export function rememberIntruder(save: KeeperSave, name: string): string[] {
  return [...save.recentNames.filter((item) => item !== name), name].slice(-4)
}

export function adoptTrap(save: KeeperSave, trap: KeeperTrap): KeeperSave {
  const id = encounterId(trap.id)
  const exists = save.traps.some((item) => item.id === id)
  const traps = exists ? save.traps : [...save.traps, { ...trap, id, placed: false }]
  const placed = traps.filter((item) => item.placed).length
  const canPlace = placed < save.progress.trapSlots || traps.some((item) => item.id === id && item.placed)
  return { ...save, traps: traps.map((item) => item.id === id ? { ...item, placed: canPlace } : item) }
}

export function adoptMonster(save: KeeperSave, monster: KeeperMonster): KeeperSave {
  const id = encounterId(monster.id)
  const exists = save.monsters.some((item) => item.id === id)
  const monsters = exists ? save.monsters : [...save.monsters, { ...monster, id, placed: false }]
  const placed = monsters.filter((item) => item.placed).length
  const canPlace = placed < save.progress.monsterSlots || monsters.some((item) => item.id === id && item.placed)
  return { ...save, monsters: monsters.map((item) => item.id === id ? { ...item, placed: canPlace } : item) }
}

export function pickIntruder(avoid: string[]): CharacterPreset {
  const fresh = CHARACTER_PRESETS.filter((preset) => !avoid.includes(preset.name))
  const pool = fresh.length > 0 ? fresh : CHARACTER_PRESETS
  return pool[Math.floor(Math.random() * pool.length)]
}

/** 结伴闯入优先匹配有姐妹/情敌羁绊的同行者（65% 概率），没有时退回角色库随机。 */
export function pickCompanion(primary: CharacterPreset, avoid: string[], random: () => number = Math.random): CharacterPreset {
  const blocked = new Set([...avoid, primary.name])
  const bondedNames = new Set((primary.bonds ?? []).map((b) => b.name))
  const bondedPool = CHARACTER_PRESETS.filter((preset) => bondedNames.has(preset.name) && !blocked.has(preset.name))
  if (bondedPool.length > 0 && random() < 0.65) {
    return bondedPool[Math.floor(random() * bondedPool.length)]
  }
  return pickIntruder([...blocked])
}

/** 旧存档热补齐：若存档角色属于预设角色库/讨伐队，自动同步最新死穴、标签、种族特性、羁绊与润色后的人设文本，保留当前数值与状态。 */
export function hydrateCharacterPreset(character: Character): Character {
  const pool = [...CHARACTER_PRESETS, ...RAID_PARTY]
  const preset = pool.find((p) => p.name === character.name)
  const next: Character = preset
    ? {
        ...character,
        appearance: preset.appearance ?? character.appearance,
        personality: preset.personality ?? character.personality,
        speech: preset.speech ?? character.speech,
        sexual: preset.sexual ?? character.sexual,
        collapseLine: preset.collapseLine ?? character.collapseLine,
        ...(preset.weakParts?.length ? { weakParts: [...preset.weakParts] } : {}),
        ...(preset.weakTags?.length ? { weakTags: [...preset.weakTags] } : {}),
        ...(preset.raceTrait ? { raceTrait: preset.raceTrait } : {}),
        ...(preset.bonds?.length ? { bonds: preset.bonds.map((b) => ({ ...b })) } : {}),
      }
    : character
  if (next.partner) {
    return { ...next, partner: hydrateCharacterPreset(next.partner) }
  }
  return next
}

export function characterFromPreset(preset: CharacterPreset): Character {
  return {
    name: preset.name,
    race: preset.race,
    measurements: { ...preset.measurements },
    backstory: preset.backstory,
    costumeDescription: preset.costumeDescription,
    otherDescription: preset.otherDescription,
    appearance: preset.appearance,
    personality: preset.personality,
    speech: preset.speech,
    sexual: preset.sexual,
    collapseLine: preset.collapseLine,
    ...(preset.weakParts?.length ? { weakParts: [...preset.weakParts] } : {}),
    ...(preset.weakTags?.length ? { weakTags: [...preset.weakTags] } : {}),
    ...(preset.raceTrait ? { raceTrait: preset.raceTrait } : {}),
    ...(preset.bonds?.length ? { bonds: preset.bonds.map((b) => ({ ...b })) } : {}),
    danbooruTags: preset.danbooruTags,
    avatarUrl: preset.avatarUrl ?? null,
    hp: 100,
    maxHp: 100,
    pleasure: 6,
    desire: 10,
    bodyDevelopment: { breast: 0, clitoris: 0, urethra: 0, vagina: 0, anus: 0 },
    statusEffects: [],
    floor: 1,
    floorThemes: rollFloorThemes(),
    encounter: null,
    explorationProgress: 0,
  }
}

export function applyOpening(character: Character, opening: OpeningKind, defense?: { id: string; name: string; kind: 'trap' | 'monster'; summary: string }): Character {
  if ((opening !== 'trap' && opening !== 'monster') || !defense) return { ...character, encounter: null }
  return {
    ...character,
    encounter: {
      id: encounterId(defense.id),
      name: defense.name,
      kind: defense.kind,
      summary: defense.summary.slice(0, 180),
      restraint: 2,
    },
  }
}

function remembered(fate: IntruderFate, recall: string, brands: string[]): string {
  const lead = fate === 'broken'
    ? '她已经被玩坏，记不清计划和对话，身体还记得上次的反应。'
    : fate === 'kept'
      ? '她被留过，记得城主和自己身上发生过的事。'
      : '她曾经被放走，记得出路和上次栽在哪里。'
  const mark = brands.length ? `身上的烙印还在：${brands.join('；')}。` : ''
  const excerpt = recall.replace(/\s+/g, ' ').trim().slice(0, 80)
  return `${lead}${mark}${excerpt ? `她记得：${excerpt}。` : ''}不要把她写成第一次闯入。`.slice(0, 300)
}

export function trapFloor(save: KeeperSave, trapId: string): number {
  const index = save.floors.findIndex((floor) => floor.trapIds.includes(trapId))
  return index >= 0 ? index + 1 : 1
}

export function trainingSessionSummary(record: CaptiveRecord, cage: CageKind): string {
  const info = CAGES[cage]
  const brands = Array.isArray(record.character.brands) ? record.character.brands.filter((item) => item.trim()) : []
  const mark = brands.length ? `身上的烙印还在：${brands.join('；')}。` : ''
  const mind = record.fate === 'broken'
    ? '她已经玩坏，记不清计划和说过的话，只剩身体。'
    : '她认得城主和自己的身体。'
  return `这是新的一轮。她在${info.label}。${info.holds}${mind}${mark}不要把上一场的结尾再演一遍。`.slice(0, 500)
}

/** 从收藏室再带回一场。陷阱只接受已经布置的那一件。调教按牢笼种类另开一轮，不把上一场结尾带进去。 */
export function planReturn(save: KeeperSave, record: CaptiveRecord, effect: CollectionReturn, trapId?: string, cage?: CageKind): { brief: KeeperBrief; character: Character } | null {
  const brands = Array.isArray(record.character.brands) ? record.character.brands.filter((item) => item.trim()) : []
  const summary = remembered(record.fate, record.recall, brands)
  if (effect === 'train') {
    const kind = cage ?? record.cage ?? 'cell'
    const info = CAGES[kind]
    return {
      brief: {
        opening: 'personal',
        return: 'train',
        defenseName: info.label,
        defenseSummary: `${info.holds}${info.enter}这是新的一轮，不要接着上一场的结尾。`,
        cage: kind,
      },
      character: { ...record.character, encounter: null },
    }
  }
  if (effect === 'reexplore') {
    return {
      brief: { opening: 'corridor', return: 'reexplore', defenseName: '再次探索', defenseSummary: summary },
      character: { ...record.character, floor: 1, encounter: null, explorationProgress: 0 },
    }
  }
  if (effect === 'pretend') {
    return {
      brief: { opening: 'corridor', return: 'pretend', defenseName: '假装放走', defenseSummary: summary },
      character: { ...record.character, floor: 1, encounter: null, explorationProgress: 0 },
    }
  }
  if (trapId) {
    const trap = save.traps.find((item) => item.id === trapId && item.placed)
    if (!trap) return null
    const summaryText = trap.mechanism.slice(0, 180)
    return {
      brief: { opening: 'trap', return: 'recall', defenseName: trap.name, defenseSummary: `${summaryText} ${summary}`.slice(0, 300) },
      character: applyOpening(
        { ...record.character, floor: trapFloor(save, trap.id), explorationProgress: 0 },
        'trap',
        { id: trap.id, name: trap.name, kind: 'trap', summary: summaryText },
      ),
    }
  }
  return {
    brief: { opening: 'corridor', return: 'recall', defenseName: '迷宫', defenseSummary: summary },
    character: { ...record.character, floor: 1, encounter: null, explorationProgress: 0 },
  }
}

export const DISCARD_SCENES = [
  { id: 'heal', label: '被医治', brief: '她被传送回城市，落在医馆里。写有人把她当成还能救的病人来处置，身上被玩过的痕迹还在。' },
  { id: 'slut', label: '成为痴女袭击路人', brief: '她被传送回城市的街上。写她按不住身体，扑向路过的人。' },
  { id: 'toilet', label: '变成精液肉便器', brief: '她被传送回城市的一处角落。写她只剩挨灌和接精的用处，过路的人把她当器具。' },
  { id: 'display', label: '城门示众', brief: '她被传送回城门口。写她被挂着或跪着，过路的人看得见她还在淌的身体。' },
  { id: 'alley', label: '夜巷拉客', brief: '她被传送回城市的夜巷。写她自己把身体往人身上送，已经分不清拒绝。' },
] as const

export type DiscardScene = (typeof DISCARD_SCENES)[number]

export function pickDiscardScene(draw: number = Math.random()): DiscardScene {
  const index = Math.min(DISCARD_SCENES.length - 1, Math.max(0, Math.floor(draw * DISCARD_SCENES.length)))
  return DISCARD_SCENES[index]
}

/** 扔掉之后烙在人物身上。以后召回、再探索、调教都要接着这道印写。 */
export function stampBrand(character: Character, label: string, line: string): Character {
  const detail = line.replace(/\s+/g, ' ').trim().slice(0, 160)
  const text = detail ? `${label}：${detail}` : label
  return { ...character, brands: [...(character.brands ?? []).filter((item) => item.trim()), text].slice(-4) }
}

export function appendRecall(recall: string, line: string): string {
  return [recall.trim(), line.trim()].filter(Boolean).join('\n').slice(0, 1200)
}

export const FATE_LABEL: Record<IntruderFate, string> = {
  kept: '留下',
  broken: '玩坏',
  defeated: '放走',
}

const MARKED_PARTS = ['breast', 'clitoris', 'urethra', 'vagina', 'anus'] as const

/** 生命值到 0 时只剩玩坏。没写 hp 的旧数据不当作倒下。 */
export function collapsed(character: { hp?: number }): boolean {
  return typeof character.hp === 'number' && character.hp <= 0
}

/** 留下、玩坏、放走各自要她的身体先到某一档，不能随时点。 */
export function fateGate(character: Pick<Character, 'pleasure' | 'desire' | 'bodyDevelopment'> & { hp?: number }, fate: IntruderFate): { ok: boolean; reason: string } {
  const pleasure = character.pleasure ?? 0
  const desire = character.desire ?? 0
  const down = collapsed(character)
  const marked = MARKED_PARTS.some((part) => (character.bodyDevelopment?.[part] ?? 0) >= 1)
  if (down && fate !== 'broken') {
    return { ok: false, reason: '生命值已经到 0。这是玩坏，不是留下或放走。' }
  }
  if (fate === 'kept') {
    const ok = pleasure >= 30 || desire >= 40 || marked
    return { ok, reason: ok ? '' : '还没留下够用的痕迹。快感到 30、欲望到 40，或把一处开发到 1 级。' }
  }
  if (fate === 'broken') {
    const ok = pleasure >= 80 || down
    return { ok, reason: ok ? '' : '快感还没到 80，玩不坏。' }
  }
  const ok = pleasure < 80
  return { ok, reason: ok ? '' : '她已经站不起来。这是玩坏，不是放走。' }
}

export type CollectionEffect = CollectionReturn | 'release' | 'discard' | 'watch'

export interface CollectionAction {
  id: string
  label: string
  effect: CollectionEffect
  brief: string
}

const COLLECTION_ACTIONS: Record<IntruderFate, CollectionAction[]> = {
  kept: [
    { id: 'train', label: '进去调教', effect: 'train', brief: '城主走进她现在的牢笼，开始新的一轮。不接上一场的结尾。' },
    { id: 'watch', label: '外面观赏', effect: 'watch', brief: '城主不进去。站在牢笼外看她被这只牢笼折磨，并重写收藏记录。' },
    { id: 'release', label: '放走', effect: 'release', brief: '城主真的放走她。人离开地下城，回到外面。不要把她写回迷宫，也不要让陷阱再抓住她。' },
    { id: 'pretend', label: '假装放走', effect: 'pretend', brief: '城主让她以为自己被放走了。她自己往出口走。已经布置的陷阱和魔物还在路上。这一小段只写她动身，不要提前写她已经掉进去。' },
  ],
  broken: [
    { id: 'train', label: '进去调教', effect: 'train', brief: '城主走进她现在的牢笼。她记不清计划和说过的话，只剩身体。这一轮不接上一场的结尾。' },
    { id: 'watch', label: '外面观赏', effect: 'watch', brief: '城主不进去。站在牢笼外看这具身体被牢笼折磨，并重写收藏记录。' },
    { id: 'discard', label: '扔掉', effect: 'discard', brief: '城主把她扔掉。她被传送回城市，不再留在牢笼里。' },
  ],
  defeated: [
    { id: 'recall', label: '召回迷宫', effect: 'recall', brief: '城主把她直接传送进迷宫。她没有自己走路进来。没有指定陷阱时，不要让她已经掉进装置。' },
    { id: 'reexplore', label: '再次探索', effect: 'reexplore', brief: '她自己从外面走回来，想再探索这座地下城。不是被传送，也不是第一次闯入。这一小段不要让她已经掉进陷阱。' },
  ],
}

export function collectionNeedsSlot(effect: CollectionEffect): boolean {
  return effect === 'train' || effect === 'pretend' || effect === 'recall' || effect === 'reexplore'
}

export function collectionActions(fate: IntruderFate): CollectionAction[] {
  return COLLECTION_ACTIONS[fate]
}

const PERSONAL_STEP_IN = /(?:城主(?:亲自|现身|走近|走上|走进|伸手|捏住|按住|含住|舔)|我(?:亲自|走近|走过去|捏住|按住|含住|舔))/

/** 这一场城主在不在她面前：调教和亲自迎上是面对面；若本回合指令明确写城主亲自现身插手也升级为面对面；被抓过又回来的认得城主但看不见；其余她不知道有城主。 */
export function keeperPresence(ctx: Pick<KeeperPromptContext, 'opening' | 'return'> | null, input?: string): 'present' | 'known' | 'absent' {
  if (input && PERSONAL_STEP_IN.test(input)) return 'present'
  if (!ctx) return 'absent'
  if (ctx.return === 'train' || ctx.opening === 'personal') return 'present'
  if (ctx.return === 'recall' || ctx.return === 'reexplore' || ctx.return === 'pretend') return 'known'
  return 'absent'
}

export interface InterrogationSceneContext {
  presence: 'present' | 'known' | 'absent'
  keeperStepsIn: boolean
  mode: SceneMode
  cageHolds?: string
  encounterTrap?: { name: string; category: string; mechanism: string; habit: string; escalate: string[]; ban: string; restraint: number } | null
  encounterMonster?: { name: string; appearance: string; behavior: string; habit?: string; restraint: number } | null
  floorDefenses?: { name: string; kind: 'trap' | 'monster'; summary: string }[]
  situation?: string
  recentExcerpt?: string
}

/** 组装「随机拷问 / 现场加码」所需的实时现场上下文：当前陷阱/魔物机制与加码项、同层布置、牢笼设施、衣物处境记忆与上一轮末尾摘录。 */
export function buildInterrogationScene(
  save: KeeperSave | null | undefined,
  character: Character,
  memory: AdventureMemory = emptyMemory(),
  recentAssistant: string[] = [],
  keeperStepsIn = false,
): InterrogationSceneContext {
  const safe = save ?? emptyKeep()
  const ctx = keeperPromptContext(safe)
  const presence = keeperPresence(ctx)
  const chrome = sceneChrome(ctx, character.floor ?? 1)
  const cageKey = safe.brief?.cage
  const cageHolds = chrome.mode === 'train' && cageKey && CAGES[cageKey] ? CAGES[cageKey].holds : chrome.mode === 'train' ? CAGES.cell.holds : undefined
  const enc = character.encounter
  let encounterTrap: InterrogationSceneContext['encounterTrap'] = null
  let encounterMonster: InterrogationSceneContext['encounterMonster'] = null
  if (enc && (enc.restraint ?? 1) > 0) {
    if (enc.kind === 'trap') {
      const found = safe.traps.find((t) => encounterId(t.id) === enc.id || t.name === enc.name)
      const draft = found ?? { id: enc.id, name: enc.name, mechanism: enc.summary || enc.name }
      const sheet = trapSheet(draft)
      encounterTrap = {
        name: enc.name,
        category: trapCategory(draft),
        mechanism: found?.mechanism || enc.summary || sheet.mechanic,
        habit: trapHabit(draft),
        escalate: sheet.escalate,
        ban: sheet.ban,
        restraint: enc.restraint,
      }
    } else {
      const found = safe.monsters.find((m) => encounterId(m.id) === enc.id || m.name === enc.name)
      encounterMonster = {
        name: enc.name,
        appearance: found?.appearance || '',
        behavior: found?.behavior || enc.summary || '',
        habit: found?.habit,
        restraint: enc.restraint,
      }
    }
  }
  const floor = character.floor ?? 1
  const floorDefenses = chrome.mode === 'explore'
    ? defensesOnFloor(safe, floor)
      .filter((d) => !enc || d.name !== enc.name)
      .map(({ name, kind, summary }) => ({ name, kind, summary: summary.slice(0, 140) }))
    : []
  const situation = activeSituation(memory)
  const lastRaw = recentAssistant.at(-1)
  const recentExcerpt = lastRaw ? cleanContent(lastRaw).replace(/\s+/g, ' ').trim().slice(-200) : ''
  return {
    presence,
    keeperStepsIn: presence === 'present' ? true : keeperStepsIn,
    mode: chrome.mode,
    cageHolds,
    encounterTrap,
    encounterMonster,
    floorDefenses,
    situation: situation || undefined,
    recentExcerpt: recentExcerpt || undefined,
  }
}
