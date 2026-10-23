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
assert.equal(r.breast.value, '胸部'); assert.equal(r.self.value, '姐姐'); assert.equal(r.player.value, '弟弟')
r = D.dkTerms({ ...atago, pleasure: 90 })
assert.equal(r.breast.value, '姐姐的胸') // 堕落矜持，最多到动摇档
const ruined = { ...atago, pleasure: 90, bodyDevelopment: { breast: 5, clitoris: 5, urethra: 5, vagina: 5, anus: 5 } }
r = D.dkTerms(ruined)
assert.equal(r.corruptTier, 3); assert.equal(r.breast.value, '姐姐的骚奶'); assert.equal(r.self.value, '姐姐这头淫乱的母猪')

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
assert.match(D.dkTermsLine(atago), /【本回合称呼·爱宕】自称「姐姐」｜叫你「弟弟」/)
assert.equal(D.sourceWork(types.CHARACTER_PRESETS.find((p) => p.name === '爱宕')), '碧蓝航线')
console.log('terms ok')
