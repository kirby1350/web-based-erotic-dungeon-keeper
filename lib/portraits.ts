// 按状态切换的立绘：public/portraits/<slug>/<state>.png
// state 是堕落四档 pure / shaken / fallen / broken，再叠一个高潮（<档>-climax，或通用 climax）。
// 构建前 scripts/build-portraits-manifest.cjs 扫描目录写出 public/portraits-manifest.json，前端只查清单，不逐个试 404。
import type { Character } from '@/lib/types'
import { corruptionOf } from '@/lib/terms-dk'
import { corruptTierOf } from '@/lib/terms'

export const PORTRAIT_TIERS = ['pure', 'shaken', 'fallen', 'broken'] as const
export type PortraitTier = (typeof PORTRAIT_TIERS)[number]
/** slug → 这个角色已有的状态文件名（.png 不带后缀，.webp 带 ".webp"） */
export type PortraitManifest = Record<string, string[]>

/** 快感到这里就算高潮态 */
export const CLIMAX_AT = 95

/** 头像是立绘的 CSS 裁切；每个角色的脸大概在哪（object-position）。没登记的用默认。 */
export const PORTRAIT_FOCUS: Record<string, string> = {
  atago: '50% 22%',
  eclipse: '50% 25%',
  taihou: '50% 18%',
  shinano: '50% 20%',
  'sagisawa-fumika': '50% 17%',
  noshiro: '50% 18%',
  'new-jersey': '50% 18%',
  anila: '50% 18%',
  cheshire: '50% 20%',
  yuel: '50% 17%',
}
export const DEFAULT_FOCUS = '50% 20%'

export function portraitSlug(c: Pick<Character, 'avatarUrl'>): string | null {
  const m = c.avatarUrl?.match(/\/avatars\/([\w-]+)\.(png|jpe?g|webp)$/i)
  return m ? m[1] : null
}

export function portraitState(c: Character): { tier: PortraitTier; climax: boolean } {
  return { tier: PORTRAIT_TIERS[corruptTierOf(corruptionOf(c))] ?? 'pure', climax: (c.pleasure ?? 0) >= CLIMAX_AT }
}

/** 回退顺序：<档>-climax > climax > <档> > 低一档 … > pure */
export function portraitCandidates(tier: PortraitTier, climax: boolean): string[] {
  const i = PORTRAIT_TIERS.indexOf(tier)
  const down = PORTRAIT_TIERS.slice(0, i + 1).reverse()
  return [...(climax ? [`${tier}-climax`, 'climax'] : []), ...down]
}

/** 立绘地址：清单里第一个存在的状态，否则原来的 /avatars/<slug>.png，再否则 null */
export function resolvePortrait(c: Character, manifest: PortraitManifest | null): { src: string | null; state: string | null; focus: string } {
  const slug = portraitSlug(c)
  const focus = (slug && PORTRAIT_FOCUS[slug]) || DEFAULT_FOCUS
  const have = slug ? manifest?.[slug] : undefined
  if (slug && have?.length) {
    const { tier, climax } = portraitState(c)
    for (const s of portraitCandidates(tier, climax)) {
      if (have.includes(`${s}.webp`)) return { src: `/portraits/${slug}/${s}.webp`, state: s, focus }
      if (have.includes(s)) return { src: `/portraits/${slug}/${s}.png`, state: s, focus }
    }
  }
  return { src: c.avatarUrl || null, state: null, focus }
}
