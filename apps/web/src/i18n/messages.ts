import type { Locale } from './config';

export interface AppMessages {
  navigation: {
    lobby: string;
    leaderboard: string;
    tournaments: string;
    profile: string;
  };
  common: {
    loading: string;
    retry: string;
    close: string;
    refresh: string;
    back: string;
    newGame: string;
  };
  sound: {
    enable: string;
    disable: string;
  };
  games: {
    ticTacToe: string;
    chess: string;
    backgammon: string;
    vegas: string;
  };
  gameShell: {
    yourTurn: string;
    botTurn: string;
    invalidMove: string;
    botError: string;
    preparing: string;
    difficulty: string;
    easy: string;
    medium: string;
    hard: string;
    match: string;
    winByTwo: string;
    target: string;
    points: string;
    undo: string;
    undoLastMove: string;
    you: string;
    bot: string;
    youWon: string;
    botWon: string;
    draw: string;
    finalScore: (you: number, bot: number) => string;
  };
  multiplayer: {
    gameFallback: string;
    opponentTurn: string;
    opponentWon: string;
    liveSpectating: string;
    spectatorNotice: string;
    waitingForOpponent: string;
    shareRoomCode: (roomCode: string) => string;
    players: (current: number, max: number) => string;
    copied: string;
    copyCode: string;
    startGame: string;
    ownerStarting: string;
    matchScore: (a: number, b: number) => string;
    turnExpired: string;
    undoOwnMove: string;
    chat: string;
    noMessages: string;
    guest: string;
    system: string;
    messagePlaceholder: string;
    send: string;
  };
  lobby: {
    title: string;
    subtitle: string;
    waiting: string;
    inProgress: string;
    finished: string;
    recentlyPlayed: string;
    refreshRecent: string;
    noRecentGames: string;
    recentLoadError: string;
    win: string;
    loss: string;
    draw: string;
    playAgain: string;
    chooseGame: string;
    matchPoints: string;
    singleGame: string;
    bestOf3: string;
    bestOf5: string;
    onlineOpponent: string;
    practiceBot: string;
    startSolo: string;
    createRoom: string;
    joinWithCode: string;
    joinDescription: string;
    enterRoomCode: string;
    createError: string;
    loadRoomsError: string;
    activeRooms: string;
    refreshList: string;
    noActiveRooms: string;
    copied: string;
    copyCode: string;
    enter: string;
    playersShort: (current: number, max: number) => string;
  };
  tournaments: {
    registrationOpen: string;
    inProgress: string;
    completed: string;
    fallbackDescription: string;
  };
  footer: {
    rules: string;
    contact: string;
  };
}

