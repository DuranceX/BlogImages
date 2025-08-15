"use client"
import Link from "next/link"
import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { getPhotosByCollection, getCollectionNameFromSlug, type Photo } from "@/lib/gallery-data"
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

interface CollectionPageProps {
  params: Promise<{
    slug: string
  }>
}

export default function CollectionPage({ params }: CollectionPageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [collectionName, setCollectionName] = useState<string>("")

  useEffect(() => {
    async function loadCollectionPhotos() {
      try {
        setLoading(true)
        const collectionName = await getCollectionNameFromSlug(resolvedParams.slug)
        setCollectionName(collectionName)
        
        const collectionPhotos = await getPhotosByCollection(collectionName)
        setPhotos(collectionPhotos)
        setError(null)
      } catch (err) {
        console.error('Failed to load collection photos:', err)
        setError(err instanceof Error ? err.message : 'Failed to load photos')
      } finally {
        setLoading(false)
      }
    }

    loadCollectionPhotos()
  }, [resolvedParams.slug])

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

        <main className="relative z-10">
          {/* 面包屑导航 */}
          <div className="container mx-auto px-6 py-4">
            <nav className="flex items-center space-x-2 text-sm">
              <Link href="/collection" className="text-neutral-400 hover:text-neutral-300">
                合集
              </Link>
              <span className="text-neutral-600">/</span>
              <span className="text-white">{collectionName}</span>
            </nav>
          </div>

          {error && (
            <div className="container mx-auto px-6 mb-6">
              <div className="bg-yellow-900/50 border border-yellow-600 rounded-lg p-4">
                <p className="text-yellow-200 text-sm">
                  ⚠️ 无法加载合集照片: {error}
                </p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-white text-lg">加载中...</div>
            </div>
          ) : (
            <>
              {/* 合集标题 */}
              <div className="container mx-auto px-6 mb-8">
                <h1 className="text-4xl font-bold text-white mb-2">{collectionName}</h1>
                <p className="text-neutral-400">
                  {photos.length} 张照片
                </p>
              </div>

              {photos.length > 0 ? (
                <PhotoGrid
                  initialPhotos={photos}
                  selectedCategory="All"
                  onCategoryClick={handleCategoryClick}
                  key={`collection-${collectionName}`}
                />
              ) : (
                <div className="container mx-auto px-6">
                  <div className="text-center py-16">
                    <svg className="mx-auto h-12 w-12 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-neutral-300">合集为空</h3>
                    <p className="mt-1 text-neutral-500">这个合集暂时没有照片</p>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  )
}