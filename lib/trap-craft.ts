// 陷阱的类别感官表、阶段、习性、命中预览、升级和楼层规则。
// 只放纯函数和数据，keeper.ts / prompts.ts / UI 都从这里取，不反向依赖 keeper 的运行时代码。
import { PRESET_STATUS_EFFECTS, PRESET_TRAPS, TRAP_GROUPS, trapGroup, type BodyPart, type Character, type Race, type StatusEffect } from '@/lib/types'
import { tagsOf, type DefenseTag } from '@/lib/synergy'

export interface CategorySheet {
  /** 感官：她先感到什么 */
  sense: string
  /** 机制：装置能怎么施力 */
  mechanic: string
  /** 禁止：和机制矛盾的写法 */
  ban: string
  /** 这一类本身的加码手段，按回合换着用 */
  escalate: string[]
  /** 撞上时附加的状态 */
  status: string
  parts: BodyPart[]
  habit: string
}

export const CATEGORY_SHEET: Record<string, CategorySheet> = {
  触手系: { sense: '湿冷的吸盘、肉质的蠕动、被缠紧时的勒压', mechanic: '多根触手分工：缠四肢、吸乳头、探孔穴，可以分叉、变粗、分泌黏液', ban: '不要只写一根触手；不要把触手写成金属或光', escalate: ['分叉出更细的触须', '吸盘吸住乳头和阴蒂', '变粗撑开', '把她吊离地面翻转姿势', '注入温热黏液'], status: 'bondage', parts: ['breast', 'vagina', 'anus'], habit: '贪婪，抓到就不松，一根退下另一根马上补上' },
  粘液系: { sense: '温热的包裹、衣物被溶开的刺痒、无处不在的滑腻', mechanic: '粘液整体包裹、渗透、震动，可以聚成块状压迫，也可以溶衣', ban: '粘液没有骨架，不要写它"抓住手腕拉开"，只能包裹、灌入、凝固', escalate: ['溶掉最后一层布料', '在体内凝成块状', '整体高频震动', '从包裹变成往孔穴里灌', '突然变冷再变热'], status: 'aphrodisiac', parts: ['breast', 'clitoris', 'vagina'], habit: '慢，像在品尝，从脚踝一路往上吞' },
  虫群系: { sense: '无数细足爬过皮肤、细小的叮咬、钻进缝隙的痒', mechanic: '数量压制：分散到全身同时刺激，叮咬注入微量催情毒，钻进衣物和缝隙', ban: '不要写成一只大虫；单只虫没有力量制住她', escalate: ['集中到一个部位', '叮咬注毒', '钻进衣服里面', '在乳头和阴蒂上群聚振翅', '往尿道口和后穴钻'], status: 'aphrodisiac', parts: ['breast', 'clitoris', 'urethra'], habit: '吵闹，越挣扎聚得越多' },
  '寄生/产卵': { sense: '小腹深处的胀热、被异物顶住宫口的沉重', mechanic: '产卵管插入、产下卵、卵在体内温热胎动；寄生体会附着在神经上放大快感', ban: '卵不会凭空出现，要先写产卵管或寄生体进入', escalate: ['多产一颗', '卵在体内胎动', '寄生体钻深一层', '让她自己把卵挤出', '寄生体接管她的腰'], status: 'pregnancy_heat', parts: ['vagina', 'anus'], habit: '耐心，每一颗都要等她吞下去才产下一颗' },
  怪物巢穴: { sense: '腥臊的体味、被围住的压迫、粗糙的皮肤和体温', mechanic: '巢里有多只，轮流或同时，按体型和地位排先后', ban: '不要让巢里的东西凭空消失；轮换要交代谁退谁上', escalate: ['换体型更大的一只', '两只同时', '被抬起来架住', '巢主亲自上', '把她拖进更深的巢室'], status: 'estrus', parts: ['vagina', 'anus', 'breast'], habit: '有等级，弱的先上，最强的一只在后面看' },
  兽奸系: { sense: '兽毛、粗重的喘息、带倒刺或结的形状', mechanic: '野兽按本能交配：骑跨、成结锁住、舔舐', ban: '野兽不会说人话，不要写它下命令', escalate: ['成结锁住拔不出', '换姿势骑跨', '粗舌舔过全身', '第二只等在旁边', '射完不退出继续'], status: 'estrus', parts: ['vagina', 'anus'], habit: '急躁，嗅到发情就扑上来' },
  催情植物: { sense: '甜腻的花香、粉末落在黏膜上的灼热、藤蔓的粗糙', mechanic: '花粉催情、花蜜灌喂、藤蔓缠绑、花蕊吸附敏感点', ban: '植物移动慢，不要写它瞬间扑上来；先写花粉起效', escalate: ['花粉喷进口鼻', '花蕊吸住乳头和阴蒂', '藤蔓把双腿拉开', '花蜜灌进喉咙', '花苞合拢把她包进去'], status: 'aphrodisiac', parts: ['breast', 'clitoris', 'vagina'], habit: '安静，等她吸够花粉才收紧藤蔓' },
  拘束系: { sense: '绳索勒进皮肉、关节被固定的酸麻、动弹不得的无力', mechanic: '固定姿势、调整张开角度、收紧勒点，本身不插入，可以挂道具', ban: '绳子不会自己插入；要写道具或别的布置', escalate: ['收紧胸前的绳', '把腿拉得更开', '换成吊缚', '加上口枷或眼罩', '在绳结处挂震动道具'], status: 'bondage', parts: ['breast', 'clitoris'], habit: '一丝不苟，每次只改一个结' },
  魔法拘束: { sense: '无形的压力、淫纹发烫、被魔力摆弄的失控', mechanic: '魔力把身体固定成姿势，淫纹放大敏感、强制提升欲望', ban: '魔法拘束没有实体触感，不要写绳子勒痕', escalate: ['淫纹扩大到小腹', '魔力强制摆出更羞耻的姿势', '让她的手自己动', '淫纹脉动同步快感', '魔力锁住高潮不许去'], status: 'lewd_brand', parts: ['clitoris', 'vagina'], habit: '傲慢，喜欢让她自己摆出姿势' },
  机械: { sense: '冰冷的金属、齿轮的节拍、不知疲倦的匀速', mechanic: '机械臂、活塞、吸盘、扩张器；按程序运行，节奏精确，可以换档', ban: '机械没有情绪，不会"兴奋"；只能换档、换头、换程序', escalate: ['换高一档', '换成更粗的头', '加一组吸盘', '程序改成不规则节奏', '扩张器逐级撑开'], status: 'bondage', parts: ['vagina', 'anus', 'breast'], habit: '刻板，按程序一档一档往上，不看她的反应' },
  电击系: { sense: '针刺般的麻、肌肉不受控的抽搐、残留的嗡鸣', mechanic: '电极贴在敏感点，强弱和间隔可调，电流让肌肉收缩', ban: '电流不会"插入"；写电极位置和电流走向', escalate: ['电极移到乳头', '电极贴上阴蒂', '间隔缩短', '电流从一点串到另一点', '在高潮边缘断电'], status: 'aphrodisiac', parts: ['breast', 'clitoris', 'urethra'], habit: '戏弄，喜欢在她快到的时候断电' },
  榨取系: { sense: '吸力、被抽走的空虚、乳汁或体液被导出的羞耻', mechanic: '吸杯、导管、榨乳机，持续抽取，计量并展示收集量', ban: '没有液体时不能凭空榨出，要先写催乳或高潮', escalate: ['加大吸力', '换成脉冲吸', '同时吸阴蒂', '把收集瓶摆到她眼前', '吸到一滴不剩才停'], status: 'lactation', parts: ['breast', 'clitoris'], habit: '贪心，记着她每一次的量，下一次要更多' },
  催眠幻觉: { sense: '视线发虚、低语在脑子里回响、分不清真假', mechanic: '镜像、低语、暗示；没有实体，靠她自己的手或幻觉施力', ban: '没有实体，不能写被插入、撑开、勒住；要碰身体就借她自己的手或另一件实体布置', escalate: ['暗示她自己摸', '幻觉里加一个人', '让她说出自己的弱点', '把羞耻感调成快感', '数到三就高潮的指令'], status: 'hypnosis', parts: ['clitoris', 'breast'], habit: '温柔，一句一句诱，不逼' },
  操控系: { sense: '四肢被丝线牵动、身体不听使唤、眼睁睁看自己动', mechanic: '丝线或魔力操纵她的四肢，让她自己做动作', ban: '操控的是她自己的手脚，不要写外物插入', escalate: ['让她自己掰开', '操纵她的手指往里', '摆出跪姿迎合', '让她自己扭腰', '操纵她说出求饶的话'], status: 'hypnosis', parts: ['clitoris', 'vagina'], habit: '爱看戏，让她清醒地看着自己动' },
  诅咒系: { sense: '契约文字烙在皮肤上发烫、条件被触发时的强制', mechanic: '契约条款：触犯就被强制发情、被迫服从、敏感度翻倍', ban: '诅咒按条款生效，不要无条件随意加；每次写清触发了哪一条', escalate: ['触发新一条条款', '契约纹扩散', '敏感度再翻一倍', '把她的称呼也写进契约', '违约惩罚生效'], status: 'lewd_brand', parts: ['vagina', 'clitoris'], habit: '讲规矩，每一条都念给她听' },
  药物系: { sense: '注入处的凉、随后蔓延的燥热、心跳加快', mechanic: '注射、灌入、涂抹，药效有起效时间和峰值', ban: '药效要时间，不要注射同一句就高潮；先写起效', escalate: ['加大剂量', '直接涂在黏膜上', '换一种更烈的药', '灌进子宫', '药效到峰值时再碰'], status: 'aphrodisiac', parts: ['breast', 'clitoris', 'vagina'], habit: '像实验员，每一剂都记录她的反应' },
  特殊系: { sense: '时间、空间或感知被扭曲后的错乱', mechanic: '时停、感觉转移、空间折叠等规则性装置；规则先定清楚再用', ban: '规则一旦定下不能自相矛盾；时停中她不能动', escalate: ['延长时停', '把累积的刺激一次放出', '感觉转移到另一个部位', '倍化敏感', '规则加一条'], status: 'bondage', parts: ['clitoris', 'vagina'], habit: '冷静，像在做实验' },
}
export const TRAP_CATEGORIES = Object.keys(CATEGORY_SHEET)

