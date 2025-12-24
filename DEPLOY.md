# 部署到 GitHub 和 Vercel

## 步骤 1: 在 GitHub 创建仓库

1. 访问 https://github.com/new
2. 仓库名称填写: `aimenu`
3. 选择 **Public** (公开)
4. **不要**勾选 "Initialize this repository with a README"（我们已经有了）
5. 点击 "Create repository"

## 步骤 2: 推送代码到 GitHub

创建仓库后，GitHub 会显示推送命令。或者运行以下命令：

```bash
git remote add origin https://github.com/YOUR_USERNAME/aimenu.git
git branch -M main
git push -u origin main
```

将 `YOUR_USERNAME` 替换为你的 GitHub 用户名。

## 步骤 3: 部署到 Vercel

1. 访问 https://vercel.com
2. 点击 "Add New Project"
3. 导入你的 GitHub 仓库 `aimenu`
4. 在 "Environment Variables" 中添加：
   - 名称: `NEXT_PUBLIC_GEMINI_API_KEY`
   - 值: 你的 Gemini API 密钥
5. 点击 "Deploy"

部署完成后，Vercel 会提供一个 URL，你的应用就可以访问了！

