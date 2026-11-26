// 长线：恶名、威胁档位和勇者讨伐队终局。
// 失败线先行：讨伐队有人被放走，地下城被攻破。胜利线：三人全部留下或玩坏。
import type { Character, CharacterPreset } from '@/lib/types'
import type { IntruderFate } from '@/lib/keeper'

export type CampaignStatus = 'ongoing' | 'defeat' | 'victory'
export interface Campaign {
  infamy: number
  raid: boolean
  raidFates: Record<string, IntruderFate>
  status: CampaignStatus
  endless: boolean
}

export const RAID_INFAMY = 100
export const FATE_INFAMY: Record<IntruderFate, number> = { kept: 6, broken: 9, defeated: 3 }
export const THREAT_TIERS = [
  { min: 0, label: '无名', note: '外界尚无人知晓这座地下深渊的存在。' },
  { min: 20, label: '传闻', note: '酒馆里开始流传女冒险者接连失踪的诡异风声。' },
  { min: 40, label: '通缉', note: '冒险者公会张贴出高额悬赏，踏入此地的猎物愈发警惕。' },
  { min: 60, label: '讨伐令', note: '圣堂教会签发净除令，老练的圣职者与精锐开始登门。' },
  { min: 80, label: '王国征讨', note: '王室卫队亲自出动，闯入者携带着护身圣物与解咒秘药。' },
  { min: RAID_INFAMY, label: '勇者讨伐队', note: '受神眷顾的勇者讨伐队已兵临城门，终局决战将至。' },
] as const

export function emptyCampaign(): Campaign {
  return { infamy: 0, raid: false, raidFates: {}, status: 'ongoing', endless: false }
}

export function readCampaign(value: unknown): Campaign {
  const raw = (value && typeof value === 'object' ? value : {}) as Partial<Campaign>
  const status: CampaignStatus = raw.status === 'defeat' || raw.status === 'victory' ? raw.status : 'ongoing'
  const fates: Record<string, IntruderFate> = {}
  for (const [name, fate] of Object.entries(raw.raidFates ?? {})) if (fate === 'kept' || fate === 'broken' || fate === 'defeated') fates[name] = fate
  return {
    infamy: Math.max(0, Math.round(Number(raw.infamy) || 0)),
    raid: raw.raid === true,
    raidFates: fates,
    status,
    endless: raw.endless === true,
  }
}

export function threatTier(infamy: number): number {
  let tier = 0
  THREAT_TIERS.forEach((row, index) => { if (infamy >= row.min) tier = index })
  return tier
}

/** 威胁越高，闯入者越耐玩：生命上限提高，开场快感和欲望压低。 */
export function scaleIntruder(character: Character, tier: number): Character {
  if (tier <= 0) return character
  const maxHp = Math.round((character.maxHp ?? 100) * (1 + 0.15 * tier))
  return { ...character, maxHp, hp: maxHp, pleasure: Math.max(0, (character.pleasure ?? 0) - 2 * tier), desire: Math.max(0, (character.desire ?? 0) - 3 * tier) }
}

export function threatPromptLine(campaign: Campaign, raidMember: boolean): string {
  const tier = threatTier(campaign.infamy)
  if (raidMember) return '【威胁】她是勇者讨伐队的一员，是来终结这座地下城的。她意志极强、彼此信任，提到同伴时会重新振作。快感和欲望涨得比普通闯入者慢。'
  if (tier === 0) return ''
  return `【威胁】这座狱的恶名：${THREAT_TIERS[tier].label}。${THREAT_TIERS[tier].note}她比早先的闯入者更警惕、更能忍，不会轻易松口。`
}

