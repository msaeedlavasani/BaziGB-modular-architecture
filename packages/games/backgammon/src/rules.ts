import { 
  GameAdapter, 
  Player, 
  MatchConfig, 
  DEFAULT_MATCH, 
  sanitizeMatch, 
  switchTurn, 
  rollDicePair, 
  deepClone, 
  updateMatchScore 
} from '@bazigb/engine';
import { BackgammonBoard, BackgammonMove, BackgammonState } from './types';

export const CUBE_VALUES = [1, 2, 4, 8, 16, 32, 64] as const;

/**
 * ایجاد وضعیت اولیه بازی نرد.
 *
 * چیدمان مطابق رسم کاربر (نسخه آینه‌شده استاندارد):
 * بازیکن ۱ (رنگ ۱ = مهره روشن، پایین برد): از ۰ به سمت ۲۳ حرکت می‌کند
 * (جهت عقربه‌های ساعت ۱→۲۴) و خانه امن او ۱۸-۲۳ (بالا-راست) است.
 * بازیکن ۲ (رنگ -۱ = مهره تیره، بالای برد): از ۲۳ به سمت ۰ حرکت می‌کند
 * (خلاف عقربه ۲۴→۱) و خانه امن او ۰-۵ (پایین-راست) است.
 */
export const createState = (players: Player[], match?: MatchConfig): BackgammonState => {
  const board: BackgammonBoard = new Array(24).fill(0);
  
  // بازیکن ۱ (روشن): ۲ در نقطه ۱ (ایندکس ۰)، ۵ در ۱۲، ۳ در ۱۷، ۵ در ۱۹
  board[0] = 2;
  board[11] = 5;
  board[16] = 3;
  board[18] = 5;
  
  // بازیکن ۲ (تیره): ۲ در نقطه ۲۴ (ایندکس ۲۳)، ۵ در ۱۳، ۳ در ۸، ۵ در ۶
  board[23] = -2;
  board[12] = -5;
  board[7] = -3;
  board[5] = -5;

  return {
    gameId: 'backgammon',
    board,
    turn: players[0].id,
    phase: 'playing',
    winner: null,
    dice: [],
    history: [],
    match: sanitizeMatch('backgammon', match ?? DEFAULT_MATCH),
    scores: players.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {}),
    round: 1,
    players,
    bar: { 1: 0, '-1': 0 },
    off: { 1: 0, '-1': 0 },
    rolled: false,
    cube: 1,
    cubeOwner: null,
    doubling: null,
    gameWinner: null,
    gamePoints: 0,
    nextStarter: null,
    crawfordGame: false,
    crawfordUsed: false,
  };
};

/**
 * ریختن تاس برای بازیکن فعلی.
 * قانون جفت: اگر دو تاس برابر باشند، ۴ حرکت همان مقدار داده می‌شود
 * ([6,6] → [6,6,6,6]) تا هر حرکت یکی از تاس‌ها را مصرف کند.
 */
export const rollDiceFor = (state: BackgammonState): BackgammonState => {
  if (state.phase !== 'playing' || state.rolled) throw new Error('Dice roll is not legal in the current state');
  const newState = deepClone(state);
  const [a, b] = rollDicePair();
  newState.dice = a === b ? [a, b, a, b] : [a, b];
  newState.rolled = true;
  return newState;
};

export function canOfferDouble(state: BackgammonState, playerId: string): boolean {
  return state.phase === 'playing' && state.turn === playerId && !state.rolled && state.doubling === null
    && !state.crawfordGame
    && (state.cube ?? 1) < 64 && (state.cubeOwner === null || state.cubeOwner === playerId)
    && !(state.match.matchPoint && (state.scores[playerId] ?? 0) + (state.cube ?? 1) >= state.match.targetScore);
}

export function offerDouble(state: BackgammonState, playerId: string): BackgammonState {
  if (!canOfferDouble(state, playerId)) throw new Error('پیشنهاد دابل مجاز نیست');
  const next = deepClone(state);
  next.doubling = { offeredBy: playerId };
  return next;
}

