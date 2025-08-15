#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.log('Sharp not available, using fallback dimensions');
}

// 支持的图片格式
const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

// 从文件名提取标签作为分类
function extractTagsFromFilename(filename) {
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  const tags = [];
  
  // 使用 _ 和 - 分割文件名
  const parts = nameWithoutExt.split(/[-_]/);
  
  // 跳过第一个部分（通常是主文件名），从第二个部分开始提取标签
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i].trim();
    if (part && part.length > 1) {
      // 过滤掉纯数字和常见的无意义词汇
      if (!/^\d+$/.test(part) && !['copy', 'final', 'edit', 'new'].includes(part.toLowerCase())) {
        tags.push(formatTagName(part));
      }
    }
  }
  
  return tags.length > 0 ? tags : ['其他'];
}

// 格式化标签名称
function formatTagName(tag) {
  return tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
}

// 从路径提取合集名称
function extractCollectionFromPath(filePath) {
  const pathParts = filePath.split('/').filter(part => part && part !== '.');
  
  // 找到photos目录后的路径作为合集，如果没有photos目录，从第一个目录开始
  let startIndex = 0;
  const photosIndex = pathParts.findIndex(part => part === 'photos' || part === 'test-photos');
  if (photosIndex >= 0) {
    startIndex = photosIndex + 1;
  }
  
  // 返回从startIndex到文件名之前的路径
  if (startIndex < pathParts.length - 1) {
    const fullPath = pathParts.slice(startIndex, -1).join('/');
    // 只返回最后一个文件夹名称作为合集名
    return extractDisplayName(fullPath);
  }
  
  return null;
}

// 从路径提取显示名称
function extractDisplayName(path) {
  // 从路径中提取最后一个文件夹名称作为显示名称
  // 例如：2024/上海旅游 -> 上海旅游
  const parts = path.split('/').filter(part => part);
  return parts[parts.length - 1] || path;
}

// 从文件名生成标题
function generateTitleFromFilename(filename) {
  const nameWithoutExt = path.parse(filename).name;
  
  // 分割文件名，识别标签
  const parts = nameWithoutExt.split(/[-_]/);
  
  // 如果只有一个部分，直接返回
  if (parts.length <= 1) {
    return nameWithoutExt;
  }
  
  // 构建标题：保留前缀和数字，移除标签
  let titleParts = [];
  let foundMeaningfulContent = false;
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    
    if (!part) continue;
    
    // 保留前缀（如DSC、Frame、IMG等）
    if (i === 0) {
      titleParts.push(part);
      foundMeaningfulContent = true;
      continue;
    }
    
    // 保留数字
    if (/^\d+$/.test(part)) {
      titleParts.push(part);
      foundMeaningfulContent = true;
      continue;
    }
    
    // 跳过标签（有意义的词汇，用于分类）
    if (part.length > 1 && 
        !['copy', 'final', 'edit', 'new', 'edited', 'export'].includes(part.toLowerCase())) {
      // 这些是标签，不加入标题
      continue;
    }
    
    // 保留其他内容（如copy、final等后缀）
    titleParts.push(part);
  }
  
  // 如果有构建的标题，使用它
  if (foundMeaningfulContent && titleParts.length > 0) {
    return titleParts.join(' ');
  }
  
  // 如果没有找到有意义的内容，使用完整的原始名称
  return nameWithoutExt;
}

// 获取图片信息（尺寸和文件大小）
async function getImageInfo(filePath) {
  try {
    const stat = fs.statSync(filePath);
    const fileSizeBytes = stat.size;
    
    // 格式化文件大小
    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };
    
    let width = 1200;
    let height = 800;
    
    // 如果有sharp库，获取真实的图片尺寸
    if (sharp) {
      try {
        const metadata = await sharp(filePath).metadata();
        width = metadata.width || 1200;
        height = metadata.height || 800;
      } catch (sharpError) {
        console.log(`Failed to get dimensions for ${filePath}:`, sharpError.message);
        // 使用合理的随机尺寸作为fallback
        width = null;
        height = null;
      }
    } else {
      // 没有sharp时使用合理的随机尺寸
      width = null;
      height = null;
    }
    
    return {
      fileSize: formatFileSize(fileSizeBytes),
      width,
      height
    };
  } catch (error) {
    return {
      fileSize: '0 MB',
      width: 1200,
      height: 800
    };
  }
}

