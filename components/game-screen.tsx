'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Settings } from 'lucide-react'
import { Character, AppSettings } from '@/lib/types'
import { getSettings, saveCharacter } from '@/lib/storage'
import type { IntruderFate } from '@/lib/keeper'
import { CharacterCard } from '@/components/character-card'
import { ChatPanel } from '@/components/chat-panel'
import { ImagePanel } from '@/components/image-panel'
import { SettingsPanel } from '@/components/settings-panel'
import { FateActions } from '@/components/fate-actions'

export type ExploreActions = { explore: () => void; advanceFloor: () => void }
interface GameScreenProps {
  character: Character
  onBack: () => void
  onSettle: (character: Character, fate: IntruderFate) => void
}

export function GameScreen({ character: initialCharacter, onBack, onSettle }: GameScreenProps) {
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

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0">
        <h1 className="text-base font-bold gold-text tracking-widest flex-shrink-0">地下城城主</h1>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <FateActions character={character} disabled={busy} onSettle={(fate) => onSettle(character, fate)} />
          <button onClick={() => setShowSettings(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary text-xs text-muted-foreground">
            <Settings className="w-3.5 h-3.5" />设置
          </button>
        </div>
      </header>
      <div className="flex md:hidden border-b border-border">
        {(['chat', 'image'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2.5 text-xs ${activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}>
            {tab === 'chat' ? '调教' : `场景插图${pendingScene ? ' •' : ''}`}
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
