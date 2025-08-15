"use client"

import Link from "next/link"
import { getPhotosByCategory, type Photo } from "@/lib/gallery-data"
import PhotoGrid from "@/components/photo-grid"
import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react" // 导入 useEffect、useState 和 use

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

interface CategoryDetailPageProps {
  params: Promise<{
    slug: string
  }>
}

export default function CategoryDetailPage({ params }: CategoryDetailPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const categoryName = decodeURIComponent(resolvedParams.slug)
  
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 加载远程数据
  useEffect(() => {
    async function loadCategoryPhotos() {
      try {
        setLoading(true)
        const categoryPhotos = await getPhotosByCategory(categoryName)
        
        setPhotos(categoryPhotos)
        setError(null)
      } catch (err) {
        console.error('Failed to load category photos:', err)
        setError(err instanceof Error ? err.message : 'Failed to load photos')
        setPhotos([])
      } finally {
        setLoading(false)
      }
    }

    loadCategoryPhotos()
  }, [categoryName])
  
  // 获取当前分类的第一张图片作为背景图，如果没有则使用占位符
  const categoryBackgroundImage =
    photos.length > 0
      ? photos[0].src
      : "/placeholder.svg"

  const handleCategoryClick = (category: string) => {
    router.push(`/category/${category}`)
  }

  // 在详细分类页面加载时，强制滚动到顶部
  useEffect(() => {
    console.log("CategoryDetailPage useEffect triggered. Scrolling to top.")
    window.scrollTo({ top: 0, behavior: "auto" }) // 确保是 auto
  }, [categoryName]) // 依赖 categoryName，当分类改变时也滚动

  return (
    <>
      <style jsx global>
        {customStyles}
      </style>
      <div className="min-h-screen bg-black relative">
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('${categoryBackgroundImage}')`, // 使用动态背景图
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
                className="text-lg font-medium text-neutral-400 hover:text-neutral-300 transition-colors"
              >
                Category
              </Link>
            </nav>
          </div>
        </header>

        {error && (
          <div className="container mx-auto px-6 mb-6">
            <div className="bg-yellow-900/50 border border-yellow-600 rounded-lg p-4">
              <p className="text-yellow-200 text-sm">
                ⚠️ 无法加载远程分类数据，正在使用本地数据: {error}
              </p>
            </div>
          </div>
        )}
        
        <h1 className="text-2xl font-bold text-white text-center pt-6">{categoryName} 照片</h1>
        
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-white text-lg">加载中...</div>
          </div>
        ) : (
          <PhotoGrid
            initialPhotos={photos}
            selectedCategory={categoryName}
            onCategoryClick={handleCategoryClick}
            key={categoryName}
          />
        )}
      </div>
    </>
  )
}
