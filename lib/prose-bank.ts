// 重油词库，与青楼模拟器的 prose-bank 同一套抽词规则。
// 每回合按场面深浅筛词，再抽一部分，避开最近用过的。

/** step：这一步起才可用（0 赶路 … 3 进入）；climax：只在本回合允许写高潮时给 */
export interface BankWord { w: string; step?: number; climax?: boolean }
const W = (list: string, step = 0, climax = false): BankWord[] => list.split(/\s+/).filter(Boolean).map((w) => ({ w, step, climax }))

export const STEP_LABELS = ['赶路', '对峙', '触碰', '进入', '余波'] as const

export const PROSE_BANK: Record<string, { label: string; pick: number; words: BankWord[] }> = {
  sound: { label: '拟声', pick: 5, words: [
    ...W('啾 啵 咕嘟 嘶哈 哈啊 呼哧 嘤咛 窸窣 沙沙 叮铃 吱呀 咂 吧唧 咕噜 唔嗯'),
    ...W('咕啾 噗滋 滋溜 咕叽 啾噜 黏答答 嗞啾', 2),
    ...W('啪啪 啪嗒 噗啾 咕唧咕唧 噗嗤', 3),
  ] },
  fluid: { label: '体液与湿度', pick: 4, words: [
    ...W('香汗 涎丝 银丝 汗珠 湿痕 水光 黏丝'),
    ...W('蜜液 爱液 淫水 前液 湿漉漉的腿根 拉丝的蜜', 2),
    ...W('白浊 精浆 潮水 浓稠的精 溢出的白', 3, true),
  ] },
  touch: { label: '触感', pick: 6, words: W('软糯 绵密 弹嫩 滑腻 黏稠 湿濡 紧致 肥厚 丰腴 酥软 细腻 温润 厚实 鼓胀 紧绷 颤巍巍 沉甸甸 肉乎乎 油亮 雪腻 脂滑 绵软 肥嫩 Q弹') },
  temp: { label: '温度', pick: 3, words: W('滚烫 灼热 温热 热乎乎 烫人 暖融融 蒸腾 凉滑 冰凉 微烫 热辣') },
  smell: { label: '气味', pick: 3, words: [
    ...W('奶香 甜腻体香 汗香 脂粉香 熟果般的甜香 皂角香 发丝的香 酒气'),
    ...W('雌香 发情的腥甜 麝香 荷尔蒙气息 潮湿的雌味 腥膻', 2),
  ] },
  part: { label: '部位别称', pick: 7, words: [
    ...W('雪腻乳肉 肥软奶球 乳峰 乳沟 蜜桃臀 肥臀 臀肉 丝腿 大腿根 腿弯 足弓 玉足 柳腰 腰窝 樱唇 软舌 香舌 檀口 锁骨窝 耳垂 后颈'),
    ...W('奶尖 乳晕 臀缝 花唇 花核 穴口 肉缝 肉棒 龟头 柱身 马眼 囊袋 青筋', 2),
    ...W('蜜穴 蜜壶 宫口 内壁 褶皱 最深处', 3),
  ] },
  verb: { label: '动作', pick: 5, words: [
    ...W('揉 捏 搓 蹭 贴 裹 舔 吮 嘬 咂 含 抚 摩挲'),
    ...W('挤 夹 磨 撸 套弄 吸吮', 2),
    ...W('顶 碾 绞 吞 夯 撞 研磨 抽送', 3),
  ] },
  voice: { label: '淫语', pick: 3, words: [
    ...W('「再靠近一点嘛」 「都被你看光了……」 「好热……」 「别、别盯着看呀」 「心跳好快……」'),
    ...W('「那里……不可以……」 「手指好烫……」 「湿、湿掉了……」 「再、再用力一点」', 2),
    ...W('「里面……全是你的形状」 「要被顶坏了」 「不要停……」 「好深……」 「要、要去了——」', 3),
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

/** 赶路保持短。碰到身体之后才用1000–1500。 */
export function denseLength(stepIndex: number): { min: number; max: number } {
  if (stepIndex <= 0) return { min: 250, max: 500 }
  if (stepIndex === 1) return { min: 400, max: 800 }
  return DENSE_LENGTH
}

const CORRIDOR = /往里赶|观察|停手|换层|只看|查看环境|推进廊道/
const AFTERMATH = /停下|松开|擦掉|清洗|余波|拔出/
const SEXUAL = /插入|抽送|顶入|贯入|含住|坐上去|抽插/
const TOUCH = /摸|揉|舔|吸|拨开|脱掉|亲吻|胸口|腿间|乳|穴|阴|臀|尿道|肛/

/** 把城主这一道命令收成青楼词库的五档。命令本身优先于身上已经有的快感。 */
export function inferDenseStep(input: string, character: { pleasure?: number; encounter?: unknown }): number {
  const text = input.replace(/\s+/g, '')
  const pleasure = character.pleasure ?? 0
  const held = Boolean(character.encounter)
  if (CORRIDOR.test(text)) return 0
  if (AFTERMATH.test(text) && pleasure >= 60) return 4
  if (SEXUAL.test(text)) return 3
  if (TOUCH.test(text)) return 2
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
  return max <= 500 ? '3 到 5' : max <= 800 ? '5 到 8' : '10 到 13'
}

export function denseStyleBlock(o: BankOpts): string {
  const sampled = sampleBank(o)
  const rows = Object.entries(sampled).map(([cat, words]) => `- ${PROSE_BANK[cat].label}：${words.join('、')}`)
  const recent = (o.avoid ?? []).slice(-10)
  if (recent.length) rows.push(`- 前几段已经用过（这段换别的说法）：${recent.join('、')}`)
  const step = STEP_LABELS[Math.max(0, Math.min(STEP_LABELS.length - 1, o.stepIndex))]
  const length = denseLength(o.stepIndex)
  const paras = densParas(length.max)
  const gate = o.climaxAllowed
    ? '本回合有人到了高潮档：高潮类的词（白浊 / 潮水…）可以用，写在已经高潮的那个人身上'
    : `本回合没有人到高潮：不写射精、白浊、喷发、潮吹、绝顶——浓度加在「${step}」这一步此刻的动作上`
  return `【★重油文风（最后的文风指令，前面重油段里的数量要求以这里为准；不压过这一步的强度上限、高潮闸门）★】
重油 = 镜头贴着身体走，一拍一拍写满，人物一直在出声。不是做填词题。
- ${gate}
- 「${step}」这一步没给的部位与动作不要提前写，但这一步之内要写透：从头到尾围着城主这道命令打转，一个动作拆成几拍慢慢写。
【写法】
1. 分段：${paras} 段，一段一拍：动作、部位近景、她的反应。台词和她的身体反应写在同一段里（先台词后反应，或先反应后台词），不要让一句台词单独成段。大约每两段里就有一段带她的台词。不写总结段，不写「她感到无比……」。
2. 对白约占正文四分之一（不少于两成），至少 5 句台词，分散在全段，不要挤在开头。她的台词要像她本人：原作口癖、自称、性格都保留（高傲的嘴硬，温柔的撒娇，冷淡的就冷淡地说出羞耻的话）。台词里夹喘息和拟声，用「……」「——」「～」断开，例如「唔……别、别碰那里……嗯啾……」。
3. 一拍的写法：动作落到具体部位 → 部位近景（形状、颜色、湿度、温度、气味里挑两三样）→ 声音或她的一句话。部位前的修饰可以连成长串（四到八个字的叠加），在主部位上用，次要部位一笔带过。
4. 拟声要具体，写清是什么发出的：咕啾的水声、乳肉拍打的啪嗒声、吸吮的滋溜声。激烈处可以写一句「几种声音混在一起」的合奏。
5. 节奏逐段加码：先看、再碰、再加力，身体反应一段比一段失控（夹紧、发抖、腰往前送、话说不完整）。结尾停在她的一句台词或一个正在进行的动作上，不收束、不总结。
6. 气味和体液要落地：落在哪、沾到哪、留下什么痕迹。
7. 正文 ${length.min}–${length.max} 字，硬上限 ${length.max} 字：写到上限就停在她的一句台词上，宁可少写一拍，也不要超。下面词库是调色板，挑贴切的用，大约用上一半就够，不要为凑词硬塞。仍然遵守【文风禁令】黑名单。
【本回合词库（调色板，每回合换一批）】
${rows.join('\n')}
【结构示例（原创，只示范「动作 → 台词 → 反应」在同一段里的结构，不是范文）】
${pickExemplar(o.seed, o.input ?? '')}
不要复用示例里的任何句子、台词或比喻，人名、部位、动作和台词都按本回合重新写。`}

export function denseTurnNote(stepIndex: number): string {
  const length = denseLength(stepIndex)
  return `\n\n【本回合硬性要求】
1. 正文 ${length.min}–${length.max} 字，超过 ${length.max} 字不合格。写够就停，停在她的一句台词上。
2. ${densParas(length.max)} 段。台词不单独成段，必须和她的动作或身体反应写在同一段。
3. 台词约占正文四分之一：至少 6 句她的台词，分散在各段，带喘息和拟声，保留她的口癖。
4. 围着这道命令写，不提前推进，不越过高潮闸门。不要复用示例句子。`
}