export const RAID_PARTY: CharacterPreset[] = [
  {
    name: '勇者艾莉西亚', race: 'human',
    avatarUrl: '/avatars/hero-alicia.png',
    measurements: { bust: '96', waist: '58', hip: '94' },
    weakParts: ['vagina', 'clitoris'],
    weakTags: ['bind', 'hypno'],
    bonds: [
      { name: '圣女塞莉娜', relation: '讨伐队同伴·圣女', togetherLine: '圣女塞莉娜就在身旁，艾莉西亚拼死想替她挡下折磨，听见塞莉娜的祷词乱成喘息时意志最易动摇。', captiveLine: '得知圣女塞莉娜已经沦为这座狱的俘虏，艾莉西亚既自责又急怒，勇者的剑锋也乱了章法。' },
      { name: '女骑士薇奥拉', relation: '讨伐队同伴·重装盾卫', togetherLine: '发誓护卫自己的女骑士薇奥拉就在眼前受辱，艾莉西亚越想喊她撑住，自己的防线就塌得越快。', captiveLine: '连最坚固的盾卫薇奥拉都已陷落在此，艾莉西亚不得不独自承受整座地下城的恶意与动摇。' },
    ],
    danbooruTags: 'original, 1girl, long hair, blonde hair, blue eyes, large breasts, hero, armor, cape, holy sword, tiara',
    backstory: '被神选中的勇者。王国把讨伐这座地下城的任务交给了她和同伴，她第一个踏了进来。',
    appearance: '灿金长发披散，湛蓝眼眸清亮坚定，额戴银冠。胸脯饱满挺拔，细腰紧实，双腿修长有力。身上带着正午阳光与圣剑寒铁的气息。',
    personality: '正直、勇敢、绝不放弃同伴。越被逼越不肯低头。只有同伴被当面玩弄时，才会动摇。',
    speech: '自称：我\n称呼：把城主叫做「魔物」或「你」\n语气：清亮、坚定\n招牌台词：「我会终结这里。」「大家，再撑一下！」',
    costumeDescription: '白银轻甲托在乳下，上半边雪白乳肉高高鼓出，内衬已被战汗浸湿。绯红披风下短裙贴身，纯白长袜勒紧大腿，圣剑握在掌中。',
    sexual: '她先受不了「勇者」的身份被当面拆掉：被拘束按住、一边被称作高贵的勇者一边揉弄阴蒂与小穴时，屈辱感会瞬间烧穿意志，滚烫淫水湿透白丝。高潮时脚趾蜷紧，嘴里还在发颤地喊同伴的名字。',
    otherDescription: '抵抗时她挥圣剑劈开束缚，护住身后的同伴，不求饶。',
    collapseLine: '「勇者……已经不在了……」',
  },
  {
    name: '圣女塞莉娜', race: 'elf',
    avatarUrl: '/avatars/saint-selena.png',
    measurements: { bust: '100', waist: '59', hip: '96' },
    weakParts: ['breast', 'vagina'],
    weakTags: ['aphro', 'tentacle'],
    bonds: [
      { name: '勇者艾莉西亚', relation: '讨伐队领袖·勇者', togetherLine: '勇者艾莉西亚就在身旁，塞莉娜深怕自己淫乱失态的样子玷污勇者的信念，越压抑喘息，祷词断得越快。', captiveLine: '得知连希望的象征勇者艾莉西亚都已陷落，塞莉娜最后的信仰支柱摇摇欲坠。' },
      { name: '女骑士薇奥拉', relation: '讨伐队同伴·女骑士', togetherLine: '豪迈刚烈的薇奥拉就在身侧，塞莉娜想为她祈祷净化，自己却先一步腿软湿透。', captiveLine: '得知护卫自己的女骑士薇奥拉已被城主驯服，塞莉娜满心愧疚，抵抗格外脆弱。' },
    ],
    danbooruTags: 'original, 1girl, long hair, silver hair, green eyes, pointy ears, elf, huge breasts, nun, white robe, holy symbol, staff',
    backstory: '教会的圣女，讨伐队的治愈者。她跟在勇者身后，用祷词驱散这座狱的淫气。',
    appearance: '银白长发如瀑，翠绿眼眸慈悲清澈，一对修长敏感的精灵尖耳。胸乳硕大绵软，腰肢纤细。周身萦绕温润圣油与白百合的清香。',
    personality: '慈悲、温柔，对一切邪恶都带着怜悯。信仰是她最后的盾，祷词断掉时她会彻底慌乱。',
    speech: '自称：我\n称呼：把城主叫做「迷途之物」\n语气：轻柔、虔诚，常念祷词\n招牌台词：「愿圣光宽恕你。」「我不会屈服于这种东西。」',
    costumeDescription: '纯白修女袍质地极薄，被硕大胸乳撑得近乎半透明，金色圣徽深深陷在乳沟里。高开衩长裙下白丝吊带勒出丰腴腿肉。',
    sexual: '她先受不了虔诚祷词被揉乳与顶入小穴的快感生生打断。每念断一句，圣光便黯淡一分，精灵之躯对催情与抚弄愈发敏感，小穴泥泞不堪。高潮时尖耳通红颤抖，把圣洁祷词哭喊成了淫靡求欢。',
    otherDescription: '抵抗时她张开圣光结界，为同伴治愈，不求饶。',
    collapseLine: '「神啊……我已经……听不见您了……」',
  },
  {
    name: '女骑士薇奥拉', race: 'tauren',
    avatarUrl: '/avatars/knight-viola.png',
    measurements: { bust: '108', waist: '62', hip: '104' },
    weakParts: ['breast', 'anus'],
    weakTags: ['milk', 'bind'],
    bonds: [
      { name: '勇者艾莉西亚', relation: '誓死守护的勇者', togetherLine: '誓死守护的勇者艾莉西亚就在眼前，薇奥拉最怕让艾莉西亚看见自己像母牛一样泌乳失态的丑样。', captiveLine: '得知自己没能护住勇者艾莉西亚、让她先一步落入城主手中，薇奥拉的骑士骄傲瞬间崩出裂痕。' },
      { name: '圣女塞莉娜', relation: '讨伐队同伴·圣女', togetherLine: '纯洁的圣女塞莉娜就在旁边，薇奥拉宁可自己多挨十下也不愿塞莉娜被碰，羞愤与快感绞在一起。', captiveLine: '得知圣女塞莉娜已被留在收藏室里，薇奥拉满腔怒火却投鼠忌器，被拿住软肋时格外屈辱。' },
    ],
    danbooruTags: 'original, 1girl, long hair, red hair, amber eyes, horns, cow girl, gigantic breasts, knight, heavy armor, shield, muscular female',
    backstory: '讨伐队的盾。她是王国最强的重装骑士，发誓要用身体挡住一切攻向勇者的东西。',
    appearance: '火红长发狂野披散，琥珀眼眸桀骜炽烈，头顶一对粗壮弯牛角。巨乳硕大沉重，腰腹紧致有力，臀腿饱满丰厚。身上带着热汗与皮革铁甲的气息。',
    personality: '刚烈、骄傲、护短。最看不起卑鄙手段。被迫在同伴面前失态，比任何疼痛都让她崩溃。',
    speech: '自称：本骑士\n称呼：把城主叫做「卑鄙的家伙」\n语气：粗声、豪迈\n招牌台词：「想动她们，先过本骑士这一关！」「区区这种程度……！」',
    costumeDescription: '厚重铁甲只护住胸口正中，根本兜不住硕大乳肉，沉甸甸的软肉从胸甲两侧与下缘满溢出来。腰甲下肥臀半露，皮质绑带深深勒进结实丰满的大腿肉里。',
    sexual: '她先受不了沉重乳房被粗暴揉挤催乳、或是被按住牛角像家畜般开发后穴。被当面挤出温热奶水时会屈辱得浑身发抖，牛人血脉却让身体先一步发热迎合。高潮时浓白乳汁与淫水一起狂喷。',
    otherDescription: '抵抗时她举盾硬顶，用身体挡住同伴，不求饶。',
    collapseLine: '「本骑士……只是一头母牛了……」',
  },
]

