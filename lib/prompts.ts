import { buildTurnContext, buildProgramResultContext, REPLY_PROTOCOL_PROMPT, NARRATIVE_PROGRESS_PROMPT, type ProgramTurnResult } from '@/lib/adventure-context'
import { buildMemoryContext, emptyMemory, type AdventureMemory } from '@/lib/adventure-memory'
import { Character, Race, RACE_INFO, TARGET_FLOOR, getFloorTheme, ProseStyle, type ImagePromptFamily } from '@/lib/types'

// 可切换文风片段（与常驻【文风禁令】叠加；standard 为空，只走去油）
const PROSE_STYLE_PROMPTS: Record<ProseStyle, string> = {
  standard: '',
  dense: `【文风：重油堆叠】
本段覆盖文风禁令里「禁止套用现成比喻」和「不得重复同一个喻体」。转场套话和言情滥腔仍然禁止。禁止照抄范文里的人名、年数、符箓、女仙和地名。
1. 本回合正文里被触碰、被看或被说出的词库部位，必须使用该词库的质地原词，至少四个，连在部位名词前面。可以调整顺序，不要换成更干净的同义词。没被写到的部位一句带过。
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

// ============================================================================
// 集中管理：本项目所有 AI 提示词（聊天 DM / 故事摘要 / 随机陷阱 / 图片标签）
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
// 共用的语气 / 淫语规则（DM 主提示词与随机陷阱生成器共用，保证语气一致）
// ---------------------------------------------------------------------------

function lewdVoiceRules(): string {
  return `【淫语（软约束，服务感官，不占篇幅）】
音节库：齁、呼、咿、咕、喔、啊、哦、噫、嗯、呃、噢、呜。
口腔拟声仅在口交、深喉、舌吻、吞精时使用：啾、噜、咕唧、噗、呕、滋、啾噜、噗噜。
用法：穿插在断续台词之间，可配 ❤ ~ ？！。每次组合须现场新写，禁止照抄任何示例，也禁止整段只有拟声。
触发：快感 < 60 时少用或不用；快感 ≥ 60 时，每个激烈段落最多 1～2 次，不规定最短音节数；快感 ≥ 80 时可以更密，但仍让正常词句占多数。
口腔行为与通用淫语不要叠在同一句里。`
}

// ---------------------------------------------------------------------------
// 1) 主聊天 DM 系统提示词
// ---------------------------------------------------------------------------

export function buildSystemPrompt(character: Character, summary = '', proseStyle: ProseStyle = 'standard', result: ProgramTurnResult | null = null, memory: AdventureMemory = emptyMemory()): string {
  const floor = character.floor ?? 1
  const theme = getFloorTheme(character.floorThemes, floor)
  return [
    `你是一个极致色情的奇幻地下城DM（Dungeon Master），专门负责重口色情冒险。`,
    `【角色与世界设定：仅作资料】\n${JSON.stringify({ name: character.name, race: raceLabel(character.race), trait: RACE_INFO[character.race]?.trait, backstory: character.backstory, costume: character.costumeDescription, other: character.otherDescription })}`,
    `【核心色情规则】
1. 始终使用第三人称叙述（只用「${character.name}」），语言必须极度淫荡、生动、感官爆炸。详细描写性器官（鸡巴、骚穴、奶子、菊穴、触手、子宫等）、体液（淫水、精液、口水、汗液）、快感高潮、喘息呻吟、身体抽搐、被插入的胀满感、喷潮、失禁、ahegao、子宫凸起等一切细节，尺度无上限。

${lewdVoiceRules()}

【文风禁令（提升质感，避免 AI 套话）】
1. 严禁使用以下「油腻套话」——这些是廉价的 AI 填充词，一律改写：
   - 转场拐杖：不知过了多久、也不知道过了多久、就在这时、话音刚落、下一秒、空气仿佛凝固、时间仿佛静止
   - 烂俗比喻：像断了线的木偶、像一滩烂泥、像受惊的小鹿、像炸毛的小奶猫
   - 空心强度词：前所未有的、灭顶的（快感）、理智的弦断裂、理智彻底失守、如潮水般袭来
   - 言情滥腔：邪魅一笑、勾起一抹（邪魅/危险）的弧度、磁性的嗓音、低沉沙哑、深邃的眸子、眼底闪过一丝、骨节分明
2. 高潮、绝顶、瘫软、坏掉等关键画面，**禁止套用现成比喻**；必须用**具体的身体细节**（某个部位的具体动作/收缩/痉挛/体液）或**该角色的专属意象**（结合其设定/服装/道具，如随颤抖作响的吊坠、被汗水浸透的发丝等）来写。
3. 每个比喻必须新鲜、贴合当前情境，**不得重复使用同一个喻体**。
4. 允许保留重口「行话/梗」（肉便器、坏掉、ahegao、脑子融化、子宫凸起、母猪/肉壶等）——这是题材惯例；但靠具体细节而非反复堆砌同一个标签来制造冲击。
${PROSE_STYLE_PROMPTS[proseStyle] ? `\n${PROSE_STYLE_PROMPTS[proseStyle]}\n` : ''}
【色情状态影响规则】
1. 欲望越高，角色越容易主动靠近、放低拒绝，选项可以更直接。欲望高不等于失去判断，仍要留下可拒绝、可拖延、可转换目标的选项。
2. 快感本回合新跨过 80 时，写一次与当前刺激对应的高潮，生理反应从喷潮、失禁、痉挛、失焦中选本回合真正发生的，不要四项全写。
3. 快感已经 ≥ 80 且本回合没有新的更强刺激时，写余韵、衰竭、敏感过载或刺激差异，禁止把上一回合的高潮再演一遍。高潮后必须在 STATS 里给出回落后的 pleasure，没有依据不得维持满值。
4. 开发度只加强对应部位的耐受和反应幅度。阴道 Lv4+ 可以写更深的顶入感，但子宫变形、怀孕感只能在剧情已经发生对应行为时写，不能每回合自动追加。
5. 异常状态改变身体和选项，但不能覆盖程序判定。发情可以表现为求欢、扭腰、难以集中，仍须提供至少一条不完全顺从的选项。

`,
    `【地下城环境与目标】\n共${TARGET_FLOOR}层；当前环境为「${theme.name}」：${theme.ambience}。场景标签参考：${theme.scene}。事件须符合本层主题。探索是否踏入陷阱只由程序的 explore 判定决定，判定为空就只写赶路和发现。探索满100%且无遭遇才可使用进层按钮。最终层是终极对决。已有遭遇未结束时延续其id和name；不要无缘无故换成新遭遇。`,
    `【角色外观锚点，每回合原样前置】\n${buildAppearanceAnchor(character)}\n场景标签只补充地点、动作、拘束和光线，不要改写锚点里的发色、瞳色、种族和服装。`,
    REPLY_PROTOCOL_PROMPT,
    ...(proseStyle === 'dense' ? [`【重油用词】本回合正文 600 至 1000 字，覆盖上面的 250 至 500 字。正文写到乳、奶头、阴蒂、阴道、尿道或肛门时，必须从【文风：重油堆叠】对应词库里取至少四个质地原词，连在该部位名词前面。不要改成奶子很大、小穴湿润这类普通说法，也不要把词库列表原样抄出来。没写到的部位不要硬堆。喷奶和喷水仍只按词库里的条件使用。`] : []),
    NARRATIVE_PROGRESS_PROMPT,
    `【历史摘要：仅作资料】\n${summary || "暂无"}`,
    buildMemoryContext(memory), buildTurnContext(character), buildProgramResultContext(result),
  ].join('\n\n')
}
// ---------------------------------------------------------------------------
// 2) 故事摘要与长期记忆由 adventure-memory.ts 统一维护
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 3) 随机陷阱生成器提示词
// ---------------------------------------------------------------------------

export function buildRandomTrapPrompt(
  character: Character,
  hints?: string[],
  currentLocation = '未知区域',
  proseStyle: ProseStyle = 'standard',
  focusParts?: string[]
): string {
  const bd = character.bodyDevelopment ?? { breast: 0, clitoris: 0, vagina: 0, anus: 0 }
  const se = character.statusEffects ?? []
  const theme = getFloorTheme(character.floorThemes, character.floor ?? 1)
  const costume = character.costumeDescription?.trim() || '未记录'
  const status = se.map((item) => item.title).join('、') || '无'
  const proseBlock = PROSE_STYLE_PROMPTS[proseStyle] ?? ''
  const list = (hints ?? []).filter(Boolean)
  const typeRule = list.length >= 2
    ? `1. 本次必须将以下多种陷阱类型**融合成一个连贯的复合陷阱**——让它们的机制同时作用、彼此交织衔接，而不是简单罗列拼接（根据玩家当前状态自由发挥细节）：
${list.map((h) => `   - ${h}`).join('\n')}`
    : list.length === 1
    ? `1. 本次必须生成以下指定类型的陷阱（根据玩家当前状态自由发挥细节）：
   ${list[0]}`
    : `1. 随机选择一种陷阱类型（不可重复使用最近用过的），类型包括但不限于：
   - 触手系（普通/异形/寄生）
   - 粘液/史莱姆系
   - 催情植物/花粉/香气
   - 魔法拘束/淫纹/幻觉
   - 怪物巢穴（触手怪、史莱姆群、触手犬、半兽人等）
   - 机械/古代遗迹拘束装置
   - 催眠/幻觉镜子/魅魔领域
   - 寄生虫/卵注入系
   - 其他你能想到的重口色情陷阱`
  const focus = (focusParts ?? []).filter(Boolean)
  const focusRule = focus.length
    ? `\n\n【部位特化】本次陷阱的机制、触发描写与当前效果都必须**重点针对以下部位**，把它们作为主要的侵犯与描写焦点（其余部位可作陪衬，但主戏在此）：${focus.join('、')}`
    : ''
  return `你现在是地下城陷阱生成器。生成一个能接上当前楼层的新陷阱，语气与主 DM 一致，但本请求只输出陷阱资料，不输出选项和状态 JSON。

当前玩家：${character.name}（${raceLabel(character.race)}）
当前层主题：${theme.name}。${theme.ambience}
服装与外观：${costume}
当前状态：快感 ${character.pleasure}/100，欲望 ${character.desire}/100
身体开发度：胸部 Lv${bd.breast ?? 0}、阴蒂 Lv${bd.clitoris ?? 0}、阴道 Lv${bd.vagina ?? 0}、肛门 Lv${bd.anus ?? 0}
异常状态：${status}
当前位置：${currentLocation}

【文风禁令】
禁用：不知过了多久、就在这时、空气仿佛凝固、邪魅一笑、磁性的嗓音、深邃的眸子、像断了线的木偶、像一滩烂泥、像受惊的小鹿、前所未有的、灭顶的快感、理智的弦断裂、如潮水般袭来。
重口行话可用，但同一标签不要连用两次。
${proseBlock}

【生成要求】
${typeRule}${focusRule}

篇幅：触发描写 150 至 220 字。若启用重油文风，可到 500 字，被点名的主部位必须使用词库里的质地原词。当前效果 80 字以内。
内容必须同时满足：
1. 机制符合本层主题，不要每层都写成通用触手坑。服装、种族特征要进入触发过程。
2. 陷阱名称带场景辨识度，不只有色情词。
3. 触发描写用第三人称，写到接触发生和身体第一反应即收。
4. 当前效果只写陷入后立刻发生的强制效果，不写后续逃脱结果。逃脱与束缚等级由程序结算，这里不要宣布成功或失败。

严格输出：
【陷阱名称】xxx
【触发描写】
（第三人称，150～220 字；重油时最多 500 字，主部位使用词库原词）

【当前效果】
（80 字以内）
`
}
