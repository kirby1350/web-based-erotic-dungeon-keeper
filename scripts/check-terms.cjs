const assert = require('node:assert/strict')
const { createLoader } = require('./load-ts.cjs')
const load = createLoader()
const T = load('@/lib/terms'), C = load('@/lib/terms-canon'), D = load('@/lib/terms-dk'), types = load('@/lib/types'), K = load('@/lib/keeper')

// 每个原作角色都有登记，粗口上限守住
for (const p of types.CHARACTER_PRESETS) {
  assert.ok(C.DK_TERMS[p.name], `缺称呼：${p.name}`)
  assert.deepEqual(T.capViolations(C.DK_TERMS[p.name]), [], p.name)
}
assert.equal(C.DK_TERMS['桑山千雪'].maternal, true)

// 命令识别
assert.deepEqual(T.detectTermCommands('以后叫自己小母狗'), [{ slot: 'self', value: '小母狗' }])
assert.deepEqual(T.detectTermCommands('从现在起叫我主人大人。'), [{ slot: 'player', value: '主人大人' }])
assert.deepEqual(T.detectTermCommands('把你的胸叫做「淫乱奶球」'), [{ slot: 'breast', value: '淫乱奶球' }])
assert.deepEqual(T.detectTermCommands('叫我一声就放你走'), [])

// 档位：器官跟快感走，但不超过堕落 +1；自称跟堕落走
const atago = K.characterFromPreset(types.CHARACTER_PRESETS.find((p) => p.name === '爱宕'))
let r = D.dkTerms({ ...atago, pleasure: 10 })
assert.equal(r.breast.value, '胸部'); assert.equal(r.self.value, '姐姐'); assert.equal(r.player.value, '你')
r = D.dkTerms({ ...atago, pleasure: 90 })
assert.equal(r.breast.value, '姐姐的胸') // 堕落矜持，最多到动摇档
const ruined = { ...atago, pleasure: 90, bodyDevelopment: { breast: 5, clitoris: 5, urethra: 5, vagina: 5, anus: 5 } }
r = D.dkTerms(ruined)
assert.equal(r.corruptTier, 3); assert.equal(r.breast.value, '姐姐的骚奶'); assert.equal(r.self.value, '姐姐这头发情的母狗')

// 命令 > 默认；作弊 > 锁定 > 命令；重置回默认
let c = D.applyTermCommands(atago, '以后叫我主人').character
assert.equal(D.dkTerms(c).player.value, '主人'); assert.equal(D.dkTerms(c).player.source, 'command')
c = { ...c, terms: T.toggleLock(c.terms, 'player', '主人') }
c = { ...c, terms: T.addOverrides(c.terms, [{ slot: 'player', value: '老公' }], 'cheat') }
assert.equal(D.dkTerms(c).player.value, '老公')
c = { ...c, terms: T.resetSlot(c.terms, 'player') }
assert.equal(D.dkTerms(c).player.source, 'default')

// 淫纹：限时 +1 档，到期失效，可解除
c = D.applyCrest({ ...atago, pleasure: 10 })
assert.equal(D.dkTerms(c).self.source, 'default') // 姐姐两档同名
assert.equal(D.dkTerms(c).breast.value, '姐姐的胸'); assert.equal(D.dkTerms(c).breast.source, 'item')
for (let i = 0; i < D.CREST_ITEM.turns; i++) c = D.tickTerms(c)
assert.equal(D.dkTerms({ ...c, pleasure: 10 }).boosted, false)
assert.equal(D.dkTerms(D.removeCrest(D.applyCrest(atago))).boosted, false)

// 改口提示与注入行
const before = D.dkTerms(atago), after = D.dkTerms(ruined)
assert.match(T.termsChange(before, after, '爱宕'), /爱宕改口了/)
assert.match(D.dkTermsLine(atago), /【本回合称呼·爱宕】自称「姐姐」｜叫你「你」/)
assert.equal(D.sourceWork(types.CHARACTER_PRESETS.find((p) => p.name === '爱宕')), '碧蓝航线')
// 台词形态轮换与叙述推进写进重油要求；上一段自我重复的句子会被点名
const B = load('@/lib/prose-bank'), PR = load('@/lib/prompts')
const block = B.denseStyleBlock({ stepIndex: 3, climaxAllowed: true, seed: 1 })
assert.ok(block.includes('相邻两句不能是同一个句式') && block.includes('叙述要往前走') && block.includes('逼近 → 高潮 → 余韵'))
assert.ok(!/每个叙述段后面跟一行她的台词/.test(B.denseTurnNote(3)))
assert.ok(!/每句台词至少一个 ❤/.test(PR.moanTierLine(90)))
const rep = '她的腰猛地弓起来，肥臀猛地夹紧。「肥臀猛地夹紧」光又亮了一分，肥臀猛地夹紧。\n[STATS：{}]'
assert.deepEqual(B.repeatedClauses(rep), ['肥臀猛地夹紧'])
assert.equal(B.repeatNote('一句不重复的话。'), '')
assert.ok(D.dkTermsLine(atago).includes('器官叫法一段回复里最多点两三次'))

