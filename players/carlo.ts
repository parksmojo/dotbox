import { Board, Move, PlayerIdx } from '../board.ts';
import { MctsNode } from '../utils/mcts.ts';
import { Player } from './player.ts';

export class CarloPlayer extends Player {
  override name: string;
  private iterations: number;

  constructor(playerNumber: number, param?: number) {
    param ||= 500;
    super(playerNumber, param);
    this.name = 'carlo' + param;
    this.iterations = param;
  }

  override getMove(board: Board): Move {
    const legalMoves = board.getLegalMoves();
    if (legalMoves.length === 0) throw new Error('No legal moves available');

    const rootPlayer = this.playerNumber as PlayerIdx;

    const root = new MctsNode(board, board.currentPlayer, rootPlayer, chooseRandomMove);

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

function chooseRandomMove(board: Board): Move {
  const moves = board.getLegalMoves();
  return moves[Math.floor(Math.random() * moves.length)];
}
