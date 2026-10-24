const { test, expect } = require('@playwright/test')
const { character, reply } = require('../scripts/fixtures/adventure.cjs')
const sse = (content) => `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\ndata: [DONE]\n\n`
const keep = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('dungeon_keep')))

async function setup(page, { settings = { cheatMode: true, proseStyle: 'dense' }, keepSeed = null } = {}) {
  await page.addInitScript(({ settings, keepSeed }) => {
    if (localStorage.getItem('test_seeded')) return
    localStorage.setItem('test_seeded', '1')
    localStorage.setItem('dungeon_settings', JSON.stringify(settings))
    if (keepSeed) localStorage.setItem('dungeon_keep', JSON.stringify(keepSeed))
  }, { settings, keepSeed })
  await page.route('https://**/*', (route) => route.abort())
  await page.route('**/api/**', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"Mock-only test"}' }))
}

test('cheat is off by default', async ({ page }) => {
  await setup(page, { settings: {} })
  await page.goto('/')
  await expect(page.getByTestId('campaign-card')).toBeVisible()
  await expect(page.getByTestId('cheat-hall')).toHaveCount(0)
})

test('keeper loop: cheat pick, dense turn, HP zero settles as broken and raises infamy', async ({ page }) => {
  await setup(page)
  const requests = []
  await page.route('**/api/chat', async (route) => {
    requests.push(route.request().postDataJSON())
    const snap = { ...character, hp: 100, maxHp: 100, pleasure: 20, desire: 10, explorationProgress: 0 }
    await route.fulfill({ status: 200, contentType: 'text/event-stream', body: sse(reply(snap, '她踏进潮湿的石廊，奶香混着汗香。')) })
  })
  await page.goto('/')
  await page.getByRole('button', { name: '升级全满' }).click()
  await expect.poll(async () => (await keep(page)).progress.depth).toBe(10)
  await page.getByText('迎接入侵者').click()
  await page.getByLabel('指定闯入者').selectOption('大凤')
  await expect(page.getByRole('heading', { name: '大凤' })).toBeVisible()
  await page.getByRole('button', { name: /亲自上手/ }).click()
  await page.getByRole('button', { name: '看她进来' }).click()
  await expect.poll(() => requests.length).toBeGreaterThan(0)
  const sys = requests.at(-1).messages[0].content
  expect(sys).toContain('本回合词库')
  await page.getByRole('button', { name: '作弊', exact: true }).click()
  await page.getByLabel('作弊HP').fill('0')
  await expect(page.getByText('玩坏 · 大凤')).toBeVisible()
  await expect(page.getByRole('button', { name: '先不处置' })).toHaveCount(0)
  await page.getByRole('button', { name: '知道了' }).click()
  await expect.poll(async () => (await keep(page)).collection[0]?.fate).toBe('broken')
  expect((await keep(page)).campaign.infamy).toBe(9)
})

test('hero party endgame: raid gate and both endings', async ({ page }) => {
  await setup(page)
  await page.goto('/')
  await page.getByRole('button', { name: '召来讨伐队' }).click()
  await expect(page.getByText('勇者讨伐队来袭')).toBeVisible()
  await page.getByText('迎接入侵者').click()
  await expect(page.getByRole('heading', { name: '勇者艾莉西亚' })).toBeVisible()
  await expect(page.getByRole('button', { name: '换一个' })).toHaveCount(0)
  await page.getByText('回到城主厅').click()
  await page.getByRole('button', { name: '失败结局' }).click()
  await expect(page.getByTestId('ending')).toContainText('地下城陷落')
  await page.getByRole('button', { name: '不认输，继续经营' }).click()
  await expect(page.getByTestId('ending')).toHaveCount(0)
  await page.getByRole('button', { name: '胜利结局' }).click()
  await expect(page.getByTestId('ending')).toContainText('勇者的终焉')
})

test('same-floor synergy shows in the dungeon editor', async ({ page }) => {
  await setup(page)
  await page.goto('/')
  await page.getByRole('button', { name: '淫髓 +100', exact: true }).click()
  await expect.poll(async () => (await keep(page))?.progress.essence ?? 0).toBeGreaterThan(99)
  await page.evaluate(() => {
    const k = JSON.parse(localStorage.getItem('dungeon_keep'))
    k.traps = [{ id: 't1', name: '催情花圃', mechanism: '花粉让人发情', prose: '', placed: true, source: 'preset' }]
    k.monsters = [{ id: 'm1', name: '廊道触手看守', appearance: '触手', behavior: '缠住', placed: true, source: 'preset' }]
    k.floors[0].trapIds = ['t1']; k.floors[0].monsterIds = ['m1']
    localStorage.setItem('dungeon_keep', JSON.stringify(k))
  })
  await page.reload()
  await page.getByRole('button', { name: '布置地城', exact: true }).click()
  await expect(page.getByTestId('synergy').first()).toContainText('催情触手')
})

