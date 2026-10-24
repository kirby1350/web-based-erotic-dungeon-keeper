'use client'

import ReactMarkdown, { type Components } from 'react-markdown'
import remarkBreaks from 'remark-breaks'

/** 角色回复的安全 Markdown：不渲染原始 HTML（react-markdown 默认跳过），链接/图片不展开成可点击或外链加载。 */
const components: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  em: ({ children }) => <em className="italic text-foreground/80">{children}</em>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  ul: ({ children }) => <ul className="list-disc pl-5 mb-2">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 mb-2">{children}</ol>,
  h1: ({ children }) => <p className="font-semibold mb-2">{children}</p>,
  h2: ({ children }) => <p className="font-semibold mb-2">{children}</p>,
  h3: ({ children }) => <p className="font-semibold mb-2">{children}</p>,
  blockquote: ({ children }) => <blockquote className="border-l-2 border-primary/40 pl-3 text-foreground/80 mb-2">{children}</blockquote>,
  code: ({ children }) => <code className="rounded bg-muted px-1 text-[0.9em]">{children}</code>,
  pre: ({ children }) => <pre className="whitespace-pre-wrap break-words mb-2">{children}</pre>,
  a: ({ children }) => <span className="underline">{children}</span>,
  img: ({ alt }) => <span>{alt}</span>,
  hr: () => <hr className="my-2 border-border" />,
}

export function ReplyMarkdown({ text }: { text: string }) {
  return (
    <div className="text-foreground break-words [overflow-wrap:anywhere]">
      <ReactMarkdown skipHtml remarkPlugins={[remarkBreaks]} components={components}>{text}</ReactMarkdown>
    </div>
  )
}