export const PRESET_HABITS: Record<string, string> = {
  tentacle_pit: '贪婪，一根退下另一根马上补上，从不让她空着',
  slime_swallow: '慢，像在品尝，从脚踝一路往上吞',
  pollen_garden: '安静，等她吸够花粉才收紧藤蔓',
  lewd_rune: '傲慢，喜欢让她自己摆出姿势',
  succubus_mirror: '温柔，一句一句诱，镜中的自己先替她认输',
  parasite_egg: '耐心，每一颗都要等她吞下去才产下一颗',
  ancient_machine: '刻板，按程序一档一档往上，不看她的反应',
  orc_nest: '有等级，弱的先上，最强的一只在后面看',
  shock_chamber: '戏弄，喜欢在她快到的时候断电',
  milking_rig: '贪心，记着她每一次的量，下一次要更多',
  insect_swarm: '吵闹，越挣扎聚得越多',
  puppet_strings: '爱看戏，让她清醒地看着自己动',
  aphro_infusion: '像实验员，每一剂都记录她的反应',
  demon_contract: '讲规矩，每一条都念给她听',
  suspension_bondage: '一丝不苟，每次只改一个结',
  time_stop: '冷静，时间一恢复就把攒下的全放出来',
  beast_taming: '急躁，嗅到发情就扑上来',
}

