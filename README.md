# Photo Gallery with GitHub Integration

一个支持从GitHub仓库动态加载图片的React画廊项目。

## 功能特点

- 📸 自动从GitHub仓库读取图片
- 🤖 GitHub Actions自动生成图片索引
- 🏷️ 智能分类识别
- 📱 响应式设计
- 🔄 实时数据更新
- 💾 失败时自动降级到本地mock数据

## 设置指南

### 1. 创建图片存储仓库

首先创建一个新的GitHub仓库来存储你的图片，建议目录结构：

```
your-photo-repo/
├── photos/
│   ├── 2024/
│   │   ├── nature/
│   │   ├── urban/
│   │   ├── portrait/
│   │   └── travel/
│   └── 2025/
├── scripts/
│   └── generate-gallery-index.js
├── .github/
│   └── workflows/
│       └── update-gallery.yml
└── gallery-index.json  # 自动生成
```

### 2. 复制必要文件

将以下文件复制到你的图片仓库：

- `scripts/generate-gallery-index.js`
- `.github/workflows/update-gallery.yml`

### 3. 配置环境变量

创建 `.env.local` 文件并配置：

```env
NEXT_PUBLIC_GITHUB_OWNER=your-username
NEXT_PUBLIC_GITHUB_REPO=your-photo-repo
NEXT_PUBLIC_GITHUB_BRANCH=main
NEXT_PUBLIC_INDEX_FILE=gallery-index.json
```

### 4. PicGo配置

配置PicGo直接上传到你的GitHub图片仓库：

1. 打开PicGo设置
2. 选择GitHub图床
3. 填入仓库信息：`your-username/your-photo-repo`
4. 设置分支：`main`
5. 设置存储路径：`photos/2024/` (或你想要的路径)
6. 设置Token：创建GitHub Personal Access Token

### 5. 自动化工作流

当你通过PicGo上传图片到GitHub仓库后：

1. GitHub Actions会自动触发
2. 扫描`photos/`目录下的所有图片
3. 生成包含图片信息的`gallery-index.json`
4. 自动提交更新到仓库

### 6. 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建项目
npm run build
```

## 新的分类系统

### Collections（合集）
- **基于文件夹名称**：直接使用文件夹名称作为合集名称
- **示例**：`photos/2024/上海旅游/` → 合集名称为 "上海旅游"
- **展示**：在 `/collections` 页面以卡片形式展示所有合集

### Categories（分类）  
- **基于文件名标签**：使用 `-` 或 `_` 分隔文件名中的标签
- **示例**：`DSC0258_flower_suzhou.jpg` → 分类为 ["Flower", "Suzhou"]
- **规则**：
  - 跳过第一部分（主文件名）
  - 过滤掉纯数字和常见词汇（copy, final, edit, new）
  - 自动格式化标签名称（首字母大写）

### 文件组织建议

```
photos/
├── 2024/
│   ├── 上海旅游/           # 合集：上海旅游
│   │   ├── DSC001_sunset_bund.jpg      # 分类：[Sunset, Bund]
│   │   ├── IMG002_food_xiaolongbao.jpg # 分类：[Food, Xiaolongbao]
│   │   └── photo_architecture_tower.png # 分类：[Architecture, Tower]
│   └── 北京游记/           # 合集：北京游记
│       ├── beijing_001_palace_forbidden.jpg # 分类：[Palace, Forbidden]
│       └── travel_temple_summer.jpg         # 分类：[Temple, Summer]
└── 2025/
    └── 日常摄影/           # 合集：日常摄影
        └── daily_cat_cute.jpg              # 分类：[Cat, Cute]
```

## 数据格式

生成的`gallery-index.json`格式：

```json
{
  "lastUpdated": "2024-08-15T12:00:00.000Z",
  "totalPhotos": 150,
  "photos": [
    {
      "id": "unique-photo-id",
      "src": "https://raw.githubusercontent.com/user/repo/main/photos/image.jpg",
      "title": "Beautiful Sunset",
      "categories": ["Nature", "Landscape"],
      "photographer": "Unknown",
      "likes": 42,
      "description": "A beautiful photograph captured with professional equipment.",
      "filename": "sunset.jpg",
      "width": 1920,
      "height": 1080,
      "exif": {
        "camera": "Canon EOS R5",
        "lens": "24-70mm f/2.8",
        "iso": 100,
        "aperture": "f/8",
        "shutterSpeed": "1/125",
        "focalLength": "35mm",
        "dateTaken": "2024-08-15",
        "fileSize": "8.2 MB",
        "dimensions": "6720 × 4480"
      }
    }
  ]
}
```

## 手动触发索引更新

如果需要手动触发索引更新：

1. 进入GitHub仓库的Actions页面
2. 选择"Update Gallery Index"工作流
3. 点击"Run workflow"

## 故障排除

### 1. 无法加载远程数据
- 检查环境变量配置是否正确
- 确认GitHub仓库是公开的
- 检查`gallery-index.json`文件是否存在

### 2. GitHub Actions失败
- 检查仓库权限设置
- 确认工作流文件语法正确
- 查看Actions日志了解具体错误

### 3. 图片分类不正确
- 调整文件夹结构
- 修改`generate-gallery-index.js`中的分类规则

## 开发说明

项目支持优雅降级：
- 优先使用GitHub仓库数据
- 如果远程数据加载失败，自动使用本地mock数据
- 显示友好的错误提示

## 贡献

欢迎提交Issue和Pull Request来改进这个项目！