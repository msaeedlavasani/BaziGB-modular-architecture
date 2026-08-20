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
  serialize,
  canOfferDouble,
  offerDouble,
  respondDouble,
  getGameMultiplier,
  CUBE_VALUES
} from './rules';

export { getBestMoveSequence } from './ai';

export type { 
  BackgammonBoard, 
  BackgammonMove, 
  BackgammonState 
} from './types';
