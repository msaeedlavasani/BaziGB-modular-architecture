export { 
  Backgammon, 
  createState, 
  getLegalMoves, 
  getLegalDestinations, 
  canBearOff, 
  getMoveHints, 
  applyMove, 
  applyChain, 
  isFinished, 
  getWinner, 
  rollDiceFor, 
  serialize 
} from './rules';

export { getBestMoveSequence } from './ai';

export type { 
  BackgammonBoard, 
  BackgammonMove, 
  BackgammonState 
} from './types';
