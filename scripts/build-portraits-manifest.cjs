// 扫描 public/portraits/<slug>/<state>.png，写出 public/portraits-manifest.json（prebuild / predev 时跑）。
const fs = require('node:fs')
const path = require('node:path')
const root = process.env.PORTRAITS_PUBLIC || path.join(__dirname, '..', 'public')
const dir = path.join(root, 'portraits')
const STATE = /^(pure|shaken|fallen|broken)(-climax)?$|^climax$/
const manifest = {}
if (fs.existsSync(dir)) {
  for (const slug of fs.readdirSync(dir).sort()) {
    const sub = path.join(dir, slug)
    if (!/^[\w-]+$/.test(slug) || !fs.statSync(sub).isDirectory()) continue
    // .png 记成 "pure"，.webp 记成 "pure.webp"（同名时 webp 优先，体积小一半）
    const files = fs.readdirSync(sub)
    const states = []
    for (const f of files) {
      const m = f.match(/^(.+)\.(png|webp)$/)
      if (!m || !STATE.test(m[1])) continue
      if (m[2] === 'webp') states.push(`${m[1]}.webp`)
      else if (!files.includes(`${m[1]}.webp`)) states.push(m[1])
    }
    states.sort()
    if (states.length) manifest[slug] = states
  }
}
fs.writeFileSync(path.join(root, 'portraits-manifest.json'), JSON.stringify(manifest, null, 1) + '\n')
console.log(`portraits manifest: ${Object.keys(manifest).length} characters`)
