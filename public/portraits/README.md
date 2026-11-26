# 状态立绘与自动生图工具箱 (Portrait Toolbox)

放在 `public/portraits/<slug>/<state>.webp`（或 `.png`），`slug` 与 `public/avatars/<slug>.png` 相同。

- 堕落四档：`pure.webp` · `shaken.webp` · `fallen.webp` · `broken.webp`
- 高潮（快感 ≥95）：`<档>-climax.webp`，或通用 `climax.webp`
- 回退：`<档>-climax` → `climax` → `<档>` → 低一档 … → `pure` → `/avatars/<slug>.png`
- 头像是立绘的 CSS 裁切，脸的位置在 `lib/portraits.ts` 的 `PORTRAIT_FOCUS` 登记。
- 构建前 `node scripts/build-portraits-manifest.cjs` 会重写 `public/portraits-manifest.json`（已 gitignore）。

## 自动生图 CLI (`scripts/portrait-toolbox.cjs`)

- 查看全员头像与 5 态立绘覆盖情况：
  `npm run portraits -- list`
- 检测 `.env` 中 `PIXAI_API_KEY`（支持 **Tsubaki.3** `2024383379556065549`）与 `TENSORART_API_KEY` 状态：
  `npm run portraits -- check-keys`
- 一键生成某名角色的头像 + 5 档动态立绘（默认优先使用 **PixAI Tsubaki.3** 并通过 `contextImages` 锁定 `pure` 基础态角色一致性；若 PixAI Key 未配置或失效，自动回退至 TensorArt WAI-NSFW-V16 同 Seed 生成）：
  `npm run portraits -- generate 嘉列翁`
- 指定状态或强制指定 PixAI Tsubaki.3：
  `npm run portraits -- generate 一之濑明日奈 --provider pixai --model v3 --states pure,shaken,fallen,broken,climax`
