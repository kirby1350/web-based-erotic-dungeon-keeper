// 场景右栏的状态视图：堕落档进度、生效中的陷阱魔物、回合间的数值变化日志。只读，不改存档。
import type { BodyPart, Character } from '@/lib/types'
import type { KeeperSave } from '@/lib/keeper'
import { CORRUPT_TIERS, corruptTierOf } from '@/lib/terms'
import { corruptionOf, crestFromScene } from '@/lib/terms-dk'

export const BODY_PARTS: { key: BodyPart; label: string }[] = [
  { key: 'breast', label: '胸' }, { key: 'clitoris', label: '阴蒂' }, { key: 'urethra', label: '尿道' },
  { key: 'vagina', label: '阴道' }, { key: 'anus', label: '后庭' },
]
const TIER_FLOOR = [0, 25, 50, 75, 100]

/** 堕落分数、所在档、到下一档的进度（0–100）。崩坏档进度恒 100。 */
export function corruptionView(c: Character): { score: number; tier: number; label: string; toNext: number; nextAt: number | null } {
  const score = corruptionOf(c)
  const tier = corruptTierOf(score)
  const lo = TIER_FLOOR[tier], hi = TIER_FLOOR[tier + 1]
  return { score, tier, label: CORRUPT_TIERS[tier], toNext: tier >= 3 ? 100 : Math.round(((score - lo) / (hi - lo)) * 100), nextAt: tier >= 3 ? null : hi }
}

export interface ActiveDefense { name: string; kind: 'trap' | 'monster'; summary: string; engaged: boolean }

/** 她所在那层布置的陷阱/魔物，加上正缠着她的那一件（engaged） */
export function activeDefenses(c: Character, keep: KeeperSave | null): ActiveDefense[] {
  const out: ActiveDefense[] = []
  const enc = c.encounter
  if (enc && (enc.restraint ?? 1) > 0) out.push({ name: enc.name, kind: enc.kind, summary: enc.summary, engaged: true })
  const floor = keep?.floors[(c.floor ?? 1) - 1]
  if (floor && keep) {
    for (const id of floor.trapIds) { const t = keep.traps.find((x) => x.id === id); if (t && t.name !== enc?.name) out.push({ name: t.name, kind: 'trap', summary: t.mechanism, engaged: false }) }
    for (const id of floor.monsterIds) { const m = keep.monsters.find((x) => x.id === id); if (m && m.name !== enc?.name) out.push({ name: m.name, kind: 'monster', summary: m.behavior, engaged: false }) }
  }
  return out
}

export interface BuffTag { label: string; detail: string; tone: 'crest' | 'brand' | 'status' }

/** 淫纹 / 烙印 / 异常状态，做成可悬停的标签 */
export function buffTags(c: Character): BuffTag[] {
  const tags: BuffTag[] = []
  const turn = c.turnCount ?? 0
  if (c.terms?.itemUntil != null && c.terms.itemUntil > turn) tags.push({ label: c.terms.itemLabel ?? '改口淫纹', detail: `称呼提前一档，还剩 ${c.terms.itemUntil - turn} 回合`, tone: 'crest' })
  else if (crestFromScene(c)) tags.push({ label: '淫纹发作', detail: '场景里的淫纹让称呼提前一档，离开后回落', tone: 'crest' })
  for (const b of c.brands ?? []) tags.push({ label: b, detail: `永久烙印：堕落 +12`, tone: 'brand' })
  for (const s of c.statusEffects ?? []) tags.push({ label: s.title, detail: s.description, tone: 'status' })
  return tags
}

const fmt = (n: number) => (n > 0 ? `+${n}` : `${n}`)

/** 两个回合之间的变化，写成「快感 +12」「开发·后庭 2→3」这样的短句 */
export function statusChanges(before: Character, after: Character): string[] {
  const out: string[] = []
  const num = (label: string, a?: number, b?: number) => { if (a != null && b != null && a !== b) out.push(`${label} ${fmt(b - a)}`) }
  num('快感', before.pleasure, after.pleasure)
  num('欲望', before.desire, after.desire)
  num('生命', before.hp, after.hp)
  for (const { key, label } of BODY_PARTS) {
    const a = before.bodyDevelopment?.[key] ?? 0, b = after.bodyDevelopment?.[key] ?? 0
    if (a !== b) out.push(`开发·${label} ${a}→${b}`)
    else {
      const ea = before.bodyDevelopment?.exp?.[key] ?? 0, eb = after.bodyDevelopment?.exp?.[key] ?? 0
      if (eb > ea) out.push(`开发·${label} +${eb - ea}`)
    }
  }
  const ta = corruptTierOf(corruptionOf(before)), tb = corruptTierOf(corruptionOf(after))
  if (ta !== tb) out.push(`堕落 ${CORRUPT_TIERS[ta]}→${CORRUPT_TIERS[tb]}`)
  for (const b of after.brands ?? []) if (!(before.brands ?? []).includes(b)) out.push(`烙印「${b}」`)
  const was = new Set((before.statusEffects ?? []).map((s) => s.id))
  for (const s of after.statusEffects ?? []) if (!was.has(s.id)) out.push(`陷入「${s.title}」`)
  if (after.encounter && after.encounter.name !== before.encounter?.name) out.push(`撞上「${after.encounter.name}」`)
  else if (before.encounter && !after.encounter) out.push(`挣开「${before.encounter.name}」`)
  if ((after.floor ?? 1) !== (before.floor ?? 1)) out.push(`送到第 ${after.floor ?? 1} 层`)
  return out
}

/** 日志只留最近 n 条，新的在前 */
export function pushChanges(log: string[], changes: string[], n = 5): string[] {
  return [...changes.slice().reverse(), ...log].slice(0, n)
}
