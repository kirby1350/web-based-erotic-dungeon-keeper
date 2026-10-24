'use client'

import { useEffect, useState } from 'react'
import { Character, type AppSettings, type GameSession } from '@/lib/types'
import { getCharacter, getKeep, getSession, getSettings, saveGame, saveKeep } from '@/lib/storage'
import { dzmmReady } from '@/lib/dzmm'
import { adoptMonster, adoptTrap, emptyKeep, buildCaptiveRecall, collapsed, cageKind, FATE_ESSENCE, FATE_LABEL, fateGate, grantEssence, planReturn, rememberIntruder, stationFor, trainingSessionSummary, type CaptiveRecord, type IntruderFate, type KeeperBrief, type KeeperSave, type RosterEntry } from '@/lib/keeper'
import { buildAftermathPrompt } from '@/lib/prompts'
import { useAftermath } from '@/hooks/use-aftermath'
import { AftermathPopup } from '@/components/aftermath-popup'
import { GameScreen } from '@/components/game-screen'
import { KeepHall } from '@/components/keep-hall'
import { HallCheat } from '@/components/cheat-panel'
import { CampaignCard, EndingOverlay } from '@/components/campaign-card'
import { emptyCampaign, isRaidMember, raidRemaining, recordFate, scaleIntruder, threatTier } from '@/lib/campaign'
import { IntruderGate, type BeginIntrusion } from '@/components/intruder-gate'
import { KeeperWorkshop } from '@/components/keeper-workshop'
import { KeeperCollection } from '@/components/keeper-collection'
import { KeeperArchive } from '@/components/keeper-archive'
import { DungeonEditor } from '@/components/dungeon-editor'
import { SettingsPanel } from '@/components/settings-panel'

type Screen = 'hall' | 'gate' | 'traps' | 'monsters' | 'collection' | 'archive' | 'dungeon' | 'scene'
const CONVERSATION_KEY = 'dungeon_conversation_id'

function parkActive(keep: KeeperSave): KeeperSave {
  if (!keep.activeId || typeof window === 'undefined') return keep
  const live = getCharacter()
  if (!live) return keep
  const conversationId = localStorage.getItem(CONVERSATION_KEY)
  return {
    ...keep,
    roster: keep.roster.map((entry) => entry.id === keep.activeId ? {
      ...entry,
      character: live,
      session: getSession(),
      conversationId: conversationId || entry.conversationId,
    } : entry),
  }
}

function writeLive(character: Character | null, session: GameSession | null, conversationId: string | null) {
  saveGame(character, session)
  if (conversationId) localStorage.setItem(CONVERSATION_KEY, conversationId)
  else localStorage.removeItem(CONVERSATION_KEY)
}

function adoptArrival(keep: KeeperSave, payload: BeginIntrusion): KeeperSave {
  let next = keep
  if (payload.trap) next = adoptTrap(next, payload.trap)
  if (payload.monster) next = adoptMonster(next, payload.monster)
  return next
}

function entryFrom(payload: BeginIntrusion): RosterEntry {
  return {
    id: crypto.randomUUID(),
    station: stationFor(payload.brief),
    character: payload.character,
    session: null,
    conversationId: crypto.randomUUID(),
    brief: payload.brief,
  }
}

