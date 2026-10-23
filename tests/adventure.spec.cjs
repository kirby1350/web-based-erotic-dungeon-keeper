const { test, expect } = require('@playwright/test')
const { character, reply } = require('../scripts/fixtures/adventure.cjs')
const seedSession = { messages: [
  { role: 'user', content: '检查石门', timestamp: 1, turnId: 'seed_1' },
  { role: 'assistant', content: reply(), timestamp: 2, turnId: 'seed_1' },
], summary: '', memory: { version: 1, entries: [] } }
const read = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('dungeon_game_v2')))
const sse = (content) => `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\ndata: [DONE]\n\n`
const respond = (route, content) => route.fulfill({ status: 200, contentType: 'text/event-stream', body: sse(content) })

for (const mode of ['skip', 'timeout']) {
  test(`stalled summary ${mode} unlocks play and preserves the save`, async ({ page }) => {
    const session = { ...seedSession, messages: Array.from({ length: 10 }, (_, index) =>
      seedSession.messages.map(message => ({ ...message, turnId: `summary_${index}` }))).flat() }
    await setup(page, session)
    await page.clock.install()
    let release
    const gate = new Promise(resolve => { release = resolve })
    await page.route('**/api/chat', async route => {
      await gate
      await respond(route, JSON.stringify({ summary: 'Late summary', updates: [] })).catch(() => {})
    })
    await page.goto('/')
    const skip = page.getByRole('button', { name: '跳过摘要', exact: true })
    await expect(skip).toBeVisible()
    const before = await read(page)
    if (mode === 'skip') await skip.click()
    else await page.clock.fastForward(60_001)
    await expect(skip).toHaveCount(0)
    await expect(page.getByRole('button', { name: '往里赶', exact: true })).toBeEnabled()
    await expect(page.getByText(mode === 'skip'
      ? '已跳过摘要，原始对话已保留，可以继续游戏'
      : '摘要整理超时，已保留原始对话，可以继续游戏', { exact: true })).toBeVisible()
    release()
    expect(await read(page)).toEqual(before)
  })
}

async function setup(page, session = seedSession) {
  // All browser storage belongs to a fresh Playwright context, never the user's profile.
  await page.addInitScript(({ character, session }) => {
    if (localStorage.getItem('test_seeded')) return
    localStorage.setItem('test_seeded', '1')
    localStorage.setItem('dungeon_game_v2', JSON.stringify({ version: 2, character, session }))
  }, { character, session })
  await page.route('https://**/*', (route) => route.abort())
  // Prevent any fallback request to real chat or image services.
  await page.route('**/api/**', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"Mock-only test"}' }))
}

test('network failure, reload and retry commit exactly one exploration turn', async ({ page }) => {
  await setup(page)
  const requests = []
  await page.route('**/api/chat', async (route) => {
    requests.push(route.request().postDataJSON())
    if (requests.length === 1) return route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"模拟断网"}' })
    return respond(route, reply())
  })
  await page.goto('/')
  await page.getByRole('button', { name: '往里赶', exact: true }).click()
  await expect(page.getByRole('button', { name: '继续生成', exact: true })).toBeVisible()
  const failed = await read(page)
  expect(failed.character.explorationProgress).toBe(40)
  expect(failed.session.messages).toHaveLength(2)
  const id = failed.session.pendingTurn.id
  await page.reload()
  await page.getByRole('button', { name: '继续生成', exact: true }).click()
  await expect.poll(async () => (await read(page)).session.pendingTurn).toBeNull()
  const completed = await read(page)
  expect(completed.character.explorationProgress).toBe(60)
  expect(completed.session.messages).toHaveLength(4)
  expect(completed.session.turns[0].id).toBe(id)
  expect(requests[0].messages).toEqual(requests[1].messages)
  await expect(page.getByPlaceholder('看她，或把她往前赶...')).toHaveCount(1)
})

test('invalid state repairs metadata only and keeps the original narrative', async ({ page }) => {
  await setup(page)
  const requests = []
  const story = '石门背后传来水声，地图上未标记的通道通向地下河。'
  await page.route('**/api/chat', (route) => {
    requests.push(route.request().postDataJSON())
    return respond(route, requests.length === 1 ? reply(character, story).replace('"hp":80', '"hp":"错误"') : reply().slice(reply().indexOf('[STATS')))
  })
  await page.goto('/')
  await page.getByRole('button', { name: '往里赶', exact: true }).click()
  await expect.poll(async () => (await read(page)).session.turns?.length ?? 0).toBe(1)
  const saved = await read(page)
  expect(saved.character.explorationProgress).toBe(60)
  expect(saved.session.messages.at(-1).content.startsWith(story)).toBe(true)
  expect(saved.session.turns[0].repaired).toBe(true)
  expect(requests).toHaveLength(2)
  expect(requests[1].messages[0].content).toContain('本请求只修复状态数据')
})

