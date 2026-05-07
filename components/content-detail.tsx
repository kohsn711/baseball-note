import Image from 'next/image'
import {
  type ContentDetail,
  formatPublishedDate,
  toYouTubeEmbedUrl,
} from '@/lib/contents'

type Props = {
  content: ContentDetail
}

export const ContentDetailView = ({ content }: Props) => {
  const embedUrl = content.externalVideoUrl
    ? toYouTubeEmbedUrl(content.externalVideoUrl)
    : null

  return (
    <article className="space-y-4">
      <header className="space-y-2">
        {content.category && (
          <p className="text-xs font-medium text-slate-500">{content.category}</p>
        )}
        <h1 className="text-xl font-bold text-slate-900">{content.title}</h1>
        {content.publishedAt && (
          <p className="text-xs text-slate-400">
            {formatPublishedDate(content.publishedAt)} 公開
          </p>
        )}
      </header>

      {content.thumbnailUrl && (
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-100">
          <Image
            src={content.thumbnailUrl}
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
        </div>
      )}

      {embedUrl ? (
        <div className="aspect-video overflow-hidden rounded-2xl bg-black">
          <iframe
            src={embedUrl}
            title={content.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      ) : content.externalVideoUrl ? (
        <a
          href={content.externalVideoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
        >
          🎬 動画を見る（外部サイト）
        </a>
      ) : null}

      <div className="whitespace-pre-wrap rounded-2xl bg-white px-4 py-4 text-sm leading-relaxed text-slate-800 shadow-sm">
        {content.body}
      </div>
    </article>
  )
}
