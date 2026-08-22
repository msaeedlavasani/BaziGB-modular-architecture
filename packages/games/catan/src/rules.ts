import {
  DEFAULT_MATCH,
  sanitizeMatch,
  type GameAdapter,
  type MatchConfig,
  type Player,
} from '@bazigb/engine';
import {
  CatanBoard,
  CatanMove,
  CatanPlayerState,
  CatanState,
  EMPTY_RESOURCES,
  RESOURCE_KINDS,
  ResourceMap,
  DevCardType,
  ResourceKind,
} from './types';
import {
  generateBoard,
  adjacentVertices,
  edgesAtVertex,
  edgeEndpoints,
  shuffle,
} from './topology';

/* ---------------------------------- هزینه‌ها ---------------------------------- */

export const BUILD_COSTS: Record<string, Partial<ResourceMap>> = {
  settlement: { wood: 1, brick: 1, sheep: 1, wheat: 1 },
  city: { wheat: 2, ore: 3 },
  road: { wood: 1, brick: 1 },
  devCard: { wheat: 1, sheep: 1, ore: 1 },
};

export const WIN_VP = 10;
export const SETTLEMENT_VP = 1;
export const CITY_VP = 2;
export const LONGEST_ROAD_VP = 2;
export const LARGEST_ARMY_VP = 2;
export const LONGEST_ROAD_THRESHOLD = 5;
export const LARGEST_ARMY_THRESHOLD = 3;

export const BUILDING_LIMITS = { settlements: 5, cities: 4, roads: 15 };

/* ---------------------------------- ابزارها ---------------------------------- */

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T;
}

function emptyPlayer(id: string): CatanPlayerState {
  return {
    id,
    resources: { ...EMPTY_RESOURCES },
    buildings: { settlements: 0, cities: 0, roads: 0 },
    victoryPoints: 0,
    devCards: [],
    knightsPlayed: 0,
    hasLongestRoad: false,
    hasLargestArmy: false,
  };
}

function totalResources(r: Partial<ResourceMap>): number {
  return RESOURCE_KINDS.reduce((sum, k) => sum + (r[k] ?? 0), 0);
}

function addResources(a: ResourceMap, b: Partial<ResourceMap>): ResourceMap {
  const out = { ...a };
  for (const k of RESOURCE_KINDS) out[k] = (out[k] ?? 0) + (b[k] ?? 0);
  return out;
}

function subResources(a: ResourceMap, b: Partial<ResourceMap>): ResourceMap {
  const out = { ...a };
  for (const k of RESOURCE_KINDS) {
    const v = (out[k] ?? 0) - (b[k] ?? 0);
    if (v < 0) throw new Error('منابع کافی نیست');
    out[k] = v;
  }
  return out;
}

function hasEnough(a: ResourceMap, b: Partial<ResourceMap>): boolean {
  for (const k of RESOURCE_KINDS) if ((a[k] ?? 0) < (b[k] ?? 0)) return false;
  return true;
}

function hasAdjacentSettlement(board: CatanBoard, vertexId: string): boolean {
  for (const v of adjacentVertices(board, vertexId)) {
    const b = board.vertices[v]?.building;
    if (b) return true;
  }
  return false;
}

function ownsVertex(board: CatanBoard, vertexId: string, ownerId: string): boolean {
  const b = board.vertices[vertexId]?.building;
  return !!b && b.ownerId === ownerId;
}

function hasRoadToVertex(board: CatanBoard, vertexId: string, ownerId: string): boolean {
  for (const e of edgesAtVertex(board, vertexId)) {
    if (board.edges[e]?.road?.ownerId === ownerId) return true;
  }
  return false;
}

