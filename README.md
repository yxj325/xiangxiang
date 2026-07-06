# AI 工具导航站

> 收录 300+ AI 工具，离线可用、分类清晰、支持搜索的 AI 工具导航网站。

## 项目结构

```
ai-tools-nav/
├── dist/                          # 网站构建产物（部署此目录）
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── tools-data.js              # 300+ 工具数据
├── data/                          # 工具数据源
│   ├── tools-part1.json
│   ├── tools-part2.json
│   └── tools-part3.json
├── .github/workflows/deploy.yml   # GitHub Pages 自动部署工作流
├── vercel.json                    # Vercel 部署配置（可选）
└── 部署上线指南.md
```

## 本地预览

直接用浏览器打开 `dist/index.html` 即可，纯静态站点无需构建。

或启动本地服务器：

```bash
cd dist
python -m http.server 8000
# 访问 http://localhost:8000
```

## 部署

### GitHub Pages（自动）

推送到 `main` 分支后，GitHub Actions 会自动将 `dist/` 部署到 GitHub Pages。

前置条件：仓库 `Settings → Pages → Source` 选择 **GitHub Actions**。

访问地址：`https://<用户名>.github.io/<仓库名>/`

### Vercel

```bash
npx vercel --prod
```

## 技术栈

- 纯原生 HTML / CSS / JavaScript，零依赖
- 响应式设计，移动端友好
- 数据内嵌于 tools-data.js，离线可用
