#!/usr/bin/env node

// 测试索引生成器的脚本
// 用于本地测试，创建一些示例文件夹结构

const fs = require('fs');
const path = require('path');

// 创建测试目录结构
function createTestStructure() {
  const testDir = './test-photos';
  
  // 创建目录结构
  const dirs = [
    'test-photos/2024/nature',
    'test-photos/2024/urban', 
    'test-photos/2024/portrait',
    'test-photos/2024/travel',
    'test-photos/2025/landscape',
    'test-photos/2025/wildlife'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  // 创建一些测试文件（空文件，仅用于测试结构）
  const testFiles = [
    'test-photos/2024/nature/mountain_sunset.jpg',
    'test-photos/2024/nature/forest_path.jpg',
    'test-photos/2024/urban/city_lights.jpg',
    'test-photos/2024/urban/street_art.jpg',
    'test-photos/2024/portrait/musician.jpg',
    'test-photos/2024/travel/eiffel_tower.jpg',
    'test-photos/2025/landscape/desert_dunes.jpg',
    'test-photos/2025/wildlife/eagle_soaring.jpg'
  ];
  
  testFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, ''); // 创建空文件
    }
  });
  
  console.log('✅ 测试目录结构创建完成！');
  console.log('📁 目录：test-photos/');
  console.log('📸 测试文件：', testFiles.length, '个');
  
  return testDir;
}

// 运行生成器测试
async function runGeneratorTest() {
  console.log('🚀 开始测试图片索引生成器...\n');
  
  // 创建测试目录
  const testDir = createTestStructure();
  
  // 导入生成器
  const generator = require('./generate-gallery-index.js');
  
  // 运行生成器
  try {
    const { execSync } = require('child_process');
    const result = execSync(`node scripts/generate-gallery-index.js ${testDir} test-gallery-index.json "https://example.com"`, {
      encoding: 'utf8'
    });
    
    console.log('\n📊 生成器输出：');
    console.log(result);
    
    // 检查生成的文件
    if (fs.existsSync('test-gallery-index.json')) {
      const indexData = JSON.parse(fs.readFileSync('test-gallery-index.json', 'utf8'));
      console.log('\n📋 生成的索引信息：');
      console.log(`- 总照片数：${indexData.totalPhotos}`);
      console.log(`- 更新时间：${indexData.lastUpdated}`);
      console.log(`- 分类：${[...new Set(indexData.photos.flatMap(p => p.categories))].join(', ')}`);
      
      console.log('\n✅ 测试成功完成！');
      console.log('📄 生成的测试文件：test-gallery-index.json');
    } else {
      console.log('❌ 索引文件生成失败！');
    }
    
  } catch (error) {
    console.error('❌ 测试失败：', error.message);
  }
  
  // 清理提示
  console.log('\n🧹 清理测试文件：');
  console.log('rm -rf test-photos test-gallery-index.json');
}

// 如果直接运行此脚本
if (require.main === module) {
  runGeneratorTest();
}

module.exports = { createTestStructure, runGeneratorTest };