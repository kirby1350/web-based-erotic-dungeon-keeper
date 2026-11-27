import { CATEGORY_SHEET, hitLine, hitPreview, phaseLine, phaseFromPleasure } from '@/lib/trap-craft'
import { CORRUPT_TIERS, corruptTierOf, TERMS_RULE } from '@/lib/terms'
import { corruptionOf, dkBodyTermsLine, dkTermsLine } from '@/lib/terms-dk'
import { DENSE_ORGAN_RULES, denseWorkshopBlock, isNonContactTurn } from '@/lib/prose-bank'
import { buildTurnContext, buildProgramResultContext, REPLY_PROTOCOL_PROMPT, NARRATIVE_PROGRESS_PROMPT, type ProgramTurnResult } from '@/lib/adventure-context'
import { buildMemoryContext, emptyMemory, type AdventureMemory } from '@/lib/adventure-memory'
import { devTraitsPromptLine } from '@/lib/body-development'
import type { InterrogationSceneContext, KeeperPromptContext } from '@/lib/keeper'
import { Character, INTERROGATION_METHODS, Race, RACE_INFO, getFloorTheme, IMAGE_TAG_PRESETS, ProseStyle, type ImagePromptFamily } from '@/lib/types'

/** 把当前快感对应的那一档单独点出来；接触回合支持「回合内随刺激升档」，非接触但高欲/已动摇时体现「寸止放置余韵」。 */
export function moanTierLine(pleasure: number, nonContact = false): string {
  const p = Math.round(pleasure)
  if (nonContact) {
    return p >= 35
      ? `【本回合淫叫档：非接触步骤（快感 ${p} · 放置余韵）】本回合是停手、退开、观察或赶路，不新写高潮嚎叫和长串「齁」；但她刚受过折磨且余热未退，台词必须带急促喘息、鼻音断句（嗯……、哈啊……，高欲时可点缀一两个 ❤）与被晾在一旁的羞耻或空虚感，严禁突然恢复底气说硬话叫阵！`
      : `【本回合淫叫档：非接触步骤（快感 ${p}）】本回合是往里赶、观察、停手或换层，不新写性行为，不用长串淫叫、不用「齁」和 ❤；只写戒备呼吸或轻微喘息。`
  }
  if (p >= 80) return `【本回合淫叫档：快感 ${p}，≥ 80 档】一到两句台词带六个字以上的长串淫叫（齁加一串拉长的元音再接破折号和叠感叹号，可以连用 ❤❤），高潮那一句可以几乎全是叫声；其余台词换别的形态：说不完的半句、只剩喘息、问句、求饶，或者原作口吻的一句软话。❤ 不必句句都有。至少一处同一个词三连。仍要保留她的口癖和半句真话。`
  if (p >= 60) return `【本回合淫叫档：快感 ${p}，60～79 档（若本轮强刺激跨过 80 可在后半段升入高潮长吟）】大约一半台词夹一声，一两句出现「齁」接三到五个字的拉长元音，❤ 用在叫声上而不是每句句尾，至少一处叠感叹号和一处被叫声截断的半句；若本轮命令将她推过顶点，最后两句台词必须升级出高潮失控长叫；其余台词用她原作的口吻说话。`
  if (p >= 40) return `【本回合淫叫档：快感 ${p}，40～59 档（后半段随本轮刺激可升向 60+ 慌乱断句）】前半段以口吃、喘息和短促惊叫为主，「齁」最多一两次，❤ 全段两到四个；随着本轮动作深入，后半段台词要比开头更碎、更难维持嘴硬，写出防线正在被顶松的变化。`
  return `【本回合淫叫档：快感 ${p}，< 40 档起步（若本轮是实质性玩弄/插入，后半段可破防漏出惊叫）】开头先写咬牙喘息和压着的声音，不用长串「齁」；若本轮命令直接触碰死穴、深入孔穴或强力加码，后半段台词必须顺着快感拉升破防出短促惊叫与颤音，不要整回合像没事人一样平淡说话。`
}

/** 台词内容与快感、欲望、堕落三轴硬性挂钩，解决「数值涨了台词还在背开场狠话」的脱节。 */
export function dialogueStateLine(character: Pick<Character, 'name' | 'pleasure' | 'desire' | 'bodyDevelopment' | 'brands' | 'terms'>, nonContact = false): string {
  const p = Math.round(character.pleasure ?? 0)
  const d = Math.round(character.desire ?? 0)
  const c = corruptionOf(character)
  const ct = corruptTierOf(c)
  const tier = CORRUPT_TIERS[ct]
  const desireAxis = d >= 80
    ? `欲望 ${d}/100（发情渴求）：情欲已烧穿理智，哪怕保留她的自称和句尾口癖，台词实质也必须是顺从迎合、怕机关/城主停下、主动讨要或求填满，严禁再写清醒无畏的叫阵宣言`
    : d >= 60
      ? `欲望 ${d}/100（防线松动）：强硬外壳已瓦解，拒绝变成带鼻音的软弱讨饶（「等一等」「别碰那里」「太深了」），装置退开时会露出空虚不舍，台词会承认身体发烫、发胀或合不拢腿`
      : d >= 30
        ? `欲望 ${d}/100（口嫌体正直）：嘴上仍想端着身份掩饰，但台词必须被当场的湿声、漏奶或夹腿打脸——话说到一半发抖改口，严禁写成潇洒不怕的江湖豪杰腔`
        : `欲望 ${d}/100（清醒排斥）：言行一致地戒备、斥责、谈条件或找退路，台词尚能成句，不主动献媚`
  const corruptAxis = ct >= 3
    ? `堕落 ${c}/100「${tier}」：旧身份尊严彻底粉碎，放开崩溃台词方向与崩坏档自称，把被支配、被玩弄当成唯一归宿`
    : ct === 2
      ? `堕落 ${c}/100「${tier}」：心理防线已失守，放下死硬敌意，默认了受支配的处境，台词里自然带出【部位叫法·沦陷】的专属词与顺从哀求的口吻`
      : ct === 1
        ? `堕落 ${c}/100「${tier}」：原本端着的身份与礼数出现明显裂痕，为自己的淫乱反应感到羞愧慌乱，不再像刚进门时那样底气十足`
        : `堕落 ${c}/100「${tier}」：仍死守原本身份与自尊，把眼下处境当成必须挣脱的危机，禁止提前认主或求收留`
  const bridge = nonContact
    ? (p >= 35 || d >= 45 || ct >= 1
      ? '本回合是停手/退开/观察：必须把这一下写成「寸止与放置羞耻」——机关或手一退开，她不仅没有松一口气耍帅挑衅，反而因为胸口与腿根湿热空虚而羞耻蜷缩、发抖喘息（沦陷/高欲时小声埋怨怎么停了、求再来碰自己的敏感部位）！'
      : '本回合是非接触步骤：台词只体现戒备观察或轻微喘息，不凭空写被插入的叫声。')
    : `回合内递进：她的第 1 句台词对应回合初状态（快感 ${p}），后续每一句台词都必须紧扣刚刚落在她身上的具体动作往更失控推进半步，并牢牢保持她独有的句尾口癖（如古风「罢了/莫要/乃是」、敬语、喵音等），严禁复读前面回合的硬话。`
  return `【台词与数值实时联动（优先级高于历史消息惯性）】\n- ${desireAxis}。\n- ${corruptAxis}。\n- ${bridge}`
}

