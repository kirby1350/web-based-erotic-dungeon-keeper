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

export interface CharacterBond {
  name: string
  relation: string
  /** 同场结伴闯入时的互动与羞耻钩子 */
  togetherLine: string
  /** 对方已落入城主手中（在狱或收藏室）时的动摇软肋 */
  captiveLine: string
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
  // 明确标注的死穴部位（与文本解析合并，用于陷阱命中预览与崩溃台词解锁）
  weakParts?: BodyPart[]
  // 情境/机制弱点标签（匹配陷阱或魔物标签时命中分 +1）
  weakTags?: import('@/lib/synergy').DefenseTag[]
  // 覆盖默认 RACE_INFO[race].trait 的个人体质/种族补充说明
  raceTrait?: string
  // 与其他闯入者的姐妹/宿敌/队友羁绊
  bonds?: CharacterBond[]
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
  // 双人闯入：同行的另一个人（她自己的状态、称呼、立绘）。旧档没有。同伴身上不再嵌套同伴。
  partner?: Character | null
  // 双人闯入的场面状态：split 为真时两人已被拆开，场面只跟着当前这一个，同伴排在第二。
  party?: { split: boolean; note?: string } | null
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
  /** 代码侧检查：retried 为真表示这一回合自动重写过一次。first 是第一版没过的严格项，failures 是最终版仍没过的严格项；firstClear / clear 是对应的明显越界项，只有它们会触发重写。 */
  guard?: { retried: boolean; first: string[]; failures: string[]; firstClear?: string[]; clear?: string[]; extraMs: number }
}

export interface GeneratedImage {
  id: string
  url: string
  prompt: string
  timestamp: number
}

export type ImageStyle =
  | 'character'
  | 'none'
  | 'kuse_0201'
  | 'obui'
  | 'eno_yukimi'
  | 'thirty_8ght'
  | 'derauea'
  | 'belko'
  | 'rhasta'
  | 'nicoby'
  | 'nohito'
  | 'snowball22'
  | 'nanahara_fuyuki'
  | 'ouma_tokiichi'
  | 'nironiro'
  | 'v_mag'
  | 'kase_daiki'
  | 'tachibana_yuu'
  | 'taskmaster41'
  | 'paint_musume'
  | 'meion'
  | 'gmkj'
  | 'kaenuco'
  | 'k_suwabe'
  | 'shinkawa_youji'
  | 'dk.senie'
  | 'hakai_shin'
  | 'shiokonbu'
  | 'piromizu'
  | 'masami_chie'
export type ImageModel = 'tsubaki_v3' | 'tsubaki_v2'

export type ImageProvider = 'pixai' | 'tensorart'

export type TensorArtModel = 'wai_nsfw_v16' | 'jankuv6'

/** How scene tags are wrapped before they reach an image backend. */
export type ImagePromptFamily = 'illustrious' | 'sdxl' | 'flux'

// Optional extra tag group appended to every image prompt
export type ImageTagPreset = 'none' | 'curvy'

// 叙事文风（与常驻的「去油」文风禁令叠加，可切换密度/风格）
export type ProseStyle = 'standard' | 'dense'

export const PROSE_STYLE_LABELS: Record<ProseStyle, { label: string; hint: string }> = {
  standard: { label: '均衡叙事', hint: '节奏紧凑（接触回合约 450–750 字），兼顾剧情推进与心理反差，全程启用去套话约束' },
  dense: { label: '重油特写', hint: '高密度肉感与体液微距特写（接触回合 1000–1500 字），按回合动态轮换专属部位词库' },
}

export interface AppSettings {
  chatModel: string
  imageModel: ImageModel
  imageStyle: ImageStyle
  imageStyleVersion?: number
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
  cloudEndpoint?: string
  cloudBucket?: string
  cloudAccessKey?: string
  cloudSecretKey?: string
  cloudPublicUrl?: string
}

export const IMAGE_MODELS: Record<ImageModel, { label: string; modelId: string; family: ImagePromptFamily; apiVersion?: 'v1' | 'v2' }> = {
  tsubaki_v3: {
    label: 'Tsubaki.3 (DiT 新一代)',
    modelId: '2024383379556065549',
    family: 'illustrious',
    apiVersion: 'v2',
  },
  tsubaki_v2: {
    label: 'Tsubaki v2',
    modelId: '1983308862240288769',
    family: 'illustrious',
    apiVersion: 'v1',
  },
}

