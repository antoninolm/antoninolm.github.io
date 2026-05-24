// === API LAYER ===

const API_BASE = 'https://deckofcardsapi.com/api/deck';

const SUIT_MAP = { HEARTS: '♥', DIAMONDS: '♦', CLUBS: '♣', SPADES: '♠' };
const VALUE_MAP = { ACE: 'A', JACK: 'J', QUEEN: 'Q', KING: 'K' };

function apiCardToCard(apiCard) {
  return new Card(SUIT_MAP[apiCard.suit], VALUE_MAP[apiCard.value] || apiCard.value);
}

async function createDeck() {
  const res = await fetch(`${API_BASE}/new/shuffle/?deck_count=1`);
  const data = await res.json();
  if (!data.success) throw new Error('Failed to create deck');
  return data.deck_id;
}

async function reshuffleDeck(deckId) {
  await fetch(`${API_BASE}/${deckId}/shuffle/`);
}

async function drawCards(deckId, count) {
  const res = await fetch(`${API_BASE}/${deckId}/draw/?count=${count}`);
  const data = await res.json();
  if (!data.success) throw new Error('Failed to draw cards');
  return data.cards.map(apiCardToCard);
}

// === HAND EVALUATOR ===

class HandEvaluator {
  static _val(card) {
    const m = { A: 14, K: 13, Q: 12, J: 11 };
    return m[card.value] ?? parseInt(card.value);
  }

  static _combos(arr, k) {
    if (k === 0) return [[]];
    if (arr.length < k) return [];
    const [head, ...tail] = arr;
    return [
      ...this._combos(tail, k - 1).map(c => [head, ...c]),
      ...this._combos(tail, k),
    ];
  }

  static _groupByVal(cards) {
    const g = {};
    for (const c of cards) { const v = this._val(c); g[v] = (g[v] || 0) + 1; }
    return g;
  }

  static _straight(vals) {
    if (vals[0] === 14 && vals[1] === 5 && vals[2] === 4 && vals[3] === 3 && vals[4] === 2)
      return [5, 4, 3, 2, 1];
    for (let i = 0; i < 4; i++) if (vals[i] - vals[i + 1] !== 1) return null;
    return vals;
  }

  static _eval5(five) {
    const vals = five.map(c => this._val(c)).sort((a, b) => b - a);
    const flush = five.every(c => c.suit === five[0].suit);
    const str = this._straight(vals);
    const g = this._groupByVal(five);
    const counts = Object.values(g).sort((a, b) => b - a);
    const byGroup = Object.entries(g)
      .sort((a, b) => b[1] - a[1] || Number(b[0]) - Number(a[0]))
      .map(([v]) => Number(v));

    if (flush && str) return { rank: 8, name: vals[0] === 14 && str[0] === 14 ? 'Royal Flush' : 'Straight Flush', tb: str };
    if (counts[0] === 4) return { rank: 7, name: 'Four of a Kind', tb: byGroup };
    if (counts[0] === 3 && counts[1] === 2) return { rank: 6, name: 'Full House', tb: byGroup };
    if (flush) return { rank: 5, name: 'Flush', tb: vals };
    if (str)   return { rank: 4, name: 'Straight', tb: str };
    if (counts[0] === 3) return { rank: 3, name: 'Three of a Kind', tb: byGroup };
    if (counts[0] === 2 && counts[1] === 2) return { rank: 2, name: 'Two Pair', tb: byGroup };
    if (counts[0] === 2) return { rank: 1, name: 'One Pair', tb: byGroup };
    return { rank: 0, name: 'High Card', tb: vals };
  }

  static evaluate(cards) {
    if (cards.length >= 5) {
      return this._combos(cards, 5).reduce((best, five) => {
        const r = this._eval5(five);
        return this.compare(r, best) > 0 ? r : best;
      }, this._eval5(this._combos(cards, 5)[0]));
    }
    // Partial hand (< 5 cards)
    const vals = cards.map(c => this._val(c)).sort((a, b) => b - a);
    const counts = Object.values(this._groupByVal(cards)).sort((a, b) => b - a);
    if (counts[0] >= 2) return { rank: 1, name: 'One Pair', tb: vals };
    return { rank: 0, name: 'High Card', tb: vals };
  }

