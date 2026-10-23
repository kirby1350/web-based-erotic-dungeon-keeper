const assert = require('node:assert/strict')
const { createLoader } = require('./load-ts.cjs')
const load = createLoader()
const keeper = load('@/lib/keeper')
const cheat = load('@/lib/cheat')
const bank = load('@/lib/prose-bank')

// 重油词库：碰到身体后 800–1200，词会被记住并避开
assert.deepEqual(bank.denseLength(3), { min: 800, max: 1200 })
const opts = bank.denseBankOpts('揉她的乳', { pleasure: 40, encounter: null }, 7, ['滚烫'])
assert.equal(opts.stepIndex, 2)
assert.ok(bank.denseStyleBlock(opts).includes('800–1200'))
assert.ok(bank.denseTurnNote(3).includes('800–1200'))
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
