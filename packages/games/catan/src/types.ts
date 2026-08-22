import { Move } from '@bazigb/engine';

export type ResourceType = 'wood' | 'brick' | 'sheep' | 'wheat' | 'ore' | 'desert';

export const RESOURCE_TYPES: ResourceType[] = ['wood', 'brick', 'sheep', 'wheat', 'ore', 'desert'];

export type ResourceKind = Exclude<ResourceType, 'desert'>;

export interface ResourceMap {
  wood: number;
  brick: number;
  sheep: number;
  wheat: number;
  ore: number;
}

export const RESOURCE_KINDS: ResourceKind[] = ['wood', 'brick', 'sheep', 'wheat', 'ore'];

export const EMPTY_RESOURCES: ResourceMap = { wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 };

export type BuildingType = 'settlement' | 'city' | 'road';

export interface CatanBuilding {
  type: BuildingType;
  ownerId: string;
}

export interface CatanHex {
  id: number;
  q: number;
  r: number;
  resource: ResourceType;
  number: number | null; // 2-12, null for desert
}

export interface CatanVertex {
  id: string; // canonical: `${q},${r}` of the corner point
  building?: CatanBuilding;
}

export interface CatanEdge {
  id: string; // canonical sorted: `${v1}:${v2}`
  road?: {
    ownerId: string;
  };
}

export type HarborType = 'generic' | ResourceKind;

export interface CatanHarbor {
  id: string; // canonical sorted: `${v1}:${v2}` of the edge
  type: HarborType;
}

export interface CatanBoard {
  hexes: CatanHex[];
  vertices: Record<string, CatanVertex>;
  edges: Record<string, CatanEdge>;
  harbors: CatanHarbor[];
  /** vertexId -> hexIds adjacent */
  vertexHexes: Record<string, number[]>;
  /** hexId -> vertexIds adjacent */
  hexVertices: Record<string, string[]>;
  /** hexId -> edgeIds adjacent */
  hexEdges: Record<string, string[]>;
}

export type DevCardType = 'knight' | 'victory' | 'roadBuilding' | 'yearOfPlenty' | 'monopoly';

export interface CatanDevCard {
  id: string;
  type: DevCardType;
  boughtTurn: number;
}

export interface CatanPlayerState {
  id: string;
  resources: ResourceMap;
  buildings: {
    settlements: number;
    cities: number;
    roads: number;
  };
  victoryPoints: number;
  devCards: CatanDevCard[];
  knightsPlayed: number;
  hasLongestRoad: boolean;
  hasLargestArmy: boolean;
}

export type CatanPhase = 'setup' | 'playing' | 'discard' | 'robber' | 'steal' | 'finished';

export interface CatanTradeOffer {
  id: string;
  from: string;
  give: Partial<ResourceMap>;
  want: Partial<ResourceMap>;
  status: 'open' | 'done';
}

export interface CatanState {
  gameId: 'catan';
  board: CatanBoard;
  turn: string;
  turnNumber: number;
  phase: CatanPhase;
  winner: string | null;
  history: CatanMove[];
  match: import('@bazigb/engine').MatchConfig;
  scores: Record<string, number>;
  round: number;
  players: import('@bazigb/engine').Player[];
  /** per-player game state keyed by player id */
  playerStates: Record<string, CatanPlayerState>;
  /** setup: array of player ids in placement order (forward then reverse) */
  setupOrder: string[];
  /** شمارندهٔ گام‌های setup (هر آبادی یا جاده یک گام) */
  setupIndex: number;
  /** آخرین آبادی که در setup گذاشته شده؛ جادهٔ بعدی باید به آن بچسبد */
  lastPlacedSettlement: string | null;
  /** تعداد جاده‌های رایگان باقی‌مانده از کارت جاده‌سازی */
  freeRoadsRemaining: number;
  /** current dice result; undefined until rolled */
  dice: number[] | undefined;
  /** robber hex id */
  robberHexId: number;
  /** players that must discard (robber 7) */
  discardPlayers: string[];
  /** player that must move the robber */
  robberActor: string | null;
  /** players to steal from (after robber placed on a hex with buildings) */
  stealCandidates: string[] | null;
  /** longest road holder + length */
  longestRoad: { ownerId: string | null; length: number };
  /** bank resources */
  bank: ResourceMap;
  /** development card deck */
  devDeck: DevCardType[];
  /** trade offers */
  tradeOffers: CatanTradeOffer[];
  /** guard for single dev card per turn */
  hasPlayedDevCardThisTurn: boolean;
  /** اجازهٔ تخصیص فیلدهای اختصاصی بیشتر (قرارداد GameState) */
  [key: string]: unknown;
}

export interface CatanMove extends Move {
  kind:
    | 'placeInitial'
    | 'roll'
    | 'build'
    | 'tradeBank'
    | 'tradeP2P'
    | 'acceptTrade'
    | 'cancelTrade'
    | 'buyDevCard'
    | 'playDevCard'
    | 'discard'
    | 'moveRobber'
    | 'steal'
    | 'endTurn';
  /** settlement | city | road */
  type?: BuildingType;
  /** vertex id for settlement/city, edge id for road */
  id?: string;
  /** resources to discard (robber 7) */
  discard?: Partial<ResourceMap>;
  /** hex id to place the robber on */
  hexId?: number;
  /** victim player id to steal from */
  targetId?: string;
  /** For dev cards */
  devCardId?: string;
  devCardType?: DevCardType;
  /** منبع هدف کارت انحصار (Monopoly) */
  resource?: ResourceKind;
  /** For trading */
  offer?: Partial<ResourceMap>;
  request?: Partial<ResourceMap>;
  offerId?: string;
}
