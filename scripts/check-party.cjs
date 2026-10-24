const assert = require('node:assert/strict')
const { createLoader } = require('./load-ts.cjs')
const { character, encounter, reply } = require('./fixtures/adventure.cjs')
const load = createLoader()
const P = load('@/lib/party')
const { completeTurn, PROMPT_VERSION } = load('@/lib/turn-engine')
const { emptyMemory } = load('@/lib/adventure-memory')
const { buildSystemPrompt } = load('@/lib/prompts')
const { inspectReply } = load('@/lib/chat-protocol')
const G = load('@/lib/prose-guard')

// 几率随深度上升，封顶
assert.equal(P.partyChance(1), 0.08)
assert.ok(P.partyChance(5) > P.partyChance(2))
assert.equal(P.partyChance(40), 0.45)
assert.equal(P.rollParty(1, () => 0.07), true)
assert.equal(P.rollParty(1, () => 0.09), false)

const lin = { ...structuredClone(character), encounter }
const mei = { ...structuredClone(character), name: '梅', hp: 90, maxHp: 100, pleasure: 10, desire: 5, floor: 3, encounter: null, avatarUrl: 'data:mei' }
const duo = P.formParty(lin, { ...mei, partner: { ...lin } })
assert.equal(duo.partner.name, '梅')
assert.equal(duo.partner.partner, undefined, '同伴不嵌套同伴')
assert.deepEqual(duo.partner.encounter, encounter, '共用遭遇')
assert.equal(duo.partner.floor, lin.floor)
assert.equal(P.together(duo), true)

// 换焦点：两人互换，各自状态保留
const swapped = P.swapFocus(duo)
assert.equal(swapped.name, '梅'); assert.equal(swapped.partner.name, '林')
assert.equal(swapped.pleasure, 10); assert.equal(swapped.avatarUrl, 'data:mei')
assert.equal(P.swapFocus(swapped).name, '林')

// 拆开：焦点留下，同伴排第二；拆开后换人不共用遭遇
const split = P.splitParty(duo, '锁链把两人扯开。')
assert.equal(split.party.split, true); assert.equal(P.together(split), false)
assert.match(P.partyPromptBlock(split), /不在场/)
const split2 = P.swapFocus(split)
assert.equal(split2.name, '梅'); assert.equal(split2.party.split, true); assert.deepEqual(split2.encounter, encounter, '拆开时她自己的遭遇保留')

// 结算焦点后同伴接上
const heir = P.promotePartner(duo)
assert.equal(heir.name, '梅'); assert.equal(heir.partner, undefined); assert.equal(heir.party, undefined)
assert.equal(P.promotePartner(lin), null)

// 迁移：旧档原样；坏同伴丢掉；缺字段补齐
assert.equal(P.normalizeParty(lin), lin)
assert.equal(P.normalizeParty({ ...lin, partner: { name: '' } }).partner, undefined)
assert.equal(P.normalizeParty({ ...lin, partner: null, party: { split: true } }).party, undefined)
const fixed = P.normalizeParty({ ...lin, partner: { ...mei, pleasure: 300, statusEffects: undefined, partner: lin } })
assert.equal(fixed.partner.pleasure, 100); assert.deepEqual(fixed.partner.statusEffects, []); assert.equal(fixed.partner.partner, undefined)
assert.deepEqual(fixed.party, { split: false })

// 提示：同伴档案、篇幅按合计、PARTNER 行
const block = P.partyPromptBlock(duo)
assert.match(block, /梅/); assert.match(block, /两个人合计/); assert.match(block, /\[PARTNER:/); assert.match(block, /至少 1 行台词/)
assert.match(block, /羞耻/)
assert.match(P.buildSplitPrompt(duo, '刚才'), /拆开/)
// 系统提示本身不受影响（请求格式不变）
assert.equal(typeof buildSystemPrompt(duo, '', 'dense', null, emptyMemory(), undefined), 'string')

// 回合：PARTNER 行解析、夹紧、写回规范文本；缺失时保留并警告
const pending = { id: 't1', input: '继续', before: structuredClone(duo), startedAt: 1, phase: 'generating', draft: '', promptVersion: PROMPT_VERSION, model: 'f', requestMessages: [], result: null }
const session = { messages: [], summary: '', memory: emptyMemory(), pendingTurn: pending }
const content = reply(duo) + '\n[PARTNER:{"name":"梅","hp":88,"pleasure":140,"desire":20}]'
assert.ok(!inspectReply(content, duo, null).errors.length)
assert.ok(!/PARTNER/.test(inspectReply(content, duo, null).narrative), '正文不含 PARTNER')
const done = completeTurn(session, pending, content, false)
assert.equal(done.character.partner.pleasure, 100); assert.equal(done.character.partner.hp, 88)
assert.deepEqual(done.character.partner.encounter, done.character.encounter)
assert.match(done.session.messages.at(-1).content, /\[PARTNER:\{"name":"梅","hp":88,"pleasure":100,"desire":20\}\]/)
assert.equal(done.session.turns.at(-1).after.partner.avatarUrl, null, '审计记录不存立绘')
const missing = completeTurn(session, pending, reply(duo), false)
assert.equal(missing.character.partner.pleasure, 10)
assert.ok(missing.warnings.some((w) => /梅/.test(w)))
// 拆开后不写 PARTNER
const sp = { ...pending, before: structuredClone(split) }
const spDone = completeTurn({ ...session, pendingTurn: sp }, sp, reply(split), false)
assert.ok(!/PARTNER/.test(spDone.session.messages.at(-1).content))

// 字数检查照整段回复算，PARTNER 不计入正文
const body = '她' + '被压着慢慢往里顶'.repeat(140)
assert.equal(G.checkReply(body + '\n[PARTNER:{"name":"梅"}]', { dense: true, stepIndex: 3 }).length, G.checkReply(body, { dense: true, stepIndex: 3 }).length)
console.log('party ok')