  static compare(a, b) {
    if (a.rank !== b.rank) return a.rank - b.rank;
    const len = Math.max(a.tb.length, b.tb.length);
    for (let i = 0; i < len; i++) {
      const d = (a.tb[i] || 0) - (b.tb[i] || 0);
      if (d !== 0) return d;
    }
    return 0;
  }
}

// === CPU PLAYER ===

class CPUPlayer {
  static decide(cpuCards, community, pot, callAmt, cpuChips, bigBlind) {
    const available = [...cpuCards, ...community];
    const rank = available.length > 0 ? HandEvaluator.evaluate(available).rank : 0;

    if (callAmt <= 0) {
      if (rank >= 2 || Math.random() < 0.15) return { action: 'raise', amount: bigBlind };
      return { action: 'check' };
    }

    if (rank >= 3) return { action: 'raise', amount: callAmt };
    if (rank >= 1 || Math.random() < 0.15) return { action: 'call' };
    return { action: 'fold' };
  }
}

// === POKER GAME ===

class PokerGame {
  constructor(onUpdate) {
    this.onUpdate = onUpdate;
    this.bigBlind = 20;
    this.smallBlind = 10;
    this.deckId = null;
    this.phase = 'idle';
    this.playerChips = 0;
    this.cpuChips = 0;
    this.pot = 0;
    this.currentBet = 0;
    this.playerBetRound = 0;
    this.cpuBetRound = 0;
    this.playerHand = [];
    this.cpuHand = [];
    this.community = [];
    this.statusMsg = '';
  }

  async newGame() {
    this.playerChips = 1000;
    this.cpuChips = 1000;
    this.pot = 0;
    this.playerHand = [];
    this.cpuHand = [];
    this.community = [];
    this.deckId = null;
    this.phase = 'idle';
    this.statusMsg = 'Connecting to card API...';
    this.onUpdate(this);
    try {
      this.deckId = await createDeck();
      this.statusMsg = 'Ready — deal a hand to begin.';
    } catch {
      this.statusMsg = 'Could not reach card API. Check your connection and reload.';
    }
    this.onUpdate(this);
  }

  async startHand() {
    if (!this.deckId) return;
    this.statusMsg = 'Dealing...';
    this.onUpdate(this);

    try {
      await reshuffleDeck(this.deckId);
    } catch { /* ignore — draw will fail loudly if truly broken */ }

    this.pot = 0;
    this.community = [];
    this.playerHand = [];
    this.cpuHand = [];
    this.currentBet = 0;
    this.playerBetRound = 0;
    this.cpuBetRound = 0;

    // Post blinds
    const sb = Math.min(this.smallBlind, this.playerChips);
    const bb = Math.min(this.bigBlind, this.cpuChips);
    this.playerChips -= sb;
    this.pot += sb;
    this.playerBetRound = sb;
    this.cpuChips -= bb;
    this.pot += bb;
    this.cpuBetRound = bb;
    this.currentBet = bb;

    try {
      const cards = await drawCards(this.deckId, 4);
      this.playerHand = cards.slice(0, 2);
      this.cpuHand = cards.slice(2, 4);
    } catch {
      this.statusMsg = 'Failed to deal cards. Try again.';
      this.phase = 'idle';
      // Refund blinds
      this.playerChips += sb;
      this.cpuChips += bb;
      this.pot = 0;
      this.onUpdate(this);
      return;
    }

    this.phase = 'pre-flop';
    this.statusMsg = `Blinds — you $${sb}, CPU $${bb}. Your turn.`;
    this.onUpdate(this);
  }

