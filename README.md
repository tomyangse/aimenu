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

创建 `.env.local` 文件并添加以下环境变量：

```env
# Gemini API Key
NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### 获取 Supabase 配置

1. 访问 [Supabase](https://supabase.com) 并创建账户
2. 创建新项目
3. 在项目设置中找到 API 设置
4. 复制 `Project URL` 作为 `NEXT_PUBLIC_SUPABASE_URL`
5. 复制 `anon public` key 作为 `NEXT_PUBLIC_SUPABASE_ANON_KEY`

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

## 部署到 Vercel

1. 将项目推送到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 在环境变量中添加 `NEXT_PUBLIC_GEMINI_API_KEY`
4. 部署完成！

## 环境变量

在 Vercel 部署时，需要在项目设置中添加以下环境变量：

- `NEXT_PUBLIC_GEMINI_API_KEY`: 你的 Gemini API 密钥