// 扫描目录获取图片文件
async function scanDirectory(dir, baseUrl = '') {
  const photos = [];
  
  if (!fs.existsSync(dir)) {
    console.log(`目录不存在: ${dir}`);
    return photos;
  }
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // 递归扫描子目录
      const subPhotos = await scanDirectory(fullPath, baseUrl);
      photos.push(...subPhotos);
    } else if (stat.isFile()) {
      const ext = path.extname(item).toLowerCase();
      if (SUPPORTED_FORMATS.includes(ext)) {
        const relativePath = path.relative(process.cwd(), fullPath);
        const urlPath = relativePath.replace(/\\/g, '/');
        
        // 生成唯一ID
        const id = crypto.createHash('md5').update(urlPath).digest('hex').substring(0, 16);
        
        // 获取文件修改时间作为拍摄时间
        const dateTaken = stat.mtime.toISOString().split('T')[0];
        
        // 获取图片信息
        const imageInfo = await getImageInfo(fullPath);
        
        // 提取合集信息
        const collection = extractCollectionFromPath(relativePath);
        
        const photo = {
          id,
          src: `${baseUrl}/${urlPath}`,
          title: generateTitleFromFilename(item),
          categories: extractTagsFromFilename(item),
          photographer: 'Unknown',
          likes: 0,
          description: ``,
          filename: item,
          width: imageInfo.width,
          height: imageInfo.height,
          exif: {
            camera: '',
            lens: '',
            iso: '',
            aperture: '',
            shutterSpeed: '',
            focalLength: '',
            dateTaken,
            fileSize: imageInfo.fileSize,
            dimensions: `${imageInfo.width} × ${imageInfo.height}`
          },
          collection: collection
        };
        
        photos.push(photo);
      }
    }
  }
  
  return photos;
}

// 运行生成器并显示详细信息
async function runGenerator(photosDir, outputFile, baseUrl) {
  console.log('🚀 开始生成照片索引...\n');
  console.log(`📁 扫描目录: ${photosDir}`);
  console.log(`📄 输出文件: ${outputFile}`);
  console.log(`🌐 基础URL: ${baseUrl}\n`);
  
  const photos = await scanDirectory(photosDir, baseUrl);
  
  // 生成合集信息
  const collectionsMap = new Map();
  photos.forEach(photo => {
    if (photo.collection) {
      if (!collectionsMap.has(photo.collection)) {
        collectionsMap.set(photo.collection, {
          name: photo.collection,
          displayName: photo.collection,
          photoCount: 0,
          coverImage: photo.src,
          lastUpdated: photo.exif.dateTaken
        });
      }
      
      const collection = collectionsMap.get(photo.collection);
      collection.photoCount++;
      
      // 更新最新时间
      if (photo.exif.dateTaken > collection.lastUpdated) {
        collection.lastUpdated = photo.exif.dateTaken;
      }
    }
  });
  
  const collections = Array.from(collectionsMap.values()).sort((a, b) => 
    b.lastUpdated.localeCompare(a.lastUpdated)
  );
  
  const galleryData = {
    lastUpdated: new Date().toISOString(),
    totalPhotos: photos.length,
    photos: photos.sort((a, b) => new Date(b.exif.dateTaken) - new Date(a.exif.dateTaken)),
    collections: collections
  };
  
  // 确保输出目录存在
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(outputFile, JSON.stringify(galleryData, null, 2));
  
  console.log(`✅ 成功生成索引文件！`);
  console.log(`📸 总计 ${photos.length} 张图片`);
  console.log(`📁 合集: ${collections.length} 个`);
  
  const categories = [...new Set(photos.flatMap(p => p.categories))];
  if (categories.length > 0) {
    console.log(`🏷️ 分类: ${categories.join(', ')}`);
  }
  
  // 显示合集统计
  if (collections.length > 0) {
    console.log('\n📊 合集详情:');
    collections.forEach(collection => {
      console.log(`   - ${collection.displayName}: ${collection.photoCount} 张`);
    });
  }
  
  console.log(`\n📄 输出文件: ${outputFile}`);
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const config = {
    photosDir: args[0] || './photos',
    outputFile: args[1] || './gallery-index.json',
    baseUrl: args[2] || 'https://raw.githubusercontent.com/DuranceX/BlogImages/main'
  };
  
  await runGenerator(config.photosDir, config.outputFile, config.baseUrl);
}

if (require.main === module) {
  main();
}

module.exports = { 
  scanDirectory, 
  extractTagsFromFilename,
  extractCollectionFromPath,
  extractDisplayName,
  generateTitleFromFilename,
  runGenerator
};