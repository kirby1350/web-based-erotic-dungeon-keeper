// 重油词库：按城主视角的场面深浅分档抽词，避开最近用过的词，统一供主回合与工房/拷问生成调用。

import type { ProgramTurnResult } from '@/lib/adventure-context'

/** step：这一步起才可用（0 赶路 … 3 进入）；climax：只在本回合允许写高潮时给 */
export interface BankWord { w: string; step?: number; climax?: boolean }
const W = (list: string, step = 0, climax = false): BankWord[] => list.split(/\s+/).filter(Boolean).map((w) => ({ w, step, climax }))

export const STEP_LABELS = ['赶路', '对峙', '触碰', '进入', '余波'] as const

export const PROSE_BANK: Record<string, { label: string; pick: number; words: BankWord[] }> = {
  sound: { label: '拟声', pick: 5, words: [
    ...W('啾 啵 咕嘟 嘶哈 哈啊 呼哧 嘤咛 窸窣 沙沙 叮铃 吱呀 咂 吧唧 咕噜 唔嗯'),
    ...W('咕啾 噗滋 滋溜 咕叽 啾噜 黏答答 嗞啾 啧啧 噗叽 咕姆', 2),
    ...W('啪啪 啪嗒 噗啾 咕唧咕唧 噗嗤 噗噜噜 咕噗', 3),
  ] },
  fluid: { label: '体液与湿度', pick: 4, words: [
    ...W('香汗 涎丝 银丝 汗珠 湿痕 水光 黏丝 油亮雌汗 潮热汗雾'),
    ...W('蜜液 爱液 淫水 前液 淫痕 肠液 湿漉漉的腿根 拉丝的蜜 黏糊糊的雌汁 晶莹淫丝', 2),
    ...W('潮水 喷涌的蜜 决堤的热汁 咕嘟往外喷 溢出的淫汁 细密白沫 黏腻水洼', 3, true),
  ] },
  touch: { label: '触感', pick: 6, words: W('软糯 糯软 绵密 弹嫩 滑腻 黏稠 湿濡 紧致 肥厚 厚脂 脂附油肥 焖熟 厚熟 饱熟 丰腴 酥软 酥糯 柔绵 细腻 温润 厚实 宣软 鼓胀 饱满 紧绷 紧绷勒肉 颤巍巍 沉甸甸 肉乎乎 油亮 雪腻 脂滑 绵软 肥嫩 Q弹 紧致肥焖 肥嫩多汁 弹嫩雪滑') },
  temp: { label: '温度', pick: 3, words: W('滚烫 灼热 温热 热乎乎 烫人 暖融融 蒸腾 凉滑 冰凉 微烫 热辣') },
  smell: { label: '气味', pick: 3, words: [
    ...W('奶香 甜腻体香 汗香 脂粉香 熟果般的甜香 皂角香 发丝的香 冷香'),
    ...W('雌香 发情的腥甜 麝香 荷尔蒙气息 潮湿的雌味 腥甜热气 闷热雌气', 2),
  ] },
  part: { label: '部位别称', pick: 7, words: [
    ...W('雪腻乳肉 肥软奶球 乳峰 乳沟 乳浪 蜜桃臀 肥臀 臀肉 臀浪 丝腿 肥腴大腿 大腿根 腿弯 足弓 玉足 圆润足趾 柳腰 腰窝 饱熟小腹 樱唇 软舌 香舌 檀口 锁骨窝 耳垂 后颈'),
    ...W('奶尖 肥肿奶头 厚肉奶头 圆饼乳晕 臀缝 花唇 花核 充血肉珠 粉嫩屄肉 馒头肉屄 蝴蝶肉屄 肥硕阴蒂 穴口 肉缝 紧致尿道 多褶屁穴 肥腻菊蕾', 2),
    ...W('蜜穴 骚屄 屄芯 宫口 紧致甬道 内壁 嫩肉褶 最深处 屁眼', 3),
  ] },
  verb: { label: '动作', pick: 5, words: [
    ...W('揉 捏 搓 蹭 贴 裹 舔 吮 嘬 咂 含 抚 摩挲 托起 轻挤'),
    ...W('挤 夹 磨 套弄 吸吮 拨开 掰开 卷住 碾磨 轻捻', 2),
    ...W('顶 碾 绞 吞 夯 撞 研磨 抽送 撑开 贯入 箍紧', 3),
  ] },
  voice: { label: '闯入者反应台词样本（只借节奏，不照抄）', pick: 3, words: [
    ...W('「把路让开……」 「别、别靠过来！」 「谁怕你这地方……」 「手拿开！」 「喘、喘口气而已……」'),
    ...W('「那里……不准碰！」 「唔咕……怎么会这么烫……」 「湿、湿掉才不是因为你……」 「别再往里拨了……」', 2),
    ...W('「里面……撑不下了」 「连小腹都顶起来了……唔咕……」 「不要停……不对、快停下！」 「好深……」 「要、要去了——」', 3),
  ] },
  mod: { label: '修饰前缀（叠在部位前）', pick: 6, words: W('肥 厚 脂 油 腻 糯 雪 嫩 软 熟 湿 烫 沉 鼓 颤 香 粉 红') },
}

