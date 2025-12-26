'use client'

import { useEffect, useState } from 'react'
import { SeriesCard } from './SeriesCard'
import type { Series } from './SeriesCard'

interface SeriesListProps {
  initialSeries: Series[]
}

export function SeriesList({ initialSeries }: SeriesListProps) {
  const [series, setSeries] = useState<Series[]>(initialSeries)
  const [loading, setLoading] = useState(false)

  // 客户端数据同步（可选）
  useEffect(() => {
    setSeries(initialSeries)
  }, [initialSeries])

  if (series.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-xl font-semibold mb-2">暂无系列盲盒</h3>
        <p className="text-muted-foreground">
          敬请期待更多精彩系列...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 系列网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {series.map((s) => (
          <SeriesCard key={s.id} series={s} />
        ))}
      </div>
    </div>
  )
}