export const IMAGE_STYLES: Record<ImageStyle, { label: string; tags: string }> = {
  character: { label: '绑定角色专属画师（推荐）', tags: '' },
  none: { label: '无（模型默认）', tags: '' },
  kuse_0201: {
    label: 'kuse (0201) · 柔和厚涂/光泽蕾丝',
    tags: 'artist:kuse (0201), kuse (0201), glossy skin, detailed lace, soft thick painting, half-closed eyes, light blush',
  },
  obui: {
    label: 'obui · 爆乳粗腿大乳晕 (GBF)',
    tags: 'artist:obui, obui, huge breasts, thick thighs, large areolae, glossy skin, erotic illustration',
  },
  eno_yukimi: {
    label: 'eno yukimi · 牛娘/德拉夫爆乳',
    tags: 'eno yukimi, artist:eno yukimi, huge breasts, voluptuous, detailed anime illustration',
  },
  thirty_8ght: {
    label: 'thirty_8ght · 爆乳肉感重口 (BA)',
    tags: 'artist:thirty_8ght, thirty_8ght, colorful, vibrant colors, glossy skin, curvy, huge breasts, large areolae, erotic illustration',
  },
  derauea: {
    label: 'derauea · 拔作立绘爆乳',
    tags: 'derauea, artist:derauea, official art, huge breasts, glossy skin, erotic illustration',
  },
  belko: {
    label: 'belko · 巨乳挤压重口 NSFW',
    tags: 'belko, artist:belko, large breasts, breasts squeezed together, glossy skin, erotic illustration',
  },
  rhasta: {
    label: 'rhasta · 碧蓝丝袜高跟美腿',
    tags: 'artist:rhasta, rhasta, large breasts, thighhighs, pantyhose, detailed legs, anime illustration',
  },
  nicoby: {
    label: 'nicoby · 舰娘制服大胸',
    tags: 'artist:nicoby, nicoby, large breasts, crisp shading, anime illustration',
  },
  nohito: {
    label: 'nohito · 黑长发文静色气 (偶大)',
    tags: 'artist:nohito, nohito, expressive face, fine details, dramatic lighting, large breasts, anime art style',
  },
  snowball22: {
    label: 'snowball22 · 游戏官方立绘丰满',
    tags: 'artist:snowball22, snowball22, official art, large breasts, crisp lineart, detailed costume',
  },
  nanahara_fuyuki: {
    label: '七原冬雪 · 奇幻华丽厚涂 (GBF)',
    tags: 'nanahara fuyuki, artist:nanahara fuyuki, ornate fantasy illustration, dramatic lighting, detailed costume',
  },
  ouma_tokiichi: {
    label: 'ouma tokiichi · 抱枕构图重 NSFW',
    tags: 'artist:ouma tokiichi, ouma_tokiichi, huge breasts, dakimakura style, lush shading, erotic illustration',
  },
  nironiro: {
    label: 'nironiro · 差分式色气立绘',
    tags: 'artist:nironiro, nironiro, large breasts, expressive blush, erotic illustration',
  },
  v_mag: {
    label: 'v-mag · 明艳大胸过膝袜擦边',
    tags: 'v-mag, artist:v-mag, large breasts, thighhighs, vibrant colors, glossy shading',
  },
  kase_daiki: {
    label: 'kase daiki · 制服连裤袜臀腿',
    tags: 'kase daiki, artist:kase daiki, large breasts, thick thighs, pantyhose, detailed fabric',
  },
  tachibana_yuu: {
    label: '橘由宇 · 兽耳破衣色气',
    tags: 'tachibana yuu, artist:tachibana yuu, large breasts, thighhighs, torn clothes, anime illustration',
  },
  taskmaster41: {
    label: '41 (taskmaster41) · 丰满熟女御姐',
    tags: 'artist:41 (taskmaster41), 41_(taskmaster41), huge breasts, mature female, soft shading',
  },
  paint_musume: {
    label: 'paint_musume · 内衣日常柔光擦边',
    tags: 'artist:paint musume, paint_musume, large breasts, soft digital painting, anime illustration',
  },
  meion: {
    label: 'meion · 泳装美腿玉足特写',
    tags: 'artist:meion, meion, large breasts, thighhighs, detailed legs, clean anime style',
  },
  gmkj: {
    label: 'gmkj · 重口全裸差分 NSFW',
    tags: 'artist:gmkj, gmkj, erotic illustration, expressive face, detailed body',
  },
  kaenuco: {
    label: 'kaenuco · 东方兽耳虎牙轻甜',
    tags: 'kaenuco, artist:kaenuco, cute anime style, expressive eyes, soft colors',
  },
  k_suwabe: {
    label: 'K-SUWABE · 金属锋利硬派厚涂',
    tags: 'k-suwabe, artist:k-suwabe, colorful, thick brushstrokes, rough painting, red accent, dynamic pose',
  },
  shinkawa_youji: {
    label: '新川洋司 · 水墨干笔硬派速写',
    tags: 'shinkawa youji, artist:shinkawa youji, ink wash painting, sumi-e, brush strokes, rough sketch, splatter',
  },
  'dk.senie': {
    label: 'dk.senie · 梦幻水彩柔光',
    tags: 'dk.senie, watercolor, soft lineart, pastel colors, dreamy lighting',
  },
  hakai_shin: {
    label: 'Hakai Shin · 鲜艳动态光影',
    tags: 'hakai_shin, detailed shading, dynamic pose, vibrant colors, anime illustration',
  },
  shiokonbu: {
    label: 'shiokonbu · 清透萌系细线',
    tags: 'shiokonbu, detailed lineart, soft shading, moe style, clean illustration',
  },
  piromizu: {
    label: 'piromizu · 水润油亮色气',
    tags: 'piromizu, glossy skin, detailed body, soft gradient, erotic illustration',
  },
  masami_chie: {
    label: 'masami chie · 暖调细腻柔线',
    tags: 'masami chie, soft lineart, delicate shading, warm palette, detailed illustration',
  },
}