export function respondDouble(state: BackgammonState, responderId: string, accept: boolean): BackgammonState {
  if (!state.doubling || responderId === state.doubling.offeredBy || state.phase !== 'playing') {
    throw new Error('پاسخ دابل مجاز نیست');
  }
  const next = deepClone(state);
  if (accept) {
    const idx = CUBE_VALUES.indexOf(next.cube as (typeof CUBE_VALUES)[number]);
    next.cube = CUBE_VALUES[Math.min(idx + 1, CUBE_VALUES.length - 1)];
    next.cubeOwner = responderId;
    next.doubling = null;
    // turn بدون تغییر میماند — پیشنهاددهنده تاس میریزد
    return next;
  }
  // decline: بازی همینجا تمام میشود؛ پیشنهاددهنده امتیاز فعلی (cube، ضریب ۱) را میگیرد
  next.doubling = null;
  next.phase = 'finished';
  next.winner = state.doubling.offeredBy;
  return finishRound(next, state.doubling.offeredBy, next.cube ?? 1);
}

export function getGameMultiplier(state: BackgammonState, winnerColor: number): 1 | 2 | 3 {
  const loserColor = -winnerColor as 1 | -1;
  // مارس در خانه (backgammon): loser در بار یا مهرهای در خانه برنده دارد
  if ((state.bar[loserColor] ?? 0) > 0) return 3;
  const homeStart = winnerColor === 1 ? 18 : 0;
  const homeEnd = winnerColor === 1 ? 23 : 5;
  for (let i = homeStart; i <= homeEnd; i++) {
    if ((winnerColor === 1 && state.board[i] < 0) || (winnerColor === -1 && state.board[i] > 0)) return 3;
  }
  // مارس (gammon): هیچ مهرهای از loser خارج نشده
  if ((state.off[loserColor] ?? 0) === 0) return 2;
  return 1;
}

function finishRound(state: BackgammonState, winnerId: string, points: number): BackgammonState {
  const result = updateMatchScore('backgammon', state.scores, winnerId, state.match, points);
  state.scores = result.scores;
  state.gameWinner = winnerId;
  state.gamePoints = points;
  state.nextStarter = state.players.find((player) => player.id !== winnerId)?.id ?? state.players[0]?.id ?? null;

  // A single game has a real terminal boundary; it must never silently create
  // another board just because match-point scoring is disabled.
  if (!state.match.matchPoint) {
    state.phase = 'finished';
    state.winner = winnerId;
    return state;
  }
  if (result.matchWinner) {
    state.phase = 'finished';
    state.winner = result.matchWinner;
    return state;
  }
  state.phase = 'roundEnd';
  state.winner = null;
  state.dice = [];
  state.rolled = false;
  state.doubling = null;
  return state;
}

/** Begin the next game only after the completed-game result is acknowledged. */
export function startNextGame(state: BackgammonState): BackgammonState {
  if (state.phase !== 'roundEnd' || !state.nextStarter) {
    throw new Error('The next game cannot start from the current state');
  }
  const next = createState(state.players, state.match);
  next.scores = { ...state.scores };
  next.round = state.round + 1;
  next.turn = state.nextStarter;
  // Every new game starts with a centered cube at 1.
  next.cube = 1;
  next.cubeOwner = null;
  next.crawfordUsed = state.crawfordUsed;
  const oneAway = Object.values(next.scores).some((score) => score === next.match.targetScore - 1);
  if (!next.crawfordUsed && oneAway) {
    next.crawfordGame = true;
    next.crawfordUsed = true;
  }
  return next;
}

const getPlayerColor = (state: BackgammonState, playerId: string): number => {
  const p = state.players.find(x => x.id === playerId);
  if (!p) return 0;
  return p.color === 1 || p.color === 'white' ? 1 : -1;
};

/**
 * بررسی اینکه آیا بازیکن می‌تواند مهره‌هایش را خارج کند.
 */
export const canBearOff = (state: BackgammonState, playerId: string): boolean => {
  const color = getPlayerColor(state, playerId);
  if (state.bar[color] > 0) return false;

  // رنگ ۱ (روشن) خانه ۱۸-۲۳؛ رنگ -۱ (تیره) خانه ۰-۵
  const homeStart = color === 1 ? 18 : 0;
  const homeEnd = color === 1 ? 23 : 5;

  for (let i = 0; i < 24; i++) {
    if (color === 1 && state.board[i] > 0 && (i < homeStart || i > homeEnd)) return false;
    if (color === -1 && state.board[i] < 0 && (i < homeStart || i > homeEnd)) return false;
  }
  return true;
};

/**
 * یافتن مقصدهای قانونی برای یک مهره با یک تاس خاص.
 */
