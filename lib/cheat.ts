// 作弊模式：只给测试用。设置里默认关闭，打开后才在城主厅、闯入和调教画面出现。
import type { Character } from '@/lib/types'
import { defaultFloors, upgradeCost, type DungeonProgress, type KeeperSave, type UpgradeKey } from '@/lib/keeper'

export const UPGRADE_KEYS: UpgradeKey[] = ['trapSlots', 'monsterSlots', 'depth', 'monsterRank', 'intruderSlots']

export function cheatEssence(save: KeeperSave, amount: number): KeeperSave {
  return { ...save, progress: { ...save.progress, essence: Math.max(0, save.progress.essence + amount) } }
}

/** 把每项升级顶到上限，不花淫髓。加深的层按默认层补上。 */
export function cheatMaxUpgrades(save: KeeperSave): KeeperSave {
  const progress: DungeonProgress = { ...save.progress }
  for (const key of UPGRADE_KEYS) {
    let guard = 0
    while (upgradeCost(progress, key) != null && guard++ < 50) progress[key] += 1
  }
  const floors = [...(save.floors ?? [])]
  const extra = defaultFloors(progress.depth)
  while (floors.length < progress.depth) floors.push(extra[floors.length])
  return { ...save, progress, floors }
}

export function clampStat(value: number, max: number): number {
  return Math.max(0, Math.min(max, Math.round(Number.isFinite(value) ? value : 0)))
}

export function cheatStats(character: Character, patch: { hp?: number; pleasure?: number; desire?: number }): Partial<Character> {
  const maxHp = character.maxHp ?? 100
  const out: Partial<Character> = {}
  if (patch.hp != null) out.hp = clampStat(patch.hp, maxHp)
  if (patch.pleasure != null) out.pleasure = clampStat(patch.pleasure, 100)
  if (patch.desire != null) out.desire = clampStat(patch.desire, 100)
  return out
}
