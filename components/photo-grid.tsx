"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  Camera,
  Loader2,
  Aperture,
  Timer,
  Zap,
  Calendar,
  MapPin,
  Eye,
} from "lucide-react"
import Image from "next/image"
import type { Photo } from "@/lib/gallery-data" // 导入 Photo 接口
import type { HTMLDivElement } from "react"

interface PhotoGridProps {
  initialPhotos: Photo[]
  selectedCategory: string
  onCategoryClick: (category: string) => void
}

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

export default function PhotoGrid({ initialPhotos, selectedCategory, onCategoryClick }: PhotoGridProps) {
  console.log(`PhotoGrid rendered for category: ${selectedCategory}, initialPhotos length: ${initialPhotos.length}`)
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [likedPhotos, setLikedPhotos] = useState<Set<string>>(() => new Set())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)

  // Infinite scroll states
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15 // 每页加载的图片数量
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Update photos and reset pagination when initialPhotos or selectedCategory prop changes
  useEffect(() => {
    console.log(
      `PhotoGrid useEffect triggered for category: ${selectedCategory}. Resetting currentPage to 1 and attempting to scroll to top.`,
    )
    setPhotos(initialPhotos)
    setCurrentPage(1) // Reset pagination when photos change
    // 强制滚动到页面顶部，添加一个小的延迟以确保DOM更新
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "auto" }) // 确保是 auto
      console.log(`Scrolled to top for category: ${selectedCategory}`)
    }, 50) // 50ms 延迟

    return () => clearTimeout(timer) // 清理定时器
  }, [initialPhotos, selectedCategory])

  const filteredPhotos = photos // Photos are already filtered by the parent component

  // Photos to display based on infinite scroll
  const displayedPhotos = filteredPhotos.slice(0, currentPage * itemsPerPage)
  const hasMore = currentPage * itemsPerPage < filteredPhotos.length

  // Intersection Observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          console.log(
            `IntersectionObserver triggered. Loading more photos for ${selectedCategory}. Current page: ${currentPage}`,
          )
          setCurrentPage((prevPage) => prevPage + 1)
        }
      },
      {
        root: null, // viewport
        rootMargin: "200px", // Load when 200px from bottom
        threshold: 0.1,
      },
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current)
      }
    }
  }, [hasMore, filteredPhotos.length, currentPage, selectedCategory])

  const openModal = (photo: Photo) => {
    setSelectedPhoto(photo)
    setIsModalOpen(true)
    document.body.style.overflow = "hidden"
    setIsFullScreen(false)

    setTimeout(() => {
      setIsModalVisible(true)
    }, 10)
  }

  const closeModal = () => {
    setIsModalVisible(false)
    setIsFullScreen(false)

    setTimeout(() => {
      setIsModalOpen(false)
      setSelectedPhoto(null)
      document.body.style.overflow = "unset"
    }, 300)
  }

  const toggleFullScreen = () => {
    setIsFullScreen((prev) => !prev)
  }

  const navigatePhoto = (direction: "prev" | "next") => {
    if (!selectedPhoto) return

    const currentIndex = filteredPhotos.findIndex((p) => p.id === selectedPhoto.id)
    let newIndex

    if (direction === "prev") {
      newIndex = currentIndex > 0 ? currentIndex - 1 : filteredPhotos.length - 1
    } else {
      newIndex = currentIndex < filteredPhotos.length - 1 ? currentIndex + 1 : 0
    }

    setSelectedPhoto(filteredPhotos[newIndex])
    setIsFullScreen(false)
  }

  const toggleLike = (photoId: string) => {
    setLikedPhotos((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(photoId)) {
        newSet.delete(photoId)
      } else {
        newSet.add(photoId)
      }
      return newSet
    })
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPhoto) return

      switch (e.key) {
        case "Escape":
          if (isFullScreen) {
            setIsFullScreen(false)
          } else {
            closeModal()
          }
          break
        case "ArrowLeft":
          if (!isFullScreen) {
            navigatePhoto("prev")
          }
          break
        case "ArrowRight":
          if (!isFullScreen) {
            navigatePhoto("next")
          }
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [selectedPhoto, filteredPhotos, isFullScreen])

  return (
    <>
      <style jsx global>
        {customStyles}
      </style>
      <main className="container mx-auto px-6 py-6 relative">
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-3 space-y-3">
          {displayedPhotos.map((photo) => (
            <Card
              key={photo.id}
              className="group cursor-pointer overflow-hidden border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800/50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20 rounded-lg break-inside-avoid mb-3"
              onClick={() => openModal(photo)}
            >
              <div className="relative overflow-hidden">
                <Image
                  src={photo.src || "/placeholder.svg"}
                  alt={photo.title}
                  width={photo.width}
                  height={photo.height}
                  className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "/placeholder.svg?height=400&width=600"
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="absolute inset-0 p-4 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-wrap gap-1">
                      {photo.categories.slice(0, 2).map((category) => (
                        <Badge
                          key={category}
                          variant="secondary"
                          className="bg-black/40 text-white text-xs border-neutral-700 backdrop-blur-sm hover:bg-black/80 hover:text-white transition-colors cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            onCategoryClick(category)
                          }}
                        >
                          {category}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 bg-black/60 hover:bg-black/80 rounded-full backdrop-blur-sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleLike(photo.id)
                      }}
                    >
                      <Heart
                        className={`h-4 w-4 transition-colors ${
                          likedPhotos.has(photo.id) ? "fill-red-500 text-red-500" : "text-white"
                        }`}
                      />
                    </Button>
                  </div>

                  <div className="text-white">
                    <h3 className="font-medium text-sm mb-1">{photo.title}</h3>
                    <div className="flex items-center justify-between text-xs opacity-80">
                      <div className="flex items-center space-x-1">
                        <Heart className="h-3 w-3" />
                        <span>{photo.likes}</span>
                      </div>
                      <span>{photo.exif.camera}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {hasMore && (
          <div ref={loadMoreRef} className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          </div>
        )}

        {!hasMore && filteredPhotos.length > 0 && (
          <div className="text-center py-8 text-neutral-500 text-sm">已浏览完所有照片</div>
        )}

        {filteredPhotos.length === 0 && (
          <div className="text-center py-20">
            <Camera className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-400 mb-2">暂无照片</h3>
            <p className="text-neutral-600 text-sm">
              {selectedCategory === "All"
                ? "合集暂时为空"
                : `${selectedCategory} 分类下暂无照片`}
            </p>
          </div>
        )}
      </main>

      {isModalOpen && selectedPhoto && (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 transition-all duration-300 ease-out ${
            isModalVisible ? "opacity-100" : "opacity-0"
          } ${isFullScreen ? "opacity-0 pointer-events-none" : ""}`}
          style={{
            transform: isModalVisible ? "scale(1)" : "scale(0.95)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <div className="relative max-w-7xl w-full h-full overflow-y-auto scrollbar-hide rounded-lg bg-neutral-900/90 backdrop-blur-md border border-neutral-800">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white hover:text-white backdrop-blur-sm rounded-full h-10 w-10 border border-neutral-700"
              onClick={closeModal}
            >
              <X className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white hover:text-white backdrop-blur-sm rounded-full h-12 w-12 border border-neutral-700"
              onClick={() => navigatePhoto("prev")}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white hover:text-white backdrop-blur-sm rounded-full h-12 w-12 border border-neutral-700"
              onClick={() => navigatePhoto("next")}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>

            <div className="flex flex-col lg:flex-row gap-6 p-6 h-full">
              <div className="flex-1 flex items-center justify-center flex-shrink-0">
                <Image
                  src={selectedPhoto.src || "/placeholder.svg"}
                  alt={selectedPhoto.title}
                  width={1200}
                  height={800}
                  className="max-w-full object-contain rounded-lg shadow-2xl transition-all duration-300 cursor-pointer"
                  onClick={toggleFullScreen}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "/placeholder.svg?height=800&width=1200"
                  }}
                />
              </div>

              <div className="lg:w-80 overflow-y-auto scrollbar-hide max-h-full p-6">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-medium mb-2 text-white">{selectedPhoto.title}</h2>
                    <p className="text-neutral-400 text-sm">by {selectedPhoto.photographer}</p>
                    <p className="text-xs text-neutral-500 mt-1">{selectedPhoto.filename}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedPhoto.categories.map((category) => (
                      <Badge
                        key={category}
                        variant="secondary"
                        className="bg-stone-800/40 text-stone-200 border border-stone-600/30 text-xs hover:bg-neutral-800/50 hover:text-white transition-colors cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          onCategoryClick(category)
                        }}
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>

                  <p className="text-neutral-300 text-sm leading-relaxed">{selectedPhoto.description}</p>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-white flex items-center border-b border-neutral-800 pb-2">
                      <Camera className="h-4 w-4 mr-2 text-stone-400" />
                      Camera Settings
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-neutral-800/50 rounded-md p-3 border border-neutral-700/50">
                        <div className="flex items-center mb-1">
                          <Camera className="h-3 w-3 text-stone-400 mr-1" />
                          <span className="text-xs text-neutral-400 uppercase tracking-wide">Camera</span>
                        </div>
                        <p className="text-white text-xs font-medium">{selectedPhoto.exif.camera}</p>
                      </div>

                      <div className="bg-neutral-800/50 rounded-md p-3 border border-neutral-700/50">
                        <div className="flex items-center mb-1">
                          <Eye className="h-3 w-3 text-stone-400 mr-1" />
                          <span className="text-xs text-neutral-400 uppercase tracking-wide">Lens</span>
                        </div>
                        <p className="text-white text-xs font-medium">{selectedPhoto.exif.lens}</p>
                      </div>

                      <div className="bg-neutral-800/50 rounded-md p-3 border border-neutral-700/50">
                        <div className="flex items-center mb-1">
                          <Zap className="h-3 w-3 text-stone-400 mr-1" />
                          <span className="text-xs text-neutral-400 uppercase tracking-wide">ISO</span>
                        </div>
                        <p className="text-white text-xs font-medium">{selectedPhoto.exif.iso}</p>
                      </div>

                      <div className="bg-neutral-800/50 rounded-md p-3 border border-neutral-700/50">
                        <div className="flex items-center mb-1">
                          <Aperture className="h-3 w-3 text-stone-400 mr-1" />
                          <span className="text-xs text-neutral-400 uppercase tracking-wide">Aperture</span>
                        </div>
                        <p className="text-white text-xs font-medium">{selectedPhoto.exif.aperture}</p>
                      </div>

                      <div className="bg-neutral-800/50 rounded-md p-3 border border-neutral-700/50">
                        <div className="flex items-center mb-1">
                          <Timer className="h-3 w-3 text-stone-400 mr-1" />
                          <span className="text-xs text-neutral-400 uppercase tracking-wide">Shutter</span>
                        </div>
                        <p className="text-white text-xs font-medium">{selectedPhoto.exif.shutterSpeed}</p>
                      </div>

                      <div className="bg-neutral-800/50 rounded-md p-3 border border-neutral-700/50">
                        <div className="flex items-center mb-1">
                          <span className="text-xs text-neutral-400 uppercase tracking-wide">Focal</span>
                        </div>
                        <p className="text-white text-xs font-medium">{selectedPhoto.exif.focalLength}</p>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-neutral-800">
                      <div className="flex items-center justify-between py-1">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 text-stone-400 mr-2" />
                          <span className="text-neutral-400 text-xs">Date</span>
                        </div>
                        <span className="text-white text-xs">{selectedPhoto.exif.dateTaken}</span>
                      </div>

                      {selectedPhoto.exif.location && (
                        <div className="flex items-center justify-between py-1">
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 text-stone-400 mr-2" />
                            <span className="text-neutral-400 text-xs">Location</span>
                          </div>
                          <span className="text-white text-xs">{selectedPhoto.exif.location}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between py-1">
                        <span className="text-neutral-400 text-xs">File Size</span>
                        <span className="text-white text-xs">{selectedPhoto.exif.fileSize}</span>
                      </div>

                      <div className="flex items-center justify-between py-1">
                        <span className="text-neutral-400 text-xs">Dimensions</span>
                        <span className="text-white text-xs">{selectedPhoto.exif.dimensions}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 pt-4 border-t border-neutral-800">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleLike(selectedPhoto.id)}
                      className="flex items-center space-x-2 text-neutral-300 hover:bg-neutral-800/50 hover:text-white text-xs"
                    >
                      <Heart
                        className={`h-4 w-4 transition-colors ${
                          likedPhotos.has(selectedPhoto.id) ? "fill-red-500 text-red-500" : "text-neutral-400"
                        }`}
                      />
                      <span>{selectedPhoto.likes}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        if (navigator.share) {
                          try {
                            await navigator.share({
                              title: selectedPhoto.title,
                              text: selectedPhoto.description,
                              url: selectedPhoto.src,
                            })
                            console.log("Photo shared successfully!")
                          } catch (error) {
                            console.error("Error sharing photo:", error)
                          }
                        } else {
                          // Fallback for browsers that do not support Web Share API
                          try {
                            await navigator.clipboard.writeText(selectedPhoto.src)
                            alert("Image link copied to clipboard!")
                          } catch (error) {
                            console.error("Failed to copy link:", error)
                            alert("Could not copy link to clipboard.")
                          }
                        }
                      }}
                      className="text-neutral-300 hover:bg-neutral-800/50 hover:text-white text-xs"
                    >
                      <Share2 className="h-3 w-3 mr-1" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedPhoto && (
        <div
          className={`fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-sm transition-opacity duration-300 ${
            isFullScreen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          onClick={toggleFullScreen}
        >
          <Image
            src={selectedPhoto.src || "/placeholder.svg"}
            alt={selectedPhoto.title}
            width={selectedPhoto.width}
            height={selectedPhoto.height}
            className="max-w-full max-h-full object-contain transition-all duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = "/placeholder.svg?height=800&width=1200"
            }}
          />
        </div>
      )}
    </>
  )
}
