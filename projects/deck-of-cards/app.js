class Card {
  constructor(suit, value) {
    this.suit = suit;
    this.value = value;
    this.faceUp = false;
  }

  flip() {
    this.faceUp = !this.faceUp;
    return this;
  }

  color() {
    return this.suit === '♥' || this.suit === '♦' ? 'red' : 'black';
  }

  toString() {
    return `${this.value}${this.suit}`;
  }
}

class Deck {
  constructor() {
    this.reset();
  }

  reset() {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    this.cards = suits.flatMap(suit => values.map(value => new Card(suit, value)));
    return this;
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
    return this;
  }

  draw() {
    return this.cards.length > 0 ? this.cards.pop() : null;
  }

  deal(n) {
    const drawn = [];
    for (let i = 0; i < n && this.cards.length > 0; i++) {
      drawn.push(this.cards.pop());
    }
    return drawn;
  }

  get remaining() {
    return this.cards.length;
  }
}

class Hand {
  constructor() {
    this.cards = [];
  }

  add(card) {
    if (card) this.cards.push(card);
    return this;
  }

  clear() {
    this.cards = [];
    return this;
  }

  get count() {
    return this.cards.length;
  }
}

// --- DOM wiring ---

const deck = new Deck();
const hand = new Hand();

const deckCount = document.getElementById('deck-count');
const handCount = document.getElementById('hand-count');
const handArea = document.getElementById('hand-area');
const deckPile = document.getElementById('deck-pile');

const btnShuffle = document.getElementById('btn-shuffle');
const btnDraw = document.getElementById('btn-draw');
const btnDeal = document.getElementById('btn-deal');
const btnReset = document.getElementById('btn-reset');

function makeCardEl(card) {
  card.faceUp = true;
  const el = document.createElement('div');
  el.className = `card${card.color() === 'red' ? ' card--red' : ''}`;
  el.setAttribute('aria-label', card.toString());

  const corner = document.createElement('span');
  corner.className = 'card-corner';
  corner.textContent = card.value;

  const suitEl = document.createElement('span');
  suitEl.className = 'card-suit';
  suitEl.textContent = card.suit;

  el.appendChild(corner);
  el.appendChild(suitEl);
  return el;
}

function updateDeckUI() {
  deckCount.textContent = deck.remaining;
  deckPile.classList.toggle('deck-pile--empty', deck.remaining === 0);
  btnDraw.disabled = deck.remaining === 0;
  btnDeal.disabled = deck.remaining === 0;
}

function updateHandUI() {
  handCount.textContent = hand.count;
  handArea.innerHTML = '';
  hand.cards.forEach(card => handArea.appendChild(makeCardEl(card)));
}

function animateShuffle() {
  deckPile.classList.add('shuffling');
  setTimeout(() => deckPile.classList.remove('shuffling'), 400);
}

btnShuffle.addEventListener('click', () => {
  deck.shuffle();
  animateShuffle();
  updateDeckUI();
});

btnDraw.addEventListener('click', () => {
  const card = deck.draw();
  if (card) {
    hand.add(card);
    updateDeckUI();
    updateHandUI();
  }
});

btnDeal.addEventListener('click', () => {
  hand.clear();
  const cards = deck.deal(5);
  cards.forEach(c => hand.add(c));
  updateDeckUI();
  updateHandUI();
});

btnReset.addEventListener('click', () => {
  deck.reset();
  hand.clear();
  updateDeckUI();
  updateHandUI();
});

updateDeckUI();
updateHandUI();