function rng(seed: number) {
  let s = (seed * 2654435761) >>> 0 || 1
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296 }
}

export interface BankOpts { stepIndex: number; climaxAllowed: boolean; seed: number; avoid?: string[]; input?: string }

export function availableWords(cat: string, o: Pick<BankOpts, 'stepIndex' | 'climaxAllowed'>): string[] {
  return PROSE_BANK[cat].words.filter((x) => (x.step ?? 0) <= o.stepIndex && (!x.climax || o.climaxAllowed)).map((x) => x.w)
}

export function sampleBank(o: BankOpts): Record<string, string[]> {
  const r = rng(o.seed + o.stepIndex * 101)
  const avoid = new Set(o.avoid ?? [])
  const out: Record<string, string[]> = {}
  for (const [cat, def] of Object.entries(PROSE_BANK)) {
    const pool = availableWords(cat, o)
    const fresh = pool.filter((w) => !avoid.has(w))
    const used = pool.filter((w) => avoid.has(w))
    const shuffle = (list: string[]) => list.map((w) => [r(), w] as const).sort((x, y) => x[0] - y[0]).map(([, w]) => w)
    out[cat] = [...shuffle(fresh), ...shuffle(used)].slice(0, def.pick)
  }
  return out
}

/** 从正文里找出用过的词库词。标记和数据块不算。单字修饰与单字动作不计。 */
export function bankWordsUsed(text: string): string[] {
  const clean = text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\[OPTIONS\][\s\S]*?(?:\[\/OPTIONS\]|$)/i, '')
    .replace(/\[SCENE[\s\S]*?\]/gi, '')
    .replace(/\[STATS[\s\S]*$/i, '')
    .replace(/\[DESC[\s\S]*$/i, '')
  const all = new Set<string>()
  for (const [cat, def] of Object.entries(PROSE_BANK)) {
    if (cat === 'mod') continue
    for (const { w } of def.words) {
      const core = w.replace(/[「」]/g, '').replace(/……|——/g, '')
      if (core.length >= 2 && clean.includes(core)) all.add(w)
    }
  }
  return [...all]
}

export function readRecentBank(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).slice(-30)
}

/** 最近用过的放在末尾，最多留 30 个。 */
export function rememberBankWords(previous: string[] | undefined, text: string): string[] {
  const used = bankWordsUsed(text)
  return [...(previous ?? []).filter((word) => !used.includes(word)), ...used].slice(-30)
}

export const DENSE_MIN_WORDS = 12
export const DENSE_LENGTH = { min: 1000, max: 1500 }
/** 提示里写的字数：重油碰到身体时统一按 1000–1500 报给模型，不再另报一档。 */
export const DENSE_PROMPT_LENGTH = DENSE_LENGTH

/** 提示里报给模型的字数：碰到身体的步骤报低一档，其他步骤照实际。 */
export function densePromptLength(stepIndex: number): { min: number; max: number } {
  const real = denseLength(stepIndex)
  return real.max === DENSE_LENGTH.max ? DENSE_PROMPT_LENGTH : real
}

/** 赶路保持短。碰到身体之后才用1000–1500。 */
export function denseLength(stepIndex: number): { min: number; max: number } {
  // 赶路和余波（停下、松开、擦掉）都是短格式，和【碰到身体】之外的规则一致。
  if (stepIndex <= 0 || stepIndex >= 4) return { min: 250, max: 500 }
  if (stepIndex === 1) return { min: 400, max: 800 }
  return DENSE_LENGTH
}