test('repair failure survives reload and retries only metadata', async ({ page }) => {
  await setup(page)
  const requests = []
  await page.route('**/api/chat', (route) => {
    requests.push(route.request().postDataJSON())
    return respond(route, requests.length === 1 ? reply().replace('"hp":80', '"hp":9000') : requests.length === 2 ? '[STATS:{' : reply().slice(reply().indexOf('[STATS')))
  })
  await page.goto('/')
  await page.getByRole('button', { name: '往里赶', exact: true }).click()
  await expect(page.getByRole('button', { name: '重试状态修复', exact: true })).toBeVisible()
  expect((await read(page)).character.explorationProgress).toBe(40)
  await page.reload()
  await page.getByRole('button', { name: '重试状态修复', exact: true }).click()
  await expect.poll(async () => (await read(page)).session.pendingTurn).toBeNull()
  expect((await read(page)).session.messages).toHaveLength(4)
  expect(requests[2].messages[0].content).toContain('本请求只修复状态数据')
})

test('messy repair metadata still settles the body', async ({ page }) => {
  await setup(page)
  const requests = []
  const messy = '[STATS:{"hp":"80","pleasure":20,"desire":1,"floor":9,"encounter":null,"measurements":{"bust":"90","waist":"65","hip":"92"},"bodyDevelopment":{"breast":9},"statusEffects":[],"note":"多余"}]\n[DESC:{"breast":"发胀"}]'
  await page.route('**/api/chat', (route) => {
    requests.push(route.request().postDataJSON())
    return respond(route, requests.length === 1 ? reply().replace('"hp":80', '"hp":9000') : messy)
  })
  await page.goto('/')
  await page.getByRole('button', { name: '往里赶', exact: true }).click()
  await expect.poll(async () => (await read(page)).session.pendingTurn).toBeNull()
  const saved = await read(page)
  expect(saved.character.pleasure).toBe(20)
  expect(saved.character.hp).toBe(80)
  expect(saved.character.floor).toBe(1)
  expect(saved.character.explorationProgress).toBe(60)
  expect(saved.character.bodyDevelopment.breast).toBe(0)
  expect(saved.character.bodyDevelopment.descriptions.breast).toBe('发胀')
  expect(saved.session.turns[0].repaired).toBe(true)
  expect(requests[1].messages[0].content).toContain('本请求只修复状态数据')
  expect(requests[1].messages[0].content).not.toContain('"hp":-1')
})

test('cancel ignores late response and abandoning leaves the original character intact', async ({ page }) => {
  await setup(page)
  let release
  const gate = new Promise((resolve) => { release = resolve })
  await page.route('**/api/chat', async (route) => { await gate; await respond(route, reply()).catch(() => {}) })
  await page.goto('/')
  await page.getByRole('button', { name: '往里赶', exact: true }).click()
  await page.getByTitle('停止生成').click()
  await expect(page.getByRole('button', { name: '放弃本回合', exact: true })).toBeVisible()
  release()
  await page.getByRole('button', { name: '放弃本回合', exact: true }).click()
  await expect.poll(async () => (await read(page)).session.pendingTurn).toBeNull()
  expect((await read(page)).character.explorationProgress).toBe(40)
  expect((await read(page)).session.messages).toHaveLength(2)
})

test('mobile image tab preserves the single in-flight chat instance', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await setup(page)
  let release
  const gate = new Promise((resolve) => { release = resolve })
  await page.route('**/api/chat', async (route) => { await gate; await respond(route, reply()) })
  await page.goto('/')
  await page.getByRole('button', { name: '往里赶', exact: true }).click()
  await page.getByRole('button', { name: '场景插图', exact: true }).click()
  await page.getByRole('button', { name: '探索', exact: true }).click()
  await expect(page.getByTitle('停止生成')).toBeVisible()
  await expect(page.getByPlaceholder('看她，或把她往前赶...')).toHaveCount(1)
  release()
  await expect.poll(async () => (await read(page)).session.pendingTurn).toBeNull()
  expect((await read(page)).session.messages).toHaveLength(4)
  await page.screenshot({ path: testInfo.outputPath('mobile.png'), fullPage: true })
})