export const PHASES = ['触发', '锁定', '加码', '高潮', '余韵'] as const
export const PHASE_RULES: string[] = [
  '第一次接触。写装置怎么启动、先碰哪里。她还在反抗、找出口。不要直接写到高潮。',
  '固定住她。定下姿势和受力点，只加一种新刺激。',
  '加码。从本陷阱的加码清单里换一种上回合没用过的；同层有别的布置时让它接力。',
  '可以把她推过顶点。高潮必须由本装置的机制造成，部位的反应写在正文里。',
  '余韵。装置放缓或维持，写过载、残留（黏液、勒痕、电麻、卵的重量）和她的状态；可以准备下一轮。',
]

export interface TrapLike { id: string; name: string; mechanism: string; prose?: string; category?: string; status?: string; habit?: string; level?: number; hits?: number }

export function guessCategory(text: string): string {
  const rules: [RegExp, string][] = [
    [/触手|触须/, '触手系'], [/史莱姆|粘液|黏液/, '粘液系'], [/虫/, '虫群系'], [/产卵|寄生|卵/, '寄生/产卵'], [/巢|半兽人|哥布林/, '怪物巢穴'],
    [/兽|犬|马/, '兽奸系'], [/花|藤|植物|花粉/, '催情植物'], [/淫纹|魔法|魔力/, '魔法拘束'], [/机械|齿轮|活塞|装置/, '机械'], [/电/, '电击系'],
    [/挤奶|榨|吸乳|泌乳/, '榨取系'], [/催眠|幻|镜/, '催眠幻觉'], [/丝线|操控|傀儡/, '操控系'], [/契约|诅咒/, '诅咒系'], [/药|注射|灌注/, '药物系'],
    [/绳|锁链|镣铐|拘束|吊/, '拘束系'], [/时停|时间/, '特殊系'],
  ]
  return rules.find(([re]) => re.test(text))?.[1] ?? '拘束系'
}