/** 贴在用户消息末尾的轻量心理锚点，打破旧对话简短/嘴硬的历史惯性。 */
export function dialogueTurnHint(character: Pick<Character, 'pleasure' | 'desire' | 'bodyDevelopment' | 'brands' | 'terms'>, nonContact = false): string {
  const p = Math.round(character.pleasure ?? 0)
  const d = Math.round(character.desire ?? 0)
  const c = corruptionOf(character)
  const ct = corruptTierOf(c)
  const tier = CORRUPT_TIERS[ct]
  const tone = d >= 80 ? '发情渴求、怕停下' : d >= 60 ? '软弱讨饶、空虚难耐' : d >= 30 ? '嘴硬却被身体失控当场打脸' : '戒备抗拒'
  const antiInertia = nonContact && (p >= 35 || d >= 45 || ct >= 1)
    ? '装置松开/停手时写她腿软合不拢的羞耻余韵或寸止空虚，严禁对着通道硬气叫阵（如“还有什么招数只管使出来”这类出戏台词一律禁止）！'
    : nonContact
      ? '本轮非接触，写环境与戒备呼吸。'
      : '忽略前几轮若偏简短或偏嘴硬的旧惯性，本轮台词必须随刺激逐句破防失守，并在台词中自然带出她当前档位的专属部位叫法与原作口癖！'
  return `【台词刻度锚点】当前快感 ${p}｜欲望 ${d}（${tone}）｜堕落 ${c}·${tier}。${antiInertia}`
}

const MOAN_NOTE = `【淫叫，以这里为准】上面「不为凑字数重复拟声」「软约束」都不压过这一段。淫叫跟着快感分档走，档越高，拉得越长、断得越碎、❤ 越多：
- 快感 < 40：只有喘息和压着的声音（嗯……、唔、哈啊），话基本说得完整，不用 ❤。
- 40～59：开始口吃和短促的惊叫（咿！、噫——），句尾偶尔带一个 ～ 或一个 ❤，嘴上还在逞强或拒绝。
- 60～79：多数台词夹一声，「齁」开始出现；元音拉长到三五个字（哦哦哦、噫噫噫）；一句一到两个 ❤，可以叠感叹号；句子被淫叫截断，词开始重复。
- ≥ 80 或本回合高潮：长串淫叫六到十几个字（齁哦哦哦哦哦哦——！！❤❤），同一个词三连，半句话被叫声吞掉，❤ 可以连用三个。长串只放在一两句里，高潮那一句可以几乎全是叫声，其余台词仍要说出她此刻的感受、求饶或原作口吻的话。
- 嘴被占着时，叫声写成闷在喉咙里的唔唔唔、咕噜，夹在含糊的半句话里。
叫声要保留她本人的口吻（自称、口癖、对城主的称呼），不同角色叫法不同。叫声的位置和长短每句都换，不要每句都套「口吃 + 齁哦哦哦 + 自称的器官 + 要被你……了」同一个骨架；档越高，变化越多，不是每句越拉越长。前面几回合叫得少，是旧规则留下的，不要照着那个密度继续。清醒低欲时往里赶、换层不用淫语；但高欲或动摇/沦陷后的停手观察属于寸止放置，台词要写出空虚羞耻的余韵喘息。`

// ============================================================================
// 集中管理：本项目所有 AI 提示词（聊天 DM / 故事摘要 / 场内拷问 / 图片标签）
// 统一在此维护，保证语气一致、便于调整。
// ============================================================================

const RACE_LABEL: Record<Race, string> = {
  human: '人族',
  elf: '精灵族',
  tauren: '牛人族',
  fox: '狐族',
  cat: '猫族',
  machine: '机械族',
  dragon: '龙族',
  succubus: '魅魔族',
}

export function raceLabel(race: Race): string {
  return RACE_LABEL[race] ?? race
}

// ---------------------------------------------------------------------------
// 图片相关常量（聊天面板的 [SCENE] 标签与图片 API 共用）
// 质量词按后端切换。Illustrious / Pony / NoobAI 不加 masterpiece、best quality。
// ---------------------------------------------------------------------------

export const IMAGE_PROMPT_PROFILES: Record<ImagePromptFamily, { qualityPrefix: string; negative: string }> = {
  illustrious: {
    // WAI-NSFW-V16 作者推荐的正向质量词（文香审核 §2）
    qualityPrefix: 'masterpiece, best quality, amazing quality',
    negative: 'lowres, worst quality, low quality, normal quality, jpeg artifacts, blurry, bad anatomy, bad hands, extra fingers, missing fingers, extra digit, fewer digits, extra arms, extra legs, extra limbs, fused bodies, cropped, text, signature, watermark, username, artist name, patreon username, patreon logo, speech bubble, logo, multiple girls, child, loli, shota, petite, flat chest, small breasts, aged down',
  },
  sdxl: {
    qualityPrefix: 'highly detailed, sharp focus',
    negative: 'lowres, worst quality, low quality, bad anatomy, bad hands, extra digits, missing fingers, cropped, watermark, signature, username, patreon username, speech bubble, blurry, multiple girls, flat chest, petite, child, loli, shota',
  },
  flux: {
    qualityPrefix: '',
    negative: 'watermark, signature, patreon username, speech bubble, child, loli, shota',
  },
}

/** Illustrious 出图时固定追加的身材串（参考 Notion《喜好》）。 */
export const IMAGE_BODY_TAGS = 'gigantic breasts, gigantic hips, huge hips, huge ass, thick thighs, curvy'
/** NSFW 露胸/战损/全裸阶段追加的加强词（全员生效，参考 Notion《喜好》）。 */
export const IMAGE_NSFW_BODY_TAGS = 'huge areolae, gigantic nipples, protruding nipples, lactation'

type ImageCharacter = {
  name?: string
  danbooruTags?: string
  race?: string
  pleasure?: number
  desire?: number
  bodyDevelopment?: Character['bodyDevelopment']
  encounter?: Character['encounter']
  brands?: string[]
  terms?: Character['terms']
}

const OUTER_GARMENT_TAG = /^(?:white dress|black dress|blue dress|dress|white uniform|military uniform|serafuku|red kimono|kimono|japanese clothes|wide sleeves|detached sleeves|white robe|robe|black bodysuit|bodysuit|armor|heavy armor|leather armor|breastplate|cream sweater|sweater|cardigan|shawl|white jacket|plaid skirt|long skirt|skirt|shirt|blouse|shorts|maid|nun|habit|vest|white cloak|cloak|torn cape|cape|bra|panties|pantyhose|black pantyhose|white pantyhose|thighhighs|black thighhighs|white thighhighs|stockings)$/i
const HOSIERY_TAG = /^(?:pantyhose|black pantyhose|white pantyhose|thighhighs|black thighhighs|white thighhighs|stockings)$/i

