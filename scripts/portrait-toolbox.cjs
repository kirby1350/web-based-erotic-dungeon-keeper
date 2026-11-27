#!/usr/bin/env node
/**
 * 地下城城主 · 角色头像与 5 档动态立绘自动生成工具箱 (Portrait Toolbox)
 *
 * 优先使用 PixAI Tsubaki.3 (DiT v2 API + contextImages 角色一致性参考)，
 * 亦支持 PixAI Tsubaki v2 与 TensorArt WAI-NSFW-V16 同 Seed 回退。
 *
 * 用法示例：
 *   node scripts/portrait-toolbox.cjs list
 *   node scripts/portrait-toolbox.cjs check-keys
 *   node scripts/portrait-toolbox.cjs generate 嘉列翁
 *   node scripts/portrait-toolbox.cjs generate 一之濑明日奈 --states pure,shaken,fallen,broken,climax
 *   node scripts/portrait-toolbox.cjs generate 羽川莲见 --provider pixai --model v3
 *   node scripts/portrait-toolbox.cjs generate 嘉列翁 --provider tensorart --seed 20261126
 */

const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { createLoader } = require('./load-ts.cjs')

const ROOT = path.join(__dirname, '..')
const PUBLIC_DIR = path.join(ROOT, 'public')
const AVATARS_DIR = path.join(PUBLIC_DIR, 'avatars')
const PORTRAITS_DIR = path.join(PUBLIC_DIR, 'portraits')

const TSUBAKI_V3_ID = '2024383379556065549'
const TSUBAKI_V2_ID = '1983308862240288769'
const TENSORART_WAI_ID = '943946051788787917'

const ALL_STATES = ['pure', 'shaken', 'fallen', 'broken', 'climax']