  async playerAction(action, raiseTotal) {
    if (!['pre-flop', 'flop', 'turn', 'river'].includes(this.phase)) return;

    const callAmt = Math.max(0, this.currentBet - this.playerBetRound);

    if (action === 'fold') {
      this.cpuChips += this.pot;
      this.pot = 0;
      this.statusMsg = 'You folded. CPU wins the pot.';
      this._endHand();
      return;
    }

    if (action === 'call') {
      const toAdd = Math.min(callAmt, this.playerChips);
      this.playerChips -= toAdd;
      this.pot += toAdd;
      this.playerBetRound += toAdd;
      this.statusMsg = `You call $${toAdd}.`;
    }

    if (action === 'raise') {
      const target = Math.min(raiseTotal, this.playerBetRound + this.playerChips);
      const toAdd = target - this.playerBetRound;
      if (toAdd > 0) {
        this.playerChips -= toAdd;
        this.pot += toAdd;
        this.playerBetRound = target;
        this.currentBet = Math.max(this.currentBet, target);
        this.statusMsg = `You raise to $${target}.`;
      }
    }

    if (action === 'check') {
      this.statusMsg = 'You check.';
    }

    await this._cpuTurn();
  }

  async _cpuTurn() {
    const callAmt = Math.max(0, this.currentBet - this.cpuBetRound);
    const dec = CPUPlayer.decide(
      this.cpuHand, this.community, this.pot, callAmt, this.cpuChips, this.bigBlind
    );

    if (dec.action === 'fold') {
      this.playerChips += this.pot;
      this.pot = 0;
      this.statusMsg += ' CPU folds — you win the pot!';
      this._endHand();
      return;
    }

    if (dec.action === 'check') {
      this.statusMsg += ' CPU checks.';
    }

    if (dec.action === 'call') {
      const toAdd = Math.min(callAmt, this.cpuChips);
      this.cpuChips -= toAdd;
      this.pot += toAdd;
      this.cpuBetRound += toAdd;
      this.statusMsg += ` CPU calls $${toAdd}.`;
    }

    if (dec.action === 'raise') {
      const extra = Math.min(callAmt + (dec.amount || this.bigBlind), this.cpuChips);
      this.cpuChips -= extra;
      this.pot += extra;
      this.cpuBetRound += extra;
      this.currentBet = Math.max(this.currentBet, this.cpuBetRound);
      this.statusMsg += ` CPU raises — total bet $${this.cpuBetRound}.`;
    }

    await this._nextPhase();
  }

  async _nextPhase() {
    this.playerBetRound = 0;
    this.cpuBetRound = 0;
    this.currentBet = 0;

    const seq = ['pre-flop', 'flop', 'turn', 'river', 'showdown'];
    const next = seq[seq.indexOf(this.phase) + 1];

    try {
      if (next === 'flop') {
        this.community.push(...await drawCards(this.deckId, 3));
        this.statusMsg = 'Flop.';
      } else if (next === 'turn') {
        this.community.push(...await drawCards(this.deckId, 1));
        this.statusMsg = 'Turn.';
      } else if (next === 'river') {
        this.community.push(...await drawCards(this.deckId, 1));
        this.statusMsg = 'River.';
      }
    } catch {
      this.statusMsg = 'Failed to draw community cards. Try a new hand.';
      this.phase = 'showdown';
      this.onUpdate(this);
      return;
    }

    this.phase = next;
    if (next === 'showdown') {
      this._showdown();
    } else {
      this.onUpdate(this);
    }
  }

  _showdown() {
    const pr = HandEvaluator.evaluate([...this.playerHand, ...this.community]);
    const cr = HandEvaluator.evaluate([...this.cpuHand, ...this.community]);
    const cmp = HandEvaluator.compare(pr, cr);
    const pot = this.pot;

    if (cmp > 0) {
      this.playerChips += pot;
      this.statusMsg = `You win with ${pr.name}! +$${pot}`;
    } else if (cmp < 0) {
      this.cpuChips += pot;
      this.statusMsg = `CPU wins with ${cr.name}. -$${pot}`;
    } else {
      const half = Math.floor(pot / 2);
      this.playerChips += half;
      this.cpuChips += pot - half;
      this.statusMsg = `Split pot — both have ${pr.name}.`;
    }

    this.pot = 0;
    this._endHand();
  }