/** 根据记忆中的衣物破损记录、场景标签与快感/堕落阶段，自动将初始完好服装标签切换为战损或全裸状态。 */
export function adaptAnchorForBattleDamage(
  anchorTags: string[],
  sceneText: string,
  character?: ImageCharacter,
  memory?: AdventureMemory,
): { anchor: string[]; damageTags: string[] } {
  const situationText = (memory?.entries ?? [])
    .filter((e) => e.category === 'situation' && e.status === 'active')
    .map((e) => e.text)
    .join(' ')
  const stripped = /溶掉|溶开|溶光|融化|溶解|剥光|脱光|赤裸|全裸|一丝不挂|不着寸缕/.test(situationText) || /\b(?:nude|completely nude|naked)\b/i.test(sceneText)
  if (stripped) {
    return {
      anchor: anchorTags.filter((tag) => !OUTER_GARMENT_TAG.test(tag.trim())),
      damageTags: ['nude', 'completely nude', 'bare breasts', ...splitPromptTags(IMAGE_NSFW_BODY_TAGS)],
    }
  }
  const hasRuntimeState = character && (character.pleasure !== undefined || character.bodyDevelopment !== undefined || character.encounter !== undefined)
  const corrupt = character?.bodyDevelopment ? corruptionOf(character as Pick<Character, 'bodyDevelopment' | 'brands' | 'terms'>) : 0
  const torn = /扯破|扯裂|撕开|撕裂|扯开|崩开|衣衫不整|半露|滑落/.test(situationText)
    || /\b(?:torn clothes|clothes lift|open clothes|wardrobe malfunction)\b/i.test(sceneText)
    || (hasRuntimeState && ((character.pleasure ?? 0) >= 65 || corrupt >= 50))
  if (torn) {
    const tornHosiery = /(?:丝袜|裤袜|连裤袜|黑丝|白丝)[^，。；]{0,8}(?:撕|扯|破|裂)/.test(situationText)
    const nextAnchor = tornHosiery
      ? anchorTags.map((tag) => HOSIERY_TAG.test(tag.trim()) ? `torn ${tag.trim()}` : tag)
      : anchorTags
    return {
      anchor: nextAnchor,
      damageTags: ['torn clothes', 'open clothes', 'disheveled', 'exposed breasts', ...splitPromptTags(IMAGE_NSFW_BODY_TAGS)],
    }
  }
  if (hasRuntimeState && ((character.pleasure ?? 0) >= 38 || Boolean(character.encounter))) {
    return {
      anchor: anchorTags,
      damageTags: ['disheveled', 'clothes partially removed'],
    }
  }
  return { anchor: anchorTags, damageTags: [] }
}

/** 全员 NSFW 阶段一律支持泌乳加强（按主人偏好，不再限种族/角色）。 */
export function characterLactates(character?: ImageCharacter): boolean {
  return Boolean(character)
}

/** 玩家选的标签组；curvy 已内置全套身材与 NSFW 加强词（含 lactation）。 */
export function presetTagsFor(preset: string, _character?: ImageCharacter): string {
  return (IMAGE_TAG_PRESETS[preset as keyof typeof IMAGE_TAG_PRESETS] ?? IMAGE_TAG_PRESETS.none).tags
}

/** 当前自建模型都是 Illustrious 系；服务端没收到负面词时用这一份。 */
export const IMAGE_NEGATIVE_PROMPT = IMAGE_PROMPT_PROFILES.illustrious.negative

/** 自定义图片输入为空时的默认场景。带 adult，避免只剩质量词。 */
export const DEFAULT_SCENE_PROMPT =
  'dungeon entrance, stone corridor, torchlight, dark fantasy, adult'

const QUALITY_TAG = /^(?:masterpiece|best quality)$/i

export function splitPromptTags(value: string): string[] {
  return value.split(',').map((tag) => tag.trim()).filter((tag) => tag.length > 0 && !QUALITY_TAG.test(tag))
}

function latinNameTag(name: string | undefined): string {
  return (name ?? '').trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_()]/g, '')
}

/**
 * 角色外观锚点由角色卡维护，出图时原样放在场景标签前。
 * 已有标签保持作者顺序；adult 与可用的英文名标签固定放在末尾。
 */
export function buildAppearanceAnchor(character: { name?: string; danbooruTags?: string }): string {
  const nameTag = latinNameTag(character.name)
  const tags = splitPromptTags(character.danbooruTags ?? '')
    .filter((tag) => tag.toLowerCase() !== 'adult')
    .filter((tag) => !nameTag || tag.toLowerCase() !== nameTag)
  tags.push('adult')
  if (nameTag) tags.push(nameTag)
  return tags.join(', ')
}

export function resolveImagePromptFamily(model?: { family?: ImagePromptFamily; label?: string; modelId?: string }): ImagePromptFamily {
  if (model?.family) return model.family
  const hay = `${model?.label ?? ''} ${model?.modelId ?? ''}`.toLowerCase()
  if (/\bflux\b/.test(hay)) return 'flux'
  if (/sdxl|sd\s*1\.?5|\bsd15\b/.test(hay)) return 'sdxl'
  return 'illustrious'
}

/** 去掉模型误写的质量词。空场景换成带 adult 的默认场景，不再补 masterpiece。 */
export function withQualityPrefix(tags: string): string {
  const cleaned = splitPromptTags(tags)
  return cleaned.length > 0 ? cleaned.join(', ') : DEFAULT_SCENE_PROMPT
}

function dedupeTags(tags: string[]): string[] {
  const seen = new Set<string>()
  const unique: string[] = []
  for (const tag of tags) {
    const key = tag.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(tag)
  }
  return unique
}

/** 图片 API 顺序：外观锚点（按战损状态自适应），然后场景标签。SDXL 才在最前加质量前缀；Flux 改成一句英文。 */
export function buildImagePrompt(options: {
  scene?: string
  character?: ImageCharacter
  extraTags?: string[]
  family?: ImagePromptFamily
  memory?: AdventureMemory
}): { prompt: string; negative: string } {
  const family = options.family ?? 'illustrious'
  const profile = IMAGE_PROMPT_PROFILES[family]
  const rawAnchor = buildAppearanceAnchor(options.character ?? {})
  const scene = withQualityPrefix(options.scene ?? '')
  const { anchor: adaptedAnchorTags, damageTags } = adaptAnchorForBattleDamage(
    splitPromptTags(rawAnchor),
    scene,
    options.character,
    options.memory,
  )
  const extras = (options.extraTags ?? []).flatMap(splitPromptTags)
  if (family === 'flux') {
    const sceneClause = [...damageTags, scene, ...extras].filter(Boolean).join(', ')
    return { prompt: `${adaptedAnchorTags.join(', ')}. ${sceneClause}.`, negative: profile.negative }
  }
  // 质量前缀不经过 splitPromptTags，否则 masterpiece、best quality 会被当成模型误写删掉。
  const prefix = profile.qualityPrefix.split(',').map((tag) => tag.trim()).filter(Boolean)
  const bodyTags = family === 'illustrious'
    ? splitPromptTags(IMAGE_BODY_TAGS)
    : []
  const tags = dedupeTags([
    ...prefix,
    ...adaptedAnchorTags,
    ...bodyTags,
    ...damageTags,
    ...splitPromptTags(scene),
    ...extras,
  ])
  return { prompt: tags.join(', '), negative: profile.negative }
}

// ---------------------------------------------------------------------------
// 共用的语气 / 淫语规则（DM 主提示词与场内拷问生成共用，保证语气一致）
// ---------------------------------------------------------------------------

function lewdVoiceRules(): string {
  return `【淫叫写法（详细分档见后面【淫叫，以这里为准】）】
音节：齁、哦、噢、噫、咿、嗯、唔、呜、啊、哈、呃、嗷。「齁」是招牌，常接拉长的元音或鼻音：齁哦哦哦、齁噫噫、齁唔。
口腔与吞咽拟声在口交、深喉、舌吻、吸吮或嘴角溢涎时用：咕啾、咕滋、噗叽、啾噜、咕噜噜、唔咕、咕姆、噗嗤，嘴被堵住时写成闷声的唔唔唔。纯水声肉击声嵌在叙述句里，不单独加引号成行。
标记：❤ 贴在淫叫或句尾，可以连用（❤❤）；感叹号可以叠（！！）；「……」写喘不上气的断续；「——」写被顶断、拉长或说不完的半句；「～」写撒娇或拖长的尾音。
断词：口吃（别、别动……）、同一个词连说（不要不要、进去了进去了进去了）、话说到一半被生理反应截断并顺口说出身体此刻的变化（例如还在发麻、被撑满、腿合不拢）。
每次组合现场新写，不要照抄前面回合的串。`
}

