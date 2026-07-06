/* ===== AI工具导航 - 主逻辑 ===== */

// 数据来源：tools-data.js 内嵌的 TOOLS_DATA 变量
// 如果未加载到，使用兜底数据

// ===== 全局状态 =====
let allTools = [];
let filteredTools = [];
let displayedCount = 0;
const PAGE_SIZE = 20;
let currentCategory = 'all';
let currentPricing = 'all';
let currentSearch = '';

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
  // 直接使用内嵌数据
  if (typeof TOOLS_DATA !== 'undefined' && TOOLS_DATA.length > 0) {
    allTools = TOOLS_DATA;
  } else {
    allTools = getFallbackData();
  }
  filteredTools = [...allTools];

  // 更新统计
  updateStats();
  // 渲染精选
  renderFeatured();
  // 渲染分类
  renderCategories();
  // 渲染筛选标签
  renderFilterTags();
  // 渲染工具列表
  renderTools(true);
  // 渲染页脚分类
  renderFooterCats();
  // 主题初始化
  initTheme();
  // 滚动监听
  window.addEventListener('scroll', onScroll);
});

// ===== 统计数字动画 =====
function updateStats() {
  const cats = [...new Set(allTools.map(t => t.category))];
  const free = allTools.filter(t => t.pricing === '免费' || t.pricing === '免费增值');
  const featured = allTools.filter(t => t.featured);

  animateNum('totalCount', allTools.length);
  animateNum('catCount', cats.length);
  animateNum('freeCount', free.length);
  animateNum('featuredCount', featured.length);
}

function animateNum(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let current = 0;
  const step = Math.max(1, Math.floor(target / 30));
  const timer = setInterval(() => {
    current += step;
    if (current >= target) { current = target; clearInterval(timer); }
    el.textContent = current;
  }, 20);
}

// ===== 精选推荐 =====
function renderFeatured() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;
  const featured = allTools.filter(t => t.featured).slice(0, 8);
  grid.innerHTML = featured.map(tool => `
    <div class="featured-card" onclick="openTool('${tool.url.replace(/'/g, "\\'")}')">
      <span class="badge">精选</span>
      <div class="card-icon">${getIcon(tool)}</div>
      <h3>${escapeHtml(tool.name)}</h3>
      <p>${escapeHtml(tool.desc)}</p>
      <div class="card-tags">
        <span class="tag ${tool.pricing === '免费' ? 'tag-free' : 'tag-paid'}">${tool.pricing}</span>
        ${tool.tags.slice(0, 2).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
      </div>
    </div>
  `).join('');
}

// ===== 分类浏览 =====
function renderCategories() {
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;
  const catMap = {};
  allTools.forEach(t => {
    if (!catMap[t.category]) catMap[t.category] = 0;
    catMap[t.category]++;
  });
  const catIcons = {
    '写作与内容': '✍️', '图像生成': '🎨', '视频制作': '🎬',
    '编程与开发': '💻', '学习与教育': '📚', '办公与效率': '📋',
    '设计与创意': '🎯', '营销与SEO': '📈', '音频与语音': '🎵', '其他工具': '🧠'
  };
  grid.innerHTML = Object.entries(catMap).map(([cat, count]) => `
    <div class="cat-card" onclick="filterByCategory('${cat.replace(/'/g, "\\'")}', null)">
      <div class="cat-icon">${catIcons[cat] || '🧠'}</div>
      <div class="cat-name">${escapeHtml(cat)}</div>
      <div class="cat-count">${count} 款工具</div>
    </div>
  `).join('');
}

// ===== 筛选标签 =====
function renderFilterTags() {
  const container = document.getElementById('filterTags');
  if (!container) return;
  const cats = [...new Set(allTools.map(t => t.category))];
  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-tag';
    btn.textContent = cat;
    btn.onclick = () => filterByCategory(cat, btn);
    container.appendChild(btn);
  });
  // 默认选中"全部"
  const firstTag = container.querySelector('.filter-tag');
  if (firstTag) firstTag.classList.add('active');
}