export function buildRoadGraph(board: CatanBoard, ownerId: string): Record<string, string[]> {
  const graph: Record<string, string[]> = {};
  for (const e of Object.values(board.edges)) {
    if (e.road?.ownerId !== ownerId) continue;
    const [a, b] = edgeEndpoints(e.id);
    const interruptA = board.vertices[a].building && board.vertices[a].building?.ownerId !== ownerId;
    const interruptB = board.vertices[b].building && board.vertices[b].building?.ownerId !== ownerId;
    if (!graph[a]) graph[a] = [];
    if (!graph[b]) graph[b] = [];
    if (!interruptA) graph[a].push(b);
    if (!interruptB) graph[b].push(a);
  }
  return graph;
}

export function longestRoadLength(graph: Record<string, string[]>): number {
  const vertices = Object.keys(graph);
  let best = 0;
  function dfs(v: string, visited: Set<string>, length: number) {
    if (length > best) best = length;
    for (const n of graph[v] ?? []) {
      const edgeKey = v < n ? `${v}:${n}` : `${n}:${v}`;
      if (!visited.has(edgeKey)) {
        visited.add(edgeKey);
        dfs(n, visited, length + 1);
        visited.delete(edgeKey);
      }
    }
  }
  for (const start of vertices) dfs(start, new Set(), 0);
  return best;
}

function computeVP(state: CatanState, playerId: string): number {
  const p = state.playerStates[playerId];
  let vp = p.buildings.settlements * SETTLEMENT_VP + p.buildings.cities * CITY_VP;
  if (p.hasLongestRoad) vp += LONGEST_ROAD_VP;
  if (p.hasLargestArmy) vp += LARGEST_ARMY_VP;
  vp += p.devCards.filter((c) => c.type === 'victory').length;
  return vp;
}

function updateAwardsAndVP(state: CatanState): CatanState {
  let bestLRPlayer = state.longestRoad.ownerId;
  let bestLRLen = state.longestRoad.length;
  for (const p of state.players) {
    const len = longestRoadLength(buildRoadGraph(state.board, p.id));
    if (len >= LONGEST_ROAD_THRESHOLD && len > bestLRLen) {
      bestLRLen = len;
      bestLRPlayer = p.id;
    }
  }
  let bestLAPlayer = null;
  let bestLACount = LARGEST_ARMY_THRESHOLD - 1;
  for (const p of Object.values(state.playerStates)) {
    if (p.knightsPlayed > bestLACount) {
      bestLACount = p.knightsPlayed;
      bestLAPlayer = p.id;
    }
  }
  const nextPlayers = clone(state.playerStates);
  for (const pId of Object.keys(nextPlayers)) {
    nextPlayers[pId].hasLongestRoad = pId === bestLRPlayer;
    nextPlayers[pId].hasLargestArmy = pId === bestLAPlayer;
    nextPlayers[pId].victoryPoints = computeVP({ ...state, playerStates: nextPlayers, longestRoad: { ownerId: bestLRPlayer, length: bestLRLen } }, pId);
  }
  return { ...state, longestRoad: { ownerId: bestLRPlayer, length: bestLRLen }, playerStates: nextPlayers };
}

function checkWin(state: CatanState): CatanState {
  for (const id of Object.keys(state.playerStates)) {
    if (state.playerStates[id].victoryPoints >= WIN_VP) {
      return { ...state, phase: 'finished', winner: id };
    }
  }
  return state;
}

function nextPlayerId(state: CatanState): string {
  const ids = state.players.map((p) => p.id);
  const idx = ids.indexOf(state.turn);
  return ids[(idx + 1) % ids.length];
}

function advanceTurn(state: CatanState): CatanState {
  const turn = nextPlayerId(state);
  return { ...state, turn, turnNumber: (state.turnNumber ?? 1) + 1, dice: undefined, phase: 'playing' as const, hasPlayedDevCardThisTurn: false, tradeOffers: [], freeRoadsRemaining: 0 };
}

export function playerPortRate(board: CatanBoard, playerId: string, resource: ResourceKind): number {
  const ownedV = Object.values(board.vertices).filter(v => v.building?.ownerId === playerId).map(v => v.id);
  let rate = 4;
  for (const h of board.harbors) {
    const [v1, v2] = h.id.split(':');
    if (ownedV.includes(v1) || ownedV.includes(v2)) {
      if (h.type === 'generic' && rate > 3) rate = 3;
      if (h.type === resource) return 2;
    }
  }
  return rate;
}