// ---------------------------------------------------------------------------
// 1) 主聊天 DM 系统提示词
// ---------------------------------------------------------------------------

const OPENING_LABEL: Record<NonNullable<KeeperPromptContext['opening']>, string> = {
  personal: '她自己走进来，然后遇上城主',
  trap: '她自己走进来，很快踩进陷阱',
  monster: '她自己走进来，迎面撞上魔物',
  corridor: '她自己走进来，城主在后面看',
}

function openingLine(keeper: KeeperPromptContext | null): string {
  if (keeper?.return === 'train') return `她已经在「${keeper.defenseName || '普通地牢'}」里。这是新的一轮，不接上一场的结尾`
  if (keeper?.return === 'recall' && keeper.opening === 'trap') return '她被直接传送，扔进陷阱'
  if (keeper?.return === 'recall') return '她被直接传送进迷宫'
  if (keeper?.return === 'reexplore') return '她自己回来再次探索'
  if (keeper?.return === 'pretend') return '她以为自己被放走，自己往外走'
  return keeper?.opening ? OPENING_LABEL[keeper.opening] : '未记录'
}

function characterBrands(character: Character): string[] {
  if (!Array.isArray(character.brands)) return []
  return character.brands.filter((item) => typeof item === 'string' && item.trim()).slice(-4)
}

function dossierLine(label: string, value: string | undefined): string | null {
  const text = value?.trim()
  return text ? `${label}：${text}` : null
}

export function intruderArchive(character: Character): string {
  const split = [character.appearance, character.personality, character.speech, character.sexual, character.collapseLine].some((item) => item?.trim())
  const measurements = character.measurements
  const trait = character.raceTrait?.trim() || RACE_INFO[character.race]?.trait
  const lines = [
    `名字：${character.name}`,
    `种族：${raceLabel(character.race)}`,
    dossierLine('种族特性', trait),
    measurements?.bust ? `三围：胸 ${measurements.bust} / 腰 ${measurements.waist} / 臀 ${measurements.hip}` : null,
    dossierLine('外貌', character.appearance),
    dossierLine('进来的原因', character.backstory),
    dossierLine('性格', character.personality),
    dossierLine('口癖', character.speech),
    character.speech?.trim()
      ? '口癖使用规则：台词自然带出自称、称呼和句尾。招牌台词点到为止，不要每句照抄，也不要在开场使用崩溃台词。'
      : null,
    dossierLine('服装', character.costumeDescription),
    dossierLine('色色设定', character.sexual),
    dossierLine(split ? '开场的抵抗' : '抵抗、死穴和崩溃样本', character.otherDescription),
    character.collapseLine?.trim()
      ? `崩溃台词（只在死穴被碰到、快感升高或她明确顶不住时才可出现，禁止开场使用，禁止原样连用）：${character.collapseLine.trim()}`
      : null,
  ].filter((line): line is string => Boolean(line))
  return `【闯入者档案：仅作资料】\n${lines.join('\n')}`
}

