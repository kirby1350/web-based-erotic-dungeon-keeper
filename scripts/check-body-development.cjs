const assert = require('node:assert/strict')
const { createLoader } = require('./load-ts.cjs')
const B = createLoader()('@/lib/body-development')

// 尤艾尔 T1 回归：只碰肩膀，走廊叫「甬道」，快感涨了也不给阴道经验
const shoulder = '她每往下走一步，铃铛就在狭窄的甬道里弹回来。城主的手按住她的肩膀，她的耳朵一抖。'
assert.deepEqual(B.developmentAwards(shoulder, 10, 25), {})
// 只是提到、没碰到的部位不算
assert.deepEqual(B.developmentAwards('她心想，小穴可绝不能让人看见。城主的手只落在她的肩上。', 10, 20).vagina, undefined)
// 真碰到的部位照常给
assert.equal(B.developmentAwards('城主的手指揉捏她的乳头。', 10, 15).breast, B.MILD_DEVELOPMENT_EXP)
assert.equal(B.developmentAwards('触手抽插着她的小穴，她高潮了。', 50, 90).vagina, B.INTENSE_DEVELOPMENT_EXP)
const s = B.settleBodyDevelopment({ breast: 0, clitoris: 0, urethra: 0, vagina: 0, anus: 0, exp: {} }, shoulder, 10, 25)
assert.equal(s.exp.vagina, 0)
// 常见写法：屄、阴唇、捏住阴蒂、攥住乳肉都算碰到
assert.ok(B.developmentAwards('你捏住那颗肥硕的阴蒂碾了一下。', 40, 48).clitoris)
assert.ok(B.developmentAwards('城主一把攥住她沉甸甸的乳肉，拇指按在奶头上。', 20, 30).breast)
assert.ok(B.developmentAwards('肉棒一下下插进湿透的屄里。', 50, 60).vagina)
// 呼吸、咬着牙、衣料摩擦、头顶不算碰到
assert.deepEqual(B.developmentAwards('胸脯随着急促的呼吸起伏。', 10, 12), {})
assert.deepEqual(B.developmentAwards('乳房随着步伐轻轻晃动时，布料摩擦出细微声响。', 10, 12), {})
// 双人：只提到同伴的段落归同伴
const sp = B.splitNarrative('城主揉捏大凤的乳头。\n触手插进爱宕的小穴。\n大凤看着爱宕。', '大凤', '爱宕')
assert.ok(B.developmentAwards(sp.partner, 0, 30).vagina && !B.developmentAwards(sp.focus, 0, 30).vagina)
// 专注一个部位、普通回合约 4 回合升 1 级
let d = { breast: 0, clitoris: 0, urethra: 0, vagina: 0, anus: 0, exp: {} }
for (let i = 0; i < 4; i++) d = B.settleBodyDevelopment(d, '城主的手指揉捏她的乳头。', 10, 15)
assert.equal(d.breast, 1)
console.log('body development checks passed')
const P = createLoader()('@/lib/prose-bank')
assert.equal(P.negationTurns('不是哭，是被揉出来的。不是风声，不是水滴——是脚步。这不是待客之道呀。').length, 2)
assert.equal(P.negationTurns('是不是很舒服？不是吗？').length, 0)
assert.ok(P.repeatNote('不是哭，是揉的。不是风，是人。').includes('2 次'))
assert.equal(P.repeatNote('不是哭，是揉的。').includes('不是……是'), false)
console.log('negation turn checks passed')
