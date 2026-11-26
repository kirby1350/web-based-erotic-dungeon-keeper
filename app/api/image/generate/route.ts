import { NextRequest, NextResponse } from 'next/server'
import { IMAGE_NEGATIVE_PROMPT } from '@/lib/prompts'

const PIXAI_V1_ENDPOINT = 'https://api.pixai.art/v1/task'
const PIXAI_V2_ENDPOINT = 'https://api.pixai.art/v2/image/create'
const TSUBAKI_V3_VERSION_ID = '2024383379556065549'
const DEFAULT_PIXAI_MODEL_ID = TSUBAKI_V3_VERSION_ID
const DEFAULT_IMAGE_WIDTH = 768
const DEFAULT_IMAGE_HEIGHT = 1024
const DEFAULT_BATCH_SIZE = 1

export async function POST(req: NextRequest) {
  const { prompts, negativePrompts, modelId, width, height, batchSize, aspectRatio, contextImages, apiKey } = await req.json()

  const key = apiKey || process.env.PIXAI_API_KEY

  if (!key) {
    return NextResponse.json({ error: '未配置 PixAI API Key' }, { status: 401 })
  }

  const chosenModel = modelId || DEFAULT_PIXAI_MODEL_ID
  const useV2 = chosenModel === TSUBAKI_V3_VERSION_ID

  try {
    const response = useV2
      ? await fetch(PIXAI_V2_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            modelVersionId: chosenModel,
            prompt: prompts,
            negativePrompt: negativePrompts || IMAGE_NEGATIVE_PROMPT,
            aspectRatio: aspectRatio || '2:3',
            ...(Array.isArray(contextImages) && contextImages.length > 0 ? { contextImages } : {}),
          }),
        })
      : await fetch(PIXAI_V1_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            parameters: {
              prompts,
              negativePrompts: negativePrompts || IMAGE_NEGATIVE_PROMPT,
              modelId: chosenModel,
              width: width || DEFAULT_IMAGE_WIDTH,
              height: height || DEFAULT_IMAGE_HEIGHT,
              batchSize: batchSize || DEFAULT_BATCH_SIZE,
            },
          }),
        })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: `PixAI 错误: ${err}` }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json({ ...data, apiVersion: useV2 ? 'v2' : 'v1' })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
