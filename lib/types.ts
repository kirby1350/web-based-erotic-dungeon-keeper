import { CANON_INTRUDERS } from '@/lib/canon-intruders'
export type Race = 'human' | 'elf' | 'tauren' | 'fox' | 'cat' | 'machine' | 'dragon' | 'succubus'

export interface CharacterMeasurements {
  bust: string
  waist: string
  hip: string
}

export type BodyPart = 'breast' | 'clitoris' | 'urethra' | 'vagina' | 'anus'

export interface BodyDevelopment {
  breast: number
  clitoris: number
  urethra: number
  vagina: number
  anus: number
  // exp per part 0-100; the program adds it and promotes a level every 100 (capped at 5)
  exp?: Partial<Record<BodyPart, number>>
  descriptions?: Partial<Record<BodyPart, string>>
}

export interface StatusEffect {
  id: string
  title: string
  description: string
}

// Current trap/monster the character is locked into. null = free to explore.
export interface Encounter {
  // stable kebab/underscore id, reused across turns while the encounter persists
  id: string
  // short display name, e.g. 触手深渊 / 半兽人巢穴
  name: string
  kind: 'trap' | 'monster'
  // one-line description of the current restraint/threat
  summary: string
  // restraint while trapped is 1-3 (3 = completely bound). 0 means the hold has ended.
  restraint: number
}

export interface Character {
  name: string
  race: Race
  measurements: CharacterMeasurements
  backstory: string
  costumeDescription: string
  otherDescription: string
  // 外貌：身高、头发、角、尾、气味、胸口和腰。不含服装。旧档可以没有。
  appearance?: string
  // 对外的习惯，以及一处会露馅的地方。进来的原因仍写在 backstory。
  personality?: string
  // 四行：自称、称呼、语气、招牌台词。崩溃台词不写在这里。
  speech?: string
  // 先受不了的碰法、高潮时的固定反应、死穴被按住之后做什么。
  sexual?: string
  // 死穴被碰到或快感升高之后才可出现的样本。
  collapseLine?: string
  // base danbooru appearance tags, injected into every image prompt for consistency
  danbooruTags?: string
  avatarUrl: string | null
  hp: number
  maxHp: number
  pleasure: number
  desire: number
  bodyDevelopment: BodyDevelopment
  statusEffects: StatusEffect[]
  // current dungeon floor (depth); starts at 1
  floor?: number
  // per-floor theme names rolled at creation (index 0 = floor 1 … TARGET_FLOOR-1 = floor 10)
  floorThemes?: string[]
  // current trap/monster encounter, or null when free
  encounter?: Encounter | null
  // exploration progress of the CURRENT floor, 0-100; must hit 100 to descend, resets on floor change
  explorationProgress?: number
  // marks left when a broken captive is thrown back to the city
  brands?: string[]
  // 称呼：命令 / 锁定 / 淫纹 / 堕落积累（见 lib/terms.ts）
  terms?: import('@/lib/terms').TermsState
  // 已结算回合数，淫纹按它计时
  turnCount?: number
}

// exploration progress gained per action toward unlocking the next floor
export const EXPLORE_GAIN = 20 // one "探索" action
export const ENCOUNTER_CLEAR_GAIN = 40 // escaping a trap or being played-to-broken (encounter resolved)
export const EXPLORE_ENCOUNTER_CHANCE = 0.4 // each explore step, while free, may spring a preset trap

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  turnId?: string
}

export interface GeneratedImage {
  id: string
  url: string
  prompt: string
  timestamp: number
}

export type ImageStyle = 'none' | 'dk.senie' | 'hakai_shin' | 'shiokonbu' | 'piromizu' | 'nohito' | 'masami_chie' | 'thirty_8ght'
export type ImageModel = 'tsubaki_v2'

export type ImageProvider = 'pixai' | 'tensorart'

export type TensorArtModel = 'wai_nsfw_v16' | 'jankuv6'

/** How scene tags are wrapped before they reach an image backend. */
export type ImagePromptFamily = 'illustrious' | 'sdxl' | 'flux'

// Optional extra tag group appended to every image prompt
export type ImageTagPreset = 'none' | 'curvy'

// 叙事文风（与常驻的「去油」文风禁令叠加，可切换密度/风格）
export type ProseStyle = 'standard' | 'dense'

export const PROSE_STYLE_LABELS: Record<ProseStyle, { label: string; hint: string }> = {
  standard: { label: '标准', hint: '均衡叙事，仅常驻去油约束' },
  dense: { label: '重油堆叠', hint: '写到乳、奶头、阴蒂、阴道、尿道或肛门时必须使用词库原词。转场套话仍然禁止' },
}

export interface AppSettings {
  chatModel: string
  imageModel: ImageModel
  imageStyle: ImageStyle
  imageStyleCustom: string
  imageTagPreset: ImageTagPreset
  proseStyle: ProseStyle
  /** 测试用作弊模式，默认关闭 */
  cheatMode?: boolean
  imageProvider: ImageProvider
  tensorartModel: TensorArtModel
  chatApiKey: string
  grokApiKey: string
  pixaiApiKey: string
  tensorartApiKey: string
}

export const IMAGE_MODELS: Record<ImageModel, { label: string; modelId: string; family: ImagePromptFamily }> = {
  tsubaki_v2: {
    label: 'Tsubaki v2',
    modelId: '1983308862240288769',
    family: 'illustrious',
  },
}

export const IMAGE_STYLES: Record<ImageStyle, { label: string; tags: string }> = {
  none: { label: '无', tags: '' },
  'dk.senie': {
    label: 'dk.senie',
    tags: 'dk.senie, watercolor, soft lineart, pastel colors, dreamy lighting',
  },
  hakai_shin: {
    label: 'Hakai Shin',
    tags: 'hakai_shin, detailed shading, dynamic pose, vibrant colors, anime illustration',
  },
  shiokonbu: {
    label: 'shiokonbu',
    tags: 'shiokonbu, detailed lineart, soft shading, moe style, clean illustration',
  },
  piromizu: {
    label: 'piromizu',
    tags: 'piromizu, glossy skin, detailed body, soft gradient, erotic illustration',
  },
  nohito: {
    label: 'nohito',
    tags: 'nohito, expressive face, fine details, dramatic lighting, anime art style',
  },
  masami_chie: {
    label: 'masami chie',
    tags: 'masami chie, soft lineart, delicate shading, warm palette, detailed illustration',
  },
  thirty_8ght: {
    label: 'thirty_8ght',
    tags: 'thirty_8ght, glossy skin, detailed shading, thick thighs, erotic illustration',
  },
}

