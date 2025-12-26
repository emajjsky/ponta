'use client'

import { useState, useEffect } from 'react'
import { AgentCard, type Agent } from './AgentCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, SlidersHorizontal, Loader2 } from 'lucide-react'

interface AgentListProps {
  initialAgents?: Agent[]
}

/**
 * 智能体列表组件
 * 支持筛选、搜索、排序功能
 */
export function AgentList({ initialAgents = [] }: AgentListProps) {
  const [agents, setAgents] = useState<Agent[]>(initialAgents)
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>(initialAgents)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [rarityFilter, setRarityFilter] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<string>('created')

  /**
   * 获取智能体列表
   */
  const fetchAgents = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (rarityFilter !== 'ALL') {
        params.append('rarity', rarityFilter)
      }
      if (searchQuery) {
        params.append('search', searchQuery)
      }
      params.append('sort', sortBy)

      const response = await fetch(`/api/agents?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setAgents(result.agents)
        setFilteredAgents(result.agents)
      }
    } catch (error) {
      console.error('获取智能体列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 当筛选条件变化时重新获取数据
   */
  useEffect(() => {
    fetchAgents()
  }, [rarityFilter, sortBy])

  /**
   * 防抖搜索
   */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAgents()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  /**
   * 重置筛选条件
   */
  const resetFilters = () => {
    setSearchQuery('')
    setRarityFilter('ALL')
    setSortBy('created')
  }

  return (
    <div className="space-y-6">
      {/* 筛选和搜索栏 */}
      <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm border space-y-4">
        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="搜索智能体名称或描述..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* 筛选和排序 */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* 稀有度筛选 */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">稀有度:</span>
            <div className="flex gap-1">
              <Button
                variant={rarityFilter === 'ALL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRarityFilter('ALL')}
              >
                全部
              </Button>
              <Button
                variant={rarityFilter === 'STANDARD' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRarityFilter('STANDARD')}
              >
                标准款
              </Button>
              <Button
                variant={rarityFilter === 'HIDDEN' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRarityFilter('HIDDEN')}
              >
                隐藏款
              </Button>
            </div>
          </div>

          {/* 排序 */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground">排序:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="排序方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created">最新上架</SelectItem>
                <SelectItem value="price-asc">价格从低到高</SelectItem>
                <SelectItem value="price-desc">价格从高到低</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 重置按钮 */}
        {(searchQuery || rarityFilter !== 'ALL' || sortBy !== 'created') && (
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              重置筛选
            </Button>
          </div>
        )}
      </div>

      {/* 结果统计 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          找到 <span className="font-semibold text-foreground">{filteredAgents.length}</span> 个智能体盲盒
        </p>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">加载中...</span>
        </div>
      )}

      {/* 空状态 */}
      {!loading && filteredAgents.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎁</div>
          <h3 className="text-lg font-semibold mb-2">没有找到智能体盲盒</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || rarityFilter !== 'ALL'
              ? '试试调整筛选条件'
              : '商城暂时没有上架的智能体盲盒'}
          </p>
          {(searchQuery || rarityFilter !== 'ALL') && (
            <Button onClick={resetFilters} variant="outline">
              清除筛选条件
            </Button>
          )}
        </div>
      )}

      {/* 智能体网格 */}
      {!loading && filteredAgents.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAgents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  )
}
