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
      <DossierSection title="体态与外貌" text={person.appearance} />
      <DossierSection title="闯入动机" text={person.backstory} />
      <DossierSection title="表里性格" text={person.personality} />
      <DossierSection title="言谈口癖" text={person.speech} />
      <DossierSection title="初始装束" text={person.costumeDescription} />
      <DossierSection title="敏感死穴与发情癖好" text={person.sexual} />
      <DossierSection title="防线与抵抗方式" text={person.otherDescription} />
      {hideCollapse
        ? <DossierSection title="破防崩溃台词" text="尚未攻陷此猎物，破防后的失态台词暂未解锁。" />
        : <DossierSection title="破防崩溃台词" text={person.collapseLine} />}
    </div>
  )
}
