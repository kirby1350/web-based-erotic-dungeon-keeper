// 地城：连携结算、放置、阶段、升级、旧档迁移、提示词
const assert = require('node:assert/strict')
const { createLoader } = require('./load-ts.cjs')
const load = createLoader()
const K = load('@/lib/keeper')
const T = load('@/lib/trap-craft')
const { PRESET_TRAPS } = load('@/lib/types')
const { buildSystemPrompt } = load('@/lib/prompts')

const preset = (id) => K.trapFromPreset(PRESET_TRAPS.find((t) => t.id === id))
const monster = (id, name, behavior) => ({ id, name, appearance: '', behavior, placed: false, source: 'custom' })

// --- 预设带类别、状态、习性 ---
const pollen = preset('pollen_garden')
assert.equal(pollen.category, '催情植物'); assert.equal(pollen.status, 'aphrodisiac'); assert.ok(pollen.habit.length > 4); assert.equal(pollen.level, 1)
assert.equal(T.TRAP_CATEGORIES.length, 17)
for (const t of PRESET_TRAPS) assert.ok(T.CATEGORY_SHEET[t.category], `sheet for ${t.category}`)

// --- 放置：点一件再点一层，每层上限，换层不用先取出 ---
let keep = K.emptyKeep()
keep.progress.trapSlots = 4; keep.progress.monsterSlots = 2; keep.progress.essence = 100
keep.traps = [pollen, preset('tentacle_pit'), preset('slime_swallow')]
keep.monsters = [monster('vine_beast', '触手藤兽', '用触手缠住她')]
keep = K.stuffDefense(keep, 1, 'trap', 'pollen_garden')
assert.deepEqual(keep.floors[1].trapIds, ['pollen_garden'])
keep = K.stuffDefense(keep, 1, 'trap', 'tentacle_pit')
const full = K.stuffDefense(keep, 1, 'trap', 'slime_swallow')
assert.equal(full, keep, 'per-floor trap cap 2')
keep = K.stuffDefense(keep, 2, 'trap', 'tentacle_pit')
assert.deepEqual(keep.floors[1].trapIds, ['pollen_garden']); assert.deepEqual(keep.floors[2].trapIds, ['tentacle_pit'])
keep = K.stuffDefense(keep, 1, 'monster', 'vine_beast')
keep = K.setGuard(keep, 1, 'vine_beast')
assert.equal(keep.floors[1].guardId, 'vine_beast')
const moved = K.stuffDefense(keep, 0, 'monster', 'vine_beast')
assert.equal(moved.floors[1].guardId, undefined, 'guard clears when the monster moves away')

// --- 连携真正进淫髓结算 ---
const combos = load('@/lib/synergy').floorSynergies(keep, 2)
assert.ok(combos.some((c) => c.id === 'aphro_tentacle'))
const bonus = K.floorBonus(keep, 2)
assert.ok(bonus.synergy >= 0.35 && bonus.synergy <= 0.6)
const plain = K.essenceFromPleasure(20, 60)
assert.equal(K.turnEssence(keep, 20, 60, 2), Math.round(plain * (1 + bonus.total)))
assert.ok(K.turnEssence(keep, 20, 60, 2) > K.turnEssence(keep, 20, 60, 3) || bonus.total === 0)
assert.equal(K.fateEssence(keep, 'kept', 2), Math.round(K.FATE_ESSENCE.kept * (1 + bonus.total)))
// 主题契合：把第 3 层改成触手巢
keep.floors[2] = { ...keep.floors[2], name: '触手巢穴', ambience: '墙上爬满湿滑的触手' }
assert.ok(K.floorThemed(keep, 3).length > 0, 'tentacle trap on tentacle floor is themed')
assert.equal(K.triggerChance(keep, 3), T.THEME_TRIGGER)