const CORRIDOR = /往里赶|观察|停手|换层|只看|查看环境|推进廊道|站在外面看|先不碰/
const AFTERMATH = /停下|松开|擦掉|清洗|余波|拔出/
const TAUNT = /问她|逼问|审问|盘问|命令她报|让她自己说|看她能挣到哪一步|放松一档|把斗篷扯|示众/
const SEXUAL = /插入|抽送|顶入|贯入|含住|坐上去|抽插|操|干进|灌满|产卵/
const TOUCH = /摸|揉|舔|吸|拨开|掰开|捏|挤|拍打|脱掉|亲吻|胸口|腿间|乳|奶|穴|屄|阴|臀|屁|尿道|肛|尾根|耳尖/

/** 判断本回合是否为纯观察/赶路/换层的非身体接触步骤（用于同时收束篇幅与高快感淫叫指令）。 */
export function isNonContactTurn(input: string, result: ProgramTurnResult | null = null): boolean {
  if (result?.kind === 'advance') return true
  if (result?.kind === 'explore' && !result.encounter) return true
  const text = input.replace(/\s+/g, '')
  if (SEXUAL.test(text) || TOUCH.test(text)) return false
  return CORRIDOR.test(text)
}

/** 把城主这一道命令收成五档：0 赶路/观察，1 对峙/审讯，2 触碰，3 进入，4 余波。命令本身优先于身上已有的快感。 */
export function inferDenseStep(input: string, character: { pleasure?: number; encounter?: unknown }): number {
  const text = input.replace(/\s+/g, '')
  const pleasure = character.pleasure ?? 0
  const held = Boolean(character.encounter)
  if (CORRIDOR.test(text)) return 0
  if (AFTERMATH.test(text) && pleasure >= 60) return 4
  if (SEXUAL.test(text)) return 3
  if (TOUCH.test(text)) return 2
  if (TAUNT.test(text)) return 1
  if (held && pleasure >= 50) return 3
  if (held) return 2
  if (pleasure >= 30) return 2
  if (pleasure >= 15) return 1
  return 0
}

export function denseBankOpts(input: string, character: { pleasure?: number; encounter?: unknown }, seed: number, avoid: string[] = []): BankOpts {
  return {
    stepIndex: inferDenseStep(input, character),
    climaxAllowed: (character.pleasure ?? 0) >= 80,
    seed,
    avoid,
    input,
  }
}

/** 统一的重油部位与体液边界规则（替代旧版静态千字词表，供系统提示词与工房共用）。 */
export const DENSE_ORGAN_RULES = `【重油部位与体液边界】
1. 碰到身体的这一步，字数以本回合硬性要求里的字数为准；往里赶、观察、停手、换层仍按前面的短篇幅，不新写性行为。被触碰的主部位每次出场连上两到四个质地词（从本回合词库取，同一质地词本回合最多一次），次要部位一笔带过。
2. 喻体每回合新写，不复用上回合喻体：乳房与奶头允许用蜜瓜、山峦、圆饼、椰枣；阴道允许用馒头、蜜桃（「馒头」只许写阴道，不许写别的部位）；阴蒂允许用红果子（「红果子」只许写阴蒂）；肛门允许用肉菊（「肉菊」只许写肛门）。禁止把「吊钟、奶山、肉山、磨盘、螺纹、章鱼嘴」当固定公式。尿道不混写肉褶、肠液、肉菊。
3. 没有奶水依据时，只写肥、沉、软、油和晃，不要写喷奶；喷出老远、决堤、咕嘟往外喷只在本回合写高潮时使用。
4. 细节闭环：挤出或渗出的液体要落到衣襟、束带、石地或皮肤上留下痕迹。「肉褶」「翕张」「一缩一缩」「油亮水光」每回合最多一次。`

/** 工房与场内随机拷问（单次短请求）使用的动态重油调色板。 */
export function denseWorkshopBlock(seed = 1): string {
  const sampled = sampleBank({ stepIndex: 2, climaxAllowed: false, seed })
  const cats: (keyof typeof PROSE_BANK)[] = ['touch', 'temp', 'fluid', 'part', 'verb', 'mod']
  const rows = cats.map((cat) => `- ${PROSE_BANK[cat].label}：${sampled[cat].join('、')}`)
  return `${DENSE_ORGAN_RULES}\n【本次重油词库（挑贴切的主部位词连在部位前，不原样抄列表）】\n${rows.join('\n')}`
}