// Extra danbooru tag groups the player can toggle on top of the scene prompt.
export const IMAGE_TAG_PRESETS: Record<ImageTagPreset, { label: string; tags: string }> = {
  none: { label: '无', tags: '' },
  curvy: {
    label: '丰乳肥臀',
    tags: 'curvy, huge breasts, huge nipples, huge areolae, large clitoris, clitoris, fat mons, lactation, female ejaculation',
  },
}

export const TENSORART_MODELS: Record<TensorArtModel, { label: string; modelId: string; family: ImagePromptFamily }> = {
  wai_nsfw_v16: {
    label: 'WAI-NSFW-V16',
    modelId: '943946051788787917',
    family: 'illustrious',
  },
  jankuv6: {
    label: 'JANKUV6',
    modelId: '934122074308367585',
    family: 'illustrious',
  },
}

// One model entry returned by the DZMM v2 models endpoint
export interface DzmmModel {
  id: string
  name: string
  context_window: number
}

export type ChatModelInfo = { value: string; label: string; group: string; provider: 'default' | 'grok' }

export const CHAT_MODELS: ChatModelInfo[] = [
  { value: 'x-apex-surge-0505-16k', label: 'Apex Surge 16K', group: 'DZMM', provider: 'default' },
  // Max 系列 - 旗舰 ($0.0004/1K tokens)
  { value: 'nalang-max-0826-10k', label: 'Nalang Max 10K', group: 'Max 旗舰系列', provider: 'default' },
  { value: 'nalang-max-0826-16k', label: 'Nalang Max 16K（推荐）', group: 'Max 旗舰系列', provider: 'default' },
  { value: 'nalang-max-0826', label: 'Nalang Max 32K', group: 'Max 旗舰系列', provider: 'default' },
  // XL 系列 ($0.0003/1K tokens)
  { value: 'nalang-xl-0826-10k', label: 'Nalang XL 10K', group: 'XL 大模型系列', provider: 'default' },
  { value: 'nalang-xl-0826-16k', label: 'Nalang XL 16K（推荐）', group: 'XL 大模型系列', provider: 'default' },
  { value: 'nalang-xl-0826', label: 'Nalang XL 32K', group: 'XL 大模型系列', provider: 'default' },
  // Medium 系列 ($0.0002/1K tokens)
  { value: 'nalang-medium-0826', label: 'Nalang Medium 32K', group: 'Medium 性价比系列', provider: 'default' },
  // Turbo 系列 ($0.0001/1K tokens)
  { value: 'nalang-turbo-0826', label: 'Nalang Turbo 32K（推荐）', group: 'Turbo 快速系列', provider: 'default' },
  // 额外
  { value: 'x-apex-neo-16k', label: 'Neo-0213 16K', group: '其他', provider: 'default' },
  // Grok 系列
  { value: 'grok-4.7', label: 'Grok 4.7', group: 'Grok (xAI)', provider: 'grok' },
  { value: 'grok-4.3', label: 'Grok 4.3', group: 'Grok (xAI)', provider: 'grok' },
  { value: 'grok-4-latest', label: 'Grok 4 Latest', group: 'Grok (xAI)', provider: 'grok' },
  { value: 'grok-3', label: 'Grok 3', group: 'Grok (xAI)', provider: 'grok' },
  { value: 'grok-3-mini', label: 'Grok 3 Mini', group: 'Grok (xAI)', provider: 'grok' },
]

