'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { RACE_INFO, type Character, type CharacterPreset } from '@/lib/types'
import { characterFromPreset, FATE_LABEL, CAGES, type CaptiveRecord } from '@/lib/keeper'
import { getKeep, saveKeep } from '@/lib/storage'
import { CORRUPT_TIERS, AROUSAL_TIERS, TERM_SLOTS, TERM_SLOT_LABEL, TERM_SOURCE_LABEL, addOverrides, itemActive, resetSlot, toggleLock, type TermSlot } from '@/lib/terms'
import { CREST_ITEM, applyCrest, corruptionOf, dkTerms, removeCrest, sourceWork } from '@/lib/terms-dk'
import { IntruderDossier } from '@/components/intruder-dossier'

export interface ProfileHistory { title: string; text: string }

interface Props {
  person: Character | CharacterPreset
  /** 处境一行：在狱 / 留下 / 牢笼 / 还没来过 */
  status?: string
  history?: ProfileHistory[]
  hideCollapse?: boolean
  cheat?: boolean
  /** 有它时称呼卡可编辑，改动写回存档 */
  onChange?: (next: Character) => void
  onClose: () => void
}

const isCharacter = (p: Character | CharacterPreset): p is Character => 'hp' in p

function bodyRows(c: Character): [string, number][] {
  const d = c.bodyDevelopment
  return d ? [['胸', d.breast], ['阴蒂', d.clitoris], ['尿道', d.urethra], ['阴道', d.vagina], ['肛门', d.anus]] : []
}

