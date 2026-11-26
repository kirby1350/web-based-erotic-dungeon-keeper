import type { BodyDevelopment, BodyPart } from '@/lib/types'

export const BODY_PARTS = ['breast', 'clitoris', 'urethra', 'vagina', 'anus'] as const
export const MILD_DEVELOPMENT_EXP = 25
export const INTENSE_DEVELOPMENT_EXP = 40
const STIMULUS_WINDOW = 40

const PART_PATTERNS: Record<BodyPart, RegExp> = {
  breast: /乳头|乳晕|乳房|乳沟|乳肉|乳尖|奶子|奶头|双乳|巨乳|酥胸|奶肉/,
  clitoris: /阴蒂|阴核|豆豆|花核|肉芽|肉豆|蒂珠|蒂头|小豆子/,
  urethra: /尿道|尿孔|尿口/,
  vagina: /阴道|子宫|宫口|花心|花穴|蜜穴|骚穴|嫩穴|淫穴|小穴|穴口|穴内|肉穴|肉壁|腔道|阴唇|花唇|唇缝|肉唇|屄|膣|腿心/,
  anus: /肛门|肛口|后庭|菊穴|后穴|菊蕾|屁眼|肠壁|肠内/,
}
const CONTACT = /捏|掐|碾|攥|搓|拧|拨弄|拨开|揉|舔|吸着|嘬|吮|含着|插|捅|塞进|挤进|钻进|顶进|顶开|撞进|抠|掰开|拍打|按揉|捻|弹弄|插入|抽插|抽送|挺入|顶入|顶弄|没入|贯穿|操|肏|舔弄|舔过|舔舐|吮吸|吸吮|含住|揉捏|揉弄|抠挖|抠弄|磨蹭|蹭弄|爱抚|抚摸|玩弄|蹂躏|射进|射入|灌入|撑开|搅弄|吞入|吞没|夹紧|缠住|缠上|吸住|咬住|按住|压住|捣入|抽动|撞击/
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

/**
 * 双人一起时把正文按段落分给两人：只提到同伴、没提到主角的段落算同伴的，其余算主角的。
 * 这样同伴被碰的部位不会记到主角身上，同伴自己也能涨开发度。
 */
export function splitNarrative(narrative: string, focusName: string, partnerName: string): { focus: string; partner: string } {
  const focus: string[] = []
  const partner: string[] = []
  for (const paragraph of (narrative ?? '').split(/\n+/)) {
    if (partnerName && paragraph.includes(partnerName) && !(focusName && paragraph.includes(focusName))) partner.push(paragraph)
    else focus.push(paragraph)
  }
  return { focus: focus.join('\n'), partner: partner.join('\n') }
}

export interface DevTrait {
  id: string
  part: BodyPart
  minLevel: 3 | 5
  title: string
  detail: string
  promptHint: string
}

