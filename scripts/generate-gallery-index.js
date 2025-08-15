#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
  
  // 移除常见的图片命名前缀/后缀
  let cleaned = nameWithoutExt
    .replace(/^(img|image|photo|pic|dsc|frame|capture|screenshot|scene|character|story|game|pal7?)[-_]?/i, '')
    .replace(/[-_]?(edited|final|export)$/i, '');
  
  // 如果移除前缀后还有内容，提取标签部分作为标题
  if (cleaned) {
    const parts = cleaned.split(/[-_]/);
    // 过滤掉数字和常见无意义词汇，保留有意义的标签
    const meaningfulParts = parts.filter(part => 
      part && 
      part.length > 1 && 
      !/^\d+$/.test(part) && 
      !['copy', 'final', 'edit', 'new'].includes(part.toLowerCase())
    );
    
    if (meaningfulParts.length > 0) {
      // 使用第一个有意义的标签作为标题
      const title = meaningfulParts[0];
      return formatTagName(title);
    }
  }
  
  // 如果没有找到有意义的内容，生成一个简单的编号标题
  const collectionMatch = filename.match(/\/([\u4e00-\u9fff\w\s]+)\//);
  const collectionName = collectionMatch ? collectionMatch[1] : '照片';
  
  // 从文件名中提取数字作为编号
  const numberMatch = nameWithoutExt.match(/\d+/);
  const number = numberMatch ? numberMatch[0] : Math.floor(Math.random() * 999) + 1;
  
  return `${collectionName} ${number}`;
}

// 扫描目录获取图片文件
function scanDirectory(dir, baseUrl = '') {
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
      const subPhotos = scanDirectory(fullPath, baseUrl);
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
        
        // 提取合集信息
        const collection = extractCollectionFromPath(relativePath);
        
        const photo = {
          id,
          src: `${baseUrl}/${urlPath}`,
          title: generateTitleFromFilename(item),
          categories: extractTagsFromFilename(item),
          photographer: 'Unknown',
          likes: 0, // 不再生成随机点赞数
          description: ``,
          filename: item,
          width: 1200, // 使用固定尺寸而不是随机
          height: 800,
          exif: {
            camera: '',
            lens: '',
            iso: '',
            aperture: '',
            shutterSpeed: '',
            focalLength: '',
            dateTaken,
            fileSize: '',
            dimensions: ''
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
function runGenerator(photosDir, outputFile, baseUrl) {
  console.log('🚀 开始生成照片索引...\n');
  console.log(`📁 扫描目录: ${photosDir}`);
  console.log(`📄 输出文件: ${outputFile}`);
  console.log(`🌐 基础URL: ${baseUrl}\n`);
  
  const photos = scanDirectory(photosDir, baseUrl);
  
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
function main() {
  const args = process.argv.slice(2);
  const config = {
    photosDir: args[0] || './photos',
    outputFile: args[1] || './gallery-index.json',
    baseUrl: args[2] || 'https://raw.githubusercontent.com/DuranceX/BlogImages/main'
  };
  
  runGenerator(config.photosDir, config.outputFile, config.baseUrl);
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