export function presetCategory(id: string): string | undefined {
  return PRESET_TRAPS.find((trap) => trap.id === id)?.category
}

export function trapCategory(trap: TrapLike): string {
  if (trap.category && CATEGORY_SHEET[trap.category]) return trap.category
  return presetCategory(trap.id) ?? guessCategory(`${trap.name} ${trap.mechanism}`)
}

export function trapSheet(trap: TrapLike): CategorySheet {
  return CATEGORY_SHEET[trapCategory(trap)]
}

const STATUS_IDS = new Set(PRESET_STATUS_EFFECTS.map((effect) => effect.id))
export function trapStatusId(trap: TrapLike): string {
  return trap.status && STATUS_IDS.has(trap.status) ? trap.status : trapSheet(trap).status
}
export function statusById(id: string | undefined): StatusEffect | null {
  return PRESET_STATUS_EFFECTS.find((effect) => effect.id === id) ?? null
}
export function trapHabit(trap: TrapLike): string {
  return trap.habit?.trim() || PRESET_HABITS[trap.id] || trapSheet(trap).habit
}

/** 3 级陷阱多带的一种状态：和主状态不同 */
export function extraStatusId(trap: TrapLike): string {
  const main = trapStatusId(trap)
  const group = trapGroup(trapCategory(trap))
  const pick = group === '触手·生物' ? ['estrus', 'aphrodisiac'] : group === '拘束·机械' ? ['bondage', 'aphrodisiac'] : ['hypnosis', 'lewd_brand']
  return pick.find((id) => id !== main) ?? 'aphrodisiac'
}

/** 撞上时的状态：主状态，3 级再加一种 */
export function trapStatuses(trap: TrapLike): StatusEffect[] {
  const ids = [trapStatusId(trap), ...((trap.level ?? 1) >= 3 ? [extraStatusId(trap)] : [])]
  return [...new Set(ids)].map(statusById).filter((effect): effect is StatusEffect => !!effect)
}

export function trapRestraint(trap: TrapLike | undefined): number {
  return (trap?.level ?? 1) >= 2 ? 3 : 2
}

