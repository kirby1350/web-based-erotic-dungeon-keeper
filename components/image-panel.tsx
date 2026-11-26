'use client'

import { useState, useCallback, useEffect } from 'react'
import { Image as ImageIcon, Loader2, RefreshCw, Wand2, ChevronDown, ChevronUp, Cloud, HardDrive, Download, Maximize2, X } from 'lucide-react'
import { AppSettings, IMAGE_MODELS, IMAGE_STYLES, TENSORART_MODELS, Character, type ImagePromptFamily } from '@/lib/types'
import { getKeep, getSession } from '@/lib/storage'
import { keeperPromptContext, sceneChrome } from '@/lib/keeper'
import { buildImagePrompt, DEFAULT_SCENE_PROMPT, presetTagsFor, resolveImagePromptFamily } from '@/lib/prompts'
import { dzmmReady, dzmmDraw } from '@/lib/dzmm'
import { getLocalSceneImages, mergeSceneImages, saveLocalSceneImages, sceneSlugFor, type ArchivedSceneImage } from '@/lib/scene-gallery'

interface ImagePanelProps {
  settings: AppSettings
  character: Character
  pendingScene?: string
  onSceneHandled: () => void
}

export function ImagePanel({ settings, character, pendingScene, onSceneHandled }: ImagePanelProps) {
  const [images, setImages] = useState<ArchivedSceneImage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customPrompt, setCustomPrompt] = useState('')
  const [showPromptBox, setShowPromptBox] = useState(false)
  const [activeImage, setActiveImage] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState(false)
  const training = sceneChrome(keeperPromptContext(getKeep()), character.floor ?? 1).mode === 'train'

  useEffect(() => {
    let alive = true
    const slug = sceneSlugFor(character)
    const localItems = getLocalSceneImages(character.name)
    setImages(localItems)
    setActiveImage(localItems[0]?.url ?? null)
    fetch(`/api/image/save?slug=${encodeURIComponent(slug)}&character=${encodeURIComponent(character.name)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!alive || !Array.isArray(data?.items) || data.items.length === 0) return
        const merged = mergeSceneImages(data.items, getLocalSceneImages(character.name))
        saveLocalSceneImages(character.name, merged)
        setImages(merged)
        setActiveImage((cur) => cur ?? merged[0]?.url ?? null)
      })
      .catch(() => {})
    return () => { alive = false }
  }, [character.name, character.avatarUrl])

  // PixAI polling
  const pollPixai = useCallback(async (taskId: string, apiVersion: 'v1' | 'v2' = 'v1'): Promise<string[]> => {
    const key = settings.pixaiApiKey || ''
    const suffix = apiVersion === 'v2' ? '?v=2' : ''
    for (let i = 0; i < 120; i++) {
      await new Promise((r) => setTimeout(r, 1000))
      const res = await fetch(`/api/image/task/${taskId}${suffix}`, {
        headers: key ? { 'x-pixai-key': key } : {},
      })
      if (!res.ok) throw new Error(`轮询失败: ${res.status}`)
      const data = await res.json()
      const status: string = data?.status
      if (status === 'completed') {
        const urls: string[] = data?.outputs?.mediaUrls ?? []
        if (urls.length > 0) return urls
        throw new Error('图片生成完成但未返回 URL')
      }
      if (status === 'failed') throw new Error('PixAI 图片生成失败')
    }
    throw new Error('图片生成超时（120s）')
  }, [settings.pixaiApiKey])

  // TensorArt polling — status: CREATED / WAITING / RUNNING / SUCCESS / FAILED
  const pollTensorart = useCallback(async (jobId: string): Promise<string[]> => {
    const key = settings.tensorartApiKey || ''
    for (let i = 0; i < 120; i++) {
      await new Promise((r) => setTimeout(r, 1000))
      const res = await fetch(`/api/image/tensorart/${jobId}`, {
        headers: key ? { 'x-tensorart-key': key } : {},
      })
      if (!res.ok) throw new Error(`TensorArt 轮询失败: ${res.status}`)
      const data = await res.json()
      const status: string = data?.job?.status ?? ''
      if (status === 'SUCCESS') {
        const urls: string[] = data?.job?.successInfo?.images?.map((img: { url: string }) => img.url) ?? []
        if (urls.length > 0) return urls
        throw new Error('TensorArt 生成完成但未返回图片 URL')
      }
      if (status === 'FAILED') throw new Error('TensorArt 图片生成失败')
    }
    throw new Error('TensorArt 图片生成超时（120s）')
  }, [settings.tensorartApiKey])

  const generateImage = useCallback(async (prompt: string) => {
    setLoading(true)
    setError(null)
    try {
      const styleTags = (IMAGE_STYLES[settings.imageStyle] ?? IMAGE_STYLES['none']).tags
      const presetTags = presetTagsFor(settings.imageTagPreset, character)
      const customTags = settings.imageStyleCustom?.trim() ?? ''
      const provider = settings.imageProvider ?? 'pixai'
      const onPlatform = await dzmmReady()
      const family: ImagePromptFamily = onPlatform
        ? 'illustrious'
        : provider === 'tensorart'
          ? resolveImagePromptFamily(TENSORART_MODELS[settings.tensorartModel] ?? TENSORART_MODELS['wai_nsfw_v16'])
          : resolveImagePromptFamily(IMAGE_MODELS[settings.imageModel] ?? IMAGE_MODELS['tsubaki_v3'])
      // Appearance anchor stays first. Scene tags follow. Quality words depend on the backend.
      const { prompt: finalPrompt, negative } = buildImagePrompt({
        scene: prompt,
        character,
        extraTags: [presetTags, styleTags, customTags],
        family,
        memory: getSession()?.memory,
      })
      let imageUrls: string[]

      if (onPlatform) {
        // On the DZMM platform: generate via the injected SDK (no polling/keys).
        imageUrls = await dzmmDraw({
          prompt: finalPrompt,
          negativePrompt: negative,
          dimension: 'portrait',
        })
        if (imageUrls.length === 0) throw new Error('图片生成完成但未返回图片')
      } else if (provider === 'tensorart') {
        const taModel = TENSORART_MODELS[settings.tensorartModel] ?? TENSORART_MODELS['wai_nsfw_v16']
        const res = await fetch('/api/image/tensorart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompts: finalPrompt,
            negativePrompts: negative,
            modelId: taModel.modelId,
            width: 768,
            height: 1280,
            apiKey: settings.tensorartApiKey,
          }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'TensorArt 请求失败')
        }
        const data = await res.json()
        const jobId: string = data?.job?.id
        if (!jobId) throw new Error('未获取到 TensorArt Job ID')
        imageUrls = await pollTensorart(jobId)
      } else {
        const pxCfg = IMAGE_MODELS[settings.imageModel] ?? IMAGE_MODELS['tsubaki_v3']
        const modelId = pxCfg.modelId
        const res = await fetch('/api/image/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompts: finalPrompt,
            negativePrompts: negative,
            modelId,
            width: 768,
            height: 1280,
            aspectRatio: '2:3',
            batchSize: pxCfg.apiVersion === 'v2' ? 1 : 4,
            apiKey: settings.pixaiApiKey,
          }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'PixAI 请求失败')
        }
        const data = await res.json()
        const taskId: string = data?.id
        if (!taskId) throw new Error('未获取到 PixAI 任务 ID')
        imageUrls = await pollPixai(taskId, data?.apiVersion === 'v2' ? 'v2' : 'v1')
      }

      const slug = sceneSlugFor(character)
      const now = Date.now()
      let archivedBatch: ArchivedSceneImage[] = imageUrls.map((url, idx) => ({
        id: `${now}-${idx}`,
        url,
        prompt,
        timestamp: now + idx,
        characterName: character.name,
        slug,
        storage: 'remote',
      }))

      if (!onPlatform) {
        try {
          const saveRes = await fetch('/api/image/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              urls: imageUrls,
              prompt,
              characterName: character.name,
              slug,
              cloudConfig: settings.cloudEndpoint
                ? {
                    endpoint: settings.cloudEndpoint,
                    bucket: settings.cloudBucket,
                    accessKeyId: settings.cloudAccessKey,
                    secretAccessKey: settings.cloudSecretKey,
                    publicBaseUrl: settings.cloudPublicUrl,
                  }
                : undefined,
            }),
          })
          if (saveRes.ok) {
            const savedData = await saveRes.json()
            if (Array.isArray(savedData?.saved) && savedData.saved.length > 0) {
              archivedBatch = savedData.saved
            }
          }
        } catch { /* fallback to localStorage remote URLs */ }
      }

      const persisted = saveLocalSceneImages(character.name, archivedBatch)
      setImages(persisted)
      setActiveImage(archivedBatch[0]?.url ?? imageUrls[0])
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [settings, character, pollPixai, pollTensorart])

  const activeItem = images.find((img) => img.url === activeImage) ?? images[0] ?? null

  const handleAutoGenerate = useCallback(async () => {
    if (!pendingScene) return
    onSceneHandled()
    await generateImage(pendingScene)
  }, [pendingScene, onSceneHandled, generateImage])

  const handleCustomGenerate = async () => {
    const rawPrompt = customPrompt.trim() || DEFAULT_SCENE_PROMPT
    await generateImage(rawPrompt)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Main image display */}
      <div className="flex-1 relative overflow-hidden bg-dungeon-panel rounded-none">
        {lightbox && activeImage && (
          <div className="fixed inset-0 z-[70] bg-black/92 flex flex-col items-center justify-center p-4 gap-3" onClick={() => setLightbox(false)}>
            <img src={activeImage} alt="场景插图原图" onClick={(e) => e.stopPropagation()} className="max-h-[85vh] max-w-[94vw] rounded-xl border border-border object-contain shadow-2xl" />
            <div className="flex items-center gap-3 text-xs text-white/75" onClick={(e) => e.stopPropagation()}>
              <a href={activeImage} download target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-white/25 bg-white/10 hover:bg-white/20">
                <Download className="w-3.5 h-3.5" />保存原图
              </a>
              <button type="button" onClick={() => setLightbox(false)} className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-white/20 hover:text-white">
                <X className="w-3.5 h-3.5" />关闭
              </button>
            </div>
          </div>
        )}
        {activeImage ? (
          <>
            <img
              src={activeImage}
              alt="场景插图"
              onClick={() => setLightbox(true)}
              className="w-full h-full object-contain cursor-zoom-in"
            />
            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
              {activeItem?.storage === 'cloud' ? (
                <span className="pointer-events-auto inline-flex items-center gap-1 rounded-md border border-emerald-400/40 bg-black/65 px-2 py-0.5 text-[10px] text-emerald-200 backdrop-blur-sm">
                  <Cloud className="w-3 h-3" />已同步云端与本地
                </span>
              ) : activeItem?.storage === 'local' ? (
                <span className="pointer-events-auto inline-flex items-center gap-1 rounded-md border border-amber-400/35 bg-black/65 px-2 py-0.5 text-[10px] text-amber-200 backdrop-blur-sm" title="已永久保存至 public/generated-scenes/，外链过期也不丢失">
                  <HardDrive className="w-3 h-3" />已归档本地磁盘
                </span>
              ) : <span />}
              <div className="pointer-events-auto flex items-center gap-1">
                <a href={activeImage} download target="_blank" rel="noreferrer" title="下载原图" className="rounded-md border border-white/20 bg-black/60 p-1.5 text-white/80 hover:text-white backdrop-blur-sm">
                  <Download className="w-3 h-3" />
                </a>
                <button type="button" onClick={() => setLightbox(true)} title="放大查看" className="rounded-md border border-white/20 bg-black/60 p-1.5 text-white/80 hover:text-white backdrop-blur-sm">
                  <Maximize2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-center p-4">
            <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">{training ? '这一轮的画面会留在这里' : '这一层的画面会留在这里'}</p>
            <p className="text-muted-foreground/60 text-xs">{training ? '按牢笼里这一手来出图' : '按她在廊道里的这一段来出图'}</p>
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">正在绘制场景...</p>
          </div>
        )}

        {/* Auto generate prompt */}
        {pendingScene && !loading && (
          <div className="absolute bottom-3 left-3 right-3">
            <div className="bg-card/95 dungeon-border rounded-lg p-3 flex items-center gap-3">
              <Wand2 className="w-4 h-4 text-primary flex-shrink-0" />
              <p className="text-xs text-muted-foreground flex-1 truncate">新场景：{pendingScene}</p>
              <button
                onClick={handleAutoGenerate}
                className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded glow-btn flex-shrink-0"
              >
                生成插图
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="px-3 py-2 bg-destructive/20 border-t border-destructive/40">
          <p className="text-xs text-destructive-foreground">{error}</p>
        </div>
      )}

      {/* Custom prompt */}
      <div className="border-t border-border">
        <button
          onClick={() => setShowPromptBox((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Wand2 className="w-3.5 h-3.5" />
            手动生成图片
          </span>
          {showPromptBox ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        {showPromptBox && (
          <div className="px-3 pb-3 space-y-2">
            <input
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="描述要生成的场景（英文更佳）..."
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary transition-colors"
            />
            <button
              onClick={handleCustomGenerate}
              disabled={loading}
              className="w-full py-2 rounded-lg bg-primary/80 hover:bg-primary text-primary-foreground text-xs font-semibold glow-btn transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              生成场景
            </button>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="border-t border-border p-2 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveImage(img.url)}
              className={`w-12 h-12 flex-shrink-0 rounded overflow-hidden border-2 transition-all ${
                activeImage === img.url ? 'border-primary' : 'border-border hover:border-primary/50'
              }`}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
