export const PLAYER_COLORS = ['red', 'yellow', 'green', 'blue'] as const;
export type PlayerColor = (typeof PLAYER_COLORS)[number];
export type GameMode = 'ai' | 'pass-and-play';
export type GamePhase = 'roll' | 'move' | 'finished';

export interface LudoPlayer {
  color: PlayerColor;
  isAI: boolean;
}

export interface LudoState {
  mode: GameMode;
  players: LudoPlayer[];
  tokens: number[][];
  turn: number;
  phase: GamePhase;
  dieValue: number | null;
  lastRoll: number | null;
  consecutiveSixes: number;
  winner: number | null;
  notice: string;
}

export interface MoveResult {
  state: LudoState;
  captured: number;
  finished: boolean;
  extraTurn: boolean;
}

export const TRACK_LENGTH = 52;
export const FINISH_PROGRESS = 57;
const COLOR_START: Record<PlayerColor, number> = { red: 0, yellow: 13, green: 26, blue: 39 };
const SAFE_TRACK_POSITIONS = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

export const TRACK_COORDINATES: Array<[number, number]> = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [5, 6], [4, 6], [3, 6], [2, 6], [1, 6],
  [0, 6], [0, 7], [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [6, 9], [6, 10],
  [6, 11], [6, 12], [6, 13], [6, 14], [7, 14], [8, 14], [8, 13], [8, 12], [8, 11], [8, 10],
  [8, 9], [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8], [14, 7], [14, 6], [13, 6],
  [12, 6], [11, 6], [10, 6], [9, 6], [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0], [7, 0], [6, 0],
];

export const HOME_LANES: Record<PlayerColor, Array<[number, number]>> = {
  red: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  yellow: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
  green: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
  blue: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
};

export function createLudoGame(mode: GameMode): LudoState {
  return {
    mode,
    players: PLAYER_COLORS.map((color, index) => ({ color, isAI: mode === 'ai' && index > 0 })),
    tokens: PLAYER_COLORS.map(() => [-1, -1, -1, -1]),
    turn: 0,
    phase: 'roll',
    dieValue: null,
    lastRoll: null,
    consecutiveSixes: 0,
    winner: null,
    notice: '',
  };
}

export function isSafeTrackPosition(position: number): boolean {
  return SAFE_TRACK_POSITIONS.has((position + TRACK_LENGTH) % TRACK_LENGTH);
}

export function absoluteTrackPosition(color: PlayerColor, progress: number): number {
  return (COLOR_START[color] + progress) % TRACK_LENGTH;
}

export function getLegalTokenIndices(state: LudoState): number[] {
  if (state.phase !== 'move' || state.dieValue === null || state.winner !== null) return [];
  const positions = state.tokens[state.turn];
  if (!positions) return [];
  return positions.flatMap((progress, index) => {
    if (progress === FINISH_PROGRESS) return [];
    if (progress === -1) return state.dieValue === 6 ? [index] : [];
    return progress + state.dieValue <= FINISH_PROGRESS ? [index] : [];
  });
}

export function rollLudoDie(state: LudoState, value = Math.floor(Math.random() * 6) + 1): LudoState {
  if (state.phase !== 'roll' || state.winner !== null || value < 1 || value > 6) return state;

  if (value === 6 && state.consecutiveSixes === 2) {
    const nextTurn = (state.turn + 1) % state.players.length;
    return {
      ...state,
      turn: nextTurn,
      phase: 'roll',
      dieValue: null,
      lastRoll: value,
      consecutiveSixes: 0,
      notice: 'Three sixes in a row — the third roll is forfeited.',
    };
  }

  const sixes = value === 6 ? state.consecutiveSixes + 1 : 0;
  const rolled: LudoState = {
    ...state,
    phase: 'move',
    dieValue: value,
    lastRoll: value,
    consecutiveSixes: sixes,
    notice: value === 6 ? 'Six! Choose a token, then roll again.' : 'Choose a token to move.',
  };

  if (getLegalTokenIndices(rolled).length > 0) return rolled;

  if (value === 6) {
    return { ...rolled, phase: 'roll', dieValue: null, notice: 'No legal move. Roll again for the six.' };
  }

  return {
    ...rolled,
    turn: (state.turn + 1) % state.players.length,
    phase: 'roll',
    dieValue: null,
    consecutiveSixes: 0,
    notice: 'No legal move. Turn passes to the next player.',
  };
}

