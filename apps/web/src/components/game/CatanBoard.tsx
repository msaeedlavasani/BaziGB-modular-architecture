'use client';
import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { Plus, Minus, Dices, Flag } from 'lucide-react';
import { getLegalMoves, playerPortRate, type CatanMove, type ResourceKind } from '@bazigb/game-catan';

/* ------------------------------------------------------------------ */
/* Assets — از ریپوی مرجع catan-online (webp)                          */
/* ------------------------------------------------------------------ */
const A = {
  tile: (r: string) => `/assets/catan/tile-${r}.webp`,
  num: (n: number) => `/assets/catan/num-${n}.webp`,
  robber: '/assets/catan/robber.webp',
  harbor: (t: string) => `/assets/catan/harbor-${t}.webp`,
  settlement: (c: string) => `/assets/catan/settlement-${c}.webp`,
  city: (c: string) => `/assets/catan/city-${c}.webp`,
};

/** رنگ بازیکن → نام asset مهره (پالت مرجع)؛ رنگ ناشناخته → شکل برداری */
const COLOR_ASSET: Record<string, string> = {
  '#b23a2e': 'red',
  '#2b6ca3': 'blue',
  '#e0952b': 'orange',
  '#3f7d4a': 'green',
};

const RESOURCES: ResourceKind[] = ['wood', 'brick', 'sheep', 'wheat', 'ore'];
const RES_LABEL: Record<string, string> = {
  wood: 'چوب',
  brick: 'آجر',
  sheep: 'پشم',
  wheat: 'گندم',
  ore: 'سنگ',
  desert: 'صحرا',
};
const DEV_LABEL: Record<string, string> = {
  knight: 'شوالیه',
  victory: 'امتیاز پیروزی',
  roadBuilding: 'جاده‌سازی',
  yearOfPlenty: 'سال فراوانی',
  monopoly: 'انحصار',
};
const RES_EMOJI: Record<string, string> = {
  wood: '🪵',
  brick: '🧱',
  sheep: '🐑',
  wheat: '🌾',
  ore: '⛰️',
};

/* ------------------------------------------------------------------ */
/* هندسه — نگاشت قطعی از توپولوژی موتور به پیکسل                       */
/* ------------------------------------------------------------------ */
const U = 46; // شعاع شش‌ضلعی در فضای viewBox
const K = U / 50; // نسبت مقیاس نسبت به فضای مرجع
const SQRT3 = Math.sqrt(3);

function hexCenter(q: number, r: number) {
  return { x: U * SQRT3 * (q + r / 2), y: U * 1.5 * r };
}
/** شناسهٔ رأس «q,r» در فضای scaled → پیکسل (rأس گوشهٔ شش‌ضلعی است) */
function vertexPos(id: string) {
  const [q, r] = id.split(',').map(Number);
  return { x: U * SQRT3 * (q / 3 + r / 6), y: U * (r / 2) };
}
function hexPath(cx: number, cy: number, mult = 1) {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const rad = (Math.PI / 180) * (60 * i - 30);
    pts.push(`${(cx + U * mult * Math.cos(rad)).toFixed(2)},${(cy + U * mult * Math.sin(rad)).toFixed(2)}`);
  }
  return pts.join(' ');
}

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
interface PrivateData {
  resources?: Record<string, number>;
  devCards?: { id: string; type: string; boughtTurn?: number }[];
  victoryPoints?: number;
}

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onMove: (move: any) => void;
  disabled?: boolean;
  myId?: string;
  privateState?: PrivateData | null;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
