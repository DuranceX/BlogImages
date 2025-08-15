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
  collection?: string // 添加合集信息
}

export interface Collection {
  name: string // 文件夹路径名
  displayName: string // 显示名称（从路径提取）
  description?: string
  photoCount: number
  coverImage?: string // 封面图片
  lastUpdated?: string
}

export interface GalleryData {
  lastUpdated: string
  totalPhotos: number
  photos: Photo[]
  collections?: Collection[] // 添加合集信息
}

// 默认的GitHub仓库配置 - 需要用户自己配置
const GITHUB_CONFIG = {
  owner: process.env.NEXT_PUBLIC_GITHUB_OWNER || 'DuranceX',
  repo: process.env.NEXT_PUBLIC_GITHUB_REPO || 'BlogImages',
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
 * 获取所有合集
 */
export async function getCollections(): Promise<Collection[]> {
  const galleryData = await fetchGalleryData()
  
  if (galleryData.collections) {
    return galleryData.collections
  }
  
  // 如果没有预生成的合集数据，从照片数据中动态生成
  const photos = galleryData.photos
  const collectionsMap = new Map<string, Collection>()
  
  photos.forEach(photo => {
    if (photo.collection) {
      if (!collectionsMap.has(photo.collection)) {
        collectionsMap.set(photo.collection, {
          name: photo.collection,
          displayName: extractDisplayName(photo.collection),
          photoCount: 0,
          coverImage: photo.src,
          lastUpdated: photo.exif.dateTaken
        })
      }
      
      const collection = collectionsMap.get(photo.collection)!
      collection.photoCount++
      
      // 更新最新时间
      if (photo.exif.dateTaken > (collection.lastUpdated || '')) {
        collection.lastUpdated = photo.exif.dateTaken
      }
    }
  })
  
  return Array.from(collectionsMap.values()).sort((a, b) => 
    (b.lastUpdated || '').localeCompare(a.lastUpdated || '')
  )
}

/**
 * 根据合集名称获取照片
 */
export async function getPhotosByCollection(collectionName: string): Promise<Photo[]> {
  const photos = await getPhotos()
  return photos.filter(photo => photo.collection === collectionName)
}

/**
 * 从路径提取显示名称
 */
function extractDisplayName(path: string): string {
  // 从路径中提取最后一个文件夹名称作为显示名称
  // 例如：test-photos/2024/RPG冒险 -> RPG冒险
  const parts = path.split('/').filter(part => part && !part.match(/^(test-photos|photos|2024|2023|2022)$/))
  let lastPart = parts[parts.length - 1] || path
  
  // 如果最后一部分是年份，取倒数第二个
  if (lastPart.match(/^\d{4}$/)) {
    lastPart = parts[parts.length - 2] || lastPart
  }
  
  return lastPart || path
}

/**
 * 从文件名提取标签作为分类
 */
export function extractTagsFromFilename(filename: string): string[] {
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '')
  const tags: string[] = []
  
  // 使用 _ 和 - 分割文件名
  const parts = nameWithoutExt.split(/[-_]/)
  
  // 跳过第一个部分（通常是主文件名），从第二个部分开始提取标签
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i].trim()
    if (part && part.length > 1) {
      // 过滤掉纯数字和常见的无意义词汇
      if (!/^\d+$/.test(part) && !['copy', 'final', 'edit', 'new'].includes(part.toLowerCase())) {
        tags.push(formatTagName(part))
      }
    }
  }
  
  return tags.length > 0 ? tags : ['其他']
}

/**
 * 格式化标签名称
 */
function formatTagName(tag: string): string {
  return tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase()
}

/**
 * 生成collection的URL友好slug
 */
export function generateCollectionSlug(collectionName: string): string {
  // 处理混合中英文的情况，保持原有大小写
  return collectionName
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fff-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * 从slug还原collection名称
 */
export async function getCollectionNameFromSlug(slug: string): Promise<string> {
  try {
    // 获取所有合集数据
    const collections = await getCollections()
    
    // 查找匹配的合集
    for (const collection of collections) {
      const collectionSlug = generateCollectionSlug(collection.name)
      if (collectionSlug === slug) {
        return collection.name
      }
    }
    // 如果没找到，尝试简单的解码和替换
    // 但是由于我们现在保持原有大小写，slug可能就是原名称
    const decodedSlug = decodeURIComponent(slug)
    if (decodedSlug.includes('-')) {
      return decodedSlug.replace(/-/g, ' ')
    }
    return decodedSlug
  } catch (error) {
    console.error('Error getting collection name from slug:', error)
    return decodeURIComponent(slug).replace(/-/g, ' ')
  }
}

/**
 * 获取画廊统计信息
 */
export async function getGalleryStats() {
  const galleryData = await fetchGalleryData()
  const categories = await getCategories()
  const collections = await getCollections()
  
  return {
    totalPhotos: galleryData.totalPhotos,
    totalCategories: categories.length - 1, // 减去 'All'
    totalCollections: collections.length,
    lastUpdated: galleryData.lastUpdated,
    categories: categories.filter(cat => cat !== 'All'),
    collections: collections.slice(0, 5) // 显示前5个合集
  }
}