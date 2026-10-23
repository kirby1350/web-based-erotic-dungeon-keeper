export interface DossierPerson {
  appearance?: string
  backstory?: string
  personality?: string
  speech?: string
  costumeDescription?: string
  sexual?: string
  otherDescription?: string
  collapseLine?: string
}

export function DossierSection({ title, text }: { title: string; text?: string }) {
  if (!text?.trim()) return null
  return (
    <section>
      <h2 className="text-[11px] tracking-widest text-muted-foreground mb-1">{title}</h2>
      <p className="text-sm leading-relaxed whitespace-pre-line">{text}</p>
    </section>
  )
}

export function IntruderDossier({ person, hideCollapse = false }: { person: DossierPerson; hideCollapse?: boolean }) {
  return (
    <div className="space-y-4">
      <DossierSection title="外貌" text={person.appearance} />
      <DossierSection title="她为什么进来" text={person.backstory} />
      <DossierSection title="性格" text={person.personality} />
      <DossierSection title="口癖" text={person.speech} />
      <DossierSection title="现在这身" text={person.costumeDescription} />
      <DossierSection title="色色设定" text={person.sexual} />
      <DossierSection title="开场她怎么抵抗" text={person.otherDescription} />
      {hideCollapse
        ? <DossierSection title="崩溃之后才会说的话" text="她还没进过这座狱，这句话先折着。" />
        : <DossierSection title="崩溃之后才会说的话" text={person.collapseLine} />}
    </div>
  )
}