export const getLegalDestinations = (
  state: BackgammonState, 
  from: number | 'bar', 
  die: number
): Array<number | 'off'> => {
  const color = getPlayerColor(state, state.turn);
  const destinations: Array<number | 'off'> = [];

  if (from === 'bar') {
    const to = color === 1 ? die - 1 : 24 - die;
    if (!isOpponentBlocked(state, color, to)) {
      destinations.push(to);
    }
    return destinations;
  }

  // رنگ ۱ (روشن): از +die به سمت ۲۳ (عقربه‌های ساعت)؛ رنگ -۱ (تیره): از -die
  const to = color === 1 ? from + die : from - die;
  
  // حرکت معمولی روی تخته
  if (to >= 0 && to <= 23) {
    if (!isOpponentBlocked(state, color, to)) {
      destinations.push(to);
    }
  } 
  // تلاش برای خارج کردن مهره
  else if (canBearOff(state, state.turn)) {
    const distance = color === 1 ? 24 - from : from + 1;
    
    if (distance === die) {
      destinations.push('off');
    } else if (die > distance) {
      // قانون نرد: اگر تاس بزرگتر بود، تنها در صورتی مجاز است که هیچ مهره‌ای عقب‌تر نباشد
      const homeRange = color === 1 ? [18, from - 1] : [from + 1, 5];
      let hasFurther = false;
      for (let i = homeRange[0]; i <= homeRange[1]; i++) {
        if (color === 1 && state.board[i] > 0) hasFurther = true;
        if (color === -1 && state.board[i] < 0) hasFurther = true;
      }
      if (!hasFurther) {
        destinations.push('off');
      }
    }
  }

  return destinations;
};

const isOpponentBlocked = (state: BackgammonState, color: number, to: number): boolean => {
  const count = state.board[to];
  return color === 1 ? count <= -2 : count >= 2;
};

/**
 * دریافت لیست تمام حرکت‌های تکی قانونی.
 */
export const getLegalMoves = (state: BackgammonState): BackgammonMove[] => {
  if (state.phase !== 'playing') return [];
  if (state.doubling !== null) return [];
  if (!state.rolled) {
    return [{ player: state.turn, kind: 'roll' }];
  }

  const color = getPlayerColor(state, state.turn);
  const moves: BackgammonMove[] = [];
  const uniqueDice = Array.from(new Set(state.dice));

  if (state.bar[color] > 0) {
    for (const die of uniqueDice) {
      const dests = getLegalDestinations(state, 'bar', die);
      for (const to of dests) {
        moves.push({ player: state.turn, kind: 'move', from: 'bar', to, amount: die });
      }
    }
  } else {
    for (let i = 0; i < 24; i++) {
      if ((color === 1 && state.board[i] > 0) || (color === -1 && state.board[i] < 0)) {
        for (const die of uniqueDice) {
          const dests = getLegalDestinations(state, i, die);
          for (const to of dests) {
            moves.push({ player: state.turn, kind: 'move', from: i, to, amount: die });
          }
        }
      }
    }
  }

  return moves;
};

/**
 * اعمال یک حرکت تکی بر وضعیت بازی.
 */
export const applyMove = (state: BackgammonState, move: BackgammonMove): BackgammonState => {
  if (state.doubling !== null) throw new Error('Cannot move while double is pending');
  if (state.phase !== 'playing' || move.player !== state.turn) throw new Error('Move is not legal for the current player');
  if (move.kind === 'roll') return rollDiceFor(state);

  const legal = getLegalMoves(state).some((candidate) =>
    candidate.kind === move.kind && candidate.player === move.player && candidate.from === move.from
      && candidate.to === move.to && candidate.amount === move.amount,
  );
  if (!legal) throw new Error('Illegal backgammon move');

  const inventoryBefore = checkerInventory(state);

  const newState = deepClone(state);
  const color = getPlayerColor(newState, move.player);
  
  if (move.from === 'bar') {
    newState.bar[color]--;
  } else {
    newState.board[move.from as number] -= color;
  }

  if (move.to === 'off') {
    newState.off[color]++;
  } else {
    const to = move.to as number;
    // بررسی زدن مهره حریف (Hit)
    if ((color === 1 && newState.board[to] === -1) || (color === -1 && newState.board[to] === 1)) {
      newState.bar[-color]++;
      newState.board[to] = color;
    } else {
      newState.board[to] += color;
    }
  }

  // حذف تاس استفاده شده
  const diceArr = newState.dice ?? [];
  const dieIndex = diceArr.indexOf(move.amount!);
  if (dieIndex !== -1) diceArr.splice(dieIndex, 1);
  newState.dice = diceArr;

  const inventoryAfter = checkerInventory(newState);
  for (const color of [1, -1] as const) {
    if (inventoryBefore[color] === 15 && inventoryAfter[color] !== 15) {
      throw new Error('Backgammon checker inventory invariant violated');
    }
  }

  return newState;
};

