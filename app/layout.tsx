import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import '@fontsource-variable/cinzel'
import '@fontsource-variable/noto-serif-sc'
import './globals.css'
import { Toaster } from 'sonner'

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
      <body className="font-sans antialiased bg-black">
        {/* 暗色窄栏：手机 <768 窄栏；平板放宽；桌面 ≥1024 用满宽度 */}
        <div className="app-column relative mx-auto min-h-screen w-full max-w-[480px] md:max-w-3xl lg:max-w-none overflow-x-hidden border-x lg:border-x-0 lg:shadow-none border-border/60 bg-background shadow-[0_0_60px_rgba(0,0,0,0.8)]">
          {children}
        </div>
        <Toaster theme="dark" position="top-center" richColors />
        <Analytics />
      </body>
    </html>
  )
}
