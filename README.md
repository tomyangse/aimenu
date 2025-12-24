# 餐厅点菜助手

一个基于 Next.js (App Router) 的 web 应用，使用 Tailwind CSS 和 shadcn/ui 进行美化。核心功能是通过 Gemini API 识别、翻译和深度解读菜单图片。

## 功能特性

- 📸 上传菜单图片
- 🤖 使用 Gemini API 进行图片识别
- 🌍 自动翻译菜单内容
- 📖 深度解读菜品信息

## 技术栈

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**
- **Google Generative AI (Gemini)**

## 开始使用

### 安装依赖

```bash
npm install
```

### 配置环境变量

创建 `.env.local` 文件并添加你的 Gemini API 密钥：

```
NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
```

### 运行开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 项目结构

```
aimenu/
├── app/              # Next.js App Router 页面
├── components/       # React 组件
│   └── ui/          # shadcn/ui 组件
├── lib/             # 工具函数和 API 客户端
└── public/          # 静态资源
```