test('summary preserves evidence-backed memory through reload', async ({ page }, testInfo) => {
  const messages = Array.from({ length: 10 }, (_, index) => [
    { role: 'user', content: '继续调查', timestamp: index * 2, turnId: `turn_${index}` },
    { role: 'assistant', content: reply(character, '冒险者答应归还钥匙。'), timestamp: index * 2 + 1, turnId: `turn_${index}` },
  ]).flat()
  await setup(page, { ...seedSession, messages })
  await page.route('**/api/chat', (route) => respond(route, JSON.stringify({ summary: '答应归还钥匙，继续调查。', updates: [
    { id: 'return_key', category: 'promise', text: '归还钥匙', status: 'active', sourceTurnId: 'turn_7', evidence: '冒险者答应归还钥匙' },
  ] })))
  await page.goto('/')
  await expect(page.getByText('地下城记忆 · 1 条进行中')).toBeVisible()
  expect((await read(page)).session.messages).toHaveLength(4)
  await page.reload()
  await page.getByText('地下城记忆 · 1 条进行中').click()
  await expect(page.getByText('承诺 · 进行中：归还钥匙')).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('desktop-memory.png'), fullPage: true })
})

test('storage failure before generation never sends a request', async ({ page }) => {
  await setup(page)
  let requests = 0
  await page.route('**/api/chat', (route) => { requests++; return respond(route, reply()) })
  await page.goto('/')
  await page.getByRole('button', { name: '往里赶', exact: true }).waitFor()
  await page.evaluate(() => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (key === 'dungeon_game_v2') throw new DOMException('Storage full', 'QuotaExceededError')
      return original.call(this, key, value)
    }
  })
  await page.getByRole('button', { name: '往里赶', exact: true }).click()
  await expect(page.getByText(/无法保存待完成回合/)).toBeVisible()
  expect(requests).toBe(0)
  expect((await read(page)).character.explorationProgress).toBe(40)
})

test('storage failure at commit retries saving without regenerating', async ({ page }) => {
  await setup(page)
  let requests = 0
  await page.route('**/api/chat', (route) => { requests++; return respond(route, reply()) })
  await page.goto('/')
  await page.getByRole('button', { name: '往里赶', exact: true }).waitFor()
  await page.evaluate(() => {
    const original = Storage.prototype.setItem
    window.restoreStorageWrites = () => { Storage.prototype.setItem = original }
    Storage.prototype.setItem = function (key, value) {
      if (key === 'dungeon_game_v2' && JSON.parse(value).session?.turns?.length) throw new DOMException('Storage full', 'QuotaExceededError')
      return original.call(this, key, value)
    }
  })
  await page.getByRole('button', { name: '往里赶', exact: true }).click()
  await expect(page.getByRole('button', { name: '重试保存', exact: true })).toBeVisible()
  expect((await read(page)).character.explorationProgress).toBe(40)
  expect((await read(page)).session.pendingTurn.phase).toBe('ready')
  await page.evaluate(() => window.restoreStorageWrites())
  await page.reload()
  await page.getByRole('button', { name: '重试保存', exact: true }).click()
  await expect.poll(async () => (await read(page)).session.pendingTurn).toBeNull()
  expect((await read(page)).character.explorationProgress).toBe(60)
  expect(requests).toBe(1)
})

test('zero hp settles her as broken and returns to the hall', async ({ page }) => {
  await setup(page)
  let calls = 0
  await page.route('**/api/chat', (route) => {
    calls += 1
    return respond(route, calls === 1 ? reply({ ...character, hp: 0 }) : '她倒在石地上，话已经说不成句。')
  })
  await page.goto('/')
  await page.getByRole('button', { name: '往里赶', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: /玩坏 · 林/ })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: '先不处置' })).toHaveCount(0)
  await expect(dialog.getByRole('button', { name: '知道了', exact: true })).toBeEnabled()
  await dialog.getByRole('button', { name: '知道了', exact: true }).click()
  await expect(page.getByRole('heading', { name: '地下城城主' })).toBeVisible()
  await expect(page.getByRole('button', { name: /迎接入侵者/ })).toBeEnabled()
  const keep = await page.evaluate(() => JSON.parse(localStorage.getItem('dungeon_keep')))
  expect(keep.roster).toEqual([])
  expect(keep.collection[0].fate).toBe('broken')
  expect(keep.collection[0].character.hp).toBe(0)
  expect(keep.progress.essence).toBe(16)
  expect((await read(page)).character).toBeNull()
})

