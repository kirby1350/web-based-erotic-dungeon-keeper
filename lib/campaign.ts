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
  { min: 0, label: '无名', note: '外面还没人知道这座狱。' },
  { min: 20, label: '传闻', note: '酒馆里开始有人说起失踪的冒险者。' },
  { min: 40, label: '通缉', note: '公会贴出了悬赏，来的人更有准备。' },
  { min: 60, label: '讨伐令', note: '教会下了讨伐令，来的是老手。' },
  { min: 80, label: '王国征讨', note: '王国派出精锐，她们带着护符和解咒药。' },
  { min: RAID_INFAMY, label: '勇者讨伐队', note: '勇者讨伐队已经出发。' },
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
    danbooruTags: 'original, 1girl, long hair, blonde hair, blue eyes, large breasts, hero, armor, cape, holy sword, tiara',
    backstory: '被神选中的勇者。王国把讨伐这座地下城的任务交给了她和同伴，她第一个踏了进来。',
    appearance: '金色长发，湛蓝眼睛，神情坚定。胸很大，腰细，腿修长有力。身上有阳光和铁的味道。',
    personality: '正直、勇敢、绝不放弃同伴。越被逼越不肯低头。只有同伴被当面玩弄时，才会动摇。',
    speech: '自称：我\n称呼：把城主叫做「魔物」或「你」\n语气：清亮、坚定\n招牌台词：「我会终结这里。」「大家，再撑一下！」',
    costumeDescription: '白银胸甲勒在乳下，上半边乳肉鼓出。红披风，短裙下白丝，圣剑在手。',
    sexual: '她先受不了「勇者」的身份被当面拆掉。被叫做勇者时被按住，羞耻会烧穿意志，淫水湿透白丝。高潮时还在喊同伴的名字。',
    otherDescription: '抵抗时她挥圣剑劈开束缚，护住身后的同伴，不求饶。',
    collapseLine: '「勇者……已经不在了……」',
  },
  {
    name: '圣女塞莉娜', race: 'elf',
    avatarUrl: '/avatars/saint-selena.png',
    measurements: { bust: '100', waist: '59', hip: '96' },
    danbooruTags: 'original, 1girl, long hair, silver hair, green eyes, pointy ears, elf, huge breasts, nun, white robe, holy symbol, staff',
    backstory: '教会的圣女，讨伐队的治愈者。她跟在勇者身后，用祷词驱散这座狱的淫气。',
    appearance: '银色长发，翠绿眼睛，尖耳。胸极大柔软，腰细。身上有圣油和白花的香。',
    personality: '慈悲、温柔，对一切邪恶都带着怜悯。信仰是她最后的盾，祷词断掉时她会彻底慌乱。',
    speech: '自称：我\n称呼：把城主叫做「迷途之物」\n语气：轻柔、虔诚，常念祷词\n招牌台词：「愿圣光宽恕你。」「我不会屈服于这种东西。」',
    costumeDescription: '白色修女袍很薄，胸口被撑得几乎透明，圣徽压在乳沟里。长裙高开衩，白丝吊带。',
    sexual: '她先受不了祷词被快感打断。每断一次，圣光就弱一分，身体就更敏感。高潮时把祷词念成了淫叫。',
    otherDescription: '抵抗时她张开圣光结界，为同伴治愈，不求饶。',
    collapseLine: '「神啊……我已经……听不见您了……」',
  },
  {
    name: '女骑士薇奥拉', race: 'tauren',
    avatarUrl: '/avatars/knight-viola.png',
    measurements: { bust: '108', waist: '62', hip: '104' },
    danbooruTags: 'original, 1girl, long hair, red hair, amber eyes, horns, cow girl, gigantic breasts, knight, heavy armor, shield, muscular female',
    backstory: '讨伐队的盾。她是王国最强的重装骑士，发誓要用身体挡住一切攻向勇者的东西。',
    appearance: '赤红长发，琥珀眼睛，一对牛角。胸硕大沉重，腰紧，臀腿肉感结实。身上有汗和皮革的味道。',
    personality: '刚烈、骄傲、护短。最看不起卑鄙手段。被迫在同伴面前失态，比任何疼痛都让她崩溃。',
    speech: '自称：本骑士\n称呼：把城主叫做「卑鄙的家伙」\n语气：粗声、豪迈\n招牌台词：「想动她们，先过本骑士这一关！」「区区这种程度……！」',
    costumeDescription: '重甲只护住要害，胸甲根本兜不住乳肉，从两侧溢出来。腰甲下肥臀半露，大腿绑带勒进肉里。',
    sexual: '她先受不了乳房被挤、被当成牛对待。被挤出奶时会屈辱得发抖，身体却先迎合。高潮时奶和淫水一起喷。',
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

/** 结算一名闯入者后推进长线。 */
export function recordFate(campaign: Campaign, name: string, fate: IntruderFate): Campaign {
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