export function moveLudoToken(state: LudoState, tokenIndex: number): MoveResult {
  if (!getLegalTokenIndices(state).includes(tokenIndex) || state.dieValue === null) {
    return { state, captured: 0, finished: false, extraTurn: false };
  }

  const player = state.players[state.turn];
  const previous = state.tokens[state.turn][tokenIndex];
  const destination = previous === -1 ? 0 : previous + state.dieValue;
  const tokens = state.tokens.map((positions) => [...positions]);
  tokens[state.turn][tokenIndex] = destination;

  let captured = 0;
  if (destination <= TRACK_LENGTH - 1) {
    const target = absoluteTrackPosition(player.color, destination);
    if (!isSafeTrackPosition(target)) {
      tokens.forEach((positions, playerIndex) => {
        if (playerIndex === state.turn) return;
        positions.forEach((progress, opposingToken) => {
          if (progress >= 0 && progress < TRACK_LENGTH && absoluteTrackPosition(state.players[playerIndex].color, progress) === target) {
            tokens[playerIndex][opposingToken] = -1;
            captured += 1;
          }
        });
      });
    }
  }

  const finished = destination === FINISH_PROGRESS;
  const won = tokens[state.turn].every((progress) => progress === FINISH_PROGRESS);
  const extraTurn = state.dieValue === 6 || captured > 0 || finished;
  const nextTurn = extraTurn ? state.turn : (state.turn + 1) % state.players.length;
  const reason = won
    ? `${player.color[0].toUpperCase()}${player.color.slice(1)} wins!`
    : finished
      ? 'Token home! Roll again.'
      : captured > 0
        ? `${captured} token${captured === 1 ? '' : 's'} captured. Roll again.`
        : state.dieValue === 6
          ? 'Six! Roll again.'
          : 'Token moved.';

  const nextState: LudoState = {
    ...state,
    tokens,
    turn: nextTurn,
    phase: won ? 'finished' : 'roll',
    dieValue: null,
    consecutiveSixes: nextTurn === state.turn ? state.consecutiveSixes : 0,
    winner: won ? state.turn : null,
    notice: reason,
  };
  return { state: nextState, captured, finished, extraTurn };
}

function countThreats(state: LudoState, playerIndex: number, target: number): number {
  if (isSafeTrackPosition(target)) return 0;
  let threats = 0;
  state.tokens.forEach((positions, opponentIndex) => {
    if (opponentIndex === playerIndex) return;
    const opponent = state.players[opponentIndex];
    positions.forEach((progress) => {
      if (progress >= 0 && progress < TRACK_LENGTH) {
        const current = absoluteTrackPosition(opponent.color, progress);
        const distance = (target - current + TRACK_LENGTH) % TRACK_LENGTH;
        if (distance >= 1 && distance <= 6) threats += 1;
      } else if (progress === -1 && target === COLOR_START[opponent.color]) {
        threats += 1;
      }
    });
  });
  return threats;
}

function scoreMove(state: LudoState, tokenIndex: number): number {
  const progress = state.tokens[state.turn][tokenIndex];
  const roll = state.dieValue ?? 0;
  const destination = progress === -1 ? 0 : progress + roll;
  const player = state.players[state.turn];
  if (destination === FINISH_PROGRESS) return 1500;

  let score = destination * 0.75;
  if (progress === -1) {
    const tokensOnBoard = state.tokens[state.turn].filter((token) => token >= 0 && token < FINISH_PROGRESS).length;
    score += tokensOnBoard === 0 ? 55 : 28;
  }
  if (destination >= TRACK_LENGTH && progress < TRACK_LENGTH) score += 48;
  if (destination >= 46 && destination < TRACK_LENGTH) score += 12;

  if (destination < TRACK_LENGTH) {
    const target = absoluteTrackPosition(player.color, destination);
    const safe = isSafeTrackPosition(target);
    if (safe) score += 30;

    if (!safe) {
      state.tokens.forEach((opposingTokens, opponentIndex) => {
        if (opponentIndex === state.turn) return;
        opposingTokens.forEach((opponentProgress) => {
          if (opponentProgress >= 0 && opponentProgress < TRACK_LENGTH && absoluteTrackPosition(state.players[opponentIndex].color, opponentProgress) === target) {
            score += 105 + opponentProgress * 0.35;
          }
        });
      });
      score -= countThreats(state, state.turn, target) * 23;
    }
  }

  if (progress >= 0 && progress < TRACK_LENGTH) {
    const currentTarget = absoluteTrackPosition(player.color, progress);
    const wasThreatened = countThreats(state, state.turn, currentTarget) > 0;
    if (wasThreatened) score += 20;
  }
  if (destination > progress && progress >= 0) score += Math.min(roll, 6) * 0.4;
  return score;
}

/** Evaluates all legal plays and uses restrained tie-breaking for a less mechanical opponent. */
export function chooseExpertMove(state: LudoState, random: () => number = Math.random): number | null {
  const legal = getLegalTokenIndices(state);
  if (legal.length === 0) return null;
  const ranked = legal.map((index) => ({ index, score: scoreMove(state, index) + random() * 3 }));
  ranked.sort((a, b) => b.score - a.score);
  return ranked[0]?.index ?? legal[0];
}