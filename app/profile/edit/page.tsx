'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Upload, X } from 'lucide-react'
import Link from 'next/link'
import { chinaRegions, ProvinceData, CityData, DistrictData } from '@/lib/data/china-regions'

export default function EditProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [provinces] = useState(chinaRegions)
  const [cities, setCities] = useState<CityData[]>([])
  const [districts, setDistricts] = useState<DistrictData[]>([])
  const [selectedProvince, setSelectedProvince] = useState<string>('')
  const [selectedCity, setSelectedCity] = useState<string>('')
  const [selectedDistrict, setSelectedDistrict] = useState<string>('')

  const [formData, setFormData] = useState({
    nickname: '',
    bio: '',
    avatar: '',
    province: '',
    city: '',
    district: '',
  })

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch('/api/user/profile')
        const data = await response.json()

        if (data.success) {
          const user = data.user
          setFormData({
            nickname: user.nickname || '',
            bio: user.bio || '',
            avatar: user.avatar || '',
            province: user.province || '',
            city: user.city || '',
            district: user.district || '',
          })

          if (user.province) {
            const province = provinces.find(p => p.name === user.province)
            if (province) {
              setSelectedProvince(user.province)
              setCities(province.children || [])

              if (user.city && province.children) {
                const city = province.children.find(c => c.name === user.city)
                if (city) {
                  setSelectedCity(user.city)
                  setDistricts(city.children || [])

                  if (user.district) {
                    setSelectedDistrict(user.district)
                  }
                }
              }
            }
          }
        } else {
          toast.error('获取用户资料失败')
          router.push('/profile')
        }
      } catch (error) {
        console.error('获取用户资料错误:', error)
        toast.error('网络错误，请稍后重试')
        router.push('/profile')
      } finally {
        setFetching(false)
      }
    }

    fetchProfile()
  }, [router, provinces])

  const handleProvinceChange = (provinceName: string) => {
    setSelectedProvince(provinceName)
    setSelectedCity('')
    setSelectedDistrict('')
    setCities([])
    setDistricts([])

    const province = provinces.find(p => p.name === provinceName)
    if (province) {
      setCities(province.children || [])
      setFormData(prev => ({
        ...prev,
        province: provinceName,
        city: '',
        district: '',
      }))
    }
  }

  const handleCityChange = (cityName: string) => {
    setSelectedCity(cityName)
    setSelectedDistrict('')
    setDistricts([])

    const city = cities.find(c => c.name === cityName)
    if (city) {
      setDistricts(city.children || [])
      setFormData(prev => ({
        ...prev,
        city: cityName,
        district: '',
      }))
    }
  }

  const handleDistrictChange = (districtName: string) => {
    setSelectedDistrict(districtName)
    setFormData(prev => ({
      ...prev,
      district: districtName,
    }))
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('不支持的文件类型，仅支持 JPG、PNG、GIF、WebP')
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('文件大小不能超过5MB')
      return
    }

    setUploadingAvatar(true)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const response = await fetch('/api/user/upload-avatar', {
        method: 'POST',
        body: uploadFormData,
      })

      const data = await response.json()

      if (data.success) {
        setFormData(prev => ({
          ...prev,
          avatar: data.url,
        }))
        toast.success('头像上传成功')
      } else {
        toast.error(data.error || '上传失败')
      }
    } catch (error) {
      console.error('上传头像错误:', error)
      toast.error('网络错误，请稍后重试')
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveAvatar = () => {
    setFormData(prev => ({
      ...prev,
      avatar: '',
    }))
    toast.success('头像已移除')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.nickname.length < 2 || formData.nickname.length > 20) {
      toast.error('昵称长度必须在2-20个字符之间')
      return
    }

    if (formData.bio.length > 200) {
      toast.error('个人简介不能超过200个字符')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('资料更新成功')
        router.push('/profile')
      } else {
        toast.error(data.error || '更新失败')
      }
    } catch (error) {
      console.error('更新用户资料错误:', error)
      toast.error('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pop-pink/10 via-pop-yellow/10 to-pop-blue/10 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pop-pink" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pop-pink/10 via-pop-yellow/10 to-pop-blue/10">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/profile">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回个人中心
              </Link>
            </Button>
          </div>

          <Card className="border-2 border-pop-yellow/30 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl bg-gradient-to-r from-pop-pink to-pop-orange bg-clip-text text-transparent">
                编辑个人资料
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="avatar">头像</Label>
                  <div className="flex items-start gap-4">
                    <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-pop-yellow/30 bg-gray-100 flex items-center justify-center">
                      {formData.avatar ? (
                        <img
                          src={formData.avatar}
                          alt="头像预览"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-400 text-4xl">👤</span>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingAvatar}
                        >
                          {uploadingAvatar ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              上传中...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              选择图片
                            </>
                          )}
                        </Button>

                        {formData.avatar && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveAvatar}
                            disabled={loading}
                          >
                            <X className="w-4 h-4 mr-2" />
                            移除
                          </Button>
                        )}
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />

                      <p className="text-xs text-muted-foreground">
                        支持 JPG、PNG、GIF、WebP 格式，最大5MB
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nickname">
                    昵称 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nickname"
                    name="nickname"
                    value={formData.nickname}
                    onChange={handleChange}
                    placeholder="请输入昵称"
                    required
                    minLength={2}
                    maxLength={20}
                  />
                  <p className="text-xs text-muted-foreground">
                    2-20个字符，支持中英文、数字、下划线
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">个人简介</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="介绍一下自己..."
                    rows={4}
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground">
                    最多200个字符
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>所在地区</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={selectedProvince}
                      onChange={(e) => handleProvinceChange(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">省份</option>
                      {provinces.map((province) => (
                        <option key={province.code} value={province.name}>
                          {province.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={selectedCity}
                      onChange={(e) => handleCityChange(e.target.value)}
                      disabled={!selectedProvince}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                    >
                      <option value="">城市</option>
                      {cities.map((city) => (
                        <option key={city.code} value={city.name}>
                          {city.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={selectedDistrict}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      disabled={!selectedCity}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                    >
                      <option value="">区县</option>
                      {districts.map((district) => (
                        <option key={district.code} value={district.name}>
                          {district.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    选择你所在的省市区（可选）
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/profile')}
                    disabled={loading}
                  >
                    取消
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-pop-pink to-pop-orange hover:opacity-90"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        保存中...
                      </>
                    ) : (
                      '保存修改'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
