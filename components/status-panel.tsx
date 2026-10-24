'use client'

import { Flame, Heart, Sparkles, Swords, Bug, ChevronUp } from 'lucide-react'
import type { KeeperSave } from '@/lib/keeper'
import { RACE_INFO, type Character } from '@/lib/types'
import { CORRUPT_TIERS, TERM_SLOTS, TERM_SLOT_LABEL } from '@/lib/terms'
import { dkTerms } from '@/lib/terms-dk'
import { BODY_PARTS, activeDefenses, buffTags, corruptionView } from '@/lib/status-view'
import { CLIMAX_AT, resolvePortrait } from '@/lib/portraits'
import { StatePortrait, usePortraitManifest } from '@/components/state-portrait'
import { cn } from '@/lib/utils'

function Bar({ icon, label, value, max = 100, tone, flash }: { icon: React.ReactNode; label: string; value: number; max?: number; tone: string; flash?: boolean }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100))
  return (
    <div data-testid={`bar-${label}`}>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="flex items-center gap-1 text-muted-foreground">{icon}{label}</span>
        <span className="tabular-nums font-bold text-foreground">{value}<span className="text-muted-foreground font-normal">/{max}</span></span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500', tone, flash && 'animate-pulse shadow-[0_0_10px_rgba(236,72,153,0.9)]')} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function Section({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="space-y-1.5">
      <div className="flex items-center justify-between"><h3 className="text-[11px] tracking-widest text-primary/80">{title}</h3>{aside}</div>
      {children}
    </section>
  )
}

