'use client'

import { useEffect, useState } from 'react'
import type { Character } from '@/lib/types'
import { resolvePortrait, type PortraitManifest } from '@/lib/portraits'
import { cn } from '@/lib/utils'

let cached: PortraitManifest | null = null
let pending: Promise<PortraitManifest> | null = null

/** 读一次 /portraits-manifest.json；没有就当空清单（全部回退到 /avatars） */
export function usePortraitManifest(): PortraitManifest | null {
  const [manifest, setManifest] = useState<PortraitManifest | null>(cached)
  useEffect(() => {
    if (cached) return
    pending ??= fetch('/portraits-manifest.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({}))
    let live = true
    pending.then((m) => { cached = m; if (live) setManifest(m) })
    return () => { live = false }
  }, [])
  return manifest
}

/** 立绘或头像：variant="avatar" 时按角色登记的脸部位置裁切同一张立绘 */
export function StatePortrait({ character, variant = 'full', className }: { character: Character; variant?: 'full' | 'avatar'; className?: string }) {
  const manifest = usePortraitManifest()
  const { src, state, focus } = resolvePortrait(character, manifest)
  const [broken, setBroken] = useState<string | null>(null)
  const fallback = src && broken === src ? character.avatarUrl : src
  if (!fallback) {
    return <div className={cn('flex items-center justify-center bg-secondary font-bold text-primary', className)}>{character.name[0]}</div>
  }
  return (
    <img
      src={fallback}
      alt={character.name}
      data-portrait-state={state ?? 'avatar'}
      onError={() => setBroken(src)}
      className={cn('object-cover', className)}
      style={{ objectPosition: variant === 'avatar' ? focus : '50% 15%' }}
    />
  )
}
