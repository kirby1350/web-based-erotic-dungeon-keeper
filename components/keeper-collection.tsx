'use client'

import { useState } from 'react'
import { RACE_INFO, type AppSettings } from '@/lib/types'
import { CAGES, FATE_LABEL, appendRecall, cageKind, collectionActions, collectionNeedsSlot, pickDiscardScene, planReturn, setCaptiveLureFloor, stampBrand, type CageKind, type CaptiveRecord, type CollectionAction, type KeeperSave, type KeeperTrap } from '@/lib/keeper'
import { CharacterProfile, captiveHistory } from '@/components/character-profile'
import { StatePortrait } from '@/components/state-portrait'
import { dkTermsLine } from '@/lib/terms-dk'
import { buildAftermathPrompt, buildWatchPrompt } from '@/lib/prompts'
import { useAftermath } from '@/hooks/use-aftermath'
import { AftermathPopup } from '@/components/aftermath-popup'

interface KeeperCollectionProps {
  cheat?: boolean
  keep: KeeperSave
  settings: AppSettings
  blocked: boolean
  onBringBack: (record: CaptiveRecord, line: string, planned: NonNullable<ReturnType<typeof planReturn>>) => void
  onUpdate: (record: CaptiveRecord, patch: Partial<Pick<CaptiveRecord, 'fate' | 'character' | 'recall' | 'cage' | 'ledger' | 'lureFloor'>>) => void
  onKeep?: (keep: KeeperSave) => void
  onBack: () => void
}

const CAGE_ACTIVE_STYLE: Record<CageKind, string> = {
  cell: 'border-slate-400/60 bg-slate-500/15 text-slate-100 font-bold',
  machine: 'border-cyan-400/60 bg-cyan-500/15 text-cyan-200 font-bold',
  ranch: 'border-amber-400/60 bg-amber-500/15 text-amber-200 font-bold',
  tentacle: 'border-fuchsia-400/60 bg-fuchsia-500/15 text-fuchsia-200 font-bold',
  breeding: 'border-rose-400/60 bg-rose-500/15 text-rose-200 font-bold',
}

function passiveYieldNote(record: CaptiveRecord): string {
  if (record.fate !== 'kept' && record.fate !== 'broken') return ''
  if (record.lureFloor) return `派驻第 ${record.lureFloor} 层充当活体肉饵 · 本层淫髓 +15%，每探索 1 轮额外 +1 淫髓`
  const cage = record.cage ?? 'cell'
  if (cage === 'cell') return '普通地牢：静置收押（更换特殊囚笼或派驻迷宫可在探索时自动产出淫髓）'
  const isCow = record.race === 'tauren' || (record.character.bodyDevelopment?.breast ?? 0) >= 2
  const amt = cage === 'breeding' ? 2 : cage === 'ranch' ? (isCow ? 2 : 1) : 1
  return `${CAGES[cage].label}运转中 · 迷宫每推进 1 轮后台自动榨取 +${amt} 淫髓`
}