function createDevDeck(): DevCardType[] {
  const deck: DevCardType[] = [];
  for (let i = 0; i < 14; i++) deck.push('knight');
  for (let i = 0; i < 5; i++) deck.push('victory');
  for (let i = 0; i < 2; i++) deck.push('roadBuilding');
  for (let i = 0; i < 2; i++) deck.push('yearOfPlenty');
  for (let i = 0; i < 2; i++) deck.push('monopoly');
  return shuffle(deck);
}

/* ---------------------------------- ساخت وضعیت ---------------------------------- */

export function createState(players: Player[], match?: MatchConfig): CatanState {
  if (players.length < 3 || players.length > 4) {
    throw new Error('کاتان بین ۳ تا ۴ بازیکن نیاز دارد');
  }
  const safe = sanitizeMatch('catan', match ?? DEFAULT_MATCH);
  const playerStates: Record<string, CatanPlayerState> = {};
  players.forEach((p) => (playerStates[p.id] = emptyPlayer(p.id)));
  const board = generateBoard();
  const desert = board.hexes.find((h) => h.resource === 'desert');
  const robberHexId = desert ? desert.id : 0;
  return {
    gameId: 'catan',
    board,
    turn: players[0].id,
    turnNumber: 1,
    phase: 'setup',
    winner: null,
    history: [],
    match: safe,
    scores: players.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {}),
    round: 1,
    players,
    playerStates,
    setupOrder: players.map((p) => p.id),
    setupIndex: 0,
    lastPlacedSettlement: null,
    freeRoadsRemaining: 0,
    dice: undefined,
    robberHexId,
    discardPlayers: [],
    robberActor: null,
    stealCandidates: null,
    longestRoad: { ownerId: null, length: 0 },
    bank: { wood: 19, brick: 19, wheat: 19, sheep: 19, ore: 19 },
    devDeck: createDevDeck(),
    tradeOffers: [],
    hasPlayedDevCardThisTurn: false,
  };
}

/* ---------------------------------- حرکات قانونی ---------------------------------- */

function setupOrderFor(state: CatanState): string[] {
  return [...state.setupOrder, ...state.setupOrder.slice().reverse()];
}

function currentSetupPlayer(state: CatanState): string {
  const order = setupOrderFor(state);
  return order[Math.floor(state.setupIndex / 2)] ?? state.setupOrder[0];
}