function loadEnv() {
  const out = { ...process.env }
  for (const name of ['.env', '.env.local']) {
    const file = path.join(ROOT, name)
    if (!fs.existsSync(file)) continue
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      if (!m) continue
      const val = m[2].replace(/^['"]|['"]$/g, '').trim()
      if (val) out[m[1]] = val
    }
  }
  return out
}

function loadCharacters() {
  const load = createLoader()
  const { CHARACTER_PRESETS } = load('@/lib/types')
  const { RAID_PARTY } = load('@/lib/campaign')
  const { IMAGE_NEGATIVE_PROMPT, characterLactates } = load('@/lib/prompts')
  const { portraitSlug } = load('@/lib/portraits')
  const all = [...CHARACTER_PRESETS, ...RAID_PARTY].map((preset) => ({
    preset,
    name: preset.name,
    slug: portraitSlug(preset) || preset.name,
    lactates: characterLactates(preset),
  }))
  return {
    all,
    negativePrompt: `${IMAGE_NEGATIVE_PROMPT}, artist name, logo, monochrome, greyscale, white background, simple background, bright background, pink background, neon glow, flat color, manga, doujinshi, comic, 4koma, multiple views, character sheet`,
  }
}

const ARTIST_PRESETS = {
  // 偶像大师系
  'ichinose-shiki': 'artist:kuse (0201), soft thick painting, glossy skin, detailed lace',
  'kuwayama-chiyuki': 'artist:paint musume, artist:paint_musume, soft digital painting',
  'sagisawa-fumika': 'artist:nohito',
  'miura-azusa': 'artist:41 (taskmaster41)',
  // 碧蓝幻想系
  narmaya: 'artist:eno yukimi',
  galleon: 'artist:obui',
  katalina: 'artist:nanahara fuyuki',
  anila: 'artist:eno yukimi',
  yuel: 'artist:tachibana yuu',
  // 蔚蓝档案系
  'ichinose-asuna': 'artist:thirty_8ght, colorful, vibrant colors',
  'hanekawa-hasumi': 'artist:belko',
  // 碧蓝航线 / 舰娘系
  kashino: 'artist:derauea',
  illustrious: 'artist:rhasta',
  belfast: 'artist:snowball22',
  takao: 'artist:nicoby',
  akagi: 'artist:ouma tokiichi',
  amagi: 'artist:tachibana yuu',
  shinano: 'artist:ouma tokiichi',
  taihou: 'artist:rhasta',
  atago: 'artist:nicoby',
  cheshire: 'artist:kaenuco',
  noshiro: 'artist:nohito',
  'new-jersey': 'artist:snowball22',
  // 其他作品与讨伐小队
  suomi: 'artist:k-suwabe, colorful, thick brushstrokes',
  lueira: 'artist:nironiro',
  eclipse: 'artist:kuse (0201), glossy skin, detailed lace',
  'hero-alicia': 'artist:v-mag',
  'saint-selena': 'artist:kase daiki',
  'knight-viola': 'artist:meion',
}

function presetArtistFor(slug, flags) {
  if (flags['artist-map'] && fs.existsSync(flags['artist-map'])) {
    try {
      const map = JSON.parse(fs.readFileSync(flags['artist-map'], 'utf8'))
      if (map[slug]) return map[slug]
    } catch {}
  }
  return ARTIST_PRESETS[slug] || ''
}

const BREAST_SIZE_RE = /^(?:flat chest|small breasts|medium breasts|large breasts|huge breasts|gigantic breasts|wide hips|huge hips|gigantic hips|huge ass|thick thighs|curvy)$/i
const PORTRAIT_BODY_TAGS = ['gigantic breasts', 'gigantic hips', 'huge hips', 'huge ass', 'thick thighs', 'curvy']
const PORTRAIT_NSFW_BODY_TAGS = ['huge areolae', 'gigantic nipples', 'protruding nipples', 'lactation']

function buildStatePrompt(preset, state, _lactates, artistTags = '', hasReference = false) {
  const baseTags = (preset.danbooruTags || '')
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t && !BREAST_SIZE_RE.test(t))

  const framing = [
    ...(artistTags ? [artistTags] : []),
    'masterpiece, best quality, amazing quality',
    'upper body, cowboy shot, front view, centered composition, looking at viewer',
    'dark atmospheric gradient background, dramatic rim lighting, glossy skin',
    ...(hasReference ? ['keep exact same artist style, same lineart, same shading, same lighting, same dark background, same face and hair'] : []),
  ]

  if (state === 'pure') {
    return [
      ...framing,
      ...baseTags,
      ...PORTRAIT_BODY_TAGS,
      'adult, composed expression, subtle confident smile, dignified posture, intact outfit',
    ].join(', ')
  }

  if (state === 'shaken') {
    return [
      ...framing,
      ...baseTags,
      ...PORTRAIT_BODY_TAGS,
      'adult, blush, light sweat, embarrassed expression, furrowed brows, biting lip, slightly disheveled clothes, trembling',
    ].join(', ')
  }

  if (state === 'fallen') {
    return [
      ...framing,
      ...baseTags,
      ...PORTRAIT_BODY_TAGS,
      'adult, torn clothes, open clothes, off shoulder, clothes pulled down, breasts out, exposed breasts',
      ...PORTRAIT_NSFW_BODY_TAGS,
      'milk dripping from nipples, heavy blush, sweat, glistening skin, half-closed eyes, parted lips, heavy breathing, seductive gaze',
    ].join(', ')
  }

  if (state === 'broken') {
    return [
      ...framing,
      ...baseTags,
      ...PORTRAIT_BODY_TAGS,
      'adult, torn clothes, clothes pulled down around waist, breasts out, bare breasts',
      ...PORTRAIT_NSFW_BODY_TAGS,
      'milk dripping from nipples, half-closed eyes, heart-shaped pupils, flushed face, open mouth, tongue out, saliva trail, tears, heavy blush, drenched in sweat, trembling, overwhelmed with pleasure',
    ].join(', ')
  }

  // climax
  return [
    ...framing,
    ...baseTags,
    ...PORTRAIT_BODY_TAGS,
    'adult, torn clothes, clothes pulled down, breasts out, bare breasts',
    ...PORTRAIT_NSFW_BODY_TAGS,
    'spraying milk, climax, intense ecstasy, head tilted slightly back, arched back, eyes half-closed, tears of pleasure, parted mouth, heavy blush, sweat droplets, trembling',
  ].join(', ')
}