export function TermsCard({ character, cheat, onChange }: { character: Character; cheat?: boolean; onChange?: (next: Character) => void }) {
  const r = dkTerms(character)
  const [edit, setEdit] = useState<TermSlot | null>(null)
  const [draft, setDraft] = useState('')
  const crest = itemActive(character.terms, character.turnCount ?? 0)
  const set = (terms: Character['terms']) => onChange?.({ ...character, terms })
  const buyCrest = () => {
    const keep = getKeep()
    if (keep.progress.essence < CREST_ITEM.cost) return
    saveKeep({ ...keep, progress: { ...keep.progress, essence: keep.progress.essence - CREST_ITEM.cost } })
    onChange?.(applyCrest(character))
  }
  return (
    <section className="rounded-xl border border-border bg-secondary/40 p-3 space-y-2" data-testid="terms-card">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[11px] tracking-widest text-muted-foreground">称呼</h2>
        <span className="text-[11px] text-muted-foreground">堕落 {CORRUPT_TIERS[r.corruptTier]} · 快感 {AROUSAL_TIERS[r.arousalTier]}{r.boosted ? ' · 淫纹 +1 档' : ''}</span>
      </div>
      <ul className="space-y-1.5">
        {TERM_SLOTS.map((slot) => {
          const t = r[slot]
          const locked = !!character.terms?.locked?.[slot]
          return (
            <li key={slot} className="flex items-center gap-2 text-sm">
              <span className="w-10 flex-shrink-0 text-[11px] text-muted-foreground">{TERM_SLOT_LABEL[slot]}</span>
              {edit === slot
                ? <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} className="flex-1 min-w-0 rounded bg-background px-2 py-0.5 text-sm" aria-label={`改${TERM_SLOT_LABEL[slot]}`} />
                : <span className="flex-1 min-w-0 truncate font-medium text-pink-100">「{t.value}」</span>}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${t.source === 'default' ? 'border-border text-muted-foreground' : 'border-primary/50 text-primary'}`}>{TERM_SOURCE_LABEL[t.source]}</span>
              {onChange && edit !== slot && (
                <>
                  <button type="button" className="text-[11px] text-muted-foreground" onClick={() => set(toggleLock(character.terms, slot, t.value))}>{locked ? '解锁' : '锁定'}</button>
                  {t.source !== 'default' && t.source !== 'item' && <button type="button" className="text-[11px] text-muted-foreground" onClick={() => set(resetSlot(character.terms, slot))}>重置</button>}
                  {cheat && <button type="button" className="text-[11px] text-fuchsia-300" onClick={() => { setEdit(slot); setDraft(t.value) }}>改</button>}
                </>
              )}
              {edit === slot && (
                <>
                  <button type="button" className="text-[11px] text-primary" onClick={() => { if (draft.trim()) set(addOverrides(character.terms, [{ slot, value: draft.trim() }], 'cheat')); setEdit(null) }}>确定</button>
                  <button type="button" className="text-[11px] text-muted-foreground" onClick={() => setEdit(null)}>取消</button>
                </>
              )}
            </li>
          )
        })}
      </ul>
      <p className="text-[11px] text-muted-foreground leading-relaxed">器官叫法跟本回合快感走，回合结束就回落；自称和叫你跟堕落走，是永久的。在对话里说「以后叫自己…」「以后叫我…」「把你的胸叫做…」，她会记住。</p>
      {onChange && (
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          {crest
            ? <><span className="text-pink-200">{character.terms?.itemLabel ?? CREST_ITEM.label}：还剩 {(character.terms?.itemUntil ?? 0) - (character.turnCount ?? 0)} 回合</span>
                <button type="button" className="text-muted-foreground" onClick={() => onChange(removeCrest(character))}>解除淫纹</button></>
            : <button type="button" className="text-primary" onClick={buyCrest}>刻上{CREST_ITEM.label}（{CREST_ITEM.cost} 淫髓，{CREST_ITEM.turns} 回合内档位 +1）</button>}
        </div>
      )}
    </section>
  )
}

export function CharacterProfile({ person, status, history = [], hideCollapse, cheat, onChange, onClose }: Props) {
  const character = isCharacter(person) ? person : characterFromPreset(person)
  const corruption = corruptionOf(character)
  const tier = dkTerms(character).corruptTier
  return (
    <div className="fixed inset-0 z-50 bg-black/80 overflow-y-auto" data-testid="character-profile" role="dialog" aria-label={`${person.name}的档案`}>
      <div className="mx-auto w-full max-w-[480px] md:max-w-3xl lg:max-w-6xl min-h-full bg-background border-x border-border/60 p-4 lg:p-8">
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="flex items-center gap-1 text-xs text-muted-foreground"><X className="w-4 h-4" />关闭档案</button>
        </div>
        <div className="lg:grid lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-8">
          <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <div className="w-full aspect-[3/4] max-h-[60vh] rounded-xl overflow-hidden border border-border bg-secondary">
              {person.avatarUrl
                ? <img src={person.avatarUrl} alt={person.name} className="w-full h-full object-cover object-top" />
                : <div className="w-full h-full flex items-center justify-center text-6xl font-bold text-primary">{person.name[0]}</div>}
            </div>
            <div>
              <h1 className="text-3xl font-bold gold-text">{person.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">{sourceWork(person)} · {RACE_INFO[person.race]?.label}</p>
              <p className="text-xs text-muted-foreground mt-1">胸 {person.measurements.bust} / 腰 {person.measurements.waist} / 臀 {person.measurements.hip}</p>
              {status && <p className="text-xs text-pink-200/90 mt-2">{status}</p>}
            </div>
            <section className="space-y-1.5" data-testid="corruption">
              <div className="flex justify-between text-[11px] text-muted-foreground"><span>堕落</span><span>{corruption} / 100 · {CORRUPT_TIERS[tier]}</span></div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden"><div className="h-full bg-gradient-to-r from-rose-500 to-fuchsia-500" style={{ width: `${corruption}%` }} /></div>
              <div className="flex justify-between text-[10px] text-muted-foreground">{CORRUPT_TIERS.map((t, i) => <span key={t} className={i <= tier ? 'text-pink-200' : ''}>{t}</span>)}</div>
              {isCharacter(person) && (
                <p className="text-[11px] text-muted-foreground">{bodyRows(character).map(([k, v]) => `${k} ${v}`).join(' · ')}{character.brands?.length ? ` · 烙印 ${character.brands.length}` : ''}</p>
              )}
            </section>
            <TermsCard character={character} cheat={cheat} onChange={onChange} />
          </aside>
          <main className="space-y-6 mt-6 lg:mt-0">
            <IntruderDossier person={person} hideCollapse={hideCollapse} />
            {character.brands?.length ? (
              <section>
                <h2 className="text-[11px] tracking-widest text-muted-foreground mb-1">烙印</h2>
                <ul className="space-y-1 text-sm leading-relaxed">{character.brands.map((b, i) => <li key={i}>{b}</li>)}</ul>
              </section>
            ) : null}
            <section data-testid="profile-history">
              <h2 className="text-[11px] tracking-widest text-muted-foreground mb-2">调教与处置记录</h2>
              {history.length === 0
                ? <p className="text-sm text-muted-foreground">还没有记录。</p>
                : <ol className="space-y-3">{history.map((h, i) => (
                    <li key={i} className="rounded-lg border border-border bg-card p-3">
                      <p className="text-[11px] text-primary mb-1">{h.title}</p>
                      <p className="text-sm leading-relaxed whitespace-pre-line">{h.text}</p>
                    </li>
                  ))}</ol>}
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}

/** 从一场会话里抽出记录：最近几回合的命令 + 摘要 */
export function sessionHistory(session: { summary?: string; turns?: { input: string; committedAt: number }[] } | null | undefined): ProfileHistory[] {
  if (!session) return []
  const out: ProfileHistory[] = []
  if (session.summary?.trim()) out.push({ title: '这场的摘要', text: session.summary.trim() })
  for (const t of (session.turns ?? []).slice(-8).reverse()) out.push({ title: `城主的命令 · ${new Date(t.committedAt).toLocaleString('zh-CN', { hour12: false })}`, text: t.input })
  return out
}

/** 收藏室里的人：处置、牢笼记录、她记得的事 */
export function captiveHistory(record: CaptiveRecord): ProfileHistory[] {
  const out: ProfileHistory[] = [{ title: `处置 · ${new Date(record.savedAt).toLocaleString('zh-CN', { hour12: false })}`, text: `${FATE_LABEL[record.fate]}${record.cage ? ` · 关进${CAGES[record.cage].label}` : ''}` }]
  if (record.ledger?.trim()) out.push({ title: '牢笼记录', text: record.ledger.trim() })
  if (record.recall?.trim()) out.push({ title: '她记得的事', text: record.recall.trim() })
  return out
}