/** Board + bar + borne-off checkers must conserve each player's inventory. */
export const checkerInventory = (state: BackgammonState): Record<1 | -1, number> => ({
  1: state.board.reduce((sum, count) => sum + (count > 0 ? count : 0), 0) + (state.bar[1] ?? 0) + (state.off[1] ?? 0),
  [-1]: state.board.reduce((sum, count) => sum + (count < 0 ? -count : 0), 0) + (state.bar[-1] ?? 0) + (state.off[-1] ?? 0),
});

export const canUndoMove = (_state: BackgammonState, move: BackgammonMove): boolean => move.kind === 'move';

const sameMove = (left: BackgammonMove, right: BackgammonMove): boolean =>
  left.kind === right.kind
  && left.player === right.player
  && left.from === right.from
  && left.to === right.to
  && left.amount === right.amount;

/**
 * Return every complete move chain that satisfies Backgammon's mandatory dice
 * use. The caller supplies the immutable rolled state at the start of a turn.
 * An empty chain means the roll has no legal move and still needs an explicit
 * turn commit.
 */
export const getRequiredMoveChains = (state: BackgammonState): BackgammonMove[][] => {
  if (state.phase !== 'playing' || !state.rolled || state.doubling !== null) return [];

  const results: BackgammonMove[][] = [];
  const visit = (current: BackgammonState, path: BackgammonMove[]) => {
    const legalMoves = getLegalMoves(current);
    if (legalMoves.length === 0 || (current.dice?.length ?? 0) === 0) {
      results.push(path);
      return;
    }
    for (const move of legalMoves) visit(applyMove(current, move), [...path, move]);
  };
  visit(state, []);

  const maxLength = Math.max(...results.map((chain) => chain.length), 0);
  let required = results.filter((chain) => chain.length === maxLength);

  // When exactly one of two unequal dice can be played, the higher die is
  // mandatory. This filter also covers bearing off with either die.
  const distinctDice = Array.from(new Set(state.dice ?? []));
  if (maxLength === 1 && distinctDice.length > 1) {
    const highestPlayable = Math.max(...required.map((chain) => chain[0]?.amount ?? 0));
    required = required.filter((chain) => chain[0]?.amount === highestPlayable);
  }

  return required;
};

/** Whether a draft is a legal prefix of at least one required complete chain. */
export const isValidTurnDraft = (state: BackgammonState, draft: BackgammonMove[]): boolean =>
  getRequiredMoveChains(state).some((chain) =>
    draft.length <= chain.length && draft.every((move, index) => sameMove(move, chain[index])),
  );

/** Return only moves that keep the current draft on a required complete chain. */
export const getValidNextTurnMoves = (state: BackgammonState, draft: BackgammonMove[]): BackgammonMove[] => {
  const nextMoves = getRequiredMoveChains(state)
    .filter((chain) => draft.length < chain.length && draft.every((move, index) => sameMove(move, chain[index])))
    .map((chain) => chain[draft.length]);
  return nextMoves.filter((move, index) => nextMoves.findIndex((candidate) => sameMove(candidate, move)) === index);
};

/** Apply a legal draft without transferring turn ownership or completing a game. */
export const applyTurnDraft = (state: BackgammonState, draft: BackgammonMove[]): BackgammonState => {
  if (!isValidTurnDraft(state, draft)) throw new Error('Invalid Backgammon turn draft');
  return draft.reduce((current, move) => applyMove(current, move), deepClone(state));
};

/** A turn can commit only when its draft exactly matches a required chain. */
export const canCommitTurn = (state: BackgammonState, draft: BackgammonMove[]): boolean =>
  getRequiredMoveChains(state).some((chain) =>
    chain.length === draft.length && draft.every((move, index) => sameMove(move, chain[index])),
  );