// ---------- 升级 ----------
export const LEVEL_RULES = [
  { level: 2, hits: 3, cost: 8, gain: '束缚 2→3，挣开更难' },
  { level: 3, hits: 6, cost: 14, gain: '撞上时多附一种状态' },
] as const
export function nextLevelRule(trap: TrapLike) {
  return LEVEL_RULES.find((rule) => rule.level === (trap.level ?? 1) + 1) ?? null
}
export function levelUpBlock(trap: TrapLike, essence: number): string {
  const rule = nextLevelRule(trap)
  if (!rule) return '已经满级'
  if ((trap.hits ?? 0) < rule.hits) return `再撞上 ${rule.hits - (trap.hits ?? 0)} 次才能升级`
  if (essence < rule.cost) return `升级要 ${rule.cost} 淫髓`
  return ''
}

// ---------- 楼层 ----------
export const FLOOR_TRAP_CAP = 2
export const FLOOR_MONSTER_CAP = 2
export const BASE_TRIGGER = 0.65
export const THEME_TRIGGER = 0.8
export const THEME_BONUS = 0.1

/** 层名和环境描写里的意象，和这一层布置的标签有交集就算主题契合 */
export function themeMatch(floorText: string, defenseTexts: string[]): DefenseTag[] {
  const theme = new Set(tagsOf(floorText))
  return [...new Set(defenseTexts.flatMap(tagsOf))].filter((tag) => theme.has(tag))
}

// ---------- 命中 ----------
export const PART_LABEL: Record<BodyPart, string> = { breast: '乳', clitoris: '阴蒂', urethra: '尿道', vagina: '小穴', anus: '后穴' }
const PART_WORDS: [BodyPart, RegExp][] = [
  ['breast', /乳|胸/], ['clitoris', /阴蒂|蒂珠|豆/], ['urethra', /尿道|尿/], ['anus', /后穴|屁穴|肛|菊/], ['vagina', /阴道|小穴|骚穴|子宫|宫口|孔穴|贯穿/],
]
export function partsIn(text: string): BodyPart[] {
  return PART_WORDS.filter(([, re]) => re.test(text)).map(([part]) => part)
}
export function trapParts(trap: TrapLike): BodyPart[] {
  const found = partsIn(`${trap.mechanism} ${trap.prose ?? ''}`)
  return found.length ? found : trapSheet(trap).parts
}

/** 档案里写到死穴、弱点、受不了的那几句提到的部位 */
export function weakParts(character: Pick<Character, 'sexual' | 'otherDescription'>): BodyPart[] {
  const text = `${character.sexual ?? ''}。${character.otherDescription ?? ''}`
  const lines = text.split(/[。；;\n]/).filter((line) => /死穴|弱点|受不了|最怕|一碰就/.test(line))
  return [...new Set(lines.flatMap(partsIn))]
}

const RACE_TAGS: Partial<Record<Race, { weak: DefenseTag[]; resist: DefenseTag[]; note: string }>> = {
  elf: { weak: ['aphro'], resist: [], note: '精灵亲近草木，花粉和花蜜起效更快' },
  tauren: { weak: ['milk'], resist: ['bind'], note: '牛族乳腺发达，力气大，绳缚容易被挣开' },
  fox: { weak: ['fire', 'hypno'], resist: [], note: '狐族怕狐火，也容易被幻术带走' },
  cat: { weak: ['tentacle'], resist: [], note: '猫族对缠绕和挠痒特别敏感' },
  machine: { weak: ['shock', 'machine'], resist: ['aphro', 'hypno'], note: '机娘吃电流和机械，药和幻术效果打折' },
  dragon: { weak: ['parasite'], resist: ['bind'], note: '龙族力气大，绳缚难困住，但怕被寄生' },
  succubus: { weak: ['hypno'], resist: ['aphro'], note: '魅魔对媚药早有抗性，反而怕被支配心智' },
}