test('tap a stocked trap then a floor to place it', async ({ page }) => {
  await setup(page)
  await page.goto('/')
  await page.getByRole('button', { name: '淫髓 +100', exact: true }).click()
  await expect.poll(async () => (await keep(page))?.progress.essence ?? 0).toBeGreaterThan(99)
  await page.evaluate(() => {
    const k = JSON.parse(localStorage.getItem('dungeon_keep'))
    k.traps = [{ id: 'tentacle_pit', name: '触手深渊', mechanism: '触手缠绕', prose: '', placed: false, source: 'preset' }]
    localStorage.setItem('dungeon_keep', JSON.stringify(k))
  })
  await page.reload()
  await page.getByRole('button', { name: '布置地城', exact: true }).click()
  await page.getByTestId('stock-tray').getByRole('button', { name: /触手深渊/ }).click()
  await page.getByRole('button', { name: '放到第 2 层', exact: true }).click()
  await expect.poll(async () => (await keep(page)).floors[1].trapIds).toEqual(['tentacle_pit'])
  await expect(page.getByTestId('slot-usage')).toContainText('1/')
})

test('prose guard: a failing dense reply is regenerated once with a note, and the better one is kept', async ({ page }) => {
  await setup(page)
  const requests = []
  const snap = { ...character, hp: 100, maxHp: 100, pleasure: 20, desire: 10, explorationProgress: 0 }
  const body = '她踏进潮湿的石廊，奶香混着汗香，裙摆被风掀起又落下。'.repeat(14)
  await page.route('**/api/chat', async (route) => {
    const req = route.request().postDataJSON()
    requests.push(req)
    const first = requests.length === 1
    const text = first ? `${body}不是害怕，是好奇。不是退缩，是试探。` : `${body}“啊啦。”`
    await route.fulfill({ status: 200, contentType: 'text/event-stream', body: sse(reply(snap, text)) })
  })
  await page.goto('/')
  await page.getByRole('button', { name: '升级全满' }).click()
  await page.getByText('迎接入侵者').click()
  await page.getByLabel('指定闯入者').selectOption('大凤')
  await page.getByRole('button', { name: /亲自上手/ }).click()
  await page.getByRole('button', { name: '看她进来' }).click()
  await expect(page.getByTestId('guard-retried')).toBeVisible()
  expect(requests.length).toBe(2)
  expect(requests[1].messages.at(-1).content).toContain('【重写：上一版没通过检查】')
  expect(requests[1].messages.at(-1).content).toContain('不是X，是Y」句 2 处')
  expect(requests[0].messages.at(-1).content).not.toContain('【重写')
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dungeon_game_v2')).session.messages.filter((m) => m.role === 'assistant').at(-1))
  expect(saved.content).toContain('啊啦')
  expect(saved.guard.retried).toBe(true)
  expect(saved.guard.failures).toEqual([])
  await page.waitForTimeout(500)
  expect(requests.length).toBe(2)
})

test('prose guard: a mild miss inside the tolerance is kept without a retry', async ({ page }) => {
  await setup(page)
  const requests = []
  const snap = { ...character, hp: 100, maxHp: 100, pleasure: 20, desire: 10, explorationProgress: 0 }
  const body = '她踏进潮湿的石廊，奶香混着汗香，裙摆被风掀起又落下。'.repeat(20).slice(0, 520)
  await page.route('**/api/chat', async (route) => {
    requests.push(route.request().postDataJSON())
    await route.fulfill({ status: 200, contentType: 'text/event-stream', body: sse(reply(snap, body)) })
  })
  await page.goto('/')
  await page.getByRole('button', { name: '升级全满' }).click()
  await page.getByText('迎接入侵者').click()
  await page.getByLabel('指定闯入者').selectOption('大凤')
  await page.getByRole('button', { name: /亲自上手/ }).click()
  await page.getByRole('button', { name: '看她进来' }).click()
  await expect.poll(async () => (await page.evaluate(() => JSON.parse(localStorage.getItem('dungeon_game_v2') || '{}').session?.messages?.length ?? 0))).toBe(2)
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dungeon_game_v2')).session.messages.at(-1))
  expect(requests.length).toBe(1)
  expect(saved.guard.retried).toBe(false)
  expect(saved.guard.first.join()).toContain('超过上限 500')
  expect(saved.guard.firstClear).toEqual([])
  await expect(page.getByTestId('guard-retried')).toHaveCount(0)
})