/** Atomically validate and commit one complete Backgammon turn. */
export const commitTurn = (state: BackgammonState, draft: BackgammonMove[]): BackgammonState => {
  if (!canCommitTurn(state, draft)) throw new Error('Backgammon turn is incomplete');
  const committed = applyTurnDraft(state, draft);
  const color = getPlayerColor(committed, state.turn);

  if (committed.off[color] === 15) {
    const multiplier = getGameMultiplier(committed, color);
    return finishRound(committed, state.turn, multiplier * (committed.cube ?? 1));
  }

  committed.turn = switchTurn(committed.turn, committed.players);
  committed.dice = [];
  committed.rolled = false;
  return committed;
};

/**
 * اعتبارسنجی و اعمال زنجیره‌ای از حرکت‌ها (نوبت کامل).
 */
export const applyChain = (state: BackgammonState, chain: BackgammonMove[]): BackgammonState => {
  if (state.phase !== 'playing') throw new Error('Backgammon game is not active');
  let currentState = deepClone(state);

  // اگر تاس ریخته نشده و زنجیره با ریختن تاس شروع می‌شود
  if (!currentState.rolled && chain.length > 0 && chain[0].kind === 'roll') {
    currentState = applyMove(currentState, chain[0]);
    chain = chain.slice(1);
  }

  for (const move of chain) {
    const legalMoves = getLegalMoves(currentState);
    const isLegal = legalMoves.some(m => 
      m.from === move.from && m.to === move.to && m.amount === move.amount
    );
    if (!isLegal) throw new Error('Invalid move in chain');
    currentState = applyMove(currentState, move);
  }

  // بررسی اتمام نوبت یا برد
  const color = getPlayerColor(currentState, state.turn);
  if (currentState.off[color] === 15) {
    const multiplier = getGameMultiplier(currentState, color);
    const points = multiplier * (currentState.cube ?? 1);
    return finishRound(currentState, state.turn, points);
  }

  // اگر تمام تاس‌ها مصرف شده یا حرکتی باقی نمانده
  const remainingLegal = getLegalMoves(currentState);
  if ((currentState.dice?.length ?? 0) === 0 || remainingLegal.length === 0) {
    currentState.turn = switchTurn(currentState.turn, currentState.players);
    currentState.dice = [];
    currentState.rolled = false;
  }

  return currentState;
};

/**
 * تولید تمام زنجیره‌های ممکن از حرکت‌ها برای ارائه راهنمایی یا AI.
 */
export const getMoveHints = (state: BackgammonState): BackgammonMove[][] => {
  if (!state.rolled) return [];
  
  const results: BackgammonMove[][] = [];
  
  const findChains = (curr: BackgammonState, path: BackgammonMove[]) => {
    const legals = getLegalMoves(curr);
    if (legals.length === 0 || (curr.dice?.length ?? 0) === 0) {
      if (path.length > 0) results.push([...path]);
      return;
    }

    for (const move of legals) {
      findChains(applyMove(curr, move), [...path, move]);
    }
  };

  findChains(state, []);

  // فیلتر کردن برای پیدا کردن طولانی‌ترین زنجیره‌ها (طبق قوانین نرد باید حداکثر تعداد تاس استفاده شود)
  const maxLen = Math.max(...results.map(r => r.length), 0);
  return results.filter(r => r.length === maxLen);
};

export const isFinished = (state: BackgammonState) => state.phase === 'finished';
export const getWinner = (state: BackgammonState) => state.winner;

export const serialize = (state: BackgammonState) => ({
  board: state.board,
  bar: state.bar,
  off: state.off,
  dice: state.dice,
  turn: state.turn,
  phase: state.phase,
  winner: state.winner,
  scores: state.scores,
  round: state.round,
  match: state.match,
  rolled: state.rolled,
  cube: state.cube,
  cubeOwner: state.cubeOwner,
  doubling: state.doubling,
  gameWinner: state.gameWinner,
  gamePoints: state.gamePoints,
  nextStarter: state.nextStarter,
  crawfordGame: state.crawfordGame,
  crawfordUsed: state.crawfordUsed,
});

export const Backgammon: GameAdapter<BackgammonBoard, BackgammonMove> = {
  gameId: 'backgammon',
  name: 'تخته',
  minPlayers: 2,
  maxPlayers: 2,
  createState,
  getLegalMoves,
  applyMove,
  applyChain,
  isFinished,
  getWinner,
  serialize,
  canUndoMove,
  startNextGame,
};