  _endHand() {
    this._checkBust();
    if (this.phase !== 'game-over') this.phase = 'showdown';
    this.onUpdate(this);
  }

  _checkBust() {
    if (this.playerChips <= 0) {
      this.phase = 'game-over';
      this.statusMsg += ' You\'re out of chips — CPU wins!';
    } else if (this.cpuChips <= 0) {
      this.phase = 'game-over';
      this.statusMsg += ' CPU is out of chips — you win!';
    }
  }
}

// === UI WIRING ===

const game = new PokerGame(renderUI);

const elPlayerChips  = document.getElementById('player-chips');
const elCpuChips     = document.getElementById('cpu-chips');
const elPot          = document.getElementById('pot');
const elStatus       = document.getElementById('poker-status');
const elPlayerHand   = document.getElementById('player-hand');
const elCpuHand      = document.getElementById('cpu-hand');
const elCommunity    = document.getElementById('community-cards');
const btnStartHand   = document.getElementById('btn-start-hand');
const btnFold        = document.getElementById('btn-fold');
const btnCheckCall   = document.getElementById('btn-check-call');
const btnRaise       = document.getElementById('btn-raise');
const raiseInput     = document.getElementById('raise-amount');
const raiseGroup     = document.getElementById('raise-group');
const btnNewGame     = document.getElementById('btn-new-game');

function makeFaceDown() {
  const el = document.createElement('div');
  el.className = 'card card--facedown';
  return el;
}

function renderUI(g) {
  elPlayerChips.textContent = g.playerChips;
  elCpuChips.textContent    = g.cpuChips;
  elPot.textContent         = g.pot;
  elStatus.textContent      = g.statusMsg;

  elPlayerHand.innerHTML = '';
  g.playerHand.forEach(c => elPlayerHand.appendChild(makeCardEl(c)));

  elCpuHand.innerHTML = '';
  g.cpuHand.forEach(c =>
    elCpuHand.appendChild(g.phase === 'showdown' ? makeCardEl(c) : makeFaceDown())
  );

  elCommunity.innerHTML = '';
  g.community.forEach(c => elCommunity.appendChild(makeCardEl(c)));

  const isPlaying = ['pre-flop', 'flop', 'turn', 'river'].includes(g.phase);
  const showDeal  = g.phase === 'idle' || g.phase === 'showdown';
  const callAmt   = Math.max(0, g.currentBet - g.playerBetRound);

  btnStartHand.style.display = showDeal ? '' : 'none';
  btnStartHand.disabled      = !g.deckId;
  btnFold.style.display      = isPlaying ? '' : 'none';
  btnCheckCall.style.display = isPlaying ? '' : 'none';
  raiseGroup.style.display   = isPlaying ? '' : 'none';
  btnNewGame.style.display   = g.phase === 'game-over' ? '' : 'none';

  btnCheckCall.textContent = callAmt === 0 ? 'CHECK' : `CALL $${callAmt}`;
  btnRaise.disabled = g.playerChips <= callAmt;

  const minRaise = g.currentBet + g.bigBlind;
  raiseInput.min = minRaise;
  raiseInput.max = g.playerBetRound + g.playerChips;
  if (parseInt(raiseInput.value) < minRaise) raiseInput.value = minRaise;
}

btnStartHand.addEventListener('click', () => game.startHand());
btnFold.addEventListener('click', () => game.playerAction('fold'));
btnCheckCall.addEventListener('click', () => {
  const callAmt = Math.max(0, game.currentBet - game.playerBetRound);
  game.playerAction(callAmt === 0 ? 'check' : 'call');
});
btnRaise.addEventListener('click', () => {
  const total = parseInt(raiseInput.value);
  if (!isNaN(total) && total > 0) game.playerAction('raise', total);
});
btnNewGame.addEventListener('click', () => game.newGame());

game.newGame();
