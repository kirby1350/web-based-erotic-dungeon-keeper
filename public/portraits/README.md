# 状态立绘

放在 `public/portraits/<slug>/<state>.webp`（或 .png），slug 与 `public/avatars/<slug>.png` 相同。

- 堕落四档：`pure.png` `shaken.png` `fallen.png` `broken.png`
- 高潮（快感 ≥95）：`<档>-climax.png`，或通用 `climax.png`
- 回退：`<档>-climax` → `climax` → `<档>` → 低一档 … → `pure` → `/avatars/<slug>.png`
- 头像是立绘的 CSS 裁切，脸的位置在 `lib/portraits.ts` 的 `PORTRAIT_FOCUS` 登记。
- 构建前 `node scripts/build-portraits-manifest.cjs` 会重写 `public/portraits-manifest.json`（已 gitignore）。
- 建议统一 2:3 竖图（如 832×1248），上半身正面，同一角色同一 seed / 画师。