/** 每位角色固定绑定的专属画师风格（确保同一角色的头像、5阶动态立绘与局内生成插图画风完全统一） */
export const CHARACTER_BOUND_STYLE: Record<string, Exclude<ImageStyle, 'none' | 'character'>> = {
  // 偶像大师系
  'ichinose-shiki': 'kuse_0201',
  'kuwayama-chiyuki': 'paint_musume',
  'sagisawa-fumika': 'nohito',
  'miura-azusa': 'taskmaster41',
  // 碧蓝幻想系
  narmaya: 'eno_yukimi',
  galleon: 'obui',
  katalina: 'nanahara_fuyuki',
  anila: 'eno_yukimi',
  yuel: 'tachibana_yuu',
  // 蔚蓝档案系
  'ichinose-asuna': 'thirty_8ght',
  'hanekawa-hasumi': 'belko',
  // 碧蓝航线 / 舰娘系
  kashino: 'derauea',
  illustrious: 'rhasta',
  belfast: 'snowball22',
  takao: 'nicoby',
  akagi: 'ouma_tokiichi',
  amagi: 'tachibana_yuu',
  shinano: 'ouma_tokiichi',
  taihou: 'rhasta',
  atago: 'nicoby',
  cheshire: 'v_mag',
  noshiro: 'nohito',
  'new-jersey': 'snowball22',
  // 其他作品与讨伐小队
  suomi: 'k_suwabe',
  lueira: 'nironiro',
  eclipse: 'kuse_0201',
  'hero-alicia': 'v_mag',
  'saint-selena': 'kase_daiki',
  'knight-viola': 'meion',
}

export function boundStyleKeyFor(character?: { avatarUrl?: string | null; name?: string } | null): Exclude<ImageStyle, 'none' | 'character'> | null {
  if (!character) return null
  const m = character.avatarUrl?.match(/\/avatars\/([\w-]+)\.(?:png|jpe?g|webp)$/i)
  if (m && CHARACTER_BOUND_STYLE[m[1]]) return CHARACTER_BOUND_STYLE[m[1]]
  return null
}

export function resolveStyleTagsForCharacter(style: ImageStyle, character?: { avatarUrl?: string | null; name?: string } | null): string {
  if (style === 'character') {
    const key = boundStyleKeyFor(character)
    return key ? IMAGE_STYLES[key]?.tags ?? '' : ''
  }
  return IMAGE_STYLES[style]?.tags ?? ''
}

