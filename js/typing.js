const PHRASES = [
  "I build the web with stubborn HTML, opinionated CSS, and absolutely zero JavaScript.",
  "I write CSS that doesn't apologize for having opinions.",
  "Static sites. Fast loads. Zero dependencies. Just the way I like it.",
  "Front-of-the-front is where I do my best work.",
];

const TYPE_SPEED   = 40;
const DELETE_SPEED = 18;
const PAUSE_AFTER  = 2400;
const PAUSE_BEFORE = 500;

function typewriter(el, phrases) {
  let phraseIndex = 0;
  let charIndex   = 0;
  let deleting    = false;

  const sr = document.createElement('span');
  sr.className = 'sr-only';
  sr.textContent = phrases[0];
  el.insertAdjacentElement('afterend', sr);
  el.setAttribute('aria-hidden', 'true');

  const cursor = document.createElement('span');
  cursor.className = 'typewriter-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  sr.insertAdjacentElement('afterend', cursor);

  function tick() {
    const phrase = phrases[phraseIndex];
    if (!deleting) {
      el.textContent = phrase.slice(0, ++charIndex);
      if (charIndex === phrase.length) {
        deleting = true;
        setTimeout(tick, PAUSE_AFTER);
        return;
      }
      setTimeout(tick, TYPE_SPEED);
    } else {
      el.textContent = phrase.slice(0, --charIndex);
      if (charIndex === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        setTimeout(tick, PAUSE_BEFORE);
        return;
      }
      setTimeout(tick, DELETE_SPEED);
    }
  }

  el.textContent = '';
  tick();
}

document.addEventListener('DOMContentLoaded', () => {
  const el = document.querySelector('.hero__tagline');
  if (el) typewriter(el, PHRASES);
});
