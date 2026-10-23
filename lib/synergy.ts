// 同层连携：同一层里陷阱和魔物的组合会带来额外淫髓，并写进提示词。
// 工坊自定义：入库要花淫髓，库存有上限。
import type { KeeperSave } from '@/lib/keeper'

export type DefenseTag = 'tentacle' | 'slime' | 'bind' | 'aphro' | 'hypno' | 'machine' | 'milk' | 'fire' | 'shock' | 'parasite'
const TAG_WORDS: Record<DefenseTag, RegExp> = {
  tentacle: /触手|触须|吸盘/,
  slime: /史莱姆|粘液|黏液|凝胶/,
  bind: /拘束|束缚|锁链|镣铐|绳|捆|缠住|固定/,
  aphro: /催情|媚药|花粉|花蜜|发情|春药/,
  hypno: /催眠|幻觉|幻术|洗脑|暗示/,
  machine: /机械|构装|齿轮|装置|机关/,
  milk: /挤奶|泌乳|乳汁|吸乳/,
  fire: /狐火|火焰|灼热/,
  shock: /电击|电流|麻痹/,
  parasite: /寄生|产卵|卵/,
}

export function tagsOf(text: string): DefenseTag[] {
  return (Object.keys(TAG_WORDS) as DefenseTag[]).filter((tag) => TAG_WORDS[tag].test(text))
}

export interface SynergyRule { id: string; name: string; trap: DefenseTag[]; monster: DefenseTag[]; bonus: number; note: string }
export const SYNERGY_RULES: SynergyRule[] = [
  { id: 'bind_any', name: '先缚后玩', trap: ['bind'], monster: [], bonus: 0.2, note: '陷阱先把她固定住，魔物上来时她躲不开，只能挨着。' },
  { id: 'aphro_tentacle', name: '催情触手', trap: ['aphro'], monster: ['tentacle'], bonus: 0.35, note: '花粉先让她发情，触手再缠上来时，她的身体先迎了上去。' },
  { id: 'slime_machine', name: '润滑机关', trap: ['slime'], monster: ['machine'], bonus: 0.25, note: '粘液把她浑身打湿，机械动作毫无阻滞，一下比一下深。' },
  { id: 'hypno_any', name: '幻中受辱', trap: ['hypno'], monster: [], bonus: 0.2, note: '幻觉让她认不清是谁在碰她，抵抗慢了半拍。' },
  { id: 'milk_aphro', name: '催乳牧场', trap: ['aphro', 'milk'], monster: ['milk', 'machine'], bonus: 0.3, note: '发情让乳房胀起来，挤奶装置正好接住。' },
  { id: 'shock_tentacle', name: '电流触手', trap: ['shock'], monster: ['tentacle', 'slime'], bonus: 0.3, note: '电流让她的肌肉不听使唤，缠上来的东西更好钻进去。' },
  { id: 'parasite_slime', name: '温巢孕育', trap: ['parasite'], monster: ['slime', 'tentacle'], bonus: 0.3, note: '温热的巢让寄生的东西安顿下来，她的小腹一阵阵发紧。' },
]
export const SYNERGY_CAP = 0.6

export interface FloorSynergy { id: string; name: string; note: string; bonus: number }

function hit(need: DefenseTag[], have: Set<DefenseTag>): boolean {
  return need.length === 0 || need.some((tag) => have.has(tag))
}

/** 第 floor 层（从 1 起）的连携。需要同层同时有陷阱和魔物。 */
export function floorSynergies(save: KeeperSave, floor: number): FloorSynergy[] {
  const layer = save.floors?.[floor - 1]
  if (!layer || !layer.trapIds.length || !layer.monsterIds.length) return []
  const trapTags = new Set(save.traps.filter((t) => layer.trapIds.includes(t.id)).flatMap((t) => tagsOf(`${t.name} ${t.mechanism}`)))
  const monsterTags = new Set(save.monsters.filter((m) => layer.monsterIds.includes(m.id)).flatMap((m) => tagsOf(`${m.name} ${m.appearance} ${m.behavior}`)))
  return SYNERGY_RULES.filter((rule) => rule.trap.some((tag) => trapTags.has(tag)) && hit(rule.monster, monsterTags))
    .map(({ id, name, note, bonus }) => ({ id, name, note, bonus }))
}

export function synergyBonus(list: FloorSynergy[]): number {
  return Math.min(SYNERGY_CAP, list.reduce((sum, item) => sum + item.bonus, 0))
}

export function synergyPromptLine(list: FloorSynergy[]): string {
  if (!list.length) return ''
  return `【同层连携】这一层的布置会互相配合：${list.map((item) => `「${item.name}」${item.note}`).join('')}写的时候让这几件东西接力，而不是各自为战。`
}

export const CUSTOM_LIMITS = { trap: 8, monster: 6 } as const
/** 自定义入库的淫髓价。魔物等级越高，捏出来的魔物越贵。 */
export function customCost(kind: 'trap' | 'monster', save: KeeperSave): number {
  const owned = (kind === 'trap' ? save.traps : save.monsters).filter((item) => item.source === 'custom').length
  return kind === 'trap' ? 4 + owned * 2 : 6 + owned * 2 + (save.progress.monsterRank - 1) * 2
}

export function customBlock(kind: 'trap' | 'monster', save: KeeperSave): string {
  const owned = (kind === 'trap' ? save.traps : save.monsters).filter((item) => item.source === 'custom').length
  if (owned >= CUSTOM_LIMITS[kind]) return `自定义${kind === 'trap' ? '陷阱' : '魔物'}最多 ${CUSTOM_LIMITS[kind]} 件，先删掉一件。`
  const cost = customCost(kind, save)
  if (save.progress.essence < cost) return `入库要 ${cost} 淫髓，现在不够。`
  return ''
}
