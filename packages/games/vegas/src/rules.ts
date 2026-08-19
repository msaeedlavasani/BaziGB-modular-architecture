import {
  GameAdapter,
  Player,
  MatchConfig,
  DEFAULT_MATCH,
  sanitizeMatch,
  deepClone,
} from '@bazigb/engine';
import { CasinoData, VegasMove, VegasState, TOTAL_ROUNDS, DICE_PER_PLAYER } from './types';

/**
 * قوانین وگاس — بازسازی کامل نسخه قدیمی BaziGB روی رابط GameAdapter جدید.
 * `board` در state همان ۶ کازینو است (قرارداد GameState).
 */

const DENOMS = [10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000];
const COPIES_PER_DENOM = 6; // 6 نسخه از هر ارزش → ۵۴ کارت

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck(): number[] {
  const deck: number[] = [];
  for (let i = 0; i < COPIES_PER_DENOM; i++) deck.push(...DENOMS);
  return shuffle(deck);
}

/** ریختن n تاس شش‌وجهی */
export function rollDiceN(n: number): number[] {
  return Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 6));
}

/** پخش دسته‌های پول روی ۶ کازینو (باارزش‌ترین روی کازینو ۶) */
function dealRound(): CasinoData[] {
  const deck = buildDeck();
  const stacks: number[][] = [];
  for (let i = 0; i < 6; i++) {
    const a = deck[i * 2];
    const b = deck[i * 2 + 1];
    stacks.push([Math.max(a, b), Math.min(a, b)]);
  }
  // مرتب‌سازی نزولی بر اساس مجموع؛ تساوی → کارت بالاتر
  stacks.sort((x, y) => y[0] + y[1] - (x[0] + x[1]) || y[0] - x[0]);

  const casinos: CasinoData[] = [];
  for (let i = 0; i < 6; i++) {
    const stack = stacks[5 - i]; // کازینو ۶ (ایندکس ۵) باارزش‌ترین دسته را می‌گیرد
    casinos.push({
      dice: {},
      stack:
        stack !== undefined
          ? { cards: stack, winnerIndex: null, runnerUpIndex: null, burned: false, swept: false }
          : null,
    });
  }
  return casinos;
}

/** پرداخت یک کازینو و به‌روزرسانی دفتر پول/کارت‌ها */
function resolveCasino(
  casino: CasinoData,
  playerCash: Record<string, number>,
  playerCards: Record<string, number>,
): CasinoData {
  if (!casino.stack) return casino;
  const stack = { ...casino.stack };
  const entries = Object.entries(casino.dice).filter(([, c]) => c > 0);

  const pay = (pId: string, amount: number, cards: number) => {
    playerCash[pId] = (playerCash[pId] ?? 0) + amount;
    playerCards[pId] = (playerCards[pId] ?? 0) + cards;
  };

  if (entries.length === 0) {
    stack.burned = true;
    return { ...casino, stack };
  }

  entries.sort((a, b) => b[1] - a[1]);

  // قانون خانگی: همهٔ ۸ تاس روی یک کازینو → هر دو کارت (sweep)
  const swept = entries.filter(([, c]) => c === DICE_PER_PLAYER);
  if (swept.length === 1) {
    const pId = swept[0][0];
    stack.swept = true;
    stack.winnerIndex = pId;
    pay(pId, stack.cards[0] + stack.cards[1], 2);
    return { ...casino, stack };
  }
  if (swept.length > 1) {
    stack.burned = true;
    return { ...casino, stack };
  }

  // تساوی در رتبه اول → کل دسته می‌سوزد
  const topCount = entries[0][1];
  if (entries.filter(([, c]) => c === topCount).length > 1) {
    stack.burned = true;
    return { ...casino, stack };
  }

  const winner = entries[0][0];
  stack.winnerIndex = winner;
  pay(winner, stack.cards[0], 1);

  const rest = entries.slice(1);
  if (rest.length > 0) {
    const runnerCount = rest[0][1];
    if (rest.filter(([, c]) => c === runnerCount).length > 1) {
      stack.burned = true; // کارت پایین‌تر سوخت
    } else {
      const runner = rest[0][0];
      stack.runnerUpIndex = runner;
      pay(runner, stack.cards[1], 1);
    }
  } else {
    stack.burned = true;
  }

  return { ...casino, stack };
}

/** محاسبه برندهٔ کل بازی: بیشترین پول، تساوی‌شکن کارت، بعد مساوی */
function computeWinner(state: VegasState): string | null {
  let best = -1;
  let leaders: string[] = [];
  for (const pId of Object.keys(state.playerCash)) {
    const cash = state.playerCash[pId] ?? 0;
    if (cash > best) {
      best = cash;
      leaders = [pId];
    } else if (cash === best) {
      leaders.push(pId);
    }
  }
  if (leaders.length === 1) return leaders[0];
  let bestCards = -1;
  let cardLeaders: string[] = [];
  for (const pId of leaders) {
    const cards = state.playerCards[pId] ?? 0;
    if (cards > bestCards) {
      bestCards = cards;
      cardLeaders = [pId];
    } else if (cards === bestCards) {
      cardLeaders.push(pId);
    }
  }
  return cardLeaders.length === 1 ? cardLeaders[0] : null; // مساوی
}

function resolveRound(state: VegasState): VegasState {
  const playerCash = { ...state.playerCash };
  const playerCards = { ...state.playerCards };
  const board = state.board.map((casino) => resolveCasino(casino, playerCash, playerCards));

  const next: VegasState = {
    ...state,
    board,
    playerCash,
    playerCards,
    phase: 'roundEnd',
  };

  if (state.round >= state.totalRounds) {
    next.phase = 'finished';
    next.winner = computeWinner(next);
  }
  return next;
}

