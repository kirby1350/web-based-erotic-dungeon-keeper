// 双人闯入：两个人一起进来，共用陷阱和魔物，各自有快感、欲望、称呼和立绘。
// 焦点（character 本身）拿大部分篇幅；同伴挂在 character.partner 上。拆开后场面只跟焦点，同伴排在第二，可以随时换过去。
import type { Character } from '@/lib/types'
import { intruderArchive } from '@/lib/prompts'
import { dkTermsLine } from '@/lib/terms-dk'
import { extractMarkerJson } from '@/lib/chat-protocol'

/** 结伴进来的概率随挖通的深度上升：第 1 层 8%，每深一层 +4%，封顶 45%。 */
export function partyChance(depth: number): number {
  return Math.min(0.45, 0.08 + 0.04 * Math.max(0, (depth || 1) - 1))
}
/** localStorage dk_party_chance 可覆盖几率（测试和调试用，0 到 1）。 */
export function rollParty(depth: number, random: () => number = Math.random): boolean {
  let chance = partyChance(depth)
  try {
    const forced = typeof localStorage === 'undefined' ? null : localStorage.getItem('dk_party_chance')
    if (forced !== null && Number.isFinite(Number(forced))) chance = Math.max(0, Math.min(1, Number(forced)))
    // 自动化浏览器里默认不随机结伴，避免既有测试被抽中；需要时用 dk_party_chance 或作弊选单指定
    else if (typeof navigator !== 'undefined' && navigator.webdriver) chance = 0
  } catch { /* 读不到就按深度 */ }
  return random() < chance
}

export function together(c: Character | null | undefined): boolean {
  return !!c?.partner && !c.party?.split
}

function solo(c: Character): Character {
  const { partner: _p, party: _q, ...rest } = c
  return rest as Character
}

/** 组队：同伴和焦点同层、共用同一件遭遇。 */
export function formParty(focus: Character, partner: Character): Character {
  return { ...solo(focus), partner: { ...solo(partner), floor: focus.floor ?? 1, encounter: focus.encounter ?? null, explorationProgress: focus.explorationProgress ?? 0 }, party: { split: false } }
}

/** 换焦点：同伴变成焦点，原来的焦点排到第二。拆开状态不变。 */
export function swapFocus(c: Character): Character {
  if (!c.partner) return c
  const party = c.party ?? { split: false }
  const nextPartner = solo(c)
  const shared = party.split ? {} : { floor: c.floor ?? 1, encounter: c.encounter ?? null, explorationProgress: c.explorationProgress ?? 0 }
  return { ...solo(c.partner), ...shared, partner: nextPartner, party }
}

export function splitParty(c: Character, note: string): Character {
  if (!c.partner) return c
  return { ...c, party: { split: true, note: note.trim().slice(0, 600) } }
}

/** 焦点被处置之后：同伴接着成为这一场的人（单人）。没有同伴时返回 null。 */
export function promotePartner(c: Character): Character | null {
  if (!c.partner) return null
  return { ...solo(c.partner), ...(c.party?.split ? {} : { floor: c.floor ?? 1, encounter: c.encounter ?? null }) }
}

/** 旧档迁移 / 读档清洗：没有同伴就去掉 party；同伴缺字段就丢掉；同伴身上的同伴一律去掉。 */
export function normalizeParty<T extends Character | null | undefined>(c: T): T {
  if (!c || typeof c !== 'object') return c
  const p = c.partner as Partial<Character> | null | undefined
  const valid = !!p && typeof p === 'object' && typeof p.name === 'string' && !!p.name.trim() && p.name !== c.name
    && !!p.bodyDevelopment && typeof p.bodyDevelopment === 'object'
  if (!valid) {
    if (c.partner === undefined && c.party === undefined) return c
    return solo(c as Character) as T
  }
  const partner = solo({ ...(p as Character),
    hp: num(p!.hp, 100, p!.maxHp ?? 100), maxHp: num(p!.maxHp, 100, 999), pleasure: num(p!.pleasure, 0, 100), desire: num(p!.desire, 0, 100),
    statusEffects: Array.isArray(p!.statusEffects) ? p!.statusEffects : [], avatarUrl: p!.avatarUrl ?? null })
  const party = c.party && typeof c.party === 'object' ? { split: c.party.split === true, ...(typeof c.party.note === 'string' ? { note: c.party.note.slice(0, 600) } : {}) } : { split: false }
  return { ...c, partner, party }
}
function num(v: unknown, fallback: number, max: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.round(v))) : fallback
}