export interface HitPreview { parts: { part: BodyPart; label: string; level: number; weak: boolean }[]; race: 'weak' | 'resist' | ''; raceNote: string; score: number }
export function hitPreview(trap: TrapLike, character: Pick<Character, 'race' | 'bodyDevelopment' | 'sexual' | 'otherDescription'>): HitPreview {
  const weak = new Set(weakParts(character))
  const dev = (character.bodyDevelopment ?? {}) as Partial<Record<BodyPart, number>>
  const parts = trapParts(trap).map((part) => ({ part, label: PART_LABEL[part], level: dev[part] ?? 0, weak: weak.has(part) }))
  const tags = tagsOf(`${trap.name} ${trap.mechanism}`)
  const rule = RACE_TAGS[character.race]
  const race = rule?.weak.some((tag) => tags.includes(tag)) ? 'weak' : rule?.resist.some((tag) => tags.includes(tag)) ? 'resist' : ''
  const score = Math.max(0, Math.min(3, parts.filter((p) => p.weak).length * 2 + (parts.some((p) => p.level >= 2) ? 1 : 0) + (race === 'weak' ? 1 : race === 'resist' ? -1 : 0)))
  return { parts, race, raceNote: race ? rule!.note : '', score }
}

export function hitLine(name: string, preview: HitPreview): string {
  const parts = preview.parts.map((p) => `${p.label}（Lv${p.level}${p.weak ? '，她的死穴' : ''}）`).join('、')
  const weak = preview.parts.filter((p) => p.weak).map((p) => p.label)
  return `「${name}」主要碰：${parts || '全身'}。${weak.length ? `碰到${weak.join('、')}时才放开崩溃台词，第一次碰到要写出她防线断开的那一下。` : '没有碰到她的死穴，崩溃台词继续锁着。'}${preview.raceNote ? `种族：${preview.raceNote}。` : ''}`
}

// ---------- 提示词 ----------
export function trapPromptLine(trap: TrapLike): string {
  const sheet = trapSheet(trap)
  const status = statusById(trapStatusId(trap))?.title ?? ''
  return `〔${trapCategory(trap)}｜状态：${status}｜Lv${trap.level ?? 1}〕机制：${sheet.mechanic}。感官：${sheet.sense}。习性：${trapHabit(trap)}。禁止：${sheet.ban}。加码清单：${sheet.escalate.join('／')}。`
}

/** 快感推着阶段走：<40 触发，40–59 锁定，60–79 加码，80+ 高潮 */
export function phaseFromPleasure(pleasure: number): number {
  return pleasure >= 80 ? 3 : pleasure >= 60 ? 2 : pleasure >= 40 ? 1 : 0
}

export function phaseLine(name: string, phase: number, trap?: TrapLike): string {
  const p = Math.max(0, Math.min(PHASES.length - 1, phase))
  const habit = trap ? `按它的习性（${trapHabit(trap)}）来。` : ''
  return `【遭遇阶段】「${name}」当前阶段 ${p + 1}/${PHASES.length}「${PHASES[p]}」：${PHASE_RULES[p]}${habit}阶段和淫叫档冲突时以快感档为准；城主命令继续而她已经去过，就写过载和刺激的差别（麻木、痛痒、失禁），不重演同一个高潮。`
}