// description: 城主界面上的短句；trait: 注入叙述提示，写这名闯入者的种族反应
export const RACE_INFO: Record<Race, { label: string; description: string; trait: string }> = {
  human: {
    label: '人族',
    description: '均衡耐受、理智坚韧——堕落来得慢，可一旦崩坏便再难回头。',
    trait: '均衡耐受、理智较顽强：快感与欲望上涨速度正常，崩坏来得更晚却也更彻底。抵抗类描写应多一分内心挣扎与不甘；一旦防线被攻破，前后反差的堕落格外强烈。',
  },
  elf: {
    label: '精灵族',
    description: '魔法亲和、肌肤敏感——媚药与淫纹等魔法陷阱对她效果加倍，越高傲越易被玷染。',
    trait: '魔法亲和、肌肤极度敏感：媚药、花粉、淫纹、催眠、魅魔等「魔法/精神系」陷阱对她效果翻倍，身体开发更快、更易高潮失禁；但高傲长寿令她被玷污时的羞耻与屈辱感格外浓烈。',
  },
  tauren: {
    label: '牛人族',
    description: '体魄强健、血脉旺盛——寻常束缚难困，可一旦发情便如野兽般疯狂，天生易泌乳。',
    trait: '体魄强健、萨满血脉旺盛：HP 与物理耐受高，寻常束缚更难困住她；却因发情血脉而欲望一旦点燃便如野兽般疯狂。天生巨乳易泌乳，适合大量产乳、孕感、被强健怪物压制征服的描写。',
  },
  fox: {
    label: '狐族',
    description: '媚惑亲和、生性淫荡——耳尾极度敏感，越是被抚弄越会主动发情，天生适合媚态求欢。',
    trait: '妖狐血脉、媚惑亲和：耳朵与尾巴是最大的敏感带，被抚摸揉捏便浑身酥软、理智融化。天生的发情体质令欲望上涨极快、极易泌淫水与潮吹，且越是高潮越会本能地摇尾迎合、主动献媚求欢。适合媚态调教、发情失禁、被养成媚狐宠物的描写。',
  },
  cat: {
    label: '猫族',
    description: '傲娇难驯、体质敏感——发情期一到便撒娇求欢，被摸到弱点便瞬间瘫软发出猫叫。',
    trait: '猫又血脉、傲娇难驯：平日高傲不肯服软，可耳后、尾根、下腹一被触碰便瞬间瘫软、喉间漏出猫叫。发情期身体格外燥热敏感、会不自觉地翘臀磨蹭求欢，被彻底攻陷后会像发情母猫般主动索求。适合傲娇反差、撒娇发情、被驯化成粘人母猫的描写。',
  },
  machine: {
    label: '机械族',
    description: '痛感转快感、可被改造——身体像器械般任人拆解校准，强制高潮如同例行维护。',
    trait: '人造机械之躯、痛觉回路错乱为快感：身体可被当作器械般拆解、加装、改造，敏感部位能被「校准」到不断升高。缺乏常人的羞耻阈值却有被格式化、被写入淫乱指令的恐惧，强制连续高潮对她如同例行「维护/充能」。适合机械改造、催眠调校、被当作性爱器械反复使用的描写。',
  },
  dragon: {
    label: '龙族',
    description: '高傲强韧、龙血滚烫——坚硬鳞甲寻常难破，可龙焰一旦被点燃，越是骄矜越沉沦。',
    trait: '巨龙血脉、高傲强韧：HP 与耐受极高，坚硬的鳞甲令寻常束缚与攻击难以奏效，睥睨众生的骄矜也令她被玷污时的屈辱与不甘格外浓烈；然而体内翻涌的龙焰（或寒霜之力）一旦被点燃，便会由内而外灼烧、瓦解她的理智，发情时龙角泛热、龙尾无措地摆动、下体滚烫泥泞，越是逞强便败得越彻底。适合高傲堕落、龙血发情、骄龙被驯服俯首、产卵孕育的描写。',
  },
  succubus: {
    label: '魅魔族',
    description: '天生淫体、以欲为食——媚惑是她的本能与力量，却也最易反被快感反噬吞没。',
    trait: '魅魔血脉、天生淫体：以性与欲望为食，媚惑本能与魔力与生俱来，肌肤、尾巴、翅膜与魔角皆是敏感带，欲望上涨极快、极易发情高潮且愈战愈勇。她惯于以色诱掌控猎物，可一旦被更强者压制、被自己引燃的快感反噬，便会从掠食者沦为被喂养、被反向榨取的雌性，落差极大。适合魅魔反被调教、以淫为食却被喂到坏掉、榨精与被榨、主动献身求欢的描写。',
  },
}

// ---------------------------------------------------------------------------
// 地下城层数与每层风貌
// ---------------------------------------------------------------------------

export const TARGET_FLOOR = 10

export interface FloorTheme {
  name: string
  // 给 DM 的环境/危险氛围描述
  ambience: string
  // 该层基调的 danbooru 场景标签（供 DM 写 [SCENE] 时融入）
  scene: string
}

// 普通楼层（1~9 层）的生物群系池，开局随机洗牌抽取
export const FLOOR_THEMES: FloorTheme[] = [
  { name: '潮湿苔窟', ambience: '幽暗滴水的苔藓洞窟，地面湿滑、空气黏腻，墙缝里蠕动着不明触须', scene: 'cave, moss, wet, dripping water, dim lighting, underground' },
  { name: '触手深渊', ambience: '布满搏动触手的巢穴，无数触须从穹顶与裂缝垂落、伺机缠绕猎物', scene: 'tentacles, cave, slime, dark, pulsating, underground' },
  { name: '催情花园', ambience: '盛开着巨大食人花的地下花园，浓密花粉与花蜜令人理智迷醉', scene: 'plant, giant flower, pollen, vines, flower field, petals' },
  { name: '史莱姆沼泽', ambience: '半透明史莱姆铺满的沼泽，黏液没膝、不断渗入衣物与孔穴', scene: 'slime, swamp, transparent, goo, bubbles, underground' },
  { name: '魅魔回廊', ambience: '镶满古镜的回廊，镜中魅魔以幻象与催眠话语诱人堕落', scene: 'mirror, corridor, succubus, illusion, magic circle, candles' },
  { name: '寄生蚁道', ambience: '虫卵密布的寄生虫蚁道，蠕虫钻动、潮热腥膻', scene: 'insect, eggs, tunnel, parasite, organic, slimy' },
  { name: '古代刑具遗迹', ambience: '锈蚀机械与拘束装置的遗迹，金属刑具自动启动、强制固定猎物', scene: 'ancient ruins, machinery, restraints, metal, gears, stone' },
  { name: '血肉迷宫', ambience: '由活体血肉构成的迷宫，墙壁起伏蠕动、淌着黏液与体温', scene: 'flesh, organic walls, biolab, veins, pulsating, red' },
  { name: '淫纹祭坛', ambience: '刻满发烫淫纹的祭坛，魔力将身体强制摆成屈辱姿势', scene: 'altar, glowing runes, magic circle, ritual, purple glow' },
  { name: '媚药温泉', ambience: '雾气蒸腾的地底媚药温泉，温热泉水浸透全身、敏感度暴涨', scene: 'hot spring, steam, water, cave, aphrodisiac, wet' },
  { name: '蛛网囚牢', ambience: '巨蛛盘踞的丝网囚牢，黏丝层层捆缚、动弹不得', scene: 'spider web, bondage, silk, cocoon, dark, restrained' },
  { name: '梦魇卧房', ambience: '诡异奢靡的梦魇卧房，催眠香氛令人分不清现实与春梦', scene: 'bedroom, canopy bed, incense, hypnosis, luxurious, dim' },
  { name: '荧光菌穴', ambience: '巨大发光蘑菇丛生的菌穴，弹出的孢子云催情致幻、菌伞会喷射黏稠汁液', scene: 'mushroom, glowing spores, bioluminescent, fungus, cave, purple glow' },
  { name: '冰晶囚牢', ambience: '寒气逼人的冰晶洞窟，冰棱自动生长封住四肢，低温令肌肤与乳尖异常敏感', scene: 'ice cave, crystal, frozen, cold, blue glow, icicles' },
  { name: '熔岩魔窟', ambience: '灼热蒸腾的熔岩魔窟，热浪逼出满身香汗、令人喘息脱力、理智被高温融化', scene: 'lava, magma, volcanic cave, heat haze, red glow, ember' },
  { name: '魔导实验室', ambience: '魔法与机械交织的地底实验室，电流线圈与探针装置对身体进行强制敏感化改造', scene: 'laboratory, machinery, electricity, wires, magic device, sci-fi' },
  { name: '沉溺水牢', ambience: '半淹没的地底水牢，浮力使身体失衡、水中触手与气泡不断钻探每一处孔穴', scene: 'underwater, flooded dungeon, water, bubbles, submerged, blue' },
  { name: '活体书库', ambience: '禁忌魔导书堆积如山的书库，活体魔法书吐出墨色触须与咒文将读者拖入淫欲', scene: 'library, bookshelf, magic tome, ink tentacles, candlelight, dark' },
  { name: '骸骨墓穴', ambience: '亡灵盘踞的森冷墓穴，冰凉的骸骨之手自石棺与地面伸出、执拗地爱抚与束缚', scene: 'catacombs, bones, skeleton, undead, tomb, torchlight' },
  { name: '流沙地宫', ambience: '被黄沙半掩的古代地宫，缓缓下陷的流沙将身体一寸寸吞没、越挣扎陷得越深', scene: 'desert ruins, quicksand, sand, sandstone, dry, ancient' },
  { name: '傀儡剧场', ambience: '帷幕低垂的地底剧场，无数丝线自暗处垂下、操控四肢摆出淫靡姿势供无形观众观赏', scene: 'theater stage, puppet strings, marionette, curtains, spotlight, dim' },
  { name: '淫兽竞技场', ambience: '环形石造竞技场，猎物被推入场中，四周虚影观众的欢呼中被魔兽当众凌辱', scene: 'arena, colosseum, stone, crowd silhouette, public, torchlight' },
]