test('keeper hall receives an intruder and stocks a trap', async ({ page }) => {
  await page.addInitScript(() => localStorage.clear())
  await page.route('https://**/*', (route) => route.abort())
  await page.route('**/api/**', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"Mock-only test"}' }))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '地下城城主' })).toBeVisible()
  await page.getByRole('button', { name: /迎接入侵者/ }).click()
  await expect(page.getByRole('button', { name: /亲自上手/ })).toBeVisible()
  await page.getByRole('button', { name: /亲自上手/ }).click()
  await expect(page.getByRole('button', { name: '看她进来', exact: true })).toBeVisible()
  await expect(page.getByText('她自己走进来')).toBeVisible()
  await page.getByTitle('回到城主厅，这场探索会留着').click()
  await expect(page.getByRole('button', { name: '继续调教', exact: true })).toBeVisible()
  await page.getByRole('button', { name: /档案册/ }).click()
  await expect(page.getByRole('heading', { name: '档案册' })).toBeVisible()
  await expect(page.getByText('这座狱里的人')).toBeVisible()
  await expect(page.getByText('还没来过的角色库')).toBeVisible()
  await page.getByRole('button', { name: '回到城主厅' }).click()
  await page.getByRole('button', { name: /陷阱工房/ }).click()
  await page.getByRole('button', { name: /触手深渊/ }).click()
  await expect(page.getByRole('button', { name: '布置', exact: true })).toBeVisible()
  const keep = await page.evaluate(() => JSON.parse(localStorage.getItem('dungeon_keep')))
  expect(keep.traps.some((trap) => trap.id === 'tentacle_pit' && trap.placed === false)).toBe(true)
  expect(keep.collection).toEqual([])
  await page.getByRole('button', { name: '回到城主厅' }).click()
  await expect(page.getByRole('button', { name: /迎接入侵者/ })).toBeDisabled()
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('button', { name: '留下', exact: true })).toBeDisabled()
  await expect(page.getByText('快感还没到 80，玩不坏。')).toBeVisible()
  await page.getByRole('button', { name: '继续调教', exact: true }).click()
  await page.getByTitle('回到城主厅，这场探索会留着').waitFor()
  await page.evaluate(() => {
    const game = JSON.parse(localStorage.getItem('dungeon_game_v2'))
    game.character.pleasure = 45
    localStorage.setItem('dungeon_game_v2', JSON.stringify(game))
  })
  await page.getByTitle('回到城主厅，这场探索会留着').click()
  await page.getByRole('button', { name: '留下', exact: true }).click()
  await page.getByRole('button', { name: '确认留下', exact: true }).click()
  await page.getByRole('button', { name: '知道了', exact: true }).click()
  await expect(page.getByRole('button', { name: /迎接入侵者/ })).toBeEnabled()
  await page.getByRole('button', { name: /收藏室/ }).click()
  await expect(page.getByRole('button', { name: '进去调教', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '外面观赏', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '普通地牢', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '放走', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '假装放走', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '召回迷宫', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '扔掉', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: '放走', exact: true }).click()
  await page.getByRole('button', { name: '知道了', exact: true }).click()
  await expect(page.getByRole('button', { name: '召回迷宫', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '再次探索', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '进去调教', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '外面观赏', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: '召回迷宫', exact: true }).click()
  await page.getByRole('button', { name: '知道了', exact: true }).click()
  await expect(page.getByText('她被传送进迷宫')).toBeVisible()
  await expect(page.getByRole('button', { name: '看她出现', exact: true })).toBeVisible()
  await page.getByTitle('回到城主厅，这场探索会留着').click()
  await page.getByRole('button', { name: /收藏室/ }).click()
  await expect(page.getByText('收藏室还是空的')).toBeVisible()
  await page.getByRole('button', { name: '回到城主厅' }).click()
  await page.getByRole('button', { name: /魔物工房/ }).click()
  await expect(page.getByRole('heading', { name: '魔物工房' })).toBeVisible()
  await expect(page.getByRole('button', { name: /廊道触手看守/ })).toBeVisible()
})

test('training scene stays in the cage and offers a new interrogation', async ({ page }) => {
  await page.addInitScript(({ character, session }) => {
    localStorage.clear()
    localStorage.setItem('dungeon_game_v2', JSON.stringify({ version: 2, character, session }))
    localStorage.setItem('dungeon_keep', JSON.stringify({
      brief: { opening: 'personal', return: 'train', defenseName: '机械牢笼', cage: 'machine' },
    }))
  }, { character, session: seedSession })
  await page.route('https://**/*', (route) => route.abort())
  await page.route('**/api/**', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"Mock-only test"}' }))
  await page.goto('/')
  await expect(page.getByText('机械牢笼', { exact: true })).toBeVisible()
  await expect(page.getByText('这一轮 · 她出不去', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '往里赶', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '送下层', exact: true })).toHaveCount(0)
  await expect(page.getByPlaceholder('写下这一轮的拷问...')).toBeVisible()
  await page.getByRole('button', { name: /^场景插图/ }).click()
  await expect(page.getByText('这一轮的画面会留在这里')).toBeVisible()
  await page.locator('button.flex-1').first().click()
  await expect(page.getByText('加码', { exact: true })).toBeVisible()
  await expect(page.getByText('换一种', { exact: true })).toBeVisible()
  await page.getByTitle('工具').evaluate((button) => button.click())
  await expect(page.getByRole('button', { name: '随机拷问', exact: true })).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('button', { name: '调教', exact: true })).toBeVisible()
})
