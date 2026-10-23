'use client'

import { ENDINGS, RAID_INFAMY, RAID_PARTY, THREAT_TIERS, continueEndless, emptyCampaign, threatTier, type Campaign } from '@/lib/campaign'
import { FATE_LABEL } from '@/lib/keeper'

export function CampaignCard({ campaign }: { campaign?: Campaign }) {
  const c = campaign ?? emptyCampaign()
  const tier = threatTier(c.infamy)
  const pct = Math.min(100, Math.round((c.infamy / RAID_INFAMY) * 100))
  return (
    <section className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 space-y-2" data-testid="campaign-card">
      <div className="flex items-baseline justify-between">
        <p className="text-[11px] tracking-widest text-rose-200">恶名 · {THREAT_TIERS[tier].label}</p>
        <p className="text-sm font-bold tabular-nums text-rose-100">{c.infamy}{c.endless ? '' : ` / ${RAID_INFAMY}`}</p>
      </div>
      {!c.endless && <div className="h-1.5 rounded-full bg-secondary overflow-hidden"><div className="h-full bg-rose-500" style={{ width: `${pct}%` }} /></div>}
      <p className="text-xs text-muted-foreground">{THREAT_TIERS[tier].note}{tier > 0 ? ` 闯入者生命 +${tier * 15}%。` : ''}</p>
      {c.raid && (
        <div className="rounded-lg border border-amber-400/50 bg-amber-500/10 p-2 text-xs text-amber-100">
          <p className="font-bold">勇者讨伐队来袭</p>
          <p className="mt-1">接下来的闯入者都是讨伐队成员。全部留下或玩坏即胜利；放走任何一人，地下城就会陷落。</p>
          <p className="mt-1">{RAID_PARTY.map((m) => `${m.name}：${c.raidFates[m.name] ? FATE_LABEL[c.raidFates[m.name]] : '未到'}`).join(' · ')}</p>
        </div>
      )}
    </section>
  )
}

export function EndingOverlay({ campaign, onRestart, onContinue }: { campaign: Campaign; onRestart: () => void; onContinue: (next: Campaign) => void }) {
  if (campaign.status === 'ongoing') return null
  const ending = ENDINGS[campaign.status]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" data-testid="ending">
      <div className="w-full max-w-md rounded-xl border border-primary/40 bg-card p-5 space-y-3">
        <p className="text-[11px] tracking-widest text-primary">{campaign.status === 'victory' ? '胜利结局' : '失败结局'}</p>
        <h2 className="text-2xl font-bold gold-text">{ending.title}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{ending.text}</p>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onRestart} className="px-3 py-1.5 rounded-lg border border-border text-xs">重建一座新狱</button>
          <button type="button" onClick={() => onContinue(continueEndless(campaign))} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold">
            {campaign.status === 'victory' ? '继续无尽经营' : '不认输，继续经营'}
          </button>
        </div>
      </div>
    </div>
  )
}