export function getLegalMoves(state: CatanState): CatanMove[] {
  if (state.phase === 'finished') return [];
  const pid = state.turn;
  if (state.phase === 'setup') {
    const moves: CatanMove[] = [];
    const current = currentSetupPlayer(state);
    if (current !== pid) return [];
    const isRoadStep = state.setupIndex % 2 === 1;
    if (!isRoadStep) {
      // مطابق مرجع: آبادی فقط قانون فاصله را رعایت کند (اتصال به جاده لازم نیست)
      for (const v of Object.values(state.board.vertices)) {
        if (v.building || hasAdjacentSettlement(state.board, v.id)) continue;
        moves.push({ player: pid, kind: 'placeInitial', type: 'settlement', id: v.id });
      }
    } else {
      // مطابق مرجع: جاده باید به آخرین آبادیِ گذاشته‌شده بچسبد
      const anchor = state.lastPlacedSettlement;
      if (anchor) for (const e of edgesAtVertex(state.board, anchor)) if (!state.board.edges[e]?.road) moves.push({ player: pid, kind: 'placeInitial', type: 'road', id: e });
    }
    return moves;
  }
  if (state.phase === 'discard') {
    if (!state.discardPlayers.includes(pid)) return [];
    return [{ player: pid, kind: 'discard' }];
  }
  if (state.phase === 'robber') {
    if (state.robberActor !== pid) return [];
    const moves: CatanMove[] = [];
    for (const hex of state.board.hexes) if (hex.id !== state.robberHexId && hex.resource !== 'desert') moves.push({ player: pid, kind: 'moveRobber', hexId: hex.id });
    return moves;
  }
  if (state.phase === 'steal') {
    // دزد بازیکنِ نوبت است و از هر قربانیِ دارای منبع می‌تواند بدزدد
    if (pid !== state.turn) return [];
    return (state.stealCandidates ?? []).map((c) => ({ player: pid, kind: 'steal' as const, targetId: c }));
  }
  const moves: CatanMove[] = [];
  if (state.freeRoadsRemaining > 0) {
    // کارت جاده‌سازی: فقط جادهٔ رایگان تا تکمیل دو جاده
    for (const e of Object.values(state.board.edges)) {
      if (e.road) continue;
      const [a, b] = edgeEndpoints(e.id);
      if (hasRoadToVertex(state.board, a, pid) || hasRoadToVertex(state.board, b, pid) || ownsVertex(state.board, a, pid) || ownsVertex(state.board, b, pid)) moves.push({ player: pid, kind: 'build', type: 'road', id: e.id });
    }
    return moves;
  }
  if (!state.dice) { moves.push({ player: pid, kind: 'roll' }); return moves; }
  const p = state.playerStates[pid];
  for (const type of ['settlement', 'city', 'road'] as const) {
    const cost = BUILD_COSTS[type] as Partial<ResourceMap>;
    if (!hasEnough(p.resources, cost)) continue;
    if (type === 'road') {
      if (p.buildings.roads >= BUILDING_LIMITS.roads) continue;
      for (const e of Object.values(state.board.edges)) {
        if (e.road) continue;
        const [a, b] = edgeEndpoints(e.id);
        if (hasRoadToVertex(state.board, a, pid) || hasRoadToVertex(state.board, b, pid) || ownsVertex(state.board, a, pid) || ownsVertex(state.board, b, pid)) moves.push({ player: pid, kind: 'build', type: 'road', id: e.id });
      }
    } else if (type === 'settlement') {
      if (p.buildings.settlements >= BUILDING_LIMITS.settlements) continue;
      for (const v of Object.values(state.board.vertices)) if (!v.building && !hasAdjacentSettlement(state.board, v.id) && hasRoadToVertex(state.board, v.id, pid)) moves.push({ player: pid, kind: 'build', type: 'settlement', id: v.id });
    } else {
      if (p.buildings.cities >= BUILDING_LIMITS.cities) continue;
      for (const v of Object.values(state.board.vertices)) if (v.building?.ownerId === pid && v.building.type === 'settlement') moves.push({ player: pid, kind: 'build', type: 'city', id: v.id });
    }
  }
  if (hasEnough(p.resources, BUILD_COSTS.devCard) && state.devDeck.length > 0) moves.push({ player: pid, kind: 'buyDevCard' });
  if (!state.hasPlayedDevCardThisTurn) for (const card of p.devCards) if (card.boughtTurn < state.turnNumber && card.type !== 'victory') moves.push({ player: pid, kind: 'playDevCard', devCardId: card.id, devCardType: card.type });
  moves.push({ player: pid, kind: 'tradeBank' });
  moves.push({ player: pid, kind: 'tradeP2P' });
  moves.push({ player: pid, kind: 'endTurn' });
  return moves;
}