export const DEV_TRAITS: DevTrait[] = [
  { id: 'breast_lv3', part: 'breast', minLevel: 3, title: '乳尖敏化', detail: '乳头充血难消，隔着布料轻擦也会发麻腿软（淫髓产出 +8%）', promptHint: '胸部已开发至敏化：乳尖稍受摩擦或气流便充血挺立、腰肢发软' },
  { id: 'breast_lv5', part: 'breast', minLevel: 5, title: '乳首绝顶', detail: '乳腺与神经彻底熟化，单靠揉捏吸吮双乳即可直达绝顶（淫髓产出 +8%）', promptHint: '胸部已达乳首绝顶体质：仅靠揉乳吸吮即可引发强烈高潮，泌乳角色更会失控喷乳' },
  { id: 'clitoris_lv3', part: 'clitoris', minLevel: 3, title: '蒂珠外露', detail: '阴蒂饱满翘起难以缩回，走动并腿都会磨出湿意（淫髓产出 +8%）', promptHint: '阴蒂已开发至外露敏感：红润肿胀地顶出包皮，双腿摩擦也会漏出鼻音' },
  { id: 'clitoris_lv5', part: 'clitoris', minLevel: 5, title: '一触即泄', detail: '阴蒂连着全身电麻回路，指尖或吸盘轻捻即连环潮吹（淫髓产出 +8%）', promptHint: '阴蒂已达一触即泄体质：稍加捻弄或震动便引发连环痉挛与失禁潮吹' },
  { id: 'urethra_lv3', part: 'urethra', minLevel: 3, title: '羞耻失禁', detail: '前孔松软敏感，快感攀升时极易控制不住漏出热液（淫髓产出 +8%）', promptHint: '尿道已开发至羞耻失禁：强烈刺激下前孔极易酸麻失守、羞耻漏液' },
  { id: 'urethra_lv5', part: 'urethra', minLevel: 5, title: '前孔蜜化', detail: '尿道彻底化作快感带，微弱探入或电麻便令全身过载失神（淫髓产出 +8%）', promptHint: '尿道已达前孔蜜化体质：被刮擦或探入时快感如电流直冲脑髓' },
  { id: 'vagina_lv3', part: 'vagina', minLevel: 3, title: '蜜穴贪吞', detail: '内壁熟软泥泞，一受挑逗便自动分泌大量爱液迎合（淫髓产出 +8%）', promptHint: '小穴已开发至蜜穴贪吞：尚未深入便已湿滑泛滥，内壁本能吸附异物' },
  { id: 'vagina_lv5', part: 'vagina', minLevel: 5, title: '宫口吸附', detail: '深处食髓知味，被顶到最里面便死死吮住不放、渴求灌满（淫髓产出 +8%）', promptHint: '小穴已达宫口吸附体质：深处嫩肉食髓知味地缠绞顶入物，拔出时极度空虚不舍' },
  { id: 'anus_lv3', part: 'anus', minLevel: 3, title: '后庭酥化', detail: '排泄羞耻已转化为酸胀快感，后穴被撑开时双腿发软（淫髓产出 +8%）', promptHint: '后庭已开发至酥化：异物进入后穴带来的羞耻感直接化为酸麻快感' },
  { id: 'anus_lv5', part: 'anus', minLevel: 5, title: '菊蕾贪欢', detail: '后穴彻底驯化为第二性器，层层嫩肉主动吞绞直至绝顶（淫髓产出 +8%）', promptHint: '后庭已达菊蕾贪欢体质：一圈圈嫩肉熟练地吞吐吮吸，单靠后穴也能高潮' },
]

/** 根据当前身体开发等级返回已点亮的敏感体质词条（同一部位 Lv5 会连同展示最高阶词条，计分按解锁总数）。 */
export function unlockedDevTraits(dev: BodyDevelopment | undefined): DevTrait[] {
  if (!dev) return []
  return DEV_TRAITS.filter((t) => (dev[t.part] ?? 0) >= t.minLevel)
}

/** 展示在状态栏的精简词条（同一部位若已达 Lv5，折叠 Lv3 只显示更高阶的 Lv5 词条以免拥挤）。 */
export function visibleDevTraits(dev: BodyDevelopment | undefined): DevTrait[] {
  const all = unlockedDevTraits(dev)
  return all.filter((t) => t.minLevel === 5 || !all.some((other) => other.part === t.part && other.minLevel === 5))
}

export function newlyUnlockedDevTraits(before: BodyDevelopment | undefined, after: BodyDevelopment | undefined): DevTrait[] {
  const prevIds = new Set(unlockedDevTraits(before).map((t) => t.id))
  return unlockedDevTraits(after).filter((t) => !prevIds.has(t.id))
}

export function devTraitsPromptLine(dev: BodyDevelopment | undefined): string {
  const active = visibleDevTraits(dev)
  if (!active.length) return ''
  return `【已觉醒敏感体质】${active.map((t) => `「${t.title}」${t.promptHint}`).join('；')}。碰到对应部位时必须体现这些已被改造熟化的身体本能。`
}
