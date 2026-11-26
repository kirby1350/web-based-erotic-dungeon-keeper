'use client'

import { Children, isValidElement, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkBreaks from 'remark-breaks'

const DIALOGUE_RE = /(「[^」]+」|“[^”]+”)/g

function tintDialogue(nodes: ReactNode): ReactNode {
  return Children.map(nodes, (child, idx) => {
    if (typeof child === 'string') {
      const parts = child.split(DIALOGUE_RE)
      if (parts.length === 1) return child
      return parts.map((part, pIdx) => {
        if (!part) return null
        const isQuote = (part.startsWith('「') && part.endsWith('」')) || (part.startsWith('“') && part.endsWith('”'))
        return isQuote ? (
          <span key={`q-${idx}-${pIdx}`} className="text-pink-100 font-medium drop-shadow-[0_0_8px_rgba(244,114,182,0.18)]">
            {part}
          </span>
        ) : (
          part
        )
      })
    }
    if (isValidElement<{ children?: ReactNode }>(child) && child.props.children && child.type !== 'code' && child.type !== 'pre') {
      return { ...child, props: { ...child.props, children: tintDialogue(child.props.children) } }
    }
    return child
  })
}

/** 角色回复的安全 Markdown：不渲染原始 HTML，并对引号内的角色台词与娇喘作细腻高光着色。 */
const components: Components = {
  p: ({ children }) => <p className="mb-3 last:mb-0 leading-[1.82] text-foreground/92">{tintDialogue(children)}</p>,
  em: ({ children }) => <em className="italic text-amber-100/85">{children}</em>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  ul: ({ children }) => <ul className="list-disc pl-5 mb-2.5 space-y-1">{tintDialogue(children)}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 mb-2.5 space-y-1">{tintDialogue(children)}</ol>,
  h1: ({ children }) => <p className="font-semibold mb-2 gold-text">{children}</p>,
  h2: ({ children }) => <p className="font-semibold mb-2 gold-text">{children}</p>,
  h3: ({ children }) => <p className="font-semibold mb-2 gold-text">{children}</p>,
  blockquote: ({ children }) => <blockquote className="border-l-2 border-primary/50 pl-3 text-foreground/85 mb-2.5 italic">{tintDialogue(children)}</blockquote>,
  code: ({ children }) => <code className="rounded bg-muted px-1 text-[0.9em]">{children}</code>,
  pre: ({ children }) => <pre className="whitespace-pre-wrap break-words mb-2">{children}</pre>,
  a: ({ children }) => <span className="underline">{children}</span>,
  img: ({ alt }) => <span>{alt}</span>,
  hr: () => <hr className="my-3 border-border/70" />,
}

export function ReplyMarkdown({ text }: { text: string }) {
  return (
    <div className="text-foreground break-words [overflow-wrap:anywhere]">
      <ReactMarkdown skipHtml remarkPlugins={[remarkBreaks]} components={components}>{text}</ReactMarkdown>
    </div>
  )
}
