(function () {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;

  let ticking = false;

  function update() {
    const scrolled = window.scrollY;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const pct = total > 0 ? Math.round((scrolled / total) * 100) : 0;

    bar.style.setProperty('--progress', pct + '%');
    bar.setAttribute('aria-valuenow', pct);
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
})();