function buildAvatarPrompt(preset, artistTags = '', hasReference = false) {
  const baseTags = (preset.danbooruTags || '')
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t && !BREAST_SIZE_RE.test(t))

  return [
    ...(artistTags ? [artistTags] : []),
    'masterpiece, best quality, amazing quality',
    'portrait, head and shoulders, upper chest, front view, centered composition, looking at viewer',
    'dark atmospheric gradient background, dramatic rim lighting, glossy skin',
    ...(hasReference ? ['keep exact same artist style, same soft lineart, same shading, same lighting, same dark background, same face and hair'] : []),
    ...baseTags,
    'adult, composed expression, subtle confident smile',
  ].join(', ')
}

async function generateViaPixaiV2({ apiKey, prompt, negativePrompt, contextImages = [], aspectRatio = '2:3' }) {
  const body = {
    modelVersionId: TSUBAKI_V3_ID,
    prompt,
    negativePrompt,
    aspectRatio,
    ...(contextImages.length ? { contextImages } : {}),
  }
  const res = await fetch('https://api.pixai.art/v2/image/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    const err = new Error(`PixAI v2 提交失败 (${res.status}): ${text}`)
    err.status = res.status
    throw err
  }
  const task = await res.json()
  const taskId = task.id
  if (!taskId) throw new Error(`PixAI v2 未返回 taskId: ${JSON.stringify(task)}`)
  for (let i = 0; i < 150; i++) {
    await new Promise((r) => setTimeout(r, 2000))
    const poll = await fetch(`https://api.pixai.art/v2/task/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!poll.ok) throw new Error(`PixAI v2 轮询失败 (${poll.status}): ${await poll.text()}`)
    const data = await poll.json()
    if (data.status === 'completed') {
      const url = data.outputs?.mediaUrls?.[0]
      const mediaId = data.outputs?.mediaIds?.[0] || null
      if (!url) throw new Error(`PixAI v2 完成但无 mediaUrls: ${JSON.stringify(data)}`)
      return { url, mediaId, provider: 'pixai-v3' }
    }
    if (data.status === 'failed' || data.status === 'cancelled') {
      throw new Error(`PixAI v2 任务失败: ${JSON.stringify(data)}`)
    }
  }
  throw new Error('PixAI v2 生成超时 (300s)')
}

async function generateViaPixaiV1({ apiKey, prompt, negativePrompt }) {
  const res = await fetch('https://api.pixai.art/v1/task', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      parameters: {
        prompts: prompt,
        negativePrompts: negativePrompt,
        modelId: TSUBAKI_V2_ID,
        width: 832,
        height: 1248,
        batchSize: 1,
      },
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    const err = new Error(`PixAI v1 提交失败 (${res.status}): ${text}`)
    err.status = res.status
    throw err
  }
  const task = await res.json()
  const taskId = task.id
  for (let i = 0; i < 150; i++) {
    await new Promise((r) => setTimeout(r, 2000))
    const poll = await fetch(`https://api.pixai.art/v1/task/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!poll.ok) throw new Error(`PixAI v1 轮询失败 (${poll.status})`)
    const data = await poll.json()
    if (data.status === 'completed') {
      const url = data.outputs?.mediaUrls?.[0]
      if (!url) throw new Error('PixAI v1 完成但无图片 URL')
      return { url, mediaId: null, provider: 'pixai-v2' }
    }
    if (data.status === 'failed') throw new Error('PixAI v1 任务失败')
  }
  throw new Error('PixAI v1 生成超时')
}

async function generateViaTensorArt({ apiKey, prompt, negativePrompt, seed = -1 }) {
  const requestId = Array.from({ length: 18 }, () => Math.floor(Math.random() * 10)).join('')
  const res = await fetch('https://ap-east-1.tensorart.cloud/v1/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      request_id: requestId,
      stages: [
        { type: 'INPUT_INITIALIZE', inputInitialize: { seed, count: 1 } },
        {
          type: 'DIFFUSION',
          diffusion: {
            width: 832,
            height: 1248,
            prompts: [{ text: prompt }],
            negativePrompts: [{ text: negativePrompt }],
            sdModel: TENSORART_WAI_ID,
            sdVae: 'ae.sft',
            sampler: 'Euler a',
            steps: 28,
            cfgScale: 6.5,
            clipSkip: 2,
          },
        },
      ],
    }),
  })
  if (!res.ok) throw new Error(`TensorArt 提交失败 (${res.status}): ${await res.text()}`)
  const created = await res.json()
  const jobId = created?.job?.id
  if (!jobId) throw new Error(`TensorArt 未返回 jobId: ${JSON.stringify(created)}`)
  for (let i = 0; i < 150; i++) {
    await new Promise((r) => setTimeout(r, 2000))
    const poll = await fetch(`https://ap-east-1.tensorart.cloud/v1/jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!poll.ok) throw new Error(`TensorArt 轮询失败 (${poll.status})`)
    const data = await poll.json()
    const status = data?.job?.status
    if (status === 'SUCCESS') {
      const img = data?.job?.successInfo?.images?.[0]
      if (!img?.url) throw new Error('TensorArt 完成但无图片 URL')
      const usedSeed = Number(img?.seed ?? seed)
      return { url: img.url, mediaId: null, seed: Number.isFinite(usedSeed) ? usedSeed : seed, provider: 'tensorart-wai-v16' }
    }
    if (status === 'FAILED') throw new Error(`TensorArt 生成失败: ${JSON.stringify(data?.job)}`)
  }
  throw new Error('TensorArt 生成超时')
}

async function downloadFile(url, destPath) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`下载图片失败 (${res.status}): ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  fs.mkdirSync(path.dirname(destPath), { recursive: true })
  fs.writeFileSync(destPath, buf)
}

function isWebpFile(filePath) {
  const buf = fs.readFileSync(filePath)
  return buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP'
}

function findImageMagick() {
  const candidates = process.platform === 'win32' ? ['magick'] : ['magick', 'convert']
  for (const bin of candidates) {
    try {
      execFileSync(bin, ['-version'], { stdio: 'pipe' })
      return bin
    } catch {}
  }
  return null
}

function savePortraitImage(inputPath, subDir, state) {
  fs.mkdirSync(subDir, { recursive: true })
  const webpPath = path.join(subDir, `${state}.webp`)
  const pngPath = path.join(subDir, `${state}.png`)
  if (isWebpFile(inputPath)) {
    fs.copyFileSync(inputPath, webpPath)
    if (fs.existsSync(pngPath)) fs.unlinkSync(pngPath)
    return webpPath
  }
  const im = findImageMagick()
  if (im) {
    execFileSync(im, [inputPath, '-quality', '86', webpPath], { stdio: 'pipe' })
    if (fs.existsSync(pngPath)) fs.unlinkSync(pngPath)
    return webpPath
  }
  // 无 ImageMagick 时直接保存 .png（build-portraits-manifest 与前端原生兼容 .png，并清理旧 .webp 避免被优先命中）
  fs.copyFileSync(inputPath, pngPath)
  if (fs.existsSync(webpPath)) fs.unlinkSync(webpPath)
  return pngPath
}

function cropAvatarFromPortrait(inputPath, avatarPngPath) {
  const im = findImageMagick()
  if (!im) {
    console.warn('  ⚠️ 未检测到 ImageMagick，跳过自动裁切头像')
    return false
  }
  fs.mkdirSync(path.dirname(avatarPngPath), { recursive: true })
  // 从 2:3 上半身立绘顶部偏上区域裁出正方形头像 (宽度的 76%，垂直偏移约 4%)
  execFileSync(
    im,
    [
      inputPath,
      '-gravity', 'North',
      '-crop', '78%x52%+0+3%',
      '+repage',
      '-resize', '512x512^',
      '-gravity', 'Center',
      '-extent', '512x512',
      avatarPngPath,
    ],
    { stdio: 'pipe' },
  )
  return true
}

function parseArgs(argv) {
  const positional = []
  const flags = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const key = a.slice(2)
      const next = argv[i + 1]
      if (next && !next.startsWith('--')) {
        flags[key] = next
        i++
      } else {
        flags[key] = 'true'
      }
    } else {
      positional.push(a)
    }
  }
  return { cmd: positional[0] || 'list', target: positional[1], flags }
}

