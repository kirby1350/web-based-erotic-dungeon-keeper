const assert = require('node:assert/strict')
const { createLoader } = require('./load-ts.cjs')
const load = createLoader()
const keeper = load('@/lib/keeper')
const cheat = load('@/lib/cheat')
const bank = load('@/lib/prose-bank')

// 重油词库：碰到身体后 1000–1500，词会被记住并避开
assert.deepEqual(bank.denseLength(3), { min: 1000, max: 1500 })
const opts = bank.denseBankOpts('揉她的乳', { pleasure: 40, encounter: null }, 7, ['滚烫'])
assert.equal(opts.stepIndex, 2)
assert.ok(bank.denseStyleBlock(opts).includes('1000–1500'))
assert.ok(bank.denseTurnNote(3).includes('1000–1500'))
const remembered = bank.rememberBankWords(['旧词'], '滚烫的乳峰，啾')
assert.ok(remembered.includes('滚烫'))

// 作弊：淫髓、升级全满、数值夹紧
const base = keeper.emptyKeep()
assert.equal(cheat.cheatEssence(base, 100).progress.essence, base.progress.essence + 100)
const maxed = cheat.cheatMaxUpgrades(base)
for (const key of cheat.UPGRADE_KEYS) assert.equal(keeper.upgradeCost(maxed.progress, key), null, key)
assert.equal(maxed.floors.length, maxed.progress.depth)
assert.deepEqual(cheat.cheatStats({ maxHp: 80 }, { hp: 999, pleasure: -5, desire: 50.4 }), { hp: 80, pleasure: 0, desire: 50 })

if (require.main === module) console.log('Keeper checks passed: dense bank, cheat.')
module.exports = { load, keeper }

// 长线：恶名、讨伐队、失败线与胜利线
const campaign = load('@/lib/campaign')
let c = campaign.emptyCampaign()
assert.equal(campaign.threatTier(0), 0)
assert.equal(campaign.threatTier(45), 2)
for (let i = 0; i < 12; i += 1) c = campaign.recordFate(c, `路人${i}`, 'broken')
assert.equal(c.raid, true)
const [hero, saint, knight] = campaign.RAID_PARTY.map((m) => m.name)
const lost = campaign.recordFate(c, hero, 'defeated')
assert.equal(lost.status, 'defeat')
let won = campaign.recordFate(c, hero, 'kept')
won = campaign.recordFate(won, saint, 'broken')
assert.equal(won.status, 'ongoing')
won = campaign.recordFate(won, knight, 'kept')
assert.equal(won.status, 'victory')
const endless = campaign.continueEndless(won)
assert.equal(campaign.recordFate(endless, '路人', 'kept').raid, false)
const scaled = campaign.scaleIntruder({ maxHp: 100, hp: 100, pleasure: 10, desire: 10 }, 2)
assert.equal(scaled.maxHp, 130)
assert.equal(keeper.normalizeKeep({ campaign: { infamy: 42, raid: true } }).campaign.infamy, 42)
console.log('Keeper checks passed: campaign.')

// 同层连携与自定义代价
const synergy = load('@/lib/synergy')
let s7 = keeper.emptyKeep()
s7 = { ...s7, traps: [{ id: 't1', name: '催情花圃', mechanism: '花粉让人发情', prose: '', placed: true, source: 'preset' }],
  monsters: [{ id: 'm1', name: '廊道触手看守', appearance: '触手', behavior: '缠住', placed: true, source: 'preset' }] }
s7.floors = s7.floors.map((f, i) => i === 0 ? { ...f, trapIds: ['t1'], monsterIds: ['m1'] } : f)
const combos = synergy.floorSynergies(s7, 1)
assert.ok(combos.some((c) => c.id === 'aphro_tentacle'))
assert.ok(synergy.synergyBonus(combos) <= synergy.SYNERGY_CAP)
assert.deepEqual(synergy.floorSynergies(s7, 2), [])
assert.ok(synergy.synergyPromptLine(combos).includes('催情触手'))
assert.ok(synergy.customBlock('trap', s7).includes('淫髓'))
const rich = cheat.cheatEssence(s7, 100)
assert.equal(synergy.customBlock('trap', rich), '')
assert.ok(synergy.customCost('monster', rich) >= 6)
console.log('Keeper checks passed: synergy and custom caps.')

// 重油示例与结构规则
{
  const block = bank.denseStyleBlock(bank.denseBankOpts('揉她的乳', { pleasure: 40, encounter: null }, 3, []))
  assert.ok(block.includes('节奏示例') && block.includes('四分之一') && block.includes('10 到 13'))
  assert.ok(!block.includes('寒暄、解释、重复的来回对白压到一两句'))
  assert.ok(bank.denseStyleBlock(bank.denseBankOpts('往里赶', { pleasure: 0, encounter: null }, 3, [])).includes('3 到 5'))
}
{
  for (let seed = 0; seed < 8; seed++) assert.ok(!/乳|奶|胸/.test(bank.pickExemplar(seed, '揉她的乳').slice(0, 0)) && bank.pickExemplar(seed, '揉她的乳') !== bank.DENSE_EXEMPLARS[0].text)
  assert.ok(bank.denseStyleBlock(bank.denseBankOpts('揉她的乳', { pleasure: 40, encounter: null }, 3, [])).includes('不要复用示例'))
}
