(function () {
  const GITHUB_USER = 'antoninolm';
  const API_URL     = `https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=12&type=owner`;
  const CACHE_KEY   = 'gh_repos_v1';
  const CACHE_TTL   = 60 * 60 * 1000;

  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function getRepos() {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const data = await res.json();
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data })); } catch (_) {}
    return data;
  }

  function renderCard(repo) {
    const li = document.createElement('li');
    li.className = 'gh-card';
    li.innerHTML = `
      <a href="${esc(repo.html_url)}" class="gh-card__link" target="_blank" rel="noopener noreferrer">
        <h3 class="gh-card__name">${esc(repo.name)}</h3>
        <p class="gh-card__desc">${repo.description ? esc(repo.description) : '<span class="gh-card__no-desc">// NO_DESCRIPTION</span>'}</p>
        <div class="gh-card__meta">
          <span class="gh-card__stars">&#9733; ${esc(repo.stargazers_count)}</span>
          ${repo.language ? `<span class="gh-card__lang">${esc(repo.language)}</span>` : ''}
        </div>
        <span class="gh-card__cta">OPEN &rarr;</span>
      </a>`;
    return li;
  }

  async function init() {
    const grid = document.getElementById('github-grid');
    if (!grid) return;

    grid.innerHTML = '<li class="gh-status">// FETCHING_REPOS…</li>';

    try {
      const repos = (await getRepos()).filter(r => !r.fork).slice(0, 6);
      grid.innerHTML = '';
      if (repos.length === 0) {
        grid.innerHTML = '<li class="gh-status">// NO_PUBLIC_REPOS</li>';
        return;
      }
      repos.forEach(repo => grid.appendChild(renderCard(repo)));
    } catch {
      grid.innerHTML = `<li class="gh-status gh-status--error">// FETCH_FAILED &mdash; <a href="https://github.com/${GITHUB_USER}" target="_blank" rel="noopener">visit profile &rarr;</a></li>`;
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
