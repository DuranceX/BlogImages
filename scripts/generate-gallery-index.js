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
  const cleaned = nameWithoutExt
    .replace(/^(img|image|photo|pic)[-_]?/i, '')
    .replace(/[-_]?(edited|final|export)$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
  
  return cleaned || 'Untitled';
}

// 生成模拟的EXIF数据
function generateMockExif(filename, dateTaken) {
  const cameras = [
    'Canon EOS R5', 'Sony A7R IV', 'Nikon D850', 'Fujifilm X-T4',
    'Leica Q2', 'Canon EOS R6', 'Sony A7 III', 'Nikon Z7',
    'Olympus OM-D E-M1', 'Canon EOS 5D Mark IV'
  ];
  
  const lenses = [
    '24-70mm f/2.8', '85mm f/1.4', '16-35mm f/2.8', '50mm f/1.2',
    '28mm f/1.7', '70-200mm f/2.8', '24-105mm f/4', '100mm f/2.8 Macro',
    '14-24mm f/2.8', '60mm f/2.8 Macro'
  ];
  
  const camera = cameras[Math.floor(Math.random() * cameras.length)];
  const lens = lenses[Math.floor(Math.random() * lenses.length)];
  
  return {
    camera,
    lens,
    iso: [100, 200, 400, 800, 1600, 3200][Math.floor(Math.random() * 6)],
    aperture: ['f/1.4', 'f/2', 'f/2.8', 'f/4', 'f/5.6', 'f/8', 'f/11'][Math.floor(Math.random() * 7)],
    shutterSpeed: ['1/1000', '1/500', '1/250', '1/125', '1/60', '1/30'][Math.floor(Math.random() * 6)],
    focalLength: `${Math.floor(Math.random() * 300) + 14}mm`,
    dateTaken,
    fileSize: `${(Math.random() * 15 + 2).toFixed(1)} MB`,
    dimensions: `${Math.floor(Math.random() * 3000) + 3000} × ${Math.floor(Math.random() * 2000) + 2000}`
  };
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
          categories: extractTagsFromFilename(item), // 使用文件名标签作为分类
          photographer: 'Unknown',
          likes: Math.floor(Math.random() * 1000) + 50,
          description: `一张精美的摄影作品，使用专业设备拍摄。`,
          filename: item,
          width: Math.floor(Math.random() * 1000) + 600,
          height: Math.floor(Math.random() * 1000) + 400,
          exif: generateMockExif(item, dateTaken),
          collection: collection // 添加合集信息
        };
        
        photos.push(photo);
      }
    }
  }
  
  return photos;
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const config = {
    photosDir: args[0] || './photos',
    outputFile: args[1] || './gallery-index.json',
    baseUrl: args[2] || 'https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main'
  };
  
  console.log('生成画廊索引...');
  console.log(`扫描目录: ${config.photosDir}`);
  console.log(`输出文件: ${config.outputFile}`);
  console.log(`基础URL: ${config.baseUrl}`);
  
  const photos = scanDirectory(config.photosDir, config.baseUrl);
  
  // 生成合集信息
  const collectionsMap = new Map();
  photos.forEach(photo => {
    if (photo.collection) {
      if (!collectionsMap.has(photo.collection)) {
        collectionsMap.set(photo.collection, {
          name: photo.collection, // 已经是简洁的名称了
          displayName: photo.collection, // 直接使用collection作为displayName
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
  const outputDir = path.dirname(config.outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(config.outputFile, JSON.stringify(galleryData, null, 2));
  
  console.log(`✅ 成功生成索引文件！`);
  console.log(`📸 总计 ${photos.length} 张图片`);
  console.log(`📁 合集: ${collections.length} 个`);
  console.log(`🏷️ 分类: ${[...new Set(photos.flatMap(p => p.categories))].join(', ')}`);
  
  // 显示合集统计
  if (collections.length > 0) {
    console.log('\n📊 合集详情:');
    collections.forEach(collection => {
      console.log(`   - ${collection.displayName}: ${collection.photoCount} 张`);
    });
  }
}

if (require.main === module) {
  main();
}

module.exports = { 
  scanDirectory, 
  generateMockExif, 
  extractTagsFromFilename,
  extractCollectionFromPath,
  extractDisplayName
};