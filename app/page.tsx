"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getPhotos, type Photo } from "@/lib/gallery-data"
import { mockPhotos } from "@/lib/mock-photos"
import PhotoGrid from "@/components/photo-grid"

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

export default function NewestPhotosPage() {
  const router = useRouter()
  const [photos, setPhotos] = useState<Photo[]>(mockPhotos) // 使用mock数据作为初始值
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadPhotos() {
      try {
        setLoading(true)
        const galleryPhotos = await getPhotos()
        
        // 如果获取到了数据，使用远程数据；否则继续使用mock数据
        if (galleryPhotos.length > 0) {
          setPhotos(galleryPhotos)
        }
        setError(null)
      } catch (err) {
        console.error('Failed to load gallery photos:', err)
        setError(err instanceof Error ? err.message : 'Failed to load photos')
        // 保持使用mock数据作为fallback
      } finally {
        setLoading(false)
      }
    }

    loadPhotos()
  }, [])

  const handleCategoryClick = (category: string) => {
    router.push(`/category/${category}`)
  }

  return (
    <>
      <style jsx global>
        {customStyles}
      </style>
      <div className="min-h-screen bg-black relative">
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&h=1080')",
          }}
        />
        <div className="fixed inset-0 bg-black/85" />

        <header className="bg-black/40 backdrop-blur-sm border-b border-neutral-800 sticky top-0 z-40 relative">
          <div className="container mx-auto px-6 py-4">
            <nav className="flex items-center justify-center space-x-6">
              <Link href="/" className="text-lg font-medium text-white hover:text-neutral-300 transition-colors">
                Newest
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
          <div className="relative z-50 mx-auto max-w-4xl px-6 py-4">
            <div className="bg-yellow-900/50 border border-yellow-600 rounded-lg p-4 mb-4">
              <p className="text-yellow-200 text-sm">
                ⚠️ 无法加载远程图片数据，正在使用本地数据: {error}
              </p>
            </div>
          </div>
        )}
        
        <PhotoGrid
          initialPhotos={photos}
          selectedCategory="All"
          onCategoryClick={handleCategoryClick}
          key="all-photos"
        />
      </div>
    </>
  )
}