function applyMoveInner(state: CatanState, move: CatanMove): CatanState {
  const isStealPhase = state.phase === 'steal' && move.kind === 'steal';
  if (move.player !== state.turn && !isStealPhase && move.kind !== 'discard' && move.kind !== 'acceptTrade') throw new Error('نوبت این بازیکن نیست');
  if (state.phase === 'setup') {
    const expectedPlayer = currentSetupPlayer(state);
    if (move.player !== expectedPlayer) throw new Error('نوبت این بازیکن نیست');
    const isRoadStep = state.setupIndex % 2 === 1;
    const board = clone(state.board);
    const playerStates = clone(state.playerStates);
    if (move.type === 'settlement') {
      if (isRoadStep) throw new Error('در این گام باید جاده گذاشته شود');
      const v = board.vertices[move.id!];
      if (!v || v.building || hasAdjacentSettlement(board, v.id)) throw new Error('محل نامعتبر');
      v.building = { type: 'settlement', ownerId: move.player };
      const isSecondRound = Math.floor(state.setupIndex / 2) >= state.setupOrder.length;
      if (isSecondRound) for (const hexId of board.vertexHexes[v.id] ?? []) { const hex = board.hexes[hexId]; if (hex.resource !== 'desert') playerStates[move.player].resources[hex.resource] += 1; }
      playerStates[move.player].buildings.settlements += 1;
      return { ...state, board, playerStates, lastPlacedSettlement: v.id, setupIndex: state.setupIndex + 1, history: [...state.history, move] };
    }
    if (move.type === 'road') {
      if (!isRoadStep) throw new Error('در این گام باید آبادی گذاشته شود');
      const e = board.edges[move.id!];
      const anchor = state.lastPlacedSettlement;
      if (!e || e.road || !anchor || (edgeEndpoints(e.id)[0] !== anchor && edgeEndpoints(e.id)[1] !== anchor)) throw new Error('محل نامعتبر');
      e.road = { ownerId: move.player };
      playerStates[move.player].buildings.roads += 1;
      const next = { ...state, board, playerStates, lastPlacedSettlement: null, setupIndex: state.setupIndex + 1, history: [...state.history, move] };
      const totalSteps = state.setupOrder.length * 4;
      if (next.setupIndex >= totalSteps) return { ...next, phase: 'playing' as const, turn: state.setupOrder[0] };
      return { ...next, turn: currentSetupPlayer(next) };
    }
  }
  if (state.phase === 'discard') {
    if (!state.discardPlayers.includes(move.player)) throw new Error('چیزی برای دور ریختن ندارید');
    const hand = state.playerStates[move.player].resources;
    const need = Math.floor(totalResources(hand) / 2);
    const d = move.discard || EMPTY_RESOURCES;
    if (totalResources(d) !== need || !hasEnough(hand, d)) throw new Error('نامعتبر');
    const playerStates = clone(state.playerStates);
    playerStates[move.player].resources = subResources(hand, d);
    const bank = addResources(state.bank, d);
    const remaining = state.discardPlayers.filter(p => p !== move.player);
    if (remaining.length === 0) return { ...state, playerStates, bank, discardPlayers: [], phase: 'robber' as const, robberActor: state.turn, history: [...state.history, move] };
    return { ...state, playerStates, bank, discardPlayers: remaining, history: [...state.history, move] };
  }
  if (state.phase === 'robber') {
    if (move.hexId === state.robberHexId) throw new Error('نامعتبر');
    const hex = state.board.hexes.find(h => h.id === move.hexId);
    if (!hex) throw new Error('نامعتبر');
    const victims = new Set<string>();
    for (const vId of state.board.hexVertices[hex.id] ?? []) { const b = state.board.vertices[vId]?.building; if (b && b.ownerId !== state.turn && totalResources(state.playerStates[b.ownerId].resources) > 0) victims.add(b.ownerId); }
    const list = Array.from(victims);
    if (list.length === 0) return advanceTurn({ ...state, robberHexId: hex.id, history: [...state.history, move] });
    return { ...state, robberHexId: hex.id, phase: 'steal' as const, stealCandidates: list, history: [...state.history, move] };
  }
  if (state.phase === 'steal') {
    if (!state.stealCandidates?.includes(move.targetId!)) throw new Error('قربانی نامعتبر');
    const victimRes = state.playerStates[move.targetId!].resources;
    const kinds = RESOURCE_KINDS.filter(k => victimRes[k] > 0);
    const playerStates = clone(state.playerStates);
    if (kinds.length > 0) {
      const stolen = kinds[Math.floor(Math.random() * kinds.length)];
      playerStates[move.targetId!].resources[stolen] -= 1;
      playerStates[state.turn].resources[stolen] += 1;
    }
    return advanceTurn({ ...state, playerStates, history: [...state.history, move], stealCandidates: null });
  }
  // قرارداد: در فاز اصلی، قبل از ریختن تاس هیچ حرکت دیگری مجاز نیست
  if (state.phase === 'playing' && !state.dice && ['build', 'tradeBank', 'tradeP2P', 'buyDevCard', 'playDevCard', 'endTurn'].includes(move.kind)) {
    throw new Error('اول تاس بریزید');
  }
  if (move.kind === 'roll') {
    if (state.dice) throw new Error('تاس ریخته شده');
    const d = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
    const sum = d[0] + d[1];
    if (sum === 7) {
      const discarders = Object.values(state.playerStates).filter(p => totalResources(p.resources) > 7).map(p => p.id);
      if (discarders.length > 0) return { ...state, dice: d, phase: 'discard' as const, discardPlayers: discarders, history: [...state.history, move] };
      return { ...state, dice: d, phase: 'robber' as const, robberActor: state.turn, history: [...state.history, move] };
    }
    const playerStates = clone(state.playerStates);
    const bank = clone(state.bank);
    for (const hex of state.board.hexes) {
      if (hex.number !== sum || hex.id === state.robberHexId) continue;
      const gains: Record<string, number> = {};
      for (const vId of state.board.hexVertices[hex.id] ?? []) { const b = state.board.vertices[vId]?.building; if (b) gains[b.ownerId] = (gains[b.ownerId] || 0) + (b.type === 'city' ? 2 : 1); }
      const totalNeeded = Object.values(gains).reduce((a, b) => a + b, 0);
      if (totalNeeded > 0 && bank[hex.resource as ResourceKind] >= totalNeeded) {
        bank[hex.resource as ResourceKind] -= totalNeeded;
        for (const [pid, amt] of Object.entries(gains)) playerStates[pid].resources[hex.resource as ResourceKind] += amt;
      }
    }
    return updateAwardsAndVP({ ...state, dice: d, playerStates, bank, history: [...state.history, move] });
  }
  if (move.kind === 'build') {
    const cost = BUILD_COSTS[move.type!] as ResourceMap;
    const board = clone(state.board);
    const playerStates = clone(state.playerStates);
    const playerRes = playerStates[move.player].resources;
    if (move.type === 'road') {
      if (state.playerStates[move.player].buildings.roads >= BUILDING_LIMITS.roads) throw new Error('حداکثر جاده');
      const e = board.edges[move.id!];
      if (!e || e.road) throw new Error('محل نامعتبر');
      const [a, b] = edgeEndpoints(e.id);
      if (!hasRoadToVertex(board, a, move.player) && !hasRoadToVertex(board, b, move.player) && !ownsVertex(board, a, move.player) && !ownsVertex(board, b, move.player)) throw new Error('جاده باید به شبکهٔ خودتان متصل باشد');
      const free = state.freeRoadsRemaining > 0;
      if (!free) playerStates[move.player].resources = subResources(playerRes, cost);
      e.road = { ownerId: move.player };
      playerStates[move.player].buildings.roads += 1;
      return checkWin(updateAwardsAndVP({ ...state, board, playerStates, bank: free ? state.bank : addResources(state.bank, cost), freeRoadsRemaining: free ? state.freeRoadsRemaining - 1 : 0, history: [...state.history, move] }));
    }
    if (move.type === 'settlement') {
      if (state.playerStates[move.player].buildings.settlements >= BUILDING_LIMITS.settlements) throw new Error('حداکثر آبادی');
      const v = board.vertices[move.id!];
      if (!v || v.building || hasAdjacentSettlement(board, v.id)) throw new Error('محل نامعتبر');
      if (!hasRoadToVertex(board, v.id, move.player)) throw new Error('آبادی باید به جاده متصل باشد');
      playerStates[move.player].resources = subResources(playerRes, cost);
      v.building = { type: 'settlement', ownerId: move.player };
      playerStates[move.player].buildings.settlements += 1;
      return checkWin(updateAwardsAndVP({ ...state, board, playerStates, bank: addResources(state.bank, cost), history: [...state.history, move] }));
    }
    // city
    if (state.playerStates[move.player].buildings.cities >= BUILDING_LIMITS.cities) throw new Error('حداکثر شهر');
    const v = board.vertices[move.id!];
    if (!v || v.building?.ownerId !== move.player || v.building.type !== 'settlement') throw new Error('شهر باید روی آبادی خودتان ساخته شود');
    playerStates[move.player].resources = subResources(playerRes, cost);
    v.building = { type: 'city', ownerId: move.player };
    playerStates[move.player].buildings.cities += 1;
    playerStates[move.player].buildings.settlements -= 1;
    return checkWin(updateAwardsAndVP({ ...state, board, playerStates, bank: addResources(state.bank, cost), history: [...state.history, move] }));
  }
  if (move.kind === 'tradeBank') {
    if (!move.offer || !move.request) throw new Error('معامله نامعتبر');
    const giveKeys = Object.keys(move.offer), wantKeys = Object.keys(move.request);
    if (giveKeys.length !== 1 || wantKeys.length !== 1) throw new Error('معامله نامعتبر');
    const give = giveKeys[0] as ResourceKind, want = wantKeys[0] as ResourceKind;
    if (!RESOURCE_KINDS.includes(give) || !RESOURCE_KINDS.includes(want) || give === want) throw new Error('معامله نامعتبر');
    const rate = playerPortRate(state.board, move.player, give);
    const playerStates = clone(state.playerStates);
    if (playerStates[move.player].resources[give] < rate) throw new Error('منابع کافی نیست');
    if (state.bank[want] < 1) throw new Error('بانک این منبع را ندارد');
    playerStates[move.player].resources[give] -= rate;
    playerStates[move.player].resources[want] += 1;
    return { ...state, playerStates, bank: { ...state.bank, [give]: state.bank[give] + rate, [want]: state.bank[want] - 1 }, history: [...state.history, move] };
  }
  if (move.kind === 'tradeP2P') {
    if (!move.offer || !move.request) throw new Error('معامله نامعتبر');
    const allKeys = [...Object.keys(move.offer), ...Object.keys(move.request)];
    if (allKeys.length === 0 || allKeys.some(k => !RESOURCE_KINDS.includes(k as ResourceKind))) throw new Error('معامله نامعتبر');
    const playerStates = clone(state.playerStates);
    if (!hasEnough(playerStates[move.player].resources, move.offer)) throw new Error('منابع کافی نیست');
    return { ...state, tradeOffers: [...state.tradeOffers, { id: Math.random().toString(36).slice(2, 7), from: move.player, give: move.offer, want: move.request, status: 'open' as const }], history: [...state.history, move] };
  }
  if (move.kind === 'acceptTrade') {
    const offer = state.tradeOffers.find(o => o.id === move.offerId && o.status === 'open');
    if (!offer) throw new Error('پیشنهاد موجود نیست');
    if (offer.from === move.player) throw new Error('نمیتوانید پیشنهاد خودتان را بپذیرید');
    const playerStates = clone(state.playerStates);
    if (!hasEnough(playerStates[offer.from].resources, offer.give) || !hasEnough(playerStates[move.player].resources, offer.want)) throw new Error('منابع کافی نیست');
    playerStates[offer.from].resources = addResources(subResources(playerStates[offer.from].resources, offer.give), offer.want);
    playerStates[move.player].resources = addResources(subResources(playerStates[move.player].resources, offer.want), offer.give);
    return { ...state, playerStates, tradeOffers: state.tradeOffers.map(o => o.id === move.offerId ? { ...o, status: 'done' as const } : o), history: [...state.history, move] };
  }
  if (move.kind === 'buyDevCard') {
    if (state.devDeck.length === 0) throw new Error('کارت توسعه باقی نمانده');
    const playerStates = clone(state.playerStates), devDeck = [...state.devDeck], type = devDeck.pop()!;
    playerStates[move.player].resources = subResources(playerStates[move.player].resources, BUILD_COSTS.devCard);
    playerStates[move.player].devCards.push({ id: Math.random().toString(36).slice(2, 7), type, boughtTurn: state.turnNumber });
    return updateAwardsAndVP({ ...state, playerStates, devDeck, bank: addResources(state.bank, BUILD_COSTS.devCard), history: [...state.history, move] });
  }
  if (move.kind === 'playDevCard') {
    const playerStates = clone(state.playerStates);
    const p = playerStates[move.player];
    const card = p.devCards.find(c => c.id === move.devCardId);
    if (!card) throw new Error('کارت وجود ندارد');
    if (move.devCardType !== card.type) throw new Error('نوع کارت نامعتبر');
    if (card.boughtTurn >= state.turnNumber) throw new Error('کارت تازه خریده شده');
    if (card.type === 'victory') throw new Error('کارت امتیاز قابل بازی نیست');
    if (state.hasPlayedDevCardThisTurn) throw new Error('در این نوبت کارت بازی شده');
    p.devCards = p.devCards.filter(c => c.id !== move.devCardId);
    if (card.type === 'knight') { p.knightsPlayed += 1; return checkWin(updateAwardsAndVP({ ...state, playerStates, phase: 'robber' as const, robberActor: move.player, hasPlayedDevCardThisTurn: true, history: [...state.history, move] })); }
    if (card.type === 'monopoly') {
      const res = move.resource as ResourceKind;
      if (!res || !RESOURCE_KINDS.includes(res)) throw new Error('منبع نامعتبر');
      let total = 0;
      for (const id of Object.keys(playerStates)) { if (id === move.player) continue; total += playerStates[id].resources[res]; playerStates[id].resources[res] = 0; }
      p.resources[res] += total;
      return checkWin(updateAwardsAndVP({ ...state, playerStates, hasPlayedDevCardThisTurn: true, history: [...state.history, move] }));
    }
    if (card.type === 'yearOfPlenty') {
      if (!move.offer) throw new Error('منبع نامعتبر');
      if (totalResources(move.offer) !== 2) throw new Error('دقیقاً دو منبع');
      if (!hasEnough(state.bank, move.offer)) throw new Error('بانک منابع کافی ندارد');
      p.resources = addResources(p.resources, move.offer);
      return checkWin(updateAwardsAndVP({ ...state, playerStates, bank: subResources(state.bank, move.offer), hasPlayedDevCardThisTurn: true, history: [...state.history, move] }));
    }
    if (card.type === 'roadBuilding') {
      return checkWin(updateAwardsAndVP({ ...state, playerStates, hasPlayedDevCardThisTurn: true, freeRoadsRemaining: 2, history: [...state.history, move] }));
    }
  }
  if (move.kind === 'endTurn') {
    if (state.freeRoadsRemaining > 0) throw new Error('ابتدا جادههای رایگان را بگذارید');
    return advanceTurn({ ...state, history: [...state.history, move] });
  }
  throw new Error('نامعتبر');
}

export function applyMove(state: CatanState, move: CatanMove): CatanState { return applyMoveInner(clone(state), move); }
export function applyChain(state: CatanState, chain: CatanMove[]): CatanState { let s = state; for (const m of chain) s = applyMove(s, m); return s; }
export function isFinished(state: CatanState): boolean { return state.phase === 'finished'; }
export function getWinner(state: CatanState): string | null { return state.winner; }
export function serialize(state: CatanState): any {
  const pub = clone(state);
  for (const pid of Object.keys(pub.playerStates)) { const p = pub.playerStates[pid]; (p as any).resourceCount = totalResources(p.resources); (p as any).devCardCount = p.devCards.length; delete (p as any).resources; delete (p as any).devCards; }
  delete (pub as any).devDeck; return pub;
}
export const Catan: GameAdapter<CatanBoard, CatanMove> = { gameId: 'catan', name: 'کاتان', minPlayers: 3, maxPlayers: 4, createState, getLegalMoves, applyMove, applyChain, isFinished, getWinner, serialize };
