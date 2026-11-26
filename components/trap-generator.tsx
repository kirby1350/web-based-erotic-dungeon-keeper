'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import { Loader2, RefreshCw, Check, Send, X, Zap, Shuffle, ShieldAlert, Eye } from 'lucide-react'
import { Character, ChatMessage, INTERROGATION_METHODS, ProseStyle } from '@/lib/types'
import type { AdventureMemory } from '@/lib/adventure-memory'
import { buildInterrogationScene, type KeeperSave } from '@/lib/keeper'
import { chatStream } from '@/lib/dzmm'
import { cn } from '@/lib/utils'
import { buildInterrogationPrompt, extractInterrogationCommand } from '@/lib/prompts'

const FOCUS_PARTS: { id: string; label: string }[] = [
  { id: 'breast', label: '胸部/乳头' },
  { id: 'clitoris', label: '阴蒂' },
  { id: 'urethra', label: '尿道' },
  { id: 'vagina', label: '阴道' },
  { id: 'anus', label: '肛门' },
  { id: 'mouth', label: '口腔/喉咙' },
]

interface QuickChip {
  id: string
  label: string
  hint: string
  kind: 'scene' | 'personal'
}

interface InterrogationGeneratorProps {
  character: Character
  settings: { chatModel: string; chatApiKey: string; grokApiKey?: string; proseStyle?: ProseStyle }
  place: string
  keep?: KeeperSave | null
  memory?: AdventureMemory
  recentMessages?: ChatMessage[]
  onConfirm: (text: string) => void
  onExecute?: (text: string) => void
  onClose: () => void
}