/** نوبت بعدی: اولین بازیکنی که هنوز تاس دارد */
function nextTurn(state: VegasState): string {
  const players = state.players;
  const idx = players.findIndex((p) => p.id === state.turn);
  for (let i = 1; i <= players.length; i++) {
    const p = players[(idx + i) % players.length];
    if ((state.playerDiceRemaining[p.id] ?? 0) > 0) return p.id;
  }
  return state.turn;
}

/** ایجاد وضعیت اولیه (راند ۱) */
export const createState = (players: Player[], match?: MatchConfig): VegasState => {
  const scores: Record<string, number> = {};
  const playerCash: Record<string, number> = {};
  const playerCards: Record<string, number> = {};
  const playerDiceRemaining: Record<string, number> = {};
  for (const p of players) {
    scores[p.id] = 0;
    playerCash[p.id] = 0;
    playerCards[p.id] = 0;
    playerDiceRemaining[p.id] = DICE_PER_PLAYER;
  }
  return {
    gameId: 'vegas',
    board: dealRound(),
    playerCash,
    playerCards,
    playerDice: {},
    playerDiceRemaining,
    round: 1,
    totalRounds: TOTAL_ROUNDS,
    phase: 'playing',
    turn: players[0]?.id ?? '',
    winner: null,
    players,
    history: [],
    match: sanitizeMatch('vegas', match ?? DEFAULT_MATCH),
    scores,
    rolled: false,
  };
};

/** حرکت‌های قانونی نوبت جاری */
export const getLegalMoves = (state: VegasState): VegasMove[] => {
  if (state.phase === 'finished') return [];
  if (state.phase === 'roundEnd') {
    return state.round < state.totalRounds ? [{ player: state.turn, kind: 'nextRound' }] : [];
  }
  if (!state.rolled) {
    return [{ player: state.turn, kind: 'roll' }];
  }
  const hand = state.playerDice[state.turn] ?? [];
  const values = Array.from(new Set(hand)).filter((v) => v >= 1 && v <= 6).sort((a, b) => a - b);
  return values.map((value) => ({ player: state.turn, kind: 'place', value }));
};

export const applyMove = (state: VegasState, move: VegasMove): VegasState => {
  if (move.kind === 'roll') {
    if (state.phase !== 'playing' || state.rolled) return state;
    const count = state.playerDiceRemaining[move.player] ?? 0;
    if (count <= 0) return state;
    return {
      ...state,
      playerDice: { ...state.playerDice, [move.player]: rollDiceN(count) },
      rolled: true,
    };
  }

  if (move.kind === 'place') {
    if (state.phase !== 'playing' || !state.rolled || move.player !== state.turn) return state;
    const hand = state.playerDice[move.player] ?? [];
    const count = hand.filter((d) => d === move.value).length;
    if (count === 0 || move.value! < 1 || move.value! > 6) return state;

    const board = state.board.map((c) => ({ ...c, dice: { ...c.dice } }));
    const casino = board[move.value! - 1];
    casino.dice[move.player] = (casino.dice[move.player] ?? 0) + count;

    let next: VegasState = {
      ...state,
      board,
      playerDice: { ...state.playerDice, [move.player]: [] },
      playerDiceRemaining: {
        ...state.playerDiceRemaining,
        [move.player]: (state.playerDiceRemaining[move.player] ?? 0) - count,
      },
      rolled: false,
    };

    const allDone = Object.values(next.playerDiceRemaining).every((c) => c <= 0);
    if (allDone) {
      next = resolveRound(next);
    } else {
      next = { ...next, turn: nextTurn(next) };
    }
    return next;
  }

  if (move.kind === 'nextRound') {
    if (state.phase !== 'roundEnd' || state.round >= state.totalRounds) return state;
    const players = state.players;
    const playerDiceRemaining: Record<string, number> = {};
    for (const p of players) playerDiceRemaining[p.id] = DICE_PER_PLAYER;
    return {
      ...state,
      board: dealRound(),
      playerDice: {},
      playerDiceRemaining,
      round: state.round + 1,
      phase: 'playing',
      turn: players[0]?.id ?? state.turn,
      rolled: false,
    };
  }

  return state;
};

export const applyChain = (state: VegasState, chain: VegasMove[]): VegasState => {
  let current = deepClone(state);
  for (const move of chain) {
    const legal = getLegalMoves(current);
    const ok = legal.some(
      (m) => m.kind === move.kind && (m as { value?: number }).value === (move as { value?: number }).value,
    );
    if (!ok) throw new Error('Invalid move in chain');
    current = applyMove(current, move);
  }
  return current;
};

export const isFinished = (state: VegasState) => state.phase === 'finished';
export const getWinner = (state: VegasState) => state.winner;

export const serialize = (state: VegasState) => ({
  board: state.board,
  playerCash: state.playerCash,
  playerCards: state.playerCards,
  playerDice: state.playerDice,
  playerDiceRemaining: state.playerDiceRemaining,
  round: state.round,
  totalRounds: state.totalRounds,
  phase: state.phase,
  turn: state.turn,
  winner: state.winner,
  scores: state.scores,
  rolled: state.rolled,
});

export const Vegas: GameAdapter<CasinoData[], VegasMove> = {
  gameId: 'vegas',
  name: 'وگاس',
  minPlayers: 1,
  maxPlayers: 5,
  createState,
  getLegalMoves,
  applyMove,
  applyChain,
  isFinished,
  getWinner,
  serialize,
};
