import { z } from 'zod';

export const joinRoomSchema = z.union([
  z.string(),
  z.object({
    roomCode: z.string(),
    gameType: z.string().optional(),
    maxRounds: z.number().optional(),
    token: z.string().optional(),
    seatKey: z.string().optional(),
  }),
]);

export const makeMoveSchema = z.object({
  room: z.string(),
  moveName: z.string(),
  args: z.array(z.unknown()),
});

export const gameActionSchema = z.object({
  room: z.string(),
  moveName: z.string(),
  args: z.array(z.unknown()),
  endTurn: z.boolean().optional(),
});

export const rollDiceSchema = z.object({
  room: z.string(),
  count: z.number().optional(),
});

export const chatSchema = z.object({
  room: z.string(),
  message: z.string().max(500),
});

export const undoSchema = z.object({
  room: z.string(),
});

export const nextRoundSchema = z.object({
  room: z.string(),
});

export const doubleSchema = z.object({
  room: z.string(),
});

export const doubleResponseSchema = z.object({
  room: z.string(),
  accept: z.boolean(),
});
