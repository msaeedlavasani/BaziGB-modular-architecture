/**
 * قوانین خالص وگاس — تاس و شرط‌بندی (تغییرناپذیر)
 * ⚠️ بدون Match Point و Win by 2 (قانون جداسازی: فقط نرد و دوز)
 */
import {
  DEFAULT_MATCH,
  diceSteps,
  rollDicePair,
  sanitizeMatch,
  switchTurn,
  type GameAdapter,
  type MatchConfig,
  type Move,
  type Player,
} from '@bazigb/engine';
import {
  INITIAL_CHIPS,
  MAX_BET,
  TRACK_LENGTH,
  type VegasBoard,
  type VegasMove,
  type VegasState,
} from './types';

/** ساخت وضعیت اولیه */
export function createState(players: Player[], match?: MatchConfig): VegasState {
  // وگاس هرگز matchPoint ندارد — sanitizeMatch این را تضمین میکند
  const safe = sanitizeMatch('vegas', match ?? DEFAULT_MATCH);
  const [p1, p2] = players;
  return {
    gameId: 'vegas',
    board: { length: TRACK_LENGTH },
    turn: p1.id,
    phase: 'bet',
    winner: null,
    history: [],
    match: safe,
    scores: { [p1.id]: INITIAL_CHIPS, [p2.id]: INITIAL_CHIPS },
    round: 1,
    players: [p1, p2],
    positions: { [p1.id]: 0, [p2.id]: 0 },
    pot: 0,
    bets: { [p1.id]: 0, [p2.id]: 0 },
    dice: [],
    maxRounds: 20,
  };
}

/** آیا بازیکن به پایان مسیر رسیده است؟ */
export function reachedEnd(state: VegasState, playerId: string): boolean {
  return (state.positions[playerId] ?? 0) >= state.board.length;
}

/** حرکات قانونی بر اساس فاز */
export function getLegalMoves(state: VegasState): VegasMove[] {
  if (state.phase === 'finished') return [];
  const player = state.turn;
  const chips = state.scores[player] ?? 0;

  if (state.phase === 'bet') {
    const max = Math.min(MAX_BET, chips);
    const moves: VegasMove[] = [];
    for (let amount = 1; amount <= max; amount++) {
      moves.push({ player, kind: 'bet', amount });
    }
    return moves;
  }

  if (state.phase === 'roll') {
    return [{ player, kind: 'roll' }];
  }

  if (state.phase === 'move') {
    const pos = state.positions[player] ?? 0;
    const steps = diceSteps(state.dice);
    let to = pos;
    const chain: Move[] = [];
    for (const step of steps) {
      const from = to;
      to = Math.min(to + step, state.board.length);
      chain.push({ player, kind: 'move', from, to });
    }
    return [{ player, kind: 'move', from: pos, to, chain }];
  }

  return [];
}

/** پایان راند: پرداخت پات و بررسی پایان مسابقه */
function resolveRound(state: VegasState, winnerId: string): VegasState {
  const pot = state.pot;
  const chips = { ...state.scores, [winnerId]: (state.scores[winnerId] ?? 0) + pot };
  const loser = state.players.find((p) => p.id !== winnerId)?.id;
  const loserBroke = loser !== undefined && (chips[loser] ?? 0) <= 0;
  const history = [...state.history];

  if (loserBroke || state.round >= state.maxRounds) {
    return {
      ...state,
      scores: chips,
      history,
      phase: 'finished',
      winner: winnerId,
    };
  }

  // راند جدید
  return {
    ...state,
    scores: chips,
    history,
    positions: { [state.players[0].id]: 0, [state.players[1].id]: 0 },
    pot: 0,
    bets: { [state.players[0].id]: 0, [state.players[1].id]: 0 },
    dice: [],
    phase: 'bet',
    turn: state.players[0].id,
    round: state.round + 1,
  };
}

/** اعمال حرکت (با اعتبارسنجی کامل) */
export function applyMove(state: VegasState, move: VegasMove): VegasState {
  if (state.phase === 'finished') throw new Error('بازی تمام شده است');
  if (move.player !== state.turn) throw new Error('نوبت این بازیکن نیست');
  const history = [...state.history, move];

  if (move.kind === 'bet') {
    if (state.phase !== 'bet') throw new Error('در این مرحله شرط مجاز نیست');
    const chips = state.scores[state.turn] ?? 0;
    if (move.amount < 1 || move.amount > Math.min(MAX_BET, chips)) {
      throw new Error('مبلغ شرط نامعتبر است');
    }
    return {
      ...state,
      history,
      scores: { ...state.scores, [state.turn]: chips - move.amount },
      bets: { ...state.bets, [state.turn]: move.amount },
      pot: state.pot + move.amount,
      phase: 'roll',
    };
  }

  if (move.kind === 'roll') {
    if (state.phase !== 'roll') throw new Error('در این مرحله تاس مجاز نیست');
    const dice = rollDicePair();
    return { ...state, history, dice: [...dice], phase: 'move' };
  }

  if (move.kind === 'move') {
    if (state.phase !== 'move') throw new Error('در این مرحله حرکت مجاز نیست');
    // اعتبارسنجی زنجیره گام به گام (Combined Moves)
    let pos = state.positions[state.turn] ?? 0;
    const steps = diceSteps(state.dice);
    if (move.chain.length !== steps.length) throw new Error('زنجیره حرکت ناقص است');
    move.chain.forEach((step, i) => {
      const prev = i === 0 ? pos : Number(move.chain[i - 1].to);
      const expectedFrom = prev;
      const expectedTo = Math.min(prev + steps[i], state.board.length);
      if (Number(step.from) !== expectedFrom || Number(step.to) !== expectedTo) {
        throw new Error('گام زنجیره نامعتبر است');
      }
    });
    pos = move.to;

    if (pos >= state.board.length) {
      return resolveRound({ ...state, history, positions: { ...state.positions, [state.turn]: pos } }, state.turn);
    }

    return {
      ...state,
      history,
      positions: { ...state.positions, [state.turn]: pos },
      dice: [],
      phase: 'bet',
      turn: switchTurn(state.turn, state.players),
    };
  }

  throw new Error('حرکت نامعتبر است');
}

/** اعتبارسنجی و اعمال زنجیره حرکات ترکیبی */
export function applyChain(state: VegasState, chain: VegasMove[]): VegasState {
  if (chain.length === 0) throw new Error('زنجیره خالی است');
  let s = state;
  for (const step of chain) {
    s = applyMove(s, step);
  }
  return s;
}

export function isFinished(state: VegasState): boolean {
  return state.phase === 'finished';
}

export function getWinner(state: VegasState): string | null {
  return state.winner;
}

/** وضعیت برای کلاینت */
export function serialize(state: VegasState) {
  return {
    gameId: state.gameId,
    positions: state.positions,
    chips: state.scores,
    pot: state.pot,
    bets: state.bets,
    dice: state.dice,
    phase: state.phase,
    turn: state.turn,
    winner: state.winner,
    round: state.round,
  };
}

/** تطبیقگر رسمی بازی وگاس (قرارداد GameAdapter) */
export const Vegas: GameAdapter<VegasBoard, VegasMove> = {
  gameId: 'vegas',
  name: 'وگاس',
  minPlayers: 2,
  maxPlayers: 2,
  createState,
  getLegalMoves,
  applyMove,
  applyChain,
  isFinished,
  getWinner,
  serialize,
};
