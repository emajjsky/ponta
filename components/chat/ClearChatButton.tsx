'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface ClearChatButtonProps {
  userAgentId: string
  agentName: string
}

export function ClearChatButton({ userAgentId, agentName }: ClearChatButtonProps) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const handleClear = async () => {
    setLoading(true)

    try {
      const res = await fetch('/api/chat/history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAgentId }),
      })

      const data = await res.json()

      if (data.success) {
        toast.success('对话历史已清空')
        setOpen(false)
        // 刷新页面以重新加载对话
        window.location.reload()
      } else {
        toast.error(data.error || '清空失败')
      }
    } catch (error) {
      console.error('清空对话失败:', error)
      toast.error('清空失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-600">
          <Trash2 className="w-4 h-4 mr-2" />
          清空对话
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>清空对话历史</AlertDialogTitle>
          <AlertDialogDescription>
            确定要清空与「{agentName}」的所有对话历史吗？此操作不可恢复。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handleClear} disabled={loading}>
            {loading ? '清空中...' : '确认清空'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
