import type { GeneratedImage } from '@/lib/types'
import { portraitSlug } from '@/lib/portraits'

export interface ArchivedSceneImage extends GeneratedImage {
  characterName: string
  slug: string
  storage?: 'cloud' | 'local' | 'remote'
  localUrl?: string
  cloudUrl?: string
}

const GALLERY_KEY = 'dungeon_scene_gallery_v1'
const MAX_PER_CHARACTER = 16
const MAX_TOTAL = 120

export function sceneSlugFor(character: { name: string; avatarUrl?: string | null }): string {
  const fromPortrait = portraitSlug(character)
  if (fromPortrait) return fromPortrait
  const ascii = character.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  if (ascii) return ascii
  let hash = 0
  for (let i = 0; i < character.name.length; i++) {
    hash = ((hash << 5) - hash + character.name.charCodeAt(i)) | 0
  }
  return `char-${Math.abs(hash).toString(36)}`
}

function readAllLocal(): ArchivedSceneImage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(GALLERY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAllLocal(items: ArchivedSceneImage[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(GALLERY_KEY, JSON.stringify(items.slice(0, MAX_TOTAL)))
  } catch { /* ignore quota */ }
}

export function getLocalSceneImages(characterName: string): ArchivedSceneImage[] {
  return readAllLocal().filter((item) => item.characterName === characterName)
}

export function saveLocalSceneImages(characterName: string, incoming: ArchivedSceneImage[]): ArchivedSceneImage[] {
  const all = readAllLocal()
  const others = all.filter((item) => item.characterName !== characterName)
  const existing = all.filter((item) => item.characterName === characterName)
  const seen = new Set<string>()
  const mergedForChar: ArchivedSceneImage[] = []
  for (const img of [...incoming, ...existing]) {
    const key = img.id || img.url
    if (!key || seen.has(key)) continue
    seen.add(key)
    mergedForChar.push(img)
    if (mergedForChar.length >= MAX_PER_CHARACTER) break
  }
  writeAllLocal([...mergedForChar, ...others])
  return mergedForChar
}

export function mergeSceneImages(a: ArchivedSceneImage[], b: ArchivedSceneImage[]): ArchivedSceneImage[] {
  const seen = new Set<string>()
  const out: ArchivedSceneImage[] = []
  for (const item of [...a, ...b]) {
    const key = item.id || item.localUrl || item.cloudUrl || item.url
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out.sort((x, y) => (y.timestamp ?? 0) - (x.timestamp ?? 0)).slice(0, MAX_PER_CHARACTER)
}
