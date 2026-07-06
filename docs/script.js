/* ===== AI工具导航 - 主逻辑（500+工具版，含Logo和详细评测）===== */

// ===== 全局状态 =====
let allTools = [];
let filteredTools = [];
let displayedCount = 0;
const PAGE_SIZE = 24;
let currentCategory = 'all';
let currentPricing = 'all';
let currentSearch = '';

// ===== 分类颜色映射 =====
const CAT_COLORS = {
  '写作与内容': '#4F46E5', '图像生成': '#7C3AED', '视频制作': '#EC4899',
  '编程与开发': '#059669', '学习与教育': '#D97706', '办公与效率': '#0891B2',
  '设计与创意': '#DC2626', '营销与SEO': '#9333EA', '音频与语音': '#DB2777',
  '其他工具': '#6B7280', '办公与开发': '#0891B2'
};

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
  if (typeof TOOLS_DATA !== 'undefined' && TOOLS_DATA.length > 0) {
    allTools = TOOLS_DATA;
  } else {
    allTools = getFallbackData();
  }
  filteredTools = [...allTools];
  updateStats();
  renderFeatured();
  renderCategories();
  renderFilterTags();
  renderTools(true);
  renderFooterCats();
  initTheme();
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
  const featured = allTools.filter(t => t.featured).slice(0, 12);
  grid.innerHTML = featured.map(tool => `
    <div class="featured-card" onclick="showToolDetail(${tool.id})">
      <span class="badge">精选</span>
      <div class="card-icon">${getLogoHtml(tool, 48)}</div>
      <h3>${escapeHtml(tool.name)}</h3>
      <p>${escapeHtml(tool.desc)}</p>
      <div class="card-tags">
        <span class="tag ${tool.pricing === '免费' ? 'tag-free' : (tool.pricing === '付费' ? 'tag-paid' : 'tag-freemium')}">${tool.pricing}</span>
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
    '设计与创意': '🎯', '营销与SEO': '📈', '音频与语音': '🎵', '其他工具': '🧠',
    '办公与开发': '📋'
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
  if (slice.length === 0 && displayedCount === 0) {
    grid.innerHTML = '<div class="no-results"><div class="no-results-icon">🔍</div><h3>未找到匹配工具</h3><p>试试其他关键词或分类</p></div>';
    return;
  }
  slice.forEach(tool => {
    const card = document.createElement('div');
    card.className = 'tool-card fade-in-up';
    card.onclick = () => showToolDetail(tool.id);
    card.innerHTML = `
      <div class="tool-logo">${getLogoHtml(tool, 48)}</div>
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

// ===== Logo生成 =====
function getLogoHtml(tool, size) {
  const s = size || 48;
  const color = CAT_COLORS[tool.category] || '#4F46E5';
  const firstChar = escapeHtml(tool.name.charAt(0));
  if (tool.logo) {
    return `<img src="${escapeHtml(tool.logo)}" alt="${escapeHtml(tool.name)}" style="width:${s}px;height:${s}px;border-radius:12px;object-fit:cover;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span style="display:none;width:${s}px;height:${s}px;border-radius:12px;background:${color};color:white;font-size:${Math.floor(s*0.42)}px;font-weight:700;align-items:center;justify-content:center;">${firstChar}</span>`;
  }
  return `<span style="width:${s}px;height:${s}px;border-radius:12px;background:${color};color:white;font-size:${Math.floor(s*0.42)}px;font-weight:700;display:flex;align-items:center;justify-content:center;">${firstChar}</span>`;
}

// ===== 工具详情弹窗 =====
function showToolDetail(id) {
  const tool = allTools.find(t => t.id === id);
  if (!tool) return;
  const modal = document.getElementById('toolModal');
  if (!modal) return;

  document.getElementById('modalLogo').innerHTML = getLogoHtml(tool, 64);
  document.getElementById('modalName').textContent = tool.name;
  document.getElementById('modalNameEn').textContent = tool.nameEn || '';
  document.getElementById('modalDesc').textContent = tool.desc;

  const tagsEl = document.getElementById('modalTags');
  tagsEl.innerHTML = tool.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('');

  document.getElementById('modalCategory').innerHTML = '📂 ' + escapeHtml(tool.category);
  document.getElementById('modalPricing').innerHTML = '💰 ' + escapeHtml(tool.pricing);

  const reviewEl = document.getElementById('modalReview');
  if (tool.review) {
    reviewEl.innerHTML = tool.review.split('\n').map(line => {
      if (line.startsWith('【')) {
        const parts = line.split('】');
        return `<div class="review-line"><span class="review-label">${parts[0]}】</span><span class="review-text">${escapeHtml(parts.slice(1).join('】'))}</span></div>`;
      }
      return `<div class="review-line">${escapeHtml(line)}</div>`;
    }).join('');
    reviewEl.style.display = 'block';
  } else {
    reviewEl.style.display = 'none';
  }

  document.getElementById('modalLink').href = tool.url;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(event) {
  if (event && event.target !== event.currentTarget) return;
  const modal = document.getElementById('toolModal');
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
}

// ===== 筛选逻辑 =====
function filterByCategory(cat, btn) {
  currentCategory = cat;
  document.querySelectorAll('#filterTags .filter-tag').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  else {
    document.querySelectorAll('#filterTags .filter-tag').forEach(b => {
      if (b.textContent === cat) b.classList.add('active');
    });
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

function loadMoreTools() { renderTools(false); }

function getPricingClass(pricing) {
  if (pricing === '免费') return 'free';
  if (pricing === '付费') return 'paid';
  return 'freemium';
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
    document.getElementById('theme-icon').textContent = '🌙';
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
    document.getElementById('theme-icon').textContent = '☀️';
  }
}

// ===== 滚动行为 =====
function onScroll() {
  const backBtn = document.getElementById('backToTop');
  if (backBtn) backBtn.classList.toggle('visible', window.scrollY > 400);
  const header = document.getElementById('header');
  if (header) header.style.boxShadow = window.scrollY > 10 ? 'var(--shadow-sm)' : 'none';
}

function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

// ===== 移动端菜单 =====
function toggleMobileMenu() {
  document.getElementById('mobileMenu')?.classList.toggle('active');
}
function closeMobileMenu() {
  document.getElementById('mobileMenu')?.classList.remove('active');
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

// ===== ESC关闭弹窗 =====
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ===== 兜底数据 =====
function getFallbackData() {
  return [
    {id:1,name:"ChatGPT",nameEn:"ChatGPT",desc:"OpenAI开发的强大对话AI",category:"写作与内容",tags:["对话","写作","编程"],url:"https://chat.openai.com",logo:"",pricing:"免费增值",featured:true,review:"【功能特色】文本生成与对话。OpenAI开发的强大对话AI，支持写作、编程、翻译、分析等多种任务。\n【适用人群】内容创作者、文案策划、学生和职场人士。\n【推荐指数】★★★★★"},
    {id:2,name:"Claude",nameEn:"Claude",desc:"Anthropic开发的AI助手",category:"写作与内容",tags:["对话","长文本","写作"],url:"https://claude.ai",logo:"",pricing:"免费增值",featured:true,review:"【功能特色】文本生成与对话。\n【适用人群】内容创作者。\n【推荐指数】★★★★★"},
  ];
}
