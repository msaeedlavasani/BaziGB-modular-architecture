import { describe, it, expect } from 'vitest';
import {
  createState,
  getLegalMoves,
  applyMove,
  isFinished,
  serialize,
  Catan,
  longestRoadLength,
  buildRoadGraph,
  generateBoard,
  edgesAtVertex,
} from '../src/index';

function makePlayers(n: number) {
  const colors = ['#ff4444', '#4444ff', '#ff8800', '#ffffff'];
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i + 1}`,
    name: `P${i + 1}`,
    color: colors[i],
  }));
}

type Game = ReturnType<typeof createState>;

function totalRes(r: import('../src/index').ResourceMap): number {
  let sum = 0;
  for (const k of ['wood', 'brick', 'sheep', 'wheat', 'ore'] as const) sum += r[k];
  return sum;
}

function cmpId(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * فیچر قطعی و معتبر برای setup:
 * - آبادی: کوچک‌ترین شناسهٔ قانونی که حداقل یک لبهٔ آزاد دارد (جادهٔ همان گام به آن می‌چسبد)
 * - جاده: کوچک‌ترین لبهٔ آزاد متصل به آخرین آبادیِ گذاشته‌شده
 * هندسهٔ برد ثابت است (فقط منابع/اعداد تصادفی‌اند)، پس خروجی این فیچر کاملاً قطعی است.
 */
function pickSetupMove(s: Game, step: number) {
  const moves = getLegalMoves(s).filter((m) => m.kind === 'placeInitial');
  expect(moves.length).toBeGreaterThan(0);
  const isRoad = step % 2 === 1;
  const cands = moves.filter((m) => (m.type === 'road') === isRoad);
  expect(cands.length).toBeGreaterThan(0);
  if (!isRoad) {
    const withFreeEdge = cands.filter((m) =>
      edgesAtVertex(s.board, m.id!).some((e) => !s.board.edges[e]?.road),
    );
    const pool = withFreeEdge.length > 0 ? withFreeEdge : cands;
    return [...pool].sort((a, b) => cmpId(a.id!, b.id!))[0];
  }
  return [...cands].sort((a, b) => cmpId(a.id!, b.id!))[0];
}

/** اجرای n گام اول setup با انتخاب قطعی */
function runSetupSteps(state: Game, n: number): Game {
  let s = state;
  for (let i = 0; i < n; i++) s = applyMove(s, pickSetupMove(s, i));
  return s;
}

/** اجرای کامل setup (۲ آبادی + ۲ جاده برای هر بازیکن) */
function runSetup(state: Game) {
  const steps = state.setupOrder.length * 4;
  const placedBy: string[] = [];
  let s = state;
  for (let i = 0; i < steps; i++) {
    placedBy.push(s.turn);
    s = applyMove(s, pickSetupMove(s, i));
  }
  return { state: s, placedBy };
}

/** بررسی ناورداهای setup: مارپیچ، ۲/۲، قانون فاصله، اتصال جاده‌ها و انتقال به بازی */
function assertSetupInvariants(s: Game, placedBy: string[]) {
  const order = [...s.setupOrder, ...[...s.setupOrder].reverse()];
  placedBy.forEach((pid, i) => expect(pid).toBe(order[Math.floor(i / 2)]));
  expect(s.phase).toBe('playing');
  expect(s.turn).toBe(s.setupOrder[0]);
  for (const p of Object.values(s.playerStates)) {
    expect(p.buildings.settlements).toBe(2);
    expect(p.buildings.roads).toBe(2);
  }
  // قانون فاصله: هیچ دو ساختمانی روی رأس‌های مجاور نباشد
  for (const e of Object.values(s.board.edges)) {
    const [a, b] = e.id.split(':');
    const ba = s.board.vertices[a].building;
    const bb = s.board.vertices[b].building;
    expect(!(ba && bb)).toBe(true);
  }
  // هر جاده باید به یک آبادیِ همان بازیکن متصل باشد (جادهٔ setup به آبادیِ همان گام می‌چسبد)
  for (const e of Object.values(s.board.edges)) {
    if (!e.road) continue;
    const [a, b] = e.id.split(':');
    const owner = e.road.ownerId;
    expect(
      s.board.vertices[a].building?.ownerId === owner ||
        s.board.vertices[b].building?.ownerId === owner,
    ).toBe(true);
  }
}

/** شبیه‌سازی وضعیت «پس از تاس» برای تست‌های قطعی فاز اصلی */
function playingState(n: number) {
  return runSetup(createState(makePlayers(n))).state;
}

/** تاس می‌ریزد تا عدد غیر از ۷ بیاید (مثل helper تست مرجع) */
function rollUntilSafe(s: Game): Game {
  let g = s;
  for (let attempt = 0; attempt < 60; attempt++) {
    g = applyMove(g, { player: g.turn, kind: 'roll' });
    if (g.phase === 'playing' && g.dice) return g;
    g = { ...g, dice: undefined, phase: 'playing' as const, discardPlayers: [], robberActor: null, stealCandidates: null };
  }
  return g;
}

describe('Catan — ساخت وضعیت و توپولوژی', () => {
  it('باید ۳ تا ۴ بازیکن بپذیرد', () => {
    const s3 = createState(makePlayers(3));
    expect(s3.players.length).toBe(3);
    const s4 = createState(makePlayers(4));
    expect(s4.players.length).toBe(4);
  });

  it('باید تعداد بازیکن خارج از بازه را رد کند', () => {
    expect(() => createState(makePlayers(2))).toThrow();
    expect(() => createState(makePlayers(5))).toThrow();
  });

  it('باید برد استاندارد شعاع ۲ داشته باشد (۱۹ خانه، ۵۴ رأس، ۷۲ لبه، ۹ بندر)', () => {
    const board = generateBoard();
    expect(board.hexes.length).toBe(19);
    expect(Object.keys(board.vertices).length).toBe(54);
    expect(Object.keys(board.edges).length).toBe(72);
    expect(board.harbors.length).toBe(9);
    // ترکیب منابع استاندارد: ۴ چوب، ۳ آجر، ۴ گندم، ۴ پشم، ۳ سنگ، ۱ صحرا
    const resCount: Record<string, number> = {};
    for (const h of board.hexes) resCount[h.resource] = (resCount[h.resource] || 0) + 1;
    expect(resCount).toEqual({ wood: 4, brick: 3, wheat: 4, sheep: 4, ore: 3, desert: 1 });
    // ترکیب شماره‌ها: ۲، ۱۲ یک‌بار و بقیه دوبار
    const numCount: Record<string, number> = {};
    for (const h of board.hexes) if (h.number !== null) numCount[h.number] = (numCount[h.number] || 0) + 1;
    expect(numCount).toEqual({ 2: 1, 3: 2, 4: 2, 5: 2, 6: 2, 8: 2, 9: 2, 10: 2, 11: 2, 12: 1 });
    // هر رأس به ۱ تا ۳ خانه متصل باشد
    for (const v of Object.values(board.vertices)) {
      const n = board.vertexHexes[v.id].length;
      expect(n >= 1 && n <= 3).toBe(true);
    }
  });

  it('تطبیق‌گر باید قرارداد GameAdapter را داشته باشد', () => {
    expect(Catan.gameId).toBe('catan');
    expect(Catan.minPlayers).toBe(3);
    expect(Catan.maxPlayers).toBe(4);
  });
});

describe('Catan — فاز راه‌اندازی (Setup)', () => {
  it('باید setup سه‌نفره را با ترتیب مارپیچی p1-p2-p3-p3-p2-p1 کامل کند', () => {
    const s = createState(makePlayers(3));
    const { state, placedBy } = runSetup(s);
    assertSetupInvariants(state, placedBy);
    expect(placedBy.length).toBe(12);
  });

  it('باید setup چهارنفره را با ترتیب مارپیچی p1-p2-p3-p4-p4-p3-p2-p1 کامل کند', () => {
    const s = createState(makePlayers(4));
    const { state, placedBy } = runSetup(s);
    assertSetupInvariants(state, placedBy);
    expect(placedBy.length).toBe(16);
  });

  it('باید قانون فاصله را در setup اعمال کند', () => {
    const s = createState(makePlayers(3));
    const moves = getLegalMoves(s);
    const first = moves.find((m) => m.kind === 'placeInitial' && m.type === 'settlement')!;
    const s2 = applyMove(s, first);
    const legal = getLegalMoves(s2).filter((m) => m.kind === 'placeInitial' && m.type === 'settlement');
    for (const n of edgesAtVertex(s2.board, first.id!)) {
      expect(legal.some((m) => m.id === n)).toBe(false);
    }
  });

  it('در دور دوم، آبادی فقط قانون فاصله را رعایت کند (الزامی به جادهٔ خودی نیست)', () => {
    // مطابق مرجع: placeSetupSettlement فقط distanceRuleOk را چک می‌کند
    const s0 = createState(makePlayers(3));
    const s6 = runSetupSteps(s0, 6); // پایان دور اول
    expect(s6.turn).toBe('p3');
    const legal = getLegalMoves(s6).filter((m) => m.kind === 'placeInitial' && m.type === 'settlement');
    expect(legal.length).toBeGreaterThan(0);
    // رأس‌های متصل به جادهٔ p3
    const p3RoadVerts = new Set<string>();
    for (const e of Object.values(s6.board.edges)) {
      if (e.road?.ownerId === 'p3') {
        const [a, b] = e.id.split(':');
        p3RoadVerts.add(a);
        p3RoadVerts.add(b);
      }
    }
    // آبادی دور دوم نباید فقط به رأس‌های جادهٔ خودی محدود باشد
    expect(legal.some((m) => !p3RoadVerts.has(m.id!))).toBe(true);
  });

  it('باید جادهٔ setup به آخرین آبادیِ گذاشته‌شده بچسبد', () => {
    // مطابق مرجع: placeSetupRoad باید به lastPlacedSettlement متصل باشد
    const s0 = createState(makePlayers(3));
    const m1 = pickSetupMove(s0, 0);
    const s1 = applyMove(s0, m1);
    const roads = getLegalMoves(s1).filter((m) => m.kind === 'placeInitial' && m.type === 'road');
    expect(roads.length).toBeGreaterThan(0);
    for (const r of roads) {
      expect(r.id!.split(':')).toContain(m1.id!);
    }
  });

  it('باید منابع اولیه را فقط در دور دوم بدهد (از خانه‌های مجاور آبادی دوم)', () => {
    const s0 = createState(makePlayers(3));
    const m1 = pickSetupMove(s0, 0);
    const s1 = applyMove(s0, m1);
    // دور اول: بدون منبع
    expect(totalRes(s1.playerStates['p1'].resources)).toBe(0);
    // تا گام آبادی دوم p1 (گام ۱۱ از ۱۲) پیش برو
    const s10 = runSetupSteps(s0, 10);
    expect(s10.turn).toBe('p1');
    const legal = getLegalMoves(s10).filter((m) => m.kind === 'placeInitial' && m.type === 'settlement');
    const withRes = legal.filter((m) =>
      (s10.board.vertexHexes[m.id!] ?? []).some((hid) => s10.board.hexes[hid].resource !== 'desert'),
    );
    const chosen = (withRes.length > 0 ? withRes : legal).sort((a, b) => cmpId(a.id!, b.id!))[0];
    const s11 = applyMove(s10, chosen);
    const expected = (s11.board.vertexHexes[chosen.id!] ?? []).filter(
      (hid) => s11.board.hexes[hid].resource !== 'desert',
    ).length;
    expect(expected).toBeGreaterThan(0);
    expect(totalRes(s11.playerStates['p1'].resources)).toBe(expected);
  });
});

describe('Catan — فاز اصلی', () => {
  it('باید تاس بریزد، تولید کند و نوبت را جلو ببرد', () => {
    const s = rollUntilSafe(playingState(3));
    expect(s.dice).toBeDefined();
    expect(s.phase).toBe('playing');
    const legal = getLegalMoves(s);
    expect(legal.some((m) => m.kind === 'tradeBank')).toBe(true);
    expect(legal.some((m) => m.kind === 'tradeP2P')).toBe(true);
    expect(legal.some((m) => m.kind === 'endTurn')).toBe(true);
    const next = applyMove(s, { player: s.turn, kind: 'endTurn' });
    expect(next.turn).not.toBe(s.turn);
    expect(next.turnNumber).toBe(s.turnNumber + 1);
    expect(next.dice).toBeUndefined();
  });

  it('باید جاده و آبادی در فاز اصلی با هزینهٔ منابع ساخته شود', () => {
    const s0 = playingState(3);
    const s = {
      ...s0,
      dice: [3, 4] as number[],
      playerStates: {
        ...s0.playerStates,
        p1: { ...s0.playerStates['p1'], resources: { wood: 5, brick: 5, sheep: 5, wheat: 5, ore: 5 } },
      },
    };
    const roadMoves = getLegalMoves(s).filter((m) => m.kind === 'build' && m.type === 'road');
    expect(roadMoves.length).toBeGreaterThan(0);
    const s1 = applyMove(s, roadMoves[0]);
    expect(s1.playerStates['p1'].resources.wood).toBe(4);
    expect(s1.playerStates['p1'].resources.brick).toBe(4);
    const settleMoves = getLegalMoves(s1).filter((m) => m.kind === 'build' && m.type === 'settlement');
    expect(settleMoves.length).toBeGreaterThan(0);
    const s2 = applyMove(s1, settleMoves[0]);
    expect(s2.playerStates['p1'].buildings.settlements).toBe(3);
    expect(s2.playerStates['p1'].resources.wood).toBe(3);
    expect(s2.playerStates['p1'].resources.brick).toBe(3);
    expect(s2.playerStates['p1'].resources.sheep).toBe(4);
    expect(s2.playerStates['p1'].resources.wheat).toBe(4);
    expect(s2.bank.wood).toBe(19 + 2); // جاده + آبادی به بانک برگشت
  });

  it('باید حرکات غیرقانونی را رد کند', () => {
    const s0 = playingState(3);
    // ساخت بدون تاس
    expect(() =>
      applyMove(s0, { player: s0.turn, kind: 'build', type: 'settlement', id: Object.keys(s0.board.vertices)[0] }),
    ).toThrow('اول تاس بریزید');
    // پایان نوبت بدون تاس
    expect(() => applyMove(s0, { player: s0.turn, kind: 'endTurn' })).toThrow('اول تاس بریزید');
    // حرکت خارج از نوبت
    expect(() => applyMove(s0, { player: 'p2', kind: 'roll' })).toThrow('نوبت این بازیکن نیست');
    const s = { ...s0, dice: [3, 4] as number[] };
    // آبادی روی رأس اشغال‌شده
    const occupied = Object.keys(s.board.vertices).find((v) => s.board.vertices[v].building)!;
    expect(() => applyMove(s, { player: s.turn, kind: 'build', type: 'settlement', id: occupied })).toThrow('محل نامعتبر');
    // جادهٔ بدون اتصال به شبکهٔ خودی
    const p1RoadVerts = new Set<string>();
    for (const e of Object.values(s.board.edges)) {
      if (e.road?.ownerId === 'p1') {
        const [a, b] = e.id.split(':');
        p1RoadVerts.add(a);
        p1RoadVerts.add(b);
      }
    }
    const farEdge = Object.keys(s.board.edges).find(
      (e) => !s.board.edges[e].road && !e.split(':').some((v) => p1RoadVerts.has(v)),
    )!;
    expect(() => applyMove(s, { player: s.turn, kind: 'build', type: 'road', id: farEdge })).toThrow(
      'جاده باید به شبکهٔ خودتان متصل باشد',
    );
  });

  it('باید برنده را هنگام رسیدن به ۱۰ امتیاز تشخیص دهد', () => {
    let s = playingState(3);
    const verts = Object.keys(s.board.vertices);
    const vSett = verts.slice(0, 3);
    const vCity = verts.slice(3, 6);
    const board = s.board;
    for (const v of vSett) board.vertices[v].building = { type: 'settlement', ownerId: 'p1' };
    for (const v of vCity) board.vertices[v].building = { type: 'city', ownerId: 'p1' };
    s = {
      ...s,
      board,
      dice: [3, 4] as number[],
      playerStates: {
        ...s.playerStates,
        p1: {
          ...s.playerStates['p1'],
          buildings: { settlements: 3, cities: 3, roads: 2 },
          resources: { wood: 0, brick: 0, sheep: 0, wheat: 2, ore: 3 },
        },
      },
    };
    // ۳ آبادی + ۳ شهر = ۹ امتیاز → ساخت شهر روی آبادی → ۱۰ امتیاز
    const s2 = applyMove(s, { player: 'p1', kind: 'build', type: 'city', id: vSett[0] });
    expect(s2.phase).toBe('finished');
    expect(s2.winner).toBe('p1');
    expect(isFinished(s2)).toBe(true);
  });

  it('باید طولانی‌ترین جاده را محاسبه کند', () => {
    const graph: Record<string, string[]> = {
      a: ['b'],
      b: ['a', 'c'],
      c: ['b', 'd'],
      d: ['c', 'e'],
      e: ['d'],
    };
    expect(longestRoadLength(graph)).toBe(4);
  });

  it('باید طولانی‌ترین جاده را با قطع‌شدگی توسط آبادی حریف محاسبه کند', () => {
    // مطابق مرجع: جاده با رسیدن به آبادی حریف قطع می‌شود
    const s = createState(makePlayers(3));
    const board = s.board;
    const e0 = Object.values(board.edges)[0];
    const [, v1] = e0.id.split(':');
    const e1 = Object.values(board.edges).find((e) => e.id !== e0.id && e.id.includes(v1))!;
    board.edges[e0.id].road = { ownerId: 'p1' };
    board.edges[e1.id].road = { ownerId: 'p1' };
    // آبادی حریف در رأس میانی → مسیر قطع می‌شود
    board.vertices[v1].building = { type: 'settlement', ownerId: 'p2' };
    expect(longestRoadLength(buildRoadGraph(board, 'p1'))).toBe(1);
    // بدون قطع‌شدگی → ۲
    board.vertices[v1].building = undefined;
    expect(longestRoadLength(buildRoadGraph(board, 'p1'))).toBe(2);
  });

  it('باید serialize عمومی تولید کند (بدون دست‌ها و عرشه) و state اصلی را دست‌نخورده نگه دارد', () => {
    const s = playingState(3);
    const ser: any = serialize(s);
    for (const pid of Object.keys(ser.playerStates)) {
      const p = ser.playerStates[pid] as any;
      expect(typeof p.resourceCount).toBe('number');
      expect(typeof p.devCardCount).toBe('number');
      expect(p.resources).toBeUndefined();
      expect(p.devCards).toBeUndefined();
    }
    expect(ser.devDeck).toBeUndefined();
    // state اصلی حفظ شده
    expect(s.playerStates['p1'].resources).toBeDefined();
    expect(Array.isArray(s.devDeck)).toBe(true);
    // جهش در خروجی serialize نباید state اصلی را تغییر دهد
    (ser as any).dice = [9, 9];
    expect(s.dice).toBeUndefined();
  });
});

describe('Catan — قوانین مرجع (Reference-derived)', () => {
  it('تولید منابع باید با موجودی بانک محدود شود', () => {
    // مطابق مرجع: اگر بانک نتواند کل تولید یک منبع را بپردازد، آن تولید انجام نمی‌شود
    let s = playingState(3);
    const woodHexes = s.board.hexes.filter((h) => h.resource === 'wood');
    const board = s.board;
    for (const h of woodHexes) {
      board.vertices[board.hexVertices[h.id][0]].building = { type: 'settlement', ownerId: 'p1' };
    }
    const targetNum = woodHexes[0].number!;
    const ps = Object.fromEntries(
      Object.entries(s.playerStates).map(([id, p]) => [
        id,
        { ...p, resources: { ...p.resources, wood: 0 } },
      ]),
    );
    s = { ...s, board, playerStates: ps, bank: { ...s.bank, wood: 0 } };
    let rolled = false;
    for (let attempt = 0; attempt < 200 && !rolled; attempt++) {
      s = applyMove(s, { player: s.turn, kind: 'roll' });
      if (s.phase === 'playing' && s.dice && s.dice[0] + s.dice[1] === targetNum) rolled = true;
      else s = { ...s, dice: undefined, phase: 'playing' as const, discardPlayers: [], robberActor: null, stealCandidates: null };
    }
    expect(rolled).toBe(true);
    // بانک چوب ندارد → هیچ بازیکنی چوب نگیرد و بانک صفر بماند
    for (const p of Object.values(s.playerStates)) expect(p.resources.wood).toBe(0);
    expect(s.bank.wood).toBe(0);
  });

  it('باید در عدد ۷ دقیقاً نصف منابع را دور بریزد', () => {
    let s = playingState(3);
    s = {
      ...s,
      dice: [3, 4] as number[],
      phase: 'discard' as const,
      discardPlayers: ['p1'],
      playerStates: {
        ...s.playerStates,
        p1: { ...s.playerStates['p1'], resources: { wood: 10, brick: 0, sheep: 0, wheat: 0, ore: 0 } },
      },
    };
    // مقدار اشتباه رد شود
    expect(() =>
      applyMove(s, { player: 'p1', kind: 'discard', discard: { wood: 3, brick: 0, sheep: 0, wheat: 0, ore: 0 } }),
    ).toThrow('نامعتبر');
    // دقیقاً نصف: ۵
    const s2 = applyMove(s, { player: 'p1', kind: 'discard', discard: { wood: 5, brick: 0, sheep: 0, wheat: 0, ore: 0 } });
    expect(s2.playerStates['p1'].resources.wood).toBe(5);
    expect(s2.bank.wood).toBe(24);
    expect(s2.discardPlayers).toEqual([]);
    expect(s2.phase).toBe('robber');
    expect(s2.robberActor).toBe('p1');
  });

  it('باید راهزن را جابه‌جا کند و از قربانی کارت بدزدد', () => {
    let s = playingState(3);
    const board = s.board;
    const targetHex = board.hexes.find((h) => h.id !== s.robberHexId && h.resource !== 'desert')!;
    board.vertices[board.hexVertices[targetHex.id][0]].building = { type: 'settlement', ownerId: 'p2' };
    s = {
      ...s,
      board,
      dice: [3, 4] as number[],
      phase: 'robber' as const,
      robberActor: 'p1',
      playerStates: {
        ...s.playerStates,
        p1: { ...s.playerStates['p1'], resources: { wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 } },
        p2: { ...s.playerStates['p2'], resources: { wood: 3, brick: 0, sheep: 0, wheat: 0, ore: 0 } },
      },
    };
    const s2 = applyMove(s, { player: 'p1', kind: 'moveRobber', hexId: targetHex.id });
    expect(s2.phase).toBe('steal');
    expect(s2.stealCandidates).toContain('p2');
    // p2 فقط چوب دارد → چوب جابه‌جا می‌شود
    const s3 = applyMove(s2, { player: 'p1', kind: 'steal', targetId: 'p2' });
    expect(s3.playerStates['p2'].resources.wood).toBe(2);
    expect(s3.playerStates['p1'].resources.wood).toBe(1);
    expect(s3.turn).toBe('p2'); // نوبت جلو رفت
  });

  it('باید در فاز دزدی، حرکات قانونیِ دزد (بازیکن نوبت) را برگرداند', () => {
    // یکپارچگی چندنفره: UI باید از getLegalMoves بتواند اقدام دزدی را استخراج کند
    let s = playingState(3);
    s = {
      ...s,
      dice: [3, 4] as number[],
      phase: 'steal' as const,
      turn: 'p1',
      stealCandidates: ['p2', 'p3'],
      playerStates: {
        ...s.playerStates,
        p1: { ...s.playerStates['p1'], resources: { wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 } },
        p2: { ...s.playerStates['p2'], resources: { wood: 1, brick: 0, sheep: 0, wheat: 0, ore: 0 } },
        p3: { ...s.playerStates['p3'], resources: { brick: 1, wood: 0, sheep: 0, wheat: 0, ore: 0 } },
      },
    };
    const legal = getLegalMoves(s);
    expect(legal.some((m) => m.kind === 'steal' && m.targetId === 'p2')).toBe(true);
    expect(legal.some((m) => m.kind === 'steal' && m.targetId === 'p3')).toBe(true);
    expect(legal.every((m) => m.player === 'p1')).toBe(true);
  });

  it('باید نرخ معامله با بانک را با بنادر کاهش دهد (۴:۱، ۳:۱، ۲:۱)', () => {
    let s = playingState(3);
    const board = s.board;
    // آبادی‌های setup را پاک کن تا بندرِ اتفاقیِ p1 نرخ پایه را خراب نکند
    for (const v of Object.values(board.vertices)) {
      if (v.building?.ownerId === 'p1') v.building = undefined;
    }
    s = {
      ...s,
      board,
      dice: [3, 4] as number[],
      playerStates: {
        ...s.playerStates,
        p1: { ...s.playerStates['p1'], resources: { wood: 30, brick: 0, sheep: 0, wheat: 0, ore: 0 } },
      },
    };
    // پیش‌فرض ۴:۱
    const s1 = applyMove(s, { player: 'p1', kind: 'tradeBank', offer: { wood: 4 }, request: { brick: 1 } });
    expect(s1.playerStates['p1'].resources.wood).toBe(26);
    expect(s1.playerStates['p1'].resources.brick).toBe(1);
    expect(s1.bank.wood).toBe(23);
    expect(s1.bank.brick).toBe(18);
    // بندر عمومی ۳:۱
    const gh = board.harbors.find((h) => h.type === 'generic')!;
    const [gv1] = gh.id.split(':');
    board.vertices[gv1].building = { type: 'settlement', ownerId: 'p1' };
    const s2 = applyMove({ ...s1, board }, { player: 'p1', kind: 'tradeBank', offer: { wood: 3 }, request: { sheep: 1 } });
    expect(s2.playerStates['p1'].resources.wood).toBe(23);
    expect(s2.playerStates['p1'].resources.sheep).toBe(1);
    // بندر منبع چوب ۲:۱
    const wh = board.harbors.find((h) => h.type === 'wood')!;
    const [wv1] = wh.id.split(':');
    board.vertices[wv1].building = { type: 'settlement', ownerId: 'p1' };
    const s3 = applyMove({ ...s2, board }, { player: 'p1', kind: 'tradeBank', offer: { wood: 2 }, request: { wheat: 1 } });
    expect(s3.playerStates['p1'].resources.wood).toBe(21);
    expect(s3.playerStates['p1'].resources.wheat).toBe(1);
  });

  it('باید معاملهٔ بازیکن‌به‌بازیکن را پیشنهاد و نهایی کند', () => {
    let s = playingState(3);
    s = {
      ...s,
      dice: [3, 4] as number[],
      playerStates: {
        ...s.playerStates,
        p1: { ...s.playerStates['p1'], resources: { wood: 5, brick: 0, sheep: 0, wheat: 0, ore: 0 } },
        p2: { ...s.playerStates['p2'], resources: { wood: 0, brick: 5, sheep: 0, wheat: 0, ore: 0 } },
      },
    };
    const s1 = applyMove(s, { player: 'p1', kind: 'tradeP2P', offer: { wood: 1 }, request: { brick: 1 } });
    expect(s1.tradeOffers.length).toBe(1);
    const offerId = s1.tradeOffers[0].id;
    // پذیرش پیشنهاد خودی رد شود
    expect(() => applyMove(s1, { player: 'p1', kind: 'acceptTrade', offerId })).toThrow(
      'نمیتوانید پیشنهاد خودتان را بپذیرید',
    );
    // پذیرش توسط p2
    const s2 = applyMove(s1, { player: 'p2', kind: 'acceptTrade', offerId });
    expect(s2.playerStates['p1'].resources.wood).toBe(4);
    expect(s2.playerStates['p1'].resources.brick).toBe(1);
    expect(s2.playerStates['p2'].resources.brick).toBe(4);
    expect(s2.playerStates['p2'].resources.wood).toBe(1);
    expect(s2.tradeOffers[0].status).toBe('done');
  });

  it('باید کارت توسعه بخرد و شوالیه/ارتش بزرگ را اعمال کند', () => {
    let s = playingState(3);
    s = {
      ...s,
      dice: [3, 4] as number[],
      playerStates: {
        ...s.playerStates,
        p1: {
          ...s.playerStates['p1'],
          resources: { wood: 0, brick: 0, sheep: 1, wheat: 1, ore: 1 },
          knightsPlayed: 2,
          devCards: [
            { id: 'k1', type: 'knight' as const, boughtTurn: 0 },
            { id: 'k2', type: 'knight' as const, boughtTurn: 1 },
          ],
        },
      },
    };
    // خرید کارت (گندم + پشم + سنگ)
    const s1 = applyMove(s, { player: 'p1', kind: 'buyDevCard' });
    expect(s1.playerStates['p1'].devCards.length).toBe(3);
    expect(s1.playerStates['p1'].resources.wheat).toBe(0);
    // کارت تازه‌خریده‌شده (boughtTurn === نوبت فعلی) در همان نوبت قابل بازی نیست
    expect(() =>
      applyMove(s1, { player: 'p1', kind: 'playDevCard', devCardId: 'k2', devCardType: 'knight' }),
    ).toThrow('کارت تازه خریده شده');
    // شوالیه → ارتش بزرگ (۳ شوالیه)
    const s2 = applyMove(s1, { player: 'p1', kind: 'playDevCard', devCardId: 'k1', devCardType: 'knight' });
    expect(s2.playerStates['p1'].knightsPlayed).toBe(3);
    expect(s2.playerStates['p1'].hasLargestArmy).toBe(true);
    expect(s2.phase).toBe('robber');
    // جابه‌جایی راهزن به خانهٔ بدون ساختمان حریف → نوبت بعدی
    const otherHex = s2.board.hexes.find(
      (h) =>
        h.id !== s2.robberHexId &&
        !(s2.board.hexVertices[h.id] ?? []).some(
          (vid) => s2.board.vertices[vid].building?.ownerId === 'p2' || s2.board.vertices[vid].building?.ownerId === 'p3',
        ),
    )!.id;
    const s3 = applyMove(s2, { player: 'p1', kind: 'moveRobber', hexId: otherHex });
    expect(s3.phase).toBe('playing');
    expect(s3.turn).toBe('p2');
  });

  it('باید کارت انحصار همهٔ منابع یک نوع را بگیرد', () => {
    let s = playingState(3);
    s = {
      ...s,
      dice: [3, 4] as number[],
      playerStates: {
        ...s.playerStates,
        p1: {
          ...s.playerStates['p1'],
          resources: { wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 },
          devCards: [{ id: 'm1', type: 'monopoly' as const, boughtTurn: 0 }],
        },
        p2: { ...s.playerStates['p2'], resources: { wood: 0, brick: 0, sheep: 3, wheat: 0, ore: 0 } },
        p3: { ...s.playerStates['p3'], resources: { wood: 0, brick: 0, sheep: 2, wheat: 0, ore: 0 } },
      },
    };
    const s2 = applyMove(s, {
      player: 'p1',
      kind: 'playDevCard',
      devCardId: 'm1',
      devCardType: 'monopoly',
      resource: 'sheep',
    });
    expect(s2.playerStates['p1'].resources.sheep).toBe(5);
    expect(s2.playerStates['p2'].resources.sheep).toBe(0);
    expect(s2.playerStates['p3'].resources.sheep).toBe(0);
  });

  it('باید کارت سال فراوانی دقیقاً دو منبع از بانک بدهد', () => {
    let s = playingState(3);
    s = {
      ...s,
      dice: [3, 4] as number[],
      playerStates: {
        ...s.playerStates,
        p1: {
          ...s.playerStates['p1'],
          resources: { wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 },
          devCards: [{ id: 'y1', type: 'yearOfPlenty' as const, boughtTurn: 0 }],
        },
      },
    };
    // بیش از دو منبع رد شود
    expect(() =>
      applyMove(s, { player: 'p1', kind: 'playDevCard', devCardId: 'y1', devCardType: 'yearOfPlenty', offer: { wood: 3 } }),
    ).toThrow('دقیقاً دو منبع');
    const s2 = applyMove(s, {
      player: 'p1',
      kind: 'playDevCard',
      devCardId: 'y1',
      devCardType: 'yearOfPlenty',
      offer: { wood: 1, brick: 1 },
    });
    expect(s2.playerStates['p1'].resources.wood).toBe(1);
    expect(s2.playerStates['p1'].resources.brick).toBe(1);
    expect(s2.bank.wood).toBe(18);
    expect(s2.bank.brick).toBe(18);
  });

  it('باید کارت جاده‌سازی دو جادهٔ رایگان بدهد', () => {
    let s = playingState(3);
    s = {
      ...s,
      dice: [3, 4] as number[],
      playerStates: {
        ...s.playerStates,
        p1: {
          ...s.playerStates['p1'],
          resources: { wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 },
          devCards: [{ id: 'rb1', type: 'roadBuilding' as const, boughtTurn: 0 }],
        },
      },
    };
    const s1 = applyMove(s, { player: 'p1', kind: 'playDevCard', devCardId: 'rb1', devCardType: 'roadBuilding' });
    expect(s1.freeRoadsRemaining).toBe(2);
    const legal = getLegalMoves(s1);
    expect(legal.length).toBeGreaterThan(0);
    expect(legal.every((m) => m.kind === 'build' && m.type === 'road')).toBe(true);
    // پایان نوبت قبل از تکمیل رد شود
    expect(() => applyMove(s1, { player: 'p1', kind: 'endTurn' })).toThrow('ابتدا جادههای رایگان را بگذارید');
    const s2 = applyMove(s1, legal[0]);
    expect(s2.freeRoadsRemaining).toBe(1);
    const s3 = applyMove(s2, getLegalMoves(s2)[0]);
    expect(s3.freeRoadsRemaining).toBe(0);
    expect(s3.playerStates['p1'].buildings.roads).toBe(4);
    // منابع رایگان مصرف نشدند
    expect(s3.playerStates['p1'].resources.wood).toBe(0);
    expect(s3.bank.wood).toBe(19);
    const s4 = applyMove(s3, { player: 'p1', kind: 'endTurn' });
    expect(s4.turn).toBe('p2');
  });
});
