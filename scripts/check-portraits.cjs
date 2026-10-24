const assert = require('node:assert/strict')
const fs = require('node:fs'), os = require('node:os'), path = require('node:path')
const { execFileSync } = require('node:child_process')
const { createLoader } = require('./load-ts.cjs')
const load = createLoader()
const P = load('@/lib/portraits'), S = load('@/lib/status-view'), types = load('@/lib/types'), K = load('@/lib/keeper')

const atago = { ...types.CHARACTER_PRESETS.find((p) => p.name === '爱宕'), hp: 90, maxHp: 100, pleasure: 30, desire: 20 }
const dev = (n) => ({ breast: n, clitoris: n, urethra: 0, vagina: n, anus: n })

// 立绘：回退链
assert.equal(P.portraitSlug(atago), 'atago')
assert.deepEqual(P.portraitCandidates('fallen', true), ['fallen-climax', 'climax', 'fallen', 'shaken', 'pure'])
assert.deepEqual(P.portraitCandidates('pure', false), ['pure'])
assert.equal(P.resolvePortrait(atago, null).src, '/avatars/atago.png', '没有清单就用原头像')
assert.equal(P.resolvePortrait(atago, { atago: [] }).src, '/avatars/atago.png')
const fallen = { ...atago, bodyDevelopment: dev(2) } // 8×6 = 48 → 动摇
assert.equal(P.portraitState(fallen).tier, 'shaken')
const broken = { ...atago, bodyDevelopment: dev(4), brands: ['淫纹', '奴印'], pleasure: 97 } // 96+36 → 100 崩坏，高潮
assert.deepEqual(P.portraitState(broken), { tier: 'broken', climax: true })
assert.equal(P.resolvePortrait(broken, { atago: ['pure', 'shaken', 'climax'] }).src, '/portraits/atago/climax.png')
assert.equal(P.resolvePortrait({ ...broken, pleasure: 50 }, { atago: ['pure', 'shaken'] }).src, '/portraits/atago/shaken.png', '缺档往低一档回退')
assert.equal(P.resolvePortrait(broken, { atago: ['broken-climax', 'climax'] }).state, 'broken-climax')
assert.equal(P.resolvePortrait({ ...atago, avatarUrl: null }, { atago: ['pure'] }).src, null)
assert.equal(P.resolvePortrait(atago, null).focus, P.PORTRAIT_FOCUS.atago)
assert.equal(P.resolvePortrait(broken, { atago: ['pure.webp', 'climax.webp'] }).src, '/portraits/atago/climax.webp', 'webp 优先')
assert.equal(P.resolvePortrait({ ...broken, pleasure: 50 }, { atago: ['pure.webp', 'shaken'] }).src, '/portraits/atago/shaken.png', 'png 和 webp 混用')

// 清单脚本：只收合法状态名
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'portraits-'))
fs.mkdirSync(path.join(tmp, 'portraits', 'eclipse'), { recursive: true })
for (const f of ['pure.png', 'fallen-climax.png', 'climax.png', 'draft.png', 'notes.txt']) fs.writeFileSync(path.join(tmp, 'portraits', 'eclipse', f), '')
fs.mkdirSync(path.join(tmp, 'portraits', 'yuel'), { recursive: true })
for (const f of ['pure.webp', 'pure.png', 'shaken.png', 'old.webp']) fs.writeFileSync(path.join(tmp, 'portraits', 'yuel', f), '')
execFileSync(process.execPath, [path.join(__dirname, 'build-portraits-manifest.cjs')], { env: { ...process.env, PORTRAITS_PUBLIC: tmp }, stdio: 'ignore' })
assert.deepEqual(JSON.parse(fs.readFileSync(path.join(tmp, 'portraits-manifest.json'), 'utf8')), { eclipse: ['climax', 'fallen-climax', 'pure'], yuel: ['pure.webp', 'shaken'] })
fs.rmSync(tmp, { recursive: true, force: true })

// 状态面板：堕落进度、变化日志、布置
assert.deepEqual(S.corruptionView(fallen), { score: 48, tier: 1, label: '动摇', toNext: 92, nextAt: 50 })
assert.equal(S.corruptionView(broken).toNext, 100)
const after = { ...fallen, pleasure: 42, desire: 18, bodyDevelopment: { ...dev(2), anus: 3 }, brands: ['淫纹'] }
assert.deepEqual(S.statusChanges(fallen, after), ['快感 +12', '欲望 -2', '开发·后庭 2→3', '堕落 动摇→沦陷', '烙印「淫纹」'])
assert.deepEqual(S.pushChanges(['旧1', '旧2', '旧3'], ['a', 'b', 'c']), ['c', 'b', 'a', '旧1', '旧2'])
const keep = K.emptyKeep()
keep.traps = [{ id: 't1', name: '触手深渊', mechanism: '缠住', prose: '', placed: true, source: 'preset' }]
keep.floors[0] = { ...keep.floors[0], trapIds: ['t1'] }
assert.deepEqual(S.activeDefenses({ ...atago, floor: 1 }, keep).map((d) => d.name), ['触手深渊'])
assert.equal(S.activeDefenses({ ...atago, floor: 1, encounter: { id: 'x', name: '触手深渊', kind: 'trap', summary: '', restraint: 2 } }, keep)[0].engaged, true)
assert.deepEqual(S.buffTags({ ...atago, brands: ['奴印'] }).map((t) => t.label), ['奴印'])
console.log('portraits ok')
// 工房分组：每个预设陷阱都落进某一组
for (const t of types.PRESET_TRAPS) assert.notEqual(types.trapGroup(t.category), '其他', t.name)
console.log('trap groups ok')