async function cmdCheckKeys(env) {
  console.log('=== 图片生成 API 密钥状态检测 ===')
  if (env.PIXAI_API_KEY) {
    const r = await fetch('https://api.pixai.art/v2/task/0000000000000000000', {
      headers: { Authorization: `Bearer ${env.PIXAI_API_KEY}` },
    })
    if (r.status === 401) console.log('PixAI (PIXAI_API_KEY): ❌ Token 已失效或无效 (401 invalid token)，请更新 .env 中的 PIXAI_API_KEY')
    else console.log(`PixAI (PIXAI_API_KEY): ✅ 已就绪 (HTTP ${r.status}，支持 Tsubaki.3 [${TSUBAKI_V3_ID}])`)
  } else {
    console.log('PixAI (PIXAI_API_KEY): ⚪ 未设置')
  }

  if (env.TENSORART_API_KEY) {
    const r = await fetch('https://ap-east-1.tensorart.cloud/v1/jobs/0', {
      headers: { Authorization: `Bearer ${env.TENSORART_API_KEY}` },
    })
    if (r.status === 401 || r.status === 403) console.log(`TensorArt (TENSORART_API_KEY): ❌ 鉴权失败 (${r.status})`)
    else console.log(`TensorArt (TENSORART_API_KEY): ✅ 已就绪 (HTTP ${r.status}，支持 WAI-NSFW-V16 [${TENSORART_WAI_ID}])`)
  } else {
    console.log('TensorArt (TENSORART_API_KEY): ⚪ 未设置')
  }
}

