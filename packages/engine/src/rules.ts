/**
 * قوانین مسابقه — Match Point و Win by 2
 *
 * ⚠️ جداسازی سخت قوانین (Rule Segregation):
 * Match Point و Win by 2 فقط برای «نرد» و «دوز» مجاز است.
 * شطرنج و وگاس هرگز این قوانین را ندارند — `supportsMatchPoint` این را تضمین می‌کند.
 */
import type { GameId, MatchConfig, PlayerId } from './types';

/** بازی‌هایی که قوانین مسابقه دارند */
export const MATCH_POINT_GAMES: GameId[] = ['backgammon', 'tic-tac-toe'];

/** آیا بازی از قوانین مسابقه پشتیبانی می‌کند؟ */
export function supportsMatchPoint(gameId: GameId): boolean {
  return MATCH_POINT_GAMES.includes(gameId);
}

/** بازگرداندن MatchConfig امن برای بازی (قوانین ممنوعه را غیرفعال می‌کند) */
export function sanitizeMatch(gameId: GameId, match?: MatchConfig): MatchConfig {
  const m: MatchConfig = match ?? { matchPoint: false, winByTwo: false, targetScore: 1 };
  if (!supportsMatchPoint(gameId)) {
    return { matchPoint: false, winByTwo: false, targetScore: Math.max(1, m.targetScore) };
  }
  return {
    matchPoint: m.matchPoint,
    winByTwo: m.winByTwo && m.matchPoint,
    targetScore: Math.max(1, m.targetScore),
  };
}

export interface MatchResult {
  /** برنده مسابقه یا null اگر مسابقه ادامه دارد */
  matchWinner: PlayerId | null;
  /** امتیاز جدید بازیکنان */
  scores: Record<PlayerId, number>;
  /** آیا این راند تمام شده است؟ */
  roundFinished: boolean;
}

/**
 * به‌روزرسانی امتیاز مسابقه بعد از پایان یک راند.
 *
 * - بدون matchPoint: بازی آزاد (فقط شمارنده راندها)
 * - با matchPoint: اولین کسی که به targetScore برسد برنده مسابقه است
 * - با matchPoint + winByTwo: برنده باید هم به targetScore برسد و هم حداقل ۲ امتیاز جلو باشد
 */
export function updateMatchScore(
  gameId: GameId,
  scores: Record<PlayerId, number>,
  roundWinner: PlayerId | null,
  match: MatchConfig,
): MatchResult {
  const safe = sanitizeMatch(gameId, match);
  const next = { ...scores };

  if (roundWinner) {
    next[roundWinner] = (next[roundWinner] ?? 0) + 1;
  }

  let matchWinner: PlayerId | null = null;
  let roundFinished = false;

  if (!safe.matchPoint) {
    return { matchWinner, scores: next, roundFinished };
  }

  if (roundWinner) {
    roundFinished = true;
    const winnerScore = next[roundWinner];
    const loser = Object.keys(next).find((id) => id !== roundWinner);
    const loserScore = loser ? (next[loser] ?? 0) : 0;

    if (winnerScore >= safe.targetScore) {
      if (safe.winByTwo) {
        // Win by 2: باید حداقل ۲ امتیاز جلو باشد
        if (winnerScore - loserScore >= 2) {
          matchWinner = roundWinner;
        }
        // در غیر این صورت بازی ادامه پیدا می‌کند (راند جدید)
      } else {
        matchWinner = roundWinner;
      }
    }
  }

  return { matchWinner, scores: next, roundFinished };
}

/** آیا مسابقه تمام شده است؟ */
export function isMatchFinished(gameId: GameId, scores: Record<PlayerId, number>, match: MatchConfig): boolean {
  const safe = sanitizeMatch(gameId, match);
  if (!safe.matchPoint) return false;
  const entries = Object.entries(scores);
  for (const [id, score] of entries) {
    if (score >= safe.targetScore) {
      if (!safe.winByTwo) return true;
      const other = entries.find(([otherId]) => otherId !== id);
      if (other && score - (other[1] ?? 0) >= 2) return true;
    }
  }
  return false;
}