export function raidRemaining(campaign: Campaign): CharacterPreset[] {
  return RAID_PARTY.filter((member) => !campaign.raidFates[member.name])
}

export function isRaidMember(name: string): boolean {
  return RAID_PARTY.some((member) => member.name === name)
}

/** 结算一名闯入者后推进长线。若讨伐队成员身上刻有发作中的淫纹被故意放归（crestedBait），不会导致地城陷落，反而会在讨伐队营地发作动摇军心，她本人仍留在待讨伐名单中。 */
export function recordFate(campaign: Campaign, name: string, fate: IntruderFate, opts?: { crestedBait?: boolean }): Campaign {
  if (campaign.raid && isRaidMember(name) && fate === 'defeated' && opts?.crestedBait) {
    return { ...campaign, infamy: campaign.infamy + 12 }
  }
  let next: Campaign = { ...campaign, infamy: campaign.infamy + FATE_INFAMY[fate] }
  if (!next.raid && next.status === 'ongoing' && !next.endless && next.infamy >= RAID_INFAMY) next = { ...next, raid: true }
  if (campaign.raid && isRaidMember(name)) {
    const raidFates = { ...campaign.raidFates, [name]: fate }
    next = { ...next, raidFates }
    if (fate === 'defeated') next = { ...next, status: 'defeat', raid: false }
    else if (RAID_PARTY.every((member) => raidFates[member.name] && raidFates[member.name] !== 'defeated')) next = { ...next, status: 'victory', raid: false }
  }
  return next
}

export const ENDINGS: Record<Exclude<CampaignStatus, 'ongoing'>, { title: string; text: string }> = {
  defeat: {
    title: '地下城陷落',
    text: '被放走的那一个回到了同伴身边。讨伐队带着她的证词重新杀进来，圣光烧穿了每一层，王座碎了。你的狱，到此为止。',
  },
  victory: {
    title: '勇者的终焉',
    text: '勇者、圣女和女骑士都留在了你的收藏室里。王国再也派不出第二支讨伐队。从今往后，这座狱就是这片土地上最深的传说。',
  },
}

/** 结局之后：重开一座新狱，或在终局后无尽经营。 */
export function continueEndless(campaign: Campaign): Campaign {
  return { ...campaign, status: 'ongoing', raid: false, endless: true }
}