// Extra danbooru tag groups the player can toggle on top of the scene prompt.
export const IMAGE_TAG_PRESETS: Record<ImageTagPreset, { label: string; tags: string }> = {
  none: { label: '无', tags: '' },
  curvy: {
    label: '丰乳肥臀',
    tags: 'gigantic breasts, gigantic hips, huge hips, huge ass, thick thighs, curvy, huge areolae, gigantic nipples, protruding nipples, lactation, size difference, large clitoris, clitoris, fat mons, female ejaculation',
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
  weakParts?: BodyPart[]
  weakTags?: import('@/lib/synergy').DefenseTag[]
  raceTrait?: string
  bonds?: CharacterBond[]
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
    measurements: { bust: '99', waist: '57', hip: '93' },
    weakParts: ['breast'],
    weakTags: ['milk', 'hypno'],
    danbooruTags: 'narmaya_(granblue_fantasy), granblue_fantasy, 1girl, draph, horns, pink hair, very long hair, hair over one eye, braid, light blue eyes, large breasts, short stature, black bodysuit',
    backstory: '二十四岁的德拉夫剑豪。她听说地下城里关着走失的孩子，放心不下，自己提着刀走了进来。',
    appearance: '樱粉长发长到大腿，单边遮眼，编着细辫，水蓝眼睛，头上一对德拉夫的大角。身高一百三十四厘米，身量娇小，乳房却硕大沉甸甸的，乳晕下总渗着温甜奶香。',
    personality: '爱照顾人的大姐姐，把年纪小的都当成要宠的孩子，宠过头了就躲起来一个人开反省会。内里自卑，渴望被认可，被夸就会乱掉。剑术是天才级，冥想会睡着。',
    speech: `自称：姐姐（认真时说「我」）
称呼：把城主叫做「你」，动心后叫「你酱」
语气：温柔宠溺，句尾放软，带「嗯嗯」「好乖好乖」；被弄乱时叫声和半句话并在同一行里说，不一声一行
招牌台词：「姐姐会好好照顾你的哦。」「……一个人反省会，开始。」`,
    costumeDescription: '黑色紧身战衣把沉甸甸的巨乳勒到几乎溢出，胸口布料被奶水洇出两块深色湿印。腰带陷进软腰，热裤下大腿绑带深深嵌进白腻腿肉，腰间挂着两把太刀。',
    sexual: '宠人的姐姐是引子：她的死穴是涨满乳汁的乳房与乳头，最受不了被反过来宠着揉乳挤奶，一边被吸吮乳尖一边被夸「好姐姐」。被肯定加上被挤奶，奶水和淫水会一起涌出来，泌乳着高潮。她泌乳，但只在被挤、被吸或高潮时出奶，开场不主动送奶。高潮时腰自己往前送，话只剩半句。',
    otherDescription: '抵抗时声音仍温柔，像哄孩子一样劝城主住手，用步法和双刀拉开距离，不先求饶。',
    collapseLine: '「姐姐……姐姐被你宠坏了啦……再夸姐姐一次好不好……」',
  },
  {
    name: '一之濑志希',
    race: 'human',
    avatarUrl: '/avatars/ichinose-shiki.png',
    measurements: { bust: '85', waist: '57', hip: '84' },
    weakParts: ['clitoris', 'vagina'],
    weakTags: ['aphro'],
    danbooruTags: 'ichinose_shiki, ichinose shiki, idolmaster_cinderella_girls, idolmaster cinderella girls, 1girl, long hair, wavy hair, two side up, burgundy hair, reddish-brown hair, pink gradient hair, ahoge, hair ornament, blue eyes, :3, fang, playful smile, medium breasts, open lab coat, white coat, pink plaid bikini top, criss-cross halterneck, bare midriff, pink plaid miniskirt, black thighhighs',
    backstory: '十八岁的化学天才兼偶像，兴趣是「失踪」。她说是闻到地下城里有很好闻的味道才跳进来的，把这里当成可以取样的实验场。她会看陷阱的结构、偷改药剂，也可能把春药抹到魔物或机关上。开场她在记数据。',
    appearance: '酒红偏红棕的微卷长发束成俏皮半双马尾，发尾透着亮粉渐变，头顶翘着呆毛，澄澈猫系水蓝眼眸总弯着虎牙坏笑。举止像猫，爱凑到人身边轻嗅。胸是中等，腰极细。发梢带着她自己调配的甜冽香气。',
    personality: '任性、跳脱，像猫一样随心所欲，嘴上像在做实验，把别人的反应当数据。嗅觉极灵，爱闻气味。真被弄到站不稳时，记录会断。',
    speech: `自称：我，兴奋时说「志希酱」
称呼：把城主叫做「你」，带着「你你～」的叠音
语气：轻快，跳跃，句尾～，笑声「喵哈哈～」，常凑近「嗅嗅」
招牌台词：「你身上的味道很好闻嘛～一定是好人！」「喵哈哈～这个反应值得记一笔！」`,
    costumeDescription: '白色短夹克敞着，里面只有两条交叉黑肩带，几乎遮不住微翘乳尖。超短格纹裙下真空未穿内裤，黑色过膝袜紧勒大腿软肉。',
    sexual: '嗅觉控是引子：她最受不了浓烈的气息与催情香雾。被按近火热气息或吸入甜腻催情雾时，深嗅几口就发情腿软，阴蒂充血发烫，小穴自己渗出湿滑水丝。自己调的春药也会反噬，越闻越停不下来。高潮时鼻尖还在贪婪轻嗅，记录用的句子说不完。',
    otherDescription: '抵抗时她笑着问剂量和结构，不肯先求饶。',
    collapseLine: '「试试看吧～似乎很有趣呢」',
  },
  {
    name: '桑山千雪',
    race: 'human',
    avatarUrl: '/avatars/kuwayama-chiyuki.png',
    measurements: { bust: '93', waist: '61', hip: '90' },
    weakParts: ['breast'],
    weakTags: ['milk', 'bind'],
    danbooruTags: 'kuwayama_chiyuki, idolmaster_shiny_colors, 1girl, long hair, wavy hair, light brown hair, braid, single braid, hair over shoulder, brown eyes, large breasts, cream sweater',
    backstory: '二十三岁的偶像，杂货屋店员出身，随身带针线包。她在古董杂货铺翻到一只会唱歌的八音盒，打开就被卷了进来。',
    appearance: '浅褐长发松松编成一条麻花辫搭在肩前，带着淡暖奶香，褐色眼睛温和柔软。胸脯丰满绵软，腰细臀圆。颈间挂着自己缝的小布艺挂饰。',
    personality: '组合里的大姐姐，习惯把更慌的人护在身后，说话轻、先道歉，手很巧，爱做手工。护人是外壳。一针一线被打乱时，她自己会先乱。',
    speech: `自称：我
称呼：用「您」叫城主
语气：温柔敬语，像哄妹妹，偶尔露出少女心
招牌台词：「您的扣子快掉了呢，我帮您缝一下吧？」「作为姐姐，得更可靠一点才行……」`,
    costumeDescription: '奶油色针织毛衣领口松垮低垂，深邃乳沟和半露的淡粉乳晕挡不住，乳尖一挺就顶出软毛线。米白长裙下是开裆内裤。',
    sexual: '手作和母性是引子：她的死穴是柔软饱满的乳房与乳头，最受不了被吮乳的母性快感。被当成「姐姐」撒娇着含住乳头吸吮，她就整个人酥软下来，抱着对方的头不放，腿根湿成一片。高潮时颈间小挂饰撞出轻响，话断成半句。开场不要让她求被留下或求育。',
    otherDescription: '抵抗时她用敬语求放过，仍想往出口走，会鞠躬。',
    collapseLine: '「请……请再深一点……」',
  },
  {
    name: '鹭泽文香',
    race: 'human',
    avatarUrl: '/avatars/sagisawa-fumika.png',
    measurements: { bust: '93', waist: '57', hip: '90' },
    weakParts: ['clitoris', 'vagina'],
    weakTags: ['hypno', 'aphro'],
    danbooruTags: 'sagisawa_fumika, idolmaster_cinderella_girls, 1girl, very long hair, black hair, blunt bangs, hair over eyes, blue eyes, hairband, pale skin, large breasts, cardigan, shawl, holding book',
    backstory: '十九岁，大学文学部的学生，在叔父的书店打工。她翻开店里一卷禁忌古籍，被吸了进来，现在只想把书合上、找到出去的路。',
    appearance: '乌黑长直发垂到腰际，戴素色发带，齐刘海半遮着澄澈蓝眼。肤色白得近乎透明，指尖微凉，习惯裹着披肩。看似清瘦，开衫下胸脯却意外丰满沉甸。',
    personality: '怯生、不擅对视，说话很少，总是礼貌又小声。书还在手里时，她不把身子送上来。书页被弄脏，或被人读出声时，那层怯会裂开。',
    speech: `自称：我
称呼：用「您」叫城主
语气：小声，敬语，句首句尾带省略号，不敢对视；话少，几个碎句用省略号连在同一行里，不一个碎句占一行
招牌台词：「……您是……在寻觅什么吗？」「……请、请不要那样看着我……」`,
    costumeDescription: '宽松的酒红长开衫松挂在肩头，里面真空未穿内衣，布料一滑就露出雪白乳肉与淡粉乳尖。百褶裙下同样真空，腿根还留着潮热湿痕。她把那本旧书紧紧抱在胸前，书页边缘已被汗与体液浸软。',
    sexual: '爱书和怯生是引子：她的耳廓与阴蒂极度敏感，最受不了被人贴着耳朵一字一句朗读羞耻淫词、同时拨弄充血的阴蒂。字句混着热气吹进耳里，小穴听着就往外渗水，腿根湿痕会洇透怀里的书页。高潮时她还死死抱着书，眼神失焦，句子只剩结尾。',
    otherDescription: '抵抗时她用书挡住胸口，只给最短的回答，不主动靠近。',
    collapseLine: '「啊……故事的结局……变成这样了吗……」',
  },
  {
    name: '信浓',
    race: 'fox',
    avatarUrl: '/avatars/shinano.png',
    measurements: { bust: '105', waist: '60', hip: '97' },
    weakParts: ['vagina', 'breast'],
    weakTags: ['hypno', 'milk'],
    danbooruTags: 'shinano_(azur_lane), azur_lane, 1girl, very long hair, grey hair, silver hair, blunt bangs, sleepy eyes, blue eyes, huge breasts, animal ears, fox ears, multiple tails, white fox tail, fox mask, japanese clothes, wide sleeves, detached sleeves, white thighhighs, katana, hair ornament',
    backstory: '古神社被这座地下城吞了进来。她从寝殿走出来查看异动，把城主当成闯进神社的人。',
    appearance: '银灰长发垂落及膝，齐刘海下蓝眼睛半阖着困意。胸前硕大沉重，腰肢纤细。头顶一对绒白狐耳，身后数条蓬松白尾轻轻摆动，周身萦绕清冷线香与温软乳香。',
    personality: '说话像梦呓，做错事会先道歉。她怕自己没有用，但这不是开场就愿意被供上祭坛。被说成「还有用」时，那层怕会露出来。',
    speech: `自称：信浓
称呼：把城主叫做「你」，或「闯进神社的人」
语气：含糊，慢，像说梦话，句尾常带着歉意
招牌台词：「信浓……好像打扰到了。」「请不要再往寝殿里走。」`,
    costumeDescription: '雪白配朱红的巫女装松垮垂坠，敞开的衣襟根本兜不住硕大胸乳，稍一俯身淡粉乳晕便滑出一半。朱红袴带束紧细腰，高开衩下过膝白袜勒进丰腴腿肉，裙下真空，狐面斜扣在发侧。',
    sexual: '爱睡是引子：她有睡奸与朦胧催眠癖，最受不了半梦半醒间小穴被缓慢顶入、乳房被揉按催乳。她以为还在梦境里，湿软小穴先一步吸附迎合，腰肢自己往上送。神社之力苏醒时绯红狐纹浮上雪肤，乳尖更易泌乳，但奶水只在被挤、被吸或高潮时涌出。高潮时数条白尾死死缠紧，话变成滚烫梦呓。',
    otherDescription: '抵抗时她含糊地道歉，往寝殿退，用尾巴挡住下身。',
    collapseLine: '「请把信浓……填满吧……这样，就能一直被需要了……」',
  },
  {
    name: '樫野',
    race: 'tauren',
    avatarUrl: '/avatars/kashino.png',
    measurements: { bust: '108', waist: '60', hip: '98' },
    weakParts: ['breast', 'vagina'],
    weakTags: ['milk', 'slime'],
    danbooruTags: 'kashino_(azur_lane), azur_lane, 1girl, long hair, brown hair, purple eyes, cow ears, cow horns, cow tail, huge breasts, serafuku, black thighhighs, katana',
    backstory: '重樱的运输舰。她扛着一大箱补给来找出口，听说地下城深处有温泉。',
    appearance: '栗色长发，湿润紫眼，一对柔软牛耳、弯角与细长牛尾。乳房硕大得惊人，沉甸甸涨满乳汁，把制服勒得随时要崩开。身上带着温热甜牛奶与淡淡温泉硫磺的气息。',
    personality: '性子慢，有点冒失天然，爱泡温泉、爱喝牛奶，常把东西撞倒再连声道歉。涨奶让她不好意思，开场不会主动把奶送上来。一被挤出奶，解释就说不完。',
    speech: `自称：我，熟了用「樫野」
称呼：用「您」叫城主
语气：慢，冒失，常道歉「对、对不起」
招牌台词：「对、对不起，尾巴打到您了？」「有樫野能帮上忙的地方吗……？」`,
    costumeDescription: '重樱水手服被涨满奶水的硕大巨乳撑得排扣欲裂，深蓝衣料洇着半干的乳白奶渍。超短裙下黑色过膝袜深深勒进丰满大腿，腰佩武士刀，肩背补给箱皮带正好勒过胸乳两侧。',
    sexual: '牛娘体质是引子：她的死穴是涨奶的巨乳与湿软小穴，最受不了被挤奶，更受不了边挤奶边往小穴里深顶。乳房一被按出温热奶线，双腿就会发软；小穴同时被撑开顶弄时，上下两处一起失守，她会边道歉边喷着奶高潮。被顶到宫口深处时小腹发热，会哭着求慢一点。开场不要让她主动送奶。',
    otherDescription: '抵抗时她慌着往后躲，连声道歉，还想用补给箱挡在身前。',
    collapseLine: '「对、对不起……樫野的奶……停不下来了……再温柔一点，好不好……」',
  },
  {
    name: '索米',
    race: 'machine',
    avatarUrl: '/avatars/suomi.png',
    measurements: { bust: '83', waist: '56', hip: '84' },
    weakParts: ['vagina', 'breast'],
    weakTags: ['bind', 'shock'],
    raceTrait: '高拟真战术人形之躯：痛觉与电流过载信号会被心智云图错译成酥麻热流，贴身接触点与传感器极易过热失控；但她拥有细腻羞怯的少女心智，绝非冷漠无耻的铁器——越想维持礼貌与军规，机体失控渗液时的羞耻、耳根发烫与手足无措就越强烈。',
    danbooruTags: 'suomi_(girls\'_frontline_2), 1girl, long hair, blonde hair, blue eyes, hair intakes, medium breasts, white cloak, military uniform, thighhighs',
    backstory: '战术人形。数据链断了，她在侦察时迷路闯了进来，想找路回去向指挥官报告。',
    appearance: '成年体型的战术人形。亚麻色长发从两侧进气口一样的发饰间垂落，澄澈蓝眼带着认真神色。胸部匀称柔软，细腰紧致。身上有阳光晒过的斗篷布料与淡淡枪油的气味。',
    personality: '温柔、认真，做事一丝不苟，有点拘谨，待人礼貌。被人靠得太近会不知所措，脸红着往后退，但不会对人冷言冷语。',
    speech: `自称：我，或「索米」
称呼：把城主叫做「您」
语气：礼貌，认真，温柔，紧张时说话变快
招牌台词：「请、请保持一点距离……」「侦察任务还没完成，我得回去报告。」`,
    costumeDescription: '雪白防寒斗篷罩在贴身作战服外，胸口排扣被绷得微紧。短裙下白边过膝袜勒出细腻腿线，腰间挂着战术侦察装具。',
    sexual: '拘谨的距离感是引子：她最受不了被紧紧箍住无法后退、胸部与小穴被零距离贴身顶弄。躲不开也没法保持礼貌距离时，心智云图迅速过热，紧窄小穴不受控地分泌润滑体液湿透过膝袜。高潮时机体轻颤，把滚烫的脸埋在对方肩窝小声道歉。',
    otherDescription: '抵抗时她礼貌地请对方住手，往后退开，想找路离开，不求饶。',
    collapseLine: '「请……请再抱紧一点……我、我不想离开了……」',
  },
  {
    name: '露埃拉',
    race: 'dragon',
    avatarUrl: '/avatars/lueira.png',
    measurements: { bust: '96', waist: '58', hip: '94' },
    weakParts: ['vagina', 'clitoris'],
    weakTags: ['parasite', 'fire'],
    danbooruTags: 'lueira_(lost_sword), 1girl, long hair, silver hair, purple eyes, pointy ears, dragon horns, dragon tail, dragon girl, pale skin, large breasts, flower, blue dress, ice',
    backstory: '冰渊里守封印的古龙。她活了数百年，自己走出来查看扰她沉眠的东西。开场她在下命令，不是在求欢。',
    appearance: '高挑的银发人形，紫眼竖瞳，尖耳。冰蓝色的龙角泛着寒光，身后一条有力鳞尾，雪肤边缘覆着细密淡蓝薄鳞。胸乳饱满挺拔，腰肢纤细，紧闭的龙穴尚未经人事。平时带着清冽霜气，龙血发烫时化作腻人热甜。',
    personality: '瞧不起短命种，把城主的布置当成人虫扰眠。高傲是外壳。龙角或尾根被握住时，命令会说不完，尾巴先缠上来。',
    speech: `自称：本龙
称呼：把城主叫做「你这种东西」，或「人虫」
语气：命令句，冷，被制住后会又羞又恨
招牌台词：「区区人类，也配碰本龙？」「退下。」`,
    costumeDescription: '雪青色贴身龙鳞长裙勾勒出高挑曲线，胸侧镂空挤出雪白软肉，高开衩下露出大腿内侧细密的淡蓝薄鳞，体温一升鳞片便泛起潮红。',
    sexual: '她先受不了龙角和尾根被死死握住、紧闭龙穴与阴蒂被强行撬开揉弄。角根与尾根一被拿捏就全身脱力，体表寒霜化成滚烫淫水，冷白薄鳞染上粉红。龙穴被撑开后热液源源外渗。高潮时鳞尾死死缠紧，竖瞳失焦，嘴里还想呵斥，腰臀已经在迎合。没被制住之前，她仍在蔑视。',
    otherDescription: '抵抗时她冷笑着下命令，不求饶。',
    collapseLine: '「可恶……本龙的身体，怎么会为你这种东西……」',
  },
  {
    name: '伊柯利普斯',
    race: 'succubus',
    avatarUrl: '/avatars/eclipse.png',
    measurements: { bust: '101', waist: '58', hip: '96' },
    weakParts: ['vagina', 'anus'],
    weakTags: ['hypno', 'tentacle'],
    danbooruTags: 'eclipse_(brown_dust), 1girl, long hair, black hair, blue hair, multicolored hair, hair over one eye, blue eyes, demon horns, demon tail, succubus, pale skin, huge breasts, black dress, elbow gloves, pantyhose, barefoot',
    backstory: '人称大魔女的魅魔。她来这座地下城，是要把它收成自己的猎场。',
    appearance: '黑蓝双色长发遮住半边脸，只露出一只狭长魅惑的蓝眼。头顶小巧暗色魔角，身后一条心形尖尾。胸乳硕大饱满，腰极细，臀浪肥美。十根赤裸脚趾白皙灵巧得能夹物，周身散着催情甜香。',
    personality: '甜言和幻术是她的攻击，不是服从。她会把城主当成猎物。媚术失效、被压住之后，掠食者的从容才会裂开。',
    speech: `自称：姐姐，偶尔用「我」
称呼：把城主叫做「乖孩子」
语气：慢，甜，像在哄，句尾带着笑
招牌台词：「乖孩子，把你的一切都交给姐姐吧。」「过来。姐姐饿了。」`,
    costumeDescription: '漆黑魔女长裙敞着极深的乳沟，双臂套着贴肤过肘长手套。高开衩下是修饰腿肉线条的露趾黑丝长袜，十根白皙赤裸的脚趾踩在冰凉石地上，像随时准备扑上来捕食。',
    sexual: '她先受不了魔角和尾根被制住揉弄、小穴与后穴反被强行灌满。一旦媚术反噬，甜香骤浓，双腿先软，捕食者的从容笑意寸寸裂开。高潮时她还想咬人夺回主动，肥臀却自己往下坐实吞紧。被前后孔穴喂到吃不下时，眼角泛湿，开始怕自己先一步坏掉。招牌台词是捕猎，不是认输。',
    otherDescription: '抵抗时她在猎：用尾尖和幻术撩，不认输。',
    collapseLine: '「怎么会……本该是我在吃你的……」「再喂下去，姐姐会坏掉的。」',
  },
  ...CANON_INTRUDERS,
]
