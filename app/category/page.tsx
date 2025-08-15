"use client"

import Link from "next/link"
import Image from "next/image"
import { mockPhotos } from "@/lib/mock-photos"
import { Card } from "@/components/ui/card"
import { Camera } from "lucide-react"
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

export default function CategoryIndexPage() {
  const categoriesMap = new Map<string, { count: number; firstImage: string }>()

  mockPhotos.forEach((photo) => {
    photo.categories.forEach((category) => {
      if (!categoriesMap.has(category)) {
        categoriesMap.set(category, { count: 0, firstImage: photo.src })
      }
      const current = categoriesMap.get(category)!
      categoriesMap.set(category, { ...current, count: current.count + 1 })
    })
  })

  const categories = Array.from(categoriesMap.entries()).map(([name, data]) => ({
    name,
    count: data.count,
    firstImage: data.firstImage,
  }))

  // 在分类总览页面加载时，强制滚动到顶部
  useEffect(() => {
    console.log("CategoryIndexPage useEffect triggered. Scrolling to top.")
    window.scrollTo({ top: 0, behavior: "auto" }) // 确保是 auto
  }, []) // 空依赖数组表示只在组件挂载时执行一次

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
                href="/category"
                className="text-lg font-medium text-white hover:text-neutral-300 transition-colors"
              >
                Category
              </Link>
            </nav>
          </div>
        </header>

        <main className="container mx-auto px-6 py-6 relative">
          <h1 className="text-2xl font-bold text-white mb-8 text-center">Browse Categories</h1>
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
                    <p className="text-sm opacity-80">{category.count} photos</p>
                  </div>
                </Card>
              </Link>
            ))}
            {categories.length === 0 && (
              <div className="col-span-full text-center py-20">
                <Camera className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-400 mb-2">No categories found</h3>
                <p className="text-neutral-600 text-sm">It seems there are no photos categorized yet.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  )
}
