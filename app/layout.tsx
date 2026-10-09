import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import '@fontsource-variable/cinzel'
import '@fontsource-variable/noto-serif-sc'
import './globals.css'

export const metadata: Metadata = {
  title: '地下城城主',
  description: '扮演地下城的管理者，用陷阱和魔物对付闯入的冒险者',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