// ===== 渲染工具列表 =====
function renderTools(reset = false) {
  const grid = document.getElementById('toolsGrid');
  if (!grid) return;
  if (reset) {
    displayedCount = 0;
    grid.innerHTML = '';
    const loadMore = document.getElementById('loadMore');
    if (loadMore) loadMore.style.display = 'block';
  }
  const slice = filteredTools.slice(displayedCount, displayedCount + PAGE_SIZE);
  displayedCount += slice.length;
  if (displayedCount >= filteredTools.length) {
    const loadMore = document.getElementById('loadMore');
    if (loadMore) loadMore.style.display = 'none';
  }
  slice.forEach(tool => {
    const card = document.createElement('div');
    card.className = 'tool-card';
    card.onclick = () => openTool(tool.url);
    card.innerHTML = `
      <div class="tool-logo">${getIcon(tool)}</div>
      <div class="tool-info">
        <h3>${escapeHtml(tool.name)}</h3>
        <div class="tool-desc">${escapeHtml(tool.desc)}</div>
        <div class="tool-meta">
          <span class="tool-category">${escapeHtml(tool.category)}</span>
          <span class="tool-pricing pricing-${getPricingClass(tool.pricing)}">${tool.pricing}</span>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ===== 筛选逻辑 =====
function filterByCategory(cat, btn) {
  currentCategory = cat;
  document.querySelectorAll('.filter-tag').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  else {
    const firstTag = document.querySelector('.filter-tag');
    if (firstTag) firstTag.classList.add('active');
  }
  applyFilters();
}

function filterByPricing(pricing, btn) {
  currentPricing = currentPricing === pricing ? 'all' : pricing;
  document.querySelectorAll('.filter-pricing .filter-tag').forEach(b => {
    b.classList.toggle('active', b.textContent === currentPricing && currentPricing !== 'all');
  });
  applyFilters();
}

function applyFilters() {
  filteredTools = allTools.filter(tool => {
    let ok = true;
    if (currentCategory !== 'all') ok = ok && tool.category === currentCategory;
    if (currentPricing !== 'all') ok = ok && tool.pricing === currentPricing;
    if (currentSearch) {
      const q = currentSearch.toLowerCase();
      ok = ok && (
        tool.name.toLowerCase().includes(q) ||
        tool.desc.toLowerCase().includes(q) ||
        tool.tags.some(tag => tag.toLowerCase().includes(q)) ||
        tool.category.toLowerCase().includes(q)
      );
    }
    return ok;
  });
  renderTools(true);
}

// ===== 搜索 =====
function handleSearch(val) {
  currentSearch = val.trim();
  const clearBtn = document.getElementById('searchClear');
  if (clearBtn) clearBtn.classList.toggle('visible', currentSearch.length > 0);
  clearTimeout(window._searchTimer);
  window._searchTimer = setTimeout(() => {
    applyFilters();
    if (currentSearch.length > 0) {
      const section = document.getElementById('all-tools');
      if (section) section.scrollIntoView({ behavior: 'smooth' });
    }
  }, 200);
}

function clearSearch() {
  const input = document.getElementById('searchInput');
  if (input) input.value = '';
  currentSearch = '';
  const clearBtn = document.getElementById('searchClear');
  if (clearBtn) clearBtn.classList.remove('visible');
  applyFilters();
}

// ===== 加载更多 =====
function loadMoreTools() {
  renderTools(false);
}

// ===== 工具图标 =====
function getIcon(tool) {
  if (tool.logo) {
    return `<img src="${escapeHtml(tool.logo)}" alt="${escapeHtml(tool.name)}" onerror="this.parentElement.innerHTML='<span style=&quot;font-size:20px;font-weight:700;color:var(--primary);&quot;>${escapeHtml(tool.name.charAt(0))}</span>'">`;
  }
  return `<span style="font-size:20px;font-weight:700;color:var(--primary);">${escapeHtml(tool.name.charAt(0))}</span>`;
}

function getPricingClass(pricing) {
  if (pricing === '免费') return 'free';
  if (pricing === '付费') return 'paid';
  return 'freemium';
}

// ===== 打开工具 =====
function openTool(url) {
  window.open(url, '_blank', 'noopener');
}

// ===== 主题切换 =====
function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.setAttribute('data-theme', 'dark');
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = '☀️';
  }
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = '🌙';
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = '☀️';
  }
}

// ===== 滚动行为 =====
function onScroll() {
  const backBtn = document.getElementById('backToTop');
  if (backBtn) {
    backBtn.classList.toggle('visible', window.scrollY > 400);
  }
  const header = document.getElementById('header');
  if (header) {
    header.style.boxShadow = window.scrollY > 10 ? 'var(--shadow-sm)' : 'none';
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== 移动端菜单 =====
function toggleMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  if (menu) menu.classList.toggle('active');
}

function closeMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  if (menu) menu.classList.remove('active');
}

// ===== 页脚分类 =====
function renderFooterCats() {
  const el = document.getElementById('footerCats');
  if (!el) return;
  const cats = [...new Set(allTools.map(t => t.category))].slice(0, 6);
  el.innerHTML = cats.map(cat => `<li><a href="#all-tools" onclick="filterByCategory('${cat.replace(/'/g, "\\'")}', null)">${escapeHtml(cat)}</a></li>`).join('');
}

// ===== 工具函数 =====
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ===== 兜底数据 =====
function getFallbackData() {
  return [
    {id:1,name:"ChatGPT",nameEn:"ChatGPT",desc:"OpenAI开发的强大对话AI，支持写作、编程、翻译、分析等多种任务",category:"写作与内容",tags:["对话","写作","编程","免费"],url:"https://chat.openai.com",logo:"",pricing:"免费增值",featured:true},
    {id:2,name:"Claude",nameEn:"Claude",desc:"Anthropic开发的AI助手，擅长长文本分析、写作和安全对话",category:"写作与内容",tags:["对话","长文本","写作","安全"],url:"https://claude.ai",logo:"",pricing:"免费增值",featured:true},
    {id:9,name:"DeepSeek",nameEn:"DeepSeek",desc:"国产开源大模型，擅长数学推理和代码生成，完全免费",category:"编程与开发",tags:["开源","推理","代码","免费"],url:"https://chat.deepseek.com",logo:"",pricing:"免费",featured:true},
    {id:20,name:"GitHub Copilot",nameEn:"GitHub Copilot",desc:"GitHub与OpenAI联合开发的代码助手，支持多种编程语言",category:"编程与开发",tags:["代码补全","编程","付费"],url:"https://github.com/features/copilot",logo:"",pricing:"付费",featured:true},
    {id:25,name:"Perplexity",nameEn:"Perplexity AI",desc:"AI搜索引擎，直接给出答案并附带来源引用",category:"学习与教育",tags:["搜索","问答","免费"],url:"https://www.perplexity.ai",logo:"",pricing:"免费增值",featured:true},
    {id:38,name:"ElevenLabs",nameEn:"ElevenLabs",desc:"顶级AI语音合成平台，支持多语言、多情感和克隆声音",category:"音频与语音",tags:["语音合成","配音","付费"],url:"https://elevenlabs.io",logo:"",pricing:"免费增值",featured:true},
    {id:47,name:"Gemini",nameEn:"Google Gemini",desc:"Google开发的AI大模型，集成在Google工作中，支持多模态",category:"写作与内容",tags:["对话","多模态","免费"],url:"https://gemini.google.com",logo:"",pricing:"免费增值",featured:true},
    {id:55,name:"Gamma",nameEn:"Gamma",desc:"AI演示文稿生成器，几秒内生成精美PPT、文档和网页",category:"办公与效率",tags:["PPT生成","免费增值"],url:"https://gamma.app",logo:"",pricing:"免费增值",featured:true},
    {id:57,name:"HeyGen",nameEn:"HeyGen",desc:"AI数字人视频生成平台，上传照片即可生成多语言AI口播视频",category:"视频制作",tags:["数字人","口播视频","付费"],url:"https://www.heygen.com",logo:"",pricing:"付费",featured:true},
    {id:68,name:"Windsurf",nameEn:"Windsurf",desc:"Codeium开发的AI代码编辑器，支持多文件编辑和AI对话",category:"编程与开发",tags:["代码编辑器","AI编程","免费增值"],url:"https://codeium.com/windsurf",logo:"",pricing:"免费增值",featured:true},
    {id:95,name:"Immersive Translate",nameEn:"Immersive Translate",desc:"AI双语翻译浏览器插件，支持网页、PDF、视频字幕翻译",category:"办公与效率",tags:["翻译","浏览器插件","免费增值"],url:"https://immersivetranslate.com",logo:"",pricing:"免费增值",featured:true},
    {id:98,name:"Obsidian",nameEn:"Obsidian",desc:"本地优先的知识库工具，支持双向链接和丰富插件",category:"办公与效率",tags:["知识库","双向链接","免费增值"],url:"https://obsidian.md",logo:"",pricing:"免费增值",featured:true}
  ];
}
