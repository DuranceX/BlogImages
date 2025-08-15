"use client"

import Link from "next/link"
import { mockPhotos } from "@/lib/mock-photos"
import PhotoGrid from "@/components/photo-grid"
import { useRouter } from "next/navigation"
import { useEffect } from "react" // 导入 useEffect

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
  params: {
    slug: string
  }
}

export default function CategoryDetailPage({ params }: CategoryDetailPageProps) {
  const router = useRouter()
  const categoryName = decodeURIComponent(params.slug)

  const photosForCategory = mockPhotos.filter((photo) => photo.categories.includes(categoryName))

  // 获取当前分类的第一张图片作为背景图，如果没有则使用默认占位符
  const categoryBackgroundImage =
    photosForCategory.length > 0
      ? photosForCategory[0].src
      : "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&h=1080" // Fallback to original if no photos

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
                href="/category"
                className="text-lg font-medium text-neutral-400 hover:text-neutral-300 transition-colors"
              >
                Category
              </Link>
            </nav>
          </div>
        </header>

        <h1 className="text-2xl font-bold text-white text-center pt-6">{categoryName} Photos</h1>
        <PhotoGrid
          initialPhotos={photosForCategory}
          selectedCategory={categoryName}
          onCategoryClick={handleCategoryClick}
          key={categoryName} // 为每个分类页面设置一个基于分类名称的动态key
        />
      </div>
    </>
  )
}
