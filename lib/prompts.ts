import { CATEGORY_SHEET, hitLine, hitPreview, phaseLine, phaseFromPleasure } from '@/lib/trap-craft'
import { TERMS_RULE } from '@/lib/terms'
import { buildTurnContext, buildProgramResultContext, REPLY_PROTOCOL_PROMPT, NARRATIVE_PROGRESS_PROMPT, type ProgramTurnResult } from '@/lib/adventure-context'
import { buildMemoryContext, emptyMemory, type AdventureMemory } from '@/lib/adventure-memory'
import type { KeeperPromptContext } from '@/lib/keeper'
import { Character, INTERROGATION_METHODS, Race, RACE_INFO, getFloorTheme, ProseStyle, type ImagePromptFamily } from '@/lib/types'

// 第一版重油：固定词库贴在部位前面。不抽词，不走三股和巡礼。
const PROSE_STYLE_PROMPTS: Record<ProseStyle, string> = {
  standard: '',
  dense: `【文风：重油堆叠】
本段覆盖文风禁令里「禁止套用现成比喻」和「不得重复同一个喻体」。转场套话和言情滥腔仍然禁止。禁止照抄范文里的人名、年数、符箓、女仙和地名。
1. 本回合正文里被触碰、被看或被说出的词库部位，使用该词库的质地原词两到四个（主部位多用，次要部位少用），连在部位名词前面。可以调整顺序，不要换成更干净的同义词。没被写到的部位一句带过。
2. 可以用性用途或性史作定语。乳房和奶头上，「胀、漏、敏感、一挤就出」可以再出现；阴蒂上，「肥、大、硬、一捏就出」可以再出现；阴道和肛门上，「肥、嫩、紧、一拨就湿」可以再出现；尿道上，「肥、嫩、紧、一插就进」可以再出现。同一句不要把同一个说法写两遍。
3. 每个主画面至少调动质感、温度、气味、声音中的三样，并绑定到具体部位，不要空泛写「雌臭弥漫」。
4. 喻体必须本回合新写，禁止复用上一回合已用过的喻体。乳房和奶头允许使用蜜瓜、山峦、圆饼、椰枣、筛子、决堤。阴道允许使用馒头、蜜桃。「馒头」只许写阴道，不许拿去写别的部位。阴蒂允许使用红果子。「红果子」只许写阴蒂。肛门允许使用肉菊。「肉菊」只许写肛门。禁止把「吊钟、奶山、肉山、磨盘、螺纹、章鱼嘴」当作固定公式。
5. 乳房、奶头、阴蒂、阴道、尿道和肛门每段可以用两到三个能拆开读懂的复合词。其他部位每段最多一个自造四字词。
6. 细节要闭环：颜色、道具、服装前后呼应。挤出或渗出的液体要落到衣襟、肚兜、衣裤或皮肤上，留下痕迹。
句法：对白先点出分量或敏感，下一句立刻用动作验证。尺寸落到眼前的身体上，例如有脑袋大、能埋住脸、半截指节。收束时可以邀请对方亲手掂一掂或验一验。
【乳与奶头词库】
乳肉：脂附油肥、厚脂满溢、雌腻爆硕、糯软肥奶、沉甸甸、圆肥挺翘、鼓胀饱满、痴肥溢汁、乳香肉奶、厚腻骚焖、肉厚焖肥、爆乳、糜腴肉浪、颤巍巍、弹嫩雪滑、厚重肥乳、下流肥奶、宽厚浑圆、尺寸豪硕、深乳沟、油亮雌汗。
奶头：肥肿酡红、厚肉奶头、肥长奶头、直挺挺、外头软里头硬、圆饼乳晕。
动作：托起、五指陷入、轻挤、捏住、掀开遮挡、舌尖绕着乳晕、含住吸吮、咬住奶孔往外扯、隔着衣料蹭、依偎时奶肉从缝里溢出来。
只有角色正在泌乳、带有泌乳状态，或本回合剧情已经写出奶水时，才使用：奶孔合不拢、奶孔翕张、奶珠、乳白浓浆、奶痕、漏奶的筛子、嗤地喷出、咕嘟咕嘟、又腥又甜、决堤、衣襟洇湿。没有奶水依据时，只写肥、沉、软、油和晃，不要写喷奶。
【阴道词库】
屄肉：肥厚无毛、馒头肉屄、粉嫩屄肉、油亮水光、肥嫩多汁、厚实宣软、雌臭排卵、滑嫩肥屄、肥厚饱满、肥厚软糯、外头软里头紧得发烫。
唇缝：肥厚阴唇、阴唇翕张、粉嫩屄缝、屄口翕张。
动作：掀开遮挡、指尖拨开阴唇、舌头舔开屄缝、含住用力吸、隔着衣料在大腿上蹭。
渗出、淫痕、把阴唇浸得油亮，可以在这个部位被拨开、舔到或说出来时使用。喷出老远、决堤、咕嘟咕嘟往外喷，只在本回合写高潮时使用。没有高潮时不要写喷水。
【阴蒂词库】
肉粒：硕大红润、肥硕饱满、油亮、挺在屄肉顶端、直挺挺地翘着、半截指节长短、外头软里头胀得发硬。
肉孔：阴蒂尖端一粒肉孔、肉孔翕张。
动作：指尖捏住、缓缓一挤、舌头卷住、含住用力吸、牙齿咬住肉孔往外扯。
渗出、淫痕、把阴唇浸得油亮，可以在阴蒂被捏住、舔到或说出来时使用。嗤地喷出、喷出老远、决堤、咕嘟咕嘟往外喷，只在本回合写高潮时使用。没有高潮时不要写阴蒂喷水。
【肛门词库】
穴口：粉嫩鲜红、多褶屁穴、紧致肥焖屁眼、粉嫩肉褶、屁眼翕张、肥厚饱满、油亮水光、外头软里头紧得发烫。
臀：肥厚软糯的臀肉、臀缝、直挺挺地翘着。
动作：双手掰开臀肉、指尖拨开肉褶、舌头舔开肉褶、含住用力吸、隔着衣料在大腿上蹭。有尾巴的角色可以先把尾巴翘起来再掰。没有尾巴就不要写尾巴。
渗出、肠液、淫痕、把臀缝浸得油亮，可以在这个部位被掰开、舔到或说出来时使用。喷出老远、决堤、咕嘟咕嘟往外喷，只在本回合写高潮时使用。没有高潮时不要写喷肠液。
【尿道词库】
质地：又肥又嫩、最是紧致、外头软里头紧得发烫。
动作：舌头舔开、指尖插进去、磨蹭、轻轻一插。
不要把屁眼、肉褶、肠液、肉菊写到尿道上。
渗出可以在尿道被舔到、被插入或说出来时使用。喷出老远、决堤、咕嘟咕嘟往外喷，只在本回合写高潮时使用。没有高潮时不要写尿道喷水。
同一段里同一个喻体最多两次。用词库里的原词来写，不要把词库的标题和顿号列表原样抄进正文。`,
}

