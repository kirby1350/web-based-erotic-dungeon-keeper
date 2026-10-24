import { denseLength, negationTurns } from '@/lib/prose-bank'

/** 生成后的代码侧检查：字数档、台词行数（重油 4–7）、「不是X是Y」≤ 1、[OPTIONS] 存在。 */
export interface GuardSpec { dense: boolean; stepIndex: number | null }
/** failures 是严格限制下没过的项（统计用）；clear 是明显越界、值得重写的项（容差：字数超出档位 10% 以上、台词差 2 行以上）。 */
export interface GuardResult { failures: string[]; clear: string[]; score: number; length: number; dialogue: number; negations: number; options: boolean }

export const DENSE_DIALOGUE = { min: 4, max: 7 }
export const NEGATION_MAX = 1
export const LENGTH_TOLERANCE = 0.1
export const DIALOGUE_TOLERANCE = 1

/** 只算正文：去掉注释、标记块和 *动作* 星号、空白。 */
export function proseBody(text: string): string {
  return text.replace(/<!--[\s\S]*?-->/g, '').replace(/\[(OPTIONS|SCENE|STATS|DESC|PARTNER)[\s\S]*$/i, '')
}
export function proseLength(text: string): number {
  return proseBody(text).replace(/\s|\*/g, '').length
}
/** 每一行以引号开头的都算一行台词（她的话、单独成行的叫声、城主的话）。 */
export function dialogueLines(text: string): number {
  return proseBody(text).split('\n').filter((line) => /^\s*\*?\s*[“「"『]/.test(line)).length
}

export function checkReply(text: string, spec: GuardSpec): GuardResult {
  const length = proseLength(text)
  const dialogue = dialogueLines(text)
  const negations = negationTurns(text).length
  const options = /\[OPTIONS\]/i.test(text)
  const failures: string[] = []
  const clear: string[] = []
  let score = 0
  if (spec.dense && spec.stepIndex !== null) {
    const tier = denseLength(spec.stepIndex)
    if (length > tier.max) { const f = `正文 ${length} 字，超过上限 ${tier.max}`; failures.push(f); if (length > tier.max * (1 + LENGTH_TOLERANCE)) clear.push(f); score += (length - tier.max) / 100 }
    else if (length < tier.min) { const f = `正文 ${length} 字，少于下限 ${tier.min}`; failures.push(f); if (length < tier.min * (1 - LENGTH_TOLERANCE)) clear.push(f); score += (tier.min - length) / 100 }
    // 只在完整档检查台词行数；短档 4 行下限不适用。
    if (tier.max >= 1500) {
      if (dialogue > DENSE_DIALOGUE.max) { const f = `台词 ${dialogue} 行，超过 ${DENSE_DIALOGUE.max} 行`; failures.push(f); if (dialogue > DENSE_DIALOGUE.max + DIALOGUE_TOLERANCE) clear.push(f); score += dialogue - DENSE_DIALOGUE.max }
      else if (dialogue < DENSE_DIALOGUE.min) { const f = `台词 ${dialogue} 行，少于 ${DENSE_DIALOGUE.min} 行`; failures.push(f); if (dialogue < DENSE_DIALOGUE.min - DIALOGUE_TOLERANCE) clear.push(f); score += DENSE_DIALOGUE.min - dialogue }
    }
  }
  if (negations > NEGATION_MAX) { const f = `「不是X，是Y」句 ${negations} 处，最多 ${NEGATION_MAX} 处`; failures.push(f); clear.push(f); score += negations - NEGATION_MAX }
  if (!options) { failures.push('缺少 [OPTIONS] 选项块'); clear.push('缺少 [OPTIONS] 选项块'); score += 10 }
  return { failures, clear, score, length, dialogue, negations, options }
}

/** 重生成时追加在最后一条用户消息后的短提示。 */
export function retryNote(result: GuardResult, spec: GuardSpec): string {
  const tier = spec.dense && spec.stepIndex !== null ? denseLength(spec.stepIndex) : null
  return `\n\n【重写：上一版没通过检查】${result.failures.join('；')}。按同样的命令重写这一回合${tier ? `，正文 ${tier.min}–${tier.max} 字` : ''}${tier && tier.max >= 1500 ? `，台词 ${DENSE_DIALOGUE.min}–${DENSE_DIALOGUE.max} 行（所有引号行都算）` : ''}，「不是X，是Y」最多一处，结尾带 [OPTIONS]。`
}

export function withRetryNote(messages: { role: string; content: string }[], note: string) {
  const out = messages.map((m) => ({ ...m }))
  const last = out.length - 1
  if (last >= 0 && out[last].role === 'user') out[last].content += note
  return out
}

/** 两版都没过时先比明显越界项的个数，再比分数；平分留第一版。不可用（解析错误）的一版总是输。 */
export function pickBetter(a: { text: string; check: GuardResult; usable: boolean }, b: { text: string; check: GuardResult; usable: boolean }) {
  if (a.usable !== b.usable) return a.usable ? a : b
  if (a.check.clear.length !== b.check.clear.length) return b.check.clear.length < a.check.clear.length ? b : a
  return b.check.score < a.check.score ? b : a
}

/** 调试/对照用：localStorage 里 dk_guard_off=1 时跳过检查和重写。 */
export function guardDisabled(): boolean {
  try { return typeof localStorage !== 'undefined' && localStorage.getItem('dk_guard_off') === '1' } catch { return false }
}