export function InterrogationGenerator({
  character,
  settings,
  place,
  keep,
  memory,
  recentMessages,
  onConfirm,
  onExecute,
  onClose,
}: InterrogationGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [selected, setSelected] = useState<string[]>([])
  const [focus, setFocus] = useState<string[]>([])
  const [keeperStepsIn, setKeeperStepsIn] = useState(false)
  const lastHintsRef = useRef<string[] | undefined>(undefined)
  const lastFocusRef = useRef<string[] | undefined>(undefined)

  const recentAssistant = useMemo(
    () => (recentMessages ?? []).filter((m) => m.role === 'assistant').slice(-2).map((m) => m.content),
    [recentMessages],
  )

  const scene = useMemo(
    () => buildInterrogationScene(keep, character, memory, recentAssistant, keeperStepsIn),
    [keep, character, memory, recentAssistant, keeperStepsIn],
  )

  const sceneChips = useMemo<QuickChip[]>(() => {
    const chips: QuickChip[] = []
    if (scene.encounterTrap) {
      scene.encounterTrap.escalate.forEach((step, idx) => {
        chips.push({
          id: `esc_${idx}`,
          label: step,
          hint: `驱动「${scene.encounterTrap!.name}」加码：${step}`,
          kind: 'scene',
        })
      })
    } else if (scene.encounterMonster) {
      chips.push(
        {
          id: 'mon_tighten',
          label: `${scene.encounterMonster.name}·收紧深入`,
          hint: `下令「${scene.encounterMonster.name}」顺着她此刻最敏感的部位进一步缠紧并深入`,
          kind: 'scene',
        },
        {
          id: 'mon_tease',
          label: `${scene.encounterMonster.name}·边缘戏弄`,
          hint: `下令「${scene.encounterMonster.name}」按它的习性反复磨蹭她的死穴却卡在顶点前停住`,
          kind: 'scene',
        },
      )
    }
    if (scene.floorDefenses?.length) {
      scene.floorDefenses.forEach((d, idx) => {
        chips.push({
          id: `relay_${idx}`,
          label: `联动·${d.name}`,
          hint: `让同层的${d.kind === 'monster' ? '魔物' : '陷阱'}「${d.name}」趁机介入夹击她未被占满的部位`,
          kind: 'scene',
        })
      })
    }
    if (scene.cageHolds) {
      chips.push({
        id: 'cage_rig',
        label: `借${place}器械施力`,
        hint: `直接启动并调高「${place}」自带的拘束与折磨设施（${scene.cageHolds}）作用在她身上`,
        kind: 'scene',
      })
    }
    return chips
  }, [scene, place])

  const personalChips = useMemo<QuickChip[]>(
    () => INTERROGATION_METHODS.map((m) => ({ id: m.id, label: m.name, hint: m.hint, kind: 'personal' as const })),
    [],
  )

  const activePool = useMemo(() => {
    if (scene.presence === 'present' || scene.keeperStepsIn) return [...sceneChips, ...personalChips]
    return sceneChips.length > 0 ? sceneChips : personalChips
  }, [scene.presence, scene.keeperStepsIn, sceneChips, personalChips])

  const generate = useCallback(async (hints?: string[], focusParts?: string[]) => {
    lastHintsRef.current = hints
    lastFocusRef.current = focusParts
    setLoading(true)
    setError('')
    setResult('')

    const focusLabels = (focusParts ?? [])
      .map((id) => FOCUS_PARTS.find((part) => part.id === id)?.label)
      .filter((label): label is string => Boolean(label))
    const prompt = buildInterrogationPrompt(
      character,
      hints,
      place,
      settings.proseStyle,
      focusLabels,
      Date.now() % 100000,
      scene,
    )

    try {
      let fullText = ''
      await chatStream(
        {
          messages: [{ role: 'user', content: prompt }],
          model: settings.chatModel,
          apiKey: settings.chatApiKey,
          grokApiKey: settings.grokApiKey ?? '',
        },
        (delta) => {
          fullText += delta
          setResult(fullText)
        },
      )
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [character, place, settings, scene])

  function cleanForDisplay(text: string): string {
    let out = text.replace(/\[SCENE:[^\]]*\]/gi, '')
    for (const marker of ['[STATS:', '[DESC:']) {
      const start = out.indexOf(marker)
      if (start === -1) continue
      const braceStart = out.indexOf('{', start)
      if (braceStart === -1) continue
      let depth = 0
      for (let i = braceStart; i < out.length; i++) {
        if (out[i] === '{') depth++
        else if (out[i] === '}') {
          depth--
          if (depth === 0) {
            const closeTag = out.indexOf(']', i)
            const end = closeTag !== -1 ? closeTag + 1 : i + 1
            out = out.slice(0, start) + out.slice(end)
            break
          }
        }
      }
    }
    return out.trim()
  }

  const toggleChip = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const allChips = [...sceneChips, ...personalChips]
  const showPersonalRow = scene.presence === 'present' || scene.keeperStepsIn

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg dungeon-border rounded-xl bg-card flex flex-col max-h-[84vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-bold text-sm tracking-wider gold-text">随机拷问 · 现场加码</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 现场状态条：当前装置 + 城主是否在场切换 */}
        <div className="px-4 py-2.5 border-b border-border/60 bg-secondary/30 text-[11px] space-y-1.5 flex-shrink-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-muted-foreground">
              地点：<strong className="text-foreground">{place}</strong>
              {scene.encounterTrap && (
                <span className="ml-2 text-rose-300 font-medium">
                  <ShieldAlert className="w-3 h-3 inline mr-0.5 -mt-0.5" />
                  困于「{scene.encounterTrap.name}」Lv{scene.encounterTrap.restraint}
                </span>
              )}
              {scene.encounterMonster && (
                <span className="ml-2 text-rose-300 font-medium">
                  <ShieldAlert className="w-3 h-3 inline mr-0.5 -mt-0.5" />
                  缠于「{scene.encounterMonster.name}」Lv{scene.encounterMonster.restraint}
                </span>
              )}
            </span>
            {scene.presence !== 'present' && (
              <button
                type="button"
                onClick={() => {
                  setKeeperStepsIn((v) => !v)
                  setSelected([])
                }}
                disabled={loading}
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] transition-colors',
                  keeperStepsIn
                    ? 'border-amber-400/60 bg-amber-500/15 text-amber-200'
                    : 'border-border bg-background/60 text-muted-foreground hover:border-amber-400/40',
                )}
                title="默认在幕后操控机关/魔物；开启后城主亲自现身插手"
              >
                <Eye className="w-3 h-3" />
                {keeperStepsIn ? '城主现身插手：开' : '幕后操控机关（点此现身）'}
              </button>
            )}
          </div>
          {scene.situation && (
            <p className="text-[10px] text-muted-foreground/80 truncate" title={scene.situation}>
              现场记忆：{scene.situation}
            </p>
          )}
        </div>

        <div className="px-4 pt-2.5 space-y-2 flex-shrink-0 max-h-44 overflow-y-auto">
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => { setSelected([]); generate(undefined, focus) }}
              disabled={loading}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-border bg-secondary text-muted-foreground text-xs transition-colors hover:border-primary/40 disabled:opacity-40"
            >
              <Shuffle className="w-3 h-3" />
              顺着现场随机
            </button>
            <button
              onClick={() => {
                const pool = [...activePool]
                const pick: QuickChip[] = []
                while (pick.length < 2 && pool.length) {
                  pick.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0])
                }
                setSelected(pick.map((item) => item.id))
                generate(pick.map((item) => item.hint), focus)
              }}
              disabled={loading}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-primary/40 bg-primary/5 text-primary/90 text-xs transition-colors hover:border-primary/60 disabled:opacity-40"
            >
              <Shuffle className="w-3 h-3" />
              随机组合两招
            </button>
          </div>

          {sceneChips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] text-rose-300/80 mr-0.5">当前装置/环境</span>
              {sceneChips.map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => toggleChip(chip.id)}
                  disabled={loading}
                  title={chip.hint}
                  className={cn(
                    'px-2.5 py-0.5 rounded-full border text-xs transition-colors disabled:opacity-40',
                    selected.includes(chip.id)
                      ? 'border-rose-400/70 bg-rose-500/20 text-rose-200'
                      : 'border-rose-500/25 bg-rose-950/30 text-rose-200/80 hover:border-rose-400/50',
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          {showPersonalRow && (
            <div className="flex flex-wrap gap-1.5 items-center">
              {sceneChips.length > 0 && <span className="text-[10px] text-amber-300/80 mr-0.5">城主手法</span>}
              {personalChips.map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => toggleChip(chip.id)}
                  disabled={loading}
                  title={chip.hint}
                  className={cn(
                    'px-2.5 py-0.5 rounded-full border text-xs transition-colors disabled:opacity-40',
                    selected.includes(chip.id)
                      ? 'border-primary/60 bg-primary/10 text-primary'
                      : 'border-border bg-secondary text-muted-foreground hover:border-primary/40',
                  )}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 pt-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-muted-foreground/80 mr-0.5">偏好部位</span>
            {FOCUS_PARTS.map((part) => (
              <button
                key={part.id}
                onClick={() =>
                  setFocus((prev) =>
                    prev.includes(part.id) ? prev.filter((id) => id !== part.id) : [...prev, part.id]
                  )
                }
                disabled={loading}
                className={cn(
                  'px-2 py-0.5 rounded-full border text-[11px] transition-colors disabled:opacity-40',
                  focus.includes(part.id)
                    ? 'border-rose-400/60 bg-rose-500/10 text-rose-300'
                    : 'border-border bg-secondary text-muted-foreground hover:border-rose-400/40'
                )}
              >
                {part.label}
              </button>
            ))}
            {focus.length > 0 && (
              <button
                onClick={() => setFocus([])}
                disabled={loading}
                className="text-[11px] text-muted-foreground/70 hover:text-foreground underline underline-offset-2 disabled:opacity-40"
              >
                清除
              </button>
            )}
          </div>
        </div>

        {selected.length > 0 && (
          <div className="px-4 pt-2 flex-shrink-0">
            <button
              onClick={() => generate(
                selected
                  .map((id) => allChips.find((chip) => chip.id === id)?.hint)
                  .filter((hint): hint is string => Boolean(hint)),
                focus
              )}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-primary/90 text-primary-foreground text-xs font-bold transition-all hover:bg-primary disabled:opacity-40"
            >
              <Zap className="w-3.5 h-3.5" />
              {selected.length >= 2 ? `融合生成（${selected.length} 项）` : '按此方向生成'}
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {!loading && !result && !error && (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
              <Zap className="w-6 h-6 text-primary/50" />
              <span className="text-sm">
                {sceneChips.length > 0
                  ? '点选当前装置的加码方向，或点「顺着现场随机」'
                  : '选一种折磨方式，或点「顺着现场随机」'}
              </span>
            </div>
          )}

          {loading && result === '' && (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-sm">正在结合当前现场生成折磨指令…</span>
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive-foreground bg-destructive/20 border border-destructive/40 rounded-lg p-3">
              生成失败：{error}
            </div>
          )}

          {result && (
            <div className="relative">
              <pre className="text-sm text-foreground whitespace-pre-wrap leading-relaxed font-sans">
                {cleanForDisplay(result)}
              </pre>
              {loading && (
                <span className="inline-flex gap-0.5 ml-1">
                  <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
                </span>
              )}
            </div>
          )}
        </div>

        {!loading && (result || error) && (
          <div className="px-4 py-3 border-t border-border flex gap-2 flex-shrink-0">
            <button
              onClick={() => generate(lastHintsRef.current, lastFocusRef.current)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-secondary text-secondary-foreground text-xs hover:border-primary/50 hover:bg-secondary/80 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              换一招
            </button>
            {result && (
              <>
                <button
                  onClick={() => onConfirm(extractInterrogationCommand(result))}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-primary/50 bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-all"
                  title="只提取【这一手怎么做】填入输入框，不带预览反应以免主回合重复"
                >
                  <Check className="w-3.5 h-3.5" />
                  填入输入框
                </button>
                {onExecute && (
                  <button
                    onClick={() => onExecute(extractInterrogationCommand(result))}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold glow-btn transition-all"
                    title="直接向地下城下达这一手命令并开始本回合"
                  >
                    <Send className="w-3.5 h-3.5" />
                    直接执行
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
