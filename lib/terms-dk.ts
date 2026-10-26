// 地下城城主里的称呼接线：堕落度怎么算、淫纹怎么算、回合里怎么注入。
import type { Character } from '@/lib/types'
import { addOverrides, detectTermCommands, resolveTerms, termsLine, type KeeperPresence, type ResolvedTerms, type TermsState } from '@/lib/terms'
import { dkProfile } from '@/lib/terms-canon'
import { BODY_STAGES, DK_BODY_TERMS, type BodyStage, type BodyStageTerms } from '@/lib/body-terms-dk'

export const CREST_ITEM = { label: '改口淫纹', cost: 12, turns: 8 }

/** 长期堕落 0–100：身体开发等级 ×6 + 烙印 ×18 + 回合里的高潮积累 */
export function corruptionOf(c: Pick<Character, 'bodyDevelopment' | 'brands' | 'terms'>): number {
  const d = c.bodyDevelopment
  const dev = d ? (d.breast ?? 0) + (d.clitoris ?? 0) + (d.urethra ?? 0) + (d.vagina ?? 0) + (d.anus ?? 0) : 0
  return Math.max(0, Math.min(100, dev * 6 + (c.brands?.length ?? 0) * 18 + (c.terms?.corruptionBonus ?? 0)))
}

/** 陷阱「淫纹拘束」或身上带淫纹状态时，也算淫纹（不占道具时长） */
export function crestFromScene(c: Pick<Character, 'statusEffects' | 'encounter'>): boolean {
  return (c.statusEffects ?? []).some((s) => /淫纹|crest/i.test(`${s.id}${s.title}`)) || /淫纹/.test(c.encounter?.name ?? '')
}

export function dkTerms(c: Character): ResolvedTerms {
  return resolveTerms(dkProfile(c), c.terms, { corruption: corruptionOf(c), pleasure: c.pleasure ?? 0, now: c.turnCount ?? 0, boost: crestFromScene(c) })
}

/** 部位叫法的位置：胸、乳头、私处、后穴，泌乳角色另有乳汁 */
export type BodySlot = 'breast' | 'nipple' | 'pussy' | 'anus' | 'milk'
export const BODY_SLOT_LABEL: Record<BodySlot, string> = { breast: '胸', nipple: '乳头', pussy: '私处', anus: '后穴', milk: '乳汁' }

/** 阶段：快感到「高潮」档就是 climax，否则按堕落四档（淫纹 +1 档） */
export function bodyStageOf(r: ResolvedTerms): BodyStage {
  if (r.arousalTier >= 4) return 'climax'
  return BODY_STAGES[Math.min(3, r.corruptTier + (r.boosted ? 1 : 0))]
}

export interface DkBodyTerms { stage: BodyStage; style: string; terms: Partial<Record<BodySlot, string>>; line: string; lactation: boolean }

/** 角色当前阶段的部位叫法；没登记的角色返回 null，照旧只用通用称呼。玩家命令/锁定/作弊过的胸和私处以那边为准。 */
export function dkBodyTerms(c: Character, r: ResolvedTerms = dkTerms(c)): DkBodyTerms | null {
  const p = DK_BODY_TERMS[c.name]
  if (!p) return null
  const stage = bodyStageOf(r)
  const s: BodyStageTerms = p.stages[stage]
  const terms: Partial<Record<BodySlot, string>> = {
    breast: r.breast.source === 'default' || r.breast.source === 'item' ? s.breast : r.breast.value,
    nipple: s.nipple,
    pussy: r.pussy.source === 'default' || r.pussy.source === 'item' ? s.pussy : r.pussy.value,
    anus: r.anus.value,
  }
  if (p.lactation && s.milk) terms.milk = s.milk
  return { stage, style: p.style, terms, line: s.line, lactation: p.lactation }
}

const STAGE_LABEL: Record<BodyStage, string> = { pure: '矜持', shaken: '动摇', fallen: '沦陷', broken: '崩坏', climax: '高潮' }

export function dkBodyTermsLine(c: Character, r: ResolvedTerms = dkTerms(c)): string {
  const b = dkBodyTerms(c, r)
  if (!b) return ''
  const slots = (Object.keys(BODY_SLOT_LABEL) as BodySlot[]).filter((k) => b.terms[k])
  const list = slots.map((k) => `${BODY_SLOT_LABEL[k]}叫「${b.terms[k]}」`).join('｜')
  const milk = b.lactation ? '' : '她不泌乳，不要写乳汁、产奶或喷奶。'
  return `【部位叫法·${c.name}·${STAGE_LABEL[b.stage]}】说话风格：${b.style}。此刻${list}。示例口吻：${b.line}（只学口吻，不要照抄）。${milk}这些是${c.name}自己的专属说法，别的角色不要借用。`
}

export function dkTermsLine(c: Character, presence: KeeperPresence = 'present'): string {
  const r = dkTerms(c)
  const b = dkBodyTerms(c, r)
  if (!b) return termsLine(c.name, r, presence)
  const merged: ResolvedTerms = { ...r, breast: { ...r.breast, value: b.terms.breast ?? r.breast.value }, pussy: { ...r.pussy, value: b.terms.pussy ?? r.pussy.value } }
  return `${termsLine(c.name, merged, presence)}\n${dkBodyTermsLine(c, r)}`
}

/** 回合开始前：把玩家输入里的改称呼命令写进角色 */
export function applyTermCommands(c: Character, input: string, source: 'command' | 'training' = 'command'): { character: Character; found: number } {
  const cmds = detectTermCommands(input)
  if (!cmds.length) return { character: c, found: 0 }
  return { character: { ...c, terms: addOverrides(c.terms, cmds, source) }, found: cmds.length }
}

/** 回合结算后：计回合数，高潮回合积累堕落 */
export function tickTerms(c: Character): Character {
  const p = c.pleasure ?? 0
  const gain = p >= 80 ? 9 : p >= 60 ? 4 : p >= 40 ? 2 : 0
  const terms: TermsState = { ...(c.terms ?? {}), corruptionBonus: Math.min(80, (c.terms?.corruptionBonus ?? 0) + gain) }
  return { ...c, turnCount: (c.turnCount ?? 0) + 1, terms }
}

export function applyCrest(c: Character): Character {
  return { ...c, terms: { ...(c.terms ?? {}), itemUntil: (c.turnCount ?? 0) + CREST_ITEM.turns, itemLabel: CREST_ITEM.label } }
}
export function removeCrest(c: Character): Character {
  const t = { ...(c.terms ?? {}) }
  delete t.itemUntil; delete t.itemLabel
  return { ...c, terms: t }
}

/** 作品出处：从 danbooru 标签推 */
export function sourceWork(p: { name: string; danbooruTags?: string; source?: string }): string {
  if (p.source) return p.source
  const t = p.danbooruTags ?? ''
  if (/azur_lane/.test(t)) return '碧蓝航线'
  if (/granblue/.test(t)) return '碧蓝幻想'
  if (/idolmaster_shiny/.test(t)) return '偶像大师 闪耀色彩'
  if (/idolmaster_cinderella/.test(t)) return '偶像大师 灰姑娘女孩'
  if (/idolmaster/.test(t)) return '偶像大师'
  if (/girls'_frontline/.test(t)) return '少女前线'
  if (/lost_sword/.test(t)) return 'Lost Sword'
  if (/brown_dust/.test(t)) return '棕色尘埃'
  if (/^(勇者|圣女|女骑士)/.test(p.name)) return '原创 · 勇者讨伐队'
  return '原创'
}