/** 台词形态要轮换：保留人设反差，同时用生理反应打断句子。 */
export const DIALOGUE_VARIETY = '台词形态要轮换，相邻两句不能是同一个句式：有的完全不带淫叫，用她原作的口吻呛声、谈判或强装镇定；有的是话说到一半被吞咽声或短喘（唔咕、咕啾、齁唔）截断，顺带点出身体此刻的具体变化（如「等、等等……里面还在麻——」「怎么连小腹都顶起来了……」）；有的整句只是失控叫声；有的是问句、求饶或撒娇。清冷、端庄、高傲或机娘角色越是身体溃败（丝袜湿透、渗乳、痉挛），台词越要留住她原本的腔调（冷淡陈述羞耻事实、敬语发颤、条例播报卡壳），不要把所有人拉平成同一种粗俗叫骂。长串淫叫（六字以上）全段最多两句，位置轮换，长短不一。口吃（别、别……）全段最多两处。器官叫法全段最多出现两次，其余用「那里」「里面」或省掉；自称不必每句都带，不要每句都用「要、要被你……了」收尾。'

/** 叙述要往前走：微距物理递进 + 末端失控细节，不能靠重复同一拍加码。 */
export const NARRATION_PROGRESS = '叙述要往前走：每段都带来新东西（逐寸深入的刻度、换位置或受力角度、衣物与妆容的崩解、末端肢体失控、她态度的松动）。接触与进入按微距镜头拆拍：先写抵住入口时嫩肉收缩挤出一缕湿液 → 再写逐寸撑开的形变（阴唇紧箍、乳肉从指缝满溢、丝袜或束带勒进肥肉的凹痕、深入时软糯小腹表面微隆紧绷的轮廓） → 再写末端失控反应（十根圆润足趾蜷缩又张开、脚尖打滑乱蹬、手指想推开却痉挛滑落、耳朵或尾巴炸开后软塌）。不要用「又加了一档 / 又亮了一分 / 一收一放 / 一抽一抽地跳 / 绷得笔直 / 湿得不成样子」这类同一拍换个说法重来；同一个短语或比喻在这段回复里只用一次。同一种身体反应在一段回复里只写一次，高潮要写一种前面没出现过的反应。加码靠变化，不靠重复。能写高潮时，写出「逼近 → 高潮 → 余韵（抽搐、失焦翻白、唇角涎丝、微张合不拢的残像与余韵里的一句话）」的完整弧线，不要停在高潮上原地打转凑字数。'

/** 原创节奏示例。每回合轮换一段，跳过和本回合命令同一种玩法的那段，免得被照抄。 */
export const DENSE_EXEMPLARS: { play: RegExp; text: string }[] = [
  { play: /乳|奶|胸/, text: `藤蔓钻进她的衣领，把胸口的软肉托起来往外拨。「谁准你……拿开——唔！」她嘴上骂着，胸口却往前挺了一下，呼吸也乱了。` },
  { play: /腿|臀|屁股|打|拍/, text: `皮带落在臀上，啪的一声，留下一道红印。「才、才不痛……哈啊……」她把脸埋进臂弯，膝盖却在石板上并紧了。` },
  { play: /舔|嘴|吻|口|舌/, text: `他扣住她的下巴吻下去，咂的一声才放开。「唔嗯……喘不过气了……」她松开攥着衣襟的手，嘴唇又自己凑了回去。` },
  { play: /腿间|阴|穴|屄|蒂|下面|手指/, text: `指尖隔着布料按住那一点，慢慢打转。「不、不要按那里……嗯啊……」她一边推他的手，一边把腰往他手上送。` },
]

export function pickExemplar(seed: number, input: string): string {
  const pool = DENSE_EXEMPLARS.filter((e) => !e.play.test(input))
  const list = pool.length ? pool : DENSE_EXEMPLARS
  return list[Math.abs(seed) % list.length].text
}

/** 短篇幅的步骤段落少一些。 */
function densParas(max: number): string {
  return max <= 500 ? '3 到 4' : max <= 800 ? '5 到 7' : '7 到 9'
}