const DENSE_LEXICON_NOTE = `【重油用词】碰到身体的这一步，字数以本回合硬性要求里的字数为准。往里赶、观察、停手、换层仍按前面的短篇幅，不新写性行为。正文写到乳、奶头、阴蒂、阴道、尿道或肛门时，部位第一次出场时从对应词库或【本回合质地词】里取两到三个质地词连在前面；同一回合再提到这个部位时，改用动作、代称（那圈、入口、里面）或感官结果来写，不再叠形容词。同一个质地词每回合最多用一次（限制的是重复，不是总数，叠词串照样要写够）。可以换成同样露骨的新说法，但不要退回奶子很大、小穴湿润这类普通说法，也不要把词库列表原样抄出来。【禁用表】「肉褶」「翕张」「一缩一缩」「油亮水光」「像有人」每回合最多一次；「不是……而是……」「不是……，是……」句式每回合最多一次；角色专属部件（尾巴尖、丝袜）每回合最多出场两次。没写到的部位不要硬堆。喷奶和喷水仍只按词库里的条件使用。`

/** 把当前快感对应的那一档单独点出来，并给出硬性下限。 */
export function moanTierLine(pleasure: number): string {
  const p = Math.round(pleasure)
  if (p >= 80) return `【本回合淫叫档：快感 ${p}，≥ 80 档】一到两句台词带六个字以上的长串淫叫（齁加一串拉长的元音再接破折号和叠感叹号，可以连用 ❤❤），高潮那一句可以几乎全是叫声；其余台词换别的形态：说不完的半句、只剩喘息、问句、求饶，或者原作口吻的一句逗弄。❤ 不必句句都有。至少一处同一个词三连。仍要保留她的口癖和半句真话。`
  if (p >= 60) return `【本回合淫叫档：快感 ${p}，60～79 档】大约一半台词夹一声，一两句出现「齁」接三到五个字的拉长元音，❤ 用在叫声上而不是每句句尾，至少一处叠感叹号和一处被叫声截断的半句；其余台词用她原作的口吻说话。`
  if (p >= 40) return `【本回合淫叫档：快感 ${p}，40～59 档】以口吃、喘息和短促惊叫为主，「齁」最多一次，❤ 全段最多两三个，拉长不超过三个字。嘴上还在逞强。`
  return `【本回合淫叫档：快感 ${p}，< 40 档】只写喘息和压着的声音，不用 ❤，不用「齁」。`
}

