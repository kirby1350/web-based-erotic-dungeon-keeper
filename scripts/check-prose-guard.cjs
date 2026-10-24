const assert = require('node:assert/strict')
const load = require('./load-ts.cjs').createLoader()
const G = load('@/lib/prose-guard')

const para = (n) => '她' + '被压着慢慢往里顶'.repeat(Math.ceil(n / 9)).slice(0, n - 1)
const reply = ({ chars = 1200, lines = 5, neg = 0, options = true } = {}) => {
  const out = []
  const per = Math.floor(chars / 8)
  for (let i = 0; i < 8; i++) out.push(`*${para(per)}*`)
  for (let i = 0; i < lines; i++) out.splice(1 + i, 0, '“唔……”')
  for (let i = 0; i < neg; i++) out.push('不是害怕，是快感往上爬。')
  return out.join('\n\n') + (options ? '\n\n[OPTIONS]\n1. 继续\n2. 停手\n[/OPTIONS]\n[STATS:{"hp":100}]' : '')
}
const full = { dense: true, stepIndex: 3 }

// passes
let r = G.checkReply(reply(), full)
assert.deepEqual(r.failures, [], r.failures.join())
assert.equal(r.dialogue, 5)
assert.ok(r.length >= 1000 && r.length <= 1500, String(r.length))
// markers and options don't count toward length or dialogue
assert.equal(G.proseLength('正文\n[OPTIONS]\n“选项一”\n[/OPTIONS]'), 2)
assert.equal(G.dialogueLines('“一”\n*动作*\n「二」\n[OPTIONS]\n“三”'), 2)
// each failure type
assert.match(G.checkReply(reply({ chars: 1900 }), full).failures.join(), /超过上限 1500/)
assert.match(G.checkReply(reply({ chars: 600 }), full).failures.join(), /少于下限 1000/)
assert.match(G.checkReply(reply({ lines: 10 }), full).failures.join(), /台词 10 行，超过 7/)
assert.match(G.checkReply(reply({ lines: 2 }), full).failures.join(), /少于 4/)
assert.match(G.checkReply(reply({ neg: 2 }), full).failures.join(), /不是X，是Y」句 2 处/)
assert.equal(G.checkReply(reply({ neg: 1 }), full).failures.length, 0)
assert.match(G.checkReply(reply({ options: false }), full).failures.join(), /OPTIONS/)
// short tiers: length by tier, no dialogue floor
assert.deepEqual(G.checkReply(reply({ chars: 400, lines: 2 }), { dense: true, stepIndex: 0 }).failures, [])
assert.match(G.checkReply(reply({ chars: 900, lines: 2 }), { dense: true, stepIndex: 1 }).failures.join(), /超过上限 800/)
// non-dense: only negation + options
assert.deepEqual(G.checkReply(reply({ chars: 3000, lines: 15 }), { dense: false, stepIndex: null }).failures, [])
assert.equal(G.checkReply(reply({ chars: 3000, neg: 3 }), { dense: false, stepIndex: null }).failures.length, 1)

// retry note names what failed, appended to the last user message only, original untouched
const bad = G.checkReply(reply({ chars: 1900, lines: 10 }), full)
const note = G.retryNote(bad, full)
assert.match(note, /超过上限 1500/); assert.match(note, /台词 10 行/); assert.match(note, /1000–1500 字/)
const msgs = [{ role: 'system', content: 's' }, { role: 'user', content: 'u' }]
const out = G.withRetryNote(msgs, note)
assert.equal(out[0].content, 's'); assert.equal(out[1].content, 'u' + note); assert.equal(msgs[1].content, 'u')
assert.equal(out.length, msgs.length)