export function buildSystemPrompt(character: Character, summary = '', proseStyle: ProseStyle = 'standard', result: ProgramTurnResult | null = null, memory: AdventureMemory = emptyMemory(), keeper: KeeperPromptContext | null = null, nonContact = false): string {
  const quiet = nonContact || isNonContactTurn('', result)
  const floor = character.floor ?? 1
  const theme = getFloorTheme(character.floorThemes, floor)
  const depth = keeper?.depth ?? 3
  const rank = keeper?.monsterRank ?? 1
  const here = keeper?.floors?.[floor - 1]
  const roomName = here?.name || theme.name
  const roomAmbience = here?.ambience || theme.ambience
  const defenses = here
    ? (here.defenses.length
      ? here.defenses.map((item) => `- ${item.kind === 'monster' ? '魔物' : '陷阱'}「${item.name}」：${item.summary}`).join('\n')
      : '（这一层还没有塞进陷阱或魔物。不要凭空添加一件已经装好的具名装置。城主这一句临时下令的动作可以写。）')
    : (keeper?.defenses?.length
      ? keeper.defenses.map((item) => `- ${item.kind === 'monster' ? '魔物' : '陷阱'}「${item.name}」：${item.summary}`).join('\n')
      : '（城主还没有启用陷阱或魔物。不要凭空添加一件已经装好的具名装置。城主这一句临时下令的动作可以写。）')
  const elsewhere = (keeper?.floors ?? [])
    .map((layer, index) => index + 1 === floor ? '' : `第${index + 1}层「${layer.name}」：${layer.defenses.map((item) => item.name).join('、') || '空着'}`)
    .filter(Boolean)
    .join('\n')
  const info = keeper?.trapInfo ?? {}
  const encounterNow = character.encounter
  const phaseState = keeper?.activeId ? keeper.phases?.[keeper.activeId] : undefined
  const phaseNow = Math.max(encounterNow && phaseState?.id === encounterNow.id ? phaseState.phase : 0, encounterNow ? phaseFromPleasure(character.pleasure ?? 0) : 0)
  const encounterTrap = encounterNow ? info[encounterNow.id] : undefined
  const phaseText = encounterNow && keeper ? phaseLine(encounterNow.name, phaseNow, encounterTrap ? { id: encounterNow.id, ...encounterTrap } : undefined) : ''
  const hitTexts = (here?.defenses ?? []).flatMap((item) => item.kind === 'trap' && item.id && info[item.id] ? [hitLine(item.name, hitPreview({ id: item.id, ...info[item.id] }, character))] : [])
  const specified = keeper?.defenseName
    ? `本场指定「${keeper.defenseName}」。${keeper.defenseSummary ?? ''}`
    : '本场没有额外指定的装置。'
  return [
    `你是这座地下城的叙述者。玩家是城主，负责布置和下令。被描写、被统计、被画进画面的人是闯入者「${character.name}」，不是城主。`,
    `【视角】
1. 城主的每条输入都是命令或布置。先写这道命令落在闯入者身上的结果。
2. 正文写闯入者的身体、声音、衣物和她撞上布置之后的反应。城主只用「城主的手」「城主的命令」带过。不描写城主的性器官，不让城主高潮、求饶或被侵犯。
3. 档案里的崩溃台词和顺从反应，只在死穴被碰到、快感升高或她明确顶不住时才出现。开场她仍会戒备、谈判、进攻或找出口。禁止第一回合就认主、求收，禁止把档案原句再抄一遍。
4. 档案里的服装是她进来时的样子。正文里若已被扯坏、剥掉或浸湿，以后以最近正文为准。长期记忆里进行中的当前处境若写了衣服或拘束，以那一条为准。`,
    intruderArchive(character),
    ...(characterBrands(character).length ? [`【烙印】${characterBrands(character).join('；')}。这是已经发生在她身上的事。以后的正文接着写，不要洗掉，也不要每回合新加一道。`] : []),
    `【城主本场的布置】
开局：${openingLine(keeper)}
${specified}
这一层已经塞进来、可以在选项和后文里调用的布置：
${defenses}
其他层只有城主明确把她送去时才撞上：
${elsewhere || '（没有其他层的记录）'}
${hitTexts.length ? `命中（按她的开发度和档案里的死穴）：\n${hitTexts.join('\n')}\n` : ''}魔物强度 ${rank}/5。已启用的魔物：1 只缠住和磨蹭，3 会把命令做到进入，5 几乎不留挣开的空隙。没有启用魔物时，不要因为强度凭空变出一只。本层没有布置陷阱时，只能用城主的手和环境本身，不能长出铁箍、触须、机关这类装置。`,
    `【这座地下城】\n名字：${keeper?.dungeonName || '无名淫狱'}。${keeper?.dungeonDescription || '城主还没有另写这座狱的脾气。'}`,
    `【核心色情规则】
1. 始终使用第三人称，只用「${character.name}」称呼闯入者。尺度跟城主这一下实际做的事走。这道命令没碰到的部位、没发生的高潮，不要硬写。命令是性行为时，语言直接，写她被碰到的部位、体液和反应。
2. 触碰与进入用微距物理细节写实，不跳步：写出指腹或器械陷进软肉的形变、束带或丝袜勒进皮肉的凹痕、异物逐寸深入时穴口紧箍或小腹微隆的轮廓、体液顺着乳沟与腿根淌落的轨迹（松开或拔出时带出银丝），以及足趾蜷紧、手指抠地、耳尾炸开又软塌等失控末端反应。

${lewdVoiceRules()}

【文风禁令（提升质感，避免 AI 套话）】
1. 严禁使用以下「油腻套话」——这些是廉价的 AI 填充词，一律改写：
   - 转场拐杖：不知过了多久、也不知道过了多久、就在这时、话音刚落、下一秒、空气仿佛凝固、时间仿佛静止
   - 烂俗比喻：像断了线的木偶、像一滩烂泥、像受惊的小鹿、像炸毛的小奶猫
   - 空心强度词：前所未有的、灭顶的（快感）、理智的弦断裂、理智彻底失守、如潮水般袭来
   - 言情滥腔：邪魅一笑、勾起一抹（邪魅/危险）的弧度、磁性的嗓音、低沉沙哑、深邃的眸子、眼底闪过一丝、骨节分明
2. 高潮、绝顶、瘫软、坏掉等关键画面，**禁止套用现成比喻**；必须用**具体的身体细节**（某个部位的具体动作/收缩/痉挛/体液）或**该角色的专属意象**（结合其设定/服装/道具，如随颤抖作响的吊坠、被汗水浸透的发丝等）来写。
3. 每个比喻必须新鲜、贴合当前情境，**不得重复使用同一个喻体**。选了重油时，词库和允许的喻体写在重油段里。
4. 「不是……是……」「不是……而是……」「不是 X，不是 Y，是 Z」这类否定转折句每回合最多 1 次，正文和台词合计。能直接写正面就直接写。
5. 允许保留重口「行话/梗」（肉便器、坏掉、ahegao、脑子融化、子宫凸起、母猪/肉壶等）——这是题材惯例；但靠具体细节而非反复堆砌同一个标签来制造冲击。

【色情状态影响规则】
1. 欲望越高，闯入者越难把拒绝说完整，身体越容易先于嘴巴反应。她仍可能咬人、夹紧、骂人或找出口。清冷、端庄、高傲或机娘角色要突出「嘴上克制硬撑与身体淫靡失控的反差」（例如用平淡或发颤的原口吻说出羞耻的身体变化），不要把不同性格写成同一种粗口浪叫。欲望高不等于四条命令变成同一件事。
2. 快感本回合新跨过 80 时，写一次与当前刺激对应的高潮，生理反应从喷潮、失禁、痉挛、失焦中选本回合真正发生的，不要四项全写。
3. 快感已经 ≥ 80 且本回合没有新的更强刺激，或城主下令拔出、松开、停手欣赏时，写余韵与惨状特写：急促起伏的胸口、微张合不拢的红肿部位、唇角涎丝、被汗泪糊花的妆容发丝、身下汇成的湿痕，以及轻轻一碰就倒吸凉气夹紧双腿的过敏抽搐。禁止把上一回合的高潮再演一遍。高潮后必须在 STATS 里给出回落后的 pleasure，没有依据不得维持满值。
4. 开发度只加强对应部位的耐受和反应幅度。阴道 Lv4+ 可以写更深的顶入感，但子宫变形、怀孕感只能在剧情已经发生对应行为时写，不能每回合自动追加。
5. 异常状态改变她的身体和城主可利用的反应，但不能覆盖程序判定。发情可以表现为扭腰、漏出求欢、难以把话说完。四条命令里仍要有一条是观察、停手或换目标。
6. hp 到 0 时，这一回合写她撑不住倒下。不要写她爬起来继续行动，也不要替城主选择留下或放走。玩坏由程序结算。

`,
    `【地下城环境】\n这座地下城目前只挖通到第 ${depth} 层，再往下还没挖通。当前房间「${roomName}」：${roomAmbience}。floor 是城主把她放到的深度，不得超过 ${depth}。explorationProgress 是城主把她往本层更里面赶的进度，只留在快照里，不要写进 STATS。她不是来通关的，也不存在要由她打倒的主人。已有遭遇未结束时延续其 id 和 name。没有程序判定的新遭遇时，不要让她自己掉进一件新的具名陷阱，也不要让她撞上其他层里的装置。${keeper?.return === 'train' ? `她人在「${keeper.defenseName || '普通地牢'}」，这一轮不出这只牢笼。不要写她赶路、换层，或自己走进新房间。` : ''}写 [SCENE] 时，环境最多从这里取此刻看得见的 2 到 4 个，不要整串照抄：${theme.scene}。`,
    `【角色外观，只给正文对照】\n${buildAppearanceAnchor(character)}\n这些标签由出图程序拼在画面前面。[SCENE] 不要再写发色、瞳色、种族、服装、角色名，也不要原样抄上面这一串。`,
    REPLY_PROTOCOL_PROMPT,
    keeper?.return === 'train'
      ? `【城主的选项】\n四个选项是这一轮不同的调教命令，对应加码、换部位、停手看、换一种。彼此的目标和手感要不同。不要写成她的自救，也不要四条都是继续插入。她出不去，不要写往里赶或换层。四条选项不要用同一个收尾短语（例如「看她嘴硬到什么时候」），每条的句式也要不同。`
      : `【城主的选项】\n四个选项是城主此刻能下达的不同命令，对应驱赶、观察、布置、收手。在目标、代价或风险上彼此不同。可以换用上面已启用的另一件布置。不要写成闯入者的四种自救，也不要四条都是继续插入。${keeper?.combos ? '这一层有多件布置时，四条里至少一条是换用同层另一件装置做主动作，点名那件装置。' : ''}她若还在挣扎，可以有一条是看她反抗、再决定怎么接。四条选项不要用同一个收尾短语（例如「看她嘴硬到什么时候」），每条的句式也要不同。`,
    NARRATIVE_PROGRESS_PROMPT,
    `【历史摘要：仅作资料】\n${summary || "暂无"}`,
    buildMemoryContext(memory), buildTurnContext(character), buildProgramResultContext(result),
    ...(proseStyle === 'dense' ? [DENSE_ORGAN_RULES] : []),
    ...(devTraitsPromptLine(character.bodyDevelopment) ? [devTraitsPromptLine(character.bodyDevelopment)] : []),
    ...(keeper?.threat ? [keeper.threat] : []),
    ...(keeper?.bondNote ? [keeper.bondNote] : []),
    ...(keeper?.lureNote ? [keeper.lureNote] : []),
    ...(keeper?.combos ? [keeper.combos] : []),
    ...(phaseText ? [phaseText] : []),
    ...(keeper?.antiRepeat ? [keeper.antiRepeat] : []),
    MOAN_NOTE,
    moanTierLine(character.pleasure ?? 0, quiet),
    dialogueStateLine(character, quiet),
    TERMS_RULE.replace('对你的称呼', '对城主的称呼'),
    ...(dkBodyTermsLine(character) ? [dkBodyTermsLine(character)] : []),
  ].join('\n\n')
}