test('party: two intruders start together, split popup, switching focus', async ({ page }) => {
  await setup(page)
  const requests = []
  await page.route('**/api/chat', async (route) => {
    const body = route.request().postDataJSON()
    requests.push(body)
    const sys = body.messages[0].content
    if (sys.includes('处置之后的短场面')) {
      await route.fulfill({ status: 200, contentType: 'text/event-stream', body: sse('锁链从两侧同时收紧，把大凤和爱宕扯向两条岔路。爱宕回头喊了一声“指挥官，大凤就拜托了哦”，声音被石门吞掉。') })
      return
    }
    const snap = { ...character, hp: 100, maxHp: 100, pleasure: 20, desire: 10, explorationProgress: 0 }
    const partner = sys.includes('双人场面') ? '\n[PARTNER:{"name":"爱宕","hp":95,"pleasure":33,"desire":12}]' : ''
    await route.fulfill({ status: 200, contentType: 'text/event-stream', body: sse(reply(snap, '她踏进潮湿的石廊。\n\n*爱宕跟在后面红着脸别开眼。*\n\n“大凤，别看我啦……”') + partner) })
  })
  await page.goto('/')
  await page.getByText('迎接入侵者').click()
  await page.getByLabel('指定闯入者').selectOption('大凤')
  await page.getByLabel('指定同伴').selectOption('爱宕')
  await expect(page.getByTestId('party-card')).toContainText('她不是一个人来的')
  await page.getByRole('button', { name: /亲自上手/ }).click()
  await page.getByRole('button', { name: '看她进来' }).click()
  await expect.poll(() => requests.length).toBeGreaterThan(0)
  const first = requests[0].messages[0].content
  expect(first).toContain('双人场面')
  expect(first).toContain('同伴档案：爱宕')
  expect(requests[0].messages.at(-1).content).toContain('[PARTNER:')
  const bar = page.getByTestId('party-bar')
  await expect(bar).toContainText('两人同行')
  await expect(bar).toContainText('快感 33')
  await expect(page.locator('em', { hasText: '爱宕跟在后面红着脸别开眼' }).first()).toBeVisible()
  await expect(page.getByText('[PARTNER')).toHaveCount(0)
  const k = await keep(page)
  expect(k.roster).toHaveLength(1)
  expect(k.roster[0].character.partner?.name ?? (await page.evaluate(() => JSON.parse(localStorage.getItem('dungeon_game_v2')).character.partner.name))).toBe('爱宕')

  // 状态面板切换（桌面右栏 / 手机弹层）
  const mobile = (page.viewportSize()?.width ?? 1280) < 1024
  if (mobile) {
    await expect(page.getByTestId('mobile-partner')).toContainText('快感 33')
    await page.getByTestId('mobile-status').click()
  }
  const toggle = page.locator('[data-testid=party-toggle]:visible')
  await toggle.getByRole('tab', { name: /爱宕/ }).click()
  await expect(toggle.getByRole('tab', { name: /爱宕/ })).toHaveAttribute('aria-selected', 'true')
  if (mobile) await page.keyboard.press('Escape')

  // 拆开
  await bar.getByTestId('party-split').click()
  const dialog = page.getByRole('dialog', { name: '把大凤和爱宕拆开' })
  await expect(dialog).toContainText('扯向两条岔路')
  await expect(dialog.getByTestId('popup-text').locator('p').first()).toBeVisible()
  await dialog.getByRole('button', { name: '跟着大凤' }).click()
  await expect(bar).toContainText('已拆开')
  await expect(bar).toContainText('爱宕排在第二')
  const live = await page.evaluate(() => JSON.parse(localStorage.getItem('dungeon_game_v2')).character)
  expect(live.party.split).toBe(true)
  expect(live.party.note).toContain('岔路')

  // 换到第二个
  await bar.getByTestId('party-switch').click()
  await expect(bar).toContainText('跟着爱宕')
  await expect(bar).toContainText('大凤排在第二')
  const swapped = await page.evaluate(() => JSON.parse(localStorage.getItem('dungeon_game_v2')).character)
  expect(swapped.name).toBe('爱宕')
  expect(swapped.partner.name).toBe('大凤')
})

test('party: settling the focus hands the scene to the partner in the same slot', async ({ page }) => {
  await setup(page)
  await page.route('**/api/chat', async (route) => {
    const sys = route.request().postDataJSON().messages[0].content
    const snap = { ...character, hp: 100, maxHp: 100, pleasure: 20, desire: 10, explorationProgress: 0 }
    const partner = sys.includes('双人场面') ? '\n[PARTNER:{"name":"爱宕","hp":95,"pleasure":33,"desire":12}]' : ''
    await route.fulfill({ status: 200, contentType: 'text/event-stream', body: sse(reply(snap, '她踏进潮湿的石廊。') + partner) })
  })
  await page.goto('/')
  await page.getByText('迎接入侵者').click()
  await page.getByLabel('指定闯入者').selectOption('大凤')
  await page.getByLabel('指定同伴').selectOption('爱宕')
  await page.getByRole('button', { name: /亲自上手/ }).click()
  await page.getByRole('button', { name: '看她进来' }).click()
  await expect(page.getByTestId('party-bar')).toContainText('快感 33')
  await page.getByRole('button', { name: '作弊', exact: true }).click()
  await page.getByLabel('作弊HP').fill('0')
  await page.getByRole('button', { name: '知道了' }).click()
  await expect.poll(async () => (await keep(page)).collection[0]?.name).toBe('大凤')
  const k = await keep(page)
  expect(k.roster).toHaveLength(1)
  expect(k.roster[0].character.name).toBe('爱宕')
  expect(k.collection[0].character.partner).toBeUndefined()
  await expect(page.getByTestId('party-bar')).toHaveCount(0)
  const live = await page.evaluate(() => JSON.parse(localStorage.getItem('dungeon_game_v2')).character)
  expect(live.name).toBe('爱宕')
  expect(live.pleasure).toBe(33)
})