/** 同伴状态行：模型在 [DESC] 之后单独写一行。 */
export function parsePartnerMarker(content: string, partner: Character): { partner: Character; found: boolean } {
  const raw = extractMarkerJson(content, 'PARTNER')
  if (!raw) return { partner, found: false }
  const next = { ...partner,
    hp: num(raw.hp, partner.hp, partner.maxHp ?? 100),
    pleasure: num(raw.pleasure, partner.pleasure ?? 0, 100),
    desire: num(raw.desire, partner.desire ?? 0, 100) }
  return { partner: next, found: true }
}
export function partnerMarker(partner: Character): string {
  return `[PARTNER:${JSON.stringify({ name: partner.name, hp: partner.hp, pleasure: partner.pleasure ?? 0, desire: partner.desire ?? 0 })}]`
}

/** 回合结算：同伴状态从 [PARTNER] 来；共用遭遇和层数跟着焦点走。 */
export function settlePartner(focusAfter: Character, partnerBefore: Character, content: string): { partner: Character; warning: string | null } {
  const parsed = parsePartnerMarker(content, partnerBefore)
  return {
    partner: { ...parsed.partner, floor: focusAfter.floor ?? 1, encounter: focusAfter.encounter ?? null, explorationProgress: focusAfter.explorationProgress ?? 0 },
    warning: parsed.found ? null : `没写${partnerBefore.name}的状态，她的数值保持不变`,
  }
}

/** 双人场面的系统提示段。拆开后只写一句：她不在场。 */
export function partyPromptBlock(c: Character, presence: 'present' | 'known' | 'absent' = 'present'): string {
  const p = c.partner
  if (!p) return ''
  if (c.party?.split) {
    return `【拆开】${p.name}已经和${c.name}分开，被带去了别处，此刻不在场。不要写${p.name}出现、出声或被碰到；${c.name}可以想到她、担心她或拿她来逞强。${c.party.note ? `拆开时的场面：${c.party.note}` : ''}`
  }
  return [`【双人场面：以这里为准】这一场有两个闯入者：主角「${c.name}」，同伴「${p.name}」。上面「只用${c.name}称呼闯入者」的规则对同伴不适用，写她时用「${p.name}」。
1. 陷阱和魔物是两人共用的：同一件布置要么同时缠住两个人，要么在两人之间来回分配。城主的命令默认落在${c.name}身上，${p.name}在旁边。
2. 篇幅：整段回复的字数和台词行数照本回合硬性要求算，两个人合计，不是各算一份。${c.name}占大部分；${p.name}写 1 到 2 个叙述段、至少 1 行台词，她的台词也算进总行数。
3. 两人互相起反应，用各自原作的口吻：看着对方被弄时的羞耻和别开脸、想帮对方挣开或替她挡、被对方的声音和样子一起拖下去。不要两个人说同一种话。
4. 状态：[STATS] 和 [DESC] 只写${c.name}。${p.name}的状态在 [DESC] 之后另起一行写：[PARTNER:{"name":"${p.name}","hp":数字,"pleasure":数字,"desire":数字}]，每回合都要写，数值按她本回合实际遭遇变化。
5. ${p.name}此刻：生命 ${p.hp}/${p.maxHp}，快感 ${p.pleasure ?? 0}，欲望 ${p.desire ?? 0}。${dkTermsLine(p, presence)}`,
    intruderArchive(p).replace('【闯入者档案：仅作资料】', `【同伴档案：${p.name}，仅作资料】`),
  ].join('\n')
}

export function buildSplitPrompt(c: Character, recent: string): string {
  const p = c.partner!
  return [
    `城主下令把一起闯进来的${c.name}和${p.name}拆开。`,
    recent.trim() ? `刚才的场面（只作事实）：${recent.trim().slice(-400)}` : '',
    `${c.name}此刻快感 ${c.pleasure ?? 0}，${p.name}快感 ${p.pleasure ?? 0}。`,
    `写 120 到 200 字。第三人称。写两人被分开的那一下：布置怎么把她们扯开、两人各用原作口吻喊出的一句话、最后场面跟着${c.name}留下，${p.name}被带去别处。不要写选项，不要写标记，不要写 JSON。`,
  ].filter(Boolean).join('\n')
}
