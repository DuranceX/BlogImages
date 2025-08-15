#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 清理test-photos目录
function cleanTestPhotos() {
  const testDir = './test-photos';
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
}

// 合集定义（文件夹名称）
const collections = [
  '2024/仙剑奇侠传七',
  '2024/游戏截图',
  '2024/RPG冒险',
  '2025/游戏世界',
  '2025/虚拟摄影'
];

// 标签池（用于生成文件名标签）
const tagPools = {
  character: ['character', 'hero', 'npc', 'protagonist', 'warrior', 'mage', 'archer'],
  scene: ['landscape', 'city', 'village', 'mountain', 'forest', 'river', 'temple', 'palace'],
  action: ['battle', 'dialogue', 'cutscene', 'exploration', 'quest', 'combat', 'magic'],
  mood: ['dramatic', 'peaceful', 'intense', 'beautiful', 'mysterious', 'epic', 'serene'],
  time: ['day', 'night', 'sunset', 'dawn', 'twilight'],
  weather: ['sunny', 'cloudy', 'rain', 'snow', 'fog', 'storm'],
  chinese: ['古风', '仙境', '武侠', '飞剑', '修仙', '江湖', '山水', '云海', '仙女', '侠客']
};

// 随机选择标签
function getRandomTags(count = 2) {
  const allTags = Object.values(tagPools).flat();
  const selectedTags = [];
  
  while (selectedTags.length < count) {
    const randomTag = allTags[Math.floor(Math.random() * allTags.length)];
    if (!selectedTags.includes(randomTag)) {
      selectedTags.push(randomTag);
    }
  }
  
  return selectedTags;
}

// 生成新的文件名
function generateNewFilename(originalFilename, index) {
  const ext = path.extname(originalFilename);
  const tags = getRandomTags(Math.floor(Math.random() * 3) + 1); // 1-3个标签
  
  // 生成基础文件名
  const baseNames = [
    'PAL7', 'Game', 'Screenshot', 'Scene', 'Character', 'Story',
    'IMG', 'DSC', 'Photo', 'Capture', 'Frame'
  ];
  
  const baseName = baseNames[Math.floor(Math.random() * baseNames.length)];
  const number = String(index + 1).padStart(3, '0');
  
  return `${baseName}_${number}_${tags.join('_')}${ext}`;
}

// 复制并重命名文件
function copyAndRenameFiles() {
  const imgDir = './img';
  const testDir = './test-photos';
  
  if (!fs.existsSync(imgDir)) {
    console.log('❌ img目录不存在');
    return [];
  }
  
  // 获取所有图片文件
  const files = fs.readdirSync(imgDir).filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
  });
  
  console.log(`📁 找到 ${files.length} 张图片`);
  
  const copiedFiles = [];
  
  files.forEach((file, index) => {
    // 随机选择一个合集
    const collection = collections[Math.floor(Math.random() * collections.length)];
    const collectionDir = path.join(testDir, collection);
    
    // 创建目录
    if (!fs.existsSync(collectionDir)) {
      fs.mkdirSync(collectionDir, { recursive: true });
    }
    
    // 生成新文件名
    const newFilename = generateNewFilename(file, index);
    const sourcePath = path.join(imgDir, file);
    const targetPath = path.join(collectionDir, newFilename);
    
    // 复制文件
    try {
      fs.copyFileSync(sourcePath, targetPath);
      copiedFiles.push({
        original: file,
        new: newFilename,
        collection: collection,
        path: targetPath
      });
      
      console.log(`✅ ${file} → ${collection}/${newFilename}`);
    } catch (error) {
      console.error(`❌ 复制失败 ${file}:`, error.message);
    }
  });
  
  return copiedFiles;
}

// 生成统计报告
function generateReport(copiedFiles) {
  console.log('\n📊 测试数据生成报告:');
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  
  // 按合集统计
  const collectionStats = {};
  copiedFiles.forEach(file => {
    const collection = file.collection;
    if (!collectionStats[collection]) {
      collectionStats[collection] = [];
    }
    collectionStats[collection].push(file);
  });
  
  console.log(`📸 总计: ${copiedFiles.length} 张图片`);
  console.log(`📁 合集: ${Object.keys(collectionStats).length} 个\n`);
  
  Object.entries(collectionStats).forEach(([collection, files]) => {
    console.log(`📂 ${collection}: ${files.length} 张`);
    files.forEach(file => {
      // 提取标签
      const nameWithoutExt = path.parse(file.new).name;
      const parts = nameWithoutExt.split('_');
      const tags = parts.slice(2); // 跳过前两部分
      console.log(`   • ${file.new} → [${tags.join(', ')}]`);
    });
    console.log('');
  });
}

// 主函数
function main() {
  console.log('🚀 开始创建测试数据...\n');
  
  // 清理旧的测试数据
  console.log('🧹 清理旧的测试数据...');
  cleanTestPhotos();
  
  // 复制并重命名文件
  console.log('📋 复制并重命名图片文件...');
  const copiedFiles = copyAndRenameFiles();
  
  if (copiedFiles.length === 0) {
    console.log('❌ 没有找到可用的图片文件');
    return;
  }
  
  // 生成报告
  generateReport(copiedFiles);
  
  console.log('✨ 测试数据创建完成！');
  console.log('\n下一步：');
  console.log('1. 运行: node scripts/generate-gallery-index.js test-photos test-gallery-index.json "https://example.com"');
  console.log('2. 启动开发服务器: npm run dev');
  console.log('3. 访问: http://localhost:3000');
}

if (require.main === module) {
  main();
}

module.exports = { copyAndRenameFiles, generateNewFilename, getRandomTags };