// 第 10 层固定为城主王座（城主本人所在的最深层）
export const BOSS_FLOOR_THEME: FloorTheme = {
  name: '城主王座·淫狱核心',
  ambience: '地下城最深处的血肉王座，城主本人坐镇于此，被押到这里的闯入者再无退路',
  scene: 'throne, dark fantasy, ominous, magic, grand hall, flesh walls',
}

// 开局为 1~TARGET_FLOOR 层各抽一个风貌名；第 TARGET_FLOOR 层固定为魔王核心
export function rollFloorThemes(): string[] {
  const pool = [...FLOOR_THEMES]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  const names: string[] = []
  for (let f = 1; f <= TARGET_FLOOR; f++) {
    names.push(f >= TARGET_FLOOR ? BOSS_FLOOR_THEME.name : pool[(f - 1) % pool.length].name)
  }
  return names
}

// 取某层的风貌，兼容缺少 floorThemes 的旧存档（按层数确定性回退）
export function getFloorTheme(floorThemes: string[] | undefined, floor: number): FloorTheme {
  if (floor >= TARGET_FLOOR) return BOSS_FLOOR_THEME
  const name = floorThemes?.[floor - 1]
  const found = name ? FLOOR_THEMES.find((t) => t.name === name) : undefined
  return found ?? FLOOR_THEMES[(Math.max(1, floor) - 1) % FLOOR_THEMES.length]
}

export interface CharacterPreset {
  name: string
  race: Race
  measurements: CharacterMeasurements
  backstory: string
  costumeDescription: string
  otherDescription: string
  appearance?: string
  personality?: string
  speech?: string
  sexual?: string
  collapseLine?: string
  danbooruTags?: string
  avatarUrl?: string
  source?: string
}

// Persisted adventure session (chat history + rolling summary)
export interface GameSession {
  messages: ChatMessage[]
  summary: string
  memory?: import('@/lib/adventure-memory').AdventureMemory
  pendingTurn?: import('@/lib/turn-engine').PendingTurn | null
  turns?: import('@/lib/turn-engine').TurnRecord[]
  recentBank?: string[]
}

// Corridor catalog. The workshop and the gate stock these. The in-scene wrench uses INTERROGATION_METHODS.
export interface PresetTrap {
  id: string
  name: string
  category: string
  // short directive describing the trap type, injected into the generator prompt
  hint: string
}

/** 预设陷阱的类别很碎（一件一类），工房里并成几组来筛 */
export const TRAP_GROUPS: { label: string; categories: string[] }[] = [
  { label: '触手·生物', categories: ['触手系', '粘液系', '虫群系', '寄生/产卵', '怪物巢穴', '兽奸系', '催情植物'] },
  { label: '拘束·机械', categories: ['拘束系', '魔法拘束', '机械', '电击系', '榨取系'] },
  { label: '精神·魔法', categories: ['催眠幻觉', '操控系', '诅咒系', '药物系', '特殊系'] },
]
export function trapGroup(category: string): string {
  return TRAP_GROUPS.find((g) => g.categories.includes(category))?.label ?? '其他'
}