// 每个角色的部位叫法：阶段对得上、专属词不串、非泌乳角色没有乳汁
const BT = load('@/lib/body-terms-dk')
const names = Object.keys(BT.DK_BODY_TERMS)
assert.equal(names.length, 26)
const LACT = ['女骑士薇奥拉', '娜露梅亚', '阿妮拉', '樫野', '信浓']
assert.deepEqual(names.filter((n) => BT.DK_BODY_TERMS[n].lactation).sort(), [...LACT].sort())
const pool = [...types.CHARACTER_PRESETS, ...load('@/lib/campaign').RAID_PARTY]
const mk = (name) => {
  assert.ok(pool.some((p) => p.name === name), `缺预设：${name}`)
  const preset = pool.find((p) => p.name === name)
  return preset ? K.characterFromPreset(preset) : { ...atago, id: `bt-${name}`, name, partner: undefined }
}
const dev = (n) => ({ breast: n, clitoris: n, urethra: n, vagina: n, anus: n })
// 堕落分 = 开发等级合计×6；四档 + 快感 95 为高潮
const STAGE_SETUPS = { pure: { pleasure: 0, bodyDevelopment: dev(0) }, shaken: { pleasure: 0, bodyDevelopment: dev(1) }, fallen: { pleasure: 0, bodyDevelopment: dev(2) }, broken: { pleasure: 0, bodyDevelopment: dev(4) }, climax: { pleasure: 99, bodyDevelopment: dev(2) } }
const lines = {}
for (const name of names) {
  const prof = BT.DK_BODY_TERMS[name]
  lines[name] = {}
  for (const stage of BT.BODY_STAGES) {
    const ch = { ...mk(name), ...STAGE_SETUPS[stage], brands: [], terms: undefined, statusEffects: [], encounter: undefined }
    const b = D.dkBodyTerms(ch)
    assert.equal(b.stage, stage, `${name} 阶段`)
    const want = prof.stages[stage]
    assert.equal(b.terms.breast, want.breast); assert.equal(b.terms.nipple, want.nipple); assert.equal(b.terms.pussy, want.pussy)
    const line = D.dkTermsLine(ch)
    for (const v of [want.breast, want.nipple, want.pussy]) assert.ok(line.includes(`「${v}」`), `${name}/${stage} 缺 ${v}`)
    if (prof.lactation) { assert.ok(want.milk && line.includes(`乳汁叫「${want.milk}」`), `${name}/${stage} 缺乳汁`) }
    else { assert.equal(b.terms.milk, undefined); assert.ok(!line.includes('乳汁叫'), `${name} 不该有乳汁`); assert.match(line, /她不泌乳/) }
    // 系统提示也带上同一行
    if (pool.some((p) => p.name === name) && stage === 'fallen') assert.ok(PR.buildSystemPrompt(ch).includes(D.dkBodyTermsLine(ch)))
    assert.ok(pool.some((p) => p.name === name), `${name} 没有预设，无法生成完整系统提示`)
    lines[name][stage] = `${line}\n${PR.buildSystemPrompt(ch)}` // 注入行 + 该角色完整的系统提示
  }
}
assert.equal(BT.DK_BODY_TERMS['桑山千雪'].lactation, false)
for (const s of BT.BODY_STAGES) assert.equal(BT.DK_BODY_TERMS['桑山千雪'].stages[s].milk, undefined)
const leaks = []
for (const owner of names) for (const word of BT.DK_BODY_TERMS[owner].signature) for (const other of names) {
  if (other === owner) continue
  const hit = BT.BODY_STAGES.filter((stage) => lines[other][stage].includes(word))
  if (!hit.length) continue
  const txt = lines[other][hit[0]], i = txt.indexOf(word)
  leaks.push(`「${word}」(${owner}的专属词) 出现在 ${other} 的完整系统提示 [${hit.join('/')}]：…${txt.slice(Math.max(0, i - 30), i + word.length + 30).replace(/\n/g, '⏎')}…`)
}
assert.deepEqual(leaks, [], `专属词串用：\n${leaks.join('\n')}`)
// 命令过的胸叫法仍以命令为准
const kc = D.applyTermCommands(mk('樫野'), '把你的胸叫做「补给舱」').character
assert.equal(D.dkBodyTerms(kc).terms.breast, '补给舱')
console.log('terms ok')
