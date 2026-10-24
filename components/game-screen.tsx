'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Settings, IdCard, PanelLeftClose, PanelLeftOpen, ImageIcon, ChevronDown, ChevronUp } from 'lucide-react'
import { CharacterProfile, sessionHistory } from '@/components/character-profile'
import { cn } from '@/lib/utils'
import { Character, AppSettings } from '@/lib/types'
import { getKeep, getSession, getSettings, saveCharacter } from '@/lib/storage'
import { keeperPromptContext, sceneChrome, type IntruderFate } from '@/lib/keeper'
import { ExploreControls } from '@/components/explore-controls'
import { MobileStatusBar, StatusPanel } from '@/components/status-panel'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { pushChanges, statusChanges } from '@/lib/status-view'
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
  const [showProfile, setShowProfile] = useState(false)
  const [navOpen, setNavOpen] = useState(true)
  // 导航条、往里赶这些控件只挂一份：桌面挂在左栏，手机挂在状态条下面
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)')
    const sync = () => setIsDesktop(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])
  const [showArt, setShowArt] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [changeLog, setChangeLog] = useState<string[]>([])
  // 回合开始时记下她，回合结束时比一比，写进「最近变化」
  const turnStart = useRef<Character | null>(null)
  const characterRef = useRef(character)
  characterRef.current = character
  useEffect(() => {
    if (busy) { turnStart.current = characterRef.current; return }
    const before = turnStart.current
    turnStart.current = null
    if (before) setChangeLog((log) => pushChanges(log, statusChanges(before, characterRef.current)))
  }, [busy])
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
  const keepView = getKeep()
  const chrome = sceneChrome(keeperPromptContext(keepView), character.floor ?? 1)
  const dead = (character.hp ?? 1) <= 0
  const explore = () => { if (!busy) actions.current.explore() }
  const advance = () => { if (!busy) actions.current.advanceFloor() }
  const back = () => { if (!busy && !dead) onBack() }
  const training = chrome.mode === 'train'

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <header className={cn('flex flex-wrap items-center justify-between gap-2 px-3 lg:px-4 py-2 border-b backdrop-blur-sm flex-shrink-0', training ? 'border-rose-500/30 bg-rose-950/40' : 'border-border bg-card/80')}>
        <div className="flex items-center gap-2 flex-shrink-0">
          <h1 className="text-base font-bold gold-text tracking-widest">地下城城主</h1>
          <span className={cn('text-[10px] px-2 py-0.5 rounded-full border', training ? 'border-rose-400/40 text-rose-200 bg-rose-500/15' : 'border-amber-400/40 text-amber-200 bg-amber-500/10')}>{chrome.tab}</span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {!(isDesktop && navOpen) && <FateActions character={character} disabled={busy} reasons={false} onSettle={(fate) => onSettle(character, fate)} />}
          <button onClick={() => setShowProfile(true)} data-testid="open-profile" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary text-xs text-muted-foreground">
            <IdCard className="w-3.5 h-3.5" /><span className="hidden sm:inline">档案</span>
          </button>
          <button onClick={() => setShowSettings(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary text-xs text-muted-foreground">
            <Settings className="w-3.5 h-3.5" /><span className="hidden sm:inline">设置</span>
          </button>
        </div>
      </header>
      {(cheat || settings.cheatMode) && <SceneCheat character={character} onUpdate={handleCharacterUpdate} onForceFate={(fate) => onSettle(character, fate, true)} />}
      <div className="flex lg:hidden border-b border-border">
        {(['chat', 'image'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 text-xs ${activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}>
            {tab === 'chat' ? chrome.tab : `场景插图${pendingScene ? ' •' : ''}`}
          </button>
        ))}
      </div>
      {/* 手机：状态收成一行，点开底部弹层；标签切换对话 / 插图。桌面 ≥1024：左栏导航 · 中间对话（插图折叠在顶上）· 右栏状态 */}
      <div className={`${activeTab === 'chat' ? 'block' : 'hidden'} lg:hidden`}>
        <MobileStatusBar character={character} onOpen={() => setSheetOpen(true)} />
        {!isDesktop && <ExploreControls layout="row" character={character} busy={busy || dead} onExplore={explore} onAdvanceFloor={advance} onBack={back} />}
      </div>
      <main className={cn('flex flex-col flex-1 min-h-0 overflow-hidden lg:grid lg:grid-rows-[minmax(0,1fr)]', navOpen ? 'lg:grid-cols-[220px_minmax(0,1fr)_360px]' : 'lg:grid-cols-[44px_minmax(0,1fr)_360px]')}>
        <aside className="hidden lg:block border-r border-border min-h-0 overflow-y-auto" data-testid="scene-nav">
          <div className="flex items-center justify-between px-2 py-2 border-b border-border">
            {navOpen && <span className="text-[11px] tracking-widest text-muted-foreground pl-1">导航</span>}
            <button type="button" onClick={() => setNavOpen((v) => !v)} title={navOpen ? '收起导航' : '展开导航'} className="w-7 h-7 rounded flex items-center justify-center hover:bg-secondary text-muted-foreground">
              {navOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>
          </div>
          {navOpen && isDesktop && (
            <div className="p-3 space-y-4">
              <ExploreControls character={character} busy={busy || dead} onExplore={explore} onAdvanceFloor={advance} onBack={back} />
              <div className="space-y-1.5">
                <p className="text-[11px] tracking-widest text-muted-foreground">处置</p>
                <FateActions character={character} disabled={busy} onSettle={(fate) => onSettle(character, fate)} />
              </div>
              <div className="space-y-1">
                <button onClick={() => setShowProfile(true)} className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-secondary"><IdCard className="w-3.5 h-3.5" />档案</button>
                <button onClick={() => setShowArt((v) => !v)} className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-secondary"><ImageIcon className="w-3.5 h-3.5" />{showArt ? '收起插图' : '展开插图'}{pendingScene ? ' •' : ''}</button>
                <button onClick={() => setShowSettings(true)} className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-secondary"><Settings className="w-3.5 h-3.5" />设置</button>
              </div>
            </div>
          )}
        </aside>
        {/* 对话与插图各只挂一份：手机靠标签切换，桌面插图折叠在对话顶上 */}
        <section className="flex flex-col flex-1 min-h-0 min-w-0">
          <button type="button" onClick={() => setShowArt((v) => !v)} className="hidden lg:flex w-full items-center justify-between px-4 py-1.5 border-b border-border text-[11px] text-muted-foreground hover:bg-secondary/50 flex-shrink-0" data-testid="art-toggle" aria-label={showArt ? "收起插图区" : "展开插图区"} aria-expanded={showArt}>
            <span className="flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" />场景插图{pendingScene ? ' · 有新画面' : ''}</span>
            {showArt ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <div className={cn('min-h-0 overflow-hidden', activeTab === 'image' ? 'flex-1 block' : 'hidden', showArt ? 'lg:block lg:flex-none lg:h-[42vh] lg:border-b border-border' : 'lg:hidden')}>
            <ImagePanel settings={settings} character={character} pendingScene={pendingScene} onSceneHandled={handleSceneHandled} />
          </div>
          <div className={cn('flex-1 min-h-0 overflow-hidden', activeTab === 'chat' ? 'block' : 'hidden', 'lg:block')}>
            <ChatPanel character={character} settings={settings} onRequestImage={handleRequestImage}
              onCharacterUpdate={handleCharacterUpdate} onTurnCommit={setCharacter} onBusyChange={setBusy} exploreActionsRef={actions} />
          </div>
        </section>
        <aside className="hidden lg:block border-l border-border min-h-0 overflow-y-auto">
          <StatusPanel character={character} keep={keepView} log={changeLog} onOpenProfile={() => setShowProfile(true)} />
        </aside>
      </main>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto p-0 lg:hidden">
          <SheetHeader className="px-4 pt-4 pb-0"><SheetTitle className="text-sm">{character.name} 的状态</SheetTitle></SheetHeader>
          <StatusPanel character={character} keep={keepView} log={changeLog} onOpenProfile={() => { setSheetOpen(false); setShowProfile(true) }} />
        </SheetContent>
      </Sheet>
      {showProfile && <CharacterProfile person={character} cheat={cheat || settings.cheatMode} status={`在狱 · 第 ${character.floor ?? 1} 层 · 快感 ${character.pleasure ?? 0} · 欲望 ${character.desire ?? 0}`}
        history={sessionHistory(getSession())} onChange={busy ? undefined : (next) => handleCharacterUpdate({ terms: next.terms, turnCount: next.turnCount })} onClose={() => setShowProfile(false)} />}
      {showSettings && <SettingsPanel settings={settings} onSettingsChange={setSettings} onClose={() => setShowSettings(false)} canImport={!busy} />}
    </div>
  )
}
