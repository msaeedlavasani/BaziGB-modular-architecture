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
    doubling: null
  };
};

/**
 * ریختن تاس برای بازیکن فعلی.
 * قانون جفت: اگر دو تاس برابر باشند، ۴ حرکت همان مقدار داده می‌شود
 * ([6,6] → [6,6,6,6]) تا هر حرکت یکی از تاس‌ها را مصرف کند.
 */
export const rollDiceFor = (state: BackgammonState): BackgammonState => {
  if (state.rolled) return state;
  const newState = deepClone(state);
  const [a, b] = rollDicePair();
  newState.dice = a === b ? [a, b, a, b] : [a, b];
  newState.rolled = true;
  return newState;
};

export function canOfferDouble(state: BackgammonState, playerId: string): boolean {
  return state.phase === 'playing' && !state.rolled && state.doubling === null
    && (state.cube ?? 1) < 64 && (state.cubeOwner === null || state.cubeOwner !== playerId);
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
  if (result.matchWinner) {
    state.phase = 'finished';
    state.winner = result.matchWinner;
    return state;
  }
  // راند بعد — کیوب و مالکش بین راندها منتقل میشوند
  const nextRoundStarter = state.players.find((p) => p.id !== winnerId)!;
  const nextState = createState(state.players, state.match);
  nextState.scores = state.scores;
  nextState.round = state.round + 1;
  nextState.turn = nextRoundStarter.id;
  nextState.cube = state.cube ?? 1;
  nextState.cubeOwner = state.cubeOwner ?? null;
  return nextState;
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
  if (move.kind === 'roll') return rollDiceFor(state);

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

  return newState;
};

/**
 * اعتبارسنجی و اعمال زنجیره‌ای از حرکت‌ها (نوبت کامل).
 */
export const applyChain = (state: BackgammonState, chain: BackgammonMove[]): BackgammonState => {
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
  doubling: state.doubling
});

export const Backgammon: GameAdapter<BackgammonBoard, BackgammonMove> = {
  gameId: 'backgammon',
  name: 'نرد',
  minPlayers: 2,
  maxPlayers: 2,
  createState,
  getLegalMoves,
  applyMove,
  applyChain,
  isFinished,
  getWinner,
  serialize
};
