"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { getCategories, getPhotosByCategory } from "@/lib/gallery-data"
import { Card } from "@/components/ui/card"
import { Camera } from "lucide-react"

// 添加自定义CSS样式
const customStyles = `
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
`

interface CategoryInfo {
  name: string
  count: number
  firstImage: string
}

export default function CategoryIndexPage() {
  const [categories, setCategories] = useState<CategoryInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // 获取第一个分类的第一张图片作为背景图
  const backgroundImage = categories.length > 0 && categories[0].firstImage
    ? categories[0].firstImage
    : "/placeholder.svg"

  useEffect(() => {
    async function loadCategories() {
      try {
        setLoading(true)
        const categoryNames = await getCategories()
        
        // 过滤掉 'All' 并获取每个分类的统计信息
        const categoryData: CategoryInfo[] = []
        
        for (const categoryName of categoryNames) {
          if (categoryName !== 'All') {
            const photos = await getPhotosByCategory(categoryName)
            if (photos.length > 0) {
              categoryData.push({
                name: categoryName,
                count: photos.length,
                firstImage: photos[0].src
              })
            }
          }
        }
        
        setCategories(categoryData.sort((a, b) => b.count - a.count))
        
        setError(null)
      } catch (err) {
        console.error('Failed to load categories:', err)
        setError(err instanceof Error ? err.message : 'Failed to load categories')
      } finally {
        setLoading(false)
      }
    }

    loadCategories()
    window.scrollTo({ top: 0, behavior: "auto" })
  }, [])

  return (
    <>
      <style jsx global>
        {customStyles}
      </style>
      <div className="min-h-screen bg-black relative">
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('${backgroundImage}')`,
          }}
        />
        <div className="fixed inset-0 bg-black/85" />

        <header className="bg-black/40 backdrop-blur-sm border-b border-neutral-800 sticky top-0 z-40 relative">
          <div className="container mx-auto px-6 py-4">
            <nav className="flex items-center justify-center space-x-6">
              <Link href="/" className="text-lg font-medium text-neutral-400 hover:text-neutral-300 transition-colors">
                Newest
              </Link>
              <Link
                href="/collection"
                className="text-lg font-medium text-neutral-400 hover:text-neutral-300 transition-colors"
              >
                Collections
              </Link>
              <Link
                href="/category"
                className="text-lg font-medium text-white hover:text-neutral-300 transition-colors"
              >
                Category
              </Link>
            </nav>
          </div>
        </header>

        <main className="container mx-auto px-6 py-6 relative">
          {error && (
            <div className="mb-6">
              <div className="bg-yellow-900/50 border border-yellow-600 rounded-lg p-4">
                <p className="text-yellow-200 text-sm">
                  ⚠️ 无法加载分类数据: {error}
                </p>
              </div>
            </div>
          )}
          
          <h1 className="text-2xl font-bold text-white mb-8 text-center">
            浏览分类 {!loading && `(${categories.length})`}
          </h1>
          
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-white text-lg">加载分类中...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link key={category.name} href={`/category/${category.name}`} passHref>
                <Card className="group relative h-60 overflow-hidden rounded-lg shadow-lg cursor-pointer border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800/50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20">
                  <Image
                    src={category.firstImage || "/placeholder.svg"}
                    alt={category.name}
                    layout="fill"
                    objectFit="cover"
                    className="transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = "/placeholder.svg?height=240&width=320"
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-4 text-white">
                    <h2 className="text-xl font-semibold">{category.name}</h2>
                    <p className="text-sm opacity-80">{category.count} 张照片</p>
                  </div>
                </Card>
              </Link>
            ))}
            {categories.length === 0 && (
              <div className="col-span-full text-center py-20">
                <Camera className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-400 mb-2">暂无分类</h3>
                <p className="text-neutral-600 text-sm">还没有通过标签分类的照片。</p>
              </div>
            )}
            </div>
          )}
        </main>
      </div>
    </>
  )
}
