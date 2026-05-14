(function () {
  const input  = document.getElementById('project-search');
  const radios = document.querySelectorAll('input[name="filter"]');
  const cards  = document.querySelectorAll('.project-card');
  const grid   = document.getElementById('project-grid');

  if (!input || !cards.length) return;

  const radioToCat = { 'f-all': '', 'f-web': 'web', 'f-cli': 'cli', 'f-other': 'other' };

  function getActiveCat() {
    for (const r of radios) {
      if (r.checked) return radioToCat[r.id] ?? '';
    }
    return '';
  }

  function applyFilters() {
    const query = input.value.trim().toLowerCase();
    const cat   = getActiveCat();
    let visible = 0;

    cards.forEach(card => {
      const title   = card.querySelector('.project-card__title')?.textContent.toLowerCase() ?? '';
      const tag     = card.querySelector('.project-card__tag')?.textContent.toLowerCase() ?? '';
      const desc    = card.querySelector('.project-card__desc')?.textContent.toLowerCase() ?? '';
      const cardCat = card.dataset.cat ?? '';

      const matchesCat    = !cat || cardCat === cat;
      const matchesSearch = !query || title.includes(query) || tag.includes(query) || desc.includes(query);

      const show = matchesCat && matchesSearch;
      card.hidden = !show;
      if (show) visible++;
    });

    let msg = grid.querySelector('.no-results');
    if (visible === 0) {
      if (!msg) {
        msg = document.createElement('li');
        msg.className = 'no-results';
        msg.textContent = '// NO_RESULTS_FOUND';
        grid.appendChild(msg);
      }
    } else {
      msg?.remove();
    }
  }

  input.addEventListener('input', applyFilters);
  radios.forEach(r => r.addEventListener('change', applyFilters));
})();