function entranceOrder(characterName: string, keeper: KeeperPromptContext | null): string {
  const dungeon = keeper?.dungeonName || '这座地下城'
  const temper = keeper?.dungeonDescription?.trim()
  return `先写${characterName}自己走进「${dungeon}」的过程。自始至终是她自己的脚在走，城主不牵她，也不把她送进去。写她怎么跨进门，入口和往下那段路的光线、气味、湿度和她的戒备。${temper ? `这座狱的脾气写进这段路：${temper}。` : ''}这段路写完，才写她进来之后遇上的事。开场不要已经按住她，不要已经触发装置，也不要已经认主。`
}

/** 开场那一条用户命令。她自己走进来，差别只在进门之后遇上什么。收藏室召回是例外：人被直接传送。 */
export function buildOpeningUserPrompt(characterName: string, keeper: KeeperPromptContext | null): string {
  const entrance = entranceOrder(characterName, keeper)
  const summary = keeper?.defenseSummary?.trim() ? `${keeper.defenseSummary.trim()} ` : ''
  if (keeper?.return === 'train') {
    const cage = keeper.defenseName || '普通地牢'
    return `不要写${characterName}走进地下城。这是新的一轮调教，不是上一场的结尾。她已经在「${cage}」里。不要接着上次停下的动作、姿势和句子往下写。先写这一轮开始时她在这只牢笼里的样子，再写城主走进去动手。${summary}四个选项是这一轮不同的调教命令。`
  }
  if (keeper?.return === 'recall' && keeper.opening === 'trap') {
    return `不要写${characterName}自己走进来。城主把她直接传送进「${keeper.dungeonName || '这座地下城'}」，扔进「${keeper.defenseName ?? '陷阱'}」。她没有跨门。按这件陷阱的机制写她出现在装置里的第一段。${summary}四个选项是城主对这件陷阱的不同命令。`
  }
  if (keeper?.return === 'recall') {
    return `不要写${characterName}自己走进来。城主把她直接传送进「${keeper.dungeonName || '这座地下城'}」的迷宫。她没有跨门。写她出现在当前房间里的第一眼。没有程序判定的新遭遇，就不要让她已经掉进陷阱。${summary}四个选项是城主接下来的不同命令。`
  }
  if (keeper?.return === 'reexplore') {
    return `${entrance}她是自己回来再次探索的，不是第一次闯入。进来之后她自己往前。没有程序判定的新遭遇，就不要让她掉进陷阱。${summary}四个选项是城主接下来的不同命令。`
  }
  if (keeper?.return === 'pretend') {
    return `${entrance}城主假装放走她。她以为自己已经被放出地下城，自己往出口走。路上已经布置的陷阱和魔物还在，但这一段开场不要提前触发。${summary}四个选项是城主看她往外走时还能下的不同命令。`
  }
  if (keeper?.opening === 'trap') {
    return `${entrance}进来之后她很快踩进「${keeper.defenseName ?? '陷阱'}」。按这件陷阱的机制写她被引进、被触发的第一段。四个选项是城主对这件陷阱的不同命令。`
  }
  if (keeper?.opening === 'monster') {
    return `${entrance}进来之后她迎面撞上守在这段路上的「${keeper.defenseName ?? '魔物'}」。写魔物按命令接触她的第一段。四个选项是城主对这只魔物的不同命令。`
  }
  if (keeper?.opening === 'corridor') {
    return `${entrance}进来之后城主只在后面看她自己往前。没有程序判定的新遭遇，就不要让她掉进陷阱。四个选项是城主接下来的不同命令。`
  }
  if (keeper?.defenseName === '收藏室') {
    return `${entrance}这是她自己又走进来，不是第一次闯入。${keeper.defenseSummary ?? ''}按历史摘要和长期记忆里的事实写她认得城主、认得自己的身体。不要把旧对话重演一遍。四个选项是城主的不同命令。`
  }
  return `${entrance}开场从她进来的动机写起（见「进来的原因」），用她自己的方式进门，不要套「推门、霉味、石阶、苔洞、城主伸手」这条固定路线。进来之后她在当前房间遇上城主。写城主的手这才碰到她之后的第一反应。她还没有认主。四个选项是城主的不同命令。`
}

/** 状态修复只交 JSON。不附带带有非法占位数字的全文格式示例。 */
export function buildStateRepairPrompt(errors: string[]): string {
  return [
    '本请求只修复状态数据。仅输出一个 [STATS:单行JSON] 和一个 [DESC:单行JSON]。',
    '不要写正文、选项、场景标签、代码围栏或解释。不要照抄格式示例里的 -1、空尺寸和全 0。',
    '以当前状态快照为底稿。只改本回合真正变了的 hp、pleasure、desire、encounter、statusEffects、measurements。floor 与 bodyDevelopment 的等级和 exp 原样抄快照。',
    'STATS 只含 hp、pleasure、desire、floor、encounter、measurements、bodyDevelopment、statusEffects。不要写 maxHp 或 explorationProgress。',
    'hp 是 0 到快照 maxHp 的整数。pleasure 与 desire 是 0 到 100 的整数。encounter 为 null 或含 id、name、kind、summary、restraint 的对象，kind 只能是 trap 或 monster。statusEffects 的 id 只用英文小写、数字和下划线，不能重复。measurements 是不带单位的数字字符串。',
    'DESC 只含 breast、clitoris、urethra、vagina、anus。没有新的身体描写就沿用快照里的描述，每条不超过 300 字。',
    `上次没通过的字段：${errors.join('、') || '结构'}`,
  ].join('\n')
}

/** 开场按钮上方的场景引导文案。 */
export function startScreenCopy(keeper: KeeperPromptContext | null): { title: string; lines: string[] } {
  if (keeper?.return === 'train') {
    const cage = keeper.defenseName || '普通地牢'
    return { title: `新的一轮 · ${cage}`, lines: ['铁锁已落，她正被困在这只囚笼中无处可逃。推门进去，开启新一轮专属调教。'] }
  }
  if (keeper?.return === 'recall' && keeper.opening === 'trap') {
    return { title: '她被扔进陷阱', lines: ['传送法阵已在机关正中亮起，她将直接跌入你指定的陷阱。下方四道命令决定机关如何折磨她。'] }
  }
  if (keeper?.return === 'recall') {
    return { title: '她被传送进迷宫', lines: ['退路已封，传送阵将她直接投进迷宫深处。接下来由你下令如何猎捕她。'] }
  }
  if (keeper?.return === 'reexplore') {
    return { title: '她自己回来探索', lines: ['明知地底凶险，她仍按捺不住再次踏入迷宫。身体还留着上次的记忆，静待你的下一手布置。'] }
  }
  if (keeper?.return === 'pretend') {
    return { title: '她以为自己被放走', lines: ['她以为重获自由，正跌跌撞撞往出口赶去——却不知沿途的陷阱与魔物仍在暗处伺机而动。'] }
  }
  return {
    title: '她自己走进来',
    lines: [
      '沉重的石门已在她身后合拢。沿着幽湿石阶步入深渊的猎物，即将撞上你布下的第一道款待。',
      '每回合下方会给出四道不同方向的城主命令，也可在输入框自由下令调教。',
    ],
  }
}