const ESCALATION_WORDS: [string, RegExp][] = [
  ['调亮/加强亮度', /亮度|更亮|调亮|炽白/], ['加快频率', /加快|更快|频率|节奏加/], ['往更深处', /更深|最深处|往里推|深处/],
  ['加大力道/收紧', /加大|更用力|力道|收紧|勒紧/], ['换部位', /转向|移到|换到|改去/], ['增加数量', /又一根|更多的|第二根|分叉|分出/],
  ['注入/灌入', /注入|灌进|灌满|喷进/], ['停住吊着', /停住|悬在|吊着|边缘|不许去/], ['电流', /电流|电压|电击/], ['温度变化', /灼热|冰冷|升温|发烫/],
  ['撑开扩张', /撑开|扩张|撑满/], ['旋转碾磨', /旋转|碾磨|研磨/],
]
export function escalationsIn(text: string): string[] {
  return ESCALATION_WORDS.filter(([, re]) => (text.match(new RegExp(re, 'g'))?.length ?? 0) >= 2).map(([label]) => label)
}
const NARR_STRIP = /[「“"][^」”"]*[」”"]|<!--[\s\S]*?-->|\[(?:OPTIONS|STATS|DESC|SCENE|PARTNER)[\s\S]*$/gi
/** 最近回合正文里反复出现的描写短语（4 到 8 字），合并重叠的片段，只取高频的 */
export function repeatedPhrases(recentAssistant: string[], limit = 6): string[] {
  const texts = recentAssistant.slice(-2).map((t) => t.replace(NARR_STRIP, '|'))
  const chunks = texts.flatMap((t) => t.split(/[\s，。、！？…—「」❤～！,.!?;；：:（）()|*]+/)).filter((c) => c.length >= 4)
  const count = (g: string) => chunks.reduce((n, c) => n + c.split(g).length - 1, 0)
  const found: { g: string; n: number }[] = []
  for (let len = 8; len >= 4; len--) {
    const seen = new Set<string>()
    for (const c of chunks) for (let i = 0; i + len <= c.length; i++) {
      const g = c.slice(i, i + len)
      if (seen.has(g)) continue
      seen.add(g)
      const n = count(g)
      if (n < 2) continue
      if (/^[的了着地得]/.test(g) || found.some((f) => f.g.includes(g) || g.includes(f.g))) continue
      found.push({ g, n })
    }
  }
  // 滑窗会切出互相重叠的片段（「里面那圈紧致肥焖」「面那圈紧致肥焖的」），能拼回原文的就拼成一条
  const merged: { g: string; n: number }[] = []
  for (const f of found.sort((a, b) => b.n - a.n || b.g.length - a.g.length)) {
    const hit = merged.find((m) => [3, 4, 5, 6, 7].some((k) => (m.g.endsWith(f.g.slice(0, k)) && chunks.some((c) => c.includes(m.g + f.g.slice(k)))) || (f.g.endsWith(m.g.slice(0, k)) && chunks.some((c) => c.includes(f.g + m.g.slice(k))))))
    if (!hit) { merged.push({ ...f }); continue }
    for (const k of [7, 6, 5, 4, 3]) {
      if (hit.g.endsWith(f.g.slice(0, k)) && chunks.some((c) => c.includes(hit.g + f.g.slice(k)))) { hit.g += f.g.slice(k); break }
      if (f.g.endsWith(hit.g.slice(0, k)) && chunks.some((c) => c.includes(f.g + hit.g.slice(k)))) { hit.g = f.g + hit.g.slice(k); break }
    }
  }
  return merged.slice(0, limit).map((f) => f.g)
}

/** 最近两回合反复用过的加码手段和描写短语；只拿高频的，避免把顺带一提的也禁掉 */
export function antiRepeatLine(recentAssistant: string[], escalate?: string[]): string {
  const used = [...new Set(recentAssistant.slice(-2).flatMap(escalationsIn))]
  const phrases = repeatedPhrases(recentAssistant)
  const parts: string[] = []
  if (used.length) parts.push(`【别重复加码】最近两回合已经反复用过：${used.join('、')}。这一回合换一种${escalate?.length ? `，可以从这里挑：${escalate.join('／')}` : ''}。同一个身体反应的句子不要再写一遍。`)
  if (phrases.length) parts.push(`【别重复描写】这些短语前面已经写过好几次：${phrases.map((p) => `「${p}」`).join('、')}。这一回合一次都不要用，换别的细节（声音、温度、姿势、她的念头），不要只换个近义词。`)
  parts.push(ORGAN_LINE_NOTE)
  return parts.join('\n')
}
export const ORGAN_LINE_NOTE = '【台词里的器官】部位写在正文里。她的台词大多说感受、求饶、逞强或冲城主说话，整回合最多两句台词直接说出器官的叫法，其余用「那里」「里面」或干脆不说。'

/** 每回合抽的质地词：按部位分组，每组抽一个，排除最近正文里已经用过的 */
export const TEXTURE_POOL: Record<BodyPart, string[][]> = {
  anus: [['粉嫩鲜红', '深褐泛粉', '熟透发紫', '褶纹细密', '肥嘟嘟地鼓起'], ['紧致肥焖', '外头软里头紧得发烫', '滚烫湿黏', '嫩肉咬人', '吸着不放'], ['一圈一圈地吞', '被撑成一个圆', '往外翻出一点嫩肉', '空着时还合不拢'], ['咕啾地吐气', '黏腻的吸啜声', '湿响']],
  vagina: [['肥厚无毛', '馒头肉屄', '粉嫩屄肉', '熟红肥嫩'], ['厚实宣软', '肥嫩多汁', '滑嫩', '外头软里头紧得发烫'], ['阴唇被扯开', '屄口一张一合', '嫩肉往外翻', '淫水拉丝'], ['咕啾的水声', '黏响', '啪嗒的拍打声']],
  clitoris: [['硕大红润', '肥硕饱满', '半截指节长短'], ['胀得发硬', '烫得发疼', '一碰就跳'], ['直挺挺地翘着', '从包皮里顶出来', '被吸得拉长']],
  breast: [['糯软肥奶', '沉甸甸', '雪滑', '厚重肥乳'], ['乳晕又大又肿', '奶头胀得发硬', '奶孔微张'], ['乳浪晃荡', '被勒得鼓出', '被吸得拉长']],
  urethra: [['又肥又嫩', '最是紧致'], ['一缩就漏', '烫得发麻']],
}
export function textureSample(parts: BodyPart[], recentAssistant: string[], seed: number): string {
  const recent = recentAssistant.join('')
  const rows = [...new Set(parts)].map((part) => {
    const picks = TEXTURE_POOL[part].map((group, i) => {
      const fresh = group.filter((w) => !recent.includes(w))
      const list = fresh.length ? fresh : group
      return list[Math.abs(seed * 7 + i * 13 + part.length) % list.length]
    })
    return `${PART_LABEL[part]}：${picks.join('、')}`
  })
  return rows.length ? `【本回合质地词】每个最多用一次，用完就换动作和感官写：${rows.join('；')}。` : ''
}

export interface RelayItem { name: string; kind: 'trap' | 'monster'; parts?: BodyPart[] }
/** 城主命令的那件做主动作；其他件各写至少两句，碰不同的部位。primary 缺省时取第一件。 */
export function relayLine(order: RelayItem[], comboNames: string[], primaryName?: string): string {
  if (order.length < 2) return ''
  const main = order.find((o) => o.name === primaryName) ?? order[0]
  const taken = new Set(main.parts ?? [])
  const support = order.filter((o) => o !== main).map((o) => {
    const own = (o.parts ?? []).filter((p) => !taken.has(p))
    const part = own[0] ?? (['breast', 'clitoris', 'vagina', 'anus'] as BodyPart[]).find((p) => !taken.has(p))
    if (part) taken.add(part)
    return { ...o, part }
  })
  const steps = support.map((o) => `「${o.name}」至少两句自己的动作${o.part ? `，碰${PART_LABEL[o.part]}（和主装置不同的部位）` : ''}`).join('；')
  return `【接力顺序】${comboNames.length ? `连携「${comboNames.join('、')}」。` : ''}城主这回合命令的「${main.name}」做主动作，占正文一半以上。同层已布置的${steps}，时机放在主动作的间隙：开场替主装置把她摆好，或者在她快到时插一手。即使城主只命令了其中一件，其余的也要点名出场；辅装置不抢主动作，也不能整回合缺席，不要合成一团。【城主的选项】四条里至少一条是换用「${support[0].name}」做主动作（或两件一起上）。`
}

export function groupIcon(category: string): string {
  const group = trapGroup(category)
  return group === TRAP_GROUPS[0].label ? '🐙' : group === TRAP_GROUPS[1].label ? '⛓' : '🌀'
}
