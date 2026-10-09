const assert = require('node:assert/strict')
const { createLoader } = require('./load-ts.cjs')
const load = createLoader()
const { buildTurnContext, resolveTurnCharacter, enforceTurnResult, buildProgramResultContext, rollExploreEncounter, statusForTrap, REPLY_FORMAT_EXAMPLE } = load('@/lib/adventure-context')
const { PRESET_TRAPS } = load('@/lib/types')

const character = {
  hp: 75, maxHp: 120, pleasure: 0, desire: 0,
  measurements: {},
  bodyDevelopment: { exp: { breast: 37 }, descriptions: { breast: 'unchanged' } },
  statusEffects: [{ id: 'fatigue', title: '疲劳', description: '移动速度下降' }],
  encounter: { id: 'gate', name: '石门', kind: 'trap', summary: '出口关闭', restraint: 1 },
}
const snapshot = JSON.parse(buildTurnContext(character).split('\n').at(-1))
assert.deepEqual(snapshot.bodyDevelopment, character.bodyDevelopment)
assert.deepEqual(snapshot.statusEffects, character.statusEffects)
assert.deepEqual(snapshot.encounter, character.encounter)
assert.equal(snapshot.maxHp, 120)
assert.equal(snapshot.floor, 1)
const cleared = JSON.parse(buildTurnContext({ ...character, encounter: null, statusEffects: [] }).split('\n').at(-1))
assert.equal(cleared.encounter, null)
assert.deepEqual(cleared.statusEffects, [])

// Settled button results must be visible even before React commits the new props.
const oldState = { ...character, floor: 2, explorationProgress: 100 }
const advance = { kind: 'advance', floor: 3 }
const nextState = resolveTurnCharacter(oldState, advance)
assert.equal(nextState.floor, 3)
assert.equal(nextState.explorationProgress, 0)
assert.equal(nextState.encounter, null)
assert.equal(oldState.floor, 2)
assert.equal(enforceTurnResult(oldState, { floor: 9 }, null).floor, 2)
assert.equal(enforceTurnResult(oldState, { floor: 1 }, null).floor, 2)
assert.equal(enforceTurnResult(oldState, { floor: 2 }, advance).floor, 3)
assert.equal(enforceTurnResult(oldState, { encounter: character.encounter }, advance).encounter.id, 'gate')

const escape = { kind: 'escape', encounter: null, explorationProgress: 80 }
const escaped = enforceTurnResult(oldState, { encounter: character.encounter, explorationProgress: 100 }, escape)
assert.equal(escaped.encounter, null)
assert.equal(escaped.explorationProgress, 80)
const weakened = { kind: 'escape', encounter: { ...character.encounter, restraint: 0 }, explorationProgress: 60 }
assert.equal(enforceTurnResult(oldState, { encounter: character.encounter }, weakened).encounter, null)
assert.equal(resolveTurnCharacter(oldState, weakened).encounter, null)
const held = { kind: 'escape', encounter: { ...character.encounter, restraint: 1 }, explorationProgress: 60 }
assert.equal(enforceTurnResult(oldState, { encounter: null }, held).encounter.restraint, 1)

const otherEffect = { id: 'cold', title: '寒冷', description: '需要保暖' }
const dispel = { kind: 'dispel', removed: true, effect: character.statusEffects[0] }
assert.equal(resolveTurnCharacter(oldState, dispel).statusEffects.length, 0)
const effectsAfterDispel = enforceTurnResult(oldState, { statusEffects: [...character.statusEffects, otherEffect] }, dispel).statusEffects
assert.deepEqual(effectsAfterDispel.map((effect) => effect.id), ['cold'])
const failedDispel = { ...dispel, removed: false }
assert.equal(enforceTurnResult(oldState, { statusEffects: [] }, failedDispel).statusEffects[0].id, 'fatigue')
assert.equal(enforceTurnResult(oldState, { statusEffects: character.statusEffects }, failedDispel).statusEffects.length, 1)
assert.equal(enforceTurnResult(oldState, {}, dispel).statusEffects.length, 0)