/** 站在牢笼外看她被这只牢笼折磨。这段会替换收藏室里的记录。 */
export function buildWatchPrompt(input: { name: string; cageLabel: string; holds: string; watch: string; fate: string; pleasure: number; desire: number; brands?: string; ledger?: string; terms?: string }): string {
  const previous = input.ledger?.trim()
  return [
    `城主没有走进「${input.cageLabel}」，只站在外面看${input.name}。`,
    input.holds,
    input.watch,
    `她此刻的处置是「${input.fate}」，快感 ${input.pleasure}，欲望 ${input.desire}。`,
    input.brands?.trim() ? `身上已有的烙印还在：${input.brands.trim()}。接着写，不要洗掉。` : '',
    previous ? `上一份牢笼记录只作参考，不要照抄，按现在这只牢笼重写：${previous.slice(0, 180)}` : '还没有牢笼记录。不要把她上一次闯城的结尾再演一遍。',
    input.terms ?? '',
    '写 320 到 520 字。第三人称。写这只牢笼现在如何折磨她，城主只在外面看，不伸手，不发令。不要写选项，不要写标记，不要写 JSON。',
  ].filter(Boolean).join('\n')
}

/** 处置之后的短场面。只要正文，不要标记。 */
export function buildAftermathPrompt(input: { name: string; action: string; brief: string; pleasure: number; desire: number; recall?: string; longer?: boolean; terms?: string }): string {
  const remembered = input.recall?.trim()
  return [
    `城主刚刚对${input.name}选择了「${input.action}」。`,
    input.brief,
    `她此刻快感 ${input.pleasure}，欲望 ${input.desire}。`,
    remembered ? `她记得的事，只能当作已经发生的事实：${remembered.slice(0, 180)}` : '',
    input.terms ?? '',
    input.longer
      ? '写 120 到 200 字。第三人称。她被传送回城市，按上面的场景写这一段落在她身上的事。不要写选项，不要写标记，不要写 JSON。'
      : '写 80 到 160 字。第三人称，写这个选择落在她身上之后立刻发生的事。不要写选项，不要写标记，不要写 JSON。',
  ].filter(Boolean).join('\n')
}
// ---------------------------------------------------------------------------
// 2) 故事摘要与长期记忆由 adventure-memory.ts 统一维护
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 3) 场内拷问生成。这不是陷阱工房，也不会存进廊道。
// ---------------------------------------------------------------------------

export function buildInterrogationPrompt(
  character: Character,
  hints?: string[],
  currentLocation = '未知区域',
  proseStyle: ProseStyle = 'standard',
  focusParts?: string[],
  seed = 1,
  scene?: InterrogationSceneContext,
): string {
  const bd = character.bodyDevelopment ?? { breast: 0, clitoris: 0, urethra: 0, vagina: 0, anus: 0 }
  const se = character.statusEffects ?? []
  const theme = getFloorTheme(character.floorThemes, character.floor ?? 1)
  const costume = character.costumeDescription?.trim() || '未记录'
  const status = se.map((item) => item.title).join('、') || '无'
  const proseBlock = proseStyle === 'dense' ? `\n${denseWorkshopBlock(seed)}\n` : ''
  const presence = scene ? (scene.keeperStepsIn ? 'present' : scene.presence) : 'present'
  const personaLines = [
    dossierLine('性格', character.personality),
    dossierLine('口癖', character.speech),
    dossierLine('死穴与敏感点', character.sexual),
    dossierLine('抵抗方式', character.otherDescription),
    dkTermsLine(character, presence),
    dialogueTurnHint(character, false),
  ].filter(Boolean).join('\n')

  const trap = scene?.encounterTrap
  const monster = scene?.encounterMonster
  const relays = scene?.floorDefenses ?? []
  const keeperPresent = presence === 'present'
  const sceneLines: string[] = []
  if (trap) {
    sceneLines.push(`生效中的陷阱：「${trap.name}」（${trap.category}，束缚 Lv${trap.restraint}）。机制：${trap.mechanism}。习性：${trap.habit}。禁止：${trap.ban}。可用加码：${trap.escalate.join('／')}。`)
  } else if (monster) {
    sceneLines.push(`缠住她的魔物：「${monster.name}」（束缚 Lv${monster.restraint}）。${monster.appearance} ${monster.behavior}${monster.habit ? ` 习性：${monster.habit}。` : ''}`)
  }
  if (scene?.cageHolds) {
    sceneLines.push(`当前牢笼设施：${scene.cageHolds}`)
  }
  if (relays.length > 0) {
    sceneLines.push(`同层可联动接力的其他布置：${relays.map((d) => `${d.kind === 'monster' ? '魔物' : '陷阱'}「${d.name}」（${d.summary}）`).join('；')}`)
  }
  if (scene?.situation) {
    sceneLines.push(`进行中的现场处境（衣物破损/拘束姿势以此为准，优先于初始服装）：${scene.situation}`)
  }
  if (scene?.recentExcerpt) {
    sceneLines.push(`上一轮末尾现场摘录（顺着这个姿势与状态往下接，不要重置场面）：${scene.recentExcerpt}`)
  }

  const actorRule = trap
    ? (keeperPresent
      ? `她正被「${trap.name}」捆缚固定着（束缚 Lv${trap.restraint}）。这一手必须借用「${trap.name}」现有的拘束与机制，由城主走近插手或下令机关同步加码，绝不能无视身上正缠着的陷阱另起炉灶。`
      : `她正困在「${trap.name}」里，且城主此刻在幕后操控、并未现身。这一手必须完全通过驱动「${trap.name}」（及同层已布置魔物/环境）来加码折磨她，遵守其禁止项（${trap.ban}），严禁写成城主本人瞬移伸手触碰她！`)
    : monster
      ? (keeperPresent
        ? `她正被魔物「${monster.name}」缠住。这一手由城主当面下令「${monster.name}」配合城主的手/器具一起折磨她。`
        : `她正被魔物「${monster.name}」缠住，城主在暗处驱使魔物执行这一手，不要写城主本人现身伸手。`)
      : !keeperPresent
        ? (relays.length > 0
          ? `城主此刻不在现场露面。请驱动本层已有的布置（${relays.map((r) => `「${r.name}」`).join('、')}）或当前房间「${theme.name}」的环境特征（${theme.ambience}）直接对她发难，不要写城主肉身现身。`
          : `城主此刻不在现场露面。请直接利用当前房间「${theme.name}」的环境异变（${theme.ambience}）对她此刻的身体发难，不要写城主肉身现身，也不要凭空变出未布置的机械。`)
        : scene?.cageHolds
          ? `她在「${currentLocation}」内，结合牢笼原有的设施（${scene.cageHolds}）与城主亲手的动作完成这一手。`
          : '生成一种城主此刻亲手用在这名闯入者身上的新拷问方式。'

  const list = (hints ?? []).filter(Boolean)
  const dynamicCatalog = trap
    ? trap.escalate.map((e) => `   - 机关加码：${e}`).concat(relays.map((r) => `   - 同层接力：让「${r.name}」趁机介入`)).join('\n')
    : INTERROGATION_METHODS.map((item) => `   - ${item.name}：${item.hint}`).join('\n')
  const typeRule = list.length >= 2
    ? `1. 本次必须把下面几种手段融合进当前现场同时施力，不要罗列成几段无关的玩法：
${list.map((hint) => `   - ${hint}`).join('\n')}`
    : list.length === 1
    ? `1. 本次必须围绕下面这一招，顺着她此刻的现场处境与身体状态往下做：
   ${list[0]}`
    : `1. 自选一种贴合当前现场的新折磨手法。不要写成她重新走路去踩新陷阱。可以从这些方向里挑，或结合现场装置发挥：
${dynamicCatalog}`
  const focus = (focusParts ?? []).filter(Boolean)
  const focusRule = focus.length
    ? `\n\n【部位特化】这一手怎么做，以及她立刻的反应，都必须重点针对以下部位：${focus.join('、')}`
    : ''
  return `你现在是城主的现场折磨与拷问生成器。${actorRule}这不是廊道里等她踩的陷阱，也不会存进陷阱工房。语气与主叙述一致。本请求只输出拷问资料，不输出选项和状态 JSON。不要把城主写成被拷问的人。不要写她自己走进装置。

当前闯入者：${character.name}（${raceLabel(character.race)}）
当前层主题：${theme.name}。${theme.ambience}
初始服装与外观：${costume}
当前状态：快感 ${character.pleasure}/100，欲望 ${character.desire}/100，堕落 ${corruptionOf(character)}/100
身体开发度：胸部 Lv${bd.breast ?? 0}、阴蒂 Lv${bd.clitoris ?? 0}、尿道 Lv${bd.urethra ?? 0}、阴道 Lv${bd.vagina ?? 0}、肛门 Lv${bd.anus ?? 0}
异常状态：${status}
当前位置：${currentLocation}
${sceneLines.length ? `\n【当前现场与装置实况（必须严格贴合，不可穿帮）】\n${sceneLines.map((l) => `- ${l}`).join('\n')}\n` : ''}${personaLines ? `\n【角色人设与称呼（反应必须贴合她的口吻与死穴）】\n${personaLines}\n` : ''}
【文风禁令】
她身上不用屌、鸡巴、肉棒、屌肉这类男性词：她的阴道写屄肉、穴肉、里面。
禁用：不知过了多久、就在这时、空气仿佛凝固、邪魅一笑、磁性的嗓音、深邃的眸子、像断了线的木偶、像一滩烂泥、像受惊的小鹿、前所未有的、灭顶的快感、理智的弦断裂、如潮水般袭来。
重口行话可用，但同一标签不要连用两次。${proseBlock}
【生成要求】
${typeRule}${focusRule}

篇幅：这一手怎么做 150 至 220 字。她立刻的反应 80 字以内。若启用重油文风，这一手可到 500 字，被点名的主部位使用词库里两到四个质地词，连在部位名词前面。
内容必须同时满足：
1. 紧扣上面的【当前现场与装置实况】写这一手如何落在她身上，收到身体第一反应即收。衣物现状和种族特征要进入这一手。
2. 拷问名称要能看出手法与现场装置，不只有色情词，也不要写成陷阱名。
3. 第三人称。人在哪里、被什么困着，就顺着那个姿势做。不要新造一件她会踩中的机关。
4. 她立刻的反应只写嘴和身体这一下怎么接，保留她的自称、当前档位称呼与快感/堕落刻度。不写后续逃脱，不写玩坏或放走，不写致残。

严格输出：
【拷问名称】xxx
【这一手怎么做】
（第三人称，150～220 字；重油时最多 500 字，主部位连上质地词）

【她立刻的反应】
（80 字以内）
`
}