// --- 撞上 / 阶段 ---
let rolls = [0.1, 0.0]
const rolled = K.rollPlacedDefense(keep, 2, () => rolls.shift() ?? 0)
assert.ok(rolled && rolled.encounter.id)
keep.roster = [{ id: 'r1', station: '', character: { name: '芭尔莎', floor: 2 }, session: null, conversationId: 'c', brief: { opening: 'personal' } }]
keep.activeId = 'r1'
keep = K.recordSprung(keep, { id: 'pollen_garden', name: '催情花园', kind: 'trap' }, '芭尔莎', 2, 'r1')
assert.equal(keep.traps.find((t) => t.id === 'pollen_garden').hits, 1)
assert.equal(keep.history[0].intruder, '芭尔莎')
assert.equal(K.currentPhase(keep, 'r1', 'pollen_garden'), 0)
keep = K.advancePhase(keep, 'r1', { id: 'pollen_garden' })
assert.equal(K.currentPhase(keep, 'r1', 'pollen_garden'), 1)
for (let i = 0; i < 6; i++) keep = K.advancePhase(keep, 'r1', { id: 'pollen_garden' })
assert.equal(K.currentPhase(keep, 'r1', 'pollen_garden'), 4, 'phase caps at 余韵')
keep = K.advancePhase(keep, 'r1', null)
assert.equal(keep.phases.r1, undefined)

// --- 升级 ---
assert.ok(K.levelUpTrap(keep, 'pollen_garden') === keep, 'needs hits')
keep = { ...keep, traps: keep.traps.map((t) => t.id === 'pollen_garden' ? { ...t, hits: 3 } : t) }
const lv2 = K.levelUpTrap(keep, 'pollen_garden')
assert.equal(lv2.traps.find((t) => t.id === 'pollen_garden').level, 2)
assert.equal(lv2.progress.essence, keep.progress.essence - 8)
assert.equal(T.trapRestraint(lv2.traps.find((t) => t.id === 'pollen_garden')), 3)
const lv3trap = { ...lv2.traps.find((t) => t.id === 'pollen_garden'), level: 3 }
assert.equal(T.trapStatuses(lv3trap).length, 2)

// --- 旧档迁移 ---
const old = {
  traps: [
    { id: 'tentacle_pit', name: '触手深渊', mechanism: '触手缠绕四肢', prose: '', placed: true, source: 'preset' },
    { id: 'custom_a', name: '电流项圈', mechanism: '电极贴着乳头放电', prose: '', placed: true, source: 'custom' },
    { id: 'custom_b', name: '绳网', mechanism: '绳子缠住', prose: '', placed: true, source: 'custom' },
  ],
  monsters: [], floors: [{ name: 'A', ambience: 'a', trapIds: ['tentacle_pit', 'custom_a', 'custom_b'], monsterIds: [] }],
  progress: { trapSlots: 4 },
}
const migrated = K.normalizeKeep(old)
assert.equal(migrated.traps[0].category, '触手系')
assert.equal(migrated.traps[1].category, '电击系'); assert.equal(migrated.traps[1].status, 'aphrodisiac')
assert.equal(migrated.floors[0].trapIds.length, 2, 'overflow moved off floor 1')
assert.deepEqual(migrated.floors[1].trapIds, ['custom_b'])
assert.deepEqual(migrated.history, []); assert.deepEqual(migrated.phases, {})
assert.equal(migrated.traps[2].level, 1)

// --- 提示词：类别表、阶段、命中、接力、别重复 ---
const intr = { name: '芭尔莎', race: 'elf', floor: 2, hp: 100, maxHp: 100, pleasure: 30, desire: 20, measurements: {}, backstory: '', costumeDescription: '', otherDescription: '', sexual: '死穴是乳头，一碰就软', avatarUrl: null, bodyDevelopment: { breast: 2, clitoris: 0, urethra: 0, vagina: 1, anus: 0 }, statusEffects: [], encounter: { id: 'pollen_garden', name: '催情花园', kind: 'trap', summary: '', restraint: 2 } }
keep.roster[0].character = intr
keep = K.advancePhase(keep, 'r1', { id: 'pollen_garden' })
const ctx = K.keeperPromptContext(keep, ['亮度更亮，亮度调亮，炽白', '更亮了，亮度又跳'])
const sys = buildSystemPrompt(intr, '', 'standard', null, undefined, ctx)
assert.match(sys, /〔催情植物｜状态：媚药中毒｜Lv1〕/)
assert.match(sys, /【遭遇阶段】「催情花园」当前阶段 2\/5「锁定」/)
assert.match(sys, /乳（Lv2，她的死穴）/)
assert.match(sys, /精灵亲近草木/)
assert.match(sys, /【接力顺序】连携「[^」]*催情触手/)
assert.match(sys, /【别重复加码】最近两回合已经反复用过：调亮/)
assert.ok(T.weakParts({ sexual: '死穴是乳头，一碰就软', otherDescription: '' }).includes('breast'))
console.log('dungeon ok: placement, synergy settlement, theme, phases, level-up, migration, prompts')