const MOAN_NOTE = `【淫叫，以这里为准】上面「不为凑字数重复拟声」「软约束」都不压过这一段。淫叫跟着快感分档走，档越高，拉得越长、断得越碎、❤ 越多：
- 快感 < 40：只有喘息和压着的声音（嗯……、唔、哈啊），话基本说得完整，不用 ❤。
- 40～59：开始口吃和短促的惊叫（咿！、噫——），句尾偶尔带一个 ～ 或一个 ❤，嘴上还在逞强或拒绝。
- 60～79：多数台词夹一声，「齁」开始出现；元音拉长到三五个字（哦哦哦、噫噫噫）；一句一到两个 ❤，可以叠感叹号；句子被淫叫截断，词开始重复。
- ≥ 80 或本回合高潮：长串淫叫六到十几个字（齁哦哦哦哦哦哦——！！❤❤），同一个词三连，半句话被叫声吞掉，❤ 可以连用三个。长串只放在一两句里，高潮那一句可以几乎全是叫声，其余台词仍要说出她此刻的感受、求饶或原作口吻的话。
- 嘴被占着时，叫声写成闷在喉咙里的唔唔唔、咕噜，夹在含糊的半句话里。
叫声要保留她本人的口吻（自称、口癖、对城主的称呼），不同角色叫法不同。叫声的位置和长短每句都换，不要每句都套「口吃 + 齁哦哦哦 + 自称的器官 + 要被你……了」同一个骨架；档越高，变化越多，不是每句越拉越长。前面几回合叫得少，是旧规则留下的，不要照着那个密度继续。往里赶、观察、停手、换层不用淫语。`

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
    qualityPrefix: '',
    negative: 'lowres, bad anatomy, bad hands, extra fingers, missing fingers, extra limbs, fused bodies, text, watermark, signature, child, loli, shota',
  },
  sdxl: {
    qualityPrefix: 'highly detailed, sharp focus',
    negative: 'lowres, bad anatomy, bad hands, extra digits, missing fingers, cropped, watermark, blurry, child, loli, shota',
  },
  flux: {
    qualityPrefix: '',
    negative: 'child, loli, shota',
  },
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

