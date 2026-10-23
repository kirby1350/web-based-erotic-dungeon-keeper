import { z } from 'zod'
import { ENCOUNTER_CLEAR_GAIN, TARGET_FLOOR, type Character } from '@/lib/types'
import { enforceTurnResult, type ProgramTurnResult } from '@/lib/adventure-context'
import { settleBodyDevelopment } from '@/lib/body-development'

const FALLBACK_SCENE = 'dungeon entrance, stone corridor, torchlight, dark fantasy, adult'
const QUALITY_TAG = /^(?:masterpiece|best quality)$/i

const PARTS = ['breast', 'clitoris', 'urethra', 'vagina', 'anus'] as const
const MARKER_START = /\[OPTIONS\]|\[SCENE|\[STATS|\[DESC/i
const bounded = (max: number) => z.number().finite().int().min(0).max(max)
const text = (max: number) => z.string().trim().min(1).max(max)
const descriptions = z.object(Object.fromEntries(PARTS.map((part) => [part, text(300).optional()])) as Record<typeof PARTS[number], z.ZodOptional<z.ZodString>>).strict()
const experience = z.object(Object.fromEntries(PARTS.map((part) => [part, bounded(100).optional()])) as Record<typeof PARTS[number], z.ZodOptional<z.ZodNumber>>).strict()
const development = z.object({
  breast: bounded(5), clitoris: bounded(5), urethra: bounded(5), vagina: bounded(5), anus: bounded(5),
  exp: experience.optional(), descriptions: descriptions.optional(),
}).strict()
const effectSchema = z.object({ id: text(100), title: text(40), description: z.string().max(500) }).strict()
const encounterSchema = z.object({
  id: text(100), name: text(100), kind: z.enum(['trap', 'monster']), summary: z.string().max(500), restraint: bounded(3),
}).strict()
const measurement = z.string().regex(/^(?:\d+(?:\.\d+)?|)$/).max(12)

const PROGRAM_OWNED_STATS = ['maxHp', 'explorationProgress'] as const

/** 程序自己维护的进度和上限。模型写进 STATS 时丢掉，避免整段校验失败。 */
function withoutProgramOwnedStats(value: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!value) return null
  const stats = { ...value }
  for (const key of PROGRAM_OWNED_STATS) delete stats[key]
  return stats
}

function statsSchema(character: Character) {
  const knownIds = new Set([...(character.statusEffects ?? []).map((effect) => effect.id), character.encounter?.id])
  const validId = (id: string) => knownIds.has(id) || /^[a-z][a-z0-9_-]*$/.test(id)
  return z.object({
    hp: bounded(character.maxHp), pleasure: bounded(100), desire: bounded(100),
    floor: z.number().int().min(1).max(TARGET_FLOOR),
    encounter: encounterSchema.refine((value) => validId(value.id), 'invalid encounter id').nullable(),
    measurements: z.object({ bust: measurement, waist: measurement, hip: measurement }).strict(),
    bodyDevelopment: development,
    statusEffects: z.array(effectSchema).max(100)
      .refine((effects) => new Set(effects.map((effect) => effect.id)).size === effects.length, 'duplicate status ids')
      .refine((effects) => effects.every((effect) => validId(effect.id)), 'invalid status id'),
  }).strict()
}

function normalizeJsonPunctuation(value: string): string {
  const punctuation: Record<string, string> = { '：': ':', '，': ',', '｛': '{', '｝': '}', '［': '[', '］': ']', '　': ' ' }
  let quoted = false
  let escaped = false
  return Array.from(value).map((char) => {
    if (escaped) { escaped = false; return char }
    if (char === '\\' && quoted) { escaped = true; return char }
    if (char === '"') quoted = !quoted
    return quoted ? char : punctuation[char] ?? char
  }).join('')
}

/** Accept complete JSON only. Never invent missing braces, values, or array entries. */
export function extractMarkerJson(content: string, marker: string): Record<string, unknown> | null {
  const matches = [...content.matchAll(new RegExp(`\\[${marker}\\s*[:：]`, 'gi'))]
  if (matches.length !== 1) return null
  const match = matches[0]
  const tail = normalizeJsonPunctuation(content.slice(match.index! + match[0].length)).trimStart()
  if (!tail.startsWith('{')) return null
  let depth = 0
  let quoted = false
  let escaped = false
  for (let index = 0; index < tail.length; index++) {
    const char = tail[index]
    if (escaped) { escaped = false; continue }
    if (char === '\\' && quoted) { escaped = true; continue }
    if (char === '"') { quoted = !quoted; continue }
    if (quoted) continue
    if (char === '{') depth++
    if (char === '}' && --depth === 0) {
      if (!tail.slice(index + 1).trimStart().startsWith(']')) return null
      try { return JSON.parse(tail.slice(0, index + 1)) } catch { return null }
    }
  }
  return null
}

export function cleanContent(content: string): string {
  const index = content.search(MARKER_START)
  return (index < 0 ? content : content.slice(0, index)).trim()
}

export function parseOptions(content: string): string[] {
  const match = content.match(/\[OPTIONS\]([\s\S]*?)(?:\[\/OPTIONS\]|\[SCENE|\[STATS|\[DESC|$)/i)
  return match ? match[1].split('\n').map((line) => line.trim().replace(/^[-*•]\s*/, '').replace(/^\d+[.、)]\s*/, '')).filter(Boolean) : []
}

/** Keep a bad [SCENE] from blocking the turn. Image tags are not game state. */
export function sanitizeScene(raw: string): { scene: string; warning?: string } {
  const ascii = raw.replace(/，/g, ',').replace(/[^\x20-\x7E]+/g, ' ').replace(/\s+/g, ' ').trim()
  let scene = ascii.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0 && !QUALITY_TAG.test(tag)).join(', ')
  if (scene.length > 2000) scene = scene.slice(0, 2000).replace(/,[^,]*$/, '').trim()
  if (!scene) return { scene: FALLBACK_SCENE, warning: '场景标签无效，已改用默认场景' }
  return /[^\x20-\x7E]/.test(raw) || raw.length > 2000 ? { scene, warning: '场景标签已去掉非英文内容' } : { scene }
}

export interface ReplyInspection {
  narrative: string
  options: string[]
  scene: string
  updates: Partial<Character> | null
  errors: string[]
  metadataErrors: string[]
  warnings: string[]
  contradictions: string[]
}

export function inspectReply(content: string, character: Character, result: ProgramTurnResult | null): ReplyInspection {
  const narrative = cleanContent(content)
  const options = parseOptions(content)
  const sceneResult = sanitizeScene(content.match(/\[SCENE\s*[:：]\s*([\s\S]*?)(?:\]|］|(?=\[STATS)|(?=\[DESC)|$)/i)?.[1] ?? '')
  const scene = sceneResult.scene
  const errors: string[] = []
  const metadataErrors: string[] = []
  const warnings: string[] = []
  const contradictions: string[] = []
  if (!narrative) errors.push('正文缺失')
  if (options.length !== 4 || new Set(options).size !== 4) errors.push('需要四个不同的行动选项')
  if (sceneResult.warning) warnings.push(sceneResult.warning)
  const parsed = statsSchema(character).safeParse(withoutProgramOwnedStats(extractMarkerJson(content, 'STATS')))
  let updates: Partial<Character> | null = null
  if (!parsed.success) {
    metadataErrors.push(...parsed.error.issues.map((issue) => `STATS.${issue.path.join('.') || '结构'}`))
  } else {
    const stats = parsed.data
    const settled = settleBodyDevelopment(character.bodyDevelopment, narrative, character.pleasure ?? 0, stats.pleasure)
    updates = { ...stats, bodyDevelopment: {
      ...settled,
      descriptions: { ...character.bodyDevelopment.descriptions, ...stats.bodyDevelopment.descriptions },
    } }
    if (character.encounter && !stats.encounter && result?.kind !== 'escape') {
      updates.explorationProgress = Math.min(100, (character.explorationProgress ?? 0) + ENCOUNTER_CLEAR_GAIN)
    }
    if (stats.floor !== (character.floor ?? 1)) contradictions.push('floor')
    if (result?.kind === 'escape' && JSON.stringify(stats.encounter) !== JSON.stringify(result.encounter)) contradictions.push('encounter')
    if (result?.kind === 'dispel' && stats.statusEffects.some((effect) => effect.id === result.effect.id) === result.removed) contradictions.push('statusEffects')
    const desc = descriptions.safeParse(extractMarkerJson(content, 'DESC'))
    if (desc.success) updates.bodyDevelopment!.descriptions = { ...updates.bodyDevelopment!.descriptions, ...desc.data }
    else warnings.push('状态描述不完整，已保留原描述')
    updates = enforceTurnResult(character, updates, result)
  }
  return { narrative, options, scene, updates, errors, metadataErrors, warnings, contradictions }
}

/** Replace only machine-readable state; the accepted narrative and choices remain byte-identical. */
export function replaceStateMetadata(content: string, metadata: string): string {
  const index = content.search(/\[STATS\s*[:：]|\[DESC\s*[:：]/i)
  return `${(index < 0 ? content : content.slice(0, index)).trimEnd()}\n${metadata.trim()}`
}

function completeObjects(raw: string): Record<string, unknown>[] {
  const source = normalizeJsonPunctuation(raw)
  const found: Record<string, unknown>[] = []
  let quoted = false
  let escaped = false
  let depth = 0
  let start = -1
  for (let index = 0; index < source.length; index++) {
    const char = source[index]
    if (escaped) { escaped = false; continue }
    if (char === '\\' && quoted) { escaped = true; continue }
    if (char === '"') { quoted = !quoted; continue }
    if (quoted) continue
    if (char === '{') {
      if (depth === 0) start = index
      depth++
    } else if (char === '}' && depth > 0 && --depth === 0 && start >= 0) {
      const parsed = parseObject(source.slice(start, index + 1))
      if (parsed) found.push(parsed)
      start = -1
    }
  }
  return found
}

function parseObject(raw: string): Record<string, unknown> | null {
  const read = (value: string) => {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null
    } catch { return null }
  }
  return read(raw) ?? read(dropTrailingCommas(raw))
}

function dropTrailingCommas(value: string): string {
  let out = ''
  let quoted = false
  let escaped = false
  for (let index = 0; index < value.length; index++) {
    const char = value[index]
    if (escaped) { escaped = false; out += char; continue }
    if (char === '\\' && quoted) { escaped = true; out += char; continue }
    if (char === '"') quoted = !quoted
    if (!quoted && char === ',') {
      let next = index + 1
      while (value[next] === ' ' || value[next] === '\n' || value[next] === '\r' || value[next] === '\t') next++
      if (value[next] === '}' || value[next] === ']') continue
    }
    out += char
  }
  return out
}

function asStats(value: Record<string, unknown>): Record<string, unknown> | null {
  if ('hp' in value || 'pleasure' in value || 'bodyDevelopment' in value) return value
  for (const nested of Object.values(value)) {
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      const record = nested as Record<string, unknown>
      if ('hp' in record || 'pleasure' in record || 'bodyDevelopment' in record) return record
    }
  }
  return null
}

function integerIn(value: unknown, max: number): number | undefined {
  if (typeof value === 'string' && /^-?\d+$/.test(value.trim())) value = Number(value.trim())
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= max ? value : undefined
}

function measurementOf(value: unknown, fallback: string): string {
  const raw = typeof value === 'number' && Number.isFinite(value) ? String(value) : value
  if (typeof raw !== 'string') return fallback
  const trimmed = raw.trim()
  return /^(?:\d+(?:\.\d+)?|)$/.test(trimmed) && trimmed.length <= 12 ? trimmed : fallback
}

function isPlaceholder(value: Record<string, unknown>): boolean {
  return value.hp === -1 || value.pleasure === -1 || value.desire === -1 || value.floor === -1
}

function knownIds(character: Character): Set<string> {
  return new Set([...(character.statusEffects ?? []).map((effect) => effect.id), character.encounter?.id].filter((id): id is string => !!id))
}

function validEffectId(id: string, known: Set<string>): boolean {
  return known.has(id) || /^[a-z][a-z0-9_-]*$/.test(id)
}

/** Turn a model repair into one schema-valid STATS/DESC block. Incomplete output stays null. */
export function salvageStateMetadata(metadata: string, character: Character, prior = ''): string | null {
  const repaired = [...completeObjects(metadata)].reverse().map(asStats).find((value): value is Record<string, unknown> => !!value)
  if (!repaired) return null
  const earlier = [...completeObjects(prior)].reverse().map(asStats).find((value): value is Record<string, unknown> => !!value)
  const maxHp = integerIn(character.maxHp, 9999) ?? 100
  const exp: Partial<Record<typeof PARTS[number], number>> = {}
  const body: Record<string, unknown> = {}
  for (const part of PARTS) {
    body[part] = integerIn(character.bodyDevelopment?.[part], 5) ?? 0
    const partExp = integerIn(character.bodyDevelopment?.exp?.[part], 100)
    if (partExp != null) exp[part] = partExp
  }
  if (Object.keys(exp).length) body.exp = exp
  const known = knownIds(character)
  const effects = (character.statusEffects ?? []).filter((effect) => effectSchema.safeParse(effect).success && validEffectId(effect.id, known))
  const encounter = character.encounter && encounterSchema.safeParse(character.encounter).success && validEffectId(character.encounter.id, known)
    ? character.encounter : null
  const merged: Record<string, unknown> = {
    hp: integerIn(character.hp, maxHp) ?? 0,
    pleasure: integerIn(character.pleasure, 100) ?? 0,
    desire: integerIn(character.desire, 100) ?? 0,
    floor: Math.min(TARGET_FLOOR, Math.max(1, Math.trunc(character.floor ?? 1) || 1)),
    encounter,
    measurements: {
      bust: measurementOf(character.measurements?.bust, ''),
      waist: measurementOf(character.measurements?.waist, ''),
      hip: measurementOf(character.measurements?.hip, ''),
    },
    bodyDevelopment: body,
    statusEffects: effects,
  }
  const apply = (source: Record<string, unknown>) => {
    if (isPlaceholder(source)) return
    const hp = integerIn(source.hp, maxHp)
    const pleasure = integerIn(source.pleasure, 100)
    const desire = integerIn(source.desire, 100)
    if (hp != null) merged.hp = hp
    if (pleasure != null) merged.pleasure = pleasure
    if (desire != null) merged.desire = desire
    const sizes = source.measurements
    if (sizes && typeof sizes === 'object' && !Array.isArray(sizes)) {
      const current = merged.measurements as { bust: string; waist: string; hip: string }
      const record = sizes as Record<string, unknown>
      merged.measurements = {
        bust: measurementOf(record.bust, current.bust),
        waist: measurementOf(record.waist, current.waist),
        hip: measurementOf(record.hip, current.hip),
      }
    }
    if (source.encounter === null && !character.encounter) merged.encounter = null
    else if (source.encounter && typeof source.encounter === 'object' && !Array.isArray(source.encounter)) {
      const parsed = encounterSchema.safeParse(source.encounter)
      const id = parsed.success ? parsed.data.id : ''
      if (parsed.success && validEffectId(id, known)) merged.encounter = parsed.data
    }
    if (Array.isArray(source.statusEffects) && (source.statusEffects.length > 0 || effects.length === 0)) {
      const accepted: { id: string; title: string; description: string }[] = []
      const seen = new Set<string>()
      for (const effect of source.statusEffects) {
        const parsed = effectSchema.safeParse(effect)
        if (!parsed.success || !validEffectId(parsed.data.id, known) || seen.has(parsed.data.id)) {
          accepted.length = 0
          break
        }
        seen.add(parsed.data.id)
        accepted.push(parsed.data)
      }
      if (accepted.length === source.statusEffects.length) merged.statusEffects = accepted
    }
  }
  if (earlier) apply(earlier)
  apply(repaired)
  const parsed = statsSchema(character).safeParse(merged)
  if (!parsed.success) return null
  const bodyDevelopment = { ...parsed.data.bodyDevelopment }
  delete bodyDevelopment.descriptions
  const descriptions: Partial<Record<typeof PARTS[number], string>> = {}
  const takeDescriptions = (source: Record<string, unknown> | null) => {
    if (!source) return
    const pool = source.bodyDevelopment && typeof source.bodyDevelopment === 'object'
      ? (source.bodyDevelopment as Record<string, unknown>).descriptions : null
    const direct = PARTS.some((part) => part in source) && !('hp' in source) ? source : null
    for (const record of [pool, direct]) {
      if (!record || typeof record !== 'object' || Array.isArray(record)) continue
      for (const part of PARTS) {
        const text = (record as Record<string, unknown>)[part]
        if (typeof text !== 'string') continue
        const trimmed = text.trim().slice(0, 300)
        if (trimmed) descriptions[part] = trimmed
      }
    }
  }
  for (const source of completeObjects(metadata)) takeDescriptions(source)
  if (!Object.keys(descriptions).length) takeDescriptions(repaired)
  return `[STATS:${JSON.stringify({ ...parsed.data, bodyDevelopment })}]\n[DESC:${JSON.stringify(descriptions)}]`
}

export function serializeReply(inspection: ReplyInspection, character: Character): string {
  const { descriptions: desc, ...bodyDevelopment } = character.bodyDevelopment
  const stats = { hp: character.hp, pleasure: character.pleasure, desire: character.desire, floor: character.floor ?? 1,
    encounter: character.encounter ?? null, measurements: character.measurements, bodyDevelopment, statusEffects: character.statusEffects }
  return `${inspection.narrative}\n[OPTIONS]\n${inspection.options.map((option, index) => `${index + 1}. ${option}`).join('\n')}\n[/OPTIONS]\n[SCENE: ${inspection.scene}]\n[STATS:${JSON.stringify(stats)}]\n[DESC:${JSON.stringify(desc ?? {})}]`
}
