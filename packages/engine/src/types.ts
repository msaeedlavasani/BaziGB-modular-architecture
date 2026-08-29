/**
 * BaziGB Engine — تایپ‌های مشترک همه بازی‌ها
 * این فایل قرارداد (Contract) بین پکیج‌های بازی، سرور و وب است.
 * پکیج‌های بازی فقط به این پکیج وابسته‌اند (هیچ وابستگی به apps یا UI ندارند).
 */

/** شناسه‌های بازی‌های پلتفرم */
export type GameId = 'tic-tac-toe' | 'backgammon' | 'chess' | 'vegas';

/** نام نمایشی فارسی هر بازی */
export const GAME_NAMES: Record<GameId, string> = {
  'tic-tac-toe': 'دوز',
  backgammon: 'تخته',
  chess: 'شطرنج',
  vegas: 'وگاس',
};

/** شناسه بازیکن (اتاق معمولاً دو بازیکن دارد: p1 و p2) */
export type PlayerId = string;

/** رنگ/نقش بازیکن در بازی */
export type PlayerColor = 'x' | 'o' | 'white' | 'black' | 1 | -1 | 'gold';

export interface Player {
  id: PlayerId;
  name: string;
  color: PlayerColor;
  isBot?: boolean;
  /** امتیاز مسابقه (Match Score) */
  score?: number;
}

export type GamePhase = 'waiting' | 'playing' | 'finished' | 'bet' | 'roll' | 'move' | 'roundEnd';

/**
 * پیکربندی مسابقه.
 * قوانین Match Point و Win by 2 فقط برای «نرد» و «دوز» معتبر است؛
 * شطرنج و وگاس هرگز این قابلیت‌ها را ندارند (نگهبان موتور این را اعمال می‌کند).
 */
export interface MatchConfig {
  matchPoint: boolean;
  winByTwo: boolean;
  /** امتیاز هدف برای پایان مسابقه (مثلاً ۷) */
  targetScore: number;
}

/** پیکربندی پیش‌فرض: بازی ساده بدون مسابقه */
export const DEFAULT_MATCH: MatchConfig = {
  matchPoint: false,
  winByTwo: false,
  targetScore: 1,
};

/**
 * حرکت عمومی. هر بازی زیرنوع خود را تعریف می‌کند.
 * `chain` زنجیره حرکات ترکیبی (Combined Moves) را برای نرد/وگاس حمل می‌کند:
 * کاربر روی Hint Dot کلیک می‌کند و کل زنجیره حرکات میانی تا هدف نهایی تولید می‌شود.
 */
export interface Move {
  player: PlayerId;
  /** نوع حرکت: place / move / roll / bet / pass / promote / chain */
  kind: string;
  from?: number | string;
  to?: number | string;
  /** زنجیره حرکات میانی (Combined Moves) */
  chain?: Move[];
  /** مبلغ شرط (وگاس) */
  amount?: number;
  /** مقدار انتخاب‌شده (وگاس): کدام عدد تاس روی کدام کازینو گذاشته شود */
  value?: number;
  /** مهره ترقی (شطرنج): q/r/b/n */
  promotion?: string;
  /** توضیح اختیاری برای لاگ/UI */
  label?: string;
}

/** وضعیت عمومی بازی — هر بازی `board` را با نوع خود پر می‌کند */
export interface GameState<B = unknown, M extends Move = Move> {
  gameId: GameId;
  board: B;
  turn: PlayerId;
  phase: GamePhase;
  winner: PlayerId | null;
  /** تاس‌ها (نرد/وگاس) */
  dice?: number[];
  /** تاریخچه حرکات */
  history: M[];
  match: MatchConfig;
  scores: Record<PlayerId, number>;
  /** چرخه دورها برای مسابقه (بعد از پایان هر راند) */
  round: number;
  players: Player[];
  /** داده اختصاصی بازی */
  [key: string]: unknown;
}

/** وضعیت اتاق (سرور و کلاینت) */
export interface Room {
  id: string;
  gameId: GameId;
  status: 'waiting' | 'playing' | 'finished';
  players: Player[];
  state: GameState | null;
  createdAt: number;
  updatedAt: number;
}

/** سطح سختی هوش مصنوعی */
export type AIDifficulty = 'easy' | 'medium' | 'hard';

/**
 * رابط تطبیق‌گر بازی — هر بازی باید این قرارداد را پیاده کند.
 * همه متدها خالص (Pure) و تغییرناپذیر (Immutable) هستند:
 * هرگز state ورودی را تغییر نمی‌دهند و state جدید برمی‌گردانند.
 */
export interface GameAdapter<B = unknown, M extends Move = Move> {
  gameId: GameId;
  /** نام فارسی بازی */
  name: string;
  minPlayers: number;
  maxPlayers: number;

  /** ساخت وضعیت اولیه */
  createState(players: Player[], match?: MatchConfig): GameState<B, M>;

  /** فهرست حرکات قانونی برای بازیکن فعلی */
  getLegalMoves(state: GameState<B, M>): M[];

  /** اعمال یک حرکت و برگرداندن state جدید (اعتبارسنجی کامل) */
  applyMove(state: GameState<B, M>, move: M): GameState<B, M>;

  /**
   * اعتبارسنجی و اعمال زنجیره حرکات ترکیبی (Combined Moves).
   * سرور هر گام زنجیره را جداگانه بررسی می‌کند؛ در صورت خطا exception می‌دهد.
   */
  applyChain(state: GameState<B, M>, chain: Move[]): GameState<B, M>;

  /**
   * Game-owned undo policy. Transport and UI must consult this contract instead
   * of assuming every action (especially random rolls) is reversible.
   */
  canUndoMove?(state: GameState<B, M>, move: M): boolean;

  /**
   * Optional multi-game match transition. A game package owns the reset rules,
   * starter, carried score and per-game equipment such as the doubling cube.
   */
  startNextGame?(state: GameState<B, M>): GameState<B, M>;

  /** آیا بازی تمام شده است؟ */
  isFinished(state: GameState<B, M>): boolean;

  /** برنده (اگر تمام شده باشد) */
  getWinner(state: GameState<B, M>): PlayerId | null;

  /** وضعیت برای کلاینت (بدون داده حساس) */
  serialize?(state: GameState<B, M>): unknown;
}

/** مهره/نقطه روی برد برای نمایش در UI */
export interface BoardPoint {
  /** شماره نقطه (شروع از ۱) */
  point: number;
  /** تعداد مهره */
  count: number;
  /** رنگ/نقش */
  color: PlayerColor;
}

export type { PlayerColor as PieceColor };
