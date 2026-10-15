import { TARGET_FLOOR } from '@/lib/types'

const KEEP_KEY = 'dungeon_keep'
const MIN_DEPTH = 3

/** 城主已经挖通的层数。没有存档时是开局的 3 层，再深不超过可加开的上限。 */
export function keeperFloorCap(): number {
  if (typeof localStorage === 'undefined') return MIN_DEPTH
  try {
    const raw = localStorage.getItem(KEEP_KEY)
    if (!raw) return MIN_DEPTH
    const depth = JSON.parse(raw)?.progress?.depth
    if (typeof depth !== 'number' || !Number.isFinite(depth)) return MIN_DEPTH
    return Math.min(TARGET_FLOOR, Math.max(MIN_DEPTH, Math.floor(depth)))
  } catch {
    return MIN_DEPTH
  }
}