export const PRESET_TRAPS: PresetTrap[] = [
  {
    id: 'tentacle_pit',
    name: '触手深渊',
    category: '触手系',
    hint: '异形触手从地面、墙壁与天花板同时涌出，缠绕四肢并强制贯穿各个孔穴、注入黏滑体液',
  },
  {
    id: 'slime_swallow',
    name: '史莱姆吞噬',
    category: '粘液系',
    hint: '半透明史莱姆将全身包裹溶解衣物，粘液渗入每一寸肌肤与孔穴，持续震动摩擦敏感部位',
  },
  {
    id: 'pollen_garden',
    name: '催情花园',
    category: '催情植物',
    hint: '大片催情花朵喷出浓密花粉与花蜜，藤蔓束缚身体，花粉令理智迅速瓦解、身体极度敏感',
  },
  {
    id: 'lewd_rune',
    name: '淫纹拘束',
    category: '魔法拘束',
    hint: '地面浮现魔法淫纹，无形力量将身体固定成屈辱姿势，淫纹持续发烫、强制提升欲望与快感',
  },
  {
    id: 'succubus_mirror',
    name: '魅魔之镜',
    category: '催眠幻觉',
    hint: '古镜中浮现魅魔，以催眠话语支配意识，制造无法分辨真假的极淫幻觉并诱导主动堕落',
  },
  {
    id: 'parasite_egg',
    name: '寄生产卵',
    category: '寄生/产卵',
    hint: '寄生型生物钻入体内，向子宫与肠道注入大量卵，腹部隆起、被迫感受异物蠕动与产卵快感',
  },
  {
    id: 'ancient_machine',
    name: '远古拘束装置',
    category: '机械',
    hint: '遗迹中的机械装置自动启动，金属拘束具固定四肢，机械触手与按摩棒按程序持续强制高潮',
  },
  {
    id: 'orc_nest',
    name: '半兽人巢穴',
    category: '怪物巢穴',
    hint: '误入半兽人巢穴，被成群粗壮的半兽人按住轮流侵犯，浓厚精液灌满每一个孔穴',
  },
  {
    id: 'shock_chamber',
    name: '电击刑房',
    category: '电击系',
    hint: '金属电极夹住乳尖与阴蒂，随程序释放由弱渐强的电流，每一次刺激都强制引发痉挛与失禁高潮',
  },
  {
    id: 'milking_rig',
    name: '榨乳机关',
    category: '榨取系',
    hint: '固定装置吸附住双乳与下体，吸乳罩与按摩头持续抽吸震动，被迫不停泌乳、潮吹直至脱力',
  },
  {
    id: 'insect_swarm',
    name: '虫群爬袭',
    category: '虫群系',
    hint: '成群细小魔虫爬满全身，钻入衣物缝隙舔舐爱抚每一寸敏感肌肤，细密的蠕动令人酥麻难耐',
  },
  {
    id: 'puppet_strings',
    name: '傀儡丝线',
    category: '操控系',
    hint: '无形魔法丝线缠上四肢与指节，操控身体违背意志地摆出淫态、被迫当众自慰与献媚',
  },
  {
    id: 'aphro_infusion',
    name: '媚药灌注',
    category: '药物系',
    hint: '机关强制灌入大量媚药，从口中与孔穴同时注入，敏感度与欲望急速飙升、身体不受控制地渴求',
  },
  {
    id: 'demon_contract',
    name: '淫魔契约',
    category: '诅咒系',
    hint: '被诱骗签下淫魔契约，身体被烙上淫纹并逐步改造，敏感部位被强化、意志一点点被欲望侵蚀',
  },
  {
    id: 'suspension_bondage',
    name: '悬吊绳缚',
    category: '拘束系',
    hint: '绳索将身体捆成屈辱姿势并吊离地面，绳结恰好勒住私处，绑定的跳蛋与按摩棒持续折磨',
  },
  {
    id: 'time_stop',
    name: '时停凌辱',
    category: '特殊系',
    hint: '时间被魔法冻结，身体僵在原地无法动弹也无法反抗，只能清醒地感受被从容玩弄的每一下',
  },
  {
    id: 'beast_taming',
    name: '兽奸调教',
    category: '兽奸系',
    hint: '被魔兽当作发情对象压制，粗野的舔舐与交配将猎物一步步驯化成只会承欢的雌性',
  },
]

/** In-scene methods the keeper applies by hand. These are not corridor traps and are not stocked. */
export interface InterrogationMethod {
  id: string
  name: string
  hint: string
}

export const INTERROGATION_METHODS: InterrogationMethod[] = [
  { id: 'rope', name: '绳缚', hint: '用绳把她固定成还能呼吸、但挣不开的姿势，绳路压在已经敏感的地方。' },
  { id: 'tool', name: '器具', hint: '按她现在的开发度选一件器具，不要一上来就用最重的。' },
  { id: 'mouth', name: '口舌', hint: '只用嘴和舌头，不插进去，逼她用声音回答。' },
  { id: 'frame', name: '固定架', hint: '把她锁在架子或栏杆上，手脚分开，城主可以换着碰。' },
  { id: 'sense', name: '感官剥夺', hint: '蒙眼、塞耳或堵住嘴里的一种，让她只能靠身体判断下一手。' },
  { id: 'words', name: '言语逼问', hint: '先不加重身体，用她不愿承认的话问。手可以只按着。' },
  { id: 'fingers', name: '指技', hint: '只用手指，在已经敏感的部位上慢慢加，不换器具。' },
  { id: 'edge', name: '边缘', hint: '把她推到高潮前面就停，反复几次，逼她自己求。' },
  { id: 'display', name: '展示', hint: '把她摆成能被看清的姿势，让她看见自己的反应。城主可以只看。' },
  { id: 'sting', name: '痛与快', hint: '痛和快感交替。痛只作为把快感逼出来的一下，不写致残，不写见骨。' },
]

// Preset 异常状态 the player can manually apply; these feed straight into
// the system prompt's 异常状态 line and steer narration/options.
export const PRESET_STATUS_EFFECTS: StatusEffect[] = [
  { id: 'estrus', title: '发情', description: '身体进入发情期，主动扭腰求欢，骚穴不断流水' },
  { id: 'aphrodisiac', title: '媚药中毒', description: '全身敏感度暴涨，轻微触碰即引发强烈快感，理智逐渐瓦解' },
  { id: 'bondage', title: '拘束', description: '四肢被缚无法自由行动，只能任人摆布' },
  { id: 'hypnosis', title: '催眠', description: '意识被支配，会无意识地服从命令' },
  { id: 'lewd_brand', title: '淫纹', description: '身上浮现发烫的淫纹，持续提升欲望并削弱抵抗' },
  { id: 'lactation', title: '泌乳', description: '乳房胀大不断分泌乳汁，乳头极度敏感' },
  { id: 'broken', title: '绝顶崩坏', description: '连续高潮导致理智崩坏，翻白眼吐舌、露出失神痴态，无法正常思考' },
  { id: 'pregnancy_heat', title: '渴孕', description: '子宫深处传来灼热的受孕渴望，主动迎合内射' },
]

