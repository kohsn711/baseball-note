import { ImageResponse } from 'next/og'
import { PwaIconArt } from '@/lib/pwa-icon'

export const contentType = 'image/png'

export function generateImageMetadata() {
  return [
    {
      id: '192',
      size: { width: 192, height: 192 },
      contentType,
    },
    {
      id: '512',
      size: { width: 512, height: 512 },
      contentType,
    },
  ]
}

const sizeMap = {
  '192': 192,
  '512': 512,
} as const

export default async function Icon({
  id,
}: {
  id: Promise<string | number>
}) {
  const iconId = String(await id)
  const iconSize = sizeMap[iconId as keyof typeof sizeMap] ?? 512

  return new ImageResponse(
    <PwaIconArt size={iconSize} cornerRadius={iconSize * 0.22} />,
    {
      width: iconSize,
      height: iconSize,
    }
  )
}
