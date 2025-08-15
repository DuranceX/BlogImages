export interface PhotoExif {
  camera: string
  lens: string
  iso: number
  aperture: string
  shutterSpeed: string
  focalLength: string
  dateTaken: string
  location?: string
  fileSize: string
  dimensions: string
}

export interface Photo {
  id: string
  src: string
  title: string
  categories: string[]
  photographer: string
  likes: number
  description: string
  filename: string
  width: number
  height: number
  exif: PhotoExif
}

export interface GalleryData {
  lastUpdated: string
  totalPhotos: number
  photos: Photo[]
}

// 默认的GitHub仓库配置 - 需要用户自己配置
const GITHUB_CONFIG = {
  owner: process.env.NEXT_PUBLIC_GITHUB_OWNER || 'YOUR_USERNAME',
  repo: process.env.NEXT_PUBLIC_GITHUB_REPO || 'YOUR_PHOTO_REPO',
  branch: process.env.NEXT_PUBLIC_GITHUB_BRANCH || 'main',
  indexFile: process.env.NEXT_PUBLIC_INDEX_FILE || 'gallery-index.json'
}

/**
 * 获取画廊索引文件的URL
 */
function getGalleryIndexUrl(): string {
  const { owner, repo, branch, indexFile } = GITHUB_CONFIG
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${indexFile}`
}

/**
 * 从远程JSON文件获取画廊数据
 */
export async function fetchGalleryData(): Promise<GalleryData> {
  try {
    const indexUrl = getGalleryIndexUrl()
    console.log('Fetching gallery data from:', indexUrl)
    
    const response = await fetch(indexUrl, {
      next: { revalidate: 300 }, // 5分钟缓存
      headers: {
        'Accept': 'application/json',
      }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch gallery data: ${response.status} ${response.statusText}`)
    }
    
    const data: GalleryData = await response.json()
    
    // 验证数据格式
    if (!data.photos || !Array.isArray(data.photos)) {
      throw new Error('Invalid gallery data format')
    }
    
    return data
  } catch (error) {
    console.error('Error fetching gallery data:', error)
    
    // 如果获取远程数据失败，返回空数据
    return {
      lastUpdated: new Date().toISOString(),
      totalPhotos: 0,
      photos: []
    }
  }
}

/**
 * 获取所有照片
 */
export async function getPhotos(): Promise<Photo[]> {
  const galleryData = await fetchGalleryData()
  return galleryData.photos
}

/**
 * 根据分类过滤照片
 */
export async function getPhotosByCategory(category: string): Promise<Photo[]> {
  const photos = await getPhotos()
  
  if (category === 'All' || !category) {
    return photos
  }
  
  return photos.filter(photo => 
    photo.categories.some(cat => 
      cat.toLowerCase() === category.toLowerCase()
    )
  )
}

/**
 * 获取所有可用的分类
 */
export async function getCategories(): Promise<string[]> {
  const photos = await getPhotos()
  const categorySet = new Set<string>()
  
  photos.forEach(photo => {
    photo.categories.forEach(category => {
      categorySet.add(category)
    })
  })
  
  return ['All', ...Array.from(categorySet).sort()]
}

/**
 * 根据ID获取单张照片
 */
export async function getPhotoById(id: string): Promise<Photo | null> {
  const photos = await getPhotos()
  return photos.find(photo => photo.id === id) || null
}

/**
 * 搜索照片
 */
export async function searchPhotos(query: string): Promise<Photo[]> {
  const photos = await getPhotos()
  const searchTerm = query.toLowerCase()
  
  return photos.filter(photo => 
    photo.title.toLowerCase().includes(searchTerm) ||
    photo.description.toLowerCase().includes(searchTerm) ||
    photo.categories.some(cat => cat.toLowerCase().includes(searchTerm)) ||
    photo.photographer.toLowerCase().includes(searchTerm)
  )
}

/**
 * 获取画廊统计信息
 */
export async function getGalleryStats() {
  const galleryData = await fetchGalleryData()
  const categories = await getCategories()
  
  return {
    totalPhotos: galleryData.totalPhotos,
    totalCategories: categories.length - 1, // 减去 'All'
    lastUpdated: galleryData.lastUpdated,
    categories: categories.filter(cat => cat !== 'All')
  }
}