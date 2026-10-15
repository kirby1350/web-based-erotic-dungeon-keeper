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
  // per-floor theme names rolled at creation (index 0 = floor 1). Length follows TARGET_FLOOR, the deepest the keeper can dig.
  floorThemes?: string[]
  // current trap/monster encounter, or null when free
  encounter?: Encounter | null
  // exploration progress of the CURRENT floor, 0-100; must hit 100 to descend, resets on floor change
  explorationProgress?: number
  // marks left when a broken captive is thrown back to the city
  brands?: string[]
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
  dense: { label: '重油堆叠', hint: '进门第一段用「似是专为」。之后同一动作写三股，再按身体顺序舔净。转场套话仍然禁止' },
}

export interface AppSettings {
  chatModel: string
  imageModel: ImageModel
  imageStyle: ImageStyle
  imageStyleCustom: string
  imageTagPreset: ImageTagPreset
  proseStyle: ProseStyle
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

/** 城主最多能挖到的层。不是通关层，也不再单设最终 Boss。 */
export const TARGET_FLOOR = 10

/** 旧冒险者存档里第 10 层的固定名字。读档时换成普通风貌，不再当作终点。 */
export const RETIRED_BOSS_FLOOR_NAME = '魔王核心·淫狱王座'

export interface FloorTheme {
  name: string
  // 给 DM 的环境/危险氛围描述
  ambience: string
  // 这一层可能看得见的环境标签。提示词只让模型从中取 2 到 4 个，不要整串抄进 [SCENE]。
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

/** 为 1 到 TARGET_FLOOR 层各抽一个普通风貌。不再把最深层固定成魔王核心。 */
export function rollFloorThemes(): string[] {
  const pool = [...FLOOR_THEMES]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return Array.from({ length: TARGET_FLOOR }, (_, index) => pool[index % pool.length].name)
}

/** 取某层的风貌。旧存档里的魔王核心名字按层数回退到普通风貌。 */
export function getFloorTheme(floorThemes: string[] | undefined, floor: number): FloorTheme {
  const name = floorThemes?.[floor - 1]
  const found = name && name !== RETIRED_BOSS_FLOOR_NAME ? FLOOR_THEMES.find((theme) => theme.name === name) : undefined
  return found ?? FLOOR_THEMES[(Math.max(1, floor) - 1) % FLOOR_THEMES.length]
}

export interface CharacterPreset {
  name: string
  race: Race
  measurements: CharacterMeasurements
  backstory: string
  costumeDescription: string
  otherDescription: string
  danbooruTags?: string
  avatarUrl?: string
}

// Persisted adventure session (chat history + rolling summary)
export interface GameSession {
  messages: ChatMessage[]
  summary: string
  memory?: import('@/lib/adventure-memory').AdventureMemory
  pendingTurn?: import('@/lib/turn-engine').PendingTurn | null
  turns?: import('@/lib/turn-engine').TurnRecord[]
}

// Preset trap "seeds" — pick one to steer the random generator toward a type,
// instead of fully random. Keeps the AI tailoring to current character state.
export interface PresetTrap {
  id: string
  name: string
  category: string
  // short directive describing the trap type, injected into the generator prompt
  hint: string
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
// 崩溃台词是死穴被碰到之后的样本，开场仍按闯入者来写。
export const CHARACTER_PRESETS: CharacterPreset[] = [
  {
    name: '娜露梅亚',
    race: 'tauren',
    avatarUrl: '/avatars/narmaya.png',
    measurements: { bust: '90', waist: '58', hip: '88' },
    danbooruTags: 'narmaya_(granblue_fantasy), 1girl, draph, long hair, white hair, purple eyes, pointy ears, large breasts, hair ribbon, black bodysuit',
    backstory: '剑豪，二十四岁，娇小（134cm），却有一对与身量不相称的 E 杯。她是自己走进来的，要砍断这座地下城的核心。待人温和，剑还在手里时会把城主当成要斩的对象；刀被卸掉之后，才漏出想被人紧紧保住的那点软。',
    costumeDescription: '黑色皮革战衣把 E 杯勒到几乎溢出，胸口的金色符文压在乳尖上，呼吸就会磨到。暗紫腰带陷进腰肉，开裆短裤中间只有一根细链，动作大时露出私处。大腿绑带嵌进肉里。银白长发用黑缎半束。这是她的战衣。',
    otherDescription: '抵抗时声音仍温柔，用步法拉开距离，不先求饶。死穴是左身那道黑色印记：被按住或发热时阴蒂勃起，媚肉痉挛着渗水。只有印记被压住或快感明显升高之后，她才会红着眼眶往人身上贴，漏出「只、只要你一个人……就好了……」。这句是崩溃样本。',
  },
  {
    name: '一之濑志希',
    race: 'cat',
    avatarUrl: '/avatars/ichinose-shiki.png',
    measurements: { bust: '85', waist: '57', hip: '84' },
    danbooruTags: 'ichinose_shiki, idolmaster_cinderella_girls, 1girl, short hair, purple hair, gradient hair, purple eyes, cat ears, cat tail, multiple ear piercings, mole under eye, medium breasts, white jacket, plaid skirt',
    backstory: '十八岁，猫又血脉的化学家兼偶像。她自己跳进来，把这座地下城当成可以取样的实验场。她会看陷阱的结构、偷改药剂，也可能把春药抹到魔物或机关上。开场她在记数据，没有向城主效忠。',
    costumeDescription: '白色短夹克里只有两条黑肩带，遮不住乳尖。淡紫猫耳会随心情抽动，长猫尾绕在腿间。超短格纹裙下真空，黑色过膝袜勒进大腿。短发上有她自己调的催情香，左耳的银铃一抖就响。',
    otherDescription: '抵抗时她笑着问剂量和结构，不肯先求饶。死穴是耳后和尾根，一被揉就瘫软，喉间漏出「にゃーっ」。只有被揉到站不住，或发情已经写进身体之后，才会翘着尾巴磨上来，说「试试看吧～似乎很有趣呢」。这句话是崩溃样本。失神时的猫叫也留到那之后。',
  },
  {
    name: '桑山千雪',
    race: 'human',
    avatarUrl: '/avatars/kuwayama-chiyuki.png',
    measurements: { bust: '93', waist: '61', hip: '90' },
    danbooruTags: 'kuwayama_chiyuki, idolmaster_shiny_colors, 1girl, long hair, wavy hair, light brown hair, brown eyes, large breasts, cream sweater, music note',
    backstory: '二十三岁的音乐制作人。她弹了一卷不该弹的古谱，被卷进地下城，现在要找出口。她习惯把更慌的人护在身后，说话轻、先道歉。开场她在找路，会鞠躬，不会求谁把她留下。',
    costumeDescription: '奶油色毛衣领口很低，乳沟和半露的乳晕挡不住，乳尖一挺就顶出布料。米白长裙下是开裆的内裤。金棕长发有淡奶香，颈间的音符吊坠会跟着发抖撞出声。',
    otherDescription: '抵抗时她用敬语求放过，仍想往出口走。死穴是稳定的节奏和震动，被按着同一频率进入时容易接连潮吹。只有被顶到说不成整句之后，才会发着颤说「请……请再深一点……」，再往后才可能把眼前的人当成可以灌满她的人。这是崩溃样本，开场不要让她求育。',
  },
  {
    name: '鹭泽文香',
    race: 'human',
    avatarUrl: '/avatars/sagisawa-fumika.png',
    measurements: { bust: '86', waist: '57', hip: '85' },
    danbooruTags: 'sagisawa_fumika, idolmaster_cinderella_girls, 1girl, very long hair, black hair, blunt bangs, brown eyes, pale skin, large breasts, cardigan, holding book',
    backstory: '二十岁，话很少的文学少女。她翻开一卷禁忌古籍，被吸了进来，现在只想把书合上、找到出去的路。清冷是她的外壳。书还抱在胸口时，她不会主动把身子送上来。',
    costumeDescription: '宽松的酒红长开衫挂在肩上，里面空着，布料一滑就露出乳尖。黑长直垂到腰，齐刘海下的脸又白又困。百褶裙下真空，腿根还留着她自己弄过的湿痕。她把那本旧书抱在胸前，有些页已经被体液浸软。',
    otherDescription: '抵抗时她只回「……是吗」「……让开」，用书挡住胸口。死穴是被人对着书页做：朗读书里的句子、或用脏话逼她说不成句。书发烫时，淫纹会沿着纸上的字爬到皮肤上。只有那时她才会失神说「啊……故事的结局……变成这样了吗……」。这句是崩溃样本。',
  },
  {
    name: '信浓',
    race: 'fox',
    avatarUrl: '/avatars/shinano.png',
    measurements: { bust: '99', waist: '60', hip: '93' },
    danbooruTags: 'shinano_(azur_lane), 1girl, very long hair, white hair, blunt bangs, blue eyes, huge breasts, animal ears, fox ears, fox mask, japanese clothes, wide sleeves, detached sleeves, thighhighs, hair ornament',
    backstory: '古神社里半梦半醒的妖狐。神社被这座地下城吞了进来，她从寝殿走出来查看异动，把城主当成闯进神社的人。说话像梦呓，做错事会先道歉。她怕自己没有用，但这不是开场就愿意被供上祭坛。',
    costumeDescription: '雪白配朱红的巫女装很松，衣襟兜不住那对沉甸甸的乳，一俯身乳晕就会滑出来。白狐耳会羞得压低，几条白尾绕到身前挡身子。朱红袴带勒着腰，下摆开衩很高，过膝白袜勒进腿肉。裙下真空，腿间已经有一点潮。狐面半遮着困倦的脸。',
    otherDescription: '抵抗时她含糊地道歉，往寝殿退，用尾巴挡住下身。死穴是狐耳和尾根，被揉就腿软、淫水顺着腿往下。神社的力量醒过来时，红色狐纹会浮上皮肤，她也更容易泌乳。只有被按住、又被说成「还有用」之后，她才会哭着说「请把信浓……填满吧……这样，就能一直被需要了……」。这句是崩溃样本。',
  },
  {
    name: '樫野',
    race: 'tauren',
    avatarUrl: '/avatars/kashino.png',
    measurements: { bust: '92', waist: '59', hip: '90' },
    danbooruTags: 'kashino_(azur_lane), 1girl, long hair, red hair, hair between eyes, red eyes, large breasts, jacket, overalls, gloves, thighhighs, goggles, mole under mouth',
    backstory: '二十出头的工匠，进来是为了修被机关震坏的水脉，扳手还别在腰上。性子慢，容易被自己的工具绊倒。她会解释自己不是来打架的。涨奶是劳动后的毛病，开场她不会主动把奶送上来。',
    costumeDescription: '深色工装背带只拉上一半，涨着的巨乳几乎挣脱背带，布料上有干了的奶渍。皮革手套磨旧了，护目镜推在额上，嘴角有一颗小痣。赤红长发被汗黏在乳沟里。裤裆又热又潮。',
    otherDescription: '抵抗时她结巴着往后躲，说「等、等一下啦，我是来修水脉的」。死穴是被挤奶：乳房一被按出奶，腿就会软，话音里混进哞声。只有被挤着、或被顶到子宫之后，才会求「再……再温柔一点，好不好……哞」，再被灌满时才可能说肚子里暖。这些哞叫是崩溃样本。',
  },
  {
    name: '索米',
    race: 'machine',
    avatarUrl: '/avatars/suomi.png',
    measurements: { bust: '83', waist: '56', hip: '84' },
    danbooruTags: 'suomi_(girls\'_frontline_2), 1girl, long hair, blonde hair, blue eyes, hair intakes, medium breasts, white cloak, military uniform, thighhighs',
    backstory: '战术人形，金发，外表是娇小少女，核心是作战模块。数据链断了，她的任务是侦察并找路回报。她要求任何人都保持一臂距离，把城主当成未授权接触。开场她在执行条例，没有主人。',
    costumeDescription: '雪白斗篷罩在改过的作战服上。胸口和胯间开着检修口，露出缠着线缆的乳和嵌了传感器的下体。金发从两侧进气口一样的发饰间垂下来，蓝义眼发冷光。大腿上的过膝袜是校准束带，一勒紧核心就发烫。',
    otherDescription: '抵抗时她背条例：「请保持距离，这是规定。」痛觉会被错编译成快感，传感器可以一格一格往上调。只有校准过载之后，她才会夹着电流声播报「核心过热……润滑液溢出」，再被写入之后才说「正在接收……登录成功了」。后面这句是崩溃样本。开场不要叫她主人。',
  },
  {
    name: '露埃拉',
    race: 'dragon',
    avatarUrl: '/avatars/lueira.png',
    measurements: { bust: '91', waist: '59', hip: '90' },
    danbooruTags: 'lueira_(lost_sword), 1girl, long hair, silver hair, purple eyes, pointy ears, dragon horns, dragon tail, dragon girl, pale skin, large breasts, flower, blue dress, ice',
    backstory: '冰渊里守封印的古龙，人形是高挑的银发少女。她活了数百年，瞧不起短命种，把城主的布置当成人虫扰眠。身体覆着淡蓝薄鳞，还没被谁真正打开过。开场她在下命令，不是在求欢。',
    costumeDescription: '雪青龙鳞长裙贴着身子，高衩和镂空露出细密的淡蓝薄鳞。冰蓝色的龙角，一条会甩的鳞尾。银发垂到腰，竖瞳看人像在看虫子。裙深处那处龙穴还闭着，只有龙血发烫时才渗出热液。鳞片情动时会从冷白转成潮红。',
    otherDescription: '抵抗时她冷笑：「区区人类，也配碰本龙？」死穴是龙角和尾根，被握住就脱力，寒霜化成淫水。只有缝隙被撬开、龙血烧起来之后，她才会又羞又恨地哭「可恶……本龙的身体，怎么会为你这种东西……」，尾巴却缠上来。这句是崩溃样本。没被制住之前，她仍在蔑视。',
  },
  {
    name: '伊柯利普斯',
    race: 'succubus',
    avatarUrl: '/avatars/eclipse.png',
    measurements: { bust: '96', waist: '58', hip: '92' },
    danbooruTags: 'eclipse_(brown_dust), 1girl, long hair, black hair, blue hair, multicolored hair, hair over one eye, blue eyes, demon horns, demon tail, succubus, pale skin, huge breasts, black dress, elbow gloves, pantyhose, barefoot',
    backstory: '人称大魔女的魅魔。她来这座地下城，是要把它收成自己的猎场。甜言和幻术是她的攻击，不是服从。她会叫城主「乖孩子」，那是在捕猎。只有媚术失效、她被压住之后，掠食者的从容才会裂开。',
    costumeDescription: '黑蓝长发遮住半边脸，只剩一只蓝眼睛。黑长裙敞着很深的乳沟，一侧开衩露出黑丝长腿和赤足，脚趾灵活得能拿东西。小巧的暗色魔角，一条心形尖的魅魔尾。她赤着脚，像随时准备扑上来。',
    otherDescription: '抵抗时她在猎：用尾尖和幻术撩，笑着说「乖孩子，把你的一切都交给姐姐吧」。这句话是捕猎用语，不是认输。死穴是魔角和尾根，被制住揉弄时媚术会反噬。只有那时她才会哭「怎么会……本该是我在吃你的……」，再被灌满才说「再喂下去，姐姐会坏掉的」。后面两句是崩溃样本。',
  },
]