function cmdList() {
  const { all } = loadCharacters()
  console.log(`共 ${all.length} 名角色立绘覆盖概览：`)
  for (const c of all) {
    const hasAvatar = fs.existsSync(path.join(AVATARS_DIR, `${c.slug}.png`))
    const sub = path.join(PORTRAITS_DIR, c.slug)
    const states = fs.existsSync(sub)
      ? ALL_STATES.filter((s) => fs.existsSync(path.join(sub, `${s}.webp`)) || fs.existsSync(path.join(sub, `${s}.png`)))
      : []
    console.log(
      `  ${c.name.padEnd(8, '　')} (${c.slug.padEnd(16)}) | 头像: ${hasAvatar ? '✅' : '❌'} | 动态立绘(${states.length}/5): ${states.length ? states.join(', ') : '待生成'}`,
    )
  }
}

async function cmdGenerate(target, flags, env) {
  if (!target) throw new Error('请指定角色名或 slug，例如：node scripts/portrait-toolbox.cjs generate 嘉列翁')
  const { all, negativePrompt } = loadCharacters()
  const entry = all.find((c) => c.name === target || c.slug === target)
  if (!entry) throw new Error(`找不到角色「${target}」。可运行 list 查看全部角色。`)

  const providerPref = flags.provider || 'auto' // pixai | tensorart | auto
  const pixaiModel = flags.model || 'v3' // v3 | v2
  const states = flags['avatar-only'] === 'true' || flags.states === 'none'
    ? []
    : (flags.states !== undefined ? (flags.states ? flags.states.split(',') : []) : ALL_STATES).map((s) => s.trim()).filter(Boolean)
  for (const s of states) {
    if (!ALL_STATES.includes(s)) throw new Error(`未知状态「${s}」，仅支持：${ALL_STATES.join(', ')}`)
  }

  const subDir = path.join(PORTRAITS_DIR, entry.slug)
  const metaPath = path.join(subDir, '.toolbox-meta.json')
  const meta = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : {}
  if (!meta.stateVersions || typeof meta.stateVersions !== 'object') meta.stateVersions = {}
  const styleVersion = flags['style-version'] || 'v2-notion'
  const skipVersion = flags['skip-version'] || ''
  let refMediaId = flags['ref-media'] || meta.pureMediaId || null
  let lockedSeed = flags.seed ? Number(flags.seed) : (meta.seed || Math.floor(10000000 + Math.random() * 89999999))
  let activeProvider = providerPref

  if (activeProvider === 'auto') {
    if (env.PIXAI_API_KEY) {
      const probe = await fetch('https://api.pixai.art/v2/task/0000000000000000000', {
        headers: { Authorization: `Bearer ${env.PIXAI_API_KEY}` },
      })
      if (probe.status !== 401) {
        activeProvider = 'pixai'
      } else if (env.TENSORART_API_KEY) {
        console.warn('⚠️ 检测到当前 PIXAI_API_KEY 返回 401 (invalid token)，自动回退至 TensorArt (WAI-NSFW-V16) 同 Seed 生成；更新 PIXAI_API_KEY 后可随时重跑切换为 Tsubaki.3！')
        activeProvider = 'tensorart'
      } else {
        throw new Error('PIXAI_API_KEY 已失效 (401) 且未配置可用备用源，请更新 .env 中的 PIXAI_API_KEY。')
      }
    } else if (env.TENSORART_API_KEY) {
      activeProvider = 'tensorart'
    } else {
      throw new Error('未检测到 PIXAI_API_KEY 或 TENSORART_API_KEY。')
    }
  }

  const artistTags = (flags.artist || presetArtistFor(entry.slug, flags)).trim()
  console.log(`▶ 开始生成「${entry.name}」(${entry.slug}) | 引擎: ${activeProvider}${activeProvider === 'pixai' ? ` (Tsubaki.${pixaiModel === 'v3' ? '3' : '2'})` : ' (WAI-NSFW-V16)'}${artistTags ? ` | 画风: ${artistTags}` : ''} | 状态: ${states.join(', ')}`)

  for (const state of states) {
    if (skipVersion && meta.stateVersions[state] === skipVersion) {
      console.log(`  [${entry.slug}:${state}] ⏭️ 已是 ${skipVersion}，跳过`)
      continue
    }
    const hasRef = activeProvider === 'pixai' && pixaiModel === 'v3' && state !== 'pure' && Boolean(refMediaId)
    const prompt = buildStatePrompt(entry.preset, state, entry.lactates, artistTags, hasRef)
    console.log(`  [${state}] 提交生成任务...`)
    let result
    if (activeProvider === 'pixai') {
      if (!env.PIXAI_API_KEY) throw new Error('缺少 PIXAI_API_KEY')
      if (pixaiModel === 'v3') {
        const ctxImgs = hasRef ? [refMediaId] : []
        result = await generateViaPixaiV2({
          apiKey: env.PIXAI_API_KEY,
          prompt,
          negativePrompt,
          contextImages: ctxImgs,
        })
        if (state === 'pure' && result.mediaId) {
          refMediaId = result.mediaId
          meta.pureMediaId = refMediaId
        }
      } else {
        result = await generateViaPixaiV1({ apiKey: env.PIXAI_API_KEY, prompt, negativePrompt })
      }
    } else {
      if (!env.TENSORART_API_KEY) throw new Error('缺少 TENSORART_API_KEY')
      result = await generateViaTensorArt({
        apiKey: env.TENSORART_API_KEY,
        prompt,
        negativePrompt,
        seed: lockedSeed,
      })
      if (result.seed && result.seed > 0) {
        lockedSeed = result.seed
        meta.seed = lockedSeed
      }
    }

    const rawTmp = path.join(subDir, `.tmp-${state}.img`)
    await downloadFile(result.url, rawTmp)
    const savedPath = savePortraitImage(rawTmp, subDir, state)

    const avatarPath = path.join(AVATARS_DIR, `${entry.slug}.png`)
    if (flags['avatar-mode'] !== 'generate' && ((!fs.existsSync(avatarPath) && flags['crop-avatar'] !== 'false') || (flags['overwrite-avatar'] === 'true' && state === 'pure'))) {
      if (cropAvatarFromPortrait(rawTmp, avatarPath)) {
        console.log(`  [${entry.slug}:${state}] 已同步裁切头像 -> public/avatars/${entry.slug}.png`)
      }
    }
    fs.unlinkSync(rawTmp)
    meta.updatedAt = new Date().toISOString()
    meta.lastProvider = result.provider
    meta.stateVersions[state] = styleVersion
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n')
    console.log(`  [${entry.slug}:${state}] ✅ 已保存 -> ${path.relative(ROOT, savedPath)}`)
  }

  if (flags['avatar-mode'] === 'generate') {
    if (skipVersion && meta.avatarVersion === skipVersion) {
      console.log(`  [${entry.slug}:avatar] ⏭️ 头像已是 ${skipVersion}，跳过`)
    } else {
      const hasRef = activeProvider === 'pixai' && pixaiModel === 'v3' && Boolean(refMediaId)
      const avatarPrompt = buildAvatarPrompt(entry.preset, artistTags, hasRef)
      console.log(`  [avatar] 提交 1:1 近景头像生成任务...`)
      let result
      if (activeProvider === 'pixai' && pixaiModel === 'v3') {
        result = await generateViaPixaiV2({
          apiKey: env.PIXAI_API_KEY,
          prompt: avatarPrompt,
          negativePrompt,
          contextImages: hasRef ? [refMediaId] : [],
          aspectRatio: '1:1',
        })
      } else if (activeProvider === 'pixai') {
        result = await generateViaPixaiV1({ apiKey: env.PIXAI_API_KEY, prompt: avatarPrompt, negativePrompt })
      } else {
        result = await generateViaTensorArt({ apiKey: env.TENSORART_API_KEY, prompt: avatarPrompt, negativePrompt, seed: lockedSeed })
      }
      const avatarPath = path.join(AVATARS_DIR, `${entry.slug}.png`)
      const rawTmp = path.join(subDir, `.tmp-avatar.img`)
      await downloadFile(result.url, rawTmp)
      const im = findImageMagick()
      if (im) {
        execFileSync(im, [rawTmp, '-resize', '512x512^', '-gravity', 'Center', '-extent', '512x512', avatarPath], { stdio: 'pipe' })
      } else {
        fs.mkdirSync(path.dirname(avatarPath), { recursive: true })
        fs.copyFileSync(rawTmp, avatarPath)
      }
      fs.unlinkSync(rawTmp)
      meta.avatarVersion = styleVersion
      meta.updatedAt = new Date().toISOString()
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n')
      console.log(`  [${entry.slug}:avatar] ✅ 已保存 1:1 头像 -> public/avatars/${entry.slug}.png`)
    }
  }

  if (flags['skip-manifest'] !== 'true') {
    execFileSync(process.execPath, [path.join(__dirname, 'build-portraits-manifest.cjs')], { stdio: 'inherit' })
  }
}

