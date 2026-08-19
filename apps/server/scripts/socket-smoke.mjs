/**
 * Smoke test — جریان چندنفره Socket.IO (تست دستی/CI)
 * دو کلاینت به یک اتاق وصل میشوند، بازی دوز شروع و تا پایان (gameOver) پیش میرود.
 * اجرا: node apps/server/scripts/socket-smoke.mjs  (سرور باید روی پورت پیشفرض باشد)
 */
import { io } from 'socket.io-client';

const URL = process.env.SERVER_URL ?? 'http://localhost:3097';
const room = 'SMK' + Date.now().toString(36).toUpperCase().slice(-4);
const s1 = io(URL, { transports: ['websocket'] });
const s2 = io(URL, { transports: ['websocket'] });

const plans = { s1: [0, 1, 2], s2: [3, 4] };
let started = false;
let done = false;

function tryMove(socket, plan, st) {
  if (!st || st.phase !== 'playing' || st.turn !== socket.id) return;
  const move = plan.shift();
  if (move === undefined) return;
  console.log(`  [${socket.id.slice(0, 4)}] move → ${move}`);
  socket.emit('makeMove', { roomCode: room, move: { player: socket.id, kind: 'place', to: move } });
}

s1.on('connect', () => {
  console.log('s1 connected:', s1.id);
  s1.emit('joinRoom', { roomCode: room, gameType: 'tic-tac-toe', maxRounds: 1 });
});
s2.on('connect', () => {
  console.log('s2 connected:', s2.id);
  setTimeout(() => s2.emit('joinRoom', { roomCode: room }), 200);
});

s2.on('roomUpdate', (r) => {
  console.log('roomUpdate players =', r.players.length, 'status =', r.status);
  if (r.players.length >= 2 && !started) {
    started = true;
    console.log('هر دو نشستهاند — شروع بازی');
    s1.emit('startGame', { roomCode: room });
  }
});

const onState = (socket, plan) => (st) => {
  console.log(`  state: turn=${String(st.turn).slice(0, 4)} phase=${st.phase}`);
  tryMove(socket, plan, st);
};
s1.on('gameState', onState(s1, plans.s1));
s2.on('gameState', onState(s2, plans.s2));

s1.on('matchScore', (d) => console.log('matchScore:', JSON.stringify(d.scores)));
s1.on('gameOver', (d) => {
  console.log('✅ GAME OVER — winner =', d.winner, 'scores =', JSON.stringify(d.scores));
  done = true;
  s1.close();
  s2.close();
  process.exit(0);
});
s1.on('error', (e) => console.log('s1 error:', e.message));
s2.on('error', (e) => console.log('s2 error:', e.message));

setTimeout(() => {
  if (!done) {
    console.log('❌ TIMEOUT — جریان کامل نشد');
    process.exit(1);
  }
}, 15000);
