import type { BodyDevelopment, BodyPart } from '@/lib/types'

export const BODY_PARTS = ['breast', 'clitoris', 'urethra', 'vagina', 'anus'] as const
export const MILD_DEVELOPMENT_EXP = 10
export const INTENSE_DEVELOPMENT_EXP = 40
const STIMULUS_WINDOW = 40

const PART_PATTERNS: Record<BodyPart, RegExp> = {
  breast: /乳头|乳晕|乳房|乳沟|乳肉|乳尖|奶子|奶头|双乳|巨乳|酥胸|奶肉/,
  clitoris: /阴蒂|阴核|豆豆/,
  urethra: /尿道|尿孔|尿口/,
  vagina: /阴道|子宫|宫口|花心|花穴|蜜穴|骚穴|嫩穴|淫穴|小穴|穴口|穴内|肉穴|肉壁|腔道/,
  anus: /肛门|肛口|后庭|菊穴|后穴|菊蕾|屁眼|肠壁|肠内/,
}
const CONTACT = /插入|抽插|抽送|挺入|顶入|顶弄|没入|贯穿|操|肏|舔弄|舔过|舔舐|吮吸|吸吮|含住|揉捏|揉弄|抠挖|抠弄|磨蹭|蹭弄|爱抚|抚摸|玩弄|蹂躏|射进|射入|灌入|撑开|搅弄|吞入|吞没|夹紧|缠住|缠上|吸住|咬住|按住|压住|捣入|抽动|撞击/
const CLIMAX = /高潮|绝顶|喷潮|潮吹|潮喷/

function near(text: string, index: number, length: number, pattern: RegExp): boolean {
  return pattern.test(text.slice(Math.max(0, index - STIMULUS_WINDOW), Math.min(text.length, index + length + STIMULUS_WINDOW)))
}

/** Exp for parts the prose actually stimulates. The model's own level and exp are ignored. */
export function developmentAwards(narrative: string, pleasureBefore: number, pleasureAfter: number): Partial<Record<BodyPart, number>> {
  const text = narrative ?? ''
  // 「甬道」多半指通道，不算阴道。
  const rose = pleasureAfter - pleasureBefore
  const intense = CLIMAX.test(text) || rose >= 20 || (pleasureAfter >= 80 && rose > 0)
  const gain = intense ? INTENSE_DEVELOPMENT_EXP : MILD_DEVELOPMENT_EXP
  const awards: Partial<Record<BodyPart, number>> = {}
  for (const part of BODY_PARTS) {
    const matcher = new RegExp(PART_PATTERNS[part].source, 'g')
    let involved = false
    for (let match = matcher.exec(text); match; match = matcher.exec(text)) {
      const localContact = near(text, match.index, match[0].length, CONTACT) || near(text, match.index, match[0].length, CLIMAX)
      // 只算正文真碰到的部位。快感涨了不代表每个被提到的部位都被碰了。
      if (localContact) involved = true
      if (match[0].length === 0) matcher.lastIndex += 1
    }
    if (involved) awards[part] = gain
  }
  return awards
}

/** Add exp and promote every 100 points. Level 5 stores no further exp. */
export function settleBodyDevelopment(current: BodyDevelopment, narrative: string, pleasureBefore: number, pleasureAfter: number): BodyDevelopment {
  const awards = developmentAwards(narrative, pleasureBefore, pleasureAfter)
  const exp: Partial<Record<BodyPart, number>> = { ...current.exp }
  const next: BodyDevelopment = { ...current, exp }
  for (const part of BODY_PARTS) {
    let level = current[part] ?? 0
    let partExp = current.exp?.[part] ?? 0
    const gain = awards[part] ?? 0
    if (gain > 0 && level < 5) {
      partExp += gain
      while (partExp >= 100 && level < 5) {
        partExp -= 100
        level += 1
      }
      if (level >= 5) partExp = 0
    }
    next[part] = level
    exp[part] = partExp
  }
  return next
}
