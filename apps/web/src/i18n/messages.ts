import type { Locale } from './config';

export interface AppMessages {
  navigation: {
    lobby: string;
    games: string;
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
    startWithSettings: string;
  };
  sound: {
    enable: string;
    disable: string;
    consentTitle: string;
    consentBody: string;
    playWithSound: string;
    continueSilent: string;
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
    you: string;
    creator: string;
    player: string;
    spectator: string;
    participants: string;
    reconnectingPlayer: (name: string, seconds?: number) => string;
    playerReconnected: (name: string) => string;
    exitTitle: string;
    exitCreatorBody: string;
    exitPlayerBody: string;
    stayInGame: string;
    confirmExit: string;
    endedByCreator: string;
    endedByPlayer: string;
    endedAfterDisconnect: string;
    backToLobby: string;
    playSameGame: string;
    requestRematch: string;
    acceptRematch: string;
    waitingForRematch: string;
    reactions: string;
  };
  lobby: {
    title: string;
    subtitle: string;
    alphaNotice: string;
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
  gameHub: {
    backToGames: string;
    subtitle: (game: string) => string;
    playBot: string;
    playBotDescription: string;
    createOnline: string;
    createOnlineDescription: string;
    joinByCode: string;
    joinByCodeDescription: string;
    roomCodeHint: string;
    invalidGame: string;
  };
  tournaments: {
    title: string;
    registrationOpen: string;
    inProgress: string;
    completed: string;
    fallbackDescription: string;
    openSummary: (count: number) => string;
    emptySummary: string;
    filterAll: string;
    filterOpen: string;
    loadError: string;
    joinError: string;
    noTournaments: string;
    noTournamentsHint: string;
    starts: (date: string) => string;
    players: (current: number, max: number) => string;
    joined: string;
    signInToJoin: string;
    full: string;
    join: string;
    viewBracket: string;
    viewResults: string;
  };
  footer: {
    rules: string;
    privacy: string;
    contact: string;
  };
}

const MESSAGES: Record<Locale, AppMessages> = {
  fa: {
    navigation: {
      lobby: 'لابی',
      games: 'بازی‌ها',
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
      startWithSettings: 'شروع با تنظیمات جدید',
    },
    sound: {
      enable: 'فعال‌سازی صدا',
      disable: 'قطع صدا',
      consentTitle: 'بازی با صدا؟',
      consentBody: 'صداها شروع بازی، نوبت شما، هشدار زمان و نتیجه را زنده‌تر می‌کنند. هر زمان خواستید از هدر بازی قطعشان کنید.',
      playWithSound: 'بازی با صدا',
      continueSilent: 'ادامه بدون صدا',
    },
    games: {
      ticTacToe: 'دوز',
      chess: 'شطرنج',
      backgammon: 'تخته',
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
      you: 'شما',
      creator: 'سازنده',
      player: 'بازیکن',
      spectator: 'تماشاچی',
      participants: 'افراد حاضر در اتاق',
      reconnectingPlayer: (name, seconds) => seconds === undefined
        ? `اتصال ${name} قطع شده؛ برای بازگشت او کمی صبر می‌کنیم`
        : `اتصال ${name} قطع شده؛ تا ${seconds} ثانیه برای بازگشت او صبر می‌کنیم`,
      playerReconnected: (name) => `${name} دوباره متصل شد`,
      exitTitle: 'از بازی خارج می‌شوید؟',
      exitCreatorBody: 'با خروج شما بازی برای همه تمام می‌شود و افراد حاضر باخبر خواهند شد.',
      exitPlayerBody: 'با خروج شما بازی تمام می‌شود و نتیجه برای افراد حاضر نمایش داده خواهد شد.',
      stayInGame: 'ماندن در بازی',
      confirmExit: 'خروج از بازی',
      endedByCreator: 'بازی توسط سازنده پایان یافت.',
      endedByPlayer: 'یکی از بازیکنان از بازی خارج شد؛ بازی پایان یافت.',
      endedAfterDisconnect: 'بازیکن در زمان تعیین‌شده برنگشت؛ بازی پایان یافت.',
      backToLobby: 'بازگشت به لابی',
      playSameGame: 'شروع یک دوز دیگر',
      requestRematch: 'درخواست یک دوز دیگر',
      acceptRematch: 'قبول بازی دوباره',
      waitingForRematch: 'منتظر تأیید حریف',
      reactions: 'واکنش سریع',
    },
    lobby: {
      title: 'لابی BaziGB',
      subtitle: 'بازی موردنظرتان را انتخاب کنید',
      alphaNotice: 'نسخهٔ آزمایشی رایگان',
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
      chooseGame: 'انتخاب بازی',
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
    gameHub: {
      backToGames: 'بازگشت به همهٔ بازی‌ها',
      subtitle: (game) => `روش بازی ${game} را انتخاب کنید`,
      playBot: 'بازی با ربات',
      playBotDescription: 'تمرین فوری، بدون انتظار برای حریف',
      createOnline: 'ایجاد اتاق آنلاین',
      createOnlineDescription: 'اتاق اختصاصی بسازید و حریف دعوت کنید',
      joinByCode: 'ورود با کد اتاق',
      joinByCodeDescription: 'با کد دعوت مستقیماً وارد اتاق شوید',
      roomCodeHint: 'کد دعوت را وارد کنید',
      invalidGame: 'این بازی پیدا نشد.',
    },
    tournaments: {
      title: 'تورنمنت‌ها',
      registrationOpen: 'ثبت‌نام باز',
      inProgress: 'در حال برگزاری',
      completed: 'پایان‌یافته',
      fallbackDescription: 'حذفی تک‌مرحله‌ای؛ برنده‌ها صعود می‌کنند و یک نفر قهرمان می‌شود.',
      openSummary: (count) => `${count} تورنمنت هم‌اکنون برای ثبت‌نام باز است.`,
      emptySummary: 'یک تورنمنت انتخاب کنید و جای خود را بگیرید.',
      filterAll: 'همه',
      filterOpen: 'باز',
      loadError: 'دریافت تورنمنت‌ها ممکن نشد.',
      joinError: 'عضویت در تورنمنت ممکن نشد.',
      noTournaments: 'تورنمنتی در این بخش نیست',
      noTournamentsHint: 'بعداً دوباره سر بزنید — تورنمنت‌های جدید به‌صورت منظم اضافه می‌شوند.',
      starts: (date) => `شروع: ${date}`,
      players: (current, max) => `${current}/${max} بازیکن`,
      joined: 'عضو شدید',
      signInToJoin: 'برای عضویت وارد شوید',
      full: 'ظرفیت تکمیل',
      join: 'عضویت',
      viewBracket: 'مشاهده جدول',
      viewResults: 'مشاهده نتایج',
    },
    footer: {
      rules: 'قوانین استفاده',
      privacy: 'حریم خصوصی',
      contact: 'تماس با ما',
    },
  },
  en: {
    navigation: {
      lobby: 'Lobby',
      games: 'Games',
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
      startWithSettings: 'Start with new settings',
    },
    sound: {
      enable: 'Enable sound',
      disable: 'Mute sound',
      consentTitle: 'Play with sound?',
      consentBody: 'Sound makes game start, your turn, time warnings and results feel alive. You can mute it from the game header at any time.',
      playWithSound: 'Play with sound',
      continueSilent: 'Continue silently',
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
      you: 'You',
      creator: 'Creator',
      player: 'Player',
      spectator: 'Spectator',
      participants: 'People in this room',
      reconnectingPlayer: (name, seconds) => seconds === undefined
        ? `${name} lost connection; we are giving them a moment to return`
        : `${name} lost connection; waiting up to ${seconds} seconds for their return`,
      playerReconnected: (name) => `${name} reconnected`,
      exitTitle: 'Leave this game?',
      exitCreatorBody: 'Leaving will end the game for everyone and notify the people in the room.',
      exitPlayerBody: 'Leaving will end the game and show the result to everyone still in the room.',
      stayInGame: 'Stay in game',
      confirmExit: 'Leave game',
      endedByCreator: 'The creator ended the game.',
      endedByPlayer: 'A player left, so the game has ended.',
      endedAfterDisconnect: 'The player did not return in time, so the game has ended.',
      backToLobby: 'Back to Lobby',
      playSameGame: 'Start another Tic-Tac-Toe',
      requestRematch: 'Request another game',
      acceptRematch: 'Accept rematch',
      waitingForRematch: 'Waiting for opponent',
      reactions: 'Quick reaction',
    },
    lobby: {
      title: 'BaziGB Lobby',
      subtitle: 'Choose a game to continue',
      alphaNotice: 'Free experimental version',
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
      chooseGame: 'Choose a game',
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
    gameHub: {
      backToGames: 'Back to all games',
      subtitle: (game) => `Choose how you want to play ${game}`,
      playBot: 'Play with bot',
      playBotDescription: 'Start a practice match without waiting',
      createOnline: 'Create online room',
      createOnlineDescription: 'Create a private room and invite an opponent',
      joinByCode: 'Join by room code',
      joinByCodeDescription: 'Enter an invitation code to join directly',
      roomCodeHint: 'Enter invite code',
      invalidGame: 'This game was not found.',
    },
    tournaments: {
      title: 'Tournaments',
      registrationOpen: 'Registration open',
      inProgress: 'In progress',
      completed: 'Completed',
      fallbackDescription: 'Single-elimination knockout. Winners advance and one player takes it all.',
      openSummary: (count) => `${count} tournament${count === 1 ? '' : 's'} open for registration right now.`,
      emptySummary: 'Pick a tournament and claim your spot.',
      filterAll: 'All',
      filterOpen: 'Open',
      loadError: 'Could not load tournaments.',
      joinError: 'Could not join the tournament.',
      noTournaments: 'No tournaments here',
      noTournamentsHint: 'Check back soon — new tournaments are added regularly.',
      starts: (date) => `Starts ${date}`,
      players: (current, max) => `${current}/${max} players`,
      joined: 'Joined',
      signInToJoin: 'Sign in to join',
      full: 'Full',
      join: 'Join',
      viewBracket: 'View bracket',
      viewResults: 'View results',
    },
    footer: {
      rules: 'Terms',
      privacy: 'Privacy',
      contact: 'Contact us',
    },
  },
};

export function getMessages(locale: Locale): AppMessages {
  return MESSAGES[locale];
}
