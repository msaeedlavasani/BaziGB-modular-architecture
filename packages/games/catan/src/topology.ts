import { CatanBoard, CatanEdge, CatanHex, CatanVertex, ResourceType, CatanHarbor, HarborType } from './types';

/**
 * برد کاتان — چیدمان استاندارد ۱۹ خانه‌ای pointy-top (شعاع ۲):
 * ردیف‌ها: ۳ / ۴ / ۵ / ۴ / ۳ (محور q از -۲ تا ۲، r از -۲ تا ۲)
 * محدودیت: max(|q|, |r|, |q+r|) ≤ 2
 */

export const HEX_COORDS: { q: number; r: number }[] = [];
for (let r = -2; r <= 2; r++) {
  for (let q = -2; q <= 2; q++) {
    if (Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r)) <= 2) HEX_COORDS.push({ q, r });
  }
}

/** ترکیب استاندارد منابع برای ۱۹ خانه */
export const STANDARD_RESOURCES: ResourceType[] = [
  'wood', 'wood', 'wood', 'wood',
  'wheat', 'wheat', 'wheat', 'wheat',
  'sheep', 'sheep', 'sheep', 'sheep',
  'brick', 'brick', 'brick',
  'ore', 'ore', 'ore',
  'desert',
];

/** ترکیب استاندارد شماره‌های تاس برای ۱۸ خانهٔ غیر صحرا */
export const STANDARD_NUMBERS = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];

/** آفست گوشه‌های یک شش‌ضلعی در مختصات مقیاس‌شده (×۳) */
export const SCALED_CORNERS: [number, number][] = [
  [1, 1],
  [-1, 2],
  [-2, 1],
  [-1, -1],
  [1, -2],
  [2, -1],
];

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** شش گوشهٔ یک خانه در مختصات مقیاس‌شده */
export function hexCorners(q: number, r: number): { q: number; r: number }[] {
  const Q = 3 * q;
  const R = 3 * r;
  return SCALED_CORNERS.map(([dq, dr]) => ({ q: Q + dq, r: R + dr }));
}

/** شش لبهٔ هر خانه: بین گوشهٔ i و گوشهٔ i+1 */
export function hexEdges(q: number, r: number): [string, string][] {
  const corners = hexCorners(q, r);
  const out: [string, string][] = [];
  for (let i = 0; i < 6; i++) {
    const a = corners[i];
    const b = corners[(i + 1) % 6];
    out.push([vertexId(a.q, a.r), vertexId(b.q, b.r)]);
  }
  return out;
}

/** شناسهٔ متعارف یک رأس از مختصات گوشه */
export function vertexId(q: number, r: number): string {
  return `${q},${r}`;
}

/** شناسهٔ متعارف یک لبه (مرتب‌شده) */
export function edgeId(v1: string, v2: string): string {
  return v1 < v2 ? `${v1}:${v2}` : `${v2}:${v1}`;
}

/**
 * ساخت توپولوژی کامل برد: خانه‌ها، رأس‌ها، لبه‌ها و نگاشت‌های مجاورت.
 */
export function generateBoard(): CatanBoard {
  const hexes: CatanHex[] = [];
  HEX_COORDS.forEach(({ q, r }, i) => {
    hexes.push({
      id: i,
      q,
      r,
      resource: 'desert', // placeholder
      number: null,
    });
  });

  const vertices: Record<string, CatanVertex> = {};
  const edges: Record<string, CatanEdge> = {};
  const vertexHexes: Record<string, number[]> = {};
  const hexVertices: Record<string, string[]> = {};
  const hexEdgesMap: Record<string, string[]> = {};

  for (const hex of hexes) {
    const cornerList: string[] = [];
    for (const c of hexCorners(hex.q, hex.r)) {
      const id = vertexId(c.q, c.r);
      if (!vertices[id]) vertices[id] = { id };
      if (!vertexHexes[id]) vertexHexes[id] = [];
      if (!vertexHexes[id].includes(hex.id)) vertexHexes[id].push(hex.id);
      cornerList.push(id);
    }
    hexVertices[hex.id] = cornerList;
  }

  for (const hex of hexes) {
    const edgeList: string[] = [];
    for (const [a, b] of hexEdges(hex.q, hex.r)) {
      const id = edgeId(a, b);
      if (!edges[id]) edges[id] = { id };
      edgeList.push(id);
    }
    hexEdgesMap[hex.id] = edgeList;
  }

  // بنادر (Harbors)
  const boundaryEdges = Object.keys(edges).filter(eid => {
    const edgeHexes = hexes.filter(h => hexEdgesMap[h.id].includes(eid));
    return edgeHexes.length === 1;
  });

  const withAngle = boundaryEdges.map(eid => {
    const [v1, v2] = eid.split(':');
    const [q1, r1] = v1.split(',').map(Number);
    const [q2, r2] = v2.split(',').map(Number);
    const mq = (q1 + q2) / 2, mr = (r1 + r2) / 2;
    return { eid, angle: Math.atan2(mr, mq) };
  });
  withAngle.sort((a, b) => a.angle - b.angle);

  const step = withAngle.length / 9;
  const harborEdges = [];
  for (let i = 0; i < 9; i++) {
    harborEdges.push(withAngle[Math.floor(i * step)].eid);
  }

  const harborPool: HarborType[] = shuffle([
    'generic', 'generic', 'generic', 'generic',
    'wood', 'brick', 'wheat', 'sheep', 'ore'
  ]);

  const harbors: CatanHarbor[] = harborEdges.map((eid, i) => ({
    id: eid,
    type: harborPool[i]
  }));

  const board: CatanBoard = {
    hexes,
    vertices,
    edges,
    harbors,
    vertexHexes,
    hexVertices,
    hexEdges: hexEdgesMap,
  };
  return assignBoardContent(board);
}