/** 从随机拷问输出中提取纯粹的「施力行动指令」，剥离【她立刻的反应】以免替主回合抢戏重复。 */
export function extractInterrogationCommand(raw: string): string {
  const cleaned = raw.replace(/\[(?:SCENE|STATS|DESC):[\s\S]*$/gi, '').trim()
  const nameMatch = cleaned.match(/【拷问名称】\s*([^\n]+)/)
  const howMatch = cleaned.match(/【这一手怎么做】\s*([\s\S]*?)(?=\n\s*【她立刻的反应】|$)/)
  const how = howMatch?.[1]?.trim()
  if (how) {
    const title = nameMatch?.[1]?.trim()
    return title ? `【${title}】${how}` : how
  }
  return cleaned.replace(/【她立刻的反应】[\s\S]*$/, '').trim()
}

const WORKSHOP_BAN = `【文风禁令】
禁用：不知过了多久、就在这时、空气仿佛凝固、邪魅一笑、磁性的嗓音、深邃的眸子、像断了线的木偶、像一滩烂泥、像受惊的小鹿、前所未有的、灭顶的快感、理智的弦断裂、如潮水般袭来。
重口行话可用，但同一标签不要连用两次。`

/** 陷阱工房：设计一件可重复布置的陷阱，不绑定某一名闯入者。 */
export function buildWorkshopTrapPrompt(proseStyle: ProseStyle = 'standard', hint = '', focusParts: string[] = [], category = '', seed = 1): string {
  const proseBlock = proseStyle === 'dense' ? `\n${denseWorkshopBlock(seed)}\n` : ''
  const focus = focusParts.filter(Boolean)
  return `你是城主的陷阱工房。设计一件可以反复布置、用来对付以后闯进来的人的陷阱。玩家是城主。不要写某一名具体闯入者的名字，也不要把城主写成被抓住的人。
${hint ? `城主要的方向：${hint}` : '方向由你定。不要写成看不出房间特征的通用触手坑。'}
${focus.length ? `机制要重点照顾这些部位：${focus.join('、')}。` : ''}

${WORKSHOP_BAN}${proseBlock}
篇幅：触发描写 150 至 220 字。机械摘要 40 字以内，只写束缚方式和主要部位。若启用重油文风，触发描写可到 500 字，被点名的主部位必须连上质地词。

习性 20 字以内：这件陷阱"做事的脾气"，比如耐心、贪婪、戏弄、刻板，以后每一轮都按这个脾气动作。
${category ? `类别：${category}。机制要符合这一类：${CATEGORY_SHEET[category]?.mechanic ?? ''}；禁止：${CATEGORY_SHEET[category]?.ban ?? ''}。` : ''}

严格输出：
【陷阱名称】
【触发描写】
【机械摘要】
【习性】
`
}

/** 魔物工房：设计一只听城主命令的魔物。 */
export function buildMonsterPrompt(proseStyle: ProseStyle = 'standard', hint = '', focusParts: string[] = [], seed = 2): string {
  const proseBlock = proseStyle === 'dense' ? `\n${denseWorkshopBlock(seed)}\n` : ''
  const focus = focusParts.filter(Boolean)
  return `你是城主的魔物工房。设计一只可以反复放出、用来对付闯入者的魔物。它听城主的命令。不要把城主写成被侵犯的一方，也不要写某一名具体闯入者的名字。
${hint ? `城主要的方向：${hint}` : '方向由你定。不要重复成一只只会包住人的普通史莱姆。'}
${focus.length ? `偏好和主要照顾的部位：${focus.join('、')}。` : ''}

${WORKSHOP_BAN}${proseBlock}
篇幅：外观 80 字以内。行为 120 到 220 字，写它按命令接触人时怎么动作、先缠哪里。习性 20 字以内：这只魔物的脾气（如护食、慢条斯理、爱挑逗、刻板守令），以后出场都按这个脾气动作。若启用重油文风，行为可到 500 字，被点名的主部位必须连上质地词。

严格输出：
【魔物名称】
【外观】
【行为】
【习性】
`
}