export function denseStyleBlock(o: BankOpts): string {
  const sampled = sampleBank(o)
  const rows = Object.entries(sampled).map(([cat, words]) => `- ${PROSE_BANK[cat].label}：${words.join('、')}`)
  const recent = (o.avoid ?? []).slice(-10)
  if (recent.length) rows.push(`- 前几段已经用过（这段换别的说法）：${recent.join('、')}`)
  const step = STEP_LABELS[Math.max(0, Math.min(STEP_LABELS.length - 1, o.stepIndex))]
  const length = densePromptLength(o.stepIndex)
  const paras = densParas(length.max)
  const gate = o.climaxAllowed
    ? '本回合到了高潮档：高潮类的词（潮水 / 喷涌的蜜 / 决堤的热汁…）可以用在真正高潮的那一拍'
    : `本回合未到高潮：不写潮吹、喷水、决堤、绝顶——浓度加在「${step}」这一步此刻的动作上`
  return `【★重油文风（本回合生效的篇幅与词库指令；不压过这一步的强度上限与高潮闸门）★】
重油 = 镜头贴着身体走，一拍一拍写满，她的声音穿插其中，但台词数有上限。别写成填词题。
- ${gate}
- 「${step}」这一步没给的部位与动作不要提前写，但这一步之内要写透：从头到尾围着城主这道命令打转，一个动作拆成几拍慢慢写。
【写法】
1. 分段：叙述段 ${paras} 个，一段一拍：动作、部位近景、她的反应。台词单独一行，只插在其中几段之间，不是每段后都跟台词；不要把一句台词拆成「台词 + 一小段动作 + 台词」的好几行。不写总结段，不写「她感到无比……」。
2. 对白约占正文五分之一，全段 4 到 7 行（单独成行的淫叫、半句叫声也各算一行），分散在全段，不要挤在开头。她的台词要像她本人：原作口癖、自称、性格都保留（高傲的嘴硬，温柔的撒娇，冷淡的就冷淡地说出羞耻的话）。${DIALOGUE_VARIETY}
3. 一拍的写法：动作落到具体部位 → 微距部位近景（用「油脂分量 + 汗液水光 + 晃荡或勒肉动态」连成八到十四字的肉感长定语把主部位托出来，例如「脂附油肥沁出细密香汗的沉甸甸软糯肥乳」「被丝袜紧绷勒出凹痕的丰腴软颤大腿」，次要部位一笔带过）→ 声音或她的一句话。
4. 拟声要具体，写清是什么发出的：咕啾的水声、乳肉拍打的啪嗒声、吸吮的滋溜声、退出时啵的一声轻响。拟声词直接嵌在叙述段句子里，不要把纯拟声单独加引号占一行台词。激烈处可以写一句「几种声音混在一起」的合奏。
5. ${NARRATION_PROGRESS}正文结尾停在她的一句台词或一个正在进行的动作上，不写总结段，随后紧接输出协议标记块。
6. 衣物、妆容与体液要落地：衣扣松散、布料或丝袜被汗水淫液浸得半透明贴肉、泪水汗水晕开眼尾，挤出或淌下的液体顺着锁骨、乳沟、股沟流到石地上汇成湿痕，拔出或松开时牵出晶莹银丝。
7. 正文 ${length.min}–${length.max} 字，硬上限 ${length.max} 字：正文写到上限就停在她的一句台词上，宁可少写一拍，也不要超，紧接着输出 [OPTIONS]、[SCENE]、[STATS]、[DESC]；字数不够就多写一个新动作，绝不靠重复同一拍凑字。下面词库是调色板，挑贴切的用，主部位上要用够，次要部位可以省，不要整串原样照抄。仍然遵守【文风禁令】黑名单。
【本回合词库（调色板，每回合换一批）】
${rows.join('\n')}
【结构示例（原创，只示范「动作 → 台词 → 反应」的节拍，不是范文）】
${pickExemplar(o.seed, o.input ?? '')}
不要复用示例里的任何句子、台词或比喻，人名、部位、动作和台词都按本回合重新写。`}

