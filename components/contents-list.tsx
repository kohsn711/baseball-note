import Link from 'next/link'
import Image from 'next/image'
import {
  type ContentListItem,
  formatPublishedDate,
} from '@/lib/contents'

type Props = {
  basePath: string
  items: ContentListItem[]
  categories: string[]
  selectedCategory: string | null
}

export const ContentsList = ({
  basePath,
  items,
  categories,
  selectedCategory,
}: Props) => {
  return (
    <div className="space-y-4">
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <CategoryChip
            href={basePath}
            label="すべて"
            active={!selectedCategory}
          />
          {categories.map((c) => (
            <CategoryChip
              key={c}
              href={`${basePath}?category=${encodeURIComponent(c)}`}
              label={c}
              active={selectedCategory === c}
            />
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <p className="rounded-2xl bg-white px-4 py-6 text-center text-sm text-slate-500 shadow-sm">
          まだ記事がありません。
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`${basePath}/${item.id}`}
                className="flex gap-3 overflow-hidden rounded-2xl bg-white p-3 shadow-sm hover:bg-slate-50"
              >
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {item.thumbnailUrl ? (
                    <Image
                      src={item.thumbnailUrl}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl text-slate-300">
                      📰
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {item.category && (
                    <p className="text-[11px] font-medium text-slate-500">
                      {item.category}
                    </p>
                  )}
                  <p className="mt-0.5 line-clamp-2 text-sm font-semibold text-slate-900">
                    {item.title}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {formatPublishedDate(item.publishedAt)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const CategoryChip = ({
  href,
  label,
  active,
}: {
  href: string
  label: string
  active: boolean
}) => (
  <Link
    href={href}
    className={`rounded-full px-3 py-1 text-xs ${
      active
        ? 'bg-slate-900 text-white'
        : 'border border-slate-300 bg-white text-slate-700'
    }`}
  >
    {label}
  </Link>
)
