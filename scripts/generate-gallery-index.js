#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 支持的图片格式
const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

// 从文件路径推断分类
function inferCategoriesFromPath(filePath) {
  const pathParts = filePath.toLowerCase().split('/');
  const categories = [];
  
  // 预定义的分类映射
  const categoryMappings = {
    'nature': ['Nature', 'Landscape'],
    'urban': ['Urban', 'Street'],
    'portrait': ['Portrait'],
    'wildlife': ['Nature', 'Wildlife'],
    'landscape': ['Landscape', 'Nature'],
    'street': ['Street', 'Urban'],
    'macro': ['Macro', 'Nature'],
    'architecture': ['Urban', 'Abstract'],
    'travel': ['Travel', 'Urban'],
    'food': ['Food', 'Still Life'],
    'animals': ['Animals'],
    'automotive': ['Automotive'],
    'abstract': ['Abstract']
  };
  
  // 检查路径中是否包含分类关键词
  for (const [keyword, cats] of Object.entries(categoryMappings)) {
    if (pathParts.some(part => part.includes(keyword))) {
      categories.push(...cats);
      break;
    }
  }
  
  // 如果没有找到分类，使用默认分类
  if (categories.length === 0) {
    categories.push('General');
  }
  
  return [...new Set(categories)]; // 去重
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
        
        const photo = {
          id,
          src: `${baseUrl}/${urlPath}`,
          title: generateTitleFromFilename(item),
          categories: inferCategoriesFromPath(relativePath),
          photographer: 'Unknown', // 可以从文件元数据或路径推断
          likes: Math.floor(Math.random() * 1000) + 50,
          description: `A beautiful photograph captured with professional equipment.`,
          filename: item,
          width: Math.floor(Math.random() * 1000) + 600,
          height: Math.floor(Math.random() * 1000) + 400,
          exif: generateMockExif(item, dateTaken)
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
  
  const galleryData = {
    lastUpdated: new Date().toISOString(),
    totalPhotos: photos.length,
    photos: photos.sort((a, b) => new Date(b.exif.dateTaken) - new Date(a.exif.dateTaken))
  };
  
  // 确保输出目录存在
  const outputDir = path.dirname(config.outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(config.outputFile, JSON.stringify(galleryData, null, 2));
  
  console.log(`✅ 成功生成索引文件！`);
  console.log(`📸 总计 ${photos.length} 张图片`);
  console.log(`📁 分类: ${[...new Set(photos.flatMap(p => p.categories))].join(', ')}`);
}

if (require.main === module) {
  main();
}

module.exports = { scanDirectory, generateMockExif, inferCategoriesFromPath };