/** 图片 API 顺序：外观锚点，然后场景标签。SDXL 才在最前加质量前缀；Flux 改成一句英文。 */
export function buildImagePrompt(options: {
  scene?: string
  character?: { name?: string; danbooruTags?: string }
  extraTags?: string[]
  family?: ImagePromptFamily
}): { prompt: string; negative: string } {
  const family = options.family ?? 'illustrious'
  const profile = IMAGE_PROMPT_PROFILES[family]
  const anchor = buildAppearanceAnchor(options.character ?? {})
  const scene = withQualityPrefix(options.scene ?? '')
  const extras = (options.extraTags ?? []).flatMap(splitPromptTags)
  if (family === 'flux') {
    const sceneClause = [scene, ...extras].filter(Boolean).join(', ')
    return { prompt: `${anchor}. ${sceneClause}.`, negative: profile.negative }
  }
  const tags = dedupeTags([
    ...splitPromptTags(profile.qualityPrefix),
    ...splitPromptTags(anchor),
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
音节：齁、哦、噢、噫、咿、嗯、唔、呜、啊、哈、呃、嗷。「齁」是招牌，常接拉长的元音：齁哦哦哦、齁噫噫、齁唔。
口腔拟声只在口交、深喉、舌吻、吸吮时用：咕啾、咕滋、啾噜、咕噜噜、噗啾，嘴被堵住时写成闷声的唔唔唔。
标记：❤ 贴在淫叫或句尾，可以连用（❤❤）；感叹号可以叠（！！）；「……」写喘不上气的断续；「——」写被顶断、拉长或说不完的半句；「～」写撒娇或拖长的尾音。
断词：口吃（别、别动……）、同一个词连说（不要不要、进去了进去了进去了）、一句话说到一半被淫叫截断，后半句接着说完或说不完。
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
  const lines = [
    `名字：${character.name}`,
    `种族：${raceLabel(character.race)}`,
    dossierLine('种族特性', RACE_INFO[character.race]?.trait),
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

export function buildSystemPrompt(character: Character, summary = '', proseStyle: ProseStyle = 'standard', result: ProgramTurnResult | null = null, memory: AdventureMemory = emptyMemory(), keeper: KeeperPromptContext | null = null): string {
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
${PROSE_STYLE_PROMPTS[proseStyle] ? `\n${PROSE_STYLE_PROMPTS[proseStyle]}\n` : ''}
【色情状态影响规则】
1. 欲望越高，闯入者越难把拒绝说完整，身体越容易先于嘴巴反应。她仍可能咬人、夹紧、骂人或找出口。欲望高不等于四条命令变成同一件事。
2. 快感本回合新跨过 80 时，写一次与当前刺激对应的高潮，生理反应从喷潮、失禁、痉挛、失焦中选本回合真正发生的，不要四项全写。
3. 快感已经 ≥ 80 且本回合没有新的更强刺激时，写余韵、衰竭、敏感过载或刺激差异，禁止把上一回合的高潮再演一遍。高潮后必须在 STATS 里给出回落后的 pleasure，没有依据不得维持满值。
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
    ...(proseStyle === 'dense' ? [DENSE_LEXICON_NOTE] : []),
    ...(keeper?.threat ? [keeper.threat] : []),
    ...(keeper?.combos ? [keeper.combos] : []),
    ...(phaseText ? [phaseText] : []),
    ...(keeper?.antiRepeat ? [keeper.antiRepeat] : []),
    MOAN_NOTE,
    moanTierLine(character.pleasure ?? 0),
    TERMS_RULE.replace('对你的称呼', '对城主的称呼'),
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

/** 开场按钮上方的两句说明。没有收藏室回场时，仍是她自己走进来。 */
export function startScreenCopy(keeper: KeeperPromptContext | null): { title: string; lines: string[] } {
  if (keeper?.return === 'train') {
    const cage = keeper.defenseName || '普通地牢'
    return { title: `新的一轮 · ${cage}`, lines: ['她已经在这只牢笼里。这一轮不接上一场的结尾。四个选项都是调教命令。'] }
  }
  if (keeper?.return === 'recall' && keeper.opening === 'trap') {
    return { title: '她被扔进陷阱', lines: ['不要写她自己走进来。她是被直接传送进去的。四个选项是对这件陷阱的命令。'] }
  }
  if (keeper?.return === 'recall') {
    return { title: '她被传送进迷宫', lines: ['不要写她自己走进来。她直接出现在迷宫里。四个选项是城主接下来的命令。'] }
  }
  if (keeper?.return === 'reexplore') {
    return { title: '她自己回来探索', lines: ['她自己走进来，想再探索一次。开场不要已经掉进陷阱。四个选项是城主接下来的命令。'] }
  }
  if (keeper?.return === 'pretend') {
    return { title: '她以为自己被放走', lines: ['她自己往出口走。路上的陷阱和魔物还在，这一段先别让她掉进去。四个选项是城主还能下的命令。'] }
  }
  return {
    title: '她自己走进来',
    lines: [
      '先写她进门、往下的那段路。进来之后才写她遇上什么：亲自是遇上你，陷阱是很快踩进去，魔物是迎面撞上，廊道是你在后面看。',
      '四个选项都是你还能下的不同命令。',
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
  focusParts?: string[]
): string {
  const bd = character.bodyDevelopment ?? { breast: 0, clitoris: 0, urethra: 0, vagina: 0, anus: 0 }
  const se = character.statusEffects ?? []
  const theme = getFloorTheme(character.floorThemes, character.floor ?? 1)
  const costume = character.costumeDescription?.trim() || '未记录'
  const status = se.map((item) => item.title).join('、') || '无'
  const proseBlock = PROSE_STYLE_PROMPTS[proseStyle] ?? ''
  const list = (hints ?? []).filter(Boolean)
  const catalog = INTERROGATION_METHODS.map((item) => `   - ${item.name}：${item.hint}`).join('\n')
  const typeRule = list.length >= 2
    ? `1. 本次必须把下面几种拷问方式融合成城主现在亲手做的一手。机制同时作用，不要罗列成几段无关的玩法：
${list.map((hint) => `   - ${hint}`).join('\n')}`
    : list.length === 1
    ? `1. 本次必须用下面这种拷问方式，按她现在的身体写城主这一手：
   ${list[0]}`
    : `1. 自选一种新的拷问方式。不要写成她走路会踩中的陷阱。可以从这些里挑，也可以另写一种城主现在能上手的方式：
${catalog}`
  const focus = (focusParts ?? []).filter(Boolean)
  const focusRule = focus.length
    ? `\n\n【部位特化】这一手怎么做，以及她立刻的反应，都必须重点针对以下部位：${focus.join('、')}`
    : ''
  return `你现在是城主的拷问生成器。生成一种城主此刻亲手用在这名闯入者身上的新拷问方式。这不是廊道里等她踩的陷阱，也不会存进陷阱工房。语气与主叙述一致。本请求只输出拷问资料，不输出选项和状态 JSON。不要把城主写成被拷问的人。不要写她自己走进装置。

当前闯入者：${character.name}（${raceLabel(character.race)}）
当前层主题：${theme.name}。${theme.ambience}
服装与外观：${costume}
当前状态：快感 ${character.pleasure}/100，欲望 ${character.desire}/100
身体开发度：胸部 Lv${bd.breast ?? 0}、阴蒂 Lv${bd.clitoris ?? 0}、尿道 Lv${bd.urethra ?? 0}、阴道 Lv${bd.vagina ?? 0}、肛门 Lv${bd.anus ?? 0}
异常状态：${status}
当前位置：${currentLocation}

【文风禁令】
她身上不用屌、鸡巴、肉棒、屌肉这类男性词：她的阴道写屄肉、穴肉、里面。
禁用：不知过了多久、就在这时、空气仿佛凝固、邪魅一笑、磁性的嗓音、深邃的眸子、像断了线的木偶、像一滩烂泥、像受惊的小鹿、前所未有的、灭顶的快感、理智的弦断裂、如潮水般袭来。
重口行话可用，但同一标签不要连用两次。
${proseBlock}

【生成要求】
${typeRule}${focusRule}

篇幅：这一手怎么做 150 至 220 字。她立刻的反应 80 字以内。若启用重油文风，这一手可到 500 字，被点名的主部位使用词库里两到四个质地原词，连在部位名词前面。
内容必须同时满足：
1. 写城主现在对她做的这一手，收到身体第一反应即收。服装和种族特征要进入这一手。
2. 拷问名称要能看出手法，不只有色情词，也不要写成陷阱名。
3. 第三人称。人在哪里就在哪里做。不要新造一件她会踩中的机关。
4. 她立刻的反应只写嘴和身体这一下怎么接。不写后续逃脱，不写玩坏或放走，不写致残。

严格输出：
【拷问名称】xxx
【这一手怎么做】
（第三人称，150～220 字；重油时最多 500 字，主部位使用词库原词）

【她立刻的反应】
（80 字以内）
`
}

const WORKSHOP_BAN = `【文风禁令】
禁用：不知过了多久、就在这时、空气仿佛凝固、邪魅一笑、磁性的嗓音、深邃的眸子、像断了线的木偶、像一滩烂泥、像受惊的小鹿、前所未有的、灭顶的快感、理智的弦断裂、如潮水般袭来。
重口行话可用，但同一标签不要连用两次。`

/** 陷阱工房：设计一件可重复布置的陷阱，不绑定某一名闯入者。 */
export function buildWorkshopTrapPrompt(proseStyle: ProseStyle = 'standard', hint = '', focusParts: string[] = [], category = ''): string {
  const proseBlock = PROSE_STYLE_PROMPTS[proseStyle] ?? ''
  const focus = focusParts.filter(Boolean)
  return `你是城主的陷阱工房。设计一件可以反复布置、用来对付以后闯进来的人的陷阱。玩家是城主。不要写某一名具体闯入者的名字，也不要把城主写成被抓住的人。
${hint ? `城主要的方向：${hint}` : '方向由你定。不要写成看不出房间特征的通用触手坑。'}
${focus.length ? `机制要重点照顾这些部位：${focus.join('、')}。` : ''}

${WORKSHOP_BAN}
${proseBlock}

篇幅：触发描写 150 至 220 字。机械摘要 40 字以内，只写束缚方式和主要部位。若启用重油文风，触发描写可到 500 字，被点名的主部位必须使用词库里的质地原词。

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
export function buildMonsterPrompt(proseStyle: ProseStyle = 'standard', hint = ''): string {
  const proseBlock = PROSE_STYLE_PROMPTS[proseStyle] ?? ''
  return `你是城主的魔物工房。设计一只可以反复放出、用来对付闯入者的魔物。它听城主的命令。不要把城主写成被侵犯的一方，也不要写某一名具体闯入者的名字。
${hint ? `城主要的方向：${hint}` : '方向由你定。不要重复成一只只会包住人的普通史莱姆。'}

${WORKSHOP_BAN}
${proseBlock}

篇幅：外观 80 字以内。行为 120 到 220 字，写它按命令接触人时怎么动作。机械摘要 40 字以内，只写它听令之后先做什么。若启用重油文风，行为可到 500 字，被点名的主部位必须使用词库里的质地原词。

严格输出：
【魔物名称】
【外观】
【行为】
【机械摘要】
`
}
