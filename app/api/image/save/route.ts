import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { resolveCloudConfig, uploadToS3Compatible, type CloudStorageConfig } from '@/lib/s3-upload'
import type { ArchivedSceneImage } from '@/lib/scene-gallery'

const SCENES_ROOT = path.join(process.cwd(), 'public', 'generated-scenes')
const MANIFEST_PATH = path.join(SCENES_ROOT, 'manifest.json')

function sanitizeSlug(raw: string): string {
  const cleaned = (raw || 'scene').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)
  return cleaned || 'scene'
}

function readManifest(): ArchivedSceneImage[] {
  try {
    if (!fs.existsSync(MANIFEST_PATH)) return []
    const parsed = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeManifest(entries: ArchivedSceneImage[]): void {
  fs.mkdirSync(SCENES_ROOT, { recursive: true })
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(entries.slice(0, 300), null, 2) + '\n')
}

function detectExtension(contentType: string, buf: Buffer): { ext: string; mime: string } {
  if (contentType.includes('webp') || (buf.length > 12 && buf.subarray(8, 12).toString('ascii') === 'WEBP')) {
    return { ext: 'webp', mime: 'image/webp' }
  }
  if (contentType.includes('jpeg') || contentType.includes('jpg') || (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8)) {
    return { ext: 'jpg', mime: 'image/jpeg' }
  }
  return { ext: 'png', mime: 'image/png' }
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  const characterName = req.nextUrl.searchParams.get('character')
  const cloudConfigured = Boolean(resolveCloudConfig())
  const manifest = readManifest()
  const items = manifest.filter((item) => {
    if (characterName && item.characterName === characterName) return true
    if (slug && item.slug === sanitizeSlug(slug)) return true
    return !slug && !characterName
  })
  return NextResponse.json({ items: items.slice(0, 24), cloudConfigured })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const urls: string[] = Array.isArray(body?.urls) ? body.urls.filter((u: unknown): u is string => typeof u === 'string' && /^https?:\/\//i.test(u)) : []
    const prompt = typeof body?.prompt === 'string' ? body.prompt.slice(0, 1000) : ''
    const characterName = typeof body?.characterName === 'string' ? body.characterName.slice(0, 48) : '未知'
    const slug = sanitizeSlug(typeof body?.slug === 'string' ? body.slug : characterName)
    const cloudOverride = body?.cloudConfig as Partial<CloudStorageConfig> | undefined

    if (urls.length === 0) {
      return NextResponse.json({ error: '没有可归档的图片链接' }, { status: 400 })
    }

    const cloudCfg = resolveCloudConfig(cloudOverride)
    const saved: ArchivedSceneImage[] = []
    const warnings: string[] = []
    const ts = Date.now()

    for (let i = 0; i < urls.length; i++) {
      const remoteUrl = urls[i]
      const id = `${ts}-${i}-${crypto.randomBytes(3).toString('hex')}`
      try {
        const res = await fetch(remoteUrl)
        if (!res.ok) throw new Error(`拉取原图失败 (${res.status})`)
        const buf = Buffer.from(await res.arrayBuffer())
        const { ext, mime } = detectExtension(res.headers.get('content-type') || '', buf)
        const fileName = `${id}.${ext}`
        const subDir = path.join(SCENES_ROOT, slug)
        fs.mkdirSync(subDir, { recursive: true })
        fs.writeFileSync(path.join(subDir, fileName), buf)
        const localUrl = `/generated-scenes/${slug}/${fileName}`

        let cloudUrl: string | undefined
        if (cloudCfg) {
          try {
            cloudUrl = await uploadToS3Compatible(cloudCfg, `dungeon-keeper/scenes/${slug}/${fileName}`, buf, mime)
          } catch (cloudErr) {
            warnings.push(cloudErr instanceof Error ? cloudErr.message : String(cloudErr))
          }
        }

        saved.push({
          id,
          url: cloudUrl || localUrl,
          localUrl,
          ...(cloudUrl ? { cloudUrl } : {}),
          storage: cloudUrl ? 'cloud' : 'local',
          prompt,
          timestamp: ts + i,
          characterName,
          slug,
        })
      } catch (err) {
        warnings.push(err instanceof Error ? err.message : String(err))
        saved.push({
          id,
          url: remoteUrl,
          storage: 'remote',
          prompt,
          timestamp: ts + i,
          characterName,
          slug,
        })
      }
    }

    const prev = readManifest()
    const existingIds = new Set(saved.map((s) => s.id))
    writeManifest([...saved, ...prev.filter((p) => !existingIds.has(p.id))])

    return NextResponse.json({
      saved,
      cloudConfigured: Boolean(cloudCfg),
      warnings,
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