const MESSAGES: Record<Locale, AppMessages> = {
  fa: {
    navigation: {
      lobby: 'لابی',
      leaderboard: 'رتبه‌بندی',
      tournaments: 'تورنمنت',
      profile: 'پروفایل',
    },
    common: {
      loading: 'در حال بارگذاری…',
      retry: 'تلاش دوباره',
      close: 'بستن',
      refresh: 'به‌روزرسانی',
      back: 'بازگشت',
      newGame: 'بازی جدید',
    },
    sound: {
      enable: 'فعال‌سازی صدا',
      disable: 'قطع صدا',
    },
    games: {
      ticTacToe: 'دوز',
      chess: 'شطرنج',
      backgammon: 'نرد',
      vegas: 'وگاس',
    },
    gameShell: {
      yourTurn: 'نوبت شما',
      botTurn: 'نوبت ربات',
      invalidMove: 'حرکت نامعتبر',
      botError: 'خطای ربات',
      preparing: 'در حال آماده‌سازی بازی…',
      difficulty: 'سطح ربات',
      easy: 'آسان',
      medium: 'متوسط',
      hard: 'سخت',
      match: 'مسابقه',
      winByTwo: 'برد با ۲',
      target: 'هدف',
      points: 'امتیاز',
      undo: 'آندو',
      undoLastMove: 'بازگردانی آخرین حرکت',
      you: 'شما',
      bot: 'ربات',
      youWon: '🎉 شما برنده شدید!',
      botWon: 'ربات برنده شد',
      draw: 'مساوی!',
      finalScore: (you, bot) => `امتیاز نهایی — شما ${you} : ${bot} ربات`,
    },
    multiplayer: {
      gameFallback: 'بازی',
      opponentTurn: 'نوبت حریف',
      opponentWon: 'حریف برنده شد',
      liveSpectating: 'تماشای زنده',
      spectatorNotice: '👁 شما تماشاچی هستید — بازی را زنده می‌بینید',
      waitingForOpponent: 'در انتظار حریف…',
      shareRoomCode: (roomCode) => `کد اتاق ${roomCode} را برای دوستتان بفرستید`,
      players: (current, max) => `${current}/${max} بازیکن`,
      copied: 'کپی شد!',
      copyCode: 'کپی کد',
      startGame: 'شروع بازی',
      ownerStarting: 'صاحب اتاق بازی را شروع می‌کند…',
      matchScore: (a, b) => `مسابقه ${a} - ${b}`,
      turnExpired: 'نوبت منقضی شد',
      undoOwnMove: 'بازگردانی آخرین حرکت خودتان',
      chat: 'گفتگو',
      noMessages: 'هنوز پیامی نیست…',
      guest: 'مهمان',
      system: 'سیستم',
      messagePlaceholder: 'پیام…',
      send: 'ارسال',
    },
    lobby: {
      title: 'لابی BaziGB',
      subtitle: 'یک اتاق آنلاین بسازید یا با ربات هوشمند تمرین کنید',
      waiting: 'در انتظار',
      inProgress: 'در حال بازی',
      finished: 'پایان‌یافته',
      recentlyPlayed: 'بازی‌های اخیر',
      refreshRecent: 'به‌روزرسانی بازی‌های اخیر',
      noRecentGames: 'هنوز بازی انجام نداده‌اید — از بخش ایجاد اتاق اولین بازی را شروع کنید!',
      recentLoadError: 'دریافت بازی‌های اخیر ممکن نشد',
      win: 'برد',
      loss: 'باخت',
      draw: 'تساوی',
      playAgain: 'بازی دوباره',
      chooseGame: '۱. انتخاب بازی و تنظیمات',
      matchPoints: 'امتیاز نهایی مسابقه',
      singleGame: 'تک‌بازی (۱ امتیاز)',
      bestOf3: 'بهترین از ۳ — اولین نفر با ۲ برد',
      bestOf5: 'بهترین از ۵ — اولین نفر با ۳ برد',
      onlineOpponent: 'با حریف آنلاین',
      practiceBot: 'تمرین با ربات',
      startSolo: 'شروع بازی انفرادی',
      createRoom: 'ایجاد اتاق جدید',
      joinWithCode: '۲. ورود با کد دعوت',
      joinDescription: 'اگر دوستتان قبلاً اتاق ساخته است، کد ۵ رقمی آن را در اینجا وارد کنید.',
      enterRoomCode: 'ابتدا کد اتاق را وارد کنید',
      createError: 'ایجاد اتاق ممکن نشد',
      loadRoomsError: 'دریافت اتاق‌ها ممکن نشد. اتصال سرور را بررسی کنید.',
      activeRooms: 'اتاق‌های فعال',
      refreshList: 'به‌روزرسانی لیست',
      noActiveRooms: 'هنوز اتاقی وجود ندارد — اولین اتاق را بسازید!',
      copied: 'کپی شد!',
      copyCode: 'کپی کد',
      enter: 'ورود',
      playersShort: (current, max) => `${current}/${max}`,
    },
    tournaments: {
      registrationOpen: 'ثبت‌نام باز',
      inProgress: 'در حال برگزاری',
      completed: 'پایان‌یافته',
      fallbackDescription: 'حذفی تک‌مرحله‌ای؛ برنده‌ها صعود می‌کنند و یک نفر قهرمان می‌شود.',
    },
    footer: {
      rules: 'قوانین بازی',
      contact: 'تماس با ما',
    },
  },
  en: {
    navigation: {
      lobby: 'Lobby',
      leaderboard: 'Leaderboard',
      tournaments: 'Tournaments',
      profile: 'Profile',
    },
    common: {
      loading: 'Loading…',
      retry: 'Try again',
      close: 'Close',
      refresh: 'Refresh',
      back: 'Back',
      newGame: 'New game',
    },
    sound: {
      enable: 'Enable sound',
      disable: 'Mute sound',
    },
    games: {
      ticTacToe: 'Tic-Tac-Toe',
      chess: 'Chess',
      backgammon: 'Backgammon',
      vegas: 'Vegas',
    },
    gameShell: {
      yourTurn: 'Your turn',
      botTurn: "Bot's turn",
      invalidMove: 'Invalid move',
      botError: 'Bot error',
      preparing: 'Preparing game…',
      difficulty: 'Bot difficulty',
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
      match: 'Match',
      winByTwo: 'Win by 2',
      target: 'Target',
      points: 'points',
      undo: 'Undo',
      undoLastMove: 'Undo last move',
      you: 'You',
      bot: 'Bot',
      youWon: '🎉 You won!',
      botWon: 'Bot won',
      draw: 'Draw!',
      finalScore: (you, bot) => `Final score — You ${you} : ${bot} Bot`,
    },
    multiplayer: {
      gameFallback: 'Game',
      opponentTurn: "Opponent's turn",
      opponentWon: 'Opponent won',
      liveSpectating: 'Live spectating',
      spectatorNotice: '👁 You are spectating this game live',
      waitingForOpponent: 'Waiting for an opponent…',
      shareRoomCode: (roomCode) => `Share room code ${roomCode} with your friend`,
      players: (current, max) => `${current}/${max} players`,
      copied: 'Copied!',
      copyCode: 'Copy code',
      startGame: 'Start game',
      ownerStarting: 'The room owner will start the game…',
      matchScore: (a, b) => `Match ${a} - ${b}`,
      turnExpired: 'Turn expired',
      undoOwnMove: 'Undo your last move',
      chat: 'Chat',
      noMessages: 'No messages yet…',
      guest: 'Guest',
      system: 'System',
      messagePlaceholder: 'Message…',
      send: 'Send',
    },
    lobby: {
      title: 'BaziGB Lobby',
      subtitle: 'Create an online room or practice against the bot',
      waiting: 'Waiting',
      inProgress: 'In progress',
      finished: 'Finished',
      recentlyPlayed: 'Recently played',
      refreshRecent: 'Refresh recent games',
      noRecentGames: 'You have not played yet — start your first game from the create-room section!',
      recentLoadError: 'Could not load recent games',
      win: 'Win',
      loss: 'Loss',
      draw: 'Draw',
      playAgain: 'Play again',
      chooseGame: '1. Choose game and settings',
      matchPoints: 'Match points',
      singleGame: 'Single game (1 point)',
      bestOf3: 'Best of 3 — first to 2',
      bestOf5: 'Best of 5 — first to 3',
      onlineOpponent: 'Online opponent',
      practiceBot: 'Practice with bot',
      startSolo: 'Start solo game',
      createRoom: 'Create new room',
      joinWithCode: '2. Join with invite code',
      joinDescription: 'If your friend already created a room, enter its 5-character code here.',
      enterRoomCode: 'Enter a room code first',
      createError: 'Could not create a room',
      loadRoomsError: 'Could not load rooms. Check the server connection.',
      activeRooms: 'Active rooms',
      refreshList: 'Refresh list',
      noActiveRooms: 'There are no rooms yet — create the first one!',
      copied: 'Copied!',
      copyCode: 'Copy code',
      enter: 'Join',
      playersShort: (current, max) => `${current}/${max}`,
    },
    tournaments: {
      registrationOpen: 'Registration open',
      inProgress: 'In progress',
      completed: 'Completed',
      fallbackDescription: 'Single-elimination knockout. Winners advance and one player takes it all.',
    },
    footer: {
      rules: 'Game rules',
      contact: 'Contact us',
    },
  },
};

export function getMessages(locale: Locale): AppMessages {
  return MESSAGES[locale];
}
