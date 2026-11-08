import { describe, expect, test } from 'bun:test';
import {
  chooseExpertMove,
  createLudoGame,
  getLegalTokenIndices,
  moveLudoToken,
  rollLudoDie,
  type LudoState,
} from '../src/games/ludoEngine';

function stateForMove(tokens: number[][], roll: number, turn = 0): LudoState {
  return {
    ...createLudoGame('pass-and-play'),
    tokens,
    turn,
    phase: 'move',
    dieValue: roll,
  };
}

describe('Ludo rules', () => {
  test('a six is required to leave the yard', () => {
    const start = createLudoGame('pass-and-play');
    expect(rollLudoDie(start, 5).turn).toBe(1);
    const six = rollLudoDie(start, 6);
    expect(six.phase).toBe('move');
    expect(getLegalTokenIndices(six)).toEqual([0, 1, 2, 3]);
    expect(moveLudoToken(six, 0).state.tokens[0][0]).toBe(0);
  });

  test('a third consecutive six forfeits that roll and passes the turn', () => {
    const state = { ...createLudoGame('pass-and-play'), consecutiveSixes: 2 };
    const next = rollLudoDie(state, 6);
    expect(next.turn).toBe(1);
    expect(next.lastRoll).toBe(6);
    expect(next.tokens[0]).toEqual([-1, -1, -1, -1]);
    expect(next.consecutiveSixes).toBe(0);
  });

  test('captures an opponent on an unsafe square and grants another roll', () => {
    const tokens = [[0, -1, -1, -1], [-1, -1, -1, -1], [15, -1, -1, -1], [-1, -1, -1, -1]];
    const result = moveLudoToken(stateForMove(tokens, 2), 0);
    expect(result.captured).toBe(1);
    expect(result.state.tokens[2][0]).toBe(-1);
    expect(result.state.turn).toBe(0);
    expect(result.extraTurn).toBe(true);
  });

  test('safe squares protect opponents from captures', () => {
    const tokens = [[7, -1, -1, -1], [-1, -1, -1, -1], [21, -1, -1, -1], [-1, -1, -1, -1]];
    const result = moveLudoToken(stateForMove(tokens, 1), 0);
    expect(result.captured).toBe(0);
    expect(result.state.tokens[2][0]).toBe(21);
  });

  test('requires an exact roll to finish and declares the winner', () => {
    const cannotOvershoot = stateForMove([[56, -1, -1, -1], [-1, -1, -1, -1], [-1, -1, -1, -1], [-1, -1, -1, -1]], 2);
    expect(getLegalTokenIndices(cannotOvershoot)).toEqual([]);
    const oneToGo = stateForMove([[56, 57, 57, 57], [-1, -1, -1, -1], [-1, -1, -1, -1], [-1, -1, -1, -1]], 1);
    const result = moveLudoToken(oneToGo, 0);
    expect(result.state.phase).toBe('finished');
    expect(result.state.winner).toBe(0);
    expect(result.state.tokens[0]).toEqual([57, 57, 57, 57]);
  });

  test('the AI chooses a capture over an ordinary advance', () => {
    const tokens = [[0, 10, -1, -1], [-1, -1, -1, -1], [15, -1, -1, -1], [-1, -1, -1, -1]];
    const state = stateForMove(tokens, 2);
    expect(chooseExpertMove(state, () => 0)).toBe(0);
  });
});