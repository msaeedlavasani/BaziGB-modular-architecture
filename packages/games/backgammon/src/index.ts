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
  checkerInventory,
  canUndoMove,
  getRequiredMoveChains,
  isValidTurnDraft,
  getValidNextTurnMoves,
  applyTurnDraft,
  canCommitTurn,
  commitTurn,
  serialize,
  canOfferDouble,
  offerDouble,
  respondDouble,
  getGameMultiplier,
  startNextGame,
  CUBE_VALUES
} from './rules';

export { getBestMoveSequence } from './ai';
export { BACKGAMMON_RULES_PROFILE } from './settings';
export type { BackgammonPlayMode, BackgammonTargetScore } from './settings';

export type { 
  BackgammonBoard, 
  BackgammonMove, 
  BackgammonState 
} from './types';