export function denseTurnNote(stepIndex: number): string {
  const length = densePromptLength(stepIndex)
  return `\n\n【本回合硬性要求】
1. 正文 ${length.min}–${length.max} 字（只算正文，不算末尾标记），${length.max >= 1500 ? '瞄准 1100–1300 字：写完第八个叙述段就收束正文，' : length.max <= 500 ? '瞄准 350 字左右：四段就收束正文，' : ''}超过 ${length.max} 字不合格，少于 ${length.min} 字也不合格。正文部分停在她的一句台词上，随后必须紧接输出完整的 [OPTIONS]四条命令[/OPTIONS] → [SCENE: 英文标签] → [STATS: 单行JSON] → [DESC: 单行JSON]，绝不可漏掉末尾四个标记块。
2. 叙述段 ${densParas(length.max)} 个，每段 60–110 字，不要写成大段，也不要切成二三十字的碎段。
3. 台词瞄准 5 行，4 到 7 行，所有引号行都算：她的话、单独成行的淫叫（哪怕只有「——！！❤❤」）、城主的话。城主全段最多开口一次。第 8 行就算不合格，高潮前后的叫声并进同一行，不要一声一行，约占正文五分之一，不必每个叙述段后都跟一行；相邻两行台词的句式不能一样，长串淫叫全段最多两行，器官叫法最多两行带出，口吃最多两处。
4. 叙述每段都要有新东西（新动作 / 新位置 / 新感觉 / 她态度的变化），同一个短语、比喻在这段回复里只用一次，「又亮了一分 / 又加了一档」这类加码句全段最多一次；能写高潮时写「逼近 → 高潮 → 余韵」的弧线，不在高潮上原地打转。
5. 围着这道命令写，不提前推进，不越过高潮闸门。不要复用示例句子。「不是……而是……」「不是……，是……」「不是 X，不是 Y——是 Z」这类否定转折句全段最多一次，最好一次都不用：直接写正面的那一半（「不是哭，是被揉出来的」改成「眼眶被揉得发红」）。
6. 叠词：主部位第一次出场时，前面连一串四到八字的叠加修饰（质地、温度、湿度、形状里挑两三样，从本回合词库取，例如「滚烫黏稠的肥厚」这种连在部位前），全段至少三串，落在不同部位或不同一拍上。同一个质地词不重复，同一部位第二次出场改用动作或代称。${length.max <= 500 ? '短篇幅回合至少一串，写在身上已有的余波上。' : ''}
7. 直接从正文第一句开始写，不要先写计划、思考、字数盘算或对这些规则的复述，正文里不要夹英文词（英文只出现在末尾的 [SCENE] 与 JSON 键名里）。
8. 交稿前自查四件事：全文「不是」后面接「是」的句子数一遍，多于一句就改掉；正文字数超过 ${length.max} 就删掉最后几拍；叠词串够不够三串，不够就补在主部位上（删字时先删叙述里的重复拍，不删叠词）；确认正文结束后已完整附上 [OPTIONS]、[SCENE]、[STATS]、[DESC] 四个标记块。`
}

/** 上一段回复里自我重复的句子（叙述部分，按逗号句号切分，出现两次以上的），最多 8 条。 */
const NEGATION_TURN = /不是[^，。！？；\n「」]{1,14}?[，,、—…\s]*(?:不是[^，。！？；\n「」]{1,14}?[，,、—…\s]*)*(?:而|就|只|才)?是/g

/** 「不是X，是Y」否定转折句。正文和台词都算。 */
export function negationTurns(text: string | undefined): string[] {
  if (!text) return []
  const body = text.replace(/<!--[\s\S]*?-->/g, '').replace(/\[(OPTIONS|SCENE|STATS|DESC|PARTNER)[\s\S]*$/i, '')
  return [...body.matchAll(NEGATION_TURN)].map((m) => m[0]).filter((m) => !/^不是(?:吗|嘛|么|啊|呢)/.test(m))
}

export function repeatedClauses(text: string | undefined, limit = 8): string[] {
  if (!text) return []
  const body = text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\[(OPTIONS|SCENE|STATS|DESC|PARTNER)[\s\S]*$/i, '')
    .replace(/[「“"][^」”"]*[」”"]/g, '\n')
    .replace(/[*＊]/g, '')
  const count = new Map<string, number>()
  for (const raw of body.split(/[，。；！？、\n,.;!?]/)) {
    const clause = raw.trim()
    if (clause.length < 5 || clause.length > 18) continue
    count.set(clause, (count.get(clause) ?? 0) + 1)
  }
  return [...count.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([c]) => c)
}

/** 接在本回合要求后面：点名上一段自我重复的句子，这回合不要再用。 */
export function repeatNote(previousReply: string | undefined): string {
  const list = repeatedClauses(previousReply)
  const neg = negationTurns(previousReply)
  const clauses = list.length ? `\n7. 上一段这些句子写了不止一次，本回合一次都不要再用，换新的动作和反应：${list.map((c) => `「${c}」`).join('、')}。` : ''
  const turns = neg.length > 1 ? `\n8. 上一段用了 ${neg.length} 次「不是……是……」句式（${neg.slice(0, 4).map((c) => `「${c}…」`).join('、')}），超了。本回合最多一次，直接写正面那一半。` : ''
  return clauses + turns
}

/** 正文里用到的词库质地词（触感、温度、体液）个数，同一个词只算一次。 */
export function textureWordsUsed(text: string): number {
  const words = ['touch', 'temp', 'fluid'].flatMap((k) => PROSE_BANK[k]?.words ?? []).map((b) => b.w).filter((w) => w.length >= 2)
  return new Set(words.filter((w) => text.includes(w))).size
}
