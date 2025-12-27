import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  label?: string
  placeholder?: string
}

export function ImageUpload({
  value,
  onChange,
  label = '图片',
  placeholder = '上传图片或输入图片URL',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('不支持的文件类型，仅支持 JPG、PNG、GIF、WebP')
      return
    }

    // 验证文件大小
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast.error('文件大小不能超过5MB')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (data.success) {
        onChange(data.url)
        toast.success('图片上传成功！')
      } else {
        toast.error(data.error || '上传失败')
      }
    } catch (error) {
      console.error('上传错误:', error)
      toast.error('上传失败，请稍后重试')
    } finally {
      setUploading(false)
      // 重置文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  const handleRemove = () => {
    onChange('')
  }

  return (
    <div className="space-y-3">
      {/* 图片预览 */}
      {value && (
        <div className="relative w-full">
          <img
            src={value}
            alt={`${label}预览`}
            className="w-full h-48 object-cover rounded-lg border"
            onError={() => {
              toast.error('图片加载失败，请检查URL是否正确')
            }}
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="w-4 h-4 mr-1" />
            删除
          </Button>
        </div>
      )}

      {/* 上传按钮 */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? '上传中...' : '上传图片'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* 或输入URL */}
      <div className="text-center text-sm text-muted-foreground">或</div>

      <div className="relative">
        <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          value={value}
          onChange={handleUrlChange}
          placeholder={placeholder}
          className="pl-10"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        支持上传 JPG、PNG、GIF、WebP 格式，最大5MB
      </p>
    </div>
  )
}
