import { Board, Move, PlayerIdx } from '../board.ts';
import { MctsNode } from '../utils/mcts.ts';
import { Player } from './player.ts';

export class MontyPlayer extends Player {
  override name: string;
  private iterations: number;

  constructor(playerNumber: number, param?: number) {
    param ||= 500;
    super(playerNumber, param);
    this.name = 'monty' + param;
    this.iterations = param;
  }

  override getMove(board: Board): Move {
    const legalMoves = board.getLegalMoves();
    if (legalMoves.length === 0) throw new Error('No legal moves available');

    // If a capture is immediately available, take the best one instead of searching.
    const capture = pickCapture(legalMoves, board);
    if (capture) return capture;

    const rootPlayer = this.playerNumber as PlayerIdx;
    const root = new MctsNode(board, board.currentPlayer, rootPlayer, chooseHeuristicMove);

    for (let i = 0; i < this.iterations; i++) {
      const node = root.select();
      node.simulate();
    }

    let maxVisits = -1;
    let bestIdx = 0;

    for (const [i, child] of root.children.entries()) {
      if (!child) continue;
      if (child.visits > maxVisits) {
        maxVisits = child.visits;
        bestIdx = i;
      }
    }

    return root.moves[bestIdx];
  }
}

type MoveStats = {
  move: Move;
  completed: number;
  newThrees: number;
  newTwos: number;
  gift?: number;
};

function pickCapture(moves: Move[], board: Board): Move | undefined {
  const stats = moves.map(move => ({ move, ...measureMove(board, move) }));
  const captures = stats.filter(s => s.completed > 0);
  if (!captures.length) return undefined;

  const maxCaptured = Math.max(...captures.map(s => s.completed));
  const bestCaptured = captures.filter(s => s.completed === maxCaptured);

  const minThrees = Math.min(...bestCaptured.map(s => s.newThrees));
  const bestThrees = bestCaptured.filter(s => s.newThrees === minThrees);

  const minTwos = Math.min(...bestThrees.map(s => s.newTwos));
  const best = bestThrees.filter(s => s.newTwos === minTwos);

  return pick(best);
}

function chooseHeuristicMove(board: Board): Move {
  const moves = board.getLegalMoves();
  if (moves.length === 0) throw new Error('No legal moves available during rollout');

  const stats = moves.map(move => ({ move, ...measureMove(board, move) }));

  const capturing = stats.filter(s => s.completed > 0);
  if (capturing.length) {
    const maxCaptured = Math.max(...capturing.map(s => s.completed));
    const best = capturing.filter(s => s.completed === maxCaptured);
    return pick(best);
  }

  const safe = stats.filter(s => s.newThrees === 0);
  if (safe.length) {
    const minTwos = Math.min(...safe.map(s => s.newTwos));
    const best = safe.filter(s => s.newTwos === minTwos);
    return pick(best);
  }

  const minThrees = Math.min(...stats.map(s => s.newThrees));
  const risky = stats.filter(s => s.newThrees === minThrees);
  const withGift = risky.map(s => ({ ...s, gift: giftForOpponent(board, s.move) }));
  const minGift = Math.min(...withGift.map(s => s.gift ?? 0));
  const bestGift = withGift.filter(s => (s.gift ?? 0) === minGift);
  const minTwos = Math.min(...bestGift.map(s => s.newTwos));
  const best = bestGift.filter(s => s.newTwos === minTwos);
  return pick(best);
}

function measureMove(board: Board, move: Move): Omit<MoveStats, 'move'> {
  let completed = 0;
  let newThrees = 0;
  let newTwos = 0;

  for (const { r, c } of touchedBoxes(board, move)) {
    if (board.boxOwner[r][c] !== 0) continue;
    const before = boxSides(board, r, c);
    const after = before + 1;
    if (after === 4) completed += 1;
    else if (after === 3) newThrees += 1;
    else if (after === 2) newTwos += 1;
  }

  return { completed, newThrees, newTwos };
}

function touchedBoxes(board: Board, move: Move): { r: number; c: number }[] {
  const boxes = [];
  if (move.o === 'H') {
    if (move.r > 0) boxes.push({ r: move.r - 1, c: move.c });
    if (move.r < board.rows) boxes.push({ r: move.r, c: move.c });
  } else {
    if (move.c > 0) boxes.push({ r: move.r, c: move.c - 1 });
    if (move.c < board.cols) boxes.push({ r: move.r, c: move.c });
  }
  return boxes;
}

function boxSides(board: Board, r: number, c: number): number {
  let count = 0;
  if (board.horizontalLines[r][c]) count += 1;
  if (board.horizontalLines[r + 1][c]) count += 1;
  if (board.verticalLines[r][c]) count += 1;
  if (board.verticalLines[r][c + 1]) count += 1;
  return count;
}

function giftForOpponent(board: Board, move: Move): number {
  const sim = board.clone();
  sim.move(move);

  const taker = sim.currentPlayer as PlayerIdx;
  let captured = 0;

  while (true) {
    const moves = sim.getLegalMoves();
    let took = false;

    for (const candidate of moves) {
      let completes = false;
      for (const { r, c } of touchedBoxes(sim, candidate)) {
        if (sim.boxOwner[r][c] === 0 && boxSides(sim, r, c) === 3) {
          completes = true;
          break;
        }
      }

      if (!completes) continue;

      const before = sim.score[taker];
      sim.move(candidate);
      captured += sim.score[taker] - before;
      took = true;
      break;
    }

    if (!took) break;
  }

  return captured;
}

function pick(options: MoveStats[]): Move {
  return options[Math.floor(Math.random() * options.length)].move;
}