// Retrying a settled action is idempotent: do not award exploration twice.
const explore = { kind: 'explore', explorationProgress: 60, encounter: null }
const explored = resolveTurnCharacter({ ...oldState, explorationProgress: 40 }, explore)
assert.equal(resolveTurnCharacter(explored, explore).explorationProgress, 60)
assert.equal(explored.encounter, null)
assert.equal(enforceTurnResult(oldState, { encounter: character.encounter }, explore).encounter, null)
const sprung = PRESET_TRAPS.find((trap) => trap.category === '怪物巢穴')
const hit = { kind: 'explore', explorationProgress: 60, encounter: { id: sprung.id, name: sprung.name, kind: 'monster', summary: sprung.hint, restraint: 2 } }
assert.equal(enforceTurnResult({ ...oldState, encounter: null }, { encounter: null }, hit).encounter.id, sprung.id)
assert.equal(resolveTurnCharacter(resolveTurnCharacter({ ...oldState, encounter: null }, hit), hit).encounter.restraint, 2)
const rolls = [0.39, 0]
assert.equal(rollExploreEncounter(() => rolls.shift()).id, PRESET_TRAPS[0].id)
assert.equal(rollExploreEncounter(() => 0.4), null)
const tail = [0.39, 0.999]
const last = rollExploreEncounter(() => tail.shift())
assert.equal(last.id, PRESET_TRAPS[PRESET_TRAPS.length - 1].id)
assert.equal(last.restraint, 2)
const monsterIndex = PRESET_TRAPS.findIndex((trap) => trap.id === 'orc_nest')
const monsterRoll = [0.39, (monsterIndex + 0.1) / PRESET_TRAPS.length]
const monster = rollExploreEncounter(() => monsterRoll.shift())
assert.equal(monster.kind, 'monster')
assert.equal(monster.id, 'orc_nest')
assert.equal(statusForTrap(monster).id, 'estrus')
assert.equal(statusForTrap(null), null)
const pollen = { id: 'pollen_garden', name: '催情花园', kind: 'trap', summary: '花粉', restraint: 2 }
const trapStep = { kind: 'explore', explorationProgress: 60, encounter: pollen, statusEffect: statusForTrap(pollen) }
const host = { ...oldState, encounter: null }
assert.deepEqual(enforceTurnResult(host, { statusEffects: [] }, trapStep).statusEffects.map((effect) => effect.id), ['fatigue', 'aphrodisiac'])
assert.equal(resolveTurnCharacter(resolveTurnCharacter(host, trapStep), trapStep).statusEffects.length, 2)
assert.ok(buildProgramResultContext(hit).includes('这一步已经踏入'))
assert.ok(buildProgramResultContext(explore).includes('这一步没有触发陷阱'))
assert.equal(resolveTurnCharacter(resolveTurnCharacter(oldState, escape), escape).explorationProgress, 80)
assert.equal(resolveTurnCharacter(resolveTurnCharacter(oldState, weakened), weakened).encounter, null)
// A subsequent ordinary request has no result and may start a new encounter.
assert.equal(enforceTurnResult({ ...oldState, encounter: null }, { encounter: character.encounter }, null).encounter.id, 'gate')
assert.equal(JSON.parse(buildProgramResultContext(null).split('\n').at(-1)), null)
assert.deepEqual(JSON.parse(buildProgramResultContext(advance).split('\n').at(-1)), advance)

// Exercise the actual UI parsers without mounting the UI or making API requests.
const { extractMarkerJson, parseOptions, cleanContent } = load('@/lib/chat-protocol')
const exampleStats = extractMarkerJson(REPLY_FORMAT_EXAMPLE, 'STATS')
const exampleDesc = extractMarkerJson(REPLY_FORMAT_EXAMPLE, 'DESC')
assert.equal(exampleStats.encounter, null)
assert.equal(exampleStats.floor, -1)
assert.equal(exampleStats.hp, -1)
assert.equal(exampleStats.statusEffects.length, 0)
assert.equal(exampleDesc.breast.includes('禁止照抄'), true)
assert.equal(Object.keys(exampleDesc).length, 5)
assert.equal(parseOptions(REPLY_FORMAT_EXAMPLE).length, 4)
assert.equal(cleanContent(REPLY_FORMAT_EXAMPLE).includes('[STATS'), false)
for (const marker of ['STATS', 'DESC']) {
  const line = REPLY_FORMAT_EXAMPLE.split('\n').find((value) => value.startsWith(`[${marker}:`))
  assert.ok(line)
  assert.doesNotThrow(() => JSON.parse(line.slice(marker.length + 2, -1)))
}
console.log('Adventure context checks passed: state continuity, settled actions, retry idempotence, UI protocol parsing.')
