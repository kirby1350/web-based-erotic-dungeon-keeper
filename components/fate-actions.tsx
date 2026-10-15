'use client'

import { useState } from 'react'
import type { Character } from '@/lib/types'
import { FATE_LABEL, fateGate, type IntruderFate } from '@/lib/keeper'

const FATES: IntruderFate[] = ['kept', 'broken', 'defeated']

export function FateActions({ character, disabled, onSettle }: { character: Character; disabled?: boolean; onSettle: (fate: IntruderFate) => void }) {
  const [armed, setArmed] = useState<IntruderFate | null>(null)
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-1.5">
        {FATES.map((fate) => {
          const gate = fateGate(character, fate)
          const ready = gate.ok && !disabled
          return (
            <button
              key={fate}
              type="button"
              disabled={!ready}
              title={gate.ok ? FATE_LABEL[fate] : gate.reason}
              onClick={() => {
                if (armed === fate) {
                  setArmed(null)
                  onSettle(fate)
                } else {
                  setArmed(fate)
                }
              }}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold disabled:opacity-40 ${
                fate === 'kept' ? 'border-amber-400/40 text-amber-100 bg-amber-500/10' :
                fate === 'broken' ? 'border-pink-400/40 text-pink-100 bg-pink-500/10' :
                'border-border text-muted-foreground bg-secondary'
              } ${armed === fate ? 'ring-1 ring-primary' : ''}`}
            >
              {armed === fate ? `确认${FATE_LABEL[fate]}` : FATE_LABEL[fate]}
            </button>
          )
        })}
      </div>
      {FATES.map((fate) => {
        const gate = fateGate(character, fate)
        return gate.ok ? null : <p key={fate} className="text-[10px] text-muted-foreground leading-relaxed">{FATE_LABEL[fate]}：{gate.reason}</p>
      })}
    </div>
  )
}