export default function CatanBoard({ state, onMove, disabled = false, myId = 'p1', privateState = null }: Props) {
  const [buildMode, setBuildMode] = useState<'road' | 'settlement' | 'city' | null>(null);
  const [discardSel, setDiscardSel] = useState<Record<string, number>>({});
  const [bankGive, setBankGive] = useState<ResourceKind>('wood');
  const [bankWant, setBankWant] = useState<ResourceKind>('brick');
  const [p2pGive, setP2pGive] = useState<ResourceKind>('wood');
  const [p2pWant, setP2pWant] = useState<ResourceKind>('brick');
  const [monopolyRes, setMonopolyRes] = useState<ResourceKind>('wood');
  const [yopA, setYopA] = useState<ResourceKind>('wood');
  const [yopB, setYopB] = useState<ResourceKind>('brick');
  const [playTarget, setPlayTarget] = useState<string | null>(null);

  // دادهٔ خصوصی من: پیام سرور، یا state کامل (حالت محلی)
  const myPrivate: PrivateData | undefined =
    privateState ?? (state?.playerStates?.[myId] ? state.playerStates[myId] : undefined);

  // وضعیت ادغام‌شده برای getLegalMoves (منابع/کارت‌های من + حالت عمومی)
  const merged = useMemo(() => {
    if (!state) return null;
    if (!myPrivate || !myPrivate.resources) return state;
    return {
      ...state,
      playerStates: {
        ...state.playerStates,
        [myId]: {
          ...(state.playerStates?.[myId] ?? {}),
          resources: myPrivate.resources,
          devCards: myPrivate.devCards ?? [],
          victoryPoints: myPrivate.victoryPoints ?? 0,
        },
      },
    };
  }, [state, myPrivate, myId]);

  const phase: string | undefined = state?.phase;
  const setupIndex: number = state?.setupIndex ?? 0;
  const inSetup = phase === 'setup';
  const setupIsRoad = inSetup && setupIndex % 2 === 1;
  const myTurn = !!state && state.turn === myId;
  const needDiscard = phase === 'discard' && (state?.discardPlayers ?? []).includes(myId);
  const iAmThief = phase === 'steal' && myTurn;
  const iMoveRobber = phase === 'robber' && (state?.robberActor ?? state.turn) === myId;
  const canAct = (myTurn || needDiscard) && !disabled;

  const legal: CatanMove[] = useMemo(() => {
    if (!canAct || !merged) return [];
    try {
      return getLegalMoves(merged) as CatanMove[];
    } catch {
      return [];
    }
  }, [canAct, merged]);

  const settlementMoves = legal.filter((m) => m.kind === 'build' && m.type === 'settlement');
  const roadMoves = legal.filter((m) => m.kind === 'build' && m.type === 'road');
  const cityMoves = legal.filter((m) => m.kind === 'build' && m.type === 'city');
  const setupSettlementMoves = legal.filter((m) => m.kind === 'placeInitial' && m.type === 'settlement');
  const setupRoadMoves = legal.filter((m) => m.kind === 'placeInitial' && m.type === 'road');
  const canRoll = legal.some((m) => m.kind === 'roll');
  const canEndTurn = legal.some((m) => m.kind === 'endTurn');
  const canBuyDev = legal.some((m) => m.kind === 'buyDevCard');
  const freeRoads = state?.freeRoadsRemaining ?? 0;

  // تنها یک نوع ساخت ممکن است → خودکار انتخاب شود
  const autoMode: typeof buildMode =
    !buildMode && !inSetup
      ? freeRoads > 0
        ? 'road'
        : cityMoves.length > 0 && settlementMoves.length === 0 && roadMoves.length === 0
          ? 'city'
          : settlementMoves.length > 0 && roadMoves.length === 0 && cityMoves.length === 0
            ? 'settlement'
            : roadMoves.length > 0 && settlementMoves.length === 0 && cityMoves.length === 0
              ? 'road'
              : null
      : buildMode;
  const mode = autoMode;

  const discardTotal = Object.values(discardSel).reduce((a, b) => a + b, 0);
  const myResources = myPrivate?.resources ?? {};
  const handTotal = RESOURCES.reduce((s, r) => s + (myResources[r] ?? 0), 0);
  const needToDiscard = Math.floor(handTotal / 2);

  /* ---------------- board geometry (viewBox) ---------------- */
  const vb = useMemo(() => {
    if (!state?.board) return '-340 -240 680 480';
    const pts: { x: number; y: number }[] = [];
    for (const h of state.board.hexes as { q: number; r: number }[]) pts.push(hexCenter(h.q, h.r));
    for (const v of Object.values(state.board.vertices as Record<string, { id: string }>)) pts.push(vertexPos(v.id));
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const minX = Math.min(...xs) - 24 * K;
    const maxX = Math.max(...xs) + 24 * K;
    const minY = Math.min(...ys) - 26 * K;
    const maxY = Math.max(...ys) + 30 * K;
    return `${minX.toFixed(1)} ${minY.toFixed(1)} ${(maxX - minX).toFixed(1)} ${(maxY - minY).toFixed(1)}`;
  }, [state]);

  if (!state || !state.board) {
    return (
      <Paper elevation={0} sx={{ p: 4, borderRadius: 4, bgcolor: 'background.paper', textAlign: 'center' }}>
        <Typography sx={{ color: 'text.secondary' }}>در انتظار وضعیت بازی…</Typography>
      </Paper>
    );
  }

  /* ---------------- handlers ---------------- */
  const send = (m: unknown) => onMove({ player: myId, ...(m as object) });

  const clickVertex = (id: string) => {
    if (!canAct) return;
    if (inSetup && !setupIsRoad) {
      const mv = setupSettlementMoves.find((m) => m.id === id);
      if (mv) return send(mv);
      return;
    }
    if (mode === 'settlement') {
      const mv = settlementMoves.find((m) => m.id === id);
      if (mv) return send(mv);
    } else if (mode === 'city') {
      const mv = cityMoves.find((m) => m.id === id);
      if (mv) return send(mv);
    }
  };
  const clickEdge = (id: string) => {
    if (!canAct) return;
    if (inSetup && setupIsRoad) {
      const mv = setupRoadMoves.find((m) => m.id === id);
      if (mv) return send(mv);
      return;
    }
    if (mode === 'road') {
      const mv = roadMoves.find((m) => m.id === id);
      if (mv) return send(mv);
    }
  };
  const clickHex = (id: number) => {
    if (canAct && iMoveRobber) send({ kind: 'moveRobber', hexId: id });
  };

  const doTradeBank = () => {
    if (bankGive === bankWant) return;
    const rate = playerPortRate(state.board, myId, bankGive);
    send({ kind: 'tradeBank', offer: { [bankGive]: rate }, request: { [bankWant]: 1 } });
  };
  const doTradeP2P = () => {
    if (p2pGive === p2pWant) return;
    send({ kind: 'tradeP2P', offer: { [p2pGive]: 1 }, request: { [p2pWant]: 1 } });
  };
  const doPlayCard = (cardId: string, type: string) => {
    if (type === 'monopoly') return send({ kind: 'playDevCard', devCardId: cardId, devCardType: type, resource: monopolyRes });
    if (type === 'yearOfPlenty') return send({ kind: 'playDevCard', devCardId: cardId, devCardType: type, offer: { [yopA]: 1, [yopB]: 1 } });
    send({ kind: 'playDevCard', devCardId: cardId, devCardType: type });
  };

  /* ---------------- derived views ---------------- */
  const players = Object.keys(state.playerStates ?? {});
  const turnPlayer = state.players?.find((p: { id: string }) => p.id === state.turn)?.name ?? state.turn;
  const openOffers = (state.tradeOffers ?? []).filter((o: { status: string }) => o.status === 'open');
  const myOffers = openOffers.filter((o: { from: string }) => o.from === myId);
  const incomingOffers = openOffers.filter((o: { from: string }) => o.from !== myId);
  const robberHex = state.board.hexes.find((h: { id: number }) => h.id === state.robberHexId);

  // مهره روی رأس
  const vertexOwner = (id: string) => state.board.vertices[id]?.building;

  // دستورالعمل وضعیت
  const instruction = (() => {
    if (inSetup)
      return `${setupIsRoad ? 'جاده' : 'آبادی'} خود را بگذارید — ${setupIsRoad ? 'جاده باید به آخرین آبادی بچسبد' : 'قانون فاصله رعایت شود'}`;
    if (phase === 'discard')
      return needDiscard ? `باید ${needToDiscard} منبع دور بریزید (نصف دستتان)` : 'بازیکنان در حال دور ریختن…';
    if (phase === 'robber') return iMoveRobber ? 'یک خانه برای راهزن انتخاب کنید' : 'راهزن در حال جابه‌جایی…';
    if (phase === 'steal') return iAmThief ? 'یک بازیکن برای دزدی انتخاب کنید' : 'در حال دزدی…';
    if (phase === 'playing') {
      if (canRoll) return 'تاس بریزید';
      if (freeRoads > 0) return `${freeRoads} جادهٔ رایگان باقی مانده — روی لبه کلیک کنید`;
      if (mode === 'settlement') return 'روی رأس طلایی برای آبادی کلیک کنید';
      if (mode === 'city') return 'روی آبادی خودتان برای شهر کلیک کنید';
      if (mode === 'road') return 'روی لبهٔ روشن برای جاده کلیک کنید';
      if (state.dice) return 'حرکت بعدی را انجام دهید یا نوبت را تمام کنید';
      return '';
    }
    if (phase === 'finished') return 'پایان بازی';
    return '';
  })();

  const bankRate = playerPortRate(state.board, myId, bankGive);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', minWidth: 0 }}>
      {/* بازیکن‌ها */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          justifyContent: 'center',
        }}
      >
        {players.map((pid) => {
          const ps = state.playerStates[pid];
          const pMeta = state.players?.find((p: { id: string }) => p.id === pid);
          const color = pMeta?.color ?? '#b23a2e';
          const isTurn = state.turn === pid;
          const isMe = pid === myId;
          const pubVp =
            ps.victoryPoints ??
            (ps.buildings ? ps.buildings.settlements + 2 * ps.buildings.cities + (ps.hasLongestRoad ? 2 : 0) + (ps.hasLargestArmy ? 2 : 0) : 0);
          const myVp = isMe ? (myPrivate?.victoryPoints ?? pubVp) : pubVp;
          return (
            <Chip
              key={pid}
              avatar={
                <Box
                  sx={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    bgcolor: color,
                    border: '2px solid rgba(255,255,255,0.35)',
                    ml: '6px',
                  }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                  <Typography component="span" sx={{ fontWeight: 800, fontSize: '0.8rem' }}>
                    {isMe ? 'شما' : pMeta?.name ?? pid}
                  </Typography>
                  <Typography component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 700 }}>
                    {myVp} امتیاز
                  </Typography>
                  <Typography component="span" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                    {ps.resourceCount ?? 0} منبع
                  </Typography>
                  <Typography component="span" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                    {ps.devCardCount ?? 0} کارت
                  </Typography>
                  {ps.knightsPlayed > 0 && (
                    <Typography component="span" sx={{ fontSize: '0.7rem', color: 'primary.light' }}>
                      ⚔️ {ps.knightsPlayed}
                    </Typography>
                  )}
                  {(ps.hasLongestRoad || ps.hasLargestArmy) && (
                    <Typography component="span" sx={{ fontSize: '0.7rem', color: 'primary.main' }}>
                      🏆
                    </Typography>
                  )}
                </Box>
              }
              variant="outlined"
              sx={{
                borderRadius: 10,
                borderColor: isTurn ? 'primary.main' : 'divider',
                bgcolor: isTurn ? 'rgba(238,172,47,0.10)' : 'rgba(0,0,0,0.2)',
                ...(isTurn ? { boxShadow: '0 0 12px rgba(238,172,47,0.25)' } : {}),
              }}
            />
          );
        })}
      </Box>

      {/* راهنما */}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Chip
          label={`نوبت: ${turnPlayer}`}
          size="small"
          variant="outlined"
          sx={{ borderRadius: 10, borderColor: 'divider', fontWeight: 800 }}
        />
        {inSetup && (
          <Chip
            label={`مرحله راه‌اندازی (${setupIsRoad ? 'جاده' : 'آبادی'})`}
            size="small"
            color="primary"
            sx={{ borderRadius: 10, fontWeight: 800 }}
          />
        )}
        {state.dice && phase !== 'setup' && (
          <Chip
            label={`🎲 ${state.dice[0]} + ${state.dice[1]} = ${state.dice[0] + state.dice[1]}`}
            size="small"
            sx={{ borderRadius: 10, borderColor: 'divider', fontWeight: 800, fontSize: '0.85rem' }}
          />
        )}
      </Box>

      {instruction && (
        <Typography variant="body2" sx={{ textAlign: 'center', color: 'primary.light', fontWeight: 700 }}>
          {instruction}
        </Typography>
      )}

      {/* برد */}
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 680,
          mx: 'auto',
          borderRadius: 4,
          bgcolor: '#0a1520',
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <svg viewBox={vb} style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'manipulation' }}>
          <defs>
            <radialGradient id="catanSea" cx="50%" cy="42%" r="75%">
              <stop offset="0%" stopColor="#16324a" />
              <stop offset="100%" stopColor="#0a1a28" />
            </radialGradient>
            <filter id="catanShadow" x="-60%" y="-60%" width="220%" height="220%">
              <feDropShadow dx="0" dy={1.5 * K} stdDeviation={1.5 * K} floodColor="#000" floodOpacity="0.4" />
            </filter>
            {(state.board.hexes as { id: number; q: number; r: number }[]).map((h) => {
              const c = hexCenter(h.q, h.r);
              return (
                <clipPath id={`catan-clip-${h.id}`} key={h.id}>
                  <polygon points={hexPath(c.x, c.y)} />
                </clipPath>
              );
            })}
          </defs>

          <rect x={-400} y={-300} width={800} height={600} fill="url(#catanSea)" />

          {/* خانه‌ها */}
          {state.board.hexes.map((h: { id: number; q: number; r: number; resource: string; number: number | null }) => {
            const c = hexCenter(h.q, h.r);
            const imgSize = 116 * K;
            const robberHere = h.id === state.robberHexId;
            const clickable = iMoveRobber && canAct;
            return (
              <g
                key={h.id}
                onClick={() => clickHex(h.id)}
                style={{ cursor: clickable ? 'pointer' : 'default' }}
              >
                <g clipPath={`url(#catan-clip-${h.id})`}>
                  <image href={A.tile(h.resource)} x={c.x - imgSize / 2} y={c.y - imgSize / 2} width={imgSize} height={imgSize} preserveAspectRatio="xMidYMid slice" />
                </g>
                <polygon points={hexPath(c.x, c.y)} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth={1.5} />
                {clickable && (
                  <polygon
                    points={hexPath(c.x, c.y)}
                    fill="#EEAC2F"
                    fillOpacity={0.25}
                    stroke="#EEAC2F"
                    strokeOpacity={0.6}
                    strokeWidth={2}
                  />
                )}
                {h.number !== null && (
                  <image href={A.num(h.number)} x={c.x - 17 * K} y={c.y - 17 * K} width={34 * K} height={34 * K} filter="url(#catanShadow)" />
                )}
                {robberHere && (
                  <image href={A.robber} x={c.x - 17 * K} y={c.y - 31 * K} width={34 * K} height={34 * K} filter="url(#catanShadow)" />
                )}
              </g>
            );
          })}

          {/* بنادر */}
          {(state.board.harbors ?? []).map((port: { id: string; type: string }) => {
            const [a, b] = port.id.split(':');
            const v1 = vertexPos(a);
            const v2 = vertexPos(b);
            const mx = (v1.x + v2.x) / 2;
            const my = (v1.y + v2.y) / 2;
            const size = 62 * K;
            return (
              <image
                key={port.id}
                href={A.harbor(port.type)}
                x={mx * 1.22 - size / 2}
                y={my * 1.22 - size / 2}
                width={size}
                height={size}
                filter="url(#catanShadow)"
              />
            );
          })}

          {/* لبه‌ها (جاده‌ها) */}
          {Object.values(state.board.edges as Record<string, { id: string; road?: { ownerId: string } }>).map((e) => {
            const [a, b] = e.id.split(':');
            const p1 = vertexPos(a);
            const p2 = vertexPos(b);
            const owner = e.road?.ownerId;
            const ownerColor = state.players?.find((p: { id: string }) => p.id === owner)?.color;
            const valid = canAct && (inSetup ? setupIsRoad && !!setupRoadMoves.find((m) => m.id === e.id) : mode === 'road' && !!roadMoves.find((m) => m.id === e.id));
            return (
              <g key={e.id}>
                {owner && (
                  <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={ownerColor ?? '#888'} strokeWidth={9 * K} strokeLinecap="round" />
                )}
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={owner ? (ownerColor ?? '#aaa') : valid ? '#EEAC2F' : 'transparent'}
                  strokeWidth={owner ? 6 * K : 12 * K}
                  strokeOpacity={owner ? 1 : valid ? 0.55 : 0}
                  strokeLinecap="round"
                  onClick={() => valid && clickEdge(e.id)}
                  style={{ cursor: valid ? 'pointer' : 'default' }}
                />
                {/* ناحیه کلیک بزرگ‌تر برای لبه‌های معتبر */}
                {valid && (
                  <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="transparent" strokeWidth={18 * K} onClick={() => clickEdge(e.id)} style={{ cursor: 'pointer' }} />
                )}
              </g>
            );
          })}

          {/* رأس‌ها */}
          {Object.values(state.board.vertices as Record<string, { id: string; building?: { type: string; ownerId: string } }>).map((v) => {
            const p = vertexPos(v.id);
            const b = v.building;
            const assetColor = b ? COLOR_ASSET[b.ownerId] || null : null;
            const ownerColor = b ? state.players?.find((pl: { id: string }) => pl.id === b.ownerId)?.color : null;
            const canSettle = canAct && !inSetup && mode === 'settlement' && !!settlementMoves.find((m) => m.id === v.id);
            const canCity = canAct && !inSetup && mode === 'city' && !!cityMoves.find((m) => m.id === v.id);
            const canSetupSettle = canAct && inSetup && !setupIsRoad && !!setupSettlementMoves.find((m) => m.id === v.id);
            const placeable = canSettle || canSetupSettle;
            return (
              <g key={v.id}>
                {placeable && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={10 * K}
                    fill="#EEAC2F"
                    fillOpacity={0.55}
                    stroke="#B97F12"
                    strokeWidth={1.2}
                    onClick={() => clickVertex(v.id)}
                    style={{ cursor: 'pointer' }}
                  />
                )}
                {b?.type === 'settlement' && assetColor && (
                  <image href={A.settlement(assetColor)} x={p.x - 13 * K} y={p.y - 15 * K} width={26 * K} height={26 * K} filter="url(#catanShadow)" onClick={() => canCity && clickVertex(v.id)} style={{ cursor: canCity ? 'pointer' : 'default' }} />
                )}
                {b?.type === 'settlement' && !assetColor && (
                  <g filter="url(#catanShadow)" onClick={() => canCity && clickVertex(v.id)} style={{ cursor: canCity ? 'pointer' : 'default' }}>
                    <polygon
                      points={`${p.x},${p.y - 9 * K} ${p.x + 8 * K},${p.y - 1 * K} ${p.x + 8 * K},${p.y + 8 * K} ${p.x - 8 * K},${p.y + 8 * K} ${p.x - 8 * K},${p.y - 1 * K}`}
                      fill={ownerColor ?? '#ccc'}
                      stroke={canCity ? '#EEAC2F' : 'rgba(0,0,0,0.5)'}
                      strokeWidth={canCity ? 2.5 : 1.2}
                    />
                  </g>
                )}
                {b?.type === 'city' && assetColor && (
                  <image href={A.city(assetColor)} x={p.x - 15 * K} y={p.y - 17 * K} width={30 * K} height={30 * K} filter="url(#catanShadow)" />
                )}
                {b?.type === 'city' && !assetColor && (
                  <g filter="url(#catanShadow)">
                    <rect x={p.x - 11 * K} y={p.y - 6 * K} width={22 * K} height={13 * K} fill={ownerColor ?? '#ccc'} stroke="rgba(0,0,0,0.5)" strokeWidth={1.2} />
                    <polygon points={`${p.x - 11 * K},${p.y - 6 * K} ${p.x - 4 * K},${p.y - 13 * K} ${p.x + 3 * K},${p.y - 6 * K}`} fill={ownerColor ?? '#ccc'} stroke="rgba(0,0,0,0.5)" strokeWidth={1.2} />
                  </g>
                )}
                {canCity && (
                  <circle cx={p.x} cy={p.y - 16 * K} r={2.5 * K} fill="#EEAC2F" stroke="#0B1622" strokeWidth={0.5} />
                )}
              </g>
            );
          })}
        </svg>
      </Paper>

      {/* نوار اقدامات */}
      {canAct && !needDiscard && phase !== 'finished' && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', alignItems: 'center' }}>
          {canRoll && (
            <Button variant="contained" color="primary" size="medium" startIcon={<Dices size={18} />} onClick={() => send({ kind: 'roll' })} sx={{ borderRadius: 3, fontWeight: 800, px: 3 }}>
              ریختن تاس
            </Button>
          )}
          {!inSetup && !canRoll && (
            <>
              <Button
                size="small"
                variant={mode === 'road' ? 'contained' : 'outlined'}
                color="primary"
                onClick={() => setBuildMode(mode === 'road' ? null : 'road')}
                disabled={roadMoves.length === 0}
                sx={{ borderRadius: 3, fontWeight: 700 }}
              >
                جاده
              </Button>
              <Button
                size="small"
                variant={mode === 'settlement' ? 'contained' : 'outlined'}
                color="primary"
                onClick={() => setBuildMode(mode === 'settlement' ? null : 'settlement')}
                disabled={settlementMoves.length === 0}
                sx={{ borderRadius: 3, fontWeight: 700 }}
              >
                آبادی
              </Button>
              <Button
                size="small"
                variant={mode === 'city' ? 'contained' : 'outlined'}
                color="primary"
                onClick={() => setBuildMode(mode === 'city' ? null : 'city')}
                disabled={cityMoves.length === 0}
                sx={{ borderRadius: 3, fontWeight: 700 }}
              >
                شهر
              </Button>
              {canBuyDev && (
                <Button size="small" variant="outlined" color="primary" onClick={() => send({ kind: 'buyDevCard' })} sx={{ borderRadius: 3, fontWeight: 700 }}>
                  خرید کارت توسعه 🃏
                </Button>
              )}
            </>
          )}
          {canEndTurn && (
            <Button variant="outlined" size="small" color="secondary" onClick={() => send({ kind: 'endTurn' })} sx={{ borderRadius: 3, fontWeight: 800 }}>
              پایان نوبت
            </Button>
          )}
        </Box>
      )}

      {/* منابع من + معاملات + کارت‌ها */}
      {canAct && phase === 'playing' && !canRoll && (
        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', maxWidth: 680, mx: 'auto', width: '100%' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mb: 1.5 }}>
            {RESOURCES.map((r) => (
              <Chip key={r} label={`${RES_EMOJI[r]} ${RES_LABEL[r]} ${myResources[r] ?? 0}`} size="small" variant="outlined" sx={{ borderRadius: 8, borderColor: 'divider', fontWeight: 700 }} />
            ))}
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center', alignItems: 'center' }}>
            {/* معامله با بانک */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label="بانک" size="small" sx={{ borderRadius: 8, bgcolor: 'rgba(238,172,47,0.15)', color: 'primary.light', fontWeight: 800 }} />
              <select
                value={bankGive}
                onChange={(e) => setBankGive(e.target.value as ResourceKind)}
                style={{ background: 'rgba(0,0,0,0.3)', color: '#F5EFE4', borderRadius: 8, padding: '4px 8px', border: '1px solid #2A3F57', fontSize: 13 }}
              >
                {RESOURCES.map((r) => (
                  <option key={r} value={r}>{RES_LABEL[r]}</option>
                ))}
              </select>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: 'text.secondary' }}>{bankRate} : 1</Typography>
              <select
                value={bankWant}
                onChange={(e) => setBankWant(e.target.value as ResourceKind)}
                style={{ background: 'rgba(0,0,0,0.3)', color: '#F5EFE4', borderRadius: 8, padding: '4px 8px', border: '1px solid #2A3F57', fontSize: 13 }}
              >
                {RESOURCES.filter((r) => r !== bankGive).map((r) => (
                  <option key={r} value={r}>{RES_LABEL[r]}</option>
                ))}
              </select>
              <Button size="small" variant="outlined" color="primary" onClick={doTradeBank} sx={{ borderRadius: 8, fontWeight: 700 }}>
                معامله
              </Button>
            </Box>

            {/* معامله بازیکن-به-بازیکن */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip label="بازیکن" size="small" sx={{ borderRadius: 8, bgcolor: 'rgba(76,175,125,0.15)', color: 'success.main', fontWeight: 800 }} />
              <select
                value={p2pGive}
                onChange={(e) => setP2pGive(e.target.value as ResourceKind)}
                style={{ background: 'rgba(0,0,0,0.3)', color: '#F5EFE4', borderRadius: 8, padding: '4px 8px', border: '1px solid #2A3F57', fontSize: 13 }}
              >
                {RESOURCES.map((r) => (
                  <option key={r} value={r}>{RES_LABEL[r]}</option>
                ))}
              </select>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: 'text.secondary' }}>⇄</Typography>
              <select
                value={p2pWant}
                onChange={(e) => setP2pWant(e.target.value as ResourceKind)}
                style={{ background: 'rgba(0,0,0,0.3)', color: '#F5EFE4', borderRadius: 8, padding: '4px 8px', border: '1px solid #2A3F57', fontSize: 13 }}
              >
                {RESOURCES.filter((r) => r !== p2pGive).map((r) => (
                  <option key={r} value={r}>{RES_LABEL[r]}</option>
                ))}
              </select>
              <Button size="small" variant="outlined" color="success" onClick={doTradeP2P} sx={{ borderRadius: 8, fontWeight: 700 }}>
                پیشنهاد
              </Button>
            </Box>
          </Box>

        </Paper>
      )}

      {/* پیشنهادهای معاملهٔ بازیکنان — هر بازیکنی میتواند بپذیرد */}
      {(incomingOffers.length > 0 || myOffers.length > 0) && (
        <Paper elevation={0} sx={{ p: 1.5, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', maxWidth: 520, mx: 'auto', width: '100%' }}>
          {incomingOffers.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'success.main' }}>
                پیشنهاد معامله:
              </Typography>
              {incomingOffers.map((o: { id: string; from: string; give: Record<string, number>; want: Record<string, number> }) => (
                <Chip
                  key={o.id}
                  label={`${RES_LABEL[Object.keys(o.give)[0]]} ⇄ ${RES_LABEL[Object.keys(o.want)[0]]}`}
                  onDelete={() => send({ kind: 'acceptTrade', offerId: o.id })}
                  deleteIcon={<Typography sx={{ fontSize: '0.75rem', fontWeight: 800, pr: 1 }}>پذیرش</Typography>}
                  variant="outlined"
                  color="success"
                  sx={{ borderRadius: 8, fontWeight: 700 }}
                />
              ))}
            </Box>
          )}
          {myOffers.length > 0 && (
            <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 0.5, color: 'text.secondary' }}>
              پیشنهاد شما در انتظار پذیرش است…
            </Typography>
          )}
        </Paper>
      )}

      {/* منابع من + معاملات + کارت‌ها */}
      {canAct && phase === 'playing' && !canRoll && (
        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', maxWidth: 680, mx: 'auto', width: '100%' }}>

          {/* کارت‌های توسعه */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mt: 1.5, alignItems: 'center' }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary' }}>
              کارت‌های من:
            </Typography>
            {(myPrivate?.devCards ?? []).length === 0 && (
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>کارتی ندارید</Typography>
            )}
            {(myPrivate?.devCards ?? []).map((c) => {
              const playable = c.type !== 'victory' && (c.boughtTurn ?? 0) < (state.turnNumber ?? 1) && !state.hasPlayedDevCardThisTurn;
              const isTarget = playTarget === c.id;
              return (
                <Chip
                  key={c.id}
                  label={DEV_LABEL[c.type] ?? c.type}
                  onClick={() => (playable ? setPlayTarget(isTarget ? null : c.id) : undefined)}
                  onDelete={playable && !isTarget ? () => doPlayCard(c.id, c.type) : undefined}
                  deleteIcon={playable && !isTarget ? <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, pr: 1 }}>بازی</Typography> : undefined}
                  variant={isTarget ? 'filled' : 'outlined'}
                  color={isTarget ? 'primary' : 'default'}
                  sx={{ borderRadius: 8, fontWeight: 700, ...(playable ? { cursor: 'pointer' } : { opacity: 0.65 }) }}
                />
              );
            })}
            {playTarget && (() => {
              const card = (myPrivate?.devCards ?? []).find((c) => c.id === playTarget);
              if (!card) return null;
              if (card.type === 'monopoly') {
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <select value={monopolyRes} onChange={(e) => setMonopolyRes(e.target.value as ResourceKind)} style={{ background: 'rgba(0,0,0,0.3)', color: '#F5EFE4', borderRadius: 8, padding: '4px 8px', border: '1px solid #2A3F57', fontSize: 13 }}>
                      {RESOURCES.map((r) => (
                        <option key={r} value={r}>{RES_LABEL[r]}</option>
                      ))}
                    </select>
                    <Button size="small" variant="contained" color="primary" onClick={() => { doPlayCard(card.id, card.type); setPlayTarget(null); }} sx={{ borderRadius: 8, fontWeight: 800 }}>
                      بازی انحصار
                    </Button>
                  </Box>
                );
              }
              if (card.type === 'yearOfPlenty') {
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <select value={yopA} onChange={(e) => setYopA(e.target.value as ResourceKind)} style={{ background: 'rgba(0,0,0,0.3)', color: '#F5EFE4', borderRadius: 8, padding: '4px 8px', border: '1px solid #2A3F57', fontSize: 13 }}>
                      {RESOURCES.map((r) => (
                        <option key={r} value={r}>{RES_LABEL[r]}</option>
                      ))}
                    </select>
                    <select value={yopB} onChange={(e) => setYopB(e.target.value as ResourceKind)} style={{ background: 'rgba(0,0,0,0.3)', color: '#F5EFE4', borderRadius: 8, padding: '4px 8px', border: '1px solid #2A3F57', fontSize: 13 }}>
                      {RESOURCES.map((r) => (
                        <option key={r} value={r}>{RES_LABEL[r]}</option>
                      ))}
                    </select>
                    <Button size="small" variant="contained" color="primary" onClick={() => { doPlayCard(card.id, card.type); setPlayTarget(null); }} sx={{ borderRadius: 8, fontWeight: 800 }}>
                      بازی سال فراوانی
                    </Button>
                  </Box>
                );
              }
              return (
                <Button size="small" variant="contained" color="primary" onClick={() => { doPlayCard(card.id, card.type); setPlayTarget(null); }} sx={{ borderRadius: 8, fontWeight: 800 }}>
                  بازی {DEV_LABEL[card.type]}
                </Button>
              );
            })()}
          </Box>
        </Paper>
      )}

      {/* دور ریختن */}
      {needDiscard && (
        <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', maxWidth: 520, mx: 'auto', width: '100%', textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 900, color: 'error.main', mb: 1 }}>
            دور ریختن {needToDiscard} منبع
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mb: 2 }}>
            {RESOURCES.map((r) => (
              <Box key={r} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Chip label={`${RES_EMOJI[r]} ${RES_LABEL[r]}: ${discardSel[r] ?? 0}`} size="small" variant="outlined" sx={{ borderRadius: 8, fontWeight: 700 }} />
                <IconButton size="small" onClick={() => setDiscardSel({ ...discardSel, [r]: Math.max(0, (discardSel[r] ?? 0) - 1) })} aria-label={`کم کردن ${RES_LABEL[r]}`}>
                  <Minus size={14} />
                </IconButton>
                <IconButton size="small" onClick={() => { const have = myResources[r] ?? 0; setDiscardSel({ ...discardSel, [r]: Math.min(have, (discardSel[r] ?? 0) + 1) }); }} aria-label={`زیاد کردن ${RES_LABEL[r]}`}>
                  <Plus size={14} />
                </IconButton>
              </Box>
            ))}
          </Box>
          <Button
            variant="contained"
            color="error"
            disabled={discardTotal !== needToDiscard}
            onClick={() => {
              send({ kind: 'discard', discard: { wood: discardSel.wood ?? 0, brick: discardSel.brick ?? 0, sheep: discardSel.sheep ?? 0, wheat: discardSel.wheat ?? 0, ore: discardSel.ore ?? 0 } });
              setDiscardSel({});
            }}
            sx={{ borderRadius: 3, fontWeight: 800, px: 4 }}
          >
            {discardTotal === needToDiscard ? 'تأیید دور ریختن' : `انتخاب ${needToDiscard - discardTotal} منبع دیگر`}
          </Button>
        </Paper>
      )}

      {/* دزدی */}
      {iAmThief && (state.stealCandidates ?? []).length > 0 && (
        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', maxWidth: 520, mx: 'auto', width: '100%', textAlign: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.light', mb: 1 }}>
            از کدام بازیکن می‌دزدید؟
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
            {(state.stealCandidates ?? []).map((pid: string) => (
              <Button key={pid} size="small" variant="outlined" color="primary" onClick={() => send({ kind: 'steal', targetId: pid })} sx={{ borderRadius: 8, fontWeight: 800 }}>
                {state.players?.find((p: { id: string }) => p.id === pid)?.name ?? pid}
              </Button>
            ))}
          </Box>
        </Paper>
      )}

      {/* پایان بازی */}
      {phase === 'finished' && (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Chip icon={<Flag size={15} />} label="بازی تمام شد" color="success" sx={{ borderRadius: 10, fontWeight: 900 }} />
        </Box>
      )}
    </Box>
  );
}