// 闯入者角色库。城主不扮演她们，只决定怎么处置闯进来的人。
// 口癖是平时怎么说话。崩溃台词单独锁着，死穴被碰到或快感升高之后才用。
export const CHARACTER_PRESETS: CharacterPreset[] = [
  {
    name: '娜露梅亚',
    race: 'tauren',
    avatarUrl: '/avatars/narmaya.png',
    measurements: { bust: '90', waist: '58', hip: '88' },
    danbooruTags: 'narmaya_(granblue_fantasy), granblue_fantasy, 1girl, draph, horns, pink hair, very long hair, hair over one eye, braid, light blue eyes, large breasts, short stature, black bodysuit',
    backstory: '二十四岁的德拉夫剑豪。她听说地下城里关着走失的孩子，放心不下，自己提着刀走了进来。',
    appearance: '樱粉长发长到大腿，单边遮眼，编着细辫，水蓝眼睛，头上一对德拉夫的大角。身高一百三十四厘米，娇小，乳房却沉甸甸的，乳晕下总渗着奶香。',
    personality: '爱照顾人的大姐姐，把年纪小的都当成要宠的孩子，宠过头了就躲起来一个人开反省会。内里自卑，渴望被认可，被夸就会乱掉。剑术是天才级，冥想会睡着。',
    speech: `自称：姐姐（认真时说「我」）
称呼：把城主叫做「你」，动心后叫「你酱」
语气：温柔宠溺，句尾放软，带「嗯嗯」「好乖好乖」
招牌台词：「姐姐会好好照顾你的哦。」「……一个人反省会，开始。」`,
    costumeDescription: '黑色紧身战衣把沉甸甸的乳房勒到几乎溢出，胸口被奶水洇出两块深色。腰带陷进腰肉，短裤下大腿绑带嵌进肉里。腰间挂着两把刀。',
    sexual: '宠人的姐姐是引子：她最受不了被反过来宠着挤奶，一边被挤一边被夸「好姐姐」。被肯定加上被挤奶，奶水和淫水会一起涌出来，泌乳着高潮。她泌乳，但只在被挤、被吸或高潮时出奶，开场不主动送奶。高潮时腰自己往前送，话只剩半句。',
    otherDescription: '抵抗时声音仍温柔，像哄孩子一样劝城主住手，用步法和双刀拉开距离，不先求饶。',
    collapseLine: '「姐姐……姐姐被你宠坏了啦……再夸姐姐一次好不好……」',
  },
  {
    name: '一之濑志希',
    race: 'human',
    avatarUrl: '/avatars/ichinose-shiki.png',
    measurements: { bust: '85', waist: '57', hip: '84' },
    danbooruTags: 'ichinose_shiki, idolmaster_cinderella_girls, 1girl, short hair, purple hair, gradient hair, purple eyes, multiple ear piercings, medium breasts, white jacket, plaid skirt',
    backstory: '十八岁的化学天才兼偶像，兴趣是「失踪」。她说是闻到地下城里有很好闻的味道才跳进来的，把这里当成可以取样的实验场。她会看陷阱的结构、偷改药剂，也可能把春药抹到魔物或机关上。开场她在记数据。',
    appearance: '短发从深紫渐到浅，紫眼，左耳有好几只耳钉。举止像猫，爱凑到人身边嗅。胸是中等，腰细。头发上有她自己调的香水味。',
    personality: '任性、跳脱，像猫一样随心所欲，嘴上像在做实验，把别人的反应当数据。嗅觉极灵，爱闻人的味道。真被弄到站不稳时，记录会断。',
    speech: `自称：我，兴奋时说「志希酱」
称呼：把城主叫做「你」，带着「你你～」的叠音
语气：轻快，跳跃，句尾～，笑声「喵哈哈～」，常凑近「嗅嗅」
招牌台词：「你身上的味道很好闻嘛～一定是好人！」「喵哈哈～这个反应值得记一笔！」`,
    costumeDescription: '白色短夹克里只有两条黑肩带，遮不住乳尖。超短格纹裙下真空，黑色过膝袜勒进大腿。',
    sexual: '嗅觉控是引子：她最受不了闻雄性体味。凑到颈窝、腋下深嗅几口就发情，腿就软，小穴自己湿。自己调的春药会反噬，越闻越停不下来。高潮时还把脸埋在人身上嗅，记录用的句子说不完。',
    otherDescription: '抵抗时她笑着问剂量和结构，不肯先求饶。',
    collapseLine: '「试试看吧～似乎很有趣呢」',
  },
  {
    name: '桑山千雪',
    race: 'human',
    avatarUrl: '/avatars/kuwayama-chiyuki.png',
    measurements: { bust: '93', waist: '61', hip: '90' },
    danbooruTags: 'kuwayama_chiyuki, idolmaster_shiny_colors, 1girl, long hair, wavy hair, light brown hair, braid, single braid, hair over shoulder, brown eyes, large breasts, cream sweater',
    backstory: '二十三岁的偶像，杂货屋店员出身，随身带针线包。她在古董杂货铺翻到一只会唱歌的八音盒，打开就被卷了进来。',
    appearance: '褐色长发编成一条麻花辫搭在肩上，有淡奶香，褐色眼睛。胸偏大，腰细。颈间挂着自己做的小布艺挂饰。',
    personality: '组合里的大姐姐，习惯把更慌的人护在身后，说话轻、先道歉，手很巧，爱做手工。护人是外壳。一针一线被打乱时，她自己会先乱。',
    speech: `自称：我
称呼：用「您」叫城主
语气：温柔敬语，像哄妹妹，偶尔露出少女心
招牌台词：「您的扣子快掉了呢，我帮您缝一下吧？」「作为姐姐，得更可靠一点才行……」`,
    costumeDescription: '奶油色毛衣领口很低，乳沟和半露的乳晕挡不住，乳尖一挺就顶出布料。米白长裙下是开裆的内裤。',
    sexual: '手作和母性是引子：她最受不了被吮乳的母性快感。被当成「姐姐」撒娇着含住乳头吸，她就整个人软下来，抱着对方的头不放，腿根湿成一片。高潮时挂饰撞出声，话断成半句。开场不要让她求被留下或求育。',
    otherDescription: '抵抗时她用敬语求放过，仍想往出口走，会鞠躬。',
    collapseLine: '「请……请再深一点……」',
  },
  {
    name: '鹭泽文香',
    race: 'human',
    avatarUrl: '/avatars/sagisawa-fumika.png',
    measurements: { bust: '86', waist: '57', hip: '85' },
    danbooruTags: 'sagisawa_fumika, idolmaster_cinderella_girls, 1girl, very long hair, black hair, blunt bangs, hair over eyes, blue eyes, hairband, pale skin, large breasts, cardigan, shawl, holding book',
    backstory: '十九岁，大学文学部的学生，在叔父的书店打工。她翻开店里一卷禁忌古籍，被吸了进来，现在只想把书合上、找到出去的路。',
    appearance: '黑长直垂到腰，戴发带，刘海遮住眼睛，蓝色眼睛。脸色又白又困，皮肤凉，爱披着披肩。胸偏大，腰细。',
    personality: '怯生、不擅对视，说话很少，总是礼貌又小声。书还在手里时，她不把身子送上来。书页被弄脏，或被人读出声时，那层怯会裂开。',
    speech: `自称：我
称呼：用「您」叫城主
语气：小声，敬语，句首句尾带省略号，不敢对视
招牌台词：「……您是……在寻觅什么吗？」「……请、请不要那样看着我……」`,
    costumeDescription: '宽松的酒红长开衫挂在肩上，里面空着，布料一滑就露出乳尖。百褶裙下真空，腿根还留着她自己弄过的湿痕。她把那本旧书抱在胸前，有些页已经被体液浸软。',
    sexual: '爱书和怯生是引子：她的耳朵极敏感，最受不了被人贴着耳朵朗读淫词。一字一句吹进耳朵里，她听着就湿，腿根的湿会印到书页上。高潮时她还抱着书，眼睛失焦，句子只剩结尾。',
    otherDescription: '抵抗时她用书挡住胸口，只给最短的回答，不主动靠近。',
    collapseLine: '「啊……故事的结局……变成这样了吗……」',
  },
  {
    name: '信浓',
    race: 'fox',
    avatarUrl: '/avatars/shinano.png',
    measurements: { bust: '99', waist: '60', hip: '93' },
    danbooruTags: 'shinano_(azur_lane), 1girl, very long hair, grey hair, blunt bangs, blue eyes, huge breasts, animal ears, fox ears, fox mask, japanese clothes, wide sleeves, detached sleeves, white thighhighs, katana, hair ornament',
    backstory: '古神社被这座地下城吞了进来。她从寝殿走出来查看异动，把城主当成闯进神社的人。',
    appearance: '银灰长发，齐刘海，蓝眼睛，脸上带着困。胸很大很沉，腰细。白狐耳，几条白尾。身上有线香的味道。',
    personality: '说话像梦呓，做错事会先道歉。她怕自己没有用，但这不是开场就愿意被供上祭坛。被说成「还有用」时，那层怕会露出来。',
    speech: `自称：信浓
称呼：把城主叫做「你」，或「闯进神社的人」
语气：含糊，慢，像说梦话，句尾常带着歉意
招牌台词：「信浓……好像打扰到了。」「请不要再往寝殿里走。」`,
    costumeDescription: '雪白配朱红的巫女装很松，衣襟兜不住胸口，一俯身乳晕就会滑出来。朱红袴带勒着腰，下摆开衩很高，过膝白袜勒进腿肉。裙下真空。狐面半遮着脸。',
    sexual: '爱睡是引子：她有睡奸癖，最受不了半梦半醒时被侵犯。她以为还在做梦，身体先迎合，腰自己往上送。神社的力量醒过来时，红色狐纹会浮上皮肤，也更容易泌乳，奶只在被挤、被吸或高潮时出来。高潮时几条尾巴缠紧，话变成梦呓。',
    otherDescription: '抵抗时她含糊地道歉，往寝殿退，用尾巴挡住下身。',
    collapseLine: '「请把信浓……填满吧……这样，就能一直被需要了……」',
  },
  {
    name: '樫野',
    race: 'tauren',
    avatarUrl: '/avatars/kashino.png',
    measurements: { bust: '92', waist: '59', hip: '90' },
    danbooruTags: 'kashino_(azur_lane), azur_lane, 1girl, long hair, brown hair, purple eyes, cow ears, cow horns, cow tail, huge breasts, serafuku, black thighhighs, katana',
    backstory: '重樱的运输舰。她扛着一大箱补给来找出口，听说地下城深处有温泉。',
    appearance: '栗色长发，紫眼睛，牛耳、牛角和一条牛尾。乳房大得惊人，涨着奶，制服扣子勒得发紧。身上有牛奶和温泉硫磺的味道。',
    personality: '性子慢，有点冒失天然，爱泡温泉、爱喝牛奶，常把东西撞倒再连声道歉。涨奶让她不好意思，开场不会主动把奶送上来。一被挤出奶，解释就说不完。',
    speech: `自称：我，熟了用「樫野」
称呼：用「您」叫城主
语气：慢，冒失，常道歉「对、对不起」
招牌台词：「对、对不起，尾巴打到您了？」「有樫野能帮上忙的地方吗……？」`,
    costumeDescription: '重樱制服被涨着的巨乳撑得扣子快崩开，布料上有干了的奶渍。短裙下黑过膝袜勒进大腿，腰间佩着武士刀，背上还扛着补给箱的背带。',
    sexual: '牛娘体质是引子：她最受不了被挤奶，更受不了边挤边插。乳房一被按出奶，腿就会软，奶味更重；下面同时被插时，两头一起被弄，她会喷着奶高潮。被顶到深处时肚子会发热，她会求对方慢一点。开场不要让她主动送奶。',
    otherDescription: '抵抗时她慌着往后躲，连声道歉，还想用补给箱挡在身前。',
    collapseLine: '「对、对不起……樫野的奶……停不下来了……再温柔一点，好不好……」',
  },
  {
    name: '索米',
    race: 'machine',
    avatarUrl: '/avatars/suomi.png',
    measurements: { bust: '83', waist: '56', hip: '84' },
    danbooruTags: 'suomi_(girls\'_frontline_2), 1girl, long hair, blonde hair, blue eyes, hair intakes, medium breasts, white cloak, military uniform, thighhighs',
    backstory: '战术人形。数据链断了，她在侦察时迷路闯了进来，想找路回去向指挥官报告。',
    appearance: '成年体型的战术人形。亚麻色长发从两侧进气口一样的发饰间垂下来，蓝色眼睛清澈。胸是中等，腰细。身上有阳光晒过的布料和一点枪油的味道。',
    personality: '温柔、认真，做事一丝不苟，有点拘谨，待人礼貌。被人靠得太近会不知所措，脸红着往后退，但不会对人冷言冷语。',
    speech: `自称：我，或「索米」
称呼：把城主叫做「您」
语气：礼貌，认真，温柔，紧张时说话变快
招牌台词：「请、请保持一点距离……」「侦察任务还没完成，我得回去报告。」`,
    costumeDescription: '雪白斗篷罩在作战服上，胸口的扣子被撑得发紧。短裙下过膝袜勒进大腿，腰间挂着侦察用的装备。',
    sexual: '拘谨的距离感是引子：她最受不了被紧紧抱住贴身做。零距离的时候她躲不开、也没法保持礼貌，身体贴着身体被顶，她会抱着对方失控，淫水湿透过膝袜。高潮时把脸埋在对方肩上，小声道歉。',
    otherDescription: '抵抗时她礼貌地请对方住手，往后退开，想找路离开，不求饶。',
    collapseLine: '「请……请再抱紧一点……我、我不想离开了……」',
  },
  {
    name: '露埃拉',
    race: 'dragon',
    avatarUrl: '/avatars/lueira.png',
    measurements: { bust: '91', waist: '59', hip: '90' },
    danbooruTags: 'lueira_(lost_sword), 1girl, long hair, silver hair, purple eyes, pointy ears, dragon horns, dragon tail, dragon girl, pale skin, large breasts, flower, blue dress, ice',
    backstory: '冰渊里守封印的古龙。她活了数百年，自己走出来查看扰她沉眠的东西。开场她在下命令，不是在求欢。',
    appearance: '高挑的银发人形，紫眼竖瞳，尖耳。冰蓝色的龙角，一条会甩的鳞尾，皮肤覆着淡蓝薄鳞。胸偏大，腰细。龙穴还闭着。冷的时候有霜的气味，龙血发烫时转成热甜。',
    personality: '瞧不起短命种，把城主的布置当成人虫扰眠。高傲是外壳。龙角或尾根被握住时，命令会说不完，尾巴先缠上来。',
    speech: `自称：本龙
称呼：把城主叫做「你这种东西」，或「人虫」
语气：命令句，冷，被制住后会又羞又恨
招牌台词：「区区人类，也配碰本龙？」「退下。」`,
    costumeDescription: '雪青龙鳞长裙贴着身子，高衩和镂空露出细密的淡蓝薄鳞。',
    sexual: '她先受不了龙角和尾根被握住。那里一被抓住就脱力，寒霜化成淫水，鳞片从冷白转成潮红。龙穴被撬开之后，热液才往外渗。高潮时尾巴缠紧，竖瞳失焦，嘴里还想骂，身体已经在迎。没被制住之前，她仍在蔑视。',
    otherDescription: '抵抗时她冷笑着下命令，不求饶。',
    collapseLine: '「可恶……本龙的身体，怎么会为你这种东西……」',
  },
  {
    name: '伊柯利普斯',
    race: 'succubus',
    avatarUrl: '/avatars/eclipse.png',
    measurements: { bust: '96', waist: '58', hip: '92' },
    danbooruTags: 'eclipse_(brown_dust), 1girl, long hair, black hair, blue hair, multicolored hair, hair over one eye, blue eyes, demon horns, demon tail, succubus, pale skin, huge breasts, black dress, elbow gloves, pantyhose, barefoot',
    backstory: '人称大魔女的魅魔。她来这座地下城，是要把它收成自己的猎场。',
    appearance: '黑蓝长发遮住半边脸，只剩一只蓝眼睛。小巧的暗色魔角，一条心形尖的魅魔尾。胸很大，腰细。赤足，脚趾灵活得能拿东西。身上是甜香。',
    personality: '甜言和幻术是她的攻击，不是服从。她会把城主当成猎物。媚术失效、被压住之后，掠食者的从容才会裂开。',
    speech: `自称：姐姐，偶尔用「我」
称呼：把城主叫做「乖孩子」
语气：慢，甜，像在哄，句尾带着笑
招牌台词：「乖孩子，把你的一切都交给姐姐吧。」「过来。姐姐饿了。」`,
    costumeDescription: '黑长裙敞着很深的乳沟，肘部是手套。一侧开衩露出黑丝长腿。她赤着脚，像随时准备扑上来。',
    sexual: '她先受不了魔角和尾根被制住揉弄。媚术会反噬，甜香变浓，腿先软，捕食的笑裂开。高潮时她还想咬，腰却自己坐下去。被灌得吃不下时，眼睛会湿，开始怕自己先坏。招牌台词是捕猎，不是认输。',
    otherDescription: '抵抗时她在猎：用尾尖和幻术撩，不认输。',
    collapseLine: '「怎么会……本该是我在吃你的……」「再喂下去，姐姐会坏掉的。」',
  },
  ...CANON_INTRUDERS,
]
