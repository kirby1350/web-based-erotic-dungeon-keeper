// 地下城城主里的称呼接线：堕落度怎么算、淫纹怎么算、回合里怎么注入。
import type { Character } from '@/lib/types'
import { addOverrides, detectTermCommands, resolveTerms, termsLine, type ResolvedTerms, type TermsState } from '@/lib/terms'
import { dkProfile } from '@/lib/terms-canon'

export const CREST_ITEM = { label: '改口淫纹', cost: 12, turns: 8 }

/** 长期堕落 0–100：身体开发等级 ×4 + 烙印 ×12 + 回合里的高潮积累 */
export function corruptionOf(c: Pick<Character, 'bodyDevelopment' | 'brands' | 'terms'>): number {
  const d = c.bodyDevelopment
  const dev = d ? (d.breast ?? 0) + (d.clitoris ?? 0) + (d.urethra ?? 0) + (d.vagina ?? 0) + (d.anus ?? 0) : 0
  return Math.max(0, Math.min(100, dev * 4 + (c.brands?.length ?? 0) * 12 + (c.terms?.corruptionBonus ?? 0)))
}

/** 陷阱「淫纹拘束」或身上带淫纹状态时，也算淫纹（不占道具时长） */
export function crestFromScene(c: Pick<Character, 'statusEffects' | 'encounter'>): boolean {
  return (c.statusEffects ?? []).some((s) => /淫纹|crest/i.test(`${s.id}${s.title}`)) || /淫纹/.test(c.encounter?.name ?? '')
}

export function dkTerms(c: Character): ResolvedTerms {
  return resolveTerms(dkProfile(c), c.terms, { corruption: corruptionOf(c), pleasure: c.pleasure ?? 0, now: c.turnCount ?? 0, boost: crestFromScene(c) })
}

export function dkTermsLine(c: Character): string {
  return termsLine(c.name, dkTerms(c))
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
  const gain = p >= 80 ? 3 : p >= 60 ? 1 : 0
  const terms: TermsState = { ...(c.terms ?? {}), corruptionBonus: Math.min(60, (c.terms?.corruptionBonus ?? 0) + gain) }
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