export function StatusPanel({ character, keep, log, onOpenProfile }: { character: Character; keep: KeeperSave | null; log: string[]; onOpenProfile: () => void }) {
  const c = character
  const cor = corruptionView(c)
  const terms = dkTerms(c)
  const defenses = activeDefenses(c, keep)
  const tags = buffTags(c)
  const nearClimax = (c.pleasure ?? 0) >= CLIMAX_AT - 10
  const hasArt = resolvePortrait(c, usePortraitManifest()).src != null
  return (
    <div className="space-y-4 p-4" data-testid="status-panel">
      {!hasArt ? (
        <button type="button" onClick={onOpenProfile} title="翻开完整档案" className="flex w-full items-center gap-3 rounded-xl border border-border bg-secondary/40 p-2 text-left hover:border-primary/50">
          <StatePortrait character={c} variant="avatar" className="w-14 h-14 rounded-lg text-xl flex-shrink-0" />
          <div className="min-w-0"><p className="font-bold gold-text truncate">{c.name}</p><p className="text-[11px] text-muted-foreground">{RACE_INFO[c.race]?.label ?? c.race} · 第 {c.floor ?? 1} 层 · 点开档案</p></div>
        </button>
      ) : <button type="button" onClick={onOpenProfile} title="翻开完整档案" className="group relative block w-full overflow-hidden rounded-xl border border-border bg-secondary aspect-[4/5]">
        <StatePortrait character={c} className="w-full h-full transition-transform duration-300 group-hover:scale-[1.02]" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 text-left">
          <p className="font-bold gold-text text-lg leading-tight">{c.name}</p>
          <p className="text-[11px] text-white/70">{RACE_INFO[c.race]?.label ?? c.race} · 第 {c.floor ?? 1} 层 · 点开档案</p>
        </div>
      </button>}

      <div className="space-y-2.5">
        <Bar icon={<Heart className="w-3 h-3 text-red-400" />} label="生命" value={c.hp ?? 0} max={c.maxHp ?? 100} tone="bg-red-500" />
        <Bar icon={<Sparkles className="w-3 h-3 text-pink-400" />} label="快感" value={c.pleasure ?? 0} tone="bg-gradient-to-r from-pink-600 to-pink-400" flash={nearClimax} />
        <Bar icon={<Flame className="w-3 h-3 text-orange-400" />} label="欲望" value={c.desire ?? 0} tone="bg-orange-500" />
      </div>

      <Section title="堕落" aside={<span className="text-[11px] tabular-nums text-muted-foreground">{cor.score}/100{cor.nextAt != null ? ` · 距下一档 ${cor.nextAt - cor.score}` : ''}</span>}>
        <div className="grid grid-cols-4 gap-1" data-testid="corruption-scale">
          {CORRUPT_TIERS.map((t, i) => (
            <div key={t} className="space-y-1">
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-gradient-to-r from-rose-500 to-fuchsia-500" style={{ width: i < cor.tier ? '100%' : i === cor.tier ? `${cor.toNext}%` : '0%' }} />
              </div>
              <p className={cn('text-center text-[10px]', i === cor.tier ? 'text-pink-200 font-bold' : i < cor.tier ? 'text-pink-300/60' : 'text-muted-foreground/60')}>{t}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="本回合称呼" aside={terms.boosted ? <span className="text-[10px] text-fuchsia-300">淫纹 +1 档</span> : undefined}>
        <div className="flex flex-wrap gap-1" data-testid="terms-line">
          {TERM_SLOTS.map((slot) => (
            <span key={slot} className="rounded-md border border-border bg-secondary/60 px-1.5 py-0.5 text-[11px]">
              <span className="text-muted-foreground">{TERM_SLOT_LABEL[slot]} </span>「{terms[slot].value}」
            </span>
          ))}
        </div>
      </Section>

      <Section title="生效中的布置">
        {defenses.length === 0 ? <p className="text-[11px] text-muted-foreground/60">这一层没有布置。</p> : (
          <ul className="space-y-1">
            {defenses.map((d) => (
              <li key={`${d.kind}-${d.name}`} title={d.summary} className={cn('flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] border', d.engaged ? 'border-rose-400/50 bg-rose-500/10 text-rose-100' : 'border-border text-muted-foreground')}>
                {d.kind === 'trap' ? <Swords className="w-3 h-3 flex-shrink-0" /> : <Bug className="w-3 h-3 flex-shrink-0" />}
                <span className="truncate">{d.name}</span>
                {d.engaged && <span className="ml-auto text-[10px] text-rose-300">缠着她</span>}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="淫纹 · 烙印 · 状态">
        {tags.length === 0 ? <p className="text-[11px] text-muted-foreground/60">身上还干净。</p> : (
          <div className="flex flex-wrap gap-1" data-testid="buff-tags">
            {tags.map((t) => (
              <span key={`${t.tone}-${t.label}`} title={t.detail} className={cn('cursor-help rounded-full border px-2 py-0.5 text-[11px]',
                t.tone === 'crest' ? 'border-fuchsia-400/50 bg-fuchsia-500/15 text-fuchsia-200' : t.tone === 'brand' ? 'border-rose-400/40 bg-rose-500/10 text-rose-200' : 'border-yellow-500/40 bg-yellow-500/10 text-yellow-200')}>{t.label}</span>
            ))}
          </div>
        )}
      </Section>

      <Section title="开发度">
        <div className="grid grid-cols-5 gap-1" data-testid="development-grid">
          {BODY_PARTS.map(({ key, label }) => {
            const lv = c.bodyDevelopment?.[key] ?? 0
            return (
              <div key={key} title={c.bodyDevelopment?.descriptions?.[key] ?? `${label} Lv${lv}`} className={cn('rounded-md border px-1 py-1 text-center', lv >= 4 ? 'border-pink-400/60 bg-pink-600/30' : lv >= 2 ? 'border-pink-500/40 bg-pink-900/30' : 'border-border bg-secondary/40')}>
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className="text-sm font-bold tabular-nums">{lv}</p>
              </div>
            )
          })}
        </div>
      </Section>

      <Section title="最近变化">
        {log.length === 0 ? <p className="text-[11px] text-muted-foreground/60">下一回合开始记录。</p> : (
          <ul className="space-y-0.5 text-[11px]" data-testid="change-log">
            {log.map((line, i) => <li key={`${i}-${line}`} className={cn('tabular-nums', i === 0 ? 'text-foreground' : 'text-muted-foreground')}>{line}</li>)}
          </ul>
        )}
      </Section>
    </div>
  )
}

/** 手机：一行（头像 + 三条细条），点开从底部弹出完整面板 */
export function MobileStatusBar({ character, onOpen }: { character: Character; onOpen: () => void }) {
  const c = character
  const bars: [number, number, string][] = [[c.hp ?? 0, c.maxHp ?? 100, 'bg-red-500'], [c.pleasure ?? 0, 100, 'bg-pink-500'], [c.desire ?? 0, 100, 'bg-orange-500']]
  return (
    <button type="button" onClick={onOpen} data-testid="mobile-status" className="w-full flex items-center gap-2.5 px-3 py-2 border-b border-border bg-card/60 text-left">
      <StatePortrait character={c} variant="avatar" className="w-8 h-8 rounded-md border border-border flex-shrink-0" />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-bold gold-text truncate">{c.name}</span>
          <span className="tabular-nums text-muted-foreground">生命 {c.hp} · 快感 {c.pleasure} · 欲望 {c.desire ?? 0}</span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {bars.map(([v, max, tone], i) => (
            <div key={i} className="h-1 rounded-full bg-secondary overflow-hidden"><div className={cn('h-full', tone, i === 1 && v >= CLIMAX_AT - 10 && 'animate-pulse')} style={{ width: `${Math.min(100, (v / Math.max(1, max)) * 100)}%` }} /></div>
          ))}
        </div>
      </div>
      {c.partner && (
        <div className="flex items-center gap-1 flex-shrink-0" data-testid="mobile-partner">
          <StatePortrait character={c.partner} variant="avatar" className="w-7 h-7 rounded-md border border-border opacity-80" />
          <span className="text-[10px] tabular-nums text-muted-foreground leading-tight">{c.partner.name.slice(0, 4)}<br />快感 {c.partner.pleasure ?? 0}</span>
        </div>
      )}
      <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </button>
  )
}
