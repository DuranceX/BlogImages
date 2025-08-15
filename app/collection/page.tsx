"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCollections, generateCollectionSlug, type Collection } from "@/lib/gallery-data"

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

export default function CollectionsPage() {
  const router = useRouter()
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // 获取第一个合集的封面图作为背景图
  const backgroundImage = collections.length > 0 && collections[0].coverImage
    ? collections[0].coverImage
    : "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&h=1080"

  useEffect(() => {
    async function loadCollections() {
      try {
        setLoading(true)
        const collectionsData = await getCollections()
        setCollections(collectionsData)
        setError(null)
      } catch (err) {
        console.error('Failed to load collections:', err)
        setError(err instanceof Error ? err.message : 'Failed to load collections')
      } finally {
        setLoading(false)
      }
    }

    loadCollections()
  }, [])

  const handleCollectionClick = (collectionName: string) => {
    const slug = generateCollectionSlug(collectionName)
    router.push(`/collection/${slug}`)
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
                className="text-lg font-medium text-white hover:text-neutral-300 transition-colors"
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

        <main className="relative z-10 container mx-auto px-6 py-8">
          {error && (
            <div className="mb-6">
              <div className="bg-yellow-900/50 border border-yellow-600 rounded-lg p-4">
                <p className="text-yellow-200 text-sm">
                  ⚠️ 无法加载合集数据: {error}
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
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-white mb-2">照片合集</h1>
                <p className="text-neutral-400">
                  浏览按文件夹组织的照片合集，共 {collections.length} 个合集
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {collections.map((collection) => (
                  <div
                    key={collection.name}
                    onClick={() => handleCollectionClick(collection.name)}
                    className="group cursor-pointer"
                  >
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-neutral-800">
                      {collection.coverImage ? (
                        <img
                          src={collection.coverImage}
                          alt={collection.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-500">
                          <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      
                      {/* 悬浮遮罩 */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                      
                      {/* 图片数量标识 */}
                      <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
                        {collection.photoCount} 张
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <h3 className="text-white font-medium text-lg group-hover:text-neutral-300 transition-colors">
                        {collection.displayName}
                      </h3>
                      {collection.description && (
                        <p className="text-neutral-400 text-sm mt-1 line-clamp-2">
                          {collection.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2 text-xs text-neutral-500">
                        <span>{collection.photoCount} 张照片</span>
                        {collection.lastUpdated && (
                          <span>{new Date(collection.lastUpdated).toLocaleDateString('zh-CN')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {collections.length === 0 && !loading && (
                <div className="text-center py-16">
                  <svg className="mx-auto h-12 w-12 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-neutral-300">暂无合集</h3>
                  <p className="mt-1 text-neutral-500">开始上传照片到不同文件夹来创建合集</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  )
}