export default function HomePage() {
  const [screen, setScreen] = useState<Screen>('hall')
  const [character, setCharacter] = useState<Character | null>(null)
  const [keep, setKeep] = useState<KeeperSave | null>(null)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [sceneKey, setSceneKey] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const aftermath = useAftermath(settings)

  useEffect(() => {
    dzmmReady()
    let next = getKeep()
    const saved = getCharacter()
    if (saved && next.roster.length === 0) {
      const id = crypto.randomUUID()
      const brief: KeeperBrief = next.brief ?? { opening: 'personal' }
      next = {
        ...next,
        activeId: id,
        brief,
        roster: [{
          id,
          station: '这场还没处理完',
          character: saved,
          session: getSession(),
          conversationId: localStorage.getItem(CONVERSATION_KEY) || crypto.randomUUID(),
          brief,
        }],
      }
      saveKeep(next)
    }
    setCharacter(saved)
    setKeep(next)
    setSettings(getSettings())
    setScreen(saved ? 'scene' : 'hall')
    setLoaded(true)
  }, [])

  const commitKeep = (next: KeeperSave) => {
    saveKeep(next)
    setKeep(next)
  }

  const openScene = (next: Character) => {
    setCharacter(next)
    setSceneKey((value) => value + 1)
    setScreen('scene')
  }

  const settle = (id: string, fate: IntruderFate, line = '') => {
    let next = parkActive(getKeep())
    const entry = next.roster.find((item) => item.id === id)
    if (!entry) return
    const current = entry.character
    const remembered = buildCaptiveRecall(entry.session, fate)
    const record: CaptiveRecord = {
      id: crypto.randomUUID(),
      name: current.name,
      race: current.race,
      fate,
      avatarUrl: current.avatarUrl,
      pleasure: current.pleasure,
      desire: current.desire,
      character: current,
      savedAt: Date.now(),
      recall: remembered.recall,
      memory: remembered.memory,
      cage: entry.brief.cage ?? cageKind(undefined, fate),
      ledger: line.trim(),
    }
    const removingActive = next.activeId === id
    next = { ...next, campaign: recordFate(next.campaign ?? emptyCampaign(), current.name, fate) }
    next = grantEssence({
      ...next,
      roster: next.roster.filter((item) => item.id !== id),
      collection: [record, ...next.collection].slice(0, 40),
      activeId: removingActive ? null : next.activeId,
      brief: removingActive ? null : next.brief,
    }, FATE_ESSENCE[fate])
    commitKeep(next)
    if (removingActive) {
      writeLive(null, null, null)
      setCharacter(null)
    }
    setScreen('hall')
  }

  const askSettle = (id: string, fate: IntruderFate, force = false) => {
    const live = getKeep()
    const entry = live.roster.find((item) => item.id === id)
    if (!entry) return
    const current = live.activeId === id ? (getCharacter() ?? entry.character) : entry.character
    if (!force && !fateGate(current, fate).ok) return
    const down = collapsed(current)
    const brief = fate === 'kept'
      ? '她被留在收藏室。这场调教到此结束，她记得城主和自己的身体。'
      : fate === 'broken'
        ? down
          ? '她的生命值到了 0，身体撑不住。按玩坏结算。记不清计划和说过的话，只剩身体。'
          : '她被玩坏。记不清计划和说过的话，只剩身体。'
        : '她被放走。她记得往外的路，也记得自己栽在哪一层。'
    aftermath.ask({
      title: `${FATE_LABEL[fate]} · ${current.name}`,
      prompt: buildAftermathPrompt({
        name: current.name,
        action: FATE_LABEL[fate],
        brief,
        pleasure: current.pleasure ?? 0,
        desire: current.desire ?? 0,
        recall: entry.session?.summary,
      }),
      locked: fate === 'broken' && down && !force,
      onConfirm: (text) => settle(id, fate, text),
    })
  }

  const begin = (payloads: BeginIntrusion[]) => {
    let next = parkActive(getKeep())
    const tier = threatTier((next.campaign ?? emptyCampaign()).infamy)
    const arrivals = payloads.slice(0, Math.max(0, next.progress.intruderSlots - next.roster.length))
      .map((payload) => ({ ...payload, character: scaleIntruder(payload.character, isRaidMember(payload.character.name) ? 5 : tier) }))
    if (!arrivals.length) return
    const entries = arrivals.map(entryFrom)
    for (const payload of arrivals) {
      next = adoptArrival(next, payload)
      next = { ...next, recentNames: rememberIntruder(next, payload.character.name) }
    }
    const primary = entries[0]
    next = { ...next, roster: [...next.roster, ...entries].slice(0, 3), activeId: primary.id, brief: primary.brief }
    commitKeep(next)
    writeLive(primary.character, null, primary.conversationId)
    openScene(primary.character)
  }

  const resume = (id: string) => {
    let next = parkActive(getKeep())
    const entry = next.roster.find((item) => item.id === id)
    if (!entry) return
    next = { ...next, activeId: id, brief: entry.brief }
    commitKeep(next)
    writeLive(entry.character, entry.session, entry.conversationId)
    openScene(entry.character)
  }

  const bringBack = (record: CaptiveRecord, line: string, planned: NonNullable<ReturnType<typeof planReturn>>) => {
    let next = parkActive(getKeep())
    if (next.roster.length >= next.progress.intruderSlots) return
    if (!next.collection.some((item) => item.id === record.id)) return
    const session: GameSession = {
      messages: [],
      summary: planned.brief.return === 'train' && planned.brief.cage
        ? trainingSessionSummary(record, planned.brief.cage)
        : [line.trim(), record.recall || ''].filter(Boolean).join('\n').slice(0, 1200),
      memory: record.memory,
    }
    const entry: RosterEntry = {
      id: crypto.randomUUID(),
      station: stationFor(planned.brief),
      character: planned.character,
      session,
      conversationId: crypto.randomUUID(),
      brief: planned.brief,
    }
    next = {
      ...next,
      collection: next.collection.filter((item) => item.id !== record.id),
      roster: [...next.roster, entry],
      activeId: entry.id,
      brief: planned.brief,
      recentNames: rememberIntruder(next, planned.character.name),
    }
    commitKeep(next)
    writeLive(planned.character, session, entry.conversationId)
    openScene(planned.character)
  }

  const updateCaptive = (record: CaptiveRecord, patch: Partial<Pick<CaptiveRecord, 'fate' | 'character' | 'recall' | 'cage' | 'ledger'>>) => {
    const next = getKeep()
    if (!next.collection.some((item) => item.id === record.id)) return
    commitKeep({
      ...next,
      collection: next.collection.map((item) => item.id === record.id ? { ...item, ...patch } : item),
    })
  }

  if (!loaded || !keep || !settings) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">载入中...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {aftermath.popup && <AftermathPopup popup={aftermath.popup} onConfirm={aftermath.confirm} onDismiss={aftermath.dismiss} />}
      {screen === 'hall' && keep.campaign && <EndingOverlay campaign={keep.campaign} onRestart={() => commitKeep(emptyKeep())} onContinue={(campaign) => commitKeep({ ...keep, campaign })} />}
      {screen === 'hall' && (
        <div className="max-w-3xl lg:max-w-6xl mx-auto px-4 lg:px-8 pt-4 space-y-2">
          {settings.cheatMode && <HallCheat keep={keep} onKeep={commitKeep} />}
          <CampaignCard campaign={keep.campaign} />
        </div>
      )}
      {screen === 'hall' && (
        <KeepHall
          keep={keep}
          onKeep={commitKeep}
          onEnter={() => setScreen('gate')}
          onResume={resume}
          onSettle={askSettle}
          onOpenTraps={() => setScreen('traps')}
          onOpenMonsters={() => setScreen('monsters')}
          onOpenCollection={() => setScreen('collection')}
          onOpenArchive={() => setScreen('archive')}
          onOpenDungeon={() => setScreen('dungeon')}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}
      {screen === 'gate' && <IntruderGate keep={keep} raidNext={keep.campaign?.raid ? raidRemaining(keep.campaign)[0] : undefined} cheat={settings.cheatMode === true} onBegin={begin} onBack={() => setScreen('hall')} />}
      {screen === 'traps' && <KeeperWorkshop mode="trap" keep={keep} settings={settings} onKeep={commitKeep} onBack={() => setScreen('hall')} />}
      {screen === 'monsters' && <KeeperWorkshop mode="monster" keep={keep} settings={settings} onKeep={commitKeep} onBack={() => setScreen('hall')} />}
      {screen === 'collection' && (
        <KeeperCollection keep={keep} settings={settings} cheat={settings.cheatMode === true} blocked={keep.roster.length >= keep.progress.intruderSlots} onBringBack={bringBack} onUpdate={updateCaptive} onBack={() => setScreen('hall')} />
      )}
      {screen === 'archive' && <KeeperArchive keep={keep} cheat={settings.cheatMode === true} onKeep={commitKeep} onBack={() => setScreen('hall')} />}
      {screen === 'dungeon' && <DungeonEditor keep={keep} onKeep={commitKeep} onBack={() => setScreen('hall')} />}
      {screen === 'scene' && character && (
        <GameScreen
          key={sceneKey}
          character={character}
          onBack={() => {
            commitKeep(parkActive(getKeep()))
            setCharacter(getCharacter())
            setScreen('hall')
          }}
          onSettle={(_current, fate, force) => { if (keep.activeId) askSettle(keep.activeId, fate, force) }}
          cheat={settings.cheatMode === true}
        />
      )}
      {showSettings && (
        <SettingsPanel settings={settings} onSettingsChange={setSettings} onClose={() => setShowSettings(false)} canImport={screen !== 'scene'} />
      )}
    </>
  )
}