/** چیدمان هوشمند منابع و اعداد با جلوگیری از تمرکز (Clash Prevention) */
export function assignBoardContent(board: CatanBoard): CatanBoard {
  const neighborsMap = board.hexes.map(h => {
    return board.hexes.filter(other => {
      if (h.id === other.id) return false;
      return board.hexVertices[h.id].some(v => board.hexVertices[other.id].includes(v));
    }).map(other => other.id);
  });

  function getClashScore(resources: ResourceType[]): number {
    let score = 0;
    resources.forEach((r, i) => {
      if (r === 'desert') return;
      neighborsMap[i].forEach(nid => {
        if (nid > i && resources[nid] === r) score++;
      });
    });
    return score;
  }

  function getRedClashScore(numbers: (number|null)[]): number {
    let score = 0;
    numbers.forEach((n, i) => {
      if (n !== 6 && n !== 8) return;
      neighborsMap[i].forEach(nid => {
        if (nid > i && (numbers[nid] === 6 || numbers[nid] === 8)) score++;
      });
    });
    return score;
  }

  let bestRes = STANDARD_RESOURCES, bestResScore = Infinity;
  for (let i = 0; i < 1000; i++) {
    const candidate = shuffle(STANDARD_RESOURCES);
    const s = getClashScore(candidate);
    if (s < bestResScore) { bestResScore = s; bestRes = candidate; }
    if (s === 0) break;
  }

  let bestNums = STANDARD_NUMBERS, bestNumScore = Infinity;
  for (let i = 0; i < 500; i++) {
    const candidate = shuffle(STANDARD_NUMBERS);
    const fullNums = new Array(board.hexes.length).fill(null);
    let nIdx = 0;
    bestRes.forEach((r, idx) => { if (r !== 'desert') fullNums[idx] = candidate[nIdx++]; });
    const s = getRedClashScore(fullNums);
    if (s < bestNumScore) { bestNumScore = s; bestNums = candidate; }
    if (s === 0) break;
  }

  let finalNumIdx = 0;
  const hexes = board.hexes.map((h, i) => {
    const resource = bestRes[i];
    const number = resource === 'desert' ? null : bestNums[finalNumIdx++];
    return { ...h, resource, number };
  });

  return { ...board, hexes };
}

/** رأس‌های مجاور یک رأس (از طریق لبه‌ها) */
export function adjacentVertices(board: CatanBoard, v: string): string[] {
  const out: string[] = [];
  for (const e of Object.values(board.edges)) {
    const [a, b] = e.id.split(':');
    if (a === v) out.push(b);
    else if (b === v) out.push(a);
  }
  return out;
}

/** لبه‌های متصل به یک رأس */
export function edgesAtVertex(board: CatanBoard, v: string): string[] {
  const out: string[] = [];
  for (const e of Object.values(board.edges)) {
    const [a, b] = e.id.split(':');
    if (a === v || b === v) out.push(e.id);
  }
  return out;
}

/** لبه‌های متصل به یک لبه (در هر دو سر آن) */
export function edgesAdjacentToEdge(board: CatanBoard, e: string): string[] {
  const [a, b] = e.split(':');
  const set = new Set<string>([...edgesAtVertex(board, a), ...edgesAtVertex(board, b)]);
  set.delete(e);
  return Array.from(set);
}

/** رأس‌های دو سر یک لبه */
export function edgeEndpoints(e: string): [string, string] {
  const [a, b] = e.split(':');
  return [a, b];
}
