#!/usr/bin/env node

// 测试索引生成器的脚本
// 用于测试现有的图片目录结构

const fs = require('fs');
const path = require('path');

// 运行生成器测试
async function runGeneratorTest(testDir = './test-photos', outputFile = 'test-gallery-index.json', baseUrl = 'https://images.starnight.top') {
  console.log('🚀 开始测试图片索引生成器...\n');
  
  // 检查测试目录是否存在
  if (!fs.existsSync(testDir)) {
    console.error(`❌ 测试目录 ${testDir} 不存在！`);
    return;
  }
  
  console.log(`📁 扫描目录: ${testDir}`);
  console.log(`📄 输出文件: ${outputFile}`);
  console.log(`🌐 基础URL: ${baseUrl}`);
  
  // 运行生成器
  try {
    const { execSync } = require('child_process');
    const result = execSync(`node scripts/generate-gallery-index.js "${testDir}" "${outputFile}" "${baseUrl}"`, {
      encoding: 'utf8'
    });
    
    console.log('\n📊 生成器输出：');
    console.log(result);
    
    // 检查生成的文件
    if (fs.existsSync(outputFile)) {
      const indexData = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
      console.log('\n📋 生成的索引信息：');
      console.log(`- 总照片数：${indexData.totalPhotos}`);
      console.log(`- 更新时间：${indexData.lastUpdated}`);
      console.log(`- 合集数量：${indexData.collections ? indexData.collections.length : 0}`);
      
      if (indexData.collections && indexData.collections.length > 0) {
        console.log('\n📁 合集列表：');
        indexData.collections.forEach(collection => {
          console.log(`   - ${collection.displayName}: ${collection.photoCount} 张照片`);
        });
      }
      
      const categories = [...new Set(indexData.photos.flatMap(p => p.categories))];
      if (categories.length > 0) {
        console.log(`\n🏷️ 分类：${categories.join(', ')}`);
      }
      
      console.log('\n✅ 测试成功完成！');
      console.log(`📄 生成的文件：${outputFile}`);
    } else {
      console.log('❌ 索引文件生成失败！');
    }
    
  } catch (error) {
    console.error('❌ 测试失败：', error.message);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  // 从命令行参数获取配置
  const args = process.argv.slice(2);
  const testDir = args[0] || './test-photos';
  const outputFile = args[1] || 'test-gallery-index.json';
  const baseUrl = args[2] || 'https://images.starnight.top';
  
  runGeneratorTest(testDir, outputFile, baseUrl);
}

module.exports = { runGeneratorTest };