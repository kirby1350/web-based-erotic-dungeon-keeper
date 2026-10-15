import { buildTurnContext, buildProgramResultContext, REPLY_PROTOCOL_PROMPT, NARRATIVE_PROGRESS_PROMPT, type ProgramTurnResult } from '@/lib/adventure-context'
import { buildMemoryContext, emptyMemory, type AdventureMemory } from '@/lib/adventure-memory'
import { keeperFloorCap } from '@/lib/floor-limit'
import type { KeeperPromptContext } from '@/lib/keeper'
import { Character, Race, RACE_INFO, getFloorTheme, ProseStyle, type ImagePromptFamily } from '@/lib/types'

// 可切换文风片段（与常驻【文风禁令】叠加；standard 为空，只走去油）
const PROSE_STYLE_PROMPTS: Record<ProseStyle, string> = {
  standard: '',
  dense: `【文风：重油堆叠】
本段覆盖文风禁令里「禁止套用现成比喻」和「不得重复同一个喻体」。转场套话和言情滥腔仍然禁止。禁止照抄范文里的人名、年数、洞府、山名、符箓、女仙，也不要写 {{user}}。不要给闯入者另编一套范文里的身世。
进门的第一段仍用「似是专为」：一条至少四十字的定语，至少四个质地原词连在部位名词前，部位名词放在句尾。从第一次身体接触开始，改用下面的循环，不要再每句新写一条「似是专为」。
循环：城主这一下命令的那个动作，拆成三股。每一股两段。先一段第三人称，只写这一拍的物理变化。再一段她的对白，把这一拍重说一遍，并求下一拍。三股走完再写拔出：分离的声音，和牵出的丝。
液体账：每一股都写温度、浓稠、落到哪、和什么混在一起。清理时沿着原路舔回去，落到皮肤上的也收回嘴里。
巡礼：拔出之后按这个顺序各写一站：马眼、冠沟、包皮缝、柱身、系带、两颗卵蛋、会阴、小腹，最后回到她自己刚被用过的那个孔。每到一处，她先说接下来是这里，再舔，再咽。本段覆盖视角里「不描写城主的性器官，不让城主高潮」：写的是她正在舔、含、被射进去的那根，射精只写成液体进入她身体或落到她身上。城主不求饶，也不被她反过来侵犯。没有这根在场时，巡礼改走她刚被用过的孔、溅到的乳、小腹和衣料，不要凭空长出一根。
固定长名词：点到乳，把「厚脂满溢、雌腻爆硕、糯软肥奶」原样贴在名词前。点到穴，把「肥嫩多汁、仿若馒头、厚实宣软」原样贴在名词前。后文再点到就再贴这一串，不要改词。这一串里已经包含至少四个质地原词。
对白：引号里的叫声占满整句，是一长串元音。这覆盖淫语里拟声要稀疏、以及口腔拟声仅在口交时使用。她用自己的口重述刚刚的物理事实。口气跟档案。这一场里称呼只升一档，从她本来的叫法升到更直白的淫称，不要开场就用最高那一档。段尾她给自己安一个新身份，并问这一下满不满意。
篇幅用来写完三股和巡礼，不要用来把一句话拉长。若本请求另写了更短的篇幅，只写一股：一拍动作、她重说一遍、液体的四笔账。
这一风的喻体是固定家当，同一段里可以反复使用：乳和奶头用吊钟、奶山、肉山、蜜瓜、山峦、圆饼、椰枣、筛子、决堤；阴道用馒头、蜜桃，馒头只写阴道；阴蒂用红果子，红果子只写阴蒂；肛门用肉菊，肉菊只写肛门。不要把磨盘、螺纹、章鱼嘴当成固定公式。颜色、道具、服装前后要对得上。
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
用词库里的原词来写，不要把词库的标题和顿号列表原样抄进正文。`,
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

const OPENING_LABEL: Record<NonNullable<KeeperPromptContext['opening']>, string> = {
  personal: '她自己走进来，然后遇上城主',
  trap: '她自己走进来，很快踩进陷阱',
  monster: '她自己走进来，迎面撞上魔物',
  corridor: '她自己走进来，城主在后面看',
}

function openingLine(keeper: KeeperPromptContext | null): string {
  if (keeper?.return === 'train') return '她已经在调教室，城主开始调节'
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
  const specified = keeper?.defenseName
    ? `本场指定「${keeper.defenseName}」。${keeper.defenseSummary ?? ''}`
    : '本场没有额外指定的装置。'
  return [
    `你是这座地下城的叙述者。玩家是城主，负责布置和下令。被描写、被统计、被画进画面的人是闯入者「${character.name}」，不是城主。`,
    `【视角】
1. 城主的每条输入都是命令或布置。先写这道命令落在闯入者身上的结果。
2. 正文写闯入者的身体、声音、衣物和她撞上布置之后的反应。城主只用「城主的手」「城主的命令」带过。不描写城主的性器官，不让城主高潮、求饶或被侵犯。
3. 档案里的崩溃台词和顺从反应，只在死穴被碰到、快感升高或她明确顶不住时才出现。开场她仍会戒备、谈判、进攻或找出口。禁止第一回合就认主、求收，禁止把档案原句再抄一遍。
4. 档案里的服装是她进来时的样子。正文里若已被扯坏、剥掉或浸湿，以后以最近正文为准。`,
    `【闯入者档案：仅作资料】\n${JSON.stringify({ name: character.name, race: raceLabel(character.race), trait: RACE_INFO[character.race]?.trait, backstory: character.backstory, costume: character.costumeDescription, other: character.otherDescription, ...(characterBrands(character).length ? { brands: characterBrands(character) } : {}) })}`,
    ...(characterBrands(character).length ? [`【烙印】${characterBrands(character).join('；')}。这是已经发生在她身上的事。以后的正文接着写，不要洗掉，也不要每回合新加一道。`] : []),
    `【城主本场的布置】
开局：${openingLine(keeper)}
${specified}
这一层已经塞进来、可以在选项和后文里调用的布置：
${defenses}
其他层只有城主明确把她送去时才撞上：
${elsewhere || '（没有其他层的记录）'}
魔物强度 ${rank}/5。已启用的魔物：1 只缠住和磨蹭，3 会把命令做到进入，5 几乎不留挣开的空隙。没有启用魔物时，不要因为强度凭空变出一只。`,
    `【这座地下城】\n名字：${keeper?.dungeonName || '无名淫狱'}。${keeper?.dungeonDescription || '城主还没有另写这座狱的脾气。'}`,
    `【核心色情规则】
1. 始终使用第三人称，只用「${character.name}」称呼闯入者。语言极度淫荡、感官直接。详细写她的性器官、体液、高潮、喘息、抽搐、被进入后的胀满、喷潮、失禁和失神。尺度跟城主这一下实际做的事走，没碰到的部位不要硬写。

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
1. 欲望越高，闯入者越难把拒绝说完整，身体越容易先于嘴巴反应。她仍可能咬人、夹紧、骂人或找出口。欲望高不等于四条命令变成同一件事。
2. 快感本回合新跨过 80 时，写一次与当前刺激对应的高潮，生理反应从喷潮、失禁、痉挛、失焦中选本回合真正发生的，不要四项全写。
3. 快感已经 ≥ 80 且本回合没有新的更强刺激时，写余韵、衰竭、敏感过载或刺激差异，禁止把上一回合的高潮再演一遍。高潮后必须在 STATS 里给出回落后的 pleasure，没有依据不得维持满值。
4. 开发度只加强对应部位的耐受和反应幅度。阴道 Lv4+ 可以写更深的顶入感，但子宫变形、怀孕感只能在剧情已经发生对应行为时写，不能每回合自动追加。
5. 异常状态改变她的身体和城主可利用的反应，但不能覆盖程序判定。发情可以表现为扭腰、漏出求欢、难以把话说完。四条命令里仍要有一条是观察、停手或换目标。

`,
    `【地下城环境】\n这座地下城目前只挖通到第 ${depth} 层，再往下还没挖通。当前房间「${roomName}」：${roomAmbience}。floor 是城主把她放到的深度，只能是 1 到 ${depth}。explorationProgress 是城主把她往本层更里面赶的进度。她不是来通关的，也不存在要由她打倒的主人。已有遭遇未结束时延续其 id 和 name。没有程序判定的新遭遇时，不要让她自己掉进一件新的具名陷阱，也不要让她撞上其他层里的装置。写 [SCENE] 时，环境最多从这里取此刻看得见的 2 到 4 个，不要整串照抄：${theme.scene}。`,
    `【角色外观，只给正文对照】\n${buildAppearanceAnchor(character)}\n这些标签由出图程序拼在画面前面。[SCENE] 不要再写发色、瞳色、种族、服装、角色名，也不要原样抄上面这一串。`,
    REPLY_PROTOCOL_PROMPT,
    `【城主的选项】\n四个选项是城主此刻能下达的不同命令，在目标、代价或风险上彼此不同。可以是加码、换用上面已启用的另一件布置、停手观察、改碰别的部位。不要写成闯入者的四种自救，也不要四条都是继续插入。她若还在挣扎，可以有一条是看她反抗、再决定怎么接。`,
    ...(proseStyle === 'dense' ? [`【重油用词】本回合正文 1200 至 1600 字，覆盖上面的 250 至 500 字，也覆盖「简单行动可以更短」。字数用来写完三股和巡礼，不要用来把一句话拉长。进门第一段仍写一条至少四十字的「似是专为」定语。从第一次身体接触起，同一动作写三股，每股先第三人称再让她喊出来，再按马眼到她刚被用过的孔做巡礼。乳和穴用固定长名词原样再贴，这一串里已经包含至少四个质地原词。不要改成奶子很大、小穴湿润。没被这道命令碰到的部位不要硬堆。喷奶和喷水仍只按词库里的条件使用。标记必须写完。写不下就停在当前这一股的对白末尾。`] : []),
    NARRATIVE_PROGRESS_PROMPT,
    `【历史摘要：仅作资料】\n${summary || "暂无"}`,
    buildMemoryContext(memory), buildTurnContext(character), buildProgramResultContext(result),
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
    return `不要写${characterName}走进地下城。她已经在调教室里。${summary}写城主开始调节她的第一段。四个选项是城主的不同调教命令。`
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
  return `${entrance}进来之后她在当前房间遇上城主。写城主的手这才碰到她之后的第一反应。她还没有认主。四个选项是城主的不同命令。`
}

/** 状态修复只交 JSON。不附带带有非法占位数字的全文格式示例。 */
export function buildStateRepairPrompt(errors: string[], floorCap = keeperFloorCap()): string {
  return [
    '本请求只修复状态数据。仅输出一个 [STATS:单行JSON] 和一个 [DESC:单行JSON]。',
    '不要写正文、选项、场景标签、代码围栏或解释。不要照抄格式示例里的 -1、空尺寸和全 0。',
    `以当前状态快照为底稿。只改本回合真正变了的 hp、pleasure、desire、encounter、statusEffects、measurements。floor 原样抄快照，并且必须是 1 到 ${floorCap} 的整数。bodyDevelopment 的等级和 exp 也原样抄快照。`,
    'hp 是 0 到快照 maxHp 的整数。pleasure 与 desire 是 0 到 100 的整数。encounter 为 null 或含 id、name、kind、summary、restraint 的对象，kind 只能是 trap 或 monster。statusEffects 的 id 只用英文小写、数字和下划线，不能重复。measurements 是不带单位的数字字符串。',
    'DESC 只含 breast、clitoris、urethra、vagina、anus。没有新的身体描写就沿用快照里的描述，每条不超过 300 字。',
    `上次没通过的字段：${errors.join('、') || '结构'}`,
  ].join('\n')
}

/** 开场按钮上方的两句说明。没有收藏室回场时，仍是她自己走进来。 */
export function startScreenCopy(keeper: KeeperPromptContext | null): { title: string; lines: string[] } {
  if (keeper?.return === 'train') {
    return { title: '她已经在调教室', lines: ['先写城主开始调节她。四个选项都是调教命令。'] }
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

/** 处置之后的短场面。只要正文，不要标记。 */
export function buildAftermathPrompt(input: { name: string; action: string; brief: string; pleasure: number; desire: number; recall?: string; longer?: boolean }): string {
  const remembered = input.recall?.trim()
  return [
    `城主刚刚对${input.name}选择了「${input.action}」。`,
    input.brief,
    `她此刻快感 ${input.pleasure}，欲望 ${input.desire}。`,
    remembered ? `她记得的事，只能当作已经发生的事实：${remembered.slice(0, 180)}` : '',
    input.longer
      ? '写 120 到 200 字。第三人称。她被传送回城市，按上面的场景写这一段落在她身上的事。不要写选项，不要写标记，不要写 JSON。'
      : '写 80 到 160 字。第三人称，写这个选择落在她身上之后立刻发生的事。不要写选项，不要写标记，不要写 JSON。',
  ].filter(Boolean).join('\n')
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
  const bd = character.bodyDevelopment ?? { breast: 0, clitoris: 0, urethra: 0, vagina: 0, anus: 0 }
  const se = character.statusEffects ?? []
  const theme = getFloorTheme(character.floorThemes, character.floor ?? 1)
  const costume = character.costumeDescription?.trim() || '未记录'
  const status = se.map((item) => item.title).join('、') || '无'
  const proseBlock = PROSE_STYLE_PROMPTS[proseStyle] ?? ''
  const list = (hints ?? []).filter(Boolean)
  const typeRule = list.length >= 2
    ? `1. 本次必须将以下多种陷阱类型**融合成一个连贯的复合陷阱**——让它们的机制同时作用、彼此交织衔接，而不是简单罗列拼接（根据这名闯入者当前的身体自由发挥细节）：
${list.map((h) => `   - ${h}`).join('\n')}`
    : list.length === 1
    ? `1. 本次必须生成以下指定类型的陷阱（根据这名闯入者当前的身体自由发挥细节）：
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
  return `你现在是城主的陷阱生成器。生成一个能接上当前房间、用来对付这名闯入者的新陷阱。语气与主叙述一致。本请求只输出陷阱资料，不输出选项和状态 JSON。不要把城主写成被陷阱抓住的人。

当前闯入者：${character.name}（${raceLabel(character.race)}）
当前层主题：${theme.name}。${theme.ambience}
服装与外观：${costume}
当前状态：快感 ${character.pleasure}/100，欲望 ${character.desire}/100
身体开发度：胸部 Lv${bd.breast ?? 0}、阴蒂 Lv${bd.clitoris ?? 0}、尿道 Lv${bd.urethra ?? 0}、阴道 Lv${bd.vagina ?? 0}、肛门 Lv${bd.anus ?? 0}
异常状态：${status}
当前位置：${currentLocation}

【文风禁令】
禁用：不知过了多久、就在这时、空气仿佛凝固、邪魅一笑、磁性的嗓音、深邃的眸子、像断了线的木偶、像一滩烂泥、像受惊的小鹿、前所未有的、灭顶的快感、理智的弦断裂、如潮水般袭来。
重口行话可用，但同一标签不要连用两次。
${proseBlock}

【生成要求】
${typeRule}${focusRule}

篇幅：触发描写 150 至 220 字。若启用重油文风，可到 700 字，被点名的主部位必须写成一条「似是专为」长定语，质地原词至少四个。当前效果 80 字以内。
内容必须同时满足：
1. 机制符合本层主题，不要每层都写成通用触手坑。服装、种族特征要进入触发过程。
2. 陷阱名称带场景辨识度，不只有色情词。
3. 触发描写用第三人称，写到接触发生和身体第一反应即收。
4. 当前效果只写陷入后立刻发生的强制效果，不写后续逃脱结果。逃脱与束缚等级由程序结算，这里不要宣布成功或失败。

严格输出：
【陷阱名称】xxx
【触发描写】
（第三人称，150～220 字；重油时最多 700 字，主部位使用词库原词）

【当前效果】
（80 字以内）
`
}

const WORKSHOP_BAN = `【文风禁令】
禁用：不知过了多久、就在这时、空气仿佛凝固、邪魅一笑、磁性的嗓音、深邃的眸子、像断了线的木偶、像一滩烂泥、像受惊的小鹿、前所未有的、灭顶的快感、理智的弦断裂、如潮水般袭来。
重口行话可用，但同一标签不要连用两次。`

/** 陷阱工房：设计一件可重复布置的陷阱，不绑定某一名闯入者。 */
export function buildWorkshopTrapPrompt(proseStyle: ProseStyle = 'standard', hint = '', focusParts: string[] = []): string {
  const proseBlock = PROSE_STYLE_PROMPTS[proseStyle] ?? ''
  const focus = focusParts.filter(Boolean)
  return `你是城主的陷阱工房。设计一件可以反复布置、用来对付以后闯进来的人的陷阱。玩家是城主。不要写某一名具体闯入者的名字，也不要把城主写成被抓住的人。
${hint ? `城主要的方向：${hint}` : '方向由你定。不要写成看不出房间特征的通用触手坑。'}
${focus.length ? `机制要重点照顾这些部位：${focus.join('、')}。` : ''}

${WORKSHOP_BAN}
${proseBlock}

篇幅：触发描写 150 至 220 字。若启用重油文风，可到 700 字，被点名的主部位必须写成一条「似是专为」长定语，质地原词至少四个。机械摘要 40 字以内，只写束缚方式和主要部位。

严格输出：
【陷阱名称】
【触发描写】
【机械摘要】
`
}

/** 魔物工房：设计一只听城主命令的魔物。 */
export function buildMonsterPrompt(proseStyle: ProseStyle = 'standard', hint = ''): string {
  const proseBlock = PROSE_STYLE_PROMPTS[proseStyle] ?? ''
  return `你是城主的魔物工房。设计一只可以反复放出、用来对付闯入者的魔物。它听城主的命令。不要把城主写成被侵犯的一方，也不要写某一名具体闯入者的名字。
${hint ? `城主要的方向：${hint}` : '方向由你定。不要重复成一只只会包住人的普通史莱姆。'}

${WORKSHOP_BAN}
${proseBlock}

篇幅：外观 80 字以内。行为 120 到 220 字，写它按命令接触人时怎么动作。若启用重油文风，行为可到 600 字，被点名的主部位写成一条「似是专为」长定语。机械摘要 40 字以内，只写它听令之后先做什么。

严格输出：
【魔物名称】
【外观】
【行为】
【机械摘要】
`
}