export function KeeperCollection({ keep, settings, blocked, onBringBack, onUpdate, onKeep, onBack, cheat }: KeeperCollectionProps) {
  const aftermath = useAftermath(settings)
  const [aimId, setAimId] = useState<string | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  const profileRecord = keep.collection.find((r) => r.id === profileId)
  const placedTraps = keep.traps.filter((trap) => trap.placed)
  const launch = (record: CaptiveRecord, action: CollectionAction, trap?: KeeperTrap) => {
    setAimId(null)
    const scene = action.effect === 'discard' ? pickDiscardScene() : null
    const brief = scene
      ? `${scene.brief}这一段会作为烙印记在她身上，状态改成放走。`
      : trap
        ? `城主把她直接传送，扔进「${trap.name}」。${trap.mechanism}她没有自己走路进来。`
        : action.brief
    aftermath.ask({
      title: scene ? `${action.label} · ${scene.label} · ${record.name}` : `${action.label} · ${record.name}`,
      prompt: buildAftermathPrompt({
        name: record.name,
        action: scene ? `${action.label}：${scene.label}` : action.label,
        brief,
        pleasure: record.pleasure,
        desire: record.desire,
        recall: record.recall,
        longer: Boolean(scene),
        terms: dkTermsLine({ ...record.character, pleasure: record.pleasure }),
      }),
      onConfirm: (text) => {
        if (action.effect === 'release') {
          onUpdate(record, { fate: 'defeated', character: record.character, recall: appendRecall(record.recall, text), lureFloor: undefined })
          return
        }
        if (action.effect === 'discard') {
          if (!scene) return
          const character = stampBrand(record.character, scene.label, text)
          onUpdate(record, { fate: 'defeated', character, recall: appendRecall(record.recall, `${scene.label}。${text}`), lureFloor: undefined })
          return
        }
        if (action.effect === 'watch' || action.effect === 'train') return
        const planned = planReturn(keep, record, action.effect, trap?.id)
        if (!planned) return
        onBringBack(record, text, planned)
      },
    })
  }
  const choose = (record: CaptiveRecord, action: CollectionAction) => {
    if (action.effect === 'recall' && placedTraps.length > 0) {
      setAimId(record.id)
      return
    }
    launch(record, action)
  }
  const setCage = (record: CaptiveRecord, cage: CageKind) => {
    onUpdate(record, { cage })
  }
  const watch = (record: CaptiveRecord) => {
    const cage = cageKind(record.cage, record.fate) ?? 'cell'
    const info = CAGES[cage]
    const brands = (record.character.brands ?? []).filter((item) => item.trim()).join('；')
    aftermath.ask({
      title: `外面观赏 · ${info.label} · ${record.name}`,
      confirmLabel: '记下这段',
      prompt: buildWatchPrompt({
        name: record.name,
        cageLabel: info.label,
        holds: info.holds,
        watch: info.watch,
        fate: FATE_LABEL[record.fate],
        pleasure: record.pleasure,
        desire: record.desire,
        brands,
        ledger: record.ledger,
        terms: dkTermsLine({ ...record.character, pleasure: record.pleasure }),
      }),
      onConfirm: (text) => onUpdate(record, { cage, ledger: text }),
    })
  }
  const enter = (record: CaptiveRecord) => {
    const cage = cageKind(record.cage, record.fate) ?? 'cell'
    const planned = planReturn(keep, { ...record, cage }, 'train', undefined, cage)
    if (!planned) return
    onBringBack(record, '', planned)
  }
  return (
    <div className="min-h-screen p-4 lg:p-8">
      {profileRecord && <CharacterProfile person={profileRecord.character} cheat={cheat} history={captiveHistory(profileRecord)}
        status={`${FATE_LABEL[profileRecord.fate]}${profileRecord.cage ? ` · ${CAGES[profileRecord.cage].label}` : ''}`}
        onChange={(next) => onUpdate(profileRecord, { character: next })} onClose={() => setProfileId(null)} />}
      {aftermath.popup && <AftermathPopup popup={aftermath.popup} onConfirm={aftermath.confirm} onDismiss={aftermath.dismiss} />}
      <div className="max-w-3xl lg:max-w-6xl mx-auto space-y-4">
        <button type="button" onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground transition-colors">回到城主厅</button>
        <div>
          <h1 className="text-3xl font-bold gold-text">收藏室</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">收押与玩坏的战利品皆囚于此处。你可以为她们更换不同囚笼、隔栏观赏受虐惨状（不占在狱栏位），或推门开启新一轮专属调教；曾被放逐的猎物也可随时传送召回，直接投入布好的陷阱。</p>
          {blocked && <p className="text-sm text-amber-200 mt-2">在狱栏位已满。请先回城主厅结算一名在狱猎物，再提审或召回。</p>}
        </div>
        {keep.collection.length === 0 && <p className="text-sm text-muted-foreground">收藏室还是空的。</p>}
        <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-3.5 lg:items-start">
          {keep.collection.map((record) => (
            <article key={record.id} className="dungeon-border rounded-xl bg-card p-4 flex gap-3.5">
              <button
                type="button"
                onClick={() => setProfileId(record.id)}
                title="翻阅档案与阶段立绘"
                className="w-20 sm:w-24 aspect-[2/3] rounded-lg overflow-hidden border border-border bg-secondary flex-shrink-0 hover:border-primary/60 transition-colors self-start"
              >
                <StatePortrait character={{ ...record.character, pleasure: record.pleasure, desire: record.desire }} className="w-full h-full" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-bold gold-text text-base truncate">{record.name}</h2>
                  <button type="button" onClick={() => setProfileId(record.id)} className="text-[11px] text-primary hover:underline" data-testid="open-profile">档案</button>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                    record.fate === 'broken'
                      ? 'border-pink-400/50 bg-pink-500/15 text-pink-200'
                      : record.fate === 'kept'
                        ? 'border-amber-400/50 bg-amber-500/15 text-amber-200'
                        : 'border-border text-muted-foreground'
                  }`}>{FATE_LABEL[record.fate]}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{RACE_INFO[record.race]?.label ?? record.race} · 快感 {record.pleasure} · 欲望 {record.desire}{record.cage ? ` · ${CAGES[record.cage].label}` : ''}</p>
                {record.character.brands?.length ? <p className="text-xs text-pink-200/80 mt-1">烙印 {record.character.brands.map((brand) => brand.split('：')[0]).join('、')}</p> : null}
                {record.ledger
                  ? <p className="text-sm mt-2 leading-relaxed whitespace-pre-line">{record.ledger}</p>
                  : record.fate !== 'defeated'
                    ? <p className="text-xs text-muted-foreground mt-2 leading-relaxed">尚未记录她在此笼中的姿态。选好囚笼后点击「外面观赏」，即可隔栏观察并记下她的受虐近况。</p>
                    : null}
                {record.fate !== 'defeated' && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex flex-wrap gap-1.5">
                      {(Object.keys(CAGES) as CageKind[]).map((kind) => (
                        <button
                          key={kind}
                          type="button"
                          onClick={() => setCage(record, kind)}
                          title={CAGES[kind].holds}
                          className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${record.cage === kind ? CAGE_ACTIVE_STYLE[kind] : 'border-border text-muted-foreground hover:border-primary/40'}`}
                        >
                          {CAGES[kind].label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-amber-200/85">{passiveYieldNote(record)}</p>
                    {onKeep && (
                      <label className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span>迷宫派驻：</span>
                        <select
                          aria-label={`${record.name}迷宫派驻`}
                          value={record.lureFloor ?? ''}
                          onChange={(e) => onKeep(setCaptiveLureFloor(keep, record.id, e.target.value ? Number(e.target.value) : undefined))}
                          className="rounded border border-border bg-secondary px-2 py-0.5 text-[11px] text-foreground"
                        >
                          <option value="">留在收藏室囚笼</option>
                          {keep.floors.slice(0, keep.progress.depth).map((f, idx) => (
                            <option key={idx} value={idx + 1}>挂在第 {idx + 1} 层「{f.name}」当活体肉饵（+15% 淫髓）</option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  {collectionActions(record.fate).map((action) => {
                    const needsSlot = collectionNeedsSlot(action.effect)
                    return (
                      <button
                        key={action.id}
                        type="button"
                        disabled={needsSlot && blocked}
                        title={needsSlot && blocked ? '在狱的格子满了' : action.brief}
                        onClick={() => {
                          if (action.effect === 'watch') watch(record)
                          else if (action.effect === 'train') enter(record)
                          else choose(record, action)
                        }}
                        className="text-sm text-primary disabled:opacity-40"
                      >
                        {action.label}
                      </button>
                    )
                  })}
                </div>
                {aimId === record.id && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button type="button" onClick={() => launch(record, collectionActions('defeated')[0])} className="text-sm text-primary">送进迷宫</button>
                    {placedTraps.map((trap) => (
                      <button key={trap.id} type="button" onClick={() => launch(record, collectionActions('defeated')[0], trap)} className="text-sm text-primary">扔进「{trap.name}」</button>
                    ))}
                    <button type="button" onClick={() => setAimId(null)} className="text-sm text-muted-foreground">先不召回</button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
