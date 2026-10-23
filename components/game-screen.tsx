'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Character, AppSettings } from '@/lib/types'
import { getKeep, getSettings, saveCharacter } from '@/lib/storage'
import { keeperPromptContext, sceneChrome, type IntruderFate } from '@/lib/keeper'
import { CharacterCard } from '@/components/character-card'
import { ChatPanel } from '@/components/chat-panel'
import { ImagePanel } from '@/components/image-panel'
import { SettingsPanel } from '@/components/settings-panel'
import { FateActions } from '@/components/fate-actions'
import { SceneCheat } from '@/components/cheat-panel'

export type ExploreActions = { explore: () => void; advanceFloor: () => void }
interface GameScreenProps {
  character: Character
  onBack: () => void
  onSettle: (character: Character, fate: IntruderFate, force?: boolean) => void
  cheat?: boolean
}

export function GameScreen({ character: initialCharacter, onBack, onSettle, cheat = false }: GameScreenProps) {
  const [character, setCharacter] = useState<Character>(initialCharacter)
  const [settings, setSettings] = useState<AppSettings>(() => getSettings())
  const [showSettings, setShowSettings] = useState(false)
  const [pendingScene, setPendingScene] = useState<string | undefined>()
  const [activeTab, setActiveTab] = useState<'chat' | 'image'>('chat')
  const [busy, setBusy] = useState(false)
  const actions = useRef<ExploreActions>({ explore: () => {}, advanceFloor: () => {} })
  const collapseAsked = useRef(false)
  const settleRef = useRef(onSettle)
  settleRef.current = onSettle
  useEffect(() => {
    if ((character.hp ?? 1) > 0 || collapseAsked.current) return
    collapseAsked.current = true
    settleRef.current(character, 'broken')
  }, [character])
  const handleRequestImage = useCallback((scene: string) => { setPendingScene(scene) }, [])
  const handleSceneHandled = useCallback(() => setPendingScene(undefined), [])
  const handleCharacterUpdate = useCallback((updates: Partial<Character>) => {
    setCharacter((previous) => {
      const next = { ...previous, ...updates }
      saveCharacter(next)
      return next
    })
  }, [])
  const chrome = sceneChrome(keeperPromptContext(getKeep()), character.floor ?? 1)
  const training = chrome.mode === 'train'

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <header className={cn('flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b backdrop-blur-sm flex-shrink-0', training ? 'border-rose-500/30 bg-rose-950/40' : 'border-border bg-card/80')}>
        <div className="flex items-center gap-2 flex-shrink-0">
          <h1 className="text-base font-bold gold-text tracking-widest">地下城城主</h1>
          <span className={cn('text-[10px] px-2 py-0.5 rounded-full border', training ? 'border-rose-400/40 text-rose-200 bg-rose-500/15' : 'border-amber-400/40 text-amber-200 bg-amber-500/10')}>{chrome.tab}</span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <FateActions character={character} disabled={busy} onSettle={(fate) => onSettle(character, fate)} />
          <button onClick={() => setShowSettings(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary text-xs text-muted-foreground">
            <Settings className="w-3.5 h-3.5" />设置
          </button>
        </div>
      </header>
      {(cheat || settings.cheatMode) && <SceneCheat character={character} onUpdate={handleCharacterUpdate} onForceFate={(fate) => onSettle(character, fate, true)} />}
      <div className="flex md:hidden border-b border-border">
        {(['chat', 'image'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2.5 text-xs ${activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}>
            {tab === 'chat' ? chrome.tab : `场景插图${pendingScene ? ' •' : ''}`}
          </button>
        ))}
      </div>
      <main className="flex flex-1 min-h-0 overflow-hidden">
        <section className={`${activeTab === 'chat' ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-[55%] md:border-r border-border min-h-0`}>
          <CharacterCard character={character} busy={busy || (character.hp ?? 1) <= 0} onReset={() => { if (!busy && (character.hp ?? 1) > 0) onBack() }}
            onExplore={() => { if (!busy) actions.current.explore() }} onAdvanceFloor={() => { if (!busy) actions.current.advanceFloor() }} />
          <div className="flex-1 min-h-0 overflow-hidden">
            <ChatPanel character={character} settings={settings} onRequestImage={handleRequestImage}
              onCharacterUpdate={handleCharacterUpdate} onTurnCommit={setCharacter} onBusyChange={setBusy} exploreActionsRef={actions} />
          </div>
        </section>
        <section className={`${activeTab === 'image' ? 'block' : 'hidden'} md:block w-full md:w-[45%] min-h-0 overflow-hidden`}>
          <ImagePanel settings={settings} character={character} pendingScene={pendingScene} onSceneHandled={handleSceneHandled} />
        </section>
      </main>
      {showSettings && <SettingsPanel settings={settings} onSettingsChange={setSettings} onClose={() => setShowSettings(false)} canImport={!busy} />}
    </div>
  )
}
