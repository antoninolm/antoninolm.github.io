// ── Scroll progress bar ───────────────────────────────────────────────────────
function updateProgress() {
  const total = document.documentElement.scrollHeight - window.innerHeight;
  const pct   = total > 0 ? (window.scrollY / total) * 100 : 0;
  document.documentElement.style.setProperty('--progress', pct + '%');
}
window.addEventListener('scroll', updateProgress, { passive: true });

// ── Theme persistence (localStorage) ─────────────────────────────────────────
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark')  themeToggle.checked = true;
  if (saved === 'light') themeToggle.checked = false;
  themeToggle.addEventListener('change', () => {
    localStorage.setItem('theme', themeToggle.checked ? 'dark' : 'light');
  });
}

// ── Project search + category filter ─────────────────────────────────────────
const searchInput  = document.getElementById('project-search');
const projectCards = document.querySelectorAll('#project-grid .project-card');

function filterProjects() {
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const active = document.querySelector('input[name="filter"]:checked');
  const cat    = active ? active.id.replace('f-', '') : 'all';

  projectCards.forEach(card => {
    const matchesSearch = !query || card.textContent.toLowerCase().includes(query);
    const matchesFilter = cat === 'all' || card.dataset.cat === cat;
    card.hidden = !(matchesSearch && matchesFilter);
  });
}

if (searchInput) {
  searchInput.addEventListener('input', filterProjects);
}
document.querySelectorAll('input[name="filter"]').forEach(r => {
  r.addEventListener('change', filterProjects);
});

// ── Typewriter on hero name ───────────────────────────────────────────────────
function typewriter(el, speed = 55) {
  const text = el.textContent;
  el.textContent = '';
  const cursor = document.createElement('span');
  cursor.className = 'typewriter-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  el.appendChild(cursor);
  let i = 0;
  const tick = setInterval(() => {
    if (i >= text.length) { clearInterval(tick); cursor.remove(); return; }
    el.insertBefore(document.createTextNode(text[i]), cursor);
    i++;
  }, speed);
}

const heroName = document.querySelector('.hero__name');
if (heroName) typewriter(heroName);

// ── GitHub API repos ──────────────────────────────────────────────────────────
const GITHUB_USER = 'antoninolm';
const reposGrid   = document.getElementById('github-grid');

async function loadGithubRepos() {
  if (!reposGrid) return;
  reposGrid.innerHTML = '<li class="github-loading">LOADING_REPOS…</li>';

  try {
    const res = await fetch(
      `https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=12`
    );
    if (!res.ok) throw new Error('API error');

    const repos = await res.json();
    const visible = repos.filter(r => !r.fork).slice(0, 6);

    if (visible.length === 0) {
      reposGrid.innerHTML = '<li class="github-empty">No public repos found.</li>';
      return;
    }

    reposGrid.innerHTML = visible.map(repo => `
      <li class="project-card">
        <a href="${repo.html_url}" target="_blank" rel="noopener" class="project-card__link">
          <div class="project-card__thumb project-card__thumb--github">
            <span class="github-lang">${repo.language || '—'}</span>
          </div>
          <div class="project-card__body">
            <span class="project-card__tag">GITHUB</span>
            <h3 class="project-card__title">${repo.name.toUpperCase().replace(/-/g, ' ')}</h3>
            <p class="project-card__desc">${repo.description || 'No description.'}</p>
            <span class="project-card__cta">★ ${repo.stargazers_count} &nbsp;·&nbsp; VIEW ON GITHUB &rarr;</span>
          </div>
        </a>
      </li>
    `).join('');
  } catch {
    reposGrid.innerHTML = '<li class="github-empty">Could not load repos — check your connection.</li>';
  }
}

loadGithubRepos();