// keep-better: lower score wins, tie keeps first, unusable always loses
const A = { text: 'a', check: G.checkReply(reply({ chars: 1900 }), full), usable: true }
const B = { text: 'b', check: G.checkReply(reply({ chars: 1600 }), full), usable: true }
assert.equal(G.pickBetter(A, B).text, 'b')
assert.equal(G.pickBetter(B, A).text, 'b')
assert.equal(G.pickBetter(A, { ...A, text: 'a2' }).text, 'a')
assert.equal(G.pickBetter(A, { ...B, usable: false }).text, 'a')
assert.equal(G.pickBetter({ ...B, usable: false }, A).text, 'a')
// tolerance: strict failures still listed, but only clear misses trigger a retry
const exact = (chars, lines = 5) => [...Array(lines)].map(() => '“唔”').join('\n') + '\n' + '她'.repeat(chars - lines * 3) + '\n[OPTIONS]\n1. a\n[/OPTIONS]'
const lenOf = (chars) => G.checkReply(exact(chars), full)
let t = lenOf(1580)
assert.ok(t.length > 1500 && t.length <= 1800, String(t.length))
assert.equal(t.failures.length, 1); assert.deepEqual(t.clear, [])
t = lenOf(1700); assert.equal(t.failures.length, 1); assert.deepEqual(t.clear, [])
t = lenOf(1900); assert.ok(t.length > 1800); assert.equal(t.clear.length, 1)
t = lenOf(950); assert.ok(t.length >= 900 && t.length < 1000, String(t.length)); assert.equal(t.failures.length, 1); assert.deepEqual(t.clear, [])
t = lenOf(850); assert.ok(t.length >= 800); assert.deepEqual(t.clear, [])
t = lenOf(700); assert.ok(t.length < 800); assert.equal(t.clear.length, 1)
// short tier: 500 cap, clear above 600
t = G.checkReply(exact(520, 2), { dense: true, stepIndex: 0 }); assert.equal(t.failures.length, 1); assert.deepEqual(t.clear, [])
t = G.checkReply(exact(700, 2), { dense: true, stepIndex: 0 }); assert.equal(t.clear.length, 1)
// dialogue: 2–3 and 8–10 are strict-only, 1 and 11 are clear
for (const n of [2, 3, 8, 10]) { const c = G.checkReply(reply({ lines: n }), full); assert.deepEqual(c.clear, [], String(n)); assert.equal(c.failures.length, 1) }
assert.equal(G.checkReply(reply({ lines: 11 }), full).clear.length, 1)
assert.equal(G.checkReply(reply({ lines: 1 }), full).clear.length, 1)
// negation ≥2 and missing options are always clear
assert.equal(G.checkReply(reply({ neg: 2 }), full).clear.length, 1)
assert.equal(G.checkReply(reply({ options: false }), full).clear.length, 1)
assert.deepEqual(G.checkReply(reply(), full).clear, [])
// fewer clear misses beats a lower score: 1509 字 + 9 行 (one clear miss) vs 1700 字 (one clear miss, lower score) vs 1520 字 + 8 行 (no clear miss)
const mild = { text: 'mild', check: G.checkReply(exact(1520, 10), full), usable: true }
const loud = { text: 'loud', check: G.checkReply(exact(1900, 5), full), usable: true }
assert.ok(loud.check.score < G.checkReply(exact(1509, 11), full).score)
assert.equal(G.pickBetter({ text: 'nine', check: G.checkReply(exact(1509, 11), full), usable: true }, mild).text, 'mild')
assert.equal(G.pickBetter(mild, loud).text, 'mild')
console.log('prose guard checks passed')

// plan leaks at the start are stripped; mixed English/Chinese planning too
{
  const P = load('@/lib/chat-protocol')
  const a = 'Write 7-9 paragraphs, ~1100-1300 chars, 5 dialogue lines, pulse suction on nipples, orgasm arc, use her fallen称呼 (阿妮拉的骚奶 etc., max 2-3 organ mentions). End on a line of dialogue.榨乳机关的泵声换了个调子。\n「啊……」\n[OPTIONS]\n1. 继续\n[/OPTIONS]'
  assert.ok(P.cleanContent(a).startsWith('榨乳机关的泵声'), P.cleanContent(a))
  const b = 'Pause command: this is a停手/observation turn — short format allowed (250-500字), no new sex act. But硬性要求 says 1000-1500? The rules say停手/观察 turns use short format. I\'ll write ~350-450字. Say pleasure 30, desire 55.齿轮声一节一节地停了。吸杯松开她的奶头。'
  assert.ok(P.stripPlanLeak(b).startsWith('齿轮声一节一节地停了'), P.stripPlanLeak(b))
  const clean = '她咬着嘴唇。「才不要……」\n*石壁上渗着水。*'
  assert.equal(P.stripPlanLeak(clean), clean)
  assert.equal(P.stripPlanLeak('「OK啦，城主。」她笑了。'), '「OK啦，城主。」她笑了。')
  const mid = reply().replace('\n\n[OPTIONS]', '\n\nShe will moan here then orgasm now.\n\n[OPTIONS]')
  assert.match(G.checkReply(mid, full).clear.join(), /英文词/)
  const B = load('@/lib/prose-bank')
  assert.deepEqual(B.denseLength(4), { min: 250, max: 500 })
  assert.match(B.denseTurnNote(4), /正文 250–500 字/)
  assert.match(B.denseTurnNote(3), /不要先写计划/)
}
console.log('plan-leak ok')