async function withRetry(fn, label, retries = 3) {
  let lastErr
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      const msg = String(err.message || err)
      console.warn(`  ⚠️ ${label} 第 ${attempt + 1} 次尝试失败: ${msg}`)
      if (/credits not enough|insufficient|balance/i.test(msg)) break
      if (attempt < retries) await new Promise((r) => setTimeout(r, 5000 * (attempt + 1)))
    }
  }
  throw lastErr
}

async function cmdGenerateBatch(targetListStr, flags, env) {
  const { all } = loadCharacters()
  const targets = targetListStr === 'ALL'
    ? all.map((c) => c.slug)
    : (targetListStr || '').split(',').map((s) => s.trim()).filter(Boolean)
  if (!targets.length) throw new Error('请提供角色列表（用逗号分隔）或 ALL')
  const concurrency = Math.max(1, Math.min(6, Number(flags.concurrency || 4)))
  const jobs = targets.map((t) => {
    const entry = all.find((c) => c.name === t || c.slug === t)
    if (!entry) throw new Error(`找不到角色: ${t}`)
    const states = flags.states
      ? flags.states.split(',').map((s) => s.trim()).filter(Boolean)
      : ALL_STATES
    return { entry, states }
  })

  console.log(`=== Tsubaki.3 批量生成队列：共 ${jobs.length} 名角色，并发数 ${concurrency}${flags['avatar-mode'] === 'generate' ? '（含 1:1 独立头像）' : ''} ===`)
  let cursor = 0
  const failed = []
  let outOfCredits = false

  async function worker(workerId) {
    while (cursor < jobs.length && !outOfCredits) {
      const idx = cursor++
      const job = jobs[idx]
      console.log(`[Worker ${workerId}] (${idx + 1}/${jobs.length}) 生成「${job.entry.name}」(${job.entry.slug}): ${job.states.join(', ')}`)
      try {
        const baseFlags = { ...flags, 'skip-manifest': 'true' }
        delete baseFlags['avatar-mode']
        for (const st of job.states) {
          if (outOfCredits) break
          await withRetry(
            () => cmdGenerate(job.entry.slug, { ...baseFlags, states: st }, env),
            `${job.entry.slug}:${st}`,
            3,
          )
        }
        if (!outOfCredits && flags['avatar-mode'] === 'generate') {
          await withRetry(
            () => cmdGenerate(job.entry.slug, { ...flags, states: '', 'skip-manifest': 'true' }, env),
            `${job.entry.slug}:avatar`,
            3,
          )
        }
      } catch (err) {
        const msg = String(err.message || err)
        console.error(`❌ [Worker ${workerId}] 「${job.entry.name}」中断:`, msg)
        failed.push(job.entry.name)
        if (/credits not enough|insufficient|balance|402/i.test(msg)) {
          outOfCredits = true
        }
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, (_, i) => worker(i + 1)))
  execFileSync(process.execPath, [path.join(__dirname, 'build-portraits-manifest.cjs')], { stdio: 'inherit' })
  if (failed.length > 0) {
    throw new Error(`部分角色未完成: ${failed.join('、')}`)
  }
  console.log('🎉 批量队列全部生成完成！')
}

async function cmdGenerateMissing(flags, env) {
  const { all } = loadCharacters()
  const concurrency = Math.max(1, Math.min(6, Number(flags.concurrency || 4)))
  const jobs = []
  for (const c of all) {
    const sub = path.join(PORTRAITS_DIR, c.slug)
    const missing = ALL_STATES.filter(
      (s) => !fs.existsSync(path.join(sub, `${s}.webp`)) && !fs.existsSync(path.join(sub, `${s}.png`)),
    )
    if (missing.length > 0) jobs.push({ entry: c, missing })
  }
  if (jobs.length === 0) {
    console.log('🎉 全部 29 名角色的 5 阶动态立绘均已齐全！')
    execFileSync(process.execPath, [path.join(__dirname, 'build-portraits-manifest.cjs')], { stdio: 'inherit' })
    return
  }
  console.log(`=== 批量补全缺失动态立绘：共 ${jobs.length} 名角色，并发数 ${concurrency} ===`)
  let effectiveFlags = { ...flags }
  if ((!effectiveFlags.provider || effectiveFlags.provider === 'auto') && env.PIXAI_API_KEY) {
    const probe = await fetch('https://api.pixai.art/v2/task/0000000000000000000', {
      headers: { Authorization: `Bearer ${env.PIXAI_API_KEY}` },
    })
    if (probe.status !== 401) effectiveFlags.provider = 'pixai'
    else if (env.TENSORART_API_KEY) {
      console.warn('⚠️ 当前 PIXAI_API_KEY 返回 401，批量任务统一使用 TensorArt (WAI-NSFW-V16) 同 Seed 引擎。')
      effectiveFlags.provider = 'tensorart'
    }
  }
  let cursor = 0
  const failed = []
  async function worker(workerId) {
    while (cursor < jobs.length) {
      const idx = cursor++
      const job = jobs[idx]
      console.log(`[Worker ${workerId}] (${idx + 1}/${jobs.length}) 处理「${job.entry.name}」缺失状态: ${job.missing.join(', ')}`)
      try {
        for (const st of job.missing) {
          await withRetry(
            () => cmdGenerate(job.entry.slug, { ...effectiveFlags, states: st, 'skip-manifest': 'true' }, env),
            `${job.entry.slug}:${st}`,
            2,
          )
        }
      } catch (err) {
        console.error(`❌ [Worker ${workerId}] 「${job.entry.name}」生成失败:`, err.message || err)
        failed.push(job.entry.name)
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, (_, i) => worker(i + 1)))
  execFileSync(process.execPath, [path.join(__dirname, 'build-portraits-manifest.cjs')], { stdio: 'inherit' })
  if (failed.length > 0) {
    throw new Error(`以下角色部分状态生成失败: ${failed.join('、')}`)
  }
  console.log('🎉 全部缺失角色的 5 阶动态立绘已批量生成完毕！')
}

async function main() {
  const env = loadEnv()
  const { cmd, target, flags } = parseArgs(process.argv.slice(2))
  if (cmd === 'list') return cmdList()
  if (cmd === 'check-keys') return await cmdCheckKeys(env)
  if (cmd === 'generate') return await cmdGenerate(target, flags, env)
  if (cmd === 'generate-missing') return await cmdGenerateMissing(flags, env)
  if (cmd === 'generate-batch') return await cmdGenerateBatch(target, flags, env)
  throw new Error(`未知子命令「${cmd}」。支持：list | check-keys | generate <角色名或slug> | generate-missing | generate-batch <列表>`)
}

main().catch((err) => {
  console.error('❌', err.message || err)
  process.exit(1)
})
